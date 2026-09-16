import { API_BASE_URL } from '../../config/api';

const API_BASE = API_BASE_URL;


export const apiDocumentService = {
  async getDocuments() {
    const res = await fetch(`${API_BASE}/documents`);
    if (!res.ok) {
      throw new Error('Failed to retrieve documents.');
    }
    return res.json();
  },

  async uploadDocument(payload) {
    const res = await fetch(`${API_BASE}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to upload document.');
    }
    return res.json();
  },

  async deleteDocument(id) {
    const res = await fetch(`${API_BASE}/documents/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete document.');
    }
    return res.json();
  },

  async buildPatientPacket(selectedDocIds, caseId) {
    const res = await fetch(`${API_BASE}/documents/packet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selectedDocIds, caseId })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to build patient packet.');
    }
    
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/pdf')) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Master_Legal_Packet_${caseId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      return { packetId: `PKT-${Date.now().toString().slice(-6)}`, success: true };
    }

    return res.json();
  }
};
