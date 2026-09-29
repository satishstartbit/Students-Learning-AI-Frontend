import { Alert, Button, Modal, PasswordInput } from '../../../components/common';
import { useForm } from '../../../hooks/useForm';
import { toast } from '../../../hooks/useToast';
import { required, password as passwordRule, matches } from '../../../utils/validation';
import { formatName } from '../../../utils/format';
import parentService from '../services/parent.service';

const INITIAL_VALUES = { password: '', confirmPassword: '' };

/**
 * "Set password" - the parent sets a new password directly for their
 * child's account, rather than the emailed reset-link every other password
 * change in this app uses. See services/parent.service.js#setChildPassword
 * on the backend for why: a child's account is guardian-managed, and a
 * young student can't be expected to complete an email reset link
 * unsupervised. The child is signed out of every session immediately.
 *
 * `save` swaps the endpoint - the Super Admin user page passes
 * adminUserService.setStudentPassword, since students have no email to
 * receive a reset link.
 */
export default function SetChildPasswordModal({ isOpen, child, onClose, onUpdated, save = parentService.setChildPassword }) {
  const form = useForm({
    initialValues: INITIAL_VALUES,
    validationSchema: {
      password: [required('Enter a new password'), passwordRule()],
      confirmPassword: [required('Confirm the new password'), matches('password')],
    },
    async onSubmit(values) {
      await save(child.id, {
        password: values.password,
        confirmPassword: values.confirmPassword,
      });

      toast.success(`Password updated for ${formatName(child)}`);
      handleClose();
      onUpdated?.();
    },
  });

  const handleClose = () => {
    form.reset(INITIAL_VALUES);
    onClose();
  };

  if (!child) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Set a new password for ${formatName(child)}`}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={form.isSubmitting}>
            Cancel
          </Button>
          <Button onClick={form.handleSubmit} loading={form.isSubmitting}>
            Set password
          </Button>
        </>
      }
    >
      {form.submitError && (
        <Alert variant="error" className="ui-field">
          {form.submitError}
        </Alert>
      )}

      <Alert variant="info" className="ui-field">
        {formatName(child)} will be signed out everywhere and will need this new password the next
        time they sign in.
      </Alert>

      <form onSubmit={form.handleSubmit} noValidate>
        <PasswordInput
          label="New password"
          autoComplete="new-password"
          hint="8+ characters with upper case, lower case and a number"
          required
          {...form.getFieldProps('password')}
        />
        <PasswordInput
          label="Confirm new password"
          autoComplete="new-password"
          required
          {...form.getFieldProps('confirmPassword')}
        />
      </form>
    </Modal>
  );
}
