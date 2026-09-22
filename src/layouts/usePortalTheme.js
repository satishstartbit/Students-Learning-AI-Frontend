import { useEffect } from 'react';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/500.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import '../theme/portalTheme.css';

/**
 * The Teacher/Parent portal look (theme/portalTheme.css), put on <body> for
 * as long as the layout is mounted so portaled dialogs get it too - the
 * same approach as StudentLayout and SuperAdminLayout.
 */
export function usePortalTheme() {
  useEffect(() => {
    document.body.classList.add('portal-theme');
    return () => document.body.classList.remove('portal-theme');
  }, []);
}

export default usePortalTheme;
