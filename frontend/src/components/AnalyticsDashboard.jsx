import React, { useEffect, useState } from 'react';
import { getAnalyticsSummary } from '../api.js';

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

      <h3>Latest Projects</h3>
      <div className="projectList">
        {analytics.latestProjects.map(project => (
          <div className="projectItem" key={project.id}>
            <strong>{project.title}</strong>
            <span>{project.status} - {project.platform} - {project.progress}%</span>
          </div>
        ))}
      </div>
    </section>
  );
}
