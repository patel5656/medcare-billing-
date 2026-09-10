import React, { useEffect, useState } from 'react';
import { apiClinicalNoteService } from '../../services/api/apiClinicalNoteService';
import { apiPatientService } from '../../services/api/apiPatientService';
import { Brain, FileCheck, Award, FileText, PlusCircle, Sparkles, ChevronRight, PenTool, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { ROLES } from '../../constants/rolePermissions';

export const DoctorDashboard = () => {
  const [notes, setNotes] = useState([]);
  const [patientCount, setPatientCount] = useState(0);
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();

  useEffect(() => {
    const filterObj = {};
    const isFullAccess = [ROLES.SUPER_ADMIN, ROLES.RECEPTIONIST].includes(currentUser?.role);
    if (!isFullAccess) {
      filterObj.providerId = currentUser?.providerId || 'prov-josmic';
    }

    apiClinicalNoteService.getNotes(filterObj).then(setNotes).catch(console.error);
    apiPatientService.getPatients(filterObj).then(p => setPatientCount(p?.length || 0)).catch(() => setPatientCount(0));
  }, [currentUser]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Doctor Clinical Review & AI Assistant Hub</h1>
          <p className="text-xs text-on-surface-variant">Clinical assessments, pain management reports, simulated AI drafting & digital note approvals</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/clinical-notes/ai-assistant')} className="px-3.5 py-2 bg-gradient-to-r from-secondary-container to-blue-700 text-white rounded-lg text-xs font-bold shadow hover:opacity-90 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-300" /> Launch AI Assistant
          </button>
          <button onClick={() => navigate('/clinical-notes/josmic-pain')} className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary-container flex items-center gap-1.5">
            <PlusCircle className="w-4 h-4" /> JOSMIC Pain Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant">Unsigned Clinical Charts</span>
            <PenTool className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-on-surface font-tabular">
            {notes.filter(n => n.status !== 'SIGNED_LOCKED').length} Charts
          </p>
          <p className="text-[11px] text-amber-600 font-semibold">Requires signature & lock</p>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant">Signed & Locked Reports</span>
            <FileCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-on-surface font-tabular">
            {notes.filter(n => n.status === 'SIGNED_LOCKED').length} Reports
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold">Ready for Billing & Packets</p>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant">Assigned Active Patients</span>
            <Users className="w-5 h-5 text-secondary-container" />
          </div>
          <p className="text-2xl font-bold text-on-surface font-tabular">{patientCount} Patients</p>
          <p className="text-[11px] text-on-surface-variant">Active clinical cases</p>
        </div>
      </div>

      {/* Doctor Clinical Review Queue */}
      <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-on-surface">Doctor Review & Approval Queue</h2>
          <button onClick={() => navigate('/clinical-notes')} className="text-xs font-bold text-secondary-container hover:underline flex items-center gap-1">
            View All Clinical Notes <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container text-on-surface-variant uppercase font-bold text-[10px]">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Patient</th>
                <th className="p-3">Provider & Document Type</th>
                <th className="p-3">Author</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {notes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-on-surface-variant">
                    <FileText className="w-10 h-10 mx-auto text-outline mb-2 opacity-50" />
                    <p className="font-bold text-sm text-on-surface">No assigned clinical notes or patients yet.</p>
                    <p className="text-xs text-on-surface-variant mt-1">When a Receptionist or Admin assigns a patient case or schedules an appointment for you, your clinical charts will appear here.</p>
                  </td>
                </tr>
              ) : (
                notes.map((note) => (
                  <tr key={note.id} className="hover:bg-surface">
                    <td className="p-3 font-mono text-on-surface-variant">{note.date}</td>
                    <td className="p-3 font-bold text-secondary-container">{note.patientName}</td>
                    <td className="p-3">
                      <p className="font-semibold text-on-surface">{note.title}</p>
                      <p className="text-[10px] text-on-surface-variant">{note.providerName}</p>
                    </td>
                    <td className="p-3 text-on-surface-variant">{note.author}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        note.status === 'SIGNED_LOCKED' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                      }`}>
                        {note.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => navigate(`/clinical-notes/${note.id}/edit`)}
                        className="px-3 py-1 bg-secondary-container hover:bg-secondary text-white rounded font-bold text-xs transition"
                      >
                        Review & Sign
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
