import { useEffect, useRef, useState } from 'react';
import { LuCheck, LuPause, LuPlay } from 'react-icons/lu';
import { Modal } from '../../../../components/common';
import { formatClock } from '../../hooks/useFocusTimer';
import ExerciseMedia from './ExerciseMedia';
import { exerciseFromTool, toneOf } from './exerciseGroups';

/**
 * A guided run-through of one Regulation Toolkit exercise (Master Management
 * > Regulation Activities): how to do it on top - its video, picture or
 * sound, else the built-in picture of the steps (ExerciseMedia, the same as
 * beside it on Focus; the picture moves while the countdown runs and holds
 * still when paused or done) - then its own instructions as numbered steps
 * and a countdown for the admin-set duration.
 *
 * The breathing category gets a slow expanding circle to breathe along with
 * (CSS only, stilled by prefers-reduced-motion).
 *
 * The runner is keyed by tool id and only mounted while the dialog is open,
 * so each exercise starts fresh without an effect resetting state.
 */

const RING = 130;
const STROKE = 10;

/** "Breathe in for 4 counts, hold for 4." -> numbered steps, so it reads as a list, not a wall. */
function toSteps(instructions) {
  return String(instructions ?? '')
    .split(/(?<=\.)\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function ExerciseRunner({ tool, onDone }) {
  const totalSeconds = Math.max(30, (tool.durationMinutes ?? 2) * 60);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  const tickRef = useRef(null);

  useEffect(() => {
    if (!running) return undefined;
    tickRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(tickRef.current);
  }, [running]);

  const remaining = Math.max(totalSeconds - elapsed, 0);
  const finished = remaining === 0;
  const radius = (RING - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const steps = toSteps(tool.instructions || tool.description);
  const isBreathing = /breath/i.test(tool.category ?? '');
  const exercise = exerciseFromTool(tool);

  return (
    <>
      <div className="fs-exercise__media">
        <ExerciseMedia exercise={exercise} tone={toneOf(exercise)} paused={!running || finished} />
      </div>
      <div className="fs-exercise">
        <div>
          {steps.length > 0 ? (
            <ol>
              {steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          ) : (
            <p style={{ margin: 0 }}>{tool.description}</p>
          )}
        </div>

        <div className="fs-exercise__ring" aria-hidden="true">
          <svg viewBox={`0 0 ${RING} ${RING}`}>
            <circle cx={RING / 2} cy={RING / 2} r={radius} fill="none" stroke="var(--color-bg-surface-sunken)" strokeWidth={STROKE} />
            <circle
              cx={RING / 2}
              cy={RING / 2}
              r={radius}
              fill="none"
              stroke="var(--accent-base)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - Math.min(elapsed / totalSeconds, 1))}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          {isBreathing && !finished ? <span className="fs-breath" /> : null}
          <span style={{ position: 'relative', fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {finished ? 'Done' : formatClock(remaining)}
          </span>
        </div>
      </div>

      <p aria-live="polite" style={{ margin: '14px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
        {finished ? 'Nice - take one more breath, then pick up where you left off.' : running ? 'Take your time.' : 'Paused.'}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)', justifyContent: 'flex-end', marginTop: 'var(--spacing-lg)' }}>
        {!finished && (
          <button type="button" className="fs-btn" onClick={() => setRunning((v) => !v)}>
            {running ? <LuPause size={15} aria-hidden="true" /> : <LuPlay size={15} aria-hidden="true" />}
            {running ? 'Pause' : 'Resume'}
          </button>
        )}
        <button type="button" className="fs-btn fs-btn--primary" onClick={() => onDone?.({ finished })}>
          <LuCheck size={15} aria-hidden="true" />
          {finished ? 'Back to focus' : 'I feel better'}
        </button>
      </div>
    </>
  );
}

export function ExerciseModal({ tool, isOpen, onClose, onDone }) {
  return (
    <Modal
      isOpen={isOpen && Boolean(tool)}
      onClose={onClose}
      title={tool?.name ?? 'Exercise'}
      description={tool ? `${tool.category} · ${tool.durationMinutes} min` : undefined}
      size="md"
    >
      {isOpen && tool && <ExerciseRunner key={tool.id} tool={tool} onDone={onDone} />}
    </Modal>
  );
}

export default ExerciseModal;
