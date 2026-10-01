import { useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuEllipsisVertical, LuPlus } from 'react-icons/lu';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  ConfirmationModal,
  Dropdown,
  EmptyState,
  ErrorState,
  Loader,
  PageHeader,
  SectionHeader,
  StatusBadge,
} from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { useAuth } from '../../../hooks/useAuth';
import { useModal } from '../../../hooks/useModal';
import { toast } from '../../../hooks/useToast';
import { getErrorMessage } from '../../../utils/errorHandler';
import { formatName } from '../../../utils/format';
import { formatSubjects } from '../../invitations/invitationStatus';
import { SubjectChips } from '../../teacher/components/students/StudentBits';
import { useViewingChild } from '../hooks/useViewingChild';
import parentService from '../services/parent.service';
import { childLimitReason } from '../familyLimits';
import { ParentsSection, PlanUsage } from '../components/FamilyParents';
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
function ChildCard({ child, isViewing, onProgress, onEdit, onSetPassword, onInvite, onView, onViewAs, onRemove, onArchive, onRestore }) {
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
            child.archived
              ? { key: 'restore', label: 'Restore child', onClick: () => onRestore(child) }
              : { key: 'archive', label: 'Archive child', onClick: () => onArchive(child) },
            { key: 'remove', label: 'Remove child', danger: true, onClick: () => onRemove(child) },
          ]}
        />
      </div>

      <div className="pc-chips">
        {isViewing && <Badge variant="primary">Viewing now</Badge>}
        {child.archived ? <Badge variant="neutral">Archived - history kept</Badge> : <StatusBadge status={child.status} />}
        {/* Children have no email to verify; what matters is whether they've signed in. */}
        {!child.lastLoginAt && (
          <Badge variant="warning" dot>
            Not signed in yet
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

      <div className="pc-foot">
        {!isViewing && (
          <Button size="sm" variant="primary" onClick={() => onViewAs(child)}>
            View as {child.firstName || name}
          </Button>
        )}
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

/**
 * /parent/children - "My Children": the plan's room, the children (subjects,
 * teachers, invitations) and the parents who share the plan. Replaces the
 * separate Family Members page; /parent/family redirects here.
 */
export default function ParentChildrenPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { viewingChild, setViewingChildId, refresh: refreshViewing } = useViewingChild();
  const children = useApi(parentService.listChildren);
  const { run: runChildren } = children;
  // Plan usage, the Add child limit (max_students) and the family's parents.
  const family = useApi(parentService.getFamily);
  const { run: runFamily } = family;
  const reloadFamily = useCallback(() => runFamily().catch(() => {}), [runFamily]);

  const addModal = useModal();
  const editModal = useModal();
  const detailsModal = useModal();
  const passwordModal = useModal();
  const inviteModal = useModal();
  const removeModal = useModal();
  const archiveModal = useModal();

  const load = useCallback(() => {
    refreshViewing(); // keep the sidebar picker in sync
    reloadFamily(); // the children count in the plan usage
    return runChildren({ limit: 100 });
  }, [runChildren, refreshViewing, reloadFamily]);

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

  // Archive / restore (PDF Q12): the same child, all history kept either way.
  const handleArchive = async () => {
    try {
      await parentService.archiveChild(archiveModal.payload.id);
      toast.success(`${formatName(archiveModal.payload)} is archived - everything they saved is kept`);
      archiveModal.close();
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };
  const handleRestore = async (child) => {
    try {
      await parentService.restoreChild(child.id);
      toast.success(`${formatName(child)} is back - their plan is being updated`);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const rows = children.data ?? [];
  const limitReason = childLimitReason(family.data);
  const addButton = (
    <Button onClick={addModal.open} disabled={Boolean(limitReason)}>
      <LuPlus aria-hidden="true" />
      Add child
    </Button>
  );

  return (
    <div className="td-page">
      <PageHeader
        title="My Children"
        description="Your children, the teachers they are connected to, and the parents who share your plan."
      />

      <PlanUsage family={family.data} />

      <section className="pm-block" aria-label="Children">
        <SectionHeader
          className="pm-sectionhead"
          title="Children"
          description="Their subjects and the teachers they are connected to."
          actions={addButton}
        />

        {limitReason && (
          <Alert variant="warning" className="pm-notice">
            {limitReason}
          </Alert>
        )}

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
                isViewing={viewingChild?.id === child.id}
                onProgress={(c) => {
                  setViewingChildId(c.id);
                  navigate('/parent/progress');
                }}
                onViewAs={(c) => setViewingChildId(c.id)}
                onEdit={(c) => editModal.open(c.id)}
                onSetPassword={(c) => passwordModal.open(c)}
                onInvite={(c) => inviteModal.open(c)}
                onView={(c) => detailsModal.open(c.id)}
                onRemove={(c) => removeModal.open(c)}
                onArchive={(c) => archiveModal.open(c)}
                onRestore={handleRestore}
              />
            ))}
          </div>
        )}
      </section>

      <ParentsSection family={family} currentUserId={user?.id} onChanged={reloadFamily} />

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

      <ConfirmationModal
        isOpen={archiveModal.isOpen}
        onClose={archiveModal.close}
        onConfirm={handleArchive}
        title="Archive this child?"
        message={
          archiveModal.payload
            ? `${formatName(archiveModal.payload)} keeps their account and everything they saved, and you can both still read it. They won't take a place on your plan, and planning and AI help stop for them. You can restore them at any time.`
            : ''
        }
        confirmLabel="Archive"
      />
    </div>
  );
}
