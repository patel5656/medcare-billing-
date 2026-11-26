// src/utils/providerFilterUtils.js

export const KNOWN_PROVIDERS_MAP = {
  'prov-anik': 'FM Laser Therapy',
  'prov-counselor': 'FM Counselor Practice',
  'prov-davs': "FM DAV'S Anatomy",
  'prov-josmic': 'FM HEALTH AND WELLNESS CENTER',
  'prov-tecar': 'FM TECAR Radiofrequency Practice',
  'prov-tpi': 'FM Trigger Point Injection Practice',
  'usr-sa': 'Super Admin'
};

/**
 * Standard short display labels for provider badges across Clinical Cases, Patients, and Modality views.
 * Replaces legacy developer IDs/codes (e.g., JOSMIC -> PAIN CON, ANIK -> LASER).
 */
export const PROVIDER_SHORT_LABELS = {
  'prov-josmic': 'PAIN CON',
  'josmic': 'PAIN CON',
  'prov-anik': 'LASER',
  'anik': 'LASER',
  'prov-davs': 'DAVS',
  'davs': 'DAVS',
  'prov-counselor': 'COUNSELOR',
  'counselor': 'COUNSELOR',
  'prov-tecar': 'TECAR',
  'tecar': 'TECAR',
  'prov-tpi': 'TPI',
  'tpi': 'TPI'
};

/**
 * Returns user-facing short label for provider badges (e.g., in Case List & Patient List assigned providers).
 * Formats: 'prov-josmic' -> 'PAIN CON', 'prov-anik' -> 'LASER', etc.
 */
export const getProviderShortLabel = (providerId) => {
  if (!providerId) return '';
  const key = String(providerId).toLowerCase().trim();
  if (PROVIDER_SHORT_LABELS[key]) return PROVIDER_SHORT_LABELS[key];
  const cleaned = key.replace('prov-', '');
  if (PROVIDER_SHORT_LABELS[cleaned]) return PROVIDER_SHORT_LABELS[cleaned];
  return cleaned.toUpperCase();
};

/**
 * Returns formatted display name for a provider given its ID and an optional providers dictionary.
 */
export const getProviderDisplayName = (providerId, providersMap = {}) => {
  if (!providerId || providerId === 'ALL') return 'All Practice Providers';
  if (providersMap[providerId]?.name) {
    const name = providersMap[providerId].name.trim();
    return name.startsWith('FM') ? name : `FM ${name}`;
  }
  return KNOWN_PROVIDERS_MAP[providerId] || providerId;
};

/**
 * Checks whether an item's provider matches the currently active provider filter.
 */
export const matchesProviderFilter = (itemProvId, itemProvName, filterId) => {
  if (!filterId || filterId === 'ALL') return true;
  const pId = (itemProvId || '').toLowerCase();
  const pName = (itemProvName || '').toLowerCase();
  const fId = filterId.toLowerCase();

  if (pId === fId) return true;
  if (fId.includes('josmic') && (pName.includes('josmic') || pName.includes('health') || pName.includes('wellness') || pName.includes('consultation'))) return true;
  if (fId.includes('dav') && (pName.includes('dav') || pName.includes('anatomy') || pName.includes('shockwave') || pName.includes('eswt'))) return true;
  if (fId.includes('anik') && (pName.includes('anik') || pName.includes('laser') || pName.includes('biostimulation'))) return true;
  if (fId.includes('counselor') && (pName.includes('counselor') || pName.includes('behavioral') || pName.includes('hope') || pName.includes('mental'))) return true;
  if (fId.includes('tpi') && (pName.includes('trigger') || pName.includes('tpi') || pName.includes('injection'))) return true;
  if (fId.includes('tecar') && (pName.includes('tecar') || pName.includes('radiofrequency') || pName.includes('physio'))) return true;
  return false;
};
