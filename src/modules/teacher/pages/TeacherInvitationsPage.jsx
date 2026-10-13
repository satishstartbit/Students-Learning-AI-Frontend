import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LuCalendarDays, LuCheck, LuCircleCheck, LuClock, LuHourglass, LuMailOpen, LuUserRound, LuUsers, LuX } from 'react-icons/lu';
import { Badge, Button, Card, EmptyState, ErrorState, Loader, Modal, PageHeader } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { toast } from '../../../hooks/useToast';
import { daysUntil, formatDate } from '../../../utils/date';
import { getErrorMessage } from '../../../utils/errorHandler';
import { invitationStatusOf } from '../../invitations/invitationStatus';
import invitationService from '../../invitations/services/teacherInvitation.service';
import DeclineFields from '../../invitations/components/DeclineFields';
import { StudentAvatar, SubjectChips } from '../components/students/StudentBits';
import { expiresSoon, expiryText, invitationCounts, inviterText, outcomeText } from '../components/invitations/invitationText';
import '../components/invitations/teacherInvitations.css';

/**
 * /teacher/invitations - parents' invitations to connect with their child,
 * for the signed-in teacher (matched by their account email). Pending ones
 * can be accepted or declined here - the same actions as the email link.
 * Accepting links the teacher to that student for the listed subjects.
 * Styled like My Students (avatar, subject chips in their colours) - CSS
 * `components/invitations/teacherInvitations.css` (`ti-`).
 */
function InvitationCard({ inv, busy, onAccept, onDecline }) {
  const status = invitationStatusOf(inv.status);
  const pending = inv.status === 'pending';
  const grade = inv.grade ?? inv.student?.grade;
  const daysLeft = pending ? daysUntil(inv.expiresAt) : null;

  return (
    <li className={`ti-card ${pending ? 'ti-card--pending' : 'ti-card--past'}`} data-status={inv.status}>
      <StudentAvatar student={inv.student} />
      <div className="ti-card__body">
        <div className="ti-card__top">
          <p className="ti-card__name">{inv.student?.firstName ?? 'A student'}</p>
          {grade && <span className="ti-card__grade">{grade}</span>}
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        <SubjectChips subjects={inv.subjects ?? []} />
        <p className="ti-card__meta">
          <span>
            <LuUserRound aria-hidden="true" />
            {inviterText(inv.invitedBy)}
          </span>
          {inv.academicYear?.name && (
            <span>
              <LuCalendarDays aria-hidden="true" />
              School year {inv.academicYear.name}
            </span>
          )}
          {pending ? (
            <span className={`ti-card__expiry ${expiresSoon(daysLeft) ? 'is-soon' : ''}`.trim()}>
              <LuClock aria-hidden="true" />
              {expiryText(daysLeft)} · {formatDate(inv.expiresAt)}
            </span>
          ) : (
            <span>
              <LuClock aria-hidden="true" />
              {outcomeText(inv.status, {
                respondedOn: inv.respondedAt ? formatDate(inv.respondedAt) : null,
                expiredOn: inv.expiresAt ? formatDate(inv.expiresAt) : null,
                sentOn: inv.createdAt ? formatDate(inv.createdAt) : null,
              })}
            </span>
          )}
        </p>
        {inv.status === 'declined' && inv.declineMessage && (
          <p className="ti-card__note">
            <strong>You told the family:</strong> “{inv.declineMessage}”
          </p>
        )}
      </div>
      {pending && (
        <div className="ti-card__actions">
          <Button variant="secondary" startIcon={<LuX aria-hidden="true" />} disabled={Boolean(busy)} onClick={() => onDecline(inv)}>
            Decline
          </Button>
          <Button startIcon={<LuCheck aria-hidden="true" />} loading={busy === `accept:${inv.id}`} disabled={Boolean(busy)} onClick={() => onAccept(inv)}>
            Accept
          </Button>
        </div>
      )}
    </li>
  );
}

function Stat({ icon, value, label, tone }) {
  return (
    <div className={`ti-stat ${tone ? `ti-stat--${tone}` : ''}`.trim()}>
      <span className="ti-stat__icon" aria-hidden="true">
        {icon}
      </span>
      <span>
        <span className="ti-stat__value">{value}</span>
        <span className="ti-stat__label">{label}</span>
      </span>
    </div>
  );
}

export default function TeacherInvitationsPage() {
  const list = useApi(invitationService.listMine, { immediate: true });
  const [busy, setBusy] = useState(null);
  const [declining, setDeclining] = useState(null);
  const [answer, setAnswer] = useState({ reason: '', sharedMessage: '' });

  const items = Array.isArray(list.data) ? list.data : [];
  const pending = items.filter((i) => i.status === 'pending');
  const past = items.filter((i) => i.status !== 'pending');
  const counts = invitationCounts(items);
  const reload = () => list.run().catch(() => {});

  const accept = async (inv) => {
    setBusy(`accept:${inv.id}`);
    try {
      await invitationService.accept(inv.id);
      toast.success(`You're now connected with ${inv.student?.firstName ?? 'the student'}`);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
      reload();
    } finally {
      setBusy(null);
    }
  };

  const confirmDecline = async () => {
    setBusy(`decline:${declining.id}`);
    try {
      await invitationService.decline(declining.id, answer);
      toast.success('Invitation declined - the parent has been told');
      setDeclining(null);
      setAnswer({ reason: '', sharedMessage: '' });
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="td-page ti-page">
      <PageHeader
        title="Invitations"
        description="Parents invite you to connect with their child. Accept to see that student on your Students page."
        actions={
          <Button as={Link} to="/teacher/students" variant="secondary" startIcon={<LuUsers aria-hidden="true" />}>
            My students
          </Button>
        }
      />

      {list.isLoading && !list.data ? (
        <Loader message="Loading invitations…" />
      ) : list.error && !list.data ? (
        <ErrorState title="We couldn't load your invitations" error={list.error} onRetry={reload} />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon="📬"
            title="No invitations yet"
            description="When a parent invites you to connect with their child, it will show up here and in your email."
          />
        </Card>
      ) : (
        <>
          <div className="ti-summary">
            <Stat icon={<LuMailOpen />} value={counts.pending} label="Waiting for you" tone={counts.pending ? 'warning' : undefined} />
            <Stat icon={<LuCircleCheck />} value={counts.accepted} label="Accepted" tone="success" />
            <Stat icon={<LuX />} value={counts.declined} label="Declined" tone="neutral" />
            <Stat icon={<LuHourglass />} value={counts.closed} label="Expired or withdrawn" tone="neutral" />
          </div>

          <section className="ti-section" aria-labelledby="ti-pending-title">
            <div className="ti-section__head">
              <h2 className="ti-section__title" id="ti-pending-title">
                Waiting for you <span className="ti-count">{pending.length}</span>
              </h2>
              <p className="ti-section__sub">Accepting connects you for the subjects shown. The family is told either way.</p>
            </div>
            {pending.length === 0 ? (
              <div className="ti-clear">
                <LuCircleCheck aria-hidden="true" />
                <div>
                  <p>You&apos;re all caught up.</p>
                  <p className="ti-clear__sub">New invitations will show up here and in your email.</p>
                </div>
                <Link to="/teacher/students">See your students</Link>
              </div>
            ) : (
              <ul className="ti-list" data-testid="pending-invitations">
                {pending.map((inv) => (
                  <InvitationCard key={inv.id} inv={inv} busy={busy} onAccept={accept} onDecline={setDeclining} />
                ))}
              </ul>
            )}
          </section>

          {past.length > 0 && (
            <section className="ti-section" aria-labelledby="ti-past-title">
              <div className="ti-section__head">
                <h2 className="ti-section__title" id="ti-past-title">
                  Earlier <span className="ti-count">{past.length}</span>
                </h2>
                <p className="ti-section__sub">Invitations you answered, and ones that expired or were withdrawn.</p>
              </div>
              <ul className="ti-list">
                {past.map((inv) => (
                  <InvitationCard key={inv.id} inv={inv} busy={busy} onAccept={accept} onDecline={setDeclining} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <Modal
        isOpen={Boolean(declining)}
        onClose={() => setDeclining(null)}
        title="Decline this invitation?"
        description={
          declining
            ? `${declining.invitedBy?.name ?? 'The parent'} will see that you declined, so they can follow up or correct a mistake.`
            : ''
        }
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeclining(null)} disabled={Boolean(busy)}>
              Back
            </Button>
            <Button variant="danger" loading={busy?.startsWith('decline:')} onClick={confirmDecline}>
              Decline
            </Button>
          </>
        }
      >
        <DeclineFields
          value={answer}
          onChange={setAnswer}
          familyName={declining?.invitedBy?.name ?? 'the family'}
        />
      </Modal>
    </div>
  );
}
