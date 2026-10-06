import api from '../utils/apiClient';

/**
 * Master lists every signed-in role shares (backend: /lookups).
 *
 * Teachers, parents and students all create work, and all three read the same
 * admin-managed lists - work types, subjects, grades - so these
 * live here rather than being copied into each module's own service. Nothing
 * that comes back is hardcoded anywhere in the app: Super Admin adds, rewords
 * or deactivates a row in Master Management and every screen follows.
 */

/** The master types this endpoint will serve, as the server lists them. */
export const listLookupTypes = () => api.get('/lookups');

/** Active rows of one list, in the order Super Admin arranged them. */
export const listLookup = (type, params = {}) => api.get(`/lookups/${type}`, { params });

/** The kinds of work a task can be ("Homework", "Reading response", ...). */
export const listWorkTypes = (params = {}) => listLookup('assignment_types', params);

/**
 * The "what is making it hard to get started or keep going right now?"
 * picker: categories, each with its reasons, and each reason already carrying
 * the one or two strategies to offer back. Grouped server-side so no screen
 * has to know how a reason points at a strategy.
 */
export const getDifficultyPicker = () => api.get('/lookups/difficulty-picker');

export default {
  listLookupTypes,
  listLookup,
  listWorkTypes,
  getDifficultyPicker,
};
