import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  PageHeader,
  Card,
  Button,
  Select,
  SearchInput,
  DataTable,
  Badge,
  ConfirmationModal,
  Alert,
  SectionHeader,
  Toast,
} from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { usePagination } from '../../../hooks/usePagination';
import { useDebounce } from '../../../hooks/useDebounce';
import { useModal } from '../../../hooks/useModal';
import { toast } from '../../../hooks/useToast';
import { formatDateTime } from '../../../utils/date';
import { formatName, titleCase } from '../../../utils/format';
import { getErrorMessage } from '../../../utils/errorHandler';
import adminUserService from '../services/adminUser.service';

/**
 * Parent-child and teacher-student links.
 *
 * The form only lets you pick valid role combinations - the owner picker is
 * filtered to Parents or Teachers depending on the type, and the other side
 * to Students. The server re-validates the pairing regardless, so this is a
 * usability guard rather than the control.
 */
const TYPE_OPTIONS = [
  { value: 'parent_child', label: 'Parent → Child' },
  { value: 'teacher_student', label: 'Teacher → Student' },
];

/** Which role each side of a link must hold. */
const OWNER_ROLE = { parent_child: 'PARENT', teacher_student: 'TEACHER' };

/** A searchable user picker backed by the server-side user list. */
function UserPicker({ label, role, value, onChange, error }) {
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 350);
  const { data, isLoading, run } = useApi(adminUserService.listUsers);

  useEffect(() => {
    run({ role, status: 'active', search: debounced, limit: 20 }).catch(() => {});
  }, [run, role, debounced]);

  const options = useMemo(
    () =>
      (data ?? []).map((u) => ({
        value: u.id,
        label: `${formatName(u)} · ${u.email}`,
      })),
    [data]
  );

  return (
    <div>
      <SearchInput
        label={`Search ${label.toLowerCase()}`}
        placeholder="Name or email"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onClear={() => setSearch('')}
      />
      <Select
        label={label}
        options={options}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={isLoading ? 'Loading…' : `Select a ${label.toLowerCase()}`}
        loading={isLoading}
        error={error}
        required
      />
    </div>
  );
}

export default function RelationshipsPage() {
  const pagination = usePagination();
  const { page, limit, applyMeta, goToPage } = pagination;

  const [typeFilter, setTypeFilter] = useState('');
  const [form, setForm] = useState({ relationshipType: 'parent_child', userId: '', relatedUserId: '' });
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);

  const removeModal = useModal();

  const { data, meta, error, isLoading, run } = useApi(adminUserService.listRelationships);

  const load = useCallback(
    () => run({ page, limit, relationshipType: typeFilter }),
    [run, page, limit, typeFilter]
  );

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  useEffect(() => {
    if (meta?.total !== undefined) applyMeta(meta);
  }, [meta, applyMeta]);

  const setField = (key) => (value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFormError(null);
  };

  // Changing the type invalidates the owner, whose required role just changed.
  const handleTypeChange = (value) => {
    setForm({ relationshipType: value, userId: '', relatedUserId: '' });
    setFormError(null);
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    if (!form.userId || !form.relatedUserId) {
      setFormError('Select both people to link');
      return;
    }
    if (form.userId === form.relatedUserId) {
      setFormError('A user cannot be linked to themselves');
      return;
    }

    setBusy(true);
    try {
      await adminUserService.createRelationship(form);
      toast.success('Relationship created');
      setForm({ relationshipType: form.relationshipType, userId: '', relatedUserId: '' });
      await load();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    setBusy(true);
    try {
      await adminUserService.deleteRelationship(removeModal.payload.id);
      toast.success('Relationship removed');
      removeModal.close();
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      key: 'relationshipType',
      header: 'Type',
      render: (row) => <Badge variant="info">{titleCase(row.relationshipType)}</Badge>,
    },
    {
      key: 'owner',
      header: 'Parent / Teacher',
      render: (row) => `${formatName(row.owner)} · ${row.owner?.email ?? ''}`,
    },
    {
      key: 'related',
      header: 'Student',
      render: (row) => `${formatName(row.related)} · ${row.related?.email ?? ''}`,
    },
    { key: 'createdAt', header: 'Linked', render: (row) => formatDateTime(row.createdAt) },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <Button size="sm" variant="secondary" onClick={() => removeModal.open(row)}>
          Unlink
        </Button>
      ),
    },
  ];

  const ownerRole = OWNER_ROLE[form.relationshipType];
  const ownerLabel = ownerRole === 'PARENT' ? 'Parent' : 'Teacher';

  return (
    <>
      <PageHeader
        title="Relationships"
        description="Link parents to their children and teachers to their students."
      />

      <Card title="Create a link" className="ui-field">
        {formError && (
          <Alert variant="error" className="ui-field">
            {formError}
          </Alert>
        )}

        <form onSubmit={handleCreate}>
          <Select
            label="Relationship type"
            options={TYPE_OPTIONS}
            value={form.relationshipType}
            onChange={(e) => handleTypeChange(e.target.value)}
            placeholder="Choose a type"
            required
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 'var(--spacing-lg)',
            }}
          >
            <UserPicker
              label={ownerLabel}
              role={ownerRole}
              value={form.userId}
              onChange={setField('userId')}
            />
            <UserPicker
              label="Student"
              role="STUDENT"
              value={form.relatedUserId}
              onChange={setField('relatedUserId')}
            />
          </div>

          <Button type="submit" loading={busy}>
            Link
          </Button>
        </form>
      </Card>

      <SectionHeader
        title="Existing relationships"
        actions={
          <Select
            options={TYPE_OPTIONS}
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              goToPage(1);
            }}
            placeholder="All types"
            fieldClassName="ui-sectionheader"
          />
        }
      />

      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        error={error}
        onRetry={load}
        pagination={pagination}
        onPageChange={goToPage}
        emptyTitle="No relationships yet"
        emptyDescription="Use the form above to link a parent or teacher to a student."
        caption="User relationships"
      />

      <ConfirmationModal
        isOpen={removeModal.isOpen}
        onClose={removeModal.close}
        onConfirm={handleRemove}
        title="Remove this link?"
        message={
          removeModal.payload
            ? `${formatName(removeModal.payload.owner)} will no longer be linked to ${formatName(removeModal.payload.related)}.`
            : ''
        }
        confirmLabel="Unlink"
        variant="danger"
        loading={busy}
      />

      <Toast />
    </>
  );
}
