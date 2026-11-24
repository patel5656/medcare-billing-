import { API_BASE_URL } from '../../config/api';

const API_BASE = API_BASE_URL;


export const apiBillingService = {
  async getAllCmsClaims() {
    try {
      const res = await fetch(`${API_BASE}/billing/cms-claims`);
      if (!res.ok) return null;
      return res.json();
    } catch (e) {
      return null;
    }
  },

  async getOverviewStats() {
    const res = await fetch(`${API_BASE}/billing/overview-stats`);
    if (!res.ok) throw new Error('Failed to retrieve billing overview stats.');
    return res.json();
  },

  async getFourBillsByCase(caseId) {
    if (!caseId) return { caseId: null, allBills: [] };
    const res = await fetch(`${API_BASE}/billing/cases/bills?caseId=${encodeURIComponent(caseId)}`);
    if (!res.ok) throw new Error('Failed to retrieve case bills.');
    const data = await res.json();
    if (data && Array.isArray(data.allBills)) {
      const dummyKeywords = [
        'Biostimulation',
        'Musculoskeletal Tissue Regeneration',
        'Spinal Decompression Supplies',
        'Deep Thermal Bio-Modulation'
      ];
      data.allBills = data.allBills.filter(b => {
        const lines = b.serviceLines || b.lineItems || [];
        // Eliminate bills where all lines are legacy auto-seeded dummy template lines
        if (lines.length > 0 && lines.every(l => dummyKeywords.some(kw => (l.description || '').includes(kw)))) {
          return false;
        }
        if ((b.totals?.totalCharges === 14606 || b.totals?.totalCharges === 8000 || b.totals?.totalCharges === 9706) &&
            lines.some(l => dummyKeywords.some(kw => (l.description || '').includes(kw)))) {
          return false;
        }
        return true;
      });
    }
    return data;
  },

  async getBillById(id) {
    if (!id) return null;
    const res = await fetch(`${API_BASE}/billing/bills/${encodeURIComponent(id)}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to retrieve bill ${id}`);
    return res.json();
  },

  async createBill(payload) {
    const res = await fetch(`${API_BASE}/billing/bills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to create bill');
    return res.json();
  },

  async addServiceLine(billId, payload) {
    const res = await fetch(`${API_BASE}/billing/bills/${encodeURIComponent(billId)}/service-lines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to add service line');
    return res.json();
  },

  async postPayment(billId, payload) {
    const res = await fetch(`${API_BASE}/billing/bills/${encodeURIComponent(billId)}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to post payment');
    }
    return res.json();
  },

  async postAdjustment(billId, payload) {
    const res = await fetch(`${API_BASE}/billing/bills/${encodeURIComponent(billId)}/adjustments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to post adjustment');
    return res.json();
  },

  async finaliseBill(billId) {
    const res = await fetch(`${API_BASE}/billing/bills/${encodeURIComponent(billId)}/finalise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to finalise bill');
    return res.json();
  },

  async getAgingSummary(providerId) {
    const url = providerId && providerId !== 'ALL'
      ? `${API_BASE}/billing/aging?providerId=${encodeURIComponent(providerId)}`
      : `${API_BASE}/billing/aging`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to retrieve aging summary.');
    return res.json();
  },

  async getPaymentsList() {
    const res = await fetch(`${API_BASE}/billing/transactions`);
    if (!res.ok) throw new Error('Failed to retrieve payments list.');
    return res.json();
  },

  async getPracticeReports(providerId) {
    const url = providerId && providerId !== 'ALL'
      ? `${API_BASE}/billing/reports?providerId=${encodeURIComponent(providerId)}`
      : `${API_BASE}/billing/reports`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to retrieve practice reports.');
    return res.json();
  },

  async updateBill(billId, payload) {
    const res = await fetch(`${API_BASE}/billing/bills/${encodeURIComponent(billId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to update bill charges');
    return res.json();
  },

  async deleteBill(billId) {
    const res = await fetch(`${API_BASE}/billing/bills/${encodeURIComponent(billId)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete bill statement');
    return res.json();
  },

  async getCounselingVisits(patientId, caseId) {
    if (!patientId) return { visits: [], totalRecorded: 0, completedCount: 0, billableCount: 0 };
    const q = caseId ? `?caseId=${encodeURIComponent(caseId)}` : '';
    const res = await fetch(`${API_BASE}/billing/counseling-visits/${encodeURIComponent(patientId)}${q}`);
    if (!res.ok) throw new Error('Failed to fetch counseling visits');
    return res.json();
  },

  async recordCounselingVisit(payload) {
    const res = await fetch(`${API_BASE}/billing/counseling-visits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to record counseling visit');
    }
    return res.json();
  },

  async syncCounselingBill(payload) {
    const res = await fetch(`${API_BASE}/billing/counseling-visits/sync-bill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to sync counseling bill statement');
    }
    return res.json();
  },

  async removeCounselingServiceLine(lineId) {
    const res = await fetch(`${API_BASE}/billing/counseling-visits/service-line/${encodeURIComponent(lineId)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to remove counseling service line');
    return res.json();
  },

  async deleteServiceLine(billId, lineId) {
    const res = await fetch(`${API_BASE}/billing/bills/${encodeURIComponent(billId)}/service-lines/${encodeURIComponent(lineId)}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to remove service line');
    }
    return res.json();
  },

  async getPerformedServices(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE}/billing/performed-services?${query}` : `${API_BASE}/billing/performed-services`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to retrieve performed services');
    return res.json();
  },

  async recordPerformedService(payload) {
    const res = await fetch(`${API_BASE}/billing/performed-services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to record service');
    }
    return res.json();
  },

  async updatePerformedService(id, payload) {
    const res = await fetch(`${API_BASE}/billing/performed-services/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update service');
    }
    return res.json();
  },

  async deletePerformedService(id) {
    const res = await fetch(`${API_BASE}/billing/performed-services/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete service');
    }
    return res.json();
  }
};
