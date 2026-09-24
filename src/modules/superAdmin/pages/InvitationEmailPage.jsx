import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, ConfirmationModal, ErrorState, Loader, PageHeader } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { useDebounce } from '../../../hooks/useDebounce';
import { toast } from '../../../hooks/useToast';
import { formatDateTime } from '../../../utils/date';
import { getErrorMessage } from '../../../utils/errorHandler';
import connectionService from '../services/teacherConnection.service';

/**
 * The teacher invitation email, written by the client and edited here.
 *
 * It is the email a teacher receives when a parent invites them: how the
 * platform works, how it supports the student, what the teacher may receive,
 * and how to accept or decline. The client writes it; saving here puts it live
 * on the very next invitation - no developer, no deploy.
 *
 * The text uses the same plain format the original file did (a Subject:
 * line, an optional Preheader: line, then paragraphs, "## headings" and
 * "- bullets", with {{placeholders}}), and the preview on the right is the
 * real rendered email filled with sample values - nothing is sent.
 */

const NAME = 'teacher-invitation';

export default function InvitationEmailPage() {
  const copy = useApi(connectionService.getEmailCopy, { immediate: true, args: [NAME] });
  const { run: reload, setData } = copy;

  const [content, setContent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState(null);

  // The editor starts from whatever is in use; after that it is the admin's.
  const text = content ?? copy.data?.content ?? '';
  const debounced = useDebounce(text, 500);
  const dirty = content !== null && content !== copy.data?.content;

  useEffect(() => {
    if (!debounced) return undefined;
    let live = true;
    connectionService
      .previewEmailCopy(NAME, debounced)
      .then(({ data }) => {
        if (!live) return;
        setPreview(data);
        setPreviewError(null);
      })
      .catch((err) => live && setPreviewError(getErrorMessage(err)));
    return () => {
      live = false;
    };
  }, [debounced]);

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await connectionService.saveEmailCopy(NAME, text);
      setData(data);
      setContent(null);
      toast.success('Invitation email saved - the next invitation uses it');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    try {
      const { data } = await connectionService.resetEmailCopy(NAME);
      setData(data);
      setContent(null);
      setConfirmReset(false);
      toast.success('Back to the original wording');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (copy.isLoading && !copy.data) return <Loader message="Loading the invitation email…" />;
  if (copy.error && !copy.data) return <ErrorState error={copy.error} onRetry={() => reload(NAME).catch(() => {})} />;

  const info = copy.data;

  return (
    <div className="td-page">
      <PageHeader
        title="Teacher invitation email"
        description={info.description}
        actions={
          <>
            {info.isCustom && (
              <Button variant="ghost" onClick={() => setConfirmReset(true)} disabled={saving}>
                Reset to original
              </Button>
            )}
            <Button onClick={save} loading={saving} disabled={!dirty}>
              Save
            </Button>
          </>
        }
      />

      {info.hasPendingSlots && (
        <Alert variant="warning" className="ui-field">
          This email still has <strong>[CLIENT COPY PENDING]</strong> slots. Invitations can&apos;t be sent to real
          teachers until every slot is replaced with the final wording.
        </Alert>
      )}

      <p className="ui-hint" style={{ marginTop: 0 }}>
        {info.isCustom ? (
          <>
            <Badge variant="primary">Custom wording</Badge>{' '}
            {info.updatedBy ? `Last saved by ${info.updatedBy.name}` : 'Saved'}
            {info.updatedAt ? ` on ${formatDateTime(info.updatedAt)}` : ''}
          </>
        ) : (
          <Badge variant="neutral">Original wording</Badge>
        )}
      </p>

      <div style={{ display: 'grid', gap: 'var(--spacing-lg)', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', alignItems: 'start' }}>
        <Card title="Wording">
          <label className="ui-label" htmlFor="invitation-copy">
            Email text
          </label>
          <textarea
            id="invitation-copy"
            value={text}
            onChange={(e) => setContent(e.target.value)}
            spellCheck
            style={{
              width: '100%',
              minHeight: 420,
              padding: 12,
              border: '1px solid var(--color-border-default)',
              borderRadius: 10,
              background: 'var(--color-bg-surface)',
              color: 'var(--color-text-primary)',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
              fontSize: 13,
              lineHeight: 1.55,
              resize: 'vertical',
            }}
          />

          <details style={{ marginTop: 'var(--spacing-md)' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>How to write it</summary>
            <ul className="ui-hint" style={{ margin: '8px 0 0', paddingLeft: 18 }}>
              <li>
                First line <code>Subject: …</code> - the email subject. Optional next line <code>Preheader: …</code> -
                the inbox preview.
              </li>
              <li>A blank line starts a new paragraph.</li>
              <li>
                <code>## Heading</code> for a heading, <code>- item</code> for a bullet.
              </li>
              <li>Plain text only - no HTML. Lines starting with # are notes and are never sent.</li>
            </ul>

            <p style={{ margin: '12px 0 4px', fontWeight: 600 }}>Placeholders</p>
            <ul className="ui-hint" style={{ margin: 0, paddingLeft: 18 }}>
              {Object.entries(info.placeholders).map(([key, label]) => (
                <li key={key}>
                  <code>{`{{${key}}}`}</code> - {label}
                </li>
              ))}
              {Object.entries(info.blocks).map(([key, label]) => (
                <li key={key}>
                  <code>{`{{${key}}}`}</code> (on its own line) - {label}
                </li>
              ))}
            </ul>
          </details>
        </Card>

        <Card title="Preview" subtitle={preview ? `Subject: ${preview.subject}` : 'Filled in with sample names - nothing is sent.'}>
          {previewError ? (
            <Alert variant="error">{previewError}</Alert>
          ) : preview ? (
            // Rendered in a sandboxed frame: it is the real email HTML, and
            // must not run anything or inherit this page's styles.
            <iframe
              title="Invitation email preview"
              sandbox=""
              srcDoc={preview.html}
              style={{ width: '100%', minHeight: 520, border: '1px solid var(--color-border-default)', borderRadius: 10, background: '#fff' }}
            />
          ) : (
            <Loader message="Rendering…" />
          )}
        </Card>
      </div>

      <ConfirmationModal
        isOpen={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={reset}
        title="Go back to the original wording?"
        message="Your saved wording is removed, and invitations use the original text again."
        confirmLabel="Reset"
        variant="danger"
      />
    </div>
  );
}
