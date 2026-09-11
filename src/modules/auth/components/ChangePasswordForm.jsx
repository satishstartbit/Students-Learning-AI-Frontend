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
 */
export default function ChangePasswordForm() {
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

  return (
    <form onSubmit={form.handleSubmit} noValidate>
      {form.submitError && (
        <Alert variant="error" className="ui-field">
          {form.submitError}
        </Alert>
      )}

      <PasswordInput
        label="Current password"
        autoComplete="current-password"
        required
        {...form.getFieldProps('currentPassword')}
      />
      <PasswordInput
        label="New password"
        autoComplete="new-password"
        hint="8+ characters with upper case, lower case and a number"
        required
        {...form.getFieldProps('newPassword')}
      />
      <PasswordInput
        label="Confirm new password"
        autoComplete="new-password"
        required
        {...form.getFieldProps('confirmNewPassword')}
      />

      <Button type="submit" loading={form.isSubmitting}>
        Change password
      </Button>
    </form>
  );
}
