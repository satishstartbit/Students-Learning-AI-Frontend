import { subjectPaint } from '../../../../components/subjects/subjectColor';
import { useSubjectColors } from '../../../../components/subjects/useSubjectColors';
import { getSubjectVisual } from '../subjectVisual';

/**
 * A subject's icon on a small rounded-square tile (Home task rows), in the
 * subject's own colour when one is known (Subjects master or the student's
 * choice), else its keyword tone. Decorative.
 */
export function SubjectTile({ subject }) {
  const { icon: Icon, tone } = getSubjectVisual(subject);
  const { colorOf } = useSubjectColors();
  return (
    <span className="sh-subject" data-tone={tone} {...subjectPaint(colorOf(subject))} aria-hidden="true">
      <Icon size={15} strokeWidth={2.1} />
    </span>
  );
}

export default SubjectTile;
