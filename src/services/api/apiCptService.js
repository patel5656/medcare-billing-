import { API_BASE_URL } from '../../config/api';

const API_BASE = `${API_BASE_URL}/cpt`;

export const apiCptService = {
  async getCptCodes() {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error('Failed to fetch CPT codes.');
    return res.json();
  },

  async createCptCode(payload) {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create CPT code.');
    }
    return res.json();
  },

  async updateCptCode(id, payload) {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to update CPT code ${id}.`);
    }
    return res.json();
  },

  async deleteCptCode(id) {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to delete CPT code ${id}.`);
    }
    return res.json();
  },
};
