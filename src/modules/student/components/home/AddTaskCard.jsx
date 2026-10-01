import { LuCamera, LuFileText, LuMic, LuPencil, LuPlus } from 'react-icons/lu';

const TILES = [
  { mode: 'quick', icon: LuPencil, title: 'Type it', hint: 'Add manually' },
  { mode: 'voice', icon: LuMic, title: 'Say it', hint: 'Short voice note' },
  { mode: 'photo', icon: LuCamera, title: 'Add photo', hint: 'We read it for you' },
  { mode: 'document', icon: LuFileText, title: 'Add PDF', hint: 'From school' },
];

/**
 * "Add assignment" - every way in (PDF Q13): typed, voice, photo or PDF.
 * All four end the same way: work with personal steps and study times.
 */
export function AddTaskCard({ onAdd }) {
  return (
    <section className="sh-card" aria-labelledby="sh-add-title">
      <h2 id="sh-add-title" className="sh-eyebrow">
        <LuPlus size={13} aria-hidden="true" /> Add assignment
      </h2>
      <p className="sh-add__text">Track anything you need to get done.</p>
      <div className="sh-add__tiles">
        {TILES.map(({ mode, icon: Icon, title, hint }) => (
          <button key={mode} type="button" className="sh-add__tile" onClick={() => onAdd(mode)}>
            <Icon size={16} aria-hidden="true" />
            <span className="sh-add__tile-title">{title}</span>
            <span className="sh-add__tile-hint">{hint}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default AddTaskCard;
