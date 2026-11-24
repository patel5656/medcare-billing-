import { apiBillingService } from './apiBillingService';
import { apiCaseService } from './apiCaseService';
import { mapBillToCms1500Claims } from '../../utils/cmsMapper';

/**
 * Helper to sort claims array by newest created timestamp / generated date first
 */
export const sortClaimsNewestFirst = (claimsArray = []) => {
  return [...claimsArray].sort((a, b) => {
    const parseTime = (item) => {
      const candidates = [
        item.createdAt, item.created_at, item.createdAtTimestamp,
        item.updatedAt, item.updated_at, item.dos, item.dosDisplay, item.box12Date
      ];
      for (const cand of candidates) {
        if (cand) {
          const t = new Date(cand).getTime();
          if (!isNaN(t) && t > 0) return t;
        }
      }
      return 0;
    };

    const timeA = parseTime(a);
    const timeB = parseTime(b);

    if (timeA !== timeB && timeA > 0 && timeB > 0) {
      return timeB - timeA; // Newest timestamp first
    }

    const idA = String(a.claimId || a.billId || '');
    const idB = String(b.claimId || b.billId || '');
    return idB.localeCompare(idA, undefined, { numeric: true, sensitivity: 'base' });
  });
};

/**
 * Build a provider config object from the real bill data returned by the backend.
 * The backend formatBill() now returns all provider JSON fields (identifiers,
 * renderingProvider, serviceFacility, billingProvider, address components).
 */
const buildProviderConfigFromBill = (bill) => ({
  id: bill.providerId || '',
  identifiers: bill.identifiers || { taxId: bill.providerTaxId || '', npi: bill.providerNpi || '', ssnOrEin: bill.providerSsnOrEin || 'EIN' },
  renderingProvider: bill.renderingProvider || {},
  serviceFacility: bill.serviceFacility || {},
  billingProvider: bill.billingProvider || {},
  defaultPlaceOfService: '11',
});

const isDummyTemplateBill = (b) => {
  if (!b) return true;
  const dummyDesc = [
    'Biostimulation',
    'Musculoskeletal Tissue Regeneration',
    'Spinal Decompression Supplies',
    'Deep Thermal Bio-Modulation'
  ];
  const lines = b.serviceLines || b.lineItems || [];
  // Skip bills with zero actual service lines
  if (!lines || lines.length === 0) return true;
  // Skip bills where every line is a dummy template line
  const allDummy = lines.every(l => dummyDesc.some(d => (l.description || '').includes(d)));
  if (allDummy) return true;
  return false;
};

/**
 * Real API Service for fetching CMS-1500 Claims mapped directly from MySQL Database records via Backend endpoints.
 */
export const apiCms1500Service = {
  /**
   * Fetch all CMS-1500 claims from backend cases and provider bills in MySQL DB
   */
  async getAllClaims() {
    // 1. Attempt 1: Try single fast endpoint /v1/billing/cms-claims
    try {
      const res = await apiBillingService.getAllCmsClaims();
      if (res && res.bills) {
        const rawClaims = res.bills
          .filter(bill => {
            if (isDummyTemplateBill(bill)) return false;

            const caseAssigned = bill.case?.assignedProviderIds;
            const patientAssigned = bill.case?.patient?.assignedProviderIds;
            let assigned = [];
            if (caseAssigned) {
              try { assigned = typeof caseAssigned === 'string' ? JSON.parse(caseAssigned) : caseAssigned; } catch (e) {}
            }
            if ((!Array.isArray(assigned) || assigned.length === 0) && patientAssigned) {
              try { assigned = typeof patientAssigned === 'string' ? JSON.parse(patientAssigned) : patientAssigned; } catch (e) {}
            }
            if (Array.isArray(assigned) && assigned.length > 0) {
              return assigned.includes(bill.providerId);
            }
            return true;
          })
          .flatMap(bill => mapBillToCms1500Claims(bill, null, buildProviderConfigFromBill(bill)));

        // Group/update claims by unique Patient Name + Provider + DOS (replaces outdated claims with newly saved charges)
        const uniqueMap = new Map();
        for (const claim of rawClaims) {
          const key = `${(claim.patientName || claim.box2 || '').trim().toLowerCase()}_${(claim.providerId || claim.providerName || '').trim().toLowerCase()}_${(claim.dosDisplay || claim.dos || '').trim()}`;
          const existing = uniqueMap.get(key);
          if (!existing) {
            uniqueMap.set(key, claim);
          } else {
            // Keep submitted/finalized claim, or update editable claim with newest saved line items
            if (existing.status === 'SUBMITTED' || existing.status === 'FINALIZED') {
              // preserve submitted claim
            } else {
              uniqueMap.set(key, claim);
            }
          }
        }
        return sortClaimsNewestFirst(Array.from(uniqueMap.values()));
      }
    } catch (e) {
      // Remote server does not have the new /v1/billing/cms-claims endpoint deployed yet
    }

    // 2. Attempt 2: Resilient Parallel Fetch (Works on current Railway deployment without 404)
    try {
      const cases = await apiCaseService.getCases();
      const targetCases = cases && cases.length > 0 ? cases : [{ id: 'case-001' }];

      const billResults = await Promise.all(
        targetCases.map(c => apiBillingService.getFourBillsByCase(c.id || c.caseId).catch(() => ({ allBills: [] })))
      );

      const rawClaims = [];
      targetCases.forEach((c, idx) => {
        const caseRes = billResults[idx];
        const assignedIds = Array.isArray(c.assignedProviderIds)
          ? c.assignedProviderIds
          : (typeof c.assignedProviderIds === 'string' ? JSON.parse(c.assignedProviderIds || '[]') : []);

        for (const bill of (caseRes?.allBills || [])) {
          if (isDummyTemplateBill(bill)) continue;

          // If the case defines assignedProviderIds, ensure this bill's provider is assigned
          if (assignedIds.length > 0 && !assignedIds.includes(bill.providerId)) {
            continue; // Skip bill for unassigned clinic
          }
          const claims = mapBillToCms1500Claims(bill, c, buildProviderConfigFromBill(bill));
          rawClaims.push(...claims);
        }
      });

      // Group/update claims by unique Patient Name + Provider + DOS
      const uniqueMap = new Map();
      for (const claim of rawClaims) {
        const key = `${(claim.patientName || claim.box2 || '').trim().toLowerCase()}_${(claim.providerId || claim.providerName || '').trim().toLowerCase()}_${(claim.dosDisplay || claim.dos || '').trim()}`;
        const existing = uniqueMap.get(key);
        if (!existing) {
          uniqueMap.set(key, claim);
        } else {
          if (existing.status === 'SUBMITTED' || existing.status === 'FINALIZED') {
            // preserve submitted claim
          } else {
            uniqueMap.set(key, claim);
          }
        }
      }

      return sortClaimsNewestFirst(Array.from(uniqueMap.values()));
    } catch (err) {
      console.error('Failed to fetch backend claims:', err);
      return [];
    }
  },

  /**
   * Fetch claims for a specific provider bill ID from MySQL DB
   */
  async getClaimsByBillId(billId) {
    if (!billId) return [];
    try {
      const bill = await apiBillingService.getBillById(billId);
      if (!bill) return [];
      return mapBillToCms1500Claims(bill, null, buildProviderConfigFromBill(bill));
    } catch (err) {
      console.error(`Error retrieving bill ${billId} from backend:`, err);
      return [];
    }
  },

  /**
   * Fetch a single claim by claim ID from MySQL DB
   */
  async getClaimById(claimId) {
    if (!claimId) return null;
    try {
      const allClaims = await this.getAllClaims();
      const found = allClaims.find(c => c.claimId === claimId);
      if (found) return found;
    } catch (err) {
      console.error(`Error retrieving claim ${claimId}:`, err);
    }
    return null;
  }
};
