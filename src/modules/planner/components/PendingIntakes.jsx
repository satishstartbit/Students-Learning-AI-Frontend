import { useState } from 'react';
import { LuClock, LuMessageCircleQuestion } from 'react-icons/lu';
import { Button } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { formatDateTime } from '../../../utils/date';
import intakeService from '../services/intake.service';
import AddWorkDialog from './AddWorkDialog';

const METHOD = { typed: 'Typed', voice: 'Voice note', photo: 'Photo', document: 'PDF' };

/**
 * Added work still waiting for a person - "one quick question" or still being
 * read - so nothing added is ever silently lost (PDF Q4). Renders nothing
 * when there is nothing waiting.
 */
export function PendingIntakes({ studentId, guided = false, onChanged }) {
  const list = useApi(intakeService.listIntakes, { immediate: true, args: [studentId ? { studentId } : {}] });
  const [open, setOpen] = useState(null);
  const items = (list.data ?? []).filter((i) => i.status !== 'created' && i.status !== 'cancelled');
  if (!items.length) return null;

  const reload = () => list.run(studentId ? { studentId } : {}).catch(() => {});

  return (
    <section className="pl-card" aria-labelledby="pl-pending-title">
      <div className="pl-card__head">
        <div>
          <h2 id="pl-pending-title" className="pl-card__title">
            Waiting for you
          </h2>
          <p className="pl-card__sub">Work you added that needs a quick answer.</p>
        </div>
      </div>
      <ul className="pl-list">
        {items.map((i) => {
          const reading = i.status === 'received' || i.status === 'extracting';
          return (
            <li key={i.id} className="pl-item">
              {reading ? <LuClock size={18} aria-hidden="true" /> : <LuMessageCircleQuestion size={18} aria-hidden="true" />}
              <div className="pl-item__main">
                <p className="pl-item__title">{i.fields?.title?.value || `${METHOD[i.method] ?? 'Work'} added`}</p>
                <p className="pl-item__meta">
                  {reading ? 'Still reading…' : i.uncertain.length ? `${i.uncertain.length} thing${i.uncertain.length === 1 ? '' : 's'} to check` : 'Ready to add'} ·{' '}
                  {formatDateTime(i.createdAt)}
                </p>
              </div>
              <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(i)}>
                {reading ? 'Open' : 'Answer'}
              </Button>
            </li>
          );
        })}
      </ul>
      <AddWorkDialog
        isOpen={Boolean(open)}
        intake={open}
        guided={guided}
        studentId={studentId}
        onClose={() => setOpen(null)}
        onAdded={() => {
          reload();
          onChanged?.();
        }}
      />
    </section>
  );
}

export default PendingIntakes;
