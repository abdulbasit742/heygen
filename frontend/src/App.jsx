import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import AuthPanel from './components/AuthPanel.jsx';
import PricingPanel from './components/PricingPanel.jsx';
import AvatarPicker from './components/AvatarPicker.jsx';
import MediaLibrary from './components/MediaLibrary.jsx';
import BrandKitPanel from './components/BrandKitPanel.jsx';
import CaptionStudio from './components/CaptionStudio.jsx';
import TeamPanel from './components/TeamPanel.jsx';
import AnalyticsDashboard from './components/AnalyticsDashboard.jsx';
import JobMonitor from './components/JobMonitor.jsx';
import SchedulerPanel from './components/SchedulerPanel.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import { createProject, getProject, listProjects, loadStoredAuth, resolveAssetUrl, setAuthToken } from './api.js';
import './style.css';

const DEFAULT_PROMPT = 'Create a 30 second motivational avatar video about discipline and success.';

function App() {
  const [form, setForm] = useState({
    title: 'First AI Avatar Video',
    prompt: DEFAULT_PROMPT,
    language: 'English',
    tone: 'cinematic',
    platform: 'instagram_reels',
    avatar: 'studio_presenter',
    voice: 'calm_male'
  });
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [auth, setAuth] = useState(() => loadStoredAuth());

  const completedCount = useMemo(
    () => projects.filter(project => project.status === 'completed').length,
    [projects]
  );

  useEffect(() => {
    if (auth.user) refreshProjects();
  }, [auth.user]);

  useEffect(() => {
    if (!activeProject || ['completed', 'failed'].includes(activeProject.status)) return undefined;

    const timer = setInterval(async () => {
      try {
        const updated = await getProject(activeProject.id);
        setActiveProject(updated);
        setProjects(current => current.map(item => item.id === updated.id ? updated : item));
      } catch {
        clearInterval(timer);
      }
    }, 900);

    return () => clearInterval(timer);
  }, [activeProject]);

  function updateField(field, value) {
    setForm(current => ({ ...current, [field]: value }));
  }

  async function refreshProjects() {
    const nextProjects = await listProjects();
    setProjects(nextProjects);
  }

  async function submitProject(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const project = await createProject(form);
      setActiveProject(project);
      setProjects(current => [project, ...current]);
    } catch (err) {
      setError(err.response?.data?.error || 'Project create nahi ho saka. Backend check karo.');
    } finally {
      setLoading(false);
    }
  }

  function handleAuth(result) {
    setAuth({ token: result.token, user: result.user });
  }

  function logout() {
    setAuthToken(null);
    localStorage.removeItem('auth_user');
    setProjects([]);
    setActiveProject(null);
    setAuth({ token: null, user: null });
  }

  if (!auth.user) {
    return (
      <main className="page authPage">
        <section className="hero">
          <div>
            <p className="eyebrow">AI Avatar Video Studio</p>
            <h1>Login to create videos</h1>
            <p>Account ke baad projects, exports, voiceover, subtitles aur rendering flow use kar sakte ho.</p>
          </div>
        </section>
        <AuthPanel onAuth={handleAuth} />
      </main>
    );
  }

  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">HeyGen-style MVP</p>
          <h1>AI Avatar Video Studio</h1>
          <p>Prompt se avatar video project banao, progress track karo, aur MP4 export flow ready rakho.</p>
          <p className="userLine">Logged in: {auth.user.email} <button type="button" className="tiny" onClick={logout}>Logout</button></p>
        </div>
        <div className="stats">
          <strong>{projects.length}</strong>
          <span>Total Projects</span>
          <strong>{completedCount}</strong>
          <span>Completed</span>
        </div>
      </section>

      <section className="grid">
        <form className="card" onSubmit={submitProject}>
          <h2>Create Video</h2>

          <label>Title</label>
          <input value={form.title} onChange={event => updateField('title', event.target.value)} />

          <label>Video Prompt</label>
          <textarea value={form.prompt} onChange={event => updateField('prompt', event.target.value)} />

          <div className="row">
            <div>
              <label>Language</label>
              <select value={form.language} onChange={event => updateField('language', event.target.value)}>
                <option>English</option>
                <option>Urdu</option>
                <option>Hindi</option>
                <option>Arabic</option>
              </select>
            </div>
            <div>
              <label>Tone</label>
              <select value={form.tone} onChange={event => updateField('tone', event.target.value)}>
                <option>cinematic</option>
                <option>professional</option>
                <option>friendly</option>
                <option>educational</option>
              </select>
            </div>
          </div>

          <AvatarPicker
            value={form.avatar}
            language={form.language}
            onChange={avatarId => updateField('avatar', avatarId)}
          />

          <div className="row">
            <div>
              <label>Voice</label>
              <select value={form.voice} onChange={event => updateField('voice', event.target.value)}>
                <option value="calm_male">Calm Male</option>
                <option value="energetic_female">Energetic Female</option>
                <option value="urdu_narrator">Urdu Narrator</option>
              </select>
            </div>
          </div>

          <label>Platform</label>
          <select value={form.platform} onChange={event => updateField('platform', event.target.value)}>
            <option value="instagram_reels">Instagram Reels</option>
            <option value="youtube_shorts">YouTube Shorts</option>
            <option value="tiktok">TikTok</option>
            <option value="facebook_reels">Facebook Reels</option>
          </select>

          {error && <p className="error">{error}</p>}
          <button disabled={loading}>{loading ? 'Creating...' : 'Create AI Video Project'}</button>
        </form>

        <section className="card preview">
          <h2>Project Status</h2>
          {activeProject ? (
            <>
              <h3>{activeProject.title}</h3>
              <p>{activeProject.prompt}</p>
              <div className="progressBar">
                <div style={{ width: `${activeProject.progress || 0}%` }} />
              </div>
              <p className="status">{activeProject.status} - {activeProject.progress || 0}%</p>
              {activeProject.error && <p className="error">{activeProject.error}</p>}
              {activeProject.outputUrl && (
                <div className="exportPreview">
                  <video src={resolveAssetUrl(activeProject.outputUrl)} controls playsInline />
                  <a className="download" href={resolveAssetUrl(activeProject.outputUrl)} target="_blank" rel="noreferrer">Open Export</a>
                </div>
              )}
              {activeProject.scriptResult?.scenes?.length > 0 && (
                <div className="sceneSummary">
                  <strong>Generated Scenes</strong>
                  {activeProject.scriptResult.scenes.map(scene => (
                    <span key={scene.order}>{scene.order}. {scene.subtitle}</span>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p>No active project yet. Form submit karo.</p>
          )}
        </section>
      </section>

      <MediaLibrary onSelect={item => updateField('mediaAssetId', item.id)} />

      <BrandKitPanel />

      <CaptionStudio />

      <TeamPanel />

      <AnalyticsDashboard />

      <JobMonitor />

      <SchedulerPanel />

      <SettingsPanel />

      <PricingPanel />

      <section className="card">
        <h2>Recent Projects</h2>
        <div className="projectList">
          {projects.map(project => (
            <button className="projectItem" key={project.id} onClick={() => setActiveProject(project)}>
              <strong>{project.title}</strong>
              <span>{project.status} - {project.progress || 0}%</span>
            </button>
          ))}
          {!projects.length && <p>Abhi koi project nahi.</p>}
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
