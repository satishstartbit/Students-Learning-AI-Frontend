/** The paper banner at the top of each K-5 page: picture, title, one short line. */
export function KidPageHeader({ icon: Icon, title, subtitle, children }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-5 rounded-[1.75rem] bg-kid-sheet p-5 shadow-paper sm:p-7">
      <div className="flex min-w-0 items-center gap-4">
        {Icon && (
          <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-kid-paper-deep">
            <Icon className="size-10" />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="font-kid-display text-3xl font-semibold text-kid-ink sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-1 text-lg text-kid-ink-soft">{subtitle}</p>}
        </div>
      </div>
      {children}
    </header>
  );
}

export default KidPageHeader;
