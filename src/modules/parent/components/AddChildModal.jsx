import { Alert, Button, Checkbox, Input, Modal, PasswordInput } from '../../../components/common';
import LegalLinks from '../../../components/legal/LegalLinks';
import { fillPlaceholders, useLegalContent } from '../../../components/legal/useLegalContent';
import { useForm } from '../../../hooks/useForm';
import { toast } from '../../../hooks/useToast';
import { required, password as passwordRule, matches } from '../../../utils/validation';
import { formatName } from '../../../utils/format';
import RoleProfileFields from '../../auth/components/RoleProfileFields';
import { buildProfilePayload } from '../../auth/components/profilePayload';
import { usePhotoField } from '../../../hooks/usePhotoField';
import { ProfileHeaderCard, ProfileSection } from '../../profile/components/ProfileParts';
import parentService from '../services/parent.service';
import '../../profile/components/profile.css';
import './parentChildren.css';

// No time zone field: the child gets the parent's (parent.service#addChild),
// then their own device's once they sign in (hooks/useDeviceTimezone.js).
// No email or phone either: a child signs in with their username and the
// password set here, never an email or phone number.
const INITIAL_VALUES = { firstName: '', lastName: '', password: '', confirmPassword: '', guardianConsent: false };

const CONSENT_FALLBACK = "I am {{child}}'s parent or guardian. I agree to the Terms of Use and Privacy Policy for them.";

/**
 * "+ Add Child" - creates the student account and links it to the signed-in
 * parent in one request, mirroring the Super Admin "Add child" flow
 * (superAdmin/components/ParentFamilyPanel.jsx) so the two stay in sync.
 *
 * Laid out like EditChildModal (and the parent's My Profile page): a photo
 * header card that fills in as the name is typed, then titled section cards
 * with fields two to a row.
 */
export default function AddChildModal({ isOpen, onClose, onCreated }) {
  const photo = usePhotoField();
  // The admin's consent wording (Platform settings > Privacy Policy and Terms of Use).
  const { content: legal } = useLegalContent();

  const form = useForm({
    initialValues: INITIAL_VALUES,
    validationSchema: {
      firstName: [required('Enter a first name')],
      password: [required('Choose a password for your child'), passwordRule()],
      confirmPassword: [required('Type the password again'), matches('password')],
      // Phase 1 §12: the parent consents for the child (recorded with the documents' version).
      guardianConsent: [(value) => (value ? null : 'Please give your consent for your child')],
    },
    async onSubmit(values) {
      const { data } = await parentService.addChild({
        firstName: values.firstName,
        lastName: values.lastName || null,
        password: values.password,
        confirmPassword: values.confirmPassword,
        guardianConsent: values.guardianConsent === true,
        profile: buildProfilePayload('STUDENT', values),
        photoFile: photo.file,
      });

      toast.success(`Child added. They sign in with the username "${data.username}" and the password you chose.`);
      handleClose();
      onCreated?.();
    },
  });

  const handleClose = () => {
    form.reset(INITIAL_VALUES);
    photo.reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add a child"
      description="Create your child's account and tell their teachers a little about them."
      size="lg"
      className="pc-childform"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={form.isSubmitting}>
            Cancel
          </Button>
          <Button onClick={form.handleSubmit} loading={form.isSubmitting}>
            Add child
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
        Your child's account is ready as soon as you add them. They sign in with a username, which
        you'll see once they're added, and the password you choose below. No email or phone number
        is needed.
      </Alert>

      <form onSubmit={form.handleSubmit} noValidate>
        <ProfileHeaderCard
          // Names only - formatName falls back to the email, which reads oddly here.
          name={formatName({ firstName: form.values.firstName.trim(), lastName: form.values.lastName.trim() }, { fallback: '' })}
          placeholderName="New child"
          meta={form.values.grade || null}
          photoUrl={photo.previewUrl}
          onUpload={(file, error) => (file ? photo.onSelect(file) : toast.error(error))}
          canRemove={Boolean(photo.file)}
          onRemove={photo.onRemove}
          note={photo.file ? 'Saved when you add your child' : 'Optional photo · JPG, PNG, WEBP or HEIC'}
        />

        <ProfileSection title="Personal details">
          <div className="pf-grid">
            <Input label="First name" required autoComplete="off" {...form.getFieldProps('firstName')} />
            <Input label="Last name" autoComplete="off" {...form.getFieldProps('lastName')} />
          </div>
        </ProfileSection>

        <ProfileSection title="Sign-in" hint="Your child signs in with their username and this password.">
          <div className="pf-grid">
            <PasswordInput
              label="Password"
              required
              autoComplete="new-password"
              hint="8+ characters with upper case, lower case and a number"
              {...form.getFieldProps('password')}
            />
            <PasswordInput
              label="Confirm password"
              required
              autoComplete="new-password"
              {...form.getFieldProps('confirmPassword')}
            />
          </div>
        </ProfileSection>

        <ProfileSection title="About your child" hint="Helps teachers understand how your child learns best.">
          <RoleProfileFields
            role="STUDENT"
            layout="profile"
            getProps={form.getFieldProps}
            includeAdminOnly
            lookupFetcher={parentService.masterOptionsFetcher}
          />
        </ProfileSection>

        <ProfileSection title="Your consent">
          <Checkbox
            name="guardianConsent"
            label={fillPlaceholders(legal?.guardianConsentLabel || CONSENT_FALLBACK, {
              child: form.values.firstName.trim() || 'my child',
            })}
            checked={form.values.guardianConsent}
            onChange={(e) => form.setFieldValue('guardianConsent', e.target.checked)}
            error={form.touched.guardianConsent ? form.errors.guardianConsent : null}
          />
          <LegalLinks content={legal} />
        </ProfileSection>
      </form>
    </Modal>
  );
}
