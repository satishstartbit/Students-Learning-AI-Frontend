import { subjectPaint } from '../../../../components/subjects/subjectColor';
import { useSubjectColors } from '../../../../components/subjects/useSubjectColors';
import { getSubjectVisual } from '../../../student/components/subjectVisual';
import { initialsOf, moodVisual } from './studentFormat';
import './teacherStudents.css';

/** Initials (or the profile photo) on a soft teal circle. */
export function StudentAvatar({ student, size = 'md' }) {
  return (
    <span className={`ts-avatar ${size === 'lg' ? 'ts-avatar--lg' : ''}`.trim()} aria-hidden="true">
      {student?.profileImageUrl ? <img src={student.profileImageUrl} alt="" /> : initialsOf(student?.firstName, student?.lastName)}
    </span>
  );
}

/**
 * Subjects as small tinted pills - each in its subject colour (Subjects
 * master) when it has one, the same colour students see; else its tone.
 */
export function SubjectChips({ subjects = [] }) {
  const { colorOf } = useSubjectColors();
  if (!subjects.length) return <span className="ts-muted">—</span>;
  return (
    <span className="ts-chips">
      {subjects.map((s) => (
        <span key={s} className="ts-chip ts-tone" data-tone={getSubjectVisual(s).tone} {...subjectPaint(colorOf(s))}>
          {s}
        </span>
      ))}
    </span>
  );
}

/** A check-in mood as a face on a coloured circle; dashed and empty when there's no check-in. */
export function MoodFace({ checkIn, size = 'md', label }) {
  const { icon: Icon, tone } = moodVisual(checkIn?.intensity);
  const empty = !checkIn;
  return (
    <span
      className={['ts-face', 'ts-tone', size === 'lg' && 'ts-face--lg', empty && 'ts-face--empty'].filter(Boolean).join(' ')}
      data-tone={empty ? 'none' : tone}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      title={label}
    >
      <Icon size={size === 'lg' ? 18 : 15} strokeWidth={2} />
    </span>
  );
}
