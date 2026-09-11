import { LuStar } from 'react-icons/lu';

/**
 * The one shared brand identity - an accent-filled mark plus wordmark - used
 * everywhere a per-role name/initials pair used to stand in for it (the
 * public auth pages had none at all; the sidebar header carried a different
 * short name and initials per role: "My Learning"/"ML" for Student,
 * "Teacher Portal"/"TP", "Family Portal"/"FP"). One mark now, sized by
 * context via `size`.
 *
 * "EFLP" is a placeholder wordmark (short for Executive Functioning Learning
 * Platform, this project's working name - see README.md and the
 * `eflp.*` localStorage key prefix) - swap `name` here once a real product
 * name is chosen; every consumer reads it from this one component.
 */
const SIZES = {
  sm: { icon: 24, gap: 8, font: 'var(--font-size-md)' },
  md: { icon: 36, gap: 10, font: 'var(--font-size-lg)' },
  lg: { icon: 44, gap: 12, font: 'var(--font-size-xl)' },
};

export function BrandMark({ name = 'EFLP', size = 'md', className = '' }) {
  const { icon, gap, font } = SIZES[size] ?? SIZES.md;

  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap }}
    >
      <span
        aria-hidden="true"
        style={{
          display: 'grid',
          placeContent: 'center',
          flex: 'none',
          width: icon,
          height: icon,
          borderRadius: '50%',
          background: 'var(--accent-base)',
          color: 'var(--accent-on)',
        }}
      >
        <LuStar size={Math.round(icon * 0.55)} fill="currentColor" strokeWidth={0} />
      </span>
      <span style={{ fontSize: font, fontWeight: 700, color: 'var(--color-text-primary)' }}>{name}</span>
    </span>
  );
}

export default BrandMark;
