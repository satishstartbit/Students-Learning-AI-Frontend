import { subjectPaint } from './subjectColor';
import { useSubjectColors } from './useSubjectColors';

/**
 * An element that shows a subject - a pill, a tile - painted in the
 * subject's colour when one is known (useSubjectColors), keeping the caller's
 * own class and keyword `tone` as the look for subjects without a colour.
 * For places that can't call a hook themselves (table column renderers).
 *
 *   <SubjectPill subject="Science" tone="green" className="pg-subject" />
 */
export function SubjectPill({ as: Tag = 'span', subject, tone, className, children, ...rest }) {
  const { colorOf } = useSubjectColors();
  return (
    <Tag className={className} data-tone={tone} {...subjectPaint(colorOf(subject))} {...rest}>
      {children ?? subject}
    </Tag>
  );
}

export default SubjectPill;
