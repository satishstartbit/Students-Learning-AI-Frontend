import { Link } from 'react-router-dom';
import { LuUserPlus } from 'react-icons/lu';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  ConfirmationModal,
  ErrorState,
  Loader,
  ProgressBar,
  SectionHeader,
} from '../../../components/common';
import { useModal } from '../../../hooks/useModal';
import { toast } from '../../../hooks/useToast';
import { getErrorMessage } from '../../../utils/errorHandler';
import { formatName } from '../../../utils/format';
import { formatPhoneForDisplay } from '../../../utils/phone';
import { parentLimitReason, usageLabel } from '../familyLimits';
import parentService from '../services/parent.service';
import AddParentModal from './AddParentModal';
import './parentFamily.css';

/** How full one of the plan's limits is. No bar when the plan sets no limit. */
function Usage({ label, limit, one, many }) {
  return (
    <div>
      <p className="pm-usage__label">
        {label}
        <span className="pm-usage__value">{usageLabel(limit, one, many)}</span>
      </p>
      {limit?.max != null && (
        <ProgressBar
          value={limit.used}
          max={limit.max}
          label={`${label} used`}
          variant={limit.used >= limit.max ? 'warning' : undefined}
        />
      )}
    </div>
  );
}

/** The plan's room: children and parents against the plan (GET /parent/family). */
export function PlanUsage({ family }) {
  if (!family) return null;
  return (
    <section className="pm-usage" aria-label="Plan usage">
      <p className="pm-usage__plan">
        {family.plan ? (
          <>
            Your plan: <strong>{family.plan.name}</strong>
          </>
        ) : (
          'No plan in force'
        )}
        {' · '}
        <Link to="/parent/subscription">View plan</Link>
      </p>
      <Usage label="Children" limit={family.children} one="child" many="children" />
      <Usage label="Parents" limit={family.parents} one="parent" many="parents" />
    </section>
  );
}

function MemberCard({ member, isYou, canRemove, onRemove }) {
  const name = formatName(member);
  return (
    <article className="pm-card">
      <div className="pm-head">
        <Avatar name={name} size="lg" />
        <div className="pm-head__body">
          <h3 className="pm-name">{name}</h3>
          <p className="pm-meta">{member.email}</p>
          {member.phone && <p className="pm-meta">{formatPhoneForDisplay(member.phone)}</p>}
        </div>
      </div>

      <div className="pm-chips">
        {member.isAccountHolder ? <Badge variant="primary">Account holder</Badge> : <Badge>Parent</Badge>}
        {isYou && <Badge variant="info">You</Badge>}
        {member.emailVerified ? (
          <Badge variant="success" dot>
            Signed up
          </Badge>
        ) : (
          <Badge variant="warning" dot>
            Invite pending
          </Badge>
        )}
      </div>

      {canRemove && (
        <div className="pm-foot">
          <Button size="sm" variant="ghost" onClick={() => onRemove(member)}>
            Remove from family
          </Button>
        </div>
      )}
    </article>
  );
}

/**
 * The parents who share this family's plan and children. The account holder
 * adds and removes parents; everyone else sees the list.
 *
 * `family` is the useApi result for GET /parent/family; `onChanged` reloads it.
 */
export function ParentsSection({ family, currentUserId, onChanged }) {
  const addModal = useModal();
  const removeModal = useModal();
  const data = family.data;
  const blockedReason = parentLimitReason(data);

  const handleRemove = async () => {
    try {
      await parentService.removeFamilyParent(removeModal.payload.id);
      toast.success(`${formatName(removeModal.payload)} removed from your family`);
      removeModal.close();
      await onChanged();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const addButton = data?.isAccountHolder ? (
    <Button onClick={addModal.open} disabled={!data.parents?.canAdd}>
      <LuUserPlus aria-hidden="true" />
      Add parent
    </Button>
  ) : null;

  return (
    <section className="pm-block" aria-label="Parents">
      <SectionHeader
        className="pm-sectionhead"
        title="Parents"
        description="Parents and guardians who share your plan and see every child."
        actions={addButton}
      />

      {family.isLoading && !data && <Loader message="Loading your family…" />}

      {family.error && !data && (
        <ErrorState title="We couldn't load your family" error={family.error} onRetry={onChanged} />
      )}

      {data && (
        <>
          {!data.isAccountHolder && data.accountHolder && (
            <Alert variant="info" className="pm-notice">
              {formatName(data.accountHolder)} is the account holder. They manage the plan and the
              parents in this family.
            </Alert>
          )}

          {data.isAccountHolder && blockedReason && (
            <Alert variant="warning" className="pm-notice">
              {blockedReason}
            </Alert>
          )}

          <div className="pm-grid">
            {(data.members ?? []).map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                isYou={member.id === currentUserId}
                canRemove={data.isAccountHolder && !member.isAccountHolder}
                onRemove={removeModal.open}
              />
            ))}
          </div>
        </>
      )}

      <AddParentModal isOpen={addModal.isOpen} onClose={addModal.close} onCreated={onChanged} />

      <ConfirmationModal
        isOpen={removeModal.isOpen}
        onClose={removeModal.close}
        onConfirm={handleRemove}
        title="Remove this parent?"
        message={
          removeModal.payload
            ? `${formatName(removeModal.payload)} will lose access to your children and your plan. Their account itself is kept, and your children stay with you.`
            : ''
        }
        confirmLabel="Remove"
        variant="danger"
      />
    </section>
  );
}
