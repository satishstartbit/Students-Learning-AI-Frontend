import { useCallback, useEffect } from 'react';
import { Alert, Button, Input, Loader, Modal, SectionHeader } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { useForm } from '../../../hooks/useForm';
import { toast } from '../../../hooks/useToast';
import { required, email as emailRule } from '../../../utils/validation';
import { getErrorMessage } from '../../../utils/errorHandler';
import RoleProfileFields from '../../auth/components/RoleProfileFields';
import AddressFields from '../../auth/components/AddressFields';
import { buildProfilePayload } from '../../auth/components/profilePayload';
import { usePhotoField } from '../../../hooks/usePhotoField';
import parentService from '../services/parent.service';

/** "Reading, Writing" -> ["Reading", "Writing"] for the master multi-selects. */
const splitCsv = (v) =>
  v ? String(v).split(',').map((s) => s.trim()).filter(Boolean) : [];

function valuesFromChild(child) {
  return {
    firstName: child?.firstName ?? '',
    lastName: child?.lastName ?? '',
    email: child?.email ?? '',
    phone: child?.phone ?? '',
    address: child?.address ?? '',
    city: child?.city ?? '',
    state: child?.state ?? '',
    country: child?.country ?? '',
    postalCode: child?.postalCode ?? '',
    grade: child?.profile?.grade ?? '',
    date_of_birth: child?.profile?.date_of_birth ?? '',
    gender: child?.profile?.gender ?? '',
    preferred_working_style: child?.profile?.preferred_working_style ?? '',
    focus_habits: child?.profile?.focus_habits ?? '',
    // Stored as CSV text; the master multi-selects want arrays.
    // buildProfilePayload('STUDENT', ...) re-joins them on submit.
    strengths: splitCsv(child?.profile?.strengths),
    challenges: splitCsv(child?.profile?.challenges),
    interests: splitCsv(child?.profile?.interests),
    subjects: splitCsv(child?.profile?.subjects),
    profile_notes: child?.profile?.profile_notes ?? '',
  };
}

/**
 * Edits a child's own details - grade, profile fields and photo.
 *
 * Takes only the child's id: the list card doesn't carry the full profile, so
 * this fetches the same detail `parentService.getChild` returns for "View
 * Details" and seeds the form from it once it arrives.
 */
export default function EditChildModal({ isOpen, childId, onClose, onUpdated }) {
  const detail = useApi(parentService.getChild);
  const child = detail.data;
  const photo = usePhotoField(child?.profile?.profileImageUrl ?? null);

  const load = useCallback(() => {
    if (childId) detail.run(childId).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId]);

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, load]);

  const form = useForm({
    initialValues: valuesFromChild(null),
    validationSchema: {
      firstName: [required('Enter a first name')],
      email: [required('Enter an email address'), emailRule()],
    },
    async onSubmit(values) {
      await parentService.updateChild(childId, {
        firstName: values.firstName,
        lastName: values.lastName || null,
        email: values.email,
        phone: values.phone || null,
        address: values.address || null,
        city: values.city || null,
        state: values.state || null,
        country: values.country || null,
        postalCode: values.postalCode || null,
        profile: buildProfilePayload('STUDENT', values),
        photoFile: photo.file,
      });

      toast.success('Child updated');
      onClose();
      onUpdated?.();
    },
  });

  // Re-seed the form once the child's detail has loaded.
  useEffect(() => {
    if (child) form.reset(valuesFromChild(child));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [child]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={child ? `Edit ${child.firstName}` : 'Edit child'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={form.isSubmitting}>
            Cancel
          </Button>
          <Button onClick={form.handleSubmit} loading={form.isSubmitting} disabled={!child}>
            Save changes
          </Button>
        </>
      }
    >
      {detail.isLoading && !child && <Loader message="Loading child…" />}
      {detail.error && <Alert variant="error">{getErrorMessage(detail.error)}</Alert>}

      {form.submitError && (
        <Alert variant="error" className="ui-field">
          {form.submitError}
        </Alert>
      )}

      {child && (
        <form onSubmit={form.handleSubmit} noValidate>
          <Input label="First name" required {...form.getFieldProps('firstName')} />
          <Input label="Last name" {...form.getFieldProps('lastName')} />
          <Input label="Email" type="email" required {...form.getFieldProps('email')} />
          <Input label="Phone" type="tel" {...form.getFieldProps('phone')} />

          <SectionHeader title="Address" as="h3" />
          <AddressFields values={form.values} getProps={form.getFieldProps} setFieldValue={form.setFieldValue} />

          <SectionHeader title="About your child" as="h3" />
          <RoleProfileFields
            role="STUDENT"
            getProps={form.getFieldProps}
            photo={photo}
            includeAdminOnly
            lookupFetcher={parentService.masterOptionsFetcher}
          />
        </form>
      )}
    </Modal>
  );
}
