import { Alert, Button, EmailInput, Input, Modal, PhoneInput } from '../../../components/common';
import { useForm } from '../../../hooks/useForm';
import { toast } from '../../../hooks/useToast';
import { required, emailRules, phone as phoneRule } from '../../../utils/validation';
import { formatName } from '../../../utils/format';
import { ProfileSection } from '../../profile/components/ProfileParts';
import parentService from '../services/parent.service';
import '../../profile/components/profile.css';
import './parentChildren.css';

// No time zone field: they get the account holder's (family.service#addParent),
// then their own device's once they sign in (hooks/useDeviceTimezone.js).
const INITIAL_VALUES = { firstName: '', lastName: '', email: '', phone: '' };

/**
 * "Add parent" (account holder only): creates another parent account in the
 * family. The backend links them to every child and to the family's plan.
 * Super Admin reuses it on a parent's record with its own `save`
 * (POST /admin/users/:id/family/parents) and `familyName`.
 */
export default function AddParentModal({ isOpen, onClose, onCreated, save = parentService.addFamilyParent, familyName = null }) {
  const form = useForm({
    initialValues: INITIAL_VALUES,
    validationSchema: {
      firstName: [required('Enter a first name')],
      email: emailRules(),
      phone: [phoneRule()],
    },
    async onSubmit(values) {
      const { data } = await save({
        firstName: values.firstName,
        lastName: values.lastName || null,
        email: values.email,
        phone: values.phone || null,
      });

      toast.success(`${formatName(data)} added to ${familyName ? `${familyName}'s` : 'your'} family`);
      handleClose();
      onCreated?.();
    },
  });

  const handleClose = () => {
    form.reset(INITIAL_VALUES);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add a parent"
      description={
        familyName
          ? `Give another parent or guardian their own sign-in for ${familyName}'s family.`
          : 'Give another parent or guardian their own sign-in for your family.'
      }
      size="lg"
      className="pc-childform"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={form.isSubmitting}>
            Cancel
          </Button>
          <Button onClick={form.handleSubmit} loading={form.isSubmitting}>
            Add parent
          </Button>
        </>
      }
    >
      {form.submitError && (
        <Alert variant="error" className="pc-childform__alert">
          {form.submitError}
        </Alert>
      )}

      <Alert variant="info" className="pc-childform__alert">
        {familyName
          ? `They'll be emailed a link to set their own password. Once they sign in they'll see all of ${familyName}'s children and share the family plan, taking one parent place on it.`
          : "They'll be emailed a link to set their own password. Once they sign in they'll see all your children and share your plan. Only you can change the plan or the parents in your family."}
      </Alert>

      <form onSubmit={form.handleSubmit} noValidate>
        <ProfileSection title="Their details">
          <div className="pf-grid">
            <Input label="First name" required autoComplete="off" {...form.getFieldProps('firstName')} />
            <Input label="Last name" autoComplete="off" {...form.getFieldProps('lastName')} />
            <EmailInput label="Email" required autoComplete="off" {...form.getFieldProps('email')} />
            <PhoneInput label="Phone" autoComplete="off" {...form.getFieldProps('phone')} />
          </div>
        </ProfileSection>
      </form>
    </Modal>
  );
}
