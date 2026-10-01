import { useEffect, useRef, useState } from 'react';
import { LuMic, LuSquare } from 'react-icons/lu';
import { Alert, Button } from '../../../components/common';

const TYPES = ['audio/webm', 'audio/mp4', 'audio/ogg'];

const supported = () =>
  typeof window !== 'undefined' && typeof window.MediaRecorder !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);

const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/**
 * Records one short voice note in the browser (PDF Q13, Q14). Stops by
 * itself at `maxSeconds`. Hands back { blob, seconds }; nothing is uploaded
 * here. Without a microphone (or permission) it says so and the person can
 * type instead.
 */
export function VoiceRecorder({ maxSeconds = 90, onRecorded, guided = false }) {
  const [status, setStatus] = useState(supported() ? 'idle' : 'unsupported');
  const [seconds, setSeconds] = useState(0);
  const recorder = useRef(null);
  const stream = useRef(null);
  const timer = useRef(null);
  const startedAt = useRef(0);

  const release = () => {
    clearInterval(timer.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  };

  useEffect(
    () => () => {
      if (recorder.current?.state === 'recording') recorder.current.stop();
      release();
    },
    []
  );

  const stop = () => {
    if (recorder.current?.state === 'recording') recorder.current.stop();
  };

  const start = async () => {
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setStatus('denied');
      return;
    }
    const mimeType = TYPES.find((t) => window.MediaRecorder.isTypeSupported?.(t));
    const rec = new window.MediaRecorder(stream.current, mimeType ? { mimeType } : undefined);
    const chunks = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      const length = (Date.now() - startedAt.current) / 1000;
      release();
      setStatus('done');
      onRecorded?.({ blob: new Blob(chunks, { type: rec.mimeType || mimeType || 'audio/webm' }), seconds: Math.min(length, maxSeconds) });
    };
    recorder.current = rec;
    startedAt.current = Date.now();
    setSeconds(0);
    setStatus('recording');
    rec.start();
    timer.current = setInterval(() => {
      const elapsed = (Date.now() - startedAt.current) / 1000;
      setSeconds(elapsed);
      if (elapsed >= maxSeconds) stop();
    }, 250);
  };

  if (status === 'unsupported') {
    return <Alert variant="info">Voice notes don’t work in this browser. You can type it instead.</Alert>;
  }
  if (status === 'denied') {
    return <Alert variant="warning">We couldn’t use the microphone. Allow it in your browser settings, or type it instead.</Alert>;
  }

  return (
    <div className="pl-recorder">
      <span className="pl-recorder__clock" aria-live="off">
        {clock(seconds)} / {clock(maxSeconds)}
      </span>
      {status === 'recording' ? (
        <Button type="button" variant="danger" size={guided ? 'lg' : 'md'} startIcon={<LuSquare aria-hidden="true" />} onClick={stop}>
          Stop
        </Button>
      ) : (
        <Button type="button" size={guided ? 'lg' : 'md'} startIcon={<LuMic aria-hidden="true" />} onClick={start}>
          {status === 'done' ? 'Record again' : 'Start recording'}
        </Button>
      )}
      <span className="pl-muted">{status === 'recording' ? 'Say what the work is and when it’s due.' : 'Short is fine - up to a minute or so.'}</span>
    </div>
  );
}

export default VoiceRecorder;
