import api from '../../../utils/apiClient';

/**
 * Canadian postal-code (FSA - the first 3 characters, e.g. "K1A") ->
 * approximate city/province, for address autofill (AddressFields.jsx).
 */
export const lookupPostalCode = (fsa) => api.get(`/postal-lookup/${fsa}`);

export default { lookupPostalCode };
