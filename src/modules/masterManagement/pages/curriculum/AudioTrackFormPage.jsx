import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  PageHeader,
  Card,
  Input,
  Textarea,
  Radio,
  Checkbox,
  Button,
  Alert,
  ButtonGroup,
  Loader,
  AudioPlayer,
  UploadButton,
} from '../../../../components/common';
import { useForm } from '../../../../hooks/useForm';
import { useApi } from '../../../../hooks/useApi';
import { toast } from '../../../../hooks/useToast';
import { getErrorMessage } from '../../../../utils/errorHandler';
import { required } from '../../../../utils/validation';
import { formatFileSize } from '../../../../utils/format';
import { AUDIO_ACCEPT } from '../../../../utils/file';
import { audioTrackService } from '../../services/curriculum.service';
import '../../components/masterPages.css';

const LIST_PATH = '/admin/masters/audio-tracks';
const SOURCE_OPTIONS = [
  { value: 'url', label: 'Link to an audio file', description: 'An https:// link, or a sound bundled with the site such as /audio/soft-rain.wav.' },
  { value: 'upload', label: 'Upload an audio file', description: 'MP3, WAV, OGG or M4A. Needs file storage to be configured.' },
];

const onlyWhen = (source, rule) => (value, values) => (values.sourceType === source ? rule(value, values) : null);

export default function AudioTrackFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const { data: existing, isLoading, error: loadError, run: fetchItem } = useApi(audioTrackService.get);
  const [uploaded, setUploaded] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isEdit) fetchItem(id).catch(() => {});
  }, [isEdit, id, fetchItem]);

  const form = useForm({
    initialValues: { name: '', description: '', sourceType: 'url', audioUrl: '', fileId: '', displayOrder: 0, isActive: true },
    validationSchema: {
      name: [required('Enter a name')],
      audioUrl: [onlyWhen('url', required('Enter the link to the audio file'))],
      fileId: [onlyWhen('upload', required('Upload an audio file'))],
    },
    async onSubmit(values) {
      const payload = {
        name: values.name.trim(),
        description: values.description.trim() || null,
        sourceType: values.sourceType,
        audioUrl: values.sourceType === 'url' ? values.audioUrl.trim() : null,
        fileId: values.sourceType === 'upload' ? values.fileId : null,
        displayOrder: Number(values.displayOrder) || 0,
      };
      if (!isEdit) payload.isActive = values.isActive;
      await (isEdit ? audioTrackService.update(id, payload) : audioTrackService.create(payload));
      toast.success(isEdit ? 'Sound updated' : 'Sound added');
      navigate(LIST_PATH);
    },
  });

  const { reset, setFieldValue } = form;
  useEffect(() => {
    if (!existing) return;
    reset({
      name: existing.name ?? '',
      description: existing.description ?? '',
      sourceType: existing.sourceType ?? 'url',
      audioUrl: existing.audioUrl ?? '',
      fileId: existing.file?.id ?? '',
      displayOrder: existing.displayOrder ?? 0,
      isActive: existing.isActive ?? true,
    });
  }, [existing, reset]);

  const upload = async (file) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await audioTrackService.upload(formData);
      setUploaded(data);
      setFieldValue('fileId', data.id);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  if (isEdit && isLoading && !existing) return <Loader message="Loading sound…" />;

  const { values } = form;
  const currentFile = uploaded ?? (existing?.file?.id === values.fileId ? existing.file : null);
  const previewUrl =
    values.sourceType === 'url'
      ? /^(https:\/\/|\/(?!\/))/.test(values.audioUrl.trim()) ? values.audioUrl.trim() : null
      : currentFile?.url ?? null;

  return (
    <div className="td-page">
      <PageHeader
        title={isEdit ? 'Edit sound' : 'Add sound'}
        breadcrumbs={[
          { label: 'Master Management', to: '/admin/masters' },
          { label: 'Background Audio', to: LIST_PATH },
          { label: isEdit ? 'Edit' : 'Create' },
        ]}
      />
      <Card className="ms-form">
        {loadError && <Alert variant="error" className="ui-field">{loadError.message}</Alert>}
        {form.submitError && <Alert variant="error" className="ui-field">{form.submitError}</Alert>}
        <form onSubmit={form.handleSubmit} noValidate>
          <Input label="Name" required hint="What teachers see, e.g. Soft Rain" {...form.getFieldProps('name')} />
          <Textarea label="Description" rows={2} {...form.getFieldProps('description')} />

          <Radio
            name="sourceType"
            label="Where the sound comes from"
            value={values.sourceType}
            onChange={form.handleChange}
            options={SOURCE_OPTIONS}
          />

          {values.sourceType === 'url' ? (
            <Input label="Audio link" required placeholder="https://… or /audio/…" {...form.getFieldProps('audioUrl')} />
          ) : (
            <div className="ui-field">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
                <UploadButton accept={AUDIO_ACCEPT} onFile={upload} loading={uploading}>
                  {currentFile ? 'Replace audio file' : 'Upload audio file'}
                </UploadButton>
                {currentFile && (
                  <span className="ui-hint">
                    {currentFile.originalFilename}
                    {currentFile.fileSize ? ` (${formatFileSize(currentFile.fileSize)})` : ''}
                  </span>
                )}
              </div>
              {form.touched.fileId && form.errors.fileId && (
                <p className="ui-hint" role="alert" style={{ color: 'var(--color-danger-fg)' }}>{form.errors.fileId}</p>
              )}
            </div>
          )}

          {previewUrl && <AudioPlayer key={previewUrl} src={previewUrl} title={values.name || 'Preview'} className="ui-field" />}

          <Input label="Display order" type="number" min="0" {...form.getFieldProps('displayOrder')} />
          {!isEdit && <Checkbox name="isActive" label="Active" checked={values.isActive} onChange={form.handleChange} />}
          <ButtonGroup>
            <Button type="submit" loading={form.isSubmitting}>{isEdit ? 'Save changes' : 'Add sound'}</Button>
            <Button as={Link} to={LIST_PATH} variant="secondary">Cancel</Button>
          </ButtonGroup>
        </form>
      </Card>
    </div>
  );
}
