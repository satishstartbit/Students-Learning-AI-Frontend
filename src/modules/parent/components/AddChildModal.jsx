import { Alert, Button, Input, Modal } from '../../../components/common';
import { useForm } from '../../../hooks/useForm';
import { toast } from '../../../hooks/useToast';
import { required, email as emailRule, phone as phoneRule } from '../../../utils/validation';
import { formatName } from '../../../utils/format';
import RoleProfileFields from '../../auth/components/RoleProfileFields';
import { buildProfilePayload } from '../../auth/components/profilePayload';
import { usePhotoField } from '../../../hooks/usePhotoField';
import { ProfileHeaderCard, ProfileSection } from '../../profile/components/ProfileParts';
import parentService from '../services/parent.service';
import '../../profile/components/profile.css';
import './parentChildren.css';

const INITIAL_VALUES = { firstName: '', lastName: '', email: '', phone: '' };

/**
 * "+ Add Child" - creates the student account and links it to the signed-in
 * parent in one request, mirroring the Super Admin "Add child" flow
 * (superAdmin/components/ParentChildrenPanel.jsx) so the two stay in sync.
 *
 * Laid out like EditChildModal (and the parent's My Profile page): a photo
 * header card that fills in as the name is typed, then titled section cards
 * with fields two to a row.
 */
export default function AddChildModal({ isOpen, onClose, onCreated }) {
  const photo = usePhotoField();

  const form = useForm({
    initialValues: INITIAL_VALUES,
    validationSchema: {
      firstName: [required('Enter a first name')],
      email: [required('Enter an email address'), emailRule()],
      phone: [phoneRule()],
    },
    async onSubmit(values) {
      const { data } = await parentService.addChild({
        firstName: values.firstName,
        lastName: values.lastName || null,
        email: values.email,
        phone: values.phone || null,
        profile: buildProfilePayload('STUDENT', values),
        photoFile: photo.file,
      });

      toast.success(`Child added - username "${data.username}"`);
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
        Your child's account is created right away. They'll be emailed a link to set their own
        password, and you'll see their username as soon as they're added.
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
            <Input label="Email" type="email" required autoComplete="off" {...form.getFieldProps('email')} />
            <Input label="Phone" type="tel" autoComplete="off" {...form.getFieldProps('phone')} />
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
      </form>
    </Modal>
  );
}
