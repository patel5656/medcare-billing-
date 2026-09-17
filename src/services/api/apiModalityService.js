import { API_BASE_URL } from '../../config/api';

const API_BASE = `${API_BASE_URL}/modalities`;

export const apiModalityService = {
  async getModalities() {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error('Failed to fetch modalities.');
    return res.json();
  },

  async createModality(payload) {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create modality.');
    }
    return res.json();
  },

  async updateModality(id, payload) {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to update modality ${id}.`);
    }
    return res.json();
  },

  async deleteModality(id) {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to delete modality ${id}.`);
    }
    return res.json();
  },
};
