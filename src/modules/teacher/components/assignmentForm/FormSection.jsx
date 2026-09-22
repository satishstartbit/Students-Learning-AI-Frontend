import { useId } from 'react';
import { LuChevronDown } from 'react-icons/lu';

/**
 * One collapsible card of the assignment form: title, a status chip
 * ("Complete", "Needs students", "2 questions"...), a one-line description
 * and a chevron. The body stays mounted while closed (just hidden) so
 * nothing typed into it is lost and pickers don't reload on every toggle.
 *
 * chip: { label, tone: 'success' | 'warning' | 'danger' | 'accent' | undefined }
 */
export default function FormSection({ title, description, chip, open, onToggle, children }) {
  const bodyId = useId();

  return (
    <section className={`af-section ${open ? 'af-section--open' : ''}`.trim()}>
      <button type="button" className="af-section__head" aria-expanded={open} aria-controls={bodyId} onClick={onToggle}>
        <span className="af-section__heading">
          <h2 className="af-section__title">
            {title}
            {chip && <span className={`af-chip ${chip.tone ? `af-chip--${chip.tone}` : ''}`.trim()}>{chip.label}</span>}
          </h2>
          {description && <p className="af-section__desc">{description}</p>}
        </span>
        <span className="af-section__chevron" aria-hidden="true">
          <LuChevronDown size={18} />
        </span>
      </button>

      <div id={bodyId} className="af-section__body" hidden={!open}>
        {children}
      </div>
    </section>
  );
}
