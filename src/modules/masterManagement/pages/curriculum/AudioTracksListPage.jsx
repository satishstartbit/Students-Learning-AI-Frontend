import { useEffect, useRef, useState } from 'react';
import { Button } from '../../../../components/common';
import CurriculumMasterList from '../../components/CurriculumMasterList';
import { audioTrackService } from '../../services/curriculum.service';

/** One shared <audio> for "Listen" previews, so starting one stops the last. */
function usePreview() {
  const [playingId, setPlayingId] = useState(null);
  const audioRef = useRef(null);
  useEffect(() => () => audioRef.current?.pause(), []);

  const toggle = (row) => {
    if (!row.url || typeof Audio === 'undefined') return;
    audioRef.current ??= new Audio();
    const audio = audioRef.current;
    if (playingId === row.id) {
      audio.pause();
      setPlayingId(null);
      return;
    }
    audio.src = row.url;
    audio.onended = () => setPlayingId(null);
    audio.play().then(() => setPlayingId(row.id)).catch(() => setPlayingId(null));
  };
  return { playingId, toggle };
}

export default function AudioTracksListPage() {
  const preview = usePreview();

  const columns = [
    {
      key: 'name',
      header: 'Sound',
      sortable: true,
      render: (row) => (
        <div>
          <strong>{row.name}</strong>
          {row.description && <div className="ui-hint">{row.description}</div>}
        </div>
      ),
    },
    { key: 'source', header: 'Source', render: (row) => (row.sourceType === 'upload' ? `Uploaded file${row.file ? ` (${row.file.originalFilename})` : ''}` : 'Link') },
    { key: 'display_order', header: 'Order', sortable: true, render: (row) => row.displayOrder },
  ];

  return (
    <CurriculumMasterList
      title="Background Audio"
      description="Sounds a teacher can play in the background while a student works on a task."
      noun="sound"
      basePath="/admin/masters/audio-tracks"
      service={audioTrackService}
      columns={columns}
      rowActions={(row) => (
        <Button size="sm" variant="secondary" onClick={() => preview.toggle(row)} disabled={!row.url} aria-pressed={preview.playingId === row.id}>
          {preview.playingId === row.id ? 'Stop' : 'Listen'}
        </Button>
      )}
    />
  );
}
