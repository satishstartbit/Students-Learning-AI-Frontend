import { LuCamera, LuPencil, LuPlus } from 'react-icons/lu';

/** "Add assignment" - opens the own-task dialog, typed or starting from a photo. */
export function AddTaskCard({ onAdd }) {
  return (
    <section className="sh-card" aria-labelledby="sh-add-title">
      <h2 id="sh-add-title" className="sh-eyebrow">
        <LuPlus size={13} aria-hidden="true" /> Add assignment
      </h2>
      <p className="sh-add__text">Track anything you need to get done.</p>
      <div className="sh-add__tiles">
        <button type="button" className="sh-add__tile" onClick={() => onAdd('type')}>
          <LuPencil size={16} aria-hidden="true" />
          <span className="sh-add__tile-title">Type it</span>
          <span className="sh-add__tile-hint">Add manually</span>
        </button>
        <button type="button" className="sh-add__tile" onClick={() => onAdd('photo')}>
          <LuCamera size={16} aria-hidden="true" />
          <span className="sh-add__tile-title">Add photo</span>
          <span className="sh-add__tile-hint">Snap to add</span>
        </button>
      </div>
    </section>
  );
}

export default AddTaskCard;
