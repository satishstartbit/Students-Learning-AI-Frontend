import { useState } from 'react';
import { AudioPlayer, Radio, Select, UploadButton } from '../../../components/common';
import { toast } from '../../../hooks/useToast';
import { getErrorMessage } from '../../../utils/errorHandler';
import { AUDIO_ACCEPT } from '../../../utils/file';
import assignmentService from '../services/assignment.service';

const TYPE_OPTIONS = [
  { value: 'none', label: 'No sound' },
  { value: 'library', label: 'Pick from the sound library' },
  { value: 'upload', label: 'Upload my own audio' },
];

/**
 * A task's optional background audio: none, a library track (managed by the
 * Super Admin), or the teacher's own uploaded file. It plays automatically
 * when the student opens the task, with pause/mute always visible.
 *
 * value: { type: 'none' } | { type: 'library', trackId, name?, url? } |
 *        { type: 'upload', fileId, name, url }
 * tracks: [{ id, name, description, url }] (active library tracks)
 * savedTrack: the task's current track if it's no longer in the library list.
 */
export default function BackgroundAudioField({ value, onChange, tracks = [], tracksLoading = false, savedTrack = null, error, disabled = false }) {
  const [uploading, setUploading] = useState(false);

  const allTracks = savedTrack && !tracks.some((t) => t.id === savedTrack.id) ? [...tracks, savedTrack] : tracks;
  const selectedTrack = value.type === 'library' ? allTracks.find((t) => t.id === value.trackId) : null;

  const upload = async (file) => {
    setUploading(true);
    try {
      const { data } = await assignmentService.uploadTaskMedia(file, 'audio');
      onChange({ type: 'upload', fileId: data.id, name: data.originalFilename, url: data.url });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const changeType = (type) => {
    if (type === 'none') onChange({ type: 'none' });
    else if (type === 'library') onChange({ type: 'library', trackId: value.type === 'library' ? value.trackId : '' });
    else onChange(value.type === 'upload' ? value : { type: 'upload', fileId: '', name: '', url: '' });
  };

  return (
    <div>
      <Radio name="background-audio-type" label="Background sound" value={value.type} onChange={(e) => changeType(e.target.value)} options={TYPE_OPTIONS} disabled={disabled} />

      {value.type === 'library' && (
        <Select
          label="Sound"
          placeholder="Choose a sound"
          loading={tracksLoading}
          disabled={disabled}
          value={value.trackId}
          error={error}
          hint={selectedTrack?.description ?? undefined}
          onChange={(e) => onChange({ type: 'library', trackId: e.target.value })}
          options={allTracks.map((t) => ({ value: t.id, label: savedTrack?.id === t.id && !tracks.some((x) => x.id === t.id) ? `${t.name} (no longer in the library)` : t.name }))}
        />
      )}

      {value.type === 'upload' && (
        <div className="ui-field">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
            <UploadButton accept={AUDIO_ACCEPT} onFile={upload} loading={uploading} disabled={disabled}>
              {value.fileId ? 'Replace audio file' : 'Upload audio file'}
            </UploadButton>
            <span className="ui-hint">{value.fileId ? value.name : 'MP3, WAV, OGG or M4A, up to 10 MB.'}</span>
          </div>
          {error && (
            <p className="ui-hint" role="alert" style={{ color: 'var(--color-danger-fg)' }}>
              {error}
            </p>
          )}
        </div>
      )}

      {value.type === 'library' && selectedTrack?.url && <AudioPlayer key={selectedTrack.url} src={selectedTrack.url} title={selectedTrack.name} className="ui-field" />}
      {value.type === 'upload' && value.url && <AudioPlayer key={value.url} src={value.url} title={value.name} className="ui-field" />}

      <p className="ui-hint" style={{ marginBottom: 0 }}>
        Plays on a loop when the student opens the task. They can always pause or mute it.
      </p>
    </div>
  );
}
