import { API_BASE_URL } from '../../config/api';

const API_BASE = `${API_BASE_URL}/modifiers`;

export const apiModifierService = {
  async getModifiers() {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error('Failed to fetch modifiers.');
    return res.json();
  },

  async createModifier(payload) {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create modifier.');
    }
    return res.json();
  },

  async updateModifier(id, payload) {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to update modifier ${id}.`);
    }
    return res.json();
  },

  async deleteModifier(id) {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to delete modifier ${id}.`);
    }
    return res.json();
  },
};
