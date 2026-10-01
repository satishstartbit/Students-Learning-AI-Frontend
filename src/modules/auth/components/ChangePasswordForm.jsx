import { useNavigate } from 'react-router-dom';
import { Alert, Button, PasswordInput } from '../../../components/common';
import { useForm } from '../../../hooks/useForm';
import { useAuth } from '../../../hooks/useAuth';
import { toast } from '../../../hooks/useToast';
import { required, password as passwordRule, matches } from '../../../utils/validation';
import authService from '../services/auth.service';

const INITIAL_VALUES = { currentPassword: '', newPassword: '', confirmNewPassword: '' };

/**
 * Self-contained "change password" form, dropped into any profile page.
 *
 * `POST /auth/change-password` (already existed before Profile Management)
 * verifies the current password and revokes every session on success, so the
 * user is signed out locally and sent back to /login rather than staying on
 * a page whose access token the server has already invalidated.
 *
 * `compact` is the My Profile card look: a secondary "Change password"
 * button aligned to the right, under the fields.
 *
 * `layout="profile"` is for a full-width My Profile card (the parent's
 * one-column page): current password at half width, then new + confirm side
 * by side in the profile's two-column grid (`pf-half`, `pf-grid`; one column
 * on phones). The default stacks the three fields, as before.
 */
export default function ChangePasswordForm({ compact = false, layout = 'stacked' }) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const form = useForm({
    initialValues: INITIAL_VALUES,
    validationSchema: {
      currentPassword: [required('Enter your current password')],
      newPassword: [required('Enter a new password'), passwordRule()],
      confirmNewPassword: [required('Confirm your new password'), matches('newPassword')],
    },
    async onSubmit(values) {
      await authService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      toast.success('Password changed. Please sign in again.');
      signOut();
      navigate('/login', { replace: true });
    },
  });

  const current = (
    <PasswordInput label="Current password" autoComplete="current-password" required {...form.getFieldProps('currentPassword')} />
  );
  const next = (
    <PasswordInput
      label="New password"
      autoComplete="new-password"
      hint="At least 8 characters, with an upper case letter, a lower case letter and a number."
      required
      {...form.getFieldProps('newPassword')}
    />
  );
  const confirm = (
    <PasswordInput label="Confirm new password" autoComplete="new-password" required {...form.getFieldProps('confirmNewPassword')} />
  );

  return (
    <form onSubmit={form.handleSubmit} noValidate>
      {form.submitError && (
        <Alert variant="error" className="ui-field">
          {form.submitError}
        </Alert>
      )}

      {layout === 'profile' ? (
        <>
          <div className="pf-half">{current}</div>
          <div className="pf-grid">
            {next}
            {confirm}
          </div>
        </>
      ) : (
        <>
          {current}
          {next}
          {confirm}
        </>
      )}

      {compact ? (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="submit" variant="secondary" loading={form.isSubmitting}>
            Change password
          </Button>
        </div>
      ) : (
        <Button type="submit" loading={form.isSubmitting}>
          Change password
        </Button>
      )}
    </form>
  );
}
