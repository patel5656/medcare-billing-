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
