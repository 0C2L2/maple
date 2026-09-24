// One source for current profile forms. Planning does not specify attendance ranges.
// These small, disjoint attendance bands are the Checkpoint 4 form vocabulary.
export const taxonomy = {
  categories: ['hackathon', 'conference', 'meetup', 'workshop', 'festival'],
  regions: ['africa', 'asia', 'europe', 'north-america', 'south-america', 'oceania', 'online'],
  audience_types: ['developers', 'students', 'founders', 'designers', 'marketers'],
  audience_band: ['under-50', '50-199', '200-999', '1000-plus'],
  gives: ['cash', 'product', 'credits', 'swag', 'venue', 'speakers', 'mentors', 'prizes'],
} as const;
export const preferenceLabel = (value: string) => /^\d+-\d+$/.test(value) ? value.replace('-', '–') : value === 'under-50' ? 'Under 50' : value === '1000-plus' ? '1,000+' : value.replaceAll('-', ' ').replace(/^./, (letter) => letter.toUpperCase());
