import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { LuSmile } from 'react-icons/lu';
import {
  PageHeader,
  Card,
  Input,
  Textarea,
  Checkbox,
  Button,
  Alert,
  ButtonGroup,
  Loader,
  Select,
  Tabs,
  ImageUpload,
  Label,
  Modal,
} from '../../../../components/common';
import { useForm } from '../../../../hooks/useForm';
import { useApi } from '../../../../hooks/useApi';
import usePhotoField from '../../../../hooks/usePhotoField';
import { toast } from '../../../../hooks/useToast';
import { required, pattern, min } from '../../../../utils/validation';
import RewardArt from '../../../student/components/rewards/RewardArt';
import { StickerArt } from '../../../student/components/rewards/StickerArt';
import { STICKER_OPTIONS, STICKER_PREFIX } from '../../../student/components/rewards/stickerCatalog';
import rewardService from '../../services/reward.service';
import '../../components/masterPages.css';

// Loaded on first open - the emoji data set is a few hundred KB (same as IconField).
const EmojiPickerPanel = lazy(() => import('../../../assignments/media/EmojiPickerPanel'));

/**
 * Add / edit a collectible reward (Master Management -> Student Rewards, also
 * "Rewards -> Stickers & Emojis" in the sidebar). Whatever is saved here is
 * what students see on their Rewards pages (K-4 and Grade 6+) on next load:
 * active rewards only, collected automatically once a student's earned points
 * reach "Points required".
 *
 * Picture - one of four, previewed exactly as students see it (RewardArt):
 *   Built-in sticker   the drawn, animated stickers (StickerArt)
 *   Upload             a PNG/JPG/WEBP stored privately (backend rewards.image_file_id)
 *   Emoji              typed or picked
 *   Image link         an https URL
 */

const TYPE_OPTIONS = [
  { value: 'sticker', label: 'Sticker' },
  { value: 'emoji', label: 'Emoji' },
];

const IS_LINK = /^https?:\/\//i;

/** Which picture tab an existing reward opens on, and its seed values. */
function pictureStateFor(existing) {
  if (existing?.imageFileId) return { source: 'upload', stickerSlug: 'star', emoji: '', link: '' };
  const value = existing?.imageUrl ?? '';
  if (value.startsWith(STICKER_PREFIX)) return { source: 'builtin', stickerSlug: value.slice(STICKER_PREFIX.length), emoji: '', link: '' };
  if (IS_LINK.test(value)) return { source: 'link', stickerSlug: 'star', emoji: '', link: value };
  if (value) return { source: 'emoji', stickerSlug: 'star', emoji: value, link: '' };
  return { source: 'builtin', stickerSlug: 'star', emoji: '', link: '' };
}

function StickerGrid({ value, onChange }) {
  return (
    <div
      role="radiogroup"
      aria-label="Built-in sticker"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))', gap: 'var(--spacing-sm)' }}
    >
      {STICKER_OPTIONS.map((s) => {
        const selected = value === s.slug;
        return (
          <button
            key={s.slug}
            type="button"
            role="radio"
            aria-checked={selected}
            data-sticker={s.slug}
            onClick={() => onChange(s.slug)}
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
            <StickerArt slug={s.slug} style={{ width: 48, height: 48 }} />
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

function RewardForm({ id, existing }) {
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const initialPicture = pictureStateFor(existing);

  const [source, setSource] = useState(initialPicture.source);
  const [stickerSlug, setStickerSlug] = useState(initialPicture.stickerSlug);
  const [emoji, setEmoji] = useState(initialPicture.emoji);
  const [link, setLink] = useState(initialPicture.link);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pictureError, setPictureError] = useState(null);
  const photo = usePhotoField(existing?.imageFileId ? existing.imageUrl : null);
  const [uploadRemoved, setUploadRemoved] = useState(false);

  const hasUpload = Boolean(photo.file) || (Boolean(existing?.imageFileId) && !uploadRemoved);

  const previewImage =
    source === 'builtin'
      ? `${STICKER_PREFIX}${stickerSlug}`
      : source === 'upload'
        ? hasUpload
          ? photo.previewUrl
          : ''
        : source === 'emoji'
          ? emoji.trim()
          : link.trim();

  const pictureProblem = () => {
    if (source === 'upload' && !hasUpload) return 'Choose an image to upload';
    if (source === 'emoji' && (!emoji.trim() || [...emoji.trim()].length > 16 || /\s/.test(emoji.trim()))) return 'Pick or type one emoji';
    if (source === 'link' && !/^https?:\/\/\S+$/i.test(link.trim())) return 'Enter an image link starting with https://';
    return null;
  };

  const form = useForm({
    initialValues: {
      name: existing?.name ?? '',
      description: existing?.description ?? '',
      pointsRequired: existing?.pointsRequired ?? '',
      rewardType: existing?.rewardType === 'emoji' ? 'emoji' : 'sticker',
      displayOrder: existing?.displayOrder ?? 0,
      isActive: existing?.isActive ?? true,
    },
    validationSchema: {
      name: [required('Enter a reward name')],
      pointsRequired: [
        required('Enter the points required'),
        pattern(/^\d+$/, 'Enter a whole number'),
        min(0, 'Points must be 0 or more'),
      ],
    },
    async onSubmit(values) {
      const problem = pictureProblem();
      setPictureError(problem);
      if (problem) throw new Error(problem);

      const payload = {
        name: values.name,
        description: values.description || null,
        pointsRequired: Number(values.pointsRequired) || 0,
        rewardType: values.rewardType || 'sticker',
        displayOrder: Number(values.displayOrder) || 0,
      };
      if (source === 'upload') {
        if (photo.file) payload.imageFile = photo.file;
      } else {
        payload.imageUrl = source === 'builtin' ? `${STICKER_PREFIX}${stickerSlug}` : source === 'emoji' ? emoji.trim() : link.trim();
        if (existing?.imageFileId) payload.removeImage = true;
      }
      if (!isEdit) payload.isActive = values.isActive;

      const { data } = isEdit ? await rewardService.updateReward(id, payload) : await rewardService.createReward(payload);

      toast.success(isEdit ? 'Reward updated' : 'Reward created');
      navigate('/admin/masters/student-rewards');
      return data;
    },
  });

  const pickSource = (next) => {
    setSource(next);
    setPictureError(null);
  };

  return (
    <Card className="ms-form">
      {form.submitError && form.submitError !== pictureError && (
        <Alert variant="error" className="ui-field">
          {form.submitError}
        </Alert>
      )}

      <form onSubmit={form.handleSubmit} noValidate>
        <Input label="Reward name" required {...form.getFieldProps('name')} />
        <Textarea label="Description" hint="Optional - a short line students may see later" {...form.getFieldProps('description')} />

        <div className="grid gap-x-4 md:grid-cols-2">
          <Input
            label="Points required"
            type="number"
            required
            hint="Collected automatically once a student has earned this many points"
            {...form.getFieldProps('pointsRequired')}
          />
          <Select label="Shows under" hint="The Stickers or Emojis tab on the student Rewards page" options={TYPE_OPTIONS} required {...form.getFieldProps('rewardType')} />
        </div>

        <div className="ui-field">
          <Label required>Picture</Label>
          <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
            <Tabs
              activeKey={source}
              onChange={pickSource}
              items={[
                {
                  key: 'builtin',
                  label: 'Built-in sticker',
                  content: <StickerGrid value={stickerSlug} onChange={setStickerSlug} />,
                },
                {
                  key: 'upload',
                  label: 'Upload image',
                  content: (
                    <ImageUpload
                      name="reward-image"
                      dropzoneLabel="Add a sticker image"
                      hint="PNG with a transparent background looks best. JPG, PNG or WEBP."
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
                  key: 'emoji',
                  label: 'Emoji',
                  content: (
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Input aria-label="Emoji" placeholder="e.g. 🦄" value={emoji} onChange={(e) => setEmoji(e.target.value)} />
                      </div>
                      <Button type="button" variant="secondary" size="sm" startIcon={<LuSmile aria-hidden="true" />} onClick={() => setPickerOpen(true)}>
                        Pick emoji
                      </Button>
                    </div>
                  ),
                },
                {
                  key: 'link',
                  label: 'Image link',
                  content: <Input aria-label="Image link" placeholder="https://…/sticker.png" value={link} onChange={(e) => setLink(e.target.value)} />,
                },
              ]}
            />

            <div aria-live="polite">
              <span className="ui-label">Student preview</span>
              <div
                data-testid="reward-preview"
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
                <RewardArt imageUrl={previewImage} size={72} />
                <strong style={{ fontSize: 'var(--font-size-sm)' }}>{form.values.name || 'Reward name'}</strong>
                <span className="ui-hint" style={{ margin: 0 }}>
                  {form.values.pointsRequired !== '' ? `${form.values.pointsRequired} pts to unlock` : 'Set the points'}
                </span>
              </div>
            </div>
          </div>
          {pictureError && (
            <p className="ui-field-error" role="alert" style={{ color: 'var(--color-danger-fg)', margin: '6px 0 0' }}>
              {pictureError}
            </p>
          )}
        </div>

        <Input label="Display order" type="number" hint="Ties at the same points level are shown in this order" {...form.getFieldProps('displayOrder')} />

        {!isEdit && <Checkbox name="isActive" label="Active - students can see and collect it" checked={form.values.isActive} onChange={form.handleChange} />}

        <ButtonGroup>
          <Button type="submit" loading={form.isSubmitting}>
            {isEdit ? 'Save changes' : 'Create reward'}
          </Button>
          <Button as={Link} to="/admin/masters/student-rewards" variant="secondary">
            Cancel
          </Button>
        </ButtonGroup>
      </form>

      <Modal isOpen={pickerOpen} onClose={() => setPickerOpen(false)} title="Pick an emoji" size="md">
        <Suspense fallback={<Loader message="Opening picker…" />}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <EmojiPickerPanel
              onSelect={({ emoji: picked }) => {
                setEmoji(picked);
                setPickerOpen(false);
                setPictureError(null);
              }}
            />
          </div>
        </Suspense>
      </Modal>
    </Card>
  );
}

export default function StudentRewardFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { data: existing, isLoading, error, run: fetchItem } = useApi(rewardService.getReward);

  useEffect(() => {
    if (isEdit) fetchItem(id).catch(() => {});
  }, [isEdit, id, fetchItem]);

  return (
    <div className="td-page">
      <PageHeader
        title={isEdit ? 'Edit reward' : 'Add reward'}
        description="Stickers and emojis students collect on their Rewards page as their points grow."
        breadcrumbs={[
          { label: 'Master Management', to: '/admin/masters' },
          { label: 'Student Rewards', to: '/admin/masters/student-rewards' },
          { label: isEdit ? 'Edit' : 'Create' },
        ]}
      />
      {isEdit && error && !existing ? (
        <Alert variant="error">{error.message}</Alert>
      ) : isEdit && (isLoading || !existing) ? (
        <Loader message="Loading reward…" />
      ) : (
        // Keyed so the form (and its picture state) mounts once with the loaded record.
        <RewardForm key={existing?.id ?? 'new'} id={id} existing={isEdit ? existing : null} />
      )}
    </div>
  );
}
