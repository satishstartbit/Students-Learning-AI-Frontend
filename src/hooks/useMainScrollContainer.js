import { createContext, useContext } from 'react';

/** @type {import('react').Context<import('react').RefObject<HTMLElement | null> | undefined>} */
export const MainScrollContainerContext = createContext(undefined);

/** The signed-in shell scrolls its main element independently of the window. */
export function useMainScrollContainer() {
  return useContext(MainScrollContainerContext);
}
