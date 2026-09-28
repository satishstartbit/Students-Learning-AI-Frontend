import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import AppRoutes from './routes/AppRoutes';
import AppErrorBoundary from './components/status/AppErrorBoundary';
import NetworkStatusBanner from './components/status/NetworkStatusBanner';
import './components/common/common.css';

/**
 * Application root.
 *
 * The Redux store holds the session, so <Provider> wraps the router and the
 * route guards read auth state through useAuth. The route tree itself is
 * defined in routes/routeConfig.js.
 *
 * Around every page: a crash boundary (a page that throws shows "This page
 * ran into a problem" instead of a blank screen) and the connection banner
 * ("You're offline" / "Can't reach the server" / "You're back online").
 */
export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppErrorBoundary>
          <AppRoutes />
        </AppErrorBoundary>
        <NetworkStatusBanner />
      </BrowserRouter>
    </Provider>
  );
}
