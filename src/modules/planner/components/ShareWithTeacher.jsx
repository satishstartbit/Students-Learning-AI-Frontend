import { useState } from 'react';
import { Button } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { toast } from '../../../hooks/useToast';
import { formatName } from '../../../utils/format';
import { getErrorMessage } from '../../../utils/errorHandler';
import supportService from '../services/support.service';

/**
 * Show one of your own tasks to one of your teachers - on purpose, and you
 * can stop sharing any time (PDF Q15). Teachers never see own tasks unless
 * they're shared. Renders nothing when the student has no linked teachers.
 */
export function ShareWithTeacher({ workId, studentId = 'me' }) {
  const teachers = useApi(supportService.listTeachers, { immediate: true, args: [studentId] });
  const shares = useApi(supportService.listShares, { immediate: true, args: [studentId, workId] });
  const [busy, setBusy] = useState(null);
  if (!teachers.data?.length) return null;

  const active = new Map((shares.data ?? []).filter((s) => s.status === 'active').map((s) => [s.teacher.id, s]));
  const toggle = async (teacher) => {
    setBusy(teacher.id);
    try {
      const current = active.get(teacher.id);
      if (current) await supportService.revokeShare(studentId, workId, current.id);
      else await supportService.shareWork(studentId, workId, { teacherId: teacher.id });
      toast.success(current ? `No longer shared with ${formatName(teacher)}` : `Shared with ${formatName(teacher)}`);
      await shares.run(studentId, workId);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="ui-field">
      <span className="ui-label">Share with a teacher</span>
      <p className="ui-hint" style={{ marginTop: 0 }}>
        Only the teacher you pick sees this task. You can stop sharing any time.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {teachers.data.map((t) => {
          const on = active.has(t.id);
          return (
            <Button key={t.id} type="button" size="sm" variant={on ? 'primary' : 'secondary'} aria-pressed={on} loading={busy === t.id} onClick={() => toggle(t)}>
              {on ? `Shared with ${formatName(t)}` : `Share with ${formatName(t)}`}
              {t.subjects?.length ? ` (${t.subjects.join(', ')})` : ''}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

export default ShareWithTeacher;
