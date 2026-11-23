// src/utils/cptFeeSchedule.js
import { INITIAL_PROVIDER_CONFIGS } from '../constants/providerConfigs.js';
import { useSettingsStore } from '../store/settingsStore.js';

/**
 * Cleanly extracts a numeric fee from any fee string or number (e.g. "$1,214.00" -> 1214.00)
 */
export const cleanNumericFee = (val) => {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const cleaned = String(val).replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Dynamically resolves CPT fee and description exclusively from System Settings CPT master
 * and configured provider fee schedules.
 * 
 * Resolution order:
 * 1. System Settings CPT Master Catalog (from passed cptCodes or useSettingsStore)
 * 2. Provider Fee Schedule (providerServices -> availableServices -> providerConfig)
 */
export const resolveCptFeeAndDescription = (cptCode, providerId = null, cptCodes = []) => {
  if (!cptCode) return { fee: 0, description: '' };

  const targetCode = String(cptCode).trim();

  // 1. Check System Settings CPT Master list
  const masterList = (Array.isArray(cptCodes) && cptCodes.length > 0)
    ? cptCodes
    : (typeof useSettingsStore !== 'undefined' && useSettingsStore.getState ? useSettingsStore.getState().cptCodes : []);

  if (masterList && masterList.length > 0) {
    const matched = masterList.find(c => String(c.code).trim().toLowerCase() === targetCode.toLowerCase());
    if (matched) {
      const rawFee = matched.defaultFee !== undefined ? matched.defaultFee : matched.fee;
      const numFee = cleanNumericFee(rawFee);
      return {
        fee: numFee,
        description: matched.description || ''
      };
    }
  }

  // 2. Check Provider Fee Schedule if providerId is supplied
  if (providerId) {
    const pKey = String(providerId).replace('prov-', '');
    const pConfig = INITIAL_PROVIDER_CONFIGS[pKey] || Object.values(INITIAL_PROVIDER_CONFIGS).find(p => p.id === providerId);
    if (pConfig) {
      // Check providerServices
      const provService = pConfig.providerServices?.find(ps => String(ps.cptCode).trim().toLowerCase() === targetCode.toLowerCase());
      if (provService && provService.price !== undefined) {
        const numPrice = cleanNumericFee(provService.price);
        if (numPrice > 0) {
          return {
            fee: numPrice,
            description: provService.billingDescription || provService.description || pConfig.serviceCategory || ''
          };
        }
      }

      // Check availableServices
      const availService = pConfig.availableServices?.find(as => String(as.code).trim().toLowerCase() === targetCode.toLowerCase());
      if (availService && availService.defaultCharge !== undefined) {
        const numCharge = cleanNumericFee(availService.defaultCharge);
        if (numCharge > 0) {
          return {
            fee: numCharge,
            description: availService.description || ''
          };
        }
      }

      // Check direct provider CPT code & fee
      if (String(pConfig.cptCode).trim().toLowerCase() === targetCode.toLowerCase() && pConfig.fee) {
        const numFee = cleanNumericFee(pConfig.fee);
        if (numFee > 0) {
          return {
            fee: numFee,
            description: pConfig.serviceCategory || ''
          };
        }
      }
    }
  }

  return { fee: 0, description: '' };
};
