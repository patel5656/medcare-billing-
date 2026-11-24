import { API_BASE_URL } from '../../config/api';

const API_BASE = API_BASE_URL;

export const apiAttorneyService = {
  /**
   * Fetch all registered attorneys from the database (unpaginated)
   */
  async getAttorneys(search = '') {
    try {
      const url = search ? `${API_BASE}/attorneys?search=${encodeURIComponent(search)}` : `${API_BASE}/attorneys`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      const data = await res.json();
      return Array.isArray(data) ? data : (data.attorneys || []);
    } catch (err) {
      console.error('Failed to load attorneys from database API:', err);
      return [];
    }
  },

  /**
   * Register a new attorney record
   */
  async createAttorney(data) {
    const res = await fetch(`${API_BASE}/attorneys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to register attorney.');
    }
    return await res.json();
  },

  /**
   * Update an existing attorney record
   */
  async updateAttorney(id, data) {
    const res = await fetch(`${API_BASE}/attorneys/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update attorney.');
    }
    return await res.json();
  },

  /**
   * Delete an attorney record by ID
   */
  async deleteAttorney(id) {
    const res = await fetch(`${API_BASE}/attorneys/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete attorney.');
    }
    return await res.json();
  }
};
