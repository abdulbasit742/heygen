import React, { useEffect, useState } from 'react';
import { getAnalyticsSummary, resolveAssetUrl } from '../api.js';

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getAnalyticsSummary()
      .then(setAnalytics)
      .catch(() => setError('Analytics load nahi ho saka. Backend auth/token check karo.'));
  }, []);

  if (error) return <section className="card"><h2>Analytics</h2><p className="error">{error}</p></section>;
  if (!analytics) return <section className="card"><h2>Analytics</h2><p>Loading analytics...</p></section>;

  const cards = [
    ['Projects', analytics.totals.projects],
    ['Completed', analytics.totals.completed],
    ['Processing', analytics.totals.processing],
    ['Exports', analytics.totals.exports],
    ['Shares', analytics.totals.shares || 0],
    ['Share Views', analytics.totals.shareViews || 0],
    ['Video Minutes', analytics.totals.estimatedMinutes]
  ];

  return (
    <section className="card">
      <h2>Analytics Dashboard</h2>
      <div className="analyticsGrid">
        {cards.map(([label, value]) => (
          <article className="metricCard" key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </article>
        ))}
      </div>

      <h3>Platform Split</h3>
      <div className="tagList">
        {Object.entries(analytics.byPlatform).map(([platform, count]) => (
          <span className="pill" key={platform}>{platform}: {count}</span>
        ))}
      </div>

      <h3>Share Status</h3>
      <div className="tagList">
        {Object.entries(analytics.byShareStatus || {}).map(([status, count]) => (
          <span className="pill" key={status}>{status}: {count}</span>
        ))}
        {!Object.keys(analytics.byShareStatus || {}).length && <span className="muted">No shared exports yet.</span>}
      </div>

      <h3>Latest Projects</h3>
      <div className="projectList">
        {analytics.latestProjects.map(project => (
          <div className="projectItem" key={project.id}>
            <strong>{project.title}</strong>
            <span>{project.status} - {project.platform} - {project.progress}%</span>
          </div>
        ))}
      </div>

      <h3>Latest Shared Exports</h3>
      <div className="shareAnalyticsList">
        {(analytics.latestShares || []).map(share => (
          <article className="shareAnalyticsItem" key={share.id}>
            <div>
              <strong>{share.title}</strong>
              <span>{share.status} - {share.platform} - {share.viewCount} views</span>
              <small>Expires: {share.expiresAt ? new Date(share.expiresAt).toLocaleString() : 'Never'}</small>
            </div>
            <a className="download smallDownload" href={resolveAssetUrl(share.shareUrl)} target="_blank" rel="noreferrer">Open</a>
          </article>
        ))}
        {!(analytics.latestShares || []).length && <p className="muted">Share link create karne ke baad analytics yahan dikhegi.</p>}
      </div>
    </section>
  );
}
