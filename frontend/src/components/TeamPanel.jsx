import React, { useEffect, useState } from 'react';
import { getDefaultWorkspace, inviteMember, listInvites, removeMember, updateWorkspace } from '../api.js';

export default function TeamPanel() {
  const [workspace, setWorkspace] = useState(null);
  const [invites, setInvites] = useState([]);
  const [form, setForm] = useState({ email: '', role: 'editor' });
  const [workspaceName, setWorkspaceName] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadWorkspace();
  }, []);

  async function loadWorkspace() {
    const nextWorkspace = await getDefaultWorkspace();
    setWorkspace(nextWorkspace);
    setWorkspaceName(nextWorkspace.name);
    const nextInvites = await listInvites(nextWorkspace.id);
    setInvites(nextInvites);
  }

  async function saveWorkspace(event) {
    event.preventDefault();
    const updated = await updateWorkspace(workspace.id, { name: workspaceName });
    setWorkspace(updated);
    setMessage('Workspace saved.');
  }

  async function sendInvite(event) {
    event.preventDefault();
    const invite = await inviteMember(workspace.id, form);
    setInvites(current => [invite, ...current]);
    setForm({ email: '', role: 'editor' });
    await loadWorkspace();
  }

  async function deleteMember(email) {
    const updated = await removeMember(workspace.id, email);
    setWorkspace(updated);
  }

  if (!workspace) {
    return <section className="card"><h2>Team Workspace</h2><p>Loading workspace...</p></section>;
  }

  return (
    <section className="card">
      <h2>Team Workspace</h2>
      <p>Agency ya team ke liye members invite karo aur roles manage karo.</p>

      <form className="teamForm" onSubmit={saveWorkspace}>
        <label>Workspace Name</label>
        <input value={workspaceName} onChange={event => setWorkspaceName(event.target.value)} />
        <button type="submit">Save Workspace</button>
      </form>

      <form className="teamForm" onSubmit={sendInvite}>
        <label>Invite Email</label>
        <input
          type="email"
          value={form.email}
          onChange={event => setForm(current => ({ ...current, email: event.target.value }))}
          placeholder="editor@example.com"
          required
        />
        <label>Role</label>
        <select value={form.role} onChange={event => setForm(current => ({ ...current, role: event.target.value }))}>
          <option value="admin">Admin</option>
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
        </select>
        <button type="submit">Invite Member</button>
      </form>

      {message && <p className="status">{message}</p>}

      <h3>Members</h3>
      <div className="projectList">
        {workspace.members.map(member => (
          <div className="projectItem" key={`${member.email}-${member.role}`}>
            <strong>{member.name || member.email}</strong>
            <span>{member.role} · {member.status}</span>
            {member.role !== 'owner' && (
              <button type="button" className="tiny" onClick={() => deleteMember(member.email)}>Remove</button>
            )}
          </div>
        ))}
      </div>

      <h3>Pending Invites</h3>
      <div className="projectList">
        {invites.map(invite => (
          <div className="projectItem" key={invite.id}>
            <strong>{invite.email}</strong>
            <span>{invite.role} · {invite.status}</span>
          </div>
        ))}
        {!invites.length && <p>No pending invites.</p>}
      </div>
    </section>
  );
}
