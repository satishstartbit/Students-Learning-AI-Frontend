import { Component } from 'react';
import ServerErrorPage from '../../pages/status/ServerErrorPage';

/**
 * Catches a page that throws while rendering and shows ServerErrorPage
 * instead of unmounting the whole app to a blank screen.
 *
 * Two of them are in place: one around the whole router (App.jsx, full
 * screen) and one around each role shell's page area (AuthenticatedLayout,
 * KidLayout - `inShell`, so the sidebar / tab bar keep working).
 *
 * @param resetKey  when it changes (the route), the boundary clears itself,
 *                  so moving to another page leaves the error behind
 */
export class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
    this.reset = () => this.setState({ error: null });
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Visible in the console (and to any error reporting added later).
    console.error('A page failed to render', error, info?.componentStack);
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) this.reset();
  }

  render() {
    if (this.state.error) {
      return <ServerErrorPage inShell={this.props.inShell} error={this.state.error} onRetry={this.reset} />;
    }
    return this.props.children;
  }
}

export default AppErrorBoundary;
