import api from '../utils/apiClient';

/**
 * Words the app shows that Super Admin edits in Platform settings (backend:
 * /content). Never hardcode these in a screen - change them in the admin.
 */

/** Safety help lines (Kids Help Phone, 911) and the onboarding safety notices. */
export const getSafetyContent = () => api.get('/content/safety');

/** Privacy Policy, Terms of Use and the consent wording (public - no sign-in needed). */
export const getLegalContent = () => api.get('/content/legal');

export default { getSafetyContent, getLegalContent };
