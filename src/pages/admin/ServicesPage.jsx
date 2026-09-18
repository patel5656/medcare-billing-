import React, { useState, useEffect } from 'react';
import { Tag, X, Save, Edit3, Plus, Shield, Loader2 } from 'lucide-react';
import { apiCptService } from '../../services/api/apiCptService';
import { useUIStore } from '../../store/uiStore';

export const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const { addToast } = useUIStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingSvc, setViewingSvc] = useState(null);
  const [form, setForm] = useState({ code: '', description: '', fee: '', category: 'Standard', modifiers: '' });
  const [isSaving, setIsSaving] = useState(false);

  const inputCls = 'w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none transition';
  const labelCls = 'block text-xs font-bold text-slate-800 mb-1';

  const fetchServices = async () => {
    try {
      const data = await apiCptService.getCptCodes();
      setServices(data);
    } catch (error) {
      addToast('Failed to load services', 'error');
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const openAddModal = () => {
    setForm({ code: '', description: '', fee: '', category: 'Standard', modifiers: '' });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (svc) => {
    setForm({
      code: svc.code,
      description: svc.description,
      fee: (svc.fee || '').replace(/[^0-9.]/g, ''),
      category: svc.category || 'Standard',
      modifiers: svc.modifiers || ''
    });
    setEditingId(svc.id);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = { ...form, fee: `$${parseFloat(form.fee || 0).toFixed(2)}` };
      if (editingId) {
        await apiCptService.updateCptCode(editingId, payload);
        addToast('Service updated successfully', 'success');
      } else {
        await apiCptService.createCptCode(payload);
        addToast('Service created successfully', 'success');
      }
      setIsModalOpen(false);
      setForm({ code: '', description: '', fee: '', category: 'Standard', modifiers: '' });
      setEditingId(null);
      fetchServices();
    } catch (err) {
      addToast(err.message || 'Failed to save service', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    try {
      await apiCptService.deleteCptCode(id);
      addToast('Service deleted', 'success');
      fetchServices();
    } catch (err) {
      addToast(err.message || 'Failed to delete service', 'error');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Fee Schedules & CPT</h1>
          <p className="text-xs font-medium text-slate-500 mt-1">Manage service codes, standard rates, and payer-specific fee schedules.</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-teal-500/20 transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Service / CPT
        </button>
      </div>

      {services.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
          <Tag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800 mb-2">Service Catalog Configuration</h3>
          <p className="text-sm max-w-md mx-auto">This module allows configuration of CPT codes and associated fee schedules for the practice. Click "Add Service / CPT" to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-6 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-extrabold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3.5">CPT CODE</th>
                  <th className="p-3.5">PROCEDURE DESCRIPTION</th>
                  <th className="p-3.5">CATEGORY</th>
                  <th className="p-3.5 text-right">STANDARD FEE (S)</th>
                  <th className="p-3.5 text-center">DEFAULT MODIFIERS</th>
                  <th className="p-3.5 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {services.map((svc) => (
                  <tr key={svc.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-bold text-slate-900">
                      {svc.code}
                    </td>
                    <td className="p-3.5 text-slate-600 font-medium">
                      {svc.description}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-full font-bold text-[11px]">
                        {svc.category || 'General'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-700">
                      {svc.fee}
                    </td>
                    <td className="p-3.5 text-center text-slate-500 font-medium">
                      {svc.modifiers || '-'}
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => setViewingSvc(svc)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-bold transition cursor-pointer"
                        >
                          View
                        </button>
                        <button
                          onClick={() => openEditModal(svc)}
                          className="text-amber-600 hover:text-amber-800 text-xs font-bold transition cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(svc.id)}
                          className="text-red-600 hover:text-red-800 text-xs font-bold transition cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">{editingId ? 'Edit Service / CPT' : 'Add New Service / CPT'}</h2>
                  <p className="text-[10px] text-slate-500">Register a new service code in the catalog</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-slate-200 rounded-xl transition cursor-pointer">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div>
                <label className={labelCls}>CPT Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 99213"
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Procedure Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Office Visit, Established Patient"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Standard Fee (S) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={form.fee}
                    onChange={e => setForm({ ...form, fee: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className={inputCls}
                  >
                    <option value="General">General</option>
                    <option value="E&M">E&M</option>
                    <option value="Procedure">Procedure</option>
                    <option value="Evaluation">Evaluation</option>
                    <option value="Therapy">Therapy</option>
                    <option value="Injections">Injections</option>
                    <option value="Mental Health">Mental Health</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Default Modifiers</label>
                <input
                  type="text"
                  placeholder="e.g. 25, 59"
                  value={form.modifiers}
                  onChange={e => setForm({ ...form, modifiers: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 active:scale-95 rounded-xl flex items-center gap-2 shadow-md shadow-teal-500/20 transition cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingSvc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">View Service Details</h2>
                </div>
              </div>
              <button onClick={() => setViewingSvc(null)} className="p-1.5 hover:bg-slate-200 rounded-xl transition cursor-pointer">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div>
                <span className="block text-xs font-bold text-slate-500 mb-1">CPT Code</span>
                <span className="font-medium text-slate-900">{viewingSvc.code}</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-500 mb-1">Procedure Description</span>
                <span className="font-medium text-slate-900">{viewingSvc.description}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-bold text-slate-500 mb-1">Standard Fee (S)</span>
                  <span className="font-medium text-slate-900">{viewingSvc.fee}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-500 mb-1">Category</span>
                  <span className="font-medium text-slate-900">{viewingSvc.category || 'General'}</span>
                </div>
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-500 mb-1">Default Modifiers</span>
                <span className="font-medium text-slate-900">{viewingSvc.modifiers || '-'}</span>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setViewingSvc(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
