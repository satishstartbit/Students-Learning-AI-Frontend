import { getSubjectVisual } from '../subjectVisual';

/** A subject's icon on a small rounded-square tone tile (Home task rows). Decorative. */
export function SubjectTile({ subject }) {
  const { icon: Icon, tone } = getSubjectVisual(subject);
  return (
    <span className="sh-subject" data-tone={tone} aria-hidden="true">
      <Icon size={15} strokeWidth={2.1} />
    </span>
  );
}

export default SubjectTile;
