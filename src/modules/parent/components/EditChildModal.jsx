import { useCallback, useEffect } from 'react';
import { Alert, Button, Input, Loader, Modal } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { useForm } from '../../../hooks/useForm';
import { toast } from '../../../hooks/useToast';
import { required } from '../../../utils/validation';
import { getErrorMessage } from '../../../utils/errorHandler';
import { formatName } from '../../../utils/format';
import RoleProfileFields from '../../auth/components/RoleProfileFields';
import AddressFields from '../../auth/components/AddressFields';
import { buildProfilePayload } from '../../auth/components/profilePayload';
import { usePhotoField } from '../../../hooks/usePhotoField';
import { ProfileHeaderCard, ProfileSection } from '../../profile/components/ProfileParts';
import parentService from '../services/parent.service';
import '../../profile/components/profile.css';
import './parentChildren.css';

/** "Reading, Writing" -> ["Reading", "Writing"] for the master multi-selects. */
const splitCsv = (v) =>
  v ? String(v).split(',').map((s) => s.trim()).filter(Boolean) : [];

function valuesFromChild(child) {
  return {
    firstName: child?.firstName ?? '',
    lastName: child?.lastName ?? '',
    // No email or phone: a child signs in with their username (backend strips both).
    // No time zone field: the child's own device sets it (hooks/useDeviceTimezone.js).
    addressLine2: child?.addressLine2 ?? '',
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
 *
 * Laid out like the parent's My Profile page (profile.css): a photo header
 * card, then titled section cards with fields two to a row, on the page
 * canvas. Unlike My Profile, the photo is saved with the rest of the form.
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
    },
    async onSubmit(values) {
      await parentService.updateChild(childId, {
        firstName: values.firstName,
        lastName: values.lastName || null,
        addressLine2: values.addressLine2 || null,
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

  const meta = child
    ? [child.username ? `@${child.username}` : null, form.values.grade || child.profile?.grade].filter(Boolean).join(' · ')
    : '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={child ? `Edit ${child.firstName}` : 'Edit child'}
      description="Nothing changes until you press Save changes."
      size="lg"
      className="pc-childform"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={form.isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={form.handleSubmit}
            loading={form.isSubmitting}
            disabled={!child || child.id !== childId}
          >
            Save changes
          </Button>
        </>
      }
    >
      {detail.isLoading && !child && <Loader message="Loading child…" />}
      {detail.error && <Alert variant="error">{getErrorMessage(detail.error)}</Alert>}

      {form.submitError && (
        <Alert variant="error" className="pc-childform__alert">
          {form.submitError}
        </Alert>
      )}

      {child && (
        <form onSubmit={form.handleSubmit} noValidate>
          <ProfileHeaderCard
            name={formatName(child)}
            meta={meta}
            photoUrl={photo.previewUrl}
            onUpload={(file, error) => (file ? photo.onSelect(file) : toast.error(error))}
            // Only a newly picked photo can be taken back; the saved one stays
            // until another replaces it.
            canRemove={Boolean(photo.file)}
            removeLabel="Undo"
            onRemove={photo.onRemove}
            note={photo.file ? 'New photo - saved with your changes' : 'Profile photo · JPG, PNG, WEBP or HEIC'}
          />

          <ProfileSection title="Personal details">
            <div className="pf-grid">
              <Input label="First name" required autoComplete="off" {...form.getFieldProps('firstName')} />
              <Input label="Last name" autoComplete="off" {...form.getFieldProps('lastName')} />
            </div>
          </ProfileSection>

          <ProfileSection title="Address">
            <AddressFields
              layout="profile"
              values={form.values}
              getProps={form.getFieldProps}
              setFieldValue={form.setFieldValue}
              recipient={[form.values.firstName, form.values.lastName].filter(Boolean).join(' ')}
            />
          </ProfileSection>

          <ProfileSection title={`About ${child.firstName}`} hint="Helps teachers understand how your child learns best.">
            <RoleProfileFields
              role="STUDENT"
              layout="profile"
              getProps={form.getFieldProps}
              includeAdminOnly
              lookupFetcher={parentService.masterOptionsFetcher}
            />
          </ProfileSection>
        </form>
      )}
    </Modal>
  );
}
