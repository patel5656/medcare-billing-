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
        const rawClaims = res.bills.flatMap(bill => mapBillToCms1500Claims(bill, null, {
          id: bill.providerId,
          identifiers: { taxId: bill.identifiers?.taxId || '993723387' }
        }));
      // Deduplicate claims by unique Patient Name + Provider + DOS + Total Charge
      const uniqueMap = new Map();
      for (const claim of rawClaims) {
        const key = `${(claim.box2 || '').trim().toLowerCase()}_${(claim.providerName || '').trim().toLowerCase()}_${(claim.dosDisplay || '').trim()}_${claim.box28TotalCharge || ''}`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, claim);
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
        for (const bill of (caseRes?.allBills || [])) {
          const claims = mapBillToCms1500Claims(bill, c, {
            id: bill.providerId,
            identifiers: { taxId: bill.identifiers?.taxId || '993723387' }
          });
          rawClaims.push(...claims);
        }
      });

      // Deduplicate by Patient Name + Provider + DOS + Total Charge
      const uniqueMap = new Map();
      for (const claim of rawClaims) {
        const key = `${(claim.box2 || '').trim().toLowerCase()}_${(claim.providerName || '').trim().toLowerCase()}_${(claim.dosDisplay || '').trim()}_${claim.box28TotalCharge || ''}`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, claim);
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
      return mapBillToCms1500Claims(bill, null, {
        id: bill.providerId,
        identifiers: { taxId: bill.identifiers?.taxId || '993723387' }
      });
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
