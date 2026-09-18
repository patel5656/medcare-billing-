import { create } from 'zustand';
import { apiModalityService } from '../services/api/apiModalityService';
import { apiCptService } from '../services/api/apiCptService';
import { apiModifierService } from '../services/api/apiModifierService';
import { getAllICDCodes } from '../services/api/apiIcdService';

// Default UI properties to assign to modalities fetched from the backend
const DEFAULT_MODALITY_UI_MAP = {
  'Pain Management': {
    icon: 'Activity',
    badgeStyle: 'bg-teal-100 text-teal-800 border-teal-200',
    description: 'Comprehensive medical assessment, pain diagnostics, and interdisciplinary treatment planning.'
  },
  'Laser Therapy': {
    icon: 'Zap',
    badgeStyle: 'bg-violet-100 text-violet-800 border-violet-200',
    description: 'High-Intensity Laser Therapy (HILT) for deep tissue inflammation, cell repair, and pain relief.'
  },
  'Shockwave Therapy': {
    icon: 'Radio',
    badgeStyle: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Extracorporeal Shockwave Therapy (ESWT) for musculoskeletal breakdown and regenerative treatment.'
  },
  'Trigger Point Injection': {
    icon: 'Syringe',
    badgeStyle: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'Targeted myofascial trigger point injection therapy for localized muscle spasm relief.'
  },
  'TECAR Therapy': {
    icon: 'Cpu',
    badgeStyle: 'bg-rose-100 text-rose-800 border-rose-200',
    description: 'Radiofrequency energy transfer (Capacitive/Resistive) for soft tissue rehabilitation.'
  },
  'Counseling': {
    icon: 'MessageSquare',
    badgeStyle: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'Psychological, behavioral, and wellness counseling sessions for pain coping and mental health.'
  }
};

const getFallbackUiProps = (name) => {
  const match = Object.keys(DEFAULT_MODALITY_UI_MAP).find(k => name?.includes(k));
  if (match) return DEFAULT_MODALITY_UI_MAP[match];
  return {
    icon: 'Activity',
    badgeStyle: 'bg-slate-100 text-slate-800 border-slate-200',
    description: `${name} service.`
  };
};

export const useSettingsStore = create((set, get) => ({
  modalities: [],
  cptCodes: [],
  icdCodes: [],
  modifiers: [],
  isLoading: false,
  error: null,

  fetchSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const [modalitiesData, cptData, icdData, modifierData] = await Promise.allSettled([
        apiModalityService.getModalities(),
        apiCptService.getCptCodes(),
        getAllICDCodes(),
        apiModifierService.getModifiers()
      ]);

      const modalities = modalitiesData.status === 'fulfilled' ? modalitiesData.value.map(m => ({
        ...m,
        id: m.id,
        name: m.name,
        suggestedCptCode: m.cptCode,
        standardRate: parseFloat((m.fee || '0').toString().replace(/[^0-9.]/g, '')),
        activeStatus: m.enabled ? 'ACTIVE' : 'DISABLED',
        ...getFallbackUiProps(m.name)
      })) : [];

      const cptCodes = cptData.status === 'fulfilled' ? cptData.value : [];
      const icdCodes = icdData.status === 'fulfilled' ? icdData.value : [];
      const modifiers = modifierData.status === 'fulfilled' ? modifierData.value : [];

      set({ modalities, cptCodes, icdCodes, modifiers, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  getModalityById: (id) => {
    return get().modalities.find(m => m.id === id);
  },

  getOperationalModalities: () => {
    return get().modalities.filter(m => m.activeStatus === 'ACTIVE');
  }
}));
