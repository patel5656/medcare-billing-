import { API_BASE_URL } from '../../config/api';

const API_URL = `${API_BASE_URL}/holidays`;

export const apiHolidayService = {
  getHolidays: async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Failed to fetch holidays');
      return await response.json();
    } catch (error) {
      console.error('Error fetching holidays:', error);
      throw error;
    }
  },

  createHoliday: async (data) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create holiday');
      return await response.json();
    } catch (error) {
      console.error('Error creating holiday:', error);
      throw error;
    }
  },

  updateHoliday: async (id, data) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update holiday');
      return await response.json();
    } catch (error) {
      console.error('Error updating holiday:', error);
      throw error;
    }
  },

  deleteHoliday: async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete holiday');
      return await response.json();
    } catch (error) {
      console.error('Error deleting holiday:', error);
      throw error;
    }
  }
};
