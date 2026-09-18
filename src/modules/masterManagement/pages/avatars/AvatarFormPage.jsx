import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Button,
  ButtonGroup,
  Card,
  Checkbox,
  ImageUpload,
  Input,
  Label,
  Loader,
  PageHeader,
  Tabs,
} from '../../../../components/common';
import { useApi } from '../../../../hooks/useApi';
import { useForm } from '../../../../hooks/useForm';
import { usePhotoField } from '../../../../hooks/usePhotoField';
import { toast } from '../../../../hooks/useToast';
import { required } from '../../../../utils/validation';
import { AvatarArt } from '../../../student/components/personalize/AvatarArt';
import { AvatarPicture } from '../../../student/components/personalize/AvatarPicture';
import { AVATAR_OPTIONS, AVATAR_PREFIX } from '../../../student/components/personalize/avatarCatalog';
import appearanceService from '../../services/appearance.service';

/**
 * Avatars master - the buddies students choose from on "Make it yours"
 * (student pages: MakeItYoursPage.jsx / kid/KidMakeItYoursPage.jsx).
 *
 * A picture is one of:
 *   Built-in avatar   the drawn art (AvatarArt.jsx), stored as "avatar:<slug>"
 *   Upload            a PNG/JPG/WEBP stored privately (avatars.image_file_id)
 *   Image link        an https URL
 *
 * Same three-way picker the Student Rewards form uses for reward pictures.
 */

const IS_LINK = /^https?:\/\//i;

/** Which picture tab an existing avatar opens on, and its seed values. */
function pictureStateFor(existing) {
  if (existing?.imageFileId) return { source: 'upload', slug: 'bear', link: '' };
  const value = existing?.imageUrl ?? '';
  if (value.startsWith(AVATAR_PREFIX)) return { source: 'builtin', slug: value.slice(AVATAR_PREFIX.length), link: '' };
  if (IS_LINK.test(value)) return { source: 'link', slug: 'bear', link: value };
  return { source: 'builtin', slug: 'bear', link: '' };
}

function AvatarGrid({ value, onChange }) {
  return (
    <div
      role="radiogroup"
      aria-label="Built-in avatar"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))', gap: 'var(--spacing-sm)' }}
    >
      {AVATAR_OPTIONS.map((option) => {
        const selected = value === option.slug;
        return (
          <button
            key={option.slug}
            type="button"
            role="radio"
            aria-checked={selected}
            data-avatar={option.slug}
            onClick={() => onChange(option.slug)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '10px 6px 8px',
              borderRadius: 'var(--radius-md)',
              border: `2px solid ${selected ? 'var(--accent-base)' : 'var(--color-border-default)'}`,
              background: selected ? 'var(--accent-soft)' : 'var(--color-bg-surface)',
              cursor: 'pointer',
              font: 'inherit',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-primary)',
            }}
          >
            <AvatarArt slug={option.slug} size={48} />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function AvatarForm({ id, existing }) {
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const initialPicture = pictureStateFor(existing);

  const [source, setSource] = useState(initialPicture.source);
  const [slug, setSlug] = useState(initialPicture.slug);
  const [link, setLink] = useState(initialPicture.link);
  const [pictureError, setPictureError] = useState(null);
  const photo = usePhotoField(existing?.imageFileId ? existing.imageUrl : null);
  const [uploadRemoved, setUploadRemoved] = useState(false);

  const hasUpload = Boolean(photo.file) || (Boolean(existing?.imageFileId) && !uploadRemoved);

  const previewImage =
    source === 'builtin'
      ? `${AVATAR_PREFIX}${slug}`
      : source === 'upload'
        ? hasUpload
          ? photo.previewUrl
          : ''
        : link.trim();

  const pictureProblem = () => {
    if (source === 'upload' && !hasUpload) return 'Choose an image to upload';
    if (source === 'link' && !/^https?:\/\/\S+$/i.test(link.trim())) return 'Enter an image link starting with https://';
    return null;
  };

  const form = useForm({
    initialValues: {
      name: existing?.name ?? '',
      category: existing?.category ?? '',
      displayOrder: existing?.displayOrder ?? 0,
      isActive: existing?.isActive ?? true,
    },
    validationSchema: { name: [required('Enter an avatar name')] },
    async onSubmit(values) {
      const problem = pictureProblem();
      setPictureError(problem);
      if (problem) throw new Error(problem);

      const payload = {
        name: values.name,
        category: values.category || null,
        displayOrder: Number(values.displayOrder) || 0,
      };
      if (source === 'upload') {
        if (photo.file) payload.imageFile = photo.file;
      } else {
        payload.imageUrl = source === 'builtin' ? `${AVATAR_PREFIX}${slug}` : link.trim();
        if (existing?.imageFileId) payload.removeImage = true;
      }
      if (!isEdit) payload.isActive = values.isActive;

      const { data } = isEdit
        ? await appearanceService.avatars.update(id, payload)
        : await appearanceService.avatars.create(payload);

      toast.success(isEdit ? 'Avatar updated' : 'Avatar created');
      navigate('/admin/masters/avatars');
      return data;
    },
  });

  const pickSource = (next) => {
    setSource(next);
    setPictureError(null);
  };

  return (
    <Card>
      {form.submitError && form.submitError !== pictureError && (
        <Alert variant="error" className="ui-field">
          {form.submitError}
        </Alert>
      )}

      <form onSubmit={form.handleSubmit} noValidate>
        <Input label="Avatar name" required hint="Students see this under the picture" {...form.getFieldProps('name')} />

        <div className="ui-field">
          <Label required>Picture</Label>
          <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
            <Tabs
              activeKey={source}
              onChange={pickSource}
              items={[
                {
                  key: 'builtin',
                  label: 'Built-in avatar',
                  content: <AvatarGrid value={slug} onChange={setSlug} />,
                },
                {
                  key: 'upload',
                  label: 'Upload image',
                  content: (
                    <ImageUpload
                      name="avatar-image"
                      dropzoneLabel="Add an avatar image"
                      hint="A square picture works best. JPG, PNG or WEBP."
                      previews={hasUpload && photo.previewUrl ? [photo.previewUrl] : []}
                      files={photo.file ? [photo.file] : []}
                      error={photo.error}
                      onSelect={(eventOrFiles) => {
                        const file = Array.isArray(eventOrFiles) ? eventOrFiles[0] : eventOrFiles?.target?.files?.[0];
                        if (!file) return;
                        photo.onSelect(file);
                        setUploadRemoved(false);
                        setPictureError(null);
                      }}
                      onRemove={() => {
                        photo.onRemove();
                        setUploadRemoved(true);
                      }}
                    />
                  ),
                },
                {
                  key: 'link',
                  label: 'Image link',
                  content: (
                    <Input
                      aria-label="Image link"
                      placeholder="https://…/avatar.png"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                    />
                  ),
                },
              ]}
            />

            <div aria-live="polite">
              <span className="ui-label">Student preview</span>
              <div
                data-testid="avatar-preview"
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  gap: 6,
                  width: 150,
                  padding: '14px 8px',
                  borderRadius: 14,
                  border: '1px solid var(--color-border-default)',
                  background: 'var(--color-bg-surface)',
                  textAlign: 'center',
                }}
              >
                <AvatarPicture imageUrl={previewImage} size={72}>
                  <span className="ui-hint" style={{ margin: 0 }}>
                    No picture yet
                  </span>
                </AvatarPicture>
                <strong style={{ fontSize: 'var(--font-size-sm)' }}>{form.values.name || 'Avatar name'}</strong>
              </div>
            </div>
          </div>
          {pictureError && (
            <p className="ui-field-error" role="alert" style={{ color: 'var(--color-danger-fg)', margin: '6px 0 0' }}>
              {pictureError}
            </p>
          )}
        </div>

        <div className="grid gap-x-4 md:grid-cols-2">
          <Input label="Category" hint="Optional - groups avatars in the admin list" {...form.getFieldProps('category')} />
          <Input label="Display order" type="number" {...form.getFieldProps('displayOrder')} />
        </div>

        {!isEdit && <Checkbox name="isActive" label="Active" checked={form.values.isActive} onChange={form.handleChange} />}

        <ButtonGroup>
          <Button type="submit" loading={form.isSubmitting}>
            {isEdit ? 'Save changes' : 'Create avatar'}
          </Button>
          <Button as={Link} to="/admin/masters/avatars" variant="secondary">
            Cancel
          </Button>
        </ButtonGroup>
      </form>
    </Card>
  );
}

export default function AvatarFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { data: existing, isLoading, run: fetchItem } = useApi(appearanceService.avatars.getOne);

  useEffect(() => {
    if (isEdit) fetchItem(id).catch(() => {});
  }, [isEdit, id, fetchItem]);

  return (
    <>
      <PageHeader
        title={isEdit ? 'Edit avatar' : 'Add avatar'}
        description="Avatars students can choose from on their “Make it yours” page."
        breadcrumbs={[
          { label: 'Master Management', to: '/admin/masters' },
          { label: 'Avatars', to: '/admin/masters/avatars' },
          { label: isEdit ? 'Edit' : 'Create' },
        ]}
      />

      {isEdit && isLoading && !existing ? (
        <Loader message="Loading avatar…" />
      ) : (
        // Mounted once the record is in, so the picture picker seeds from it.
        <AvatarForm key={existing?.id ?? 'new'} id={id} existing={existing} />
      )}
    </>
  );
}
