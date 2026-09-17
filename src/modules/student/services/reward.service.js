import api from '../../../utils/apiClient';

/**
 * The signed-in student's points and collectible rewards. Rewards are
 * collected automatically when earned points reach their level - there is no
 * redeem call (backend services/reward.service.js).
 */

export const getSummary = () => api.get('/rewards/summary');

export const listTransactions = (params = {}) => api.get('/rewards/transactions', { params });

/** Every active reward, each with `collected`/`collectedAt` for this student. */
export const listCatalog = () => api.get('/rewards/catalog');

/** Collected rewards, newest first. */
export const listRedemptions = (params = {}) => api.get('/rewards/redemptions', { params });

export default { getSummary, listTransactions, listCatalog, listRedemptions };
