import { Alert, Button, Input, Modal, PhoneInput } from '../../../components/common';
import { useForm } from '../../../hooks/useForm';
import { toast } from '../../../hooks/useToast';
import { required, email as emailRule, phone as phoneRule } from '../../../utils/validation';
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
 */
export default function AddParentModal({ isOpen, onClose, onCreated }) {
  const form = useForm({
    initialValues: INITIAL_VALUES,
    validationSchema: {
      firstName: [required('Enter a first name')],
      email: [required('Enter an email address'), emailRule()],
      phone: [phoneRule()],
    },
    async onSubmit(values) {
      const { data } = await parentService.addFamilyParent({
        firstName: values.firstName,
        lastName: values.lastName || null,
        email: values.email,
        phone: values.phone || null,
      });

      toast.success(`${formatName(data)} added to your family`);
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
      description="Give another parent or guardian their own sign-in for your family."
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
        They'll be emailed a link to set their own password. Once they sign in they'll see all your
        children and share your plan. Only you can change the plan or the parents in your family.
      </Alert>

      <form onSubmit={form.handleSubmit} noValidate>
        <ProfileSection title="Their details">
          <div className="pf-grid">
            <Input label="First name" required autoComplete="off" {...form.getFieldProps('firstName')} />
            <Input label="Last name" autoComplete="off" {...form.getFieldProps('lastName')} />
            <Input label="Email" type="email" required autoComplete="off" {...form.getFieldProps('email')} />
            <PhoneInput label="Phone" autoComplete="off" {...form.getFieldProps('phone')} />
          </div>
        </ProfileSection>
      </form>
    </Modal>
  );
}
