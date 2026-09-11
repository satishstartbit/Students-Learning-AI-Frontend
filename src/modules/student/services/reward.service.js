import api from '../../../utils/apiClient';

/** The signed-in student's own points and the reward catalog (Grade 6+ only - gated by REWARD_READ/REWARD_CREATE). */

export const getSummary = () => api.get('/rewards/summary');

export const listTransactions = (params = {}) => api.get('/rewards/transactions', { params });

export const listCatalog = () => api.get('/rewards/catalog');

export const listRedemptions = (params = {}) => api.get('/rewards/redemptions', { params });

export const redeemReward = (id) => api.post(`/rewards/${id}/redeem`);

export default { getSummary, listTransactions, listCatalog, listRedemptions, redeemReward };
