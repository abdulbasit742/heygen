import React, { useEffect, useState } from 'react';
import {
  cancelScheduledPost,
  createScheduledPost,
  listScheduledPosts,
  mockPublishPost
} from '../api.js';

const DEFAULT_TARGETS = [
  { platform: 'facebook_page', accountId: 'official-page' },
  { platform: 'instagram_business', accountId: 'business-profile' }
];

export default function SchedulerPanel() {
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState({
    title: 'New Reel Launch',
    caption: 'Watch this AI generated video and follow for more creator tools.',
    mediaUrl: '/exports/demo-video.mp4',
    scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16),
    timezone: 'UTC',
    targets: DEFAULT_TARGETS
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    setPosts(await listScheduledPosts());
  }

  function update(field, value) {
    setForm(current => ({ ...current, [field]: value }));
  }

  function toggleTarget(platform) {
    setForm(current => {
      const exists = current.targets.some(target => target.platform === platform);
      const targets = exists
        ? current.targets.filter(target => target.platform !== platform)
        : [...current.targets, { platform, accountId: 'official-account' }];
      return { ...current, targets };
    });
  }

  async function submit(event) {
    event.preventDefault();
    setMessage('');
    try {
      await createScheduledPost({ ...form, scheduledAt: new Date(form.scheduledAt).toISOString() });
      setMessage('Post scheduled successfully.');
      await refresh();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Schedule create nahi ho saka.');
    }
  }

  async function publish(id) {
    await mockPublishPost(id);
    await refresh();
  }

  async function cancel(id) {
    await cancelScheduledPost(id);
    await refresh();
  }

  return (
    <section className="card schedulerPanel">
      <h2>Publishing Scheduler</h2>
      <p>Official connected pages/business accounts ke liye posts plan karo. Yeh mock publisher hai; real posting ke liye official APIs connect hongi.</p>

      <form className="schedulerForm" onSubmit={submit}>
        <label>Post Title</label>
        <input value={form.title} onChange={event => update('title', event.target.value)} />

        <label>Caption</label>
        <textarea value={form.caption} onChange={event => update('caption', event.target.value)} />

        <label>Media / Export URL</label>
        <input value={form.mediaUrl} onChange={event => update('mediaUrl', event.target.value)} />

        <div className="row">
          <div>
            <label>Schedule Time</label>
            <input type="datetime-local" value={form.scheduledAt} onChange={event => update('scheduledAt', event.target.value)} />
          </div>
          <div>
            <label>Timezone</label>
            <input value={form.timezone} onChange={event => update('timezone', event.target.value)} />
          </div>
        </div>

        <label>Platforms</label>
        <div className="targetChips">
          {['facebook_page', 'instagram_business', 'youtube_shorts', 'tiktok_business', 'linkedin_page'].map(platform => (
            <button
              type="button"
              className={form.targets.some(target => target.platform === platform) ? 'chip active' : 'chip'}
              key={platform}
              onClick={() => toggleTarget(platform)}
            >
              {platform.replaceAll('_', ' ')}
            </button>
          ))}
        </div>

        <button type="submit">Schedule Post</button>
        {message && <p className="status">{message}</p>}
      </form>

      <div className="projectList">
        {posts.map(post => (
          <article className="projectItem schedulerItem" key={post.id}>
            <strong>{post.title}</strong>
            <span>{post.status} · {new Date(post.scheduledAt).toLocaleString()}</span>
            <small>{post.targets.map(target => target.platform).join(', ')}</small>
            <div className="actions">
              <button type="button" onClick={() => publish(post.id)}>Mock Publish</button>
              <button type="button" onClick={() => cancel(post.id)}>Cancel</button>
            </div>
          </article>
        ))}
        {!posts.length && <p>No scheduled posts yet.</p>}
      </div>
    </section>
  );
}
