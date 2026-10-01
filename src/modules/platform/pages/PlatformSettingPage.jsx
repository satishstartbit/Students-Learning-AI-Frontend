import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { LuCircleCheck, LuRotateCcw, LuSave, LuSend, LuTrash2 } from 'react-icons/lu';
import {
  Alert,
  Badge,
  Button,
  Card,
  DataTable,
  ErrorState,
  Loader,
  Modal,
  PageHeader,
  Textarea,
} from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { toast } from '../../../hooks/useToast';
import { formatDateTime } from '../../../utils/date';
import { getErrorMessage, getFieldErrors } from '../../../utils/errorHandler';
import SettingsFieldEditor from '../components/SettingsFieldEditor';
import platformService from '../services/platform.service';
import '../platform.css';

const STATUS_BADGE = {
  published: { variant: 'success', label: 'Published' },
  draft: { variant: 'warning', label: 'Draft' },
  superseded: { variant: 'neutral', label: 'Replaced' },
  discarded: { variant: 'neutral', label: 'Discarded' },
};

/**
 * /admin/settings/:key - edit one platform setting.
 *
 * Draft -> Check -> Save draft -> Publish (with a reason) -> Roll back.
 * Published versions never change; rolling back publishes a copy of an older
 * version. The server validates every value against the same field list this
 * page renders, so an invalid value can't be published.
 */
export default function PlatformSettingPage() {
  const { key } = useParams();
  const setting = useApi(platformService.getSetting, { immediate: true, args: [key] });
  const reload = () => setting.run(key).catch(() => {});

  if (setting.isLoading && !setting.data) return <Loader message="Loading setting…" />;
  if (setting.error && !setting.data) return <ErrorState error={setting.error} onRetry={reload} />;
  if (!setting.data) return null;

  const latestDraft = setting.data.versions.find((v) => v.status === 'draft') ?? null;
  // Remount the editor whenever the saved state changes, so its local copy
  // always starts from what the server now holds.
  const stamp = `${setting.data.current.version ?? 'default'}-${latestDraft?.version ?? 'none'}-${latestDraft?.updatedAt ?? ''}`;
  return <SettingEditor key={stamp} setting={setting.data} latestDraft={latestDraft} onSaved={reload} />;
}

function SettingEditor({ setting, latestDraft, onSaved }) {
  const { key } = setting;
  const initial = latestDraft ? latestDraft.value : setting.current.value;
  const [value, setValue] = useState(initial);
  const [note, setNote] = useState(latestDraft?.note ?? '');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [rollbackTo, setRollbackTo] = useState(null);
  const [reason, setReason] = useState('');

  const dirty = useMemo(() => JSON.stringify(value) !== JSON.stringify(initial) || note !== (latestDraft?.note ?? ''), [value, note, initial, latestDraft]);

  const run = async (kind, fn) => {
    setBusy(kind);
    try {
      return await fn();
    } catch (err) {
      setErrors(getFieldErrors(err));
      toast.error(getErrorMessage(err));
      return null;
    } finally {
      setBusy(null);
    }
  };

  const check = () =>
    run('check', async () => {
      const { data } = await platformService.checkSetting(key, value);
      setErrors(Object.fromEntries((data.errors ?? []).map((e) => [e.field, e.message])));
      if (data.valid) toast.success('Everything checks out');
      else toast.error('Some values need fixing');
    });

  const saveDraft = () =>
    run('save', async () => {
      if (latestDraft) await platformService.updateDraft(key, latestDraft.version, value, note);
      else await platformService.createDraft(key, value, note);
      setErrors({});
      toast.success('Draft saved');
      onSaved();
    });

  const discard = () =>
    run('discard', async () => {
      await platformService.discardDraft(key, latestDraft.version);
      toast.success('Draft discarded');
      onSaved();
    });

  const publish = () =>
    run('publish', async () => {
      await platformService.publish(key, latestDraft.version, reason);
      toast.success('Published - it takes effect within a minute everywhere');
      setPublishing(false);
      setReason('');
      onSaved();
    });

  const rollback = () =>
    run('rollback', async () => {
      await platformService.rollback(key, rollbackTo.version, reason);
      toast.success(`Rolled back to version ${rollbackTo.version}`);
      setRollbackTo(null);
      setReason('');
      onSaved();
    });

  const current = setting.current;
  const columns = [
    { key: 'version', header: 'Version', render: (v) => `v${v.version}` },
    {
      key: 'status',
      header: 'Status',
      render: (v) => {
        const s = STATUS_BADGE[v.status] ?? { variant: 'neutral', label: v.status };
        return <Badge variant={s.variant}>{s.label}</Badge>;
      },
    },
    { key: 'note', header: 'Note', render: (v) => v.note || '—' },
    { key: 'createdBy', header: 'Saved by', render: (v) => v.createdBy || '—', hideOnMobile: true },
    {
      key: 'publishedAt',
      header: 'Published',
      render: (v) => (v.publishedAt ? `${formatDateTime(v.publishedAt)}${v.publishedBy ? ` · ${v.publishedBy}` : ''}` : '—'),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (v) =>
        (v.status === 'superseded' || v.status === 'published') && v.version !== current.version ? (
          <Button size="sm" variant="secondary" startIcon={<LuRotateCcw aria-hidden="true" />} onClick={() => setRollbackTo(v)}>
            Roll back
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="td-page">
      <PageHeader
        title={setting.label}
        description={setting.description}
        breadcrumbs={[{ label: 'Platform settings', to: '/admin/settings' }, { label: setting.label }]}
      />

      <Alert variant={current.source === 'published' ? 'success' : 'info'} className="ps-status">
        {current.source === 'published'
          ? `Version ${current.version} is live.`
          : 'Nothing has been published yet - the reviewed defaults are live.'}{' '}
        {latestDraft ? `You're editing draft version ${latestDraft.version}.` : 'Changes start as a draft - nothing goes live until you publish.'}
      </Alert>

      <Card className="ps-editor">
        <SettingsFieldEditor fields={setting.fields} value={value} errors={errors} onChange={setValue} />
        <div className="ps-field ps-field--wide">
          <Textarea
            name="note"
            label="Note for this version (optional)"
            rows={2}
            maxLength={1000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="ps-actions">
          <Button variant="secondary" startIcon={<LuCircleCheck aria-hidden="true" />} loading={busy === 'check'} onClick={check}>
            Check
          </Button>
          <Button variant="secondary" startIcon={<LuSave aria-hidden="true" />} loading={busy === 'save'} disabled={!dirty} onClick={saveDraft}>
            Save draft
          </Button>
          <Button
            startIcon={<LuSend aria-hidden="true" />}
            disabled={!latestDraft || dirty}
            title={dirty ? 'Save the draft first' : !latestDraft ? 'Save a draft first' : undefined}
            onClick={() => setPublishing(true)}
          >
            Publish draft
          </Button>
          {latestDraft && (
            <Button variant="ghost" startIcon={<LuTrash2 aria-hidden="true" />} loading={busy === 'discard'} onClick={discard}>
              Discard draft
            </Button>
          )}
          <Button variant="ghost" onClick={() => setValue(setting.defaults)}>
            Start from reviewed defaults
          </Button>
        </div>
      </Card>

      <h2 className="ps-category__title">History</h2>
      <DataTable columns={columns} data={setting.versions} emptyTitle="No versions yet" emptyDescription="Save a draft to start." />

      <Modal
        isOpen={publishing || Boolean(rollbackTo)}
        onClose={() => {
          setPublishing(false);
          setRollbackTo(null);
        }}
        title={rollbackTo ? `Roll back to version ${rollbackTo.version}?` : `Publish draft version ${latestDraft?.version}?`}
        description="It takes effect everywhere within a minute. Say why - this goes into the audit log."
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setPublishing(false);
                setRollbackTo(null);
              }}
            >
              Cancel
            </Button>
            <Button
              loading={busy === 'publish' || busy === 'rollback'}
              disabled={reason.trim().length < 3}
              onClick={rollbackTo ? rollback : publish}
            >
              {rollbackTo ? 'Roll back' : 'Publish'}
            </Button>
          </>
        }
      >
        <Textarea name="reason" label="Reason" required rows={3} maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} />
      </Modal>
    </div>
  );
}
