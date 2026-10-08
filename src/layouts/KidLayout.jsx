import { useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import '@fontsource-variable/fredoka';
import '@fontsource/andika/400.css';
import '@fontsource/andika/700.css';
import '@fontsource/patrick-hand/400.css';
import '../styles/kid-theme.css';
import { Toast } from '../components/common';
import { useAuth } from '../hooks/useAuth';
import { useSyncUserLocale } from '../hooks/useSyncUserLocale';
import { KidPreferencesContext, useCalmPreference } from '../modules/student/hooks/useKidPreferences';
import { StudentSettingsProvider } from '../modules/student/components/StudentSettingsProvider';
import { KidSidebar, KidTabBar, KidTopBar } from '../modules/student/components/kid/KidChrome';
import AppErrorBoundary from '../components/status/AppErrorBoundary';

/**
 * The K-4 student shell - "My Learning Space".
 *
 * Replaces AuthenticatedLayout for students in Kindergarten-Grade 5 (chosen
 * by StudentLayout). Owns the kid theme (styles/kid-theme.css), the
 * self-hosted fonts, and calm mode: <MotionConfig> turns motion-library
 * animation off when calm mode is on, and follows the OS reduced-motion
 * setting otherwise.
 *
 * K-4 pages mark their root with `data-kid-page` and lay themselves out
 * edge to edge; any other page (assignment detail, AI Helper) gets the
 * usual padding, so the older shared pages still fit inside this shell.
 */
export function KidLayout({ children }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  useSyncUserLocale(user);

  const [calm, setCalm] = useCalmPreference(user?.id);
  const preferences = useMemo(() => ({ calm, setCalm }), [calm, setCalm]);

  return (
    <KidPreferencesContext.Provider value={preferences}>
      {/* Saved "Make it yours" choices (avatar, card style) - the same provider the Grade 6+ shell uses. */}
      <StudentSettingsProvider>
        <MotionConfig reducedMotion={calm ? 'always' : 'user'}>
          <div className="kid-theme flex h-svh w-full overflow-hidden" data-calm={calm || undefined}>
            <a
              href="#kid-main"
              className="sr-only z-50 rounded-full bg-kid-teal px-5 py-3 font-kid-display text-white no-underline focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
            >
              Skip to main content
            </a>

            <KidSidebar />

            <div className="flex min-w-0 flex-1 flex-col">
              <KidTopBar />
              {/* The only scrolling region; bottom padding clears the mobile tab bar. */}
              <main
                id="kid-main"
                className="min-w-0 flex-1 overflow-y-auto p-4 pb-28 sm:p-6 sm:pb-28 lg:p-8 has-[[data-kid-page]]:p-0 has-[[data-kid-page]]:pb-24 lg:has-[[data-kid-page]]:pb-0"
              >
                <AppErrorBoundary inShell resetKey={pathname}>
                  {children ?? <Outlet />}
                </AppErrorBoundary>
              </main>
            </div>

            <KidTabBar />
          </div>
        </MotionConfig>
      </StudentSettingsProvider>

      <Toast />
    </KidPreferencesContext.Provider>
  );
}

export default KidLayout;
