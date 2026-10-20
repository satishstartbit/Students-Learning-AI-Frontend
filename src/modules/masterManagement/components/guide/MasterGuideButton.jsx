import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LuBookOpen, LuCode, LuExternalLink, LuLightbulb, LuMapPin, LuSettings2, LuTriangleAlert } from 'react-icons/lu';
import { Badge, Button, Modal } from '../../../../components/common';
import { guideFor, keyLabel, masterKeyFromPath, masterPath } from './masterGuides';
import './masterGuide.css';

const ROLE_TONE = { Student: 'info', 'Student (K-4)': 'info', Parent: 'success', 'Student / Parent': 'info', Teacher: 'primary', 'Super Admin': 'neutral' };

function Section({ icon, title, children }) {
  return (
    <section className="mg-section">
      <h3 className="mg-section__title">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

/**
 * "Where it's used" - sits beside the Add button on every master page and
 * opens a guide to where the list shows up in the product (role, page,
 * address), what it drives, what editing or switching items off does, the
 * fields that matter and the related masters. Content: masterGuides.js.
 */
export default function MasterGuideButton({ masterKey, title }) {
  const location = useLocation();
  const key = masterKey ?? masterKeyFromPath(location.pathname);
  const guide = guideFor(key);
  const [open, setOpen] = useState(false);
  if (!guide) return null;

  const name = title ?? keyLabel(key);

  return (
    <>
      <Button variant="secondary" startIcon={<LuBookOpen aria-hidden="true" />} onClick={() => setOpen(true)} aria-haspopup="dialog">
        Where it’s used
      </Button>
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={`${name}: where it’s used`}
        description={guide.summary}
        size="lg"
        className="mg-modal"
        footer={
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Close
          </Button>
        }
      >
        <div className="mg-body">
          <Section icon={<LuMapPin aria-hidden="true" />} title="Where it shows up">
            {guide.usedIn.length === 0 ? (
              <p className="mg-empty">No screen uses this list yet.</p>
            ) : (
              <ul className="mg-places">
                {guide.usedIn.map((place) => {
                  const openable = place.path.startsWith('/admin') && !place.path.includes(':');
                  return (
                    <li key={`${place.role}-${place.page}`} className="mg-place">
                      <div className="mg-place__top">
                        <Badge variant={ROLE_TONE[place.role] ?? 'neutral'}>{place.role}</Badge>
                        <span className="mg-place__page">{place.page}</span>
                      </div>
                      <p className="mg-place__how">{place.how}</p>
                      <p className="mg-place__path">
                        <code>{place.path}</code>
                        {openable && (
                          <Link to={place.path} className="mg-link">
                            Open <LuExternalLink aria-hidden="true" />
                          </Link>
                        )}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          {guide.drives?.length > 0 && (
            <Section icon={<LuLightbulb aria-hidden="true" />} title="What it drives">
              <ul className="mg-bullets">
                {guide.drives.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </Section>
          )}

          {guide.whenYouChange?.length > 0 && (
            <Section icon={<LuTriangleAlert aria-hidden="true" />} title="When you edit or switch off an item">
              <ul className="mg-bullets">
                {guide.whenYouChange.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </Section>
          )}

          {guide.fields?.length > 0 && (
            <Section icon={<LuSettings2 aria-hidden="true" />} title="Fields that matter">
              <dl className="mg-fields">
                {guide.fields.map((field) => (
                  <div key={field.name} className="mg-field">
                    <dt>{field.name}</dt>
                    <dd>{field.effect}</dd>
                  </div>
                ))}
              </dl>
            </Section>
          )}

          {guide.related?.length > 0 && (
            <Section icon={<LuBookOpen aria-hidden="true" />} title="Related masters">
              <p className="mg-related">
                {guide.related.map((rel) => (
                  <Link key={rel} to={masterPath(rel)} className="mg-chip" onClick={() => setOpen(false)}>
                    {keyLabel(rel)}
                  </Link>
                ))}
              </p>
            </Section>
          )}

          {/* {guide.api && (
            <details className="mg-dev">
              <summary>
                <LuCode aria-hidden="true" /> For developers
              </summary>
              <dl className="mg-fields">
                <div className="mg-field">
                  <dt>Admin API</dt>
                  <dd>
                    <code>{guide.api.admin}</code>
                  </dd>
                </div>
                {guide.api.read?.length > 0 && (
                  <div className="mg-field">
                    <dt>Read by the app</dt>
                    <dd>
                      {guide.api.read.map((r) => (
                        <code key={r}>{r}</code>
                      ))}
                    </dd>
                  </div>
                )}
                {guide.api.code?.length > 0 && (
                  <div className="mg-field">
                    <dt>Backend / frontend code</dt>
                    <dd>
                      {guide.api.code.map((c) => (
                        <code key={c}>{c}</code>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </details>
          )} */}
        </div>
      </Modal>
    </>
  );
}
