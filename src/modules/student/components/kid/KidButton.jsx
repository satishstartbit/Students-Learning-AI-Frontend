import { Button } from '../../../../components/ui/button';
import { cn } from '../../../../lib/utils';

const VARIANTS = {
  // The chunky teal "Let's go!" button - it sits on a darker edge and presses down.
  primary:
    'border-0 bg-kid-teal text-white shadow-[0_5px_0_var(--kid-teal-deep)] hover:bg-[#238890] active:translate-y-[3px] active:shadow-[0_2px_0_var(--kid-teal-deep)]',
  soft: 'border-2 border-kid-edge bg-kid-sheet text-kid-navy shadow-[0_4px_0_var(--kid-edge)] hover:bg-white active:translate-y-[3px] active:shadow-[0_1px_0_var(--kid-edge)]',
};

const SIZES = {
  lg: 'h-14 gap-3 rounded-full px-7 text-xl',
  md: 'h-12 gap-2 rounded-full px-5 text-lg',
};

/**
 * The K-5 button: shadcn's <Button> with big, rounded, tactile styling -
 * at least 48px tall, so small fingers hit it. Pass `asChild` to render a
 * router <Link> with the same look. Give icons an explicit size class
 * (`size-6`) - shadcn's default only sizes icons that have none.
 */
export function KidButton({ variant = 'primary', size = 'lg', className, ...props }) {
  return (
    <Button
      className={cn(
        'font-kid-display font-semibold no-underline transition-[transform,box-shadow,background-color] duration-100',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    />
  );
}

export default KidButton;
