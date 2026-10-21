import { Alert, Button, EmailInput, Input, Modal, PhoneInput } from '../../../components/common';
import { useForm } from '../../../hooks/useForm';
import { toast } from '../../../hooks/useToast';
import { emailProblemText } from '../../../utils/emailProblem';
import { formatName } from '../../../utils/format';
import { formatPhoneForDisplay } from '../../../utils/phone';
import { isRequiredField, withRequiredFields } from '../../../utils/profileRequirements';
import { emailRules, phone as phoneRule, required } from '../../../utils/validation';
import { ProfileSection } from '../../profile/components/ProfileParts';
import parentService from '../services/parent.service';
import '../../profile/components/profile.css';
import './parentChildren.css';

const valuesFrom = (member) => ({
  firstName: member?.firstName ?? '',
  lastName: member?.lastName ?? '',
  email: member?.email ?? '',
  phone: formatPhoneForDisplay(member?.phone),
});

/**
 * "Edit" on another parent's card (account holder only): their name and
 * phone, and - while their invite is pending - their email, to fix a wrong
 * address; the backend then sends a fresh invite there and the old link stops
 * working. Once they have signed up only they can change their sign-in email,
 * so the field is read-only (family.service#updateParent).
 *
 * Keyed by the member in the caller, so each opening starts from their saved details.
 */
export default function EditParentModal({ member, onClose, onSaved }) {
  const signedUp = Boolean(member.emailVerified);
  const first = member.firstName || 'They';

  const form = useForm({
    initialValues: valuesFrom(member),
    validationSchema: withRequiredFields('PARENT', {
      firstName: [required('Enter a first name')],
      email: emailRules(),
      phone: [phoneRule()],
    }),
    async onSubmit(values) {
      const emailChanged = !signedUp && values.email.trim().toLowerCase() !== String(member.email ?? '').toLowerCase();
      const { data } = await parentService.updateFamilyParent(member.id, {
        firstName: values.firstName,
        lastName: values.lastName || null,
        phone: values.phone || null,
        ...(emailChanged ? { email: values.email } : {}),
      });

      if (data?.inviteEmail?.sent === false) {
        toast.error(`${formatName(data)}'s details are saved, but the invite to ${data.email} didn't go out. ${emailProblemText(data.inviteEmail.problem)}`, {
          title: "The invite email didn't go out",
        });
      } else if (data?.inviteEmail?.sent) {
        toast.success(`We sent a new invite to ${data.email}. The one sent to the old address no longer works.`, { title: 'Details saved' });
      } else {
        toast.success(`${formatName(data ?? values)}'s details are saved.`);
      }
      onSaved?.();
      onClose();
    },
  });

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Edit ${formatName(member)}`}
      description="Their name and contact details in your family."
      size="lg"
      className="pc-childform"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={form.isSubmitting}>
            Cancel
          </Button>
          <Button onClick={form.handleSubmit} loading={form.isSubmitting} disabled={!form.isDirty}>
            Save changes
          </Button>
        </>
      }
    >
      {form.submitError && (
        <Alert variant="error" className="pc-childform__alert">
          {form.submitError}
        </Alert>
      )}

      {!signedUp && (
        <Alert variant="info" className="pc-childform__alert">
          {first} hasn&apos;t set a password yet. If their email is wrong, correct it here and we&apos;ll send the invite to
          the new address.
        </Alert>
      )}

      <form onSubmit={form.handleSubmit} noValidate>
        <ProfileSection title="Their details">
          <div className="pf-grid">
            <Input label="First name" required autoComplete="off" {...form.getFieldProps('firstName')} />
            <Input label="Last name" required={isRequiredField('PARENT', 'lastName')} autoComplete="off" {...form.getFieldProps('lastName')} />
            <EmailInput
              label="Email"
              required
              autoComplete="off"
              readOnly={signedUp}
              hint={signedUp ? `${first} has signed up, so only they can change this - on their own My Profile.` : undefined}
              {...form.getFieldProps('email')}
            />
            <PhoneInput label="Phone" required={isRequiredField('PARENT', 'phone')} autoComplete="off" {...form.getFieldProps('phone')} />
          </div>
        </ProfileSection>
      </form>
    </Modal>
  );
}
