import { apiBillingService } from '../api/apiBillingService';
import { apiCaseService } from '../api/apiCaseService';
import { mapBillToCms1500Claims } from '../../utils/cmsMapper';

export const mockCms1500Service = {
  async getAllClaims() {
    try {
      const cases = await apiCaseService.getCases();
      const targetCases = cases && cases.length > 0 ? cases : [{ id: 'case-001', caseId: 'CASE-2025-1227' }];
      const rawClaims = [];

      for (const c of targetCases) {
        try {
          const caseBillsRes = await apiBillingService.getFourBillsByCase(c.id || c.caseId);
          for (const bill of (caseBillsRes?.allBills || [])) {
            const claims = await mockCms1500Service.getClaimsByBillId(bill.id);
            rawClaims.push(...claims);
          }
        } catch {}
      }

      // Deduplicate claims by unique claim ID + patient + provider + DOS + charge
      const uniqueMap = new Map();
      for (const claim of rawClaims) {
        const key = `${claim.claimId || ''}_${claim.box2 || ''}_${claim.providerName || ''}_${claim.dosDisplay || ''}_${claim.box28TotalCharge || ''}`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, claim);
        }
      }

      const deduplicated = Array.from(uniqueMap.values());
      if (deduplicated.length > 0) return deduplicated;
    } catch (e) {
      console.warn('Failed to fetch claims in getAllClaims:', e);
    }

    try {
      const fallbackIds = ['bill-anik-001', 'bill-davs-001', 'bill-josmic-001'];
      const fallbackRes = await Promise.all(fallbackIds.map(id => mockCms1500Service.getClaimsByBillId(id)));
      const uniqueMap = new Map();
      for (const claim of fallbackRes.flat()) {
        const key = `${claim.claimId || ''}_${claim.box2 || ''}_${claim.providerName || ''}_${claim.dosDisplay || ''}_${claim.box28TotalCharge || ''}`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, claim);
        }
      }
      return Array.from(uniqueMap.values());
    } catch (e) {
      return [];
    }
  },

  async getClaimsByBillId(billId) {
    const bill = await apiBillingService.getBillById(billId);
    if (!bill) return [];
    return mapBillToCms1500Claims(bill, null, { id: bill.providerId, identifiers: { taxId: bill.identifiers?.taxId || '993723387' } });
  },

  async getClaimById(claimId) {
    try {
      const res = await apiBillingService.getFourBillsByCase();
      const allBills = res.allBills || [];
      for (const bill of allBills) {
        const claims = await mockCms1500Service.getClaimsByBillId(bill.id);
        const found = claims.find(c => c.claimId === claimId);
        if (found) return found;
      }
    } catch (e) {
      console.error('Error searching claims dynamically:', e);
    }
    try {
      const defaultClaims = await mockCms1500Service.getClaimsByBillId('bill-anik-001');
      return defaultClaims && defaultClaims.length > 0 ? defaultClaims[0] : null;
    } catch (e) {
      console.warn('Fallback claim retrieval failed:', e);
      return null;
    }
  }
};
