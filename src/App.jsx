import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import AppRoutes from './routes/AppRoutes';
import './components/common/common.css';

/**
 * Application root.
 *
 * Providers wrap the router so guards can read the session, and the route
 * tree itself is defined in routes/routeConfig.js.
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
