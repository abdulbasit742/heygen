import React, { useEffect, useMemo, useState } from 'react';
import { getProviderSetup, listProviderCatalog } from '../api.js';

const CATEGORY_LABELS = {
  all: 'All',
  voice: 'Voice',
  avatar: 'Avatar',
  lip_sync: 'Lip Sync',
  render: 'Render'
};

function readinessLabel(value) {
  return String(value || 'unknown').replaceAll('-', ' ');
}

export default function ProviderCatalogPanel() {
  const [catalog, setCatalog] = useState({ providers: [], summary: null });
  const [category, setCategory] = useState('all');
  const [recommendedOnly, setRecommendedOnly] = useState(false);
  const [setupPlan, setSetupPlan] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCatalog();
  }, [category, recommendedOnly]);

  async function loadCatalog() {
    try {
      const result = await listProviderCatalog({
        ...(category !== 'all' ? { category } : {}),
        ...(recommendedOnly ? { recommended: 'true' } : {})
      });
      setCatalog(result);
      setError('');
    } catch {
      setError('Provider catalog load nahi ho saka.');
    }
  }

  const categories = useMemo(() => Object.keys(CATEGORY_LABELS), []);

  async function openSetup(providerId) {
    try {
      setSetupPlan(await getProviderSetup(providerId));
      setError('');
    } catch {
      setError('Provider setup plan load nahi ho saka.');
    }
  }

  return (
    <section className="card providerCatalogPanel">
      <div className="sectionHeader">
        <div>
          <h2>Provider Catalog</h2>
          <p className="muted">Best linked repos aur integration options.</p>
        </div>
        {catalog.summary && (
          <div className="folderSummary">
            <span>{catalog.summary.total} providers</span>
            <span>{catalog.summary.recommended} recommended</span>
            <span>{catalog.summary.reviewRequired} review needed</span>
          </div>
        )}
      </div>

      <div className="catalogControls">
        <div className="targetChips">
          {categories.map(item => (
            <button
              type="button"
              className={category === item ? 'chip active' : 'chip'}
              key={item}
              onClick={() => setCategory(item)}
            >
              {CATEGORY_LABELS[item]}
            </button>
          ))}
        </div>
        <label className="inlineCheck">
          <input type="checkbox" checked={recommendedOnly} onChange={event => setRecommendedOnly(event.target.checked)} />
          Recommended only
        </label>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="catalogGrid">
        {catalog.providers.map(provider => (
          <article className={`catalogCard ${provider.recommended ? 'recommendedProvider' : ''}`} key={provider.id}>
            <div className="catalogHeader">
              <div>
                <strong>{provider.name}</strong>
                <small>{provider.category.replaceAll('_', ' ')} - {provider.maturity}</small>
              </div>
              <span className={`readiness ${provider.readiness}`}>{readinessLabel(provider.readiness)}</span>
            </div>

            <div className="folderMetrics">
              <span>Fit {provider.fitScore}</span>
              <span>{provider.license}</span>
              <span>{provider.setupMode.replaceAll('_', ' ')}</span>
            </div>

            <div className="catalogColumns">
              <div>
                <h4>Strengths</h4>
                <ul>
                  {provider.strengths.map(item => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <div>
                <h4>Cautions</h4>
                <ul>
                  {provider.cautions.map(item => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </div>

            <h4>Integration Plan</h4>
            <ol>
              {provider.integrationPlan.map(item => <li key={item}>{item}</li>)}
            </ol>

            <div className="inlineActions">
              <button type="button" onClick={() => openSetup(provider.id)}>Setup Plan</button>
              <a className="download smallDownload" href={provider.repo} target="_blank" rel="noreferrer">Open Repo</a>
              {provider.currentRepo && (
                <a className="download smallDownload" href={provider.currentRepo} target="_blank" rel="noreferrer">Current Fork</a>
              )}
            </div>
          </article>
        ))}
      </div>

      {setupPlan && (
        <section className="setupPlanPanel">
          <div className="sectionHeader">
            <div>
              <h3>{setupPlan.provider.name} Setup Plan</h3>
              <p className="muted">{setupPlan.provider.repo}</p>
            </div>
            <button type="button" className="tiny" onClick={() => setSetupPlan(null)}>Close</button>
          </div>

          <div className="folderMetrics">
            <span>{readinessLabel(setupPlan.setup.readiness)}</span>
            <span>{setupPlan.provider.setupMode.replaceAll('_', ' ')}</span>
            <span>{setupPlan.provider.license}</span>
          </div>

          <h4>Checklist</h4>
          <div className="setupChecklist">
            {setupPlan.setup.checklist.map(item => (
              <article className={item.done ? 'setupItem done' : 'setupItem'} key={item.id}>
                <strong>{item.done ? 'Ready' : 'Pending'}: {item.label}</strong>
                <small>{item.detail}</small>
              </article>
            ))}
          </div>

          <div className="catalogColumns">
            <div>
              <h4>Environment</h4>
              <div className="setupEnvList">
                {setupPlan.setup.env.map(item => (
                  <span className={item.configured ? 'pill readyPill' : 'pill'} key={item.key}>
                    {item.key}: {item.configured ? 'configured' : 'missing'}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4>Outputs</h4>
              <div className="setupEnvList">
                {setupPlan.setup.workerManifest.outputs.map(item => <span className="pill" key={item}>{item}</span>)}
              </div>
            </div>
          </div>

          <h4>Worker Manifest</h4>
          <pre className="manifestBlock">{JSON.stringify(setupPlan.setup.workerManifest, null, 2)}</pre>
        </section>
      )}
    </section>
  );
}
