import { API_BASE_URL } from '../../config/api';

const API_URL = `${API_BASE_URL}/icd-codes`;

export const getAllICDCodes = async () => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Failed to fetch ICD codes');
    return await response.json();
  } catch (error) {
    console.error('Error fetching ICD codes:', error);
    throw error;
  }
};

export const createICDCode = async (data) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to create ICD code');
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating ICD code:', error);
    throw error;
  }
};

export const updateICDCode = async (id, data) => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to update ICD code');
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating ICD code:', error);
    throw error;
  }
};

export const deleteICDCode = async (id) => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to delete ICD code');
    }
    return await response.json();
  } catch (error) {
    console.error('Error deleting ICD code:', error);
    throw error;
  }
};
