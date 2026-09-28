import { useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuEllipsisVertical, LuPlus } from 'react-icons/lu';
import {
  Avatar,
  Badge,
  Button,
  ConfirmationModal,
  Dropdown,
  EmptyState,
  ErrorState,
  Loader,
  PageHeader,
  StatusBadge,
} from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { useModal } from '../../../hooks/useModal';
import { toast } from '../../../hooks/useToast';
import { getErrorMessage } from '../../../utils/errorHandler';
import { formatName } from '../../../utils/format';
import { formatSubjects } from '../../invitations/invitationStatus';
import { SubjectChips } from '../../teacher/components/students/StudentBits';
import parentService from '../services/parent.service';
import AddChildModal from '../components/AddChildModal';
import EditChildModal from '../components/EditChildModal';
import ChildDetailsModal from '../components/ChildDetailsModal';
import InviteTeacherModal from '../components/InviteTeacherModal';
import SetChildPasswordModal from '../components/SetChildPasswordModal';
import '../components/parentChildren.css';

/**
 * A connected teacher and an invited one, as the same row shape.
 *
 * A teacher is connected to the child once, covering however many subjects
 * they teach them ("Ms Lee - Maths, Science"), so the per-subject links the
 * API returns are folded into one row per teacher and year here, rather than
 * the same teacher appearing once for every subject.
 */
function teacherRows(child) {
  const byTeacher = new Map();
  (child.teachers ?? []).forEach((t) => {
    const key = `${t.owner?.id ?? t.id}:${t.academicYear?.id ?? 'none'}`;
    const entry = byTeacher.get(key) ?? {
      key: `rel-${key}`,
      name: formatName(t.owner) || t.owner?.email || 'Teacher',
      subjects: [],
      year: t.academicYear?.name ?? null,
    };
    if (t.subject && !entry.subjects.includes(t.subject)) entry.subjects.push(t.subject);
    byTeacher.set(key, entry);
  });

  const connected = [...byTeacher.values()].map((entry) => ({
    key: entry.key,
    name: entry.name,
    meta: [formatSubjects(entry.subjects), entry.year].filter(Boolean).join(' · '),
    badge: { variant: 'success', label: 'Connected' },
    pending: false,
  }));

  // Only open invitations come back from the API (parent.service#listChildren):
  // requests still with Growing Focus for review, and invitations waiting on
  // the teacher. Nothing duplicates a row above - an accepted invitation has
  // already become a connection.
  const invited = (child.invitations ?? []).map((inv) => ({
    key: `inv-${inv.id}`,
    name: inv.teacher?.name || inv.teacherName || inv.teacherEmail,
    meta: [formatSubjects(inv.subjects), inv.academicYear?.name].filter(Boolean).join(' · '),
    badge:
      inv.status === 'awaiting_approval'
        ? { variant: 'info', label: 'Awaiting approval' }
        : inv.status === 'expired'
          ? { variant: 'neutral', label: 'Invite expired' }
          : { variant: 'warning', label: 'Invite sent' },
    pending: true,
  }));

  return [...connected, ...invited];
}

/** One child: who they are, what they're learning, and who teaches them. */
function ChildCard({ child, onProgress, onEdit, onSetPassword, onInvite, onView, onRemove }) {
  const rows = useMemo(() => teacherRows(child), [child]);

  // Subjects follow the teachers - the ones already teaching this child plus
  // the ones invited to - rather than being set on the child directly.
  const subjects = useMemo(() => {
    const fromTeachers = (child.teachers ?? []).map((t) => t.subject);
    const fromInvites = (child.invitations ?? []).flatMap((inv) => inv.subjects ?? []);
    return [...new Set([...fromTeachers, ...fromInvites].filter(Boolean))];
  }, [child.teachers, child.invitations]);

  const name = formatName(child);

  return (
    <article className="pc-card">
      <div className="pc-head">
        <Avatar src={child.profileImageUrl} name={name} size="lg" />

        <div className="pc-head__body">
          <h3 className="pc-name">{name}</h3>
          <p className="pc-meta">
            {[child.username ? `@${child.username}` : null, child.grade].filter(Boolean).join(' · ')}
          </p>
        </div>

        <Dropdown
          align="end"
          trigger={
            <button type="button" className="pc-kebab" aria-label={`More actions for ${name}`}>
              <LuEllipsisVertical aria-hidden="true" />
            </button>
          }
          items={[
            { key: 'progress', label: 'View progress', onClick: () => onProgress(child) },
            { key: 'invite', label: 'Invite a teacher', onClick: () => onInvite(child) },
            { key: 'divider', divider: true },
            { key: 'remove', label: 'Remove child', danger: true, onClick: () => onRemove(child) },
          ]}
        />
      </div>

      <div className="pc-chips">
        <StatusBadge status={child.status} />
        {child.emailVerified ? (
          <Badge variant="success" dot>
            Email verified
          </Badge>
        ) : (
          <Badge variant="warning" dot>
            Invite pending
          </Badge>
        )}
      </div>

      <div className="pc-rule" />

      <section className="pc-section">
        <p className="pc-section__label">Subjects</p>
        {subjects.length ? (
          <div className="pc-subjects">
            {/* Each subject in its own colour - the same tint as the teacher's lists. */}
            <SubjectChips subjects={subjects} />
          </div>
        ) : (
          <p className="pc-section__empty">Added by the teacher once they connect.</p>
        )}
      </section>

      <section className="pc-section">
        <p className="pc-section__label">Teachers</p>
        {rows.length ? (
          <ul className="pc-teachers">
            {rows.map((row) => (
              <li key={row.key} className={`pc-teacher${row.pending ? ' pc-teacher--pending' : ''}`}>
                <Avatar name={row.name} size="sm" />
                <span className="pc-teacher__body">
                  <span className="pc-teacher__name">{row.name}</span>
                  {row.meta && <span className="pc-teacher__meta">{row.meta}</span>}
                </span>
                <Badge variant={row.badge.variant}>{row.badge.label}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="pc-section__empty">No teachers connected yet.</p>
        )}

        <button type="button" className="pc-inline-action" onClick={() => onInvite(child)}>
          <LuPlus aria-hidden="true" />
          Invite a teacher
        </button>
      </section>

      {/* The mobile mockup's three: View details (outlined), Edit, Set password.
          View progress is in the ⋮ menu and on the Progress tab. */}
      <div className="pc-foot">
        <Button size="sm" variant="secondary" onClick={() => onView(child)}>
          View details
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onEdit(child)}>
          Edit
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onSetPassword(child)}>
          Set password
        </Button>
      </div>
    </article>
  );
}

/** /parent/children - the parent's "My Children" hub. */
export default function ParentChildrenPage() {
  const navigate = useNavigate();
  const children = useApi(parentService.listChildren);
  const { run: runChildren } = children;

  const addModal = useModal();
  const editModal = useModal();
  const detailsModal = useModal();
  const passwordModal = useModal();
  const inviteModal = useModal();
  const removeModal = useModal();

  const load = useCallback(() => runChildren({ limit: 100 }), [runChildren]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const handleRemove = async () => {
    try {
      await parentService.removeChild(removeModal.payload.id);
      toast.success('Child removed from your account');
      removeModal.close();
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const rows = children.data ?? [];
  const addButton = (
    <Button onClick={addModal.open}>
      <LuPlus aria-hidden="true" />
      Add child
    </Button>
  );

  return (
    <div className="td-page">
      <PageHeader
        title="My Children"
        description="Your children, their subjects and the teachers they are connected to."
        actions={addButton}
      />

      {children.isLoading && rows.length === 0 && <Loader message="Loading your children…" />}

      {children.error && rows.length === 0 && (
        <ErrorState title="We couldn't load your children" error={children.error} onRetry={() => load().catch(() => {})} />
      )}

      {!children.isLoading && rows.length === 0 && !children.error && (
        <EmptyState
          icon="👨‍👩‍👧"
          title="No children added yet"
          description="Add your first child to get started - you'll be able to invite their teachers and track their subjects right away."
          action={addButton}
        />
      )}

      {rows.length > 0 && (
        <div className="pc-grid">
          {rows.map((child) => (
            <ChildCard
              key={child.id}
              child={child}
              // The Progress page opens on this child rather than its own first one.
              onProgress={(c) => navigate(`/parent/progress?childId=${encodeURIComponent(c.id)}`)}
              onEdit={(c) => editModal.open(c.id)}
              onSetPassword={(c) => passwordModal.open(c)}
              onInvite={(c) => inviteModal.open(c)}
              onView={(c) => detailsModal.open(c.id)}
              onRemove={(c) => removeModal.open(c)}
            />
          ))}
        </div>
      )}

      <AddChildModal isOpen={addModal.isOpen} onClose={addModal.close} onCreated={load} />

      <EditChildModal
        key={`${editModal.payload ?? 'new'}-${editModal.isOpen}`}
        isOpen={editModal.isOpen}
        childId={editModal.payload}
        onClose={editModal.close}
        onUpdated={load}
      />

      <ChildDetailsModal
        isOpen={detailsModal.isOpen}
        childId={detailsModal.payload}
        onClose={detailsModal.close}
        onChanged={load}
      />

      <SetChildPasswordModal
        key={passwordModal.payload?.id}
        isOpen={passwordModal.isOpen}
        child={passwordModal.payload}
        onClose={passwordModal.close}
        onUpdated={load}
      />

      {/* Remounted per child so the fields start empty, and the child's own
          grade is what the modal defaults to. */}
      <InviteTeacherModal
        key={`invite-${inviteModal.payload?.id ?? 'none'}-${inviteModal.isOpen}`}
        isOpen={inviteModal.isOpen}
        child={inviteModal.payload}
        onClose={inviteModal.close}
        onInvited={load}
      />

      <ConfirmationModal
        isOpen={removeModal.isOpen}
        onClose={removeModal.close}
        onConfirm={handleRemove}
        title="Remove this child?"
        message={
          removeModal.payload
            ? `${formatName(removeModal.payload)} will be removed from your account. Their account itself is kept in case another parent or a teacher is still linked to it.`
            : ''
        }
        confirmLabel="Remove"
        variant="danger"
      />
    </div>
  );
}
