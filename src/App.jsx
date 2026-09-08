import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import AppRoutes from './routes/AppRoutes';
import './components/common/common.css';

/**
 * Application root.
 *
 * The Redux store holds the session, so <Provider> wraps the router and the
 * route guards read auth state through useAuth. The route tree itself is
 * defined in routes/routeConfig.js.
 */
export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </Provider>
  );
}
