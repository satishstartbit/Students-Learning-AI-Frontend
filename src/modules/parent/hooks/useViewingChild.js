import { createContext, useContext } from 'react';

/**
 * Which child the parent is currently "viewing" in the sidebar picker.
 *
 * Set by ParentLayout (the provider), read by the child-specific pages
 * (Progress, Learning Summary) and the My Children page ("Viewing now"
 * badge). The selected id is persisted in localStorage so it survives a
 * page reload.
 */
export const ViewingChildContext = createContext({
  /** The full child object (id, firstName, lastName, grade, …) or null. */
  viewingChild: null,
  /** All children available to the parent. */
  children: [],
  /** Switch to a different child by id. */
  setViewingChildId: () => {},
  /** True while the initial children list is still loading. */
  isLoading: false,
  /** Re-fetch the children list (call after add/remove/edit). */
  refresh: () => {},
});

export function useViewingChild() {
  return useContext(ViewingChildContext);
}
