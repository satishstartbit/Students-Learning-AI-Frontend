import { Alert, Button, Input, Modal, SectionHeader } from '../../../components/common';
import { useForm } from '../../../hooks/useForm';
import { toast } from '../../../hooks/useToast';
import { required, email as emailRule } from '../../../utils/validation';
import RoleProfileFields from '../../auth/components/RoleProfileFields';
import { buildProfilePayload } from '../../auth/components/profilePayload';
import { usePhotoField } from '../../../hooks/usePhotoField';
import parentService from '../services/parent.service';

const INITIAL_VALUES = { firstName: '', lastName: '', email: '', phone: '' };

/**
 * "+ Add Child" - creates the student account and links it to the signed-in
 * parent in one request, mirroring the Super Admin "Add child" flow
 * (superAdmin/components/ParentChildrenPanel.jsx) so the two stay in sync.
 */
export default function AddChildModal({ isOpen, onClose, onCreated }) {
  const photo = usePhotoField();

  const form = useForm({
    initialValues: INITIAL_VALUES,
    validationSchema: {
      firstName: [required('Enter a first name')],
      email: [required('Enter an email address'), emailRule()],
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
      size="lg"
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
        <Alert variant="error" className="ui-field">
          {form.submitError}
        </Alert>
      )}

      <Alert variant="info" className="ui-field">
        Your child's account is created right away. They'll be emailed a link to set their own
        password, and you'll see their username as soon as they're added.
      </Alert>

      <form onSubmit={form.handleSubmit} noValidate>
        <Input label="First name" required {...form.getFieldProps('firstName')} />
        <Input label="Last name" {...form.getFieldProps('lastName')} />
        <Input label="Email" type="email" required {...form.getFieldProps('email')} />
        <Input label="Phone" type="tel" {...form.getFieldProps('phone')} />

        <SectionHeader title="About your child" as="h3" />
        <RoleProfileFields
          role="STUDENT"
          getProps={form.getFieldProps}
          photo={photo}
          includeAdminOnly
          lookupFetcher={parentService.masterOptionsFetcher}
        />
      </form>
    </Modal>
  );
}
