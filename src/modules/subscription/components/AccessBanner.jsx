import { Link } from 'react-router-dom';
import { Alert, Button } from '../../../components/common';

/**
 * The family's access, said plainly (PDF Q11):
 *   grace (parents only)  everything works until a date - update the card
 *   read-only             everything saved is still here; some things are paused
 * The words are the admin's ("Billing grace and access"); a student gets the
 * neutral version and no billing link.
 */
export function AccessBanner({ access, role }) {
  if (!access?.loaded || !access.message) return null;
  const isParent = role === 'PARENT';
  const lapsed = access.readOnly;
  if (!lapsed && !(isParent && access.state === 'grace')) return null;

  return (
    <Alert variant={lapsed ? 'info' : 'warning'} className="ui-field" role="status">
      <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--spacing-sm)', justifyContent: 'space-between' }}>
        <span>{access.message}</span>
        {isParent && (
          <Button as={Link} to="/parent/subscription" size="sm" variant="secondary">
            {lapsed ? 'Renew' : 'Update payment'}
          </Button>
        )}
      </span>
    </Alert>
  );
}

export default AccessBanner;
