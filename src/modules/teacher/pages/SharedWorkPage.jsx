import { useState } from 'react';
import { Badge, Button, Card, EmptyState, ErrorState, Loader, PageHeader } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { toast } from '../../../hooks/useToast';
import { formatDate, formatDateKey } from '../../../utils/date';
import { getErrorMessage } from '../../../utils/errorHandler';
import { formatName } from '../../../utils/format';
import { adoptSharedWork as adopt, listSharedWork as listShared } from '../services/sharedWork.service';

const SOURCE = { student: 'Added by the student', parent: 'Added by a parent' };
const METHOD = { typed: 'typed', voice: 'voice note', photo: 'photo', document: 'PDF' };

/**
 * /teacher/shared-work - students' own work shared with this teacher on
 * purpose (PDF Q15). Nothing else of a student's own work is visible here.
 * "Take this on" makes it teacher-verified while keeping who added it.
 */
export default function SharedWorkPage() {
  const shared = useApi(listShared, { immediate: true });
  const [busy, setBusy] = useState(null);

  const takeOn = async (item) => {
    setBusy(item.shareId);
    try {
      await adopt(item.shareId);
      toast.success(`You’ve taken on “${item.work.title}”`);
      await shared.run();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  if (shared.isLoading && !shared.data) return <Loader message="Loading shared work…" />;

  return (
    <div className="td-page">
      <PageHeader title="Shared with me" description="Work your students chose to show you. They can stop sharing at any time." />
      {shared.error && !shared.data ? (
        <ErrorState error={shared.error} onRetry={() => shared.run().catch(() => {})} />
      ) : !shared.data?.length ? (
        <EmptyState icon="🤝" title="Nothing shared with you yet" description="When a student shares one of their own tasks with you, it shows up here." />
      ) : (
        <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
          {shared.data.map((item) => (
            <Card
              key={item.shareId}
              title={item.work.title}
              subtitle={`${item.student ? formatName(item.student) : 'A student'} · shared ${formatDate(item.sharedAt)}`}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                <Badge variant="neutral">
                  {SOURCE[item.work.source] ?? 'Added by the family'}
                  {item.work.intakeMethod && METHOD[item.work.intakeMethod] ? ` · ${METHOD[item.work.intakeMethod]}` : ''}
                </Badge>
                {item.work.subject && <Badge variant="info">{item.work.subject}</Badge>}
                {item.work.dueDate && <Badge variant="warning">Due {formatDateKey(item.work.dueDate)}</Badge>}
                {item.work.stepsTotal > 0 && (
                  <Badge variant="neutral">
                    {item.work.stepsDone}/{item.work.stepsTotal} steps
                  </Badge>
                )}
                {item.work.adoptedByMe && <Badge variant="success">You’ve taken this on</Badge>}
              </div>
              {item.note && <p className="ui-hint">“{item.note}”</p>}
              {item.work.description && (
                <p className="ui-hint" style={{ whiteSpace: 'pre-wrap' }}>
                  {item.work.description.slice(0, 600)}
                </p>
              )}
              {!item.work.adoptedByMe && (
                <Button size="sm" variant="secondary" loading={busy === item.shareId} onClick={() => takeOn(item)}>
                  Take this on
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
