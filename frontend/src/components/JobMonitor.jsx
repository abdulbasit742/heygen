import { useEffect, useState } from 'react';
import { cancelJob, createJob, listJobs, resolveAssetUrl, retryJob, retryProject } from '../api.js';

export default function JobMonitor() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      setJobs(await listJobs());
    } finally {
      setLoading(false);
    }
  }

  async function createDemoJob() {
    const job = await createJob({
      type: 'video_render',
      title: 'Demo avatar render',
      payload: { resolution: '1080x1920', format: 'mp4' }
    });
    setJobs(current => [job, ...current]);
  }

  async function action(handler, id) {
    const updated = await handler(id);
    setJobs(current => current.map(job => job.id === id ? updated : job));
  }

  async function retry(job) {
    if (job.projectId) {
      await retryProject(job.projectId);
      await refresh();
      return;
    }

    await action(retryJob, job.id);
  }

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="card jobMonitor">
      <div className="sectionHeader">
        <div>
          <h2>Render Job Monitor</h2>
          <p>Background rendering, retry aur cancel status yahan track karo.</p>
        </div>
        <button type="button" onClick={createDemoJob}>Create Demo Job</button>
      </div>

      {loading && <p className="muted">Refreshing jobs...</p>}

      <div className="jobList">
        {jobs.map(job => (
          <article className="jobCard" key={job.id}>
            <div>
              <strong>{job.title}</strong>
              <span>{job.type} - {job.status} - {job.progress}%</span>
            </div>
            <progress value={job.progress} max="100" />
            {job.type === 'provider_worker' && (
              <div className="jobResultBox">
                <strong>{job.payload?.providerName || job.result?.providerName}</strong>
                <span>{job.result?.message || 'Provider worker dry-run queued.'}</span>
                {job.result?.commandTemplate && <code>{job.result.commandTemplate}</code>}
                {job.result?.missingEnv?.length > 0 && <small>Missing env: {job.result.missingEnv.join(', ')}</small>}
              </div>
            )}
            <div className="jobActions">
              <button type="button" onClick={() => retry(job)}>Retry</button>
              <button type="button" onClick={() => action(cancelJob, job.id)}>Cancel</button>
              {job.result?.exportUrl && (
                <a className="download smallDownload" href={resolveAssetUrl(job.result.exportUrl)} target="_blank" rel="noreferrer">
                  Export
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
