import { Link } from 'react-router-dom';
import { Badge, Card, ErrorState, Loader, PageHeader } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { formatDateTime } from '../../../utils/date';
import platformService from '../services/platform.service';
import '../platform.css';

/**
 * /admin/settings - every business policy an admin can change without a
 * deployment (grace days, safety messages, planner weights, AI routing...).
 * Each opens in PlatformSettingPage: draft -> check -> publish -> roll back.
 */
export default function PlatformSettingsPage() {
  const list = useApi(platformService.listSettings, { immediate: true });
  const rows = Array.isArray(list.data) ? list.data : [];
  const byCategory = rows.reduce((acc, row) => {
    (acc[row.category] ??= []).push(row);
    return acc;
  }, {});

  return (
    <div className="td-page">
      <PageHeader
        title="Platform settings"
        description="Business rules and wording you can change without a new release. Every change is saved as a version, published with a reason, and can be rolled back."
      />

      {list.isLoading && !list.data && <Loader message="Loading settings…" />}
      {list.error && !list.data && <ErrorState error={list.error} onRetry={() => list.run().catch(() => {})} />}

      {Object.entries(byCategory)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([category, items]) => (
          <section key={category} className="ps-category">
            <h2 className="ps-category__title">{category}</h2>
            <div className="ps-cards">
              {items.map((s) => (
                <Card key={s.key} className="ps-card">
                  <div className="ps-card__head">
                    <Link to={`/admin/settings/${encodeURIComponent(s.key)}`} className="ps-card__title">
                      {s.label}
                    </Link>
                    {s.usingDefaults ? (
                      <Badge variant="neutral">Reviewed defaults</Badge>
                    ) : (
                      <Badge variant="success">Version {s.publishedVersion}</Badge>
                    )}
                  </div>
                  <p className="ps-card__desc">{s.description}</p>
                  <p className="ps-card__meta">
                    {s.publishedAt ? `Published ${formatDateTime(s.publishedAt)}` : 'Never changed'}
                    {s.draftCount > 0 && (
                      <>
                        {' · '}
                        <Badge variant="warning">
                          {s.draftCount} draft{s.draftCount === 1 ? '' : 's'}
                        </Badge>
                      </>
                    )}
                  </p>
                </Card>
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}
