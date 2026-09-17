import { getSubjectVisual } from './subjectVisual';

const SIZES = { sm: 32, md: 40, lg: 48 };

/** A subject's icon on a coloured round tile - decorative, the subject name is printed nearby. */
export function SubjectIcon({ subject, size = 'md', className = '' }) {
  const { icon: Icon, tone } = getSubjectVisual(subject);
  const px = SIZES[size] ?? SIZES.md;

  return (
    <span
      aria-hidden="true"
      className={`ui-subject-icon ${className}`.trim()}
      data-tone={tone}
      style={{ width: px, height: px }}
    >
      <Icon size={Math.round(px * 0.5)} strokeWidth={2.25} />
    </span>
  );
}

export default SubjectIcon;
