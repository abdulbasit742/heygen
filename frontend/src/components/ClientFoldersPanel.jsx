import React, { useEffect, useMemo, useState } from 'react';
import {
  addProjectToClientFolder,
  createClientFolder,
  deleteClientFolder,
  listClientFolders,
  listProjects,
  removeProjectFromClientFolder,
  updateClientFolder
} from '../api.js';

const DEFAULT_FORM = {
  name: 'Client Launch Folder',
  clientName: 'Client Name',
  status: 'active',
  color: '#2563eb',
  notes: ''
};

const STATUS_OPTIONS = ['active', 'paused', 'archived'];

export default function ClientFoldersPanel() {
  const [folders, setFolders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [assignment, setAssignment] = useState({ folderId: '', projectId: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const assignedProjectIds = useMemo(
    () => new Set(folders.flatMap(folder => folder.projectIds || [])),
    [folders]
  );
  const availableProjects = useMemo(
    () => projects.filter(project => !assignedProjectIds.has(project.id)),
    [projects, assignedProjectIds]
  );

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    try {
      const [folderData, nextProjects] = await Promise.all([listClientFolders(), listProjects()]);
      setFolders(folderData.folders);
      setSummary(folderData.summary);
      setProjects(nextProjects);
      setAssignment(current => ({
        folderId: current.folderId || folderData.folders[0]?.id || '',
        projectId: current.projectId || nextProjects[0]?.id || ''
      }));
    } catch {
      setError('Client folders load nahi ho sake.');
    }
  }

  function updateForm(field, value) {
    setForm(current => ({ ...current, [field]: value }));
  }

  function replaceFolder(nextFolder) {
    setFolders(current => current.map(folder => folder.id === nextFolder.id ? nextFolder : folder));
  }

  async function submitFolder(event) {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      const result = await createClientFolder(form);
      setFolders(current => [result.folder, ...current]);
      setSummary(result.summary);
      setAssignment(current => ({ ...current, folderId: result.folder.id }));
      setForm(DEFAULT_FORM);
      setMessage('Client folder created.');
    } catch (err) {
      setError(err.response?.data?.error || 'Folder create nahi ho saka.');
    }
  }

  async function changeStatus(folder, status) {
    const result = await updateClientFolder(folder.id, { status });
    replaceFolder(result.folder);
    setSummary(result.summary);
  }

  async function assignProject(event) {
    event.preventDefault();
    if (!assignment.folderId || !assignment.projectId) return;
    setMessage('');
    setError('');

    try {
      const result = await addProjectToClientFolder(assignment.folderId, assignment.projectId);
      replaceFolder(result.folder);
      setSummary(result.summary);
      setAssignment(current => ({ ...current, projectId: '' }));
      setMessage('Project added to folder.');
    } catch (err) {
      setError(err.response?.data?.error || 'Project folder mein add nahi ho saka.');
    }
  }

  async function removeProject(folderId, projectId) {
    const result = await removeProjectFromClientFolder(folderId, projectId);
    replaceFolder(result.folder);
    setSummary(result.summary);
  }

  async function deleteFolder(folderId) {
    const result = await deleteClientFolder(folderId);
    setFolders(current => current.filter(folder => folder.id !== folderId));
    setSummary(result.summary);
    setMessage('Client folder deleted.');
  }

  return (
    <section className="card clientFoldersPanel">
      <div className="sectionHeader">
        <div>
          <h2>Client Folders</h2>
          <p className="muted">Client, campaign, aur export groups.</p>
        </div>
        {summary && (
          <div className="folderSummary">
            <span>{summary.folders} folders</span>
            <span>{summary.assignedProjects} assigned</span>
            <span>{summary.unassignedProjects} unassigned</span>
          </div>
        )}
      </div>

      <form className="folderForm" onSubmit={submitFolder}>
        <div>
          <label>Folder Name</label>
          <input value={form.name} onChange={event => updateForm('name', event.target.value)} required />
        </div>
        <div>
          <label>Client</label>
          <input value={form.clientName} onChange={event => updateForm('clientName', event.target.value)} />
        </div>
        <div>
          <label>Status</label>
          <select value={form.status} onChange={event => updateForm('status', event.target.value)}>
            {STATUS_OPTIONS.map(status => <option value={status} key={status}>{status}</option>)}
          </select>
        </div>
        <div>
          <label>Color</label>
          <input type="color" value={form.color} onChange={event => updateForm('color', event.target.value)} />
        </div>
        <div className="folderNotesField">
          <label>Notes</label>
          <input value={form.notes} onChange={event => updateForm('notes', event.target.value)} />
        </div>
        <button type="submit">Create Folder</button>
      </form>

      <form className="assignForm" onSubmit={assignProject}>
        <select value={assignment.folderId} onChange={event => setAssignment(current => ({ ...current, folderId: event.target.value }))}>
          <option value="">Select folder</option>
          {folders.map(folder => <option value={folder.id} key={folder.id}>{folder.name}</option>)}
        </select>
        <select value={assignment.projectId} onChange={event => setAssignment(current => ({ ...current, projectId: event.target.value }))}>
          <option value="">Select project</option>
          {availableProjects.map(project => (
            <option value={project.id} key={project.id}>{project.title} - {project.status}</option>
          ))}
        </select>
        <button type="submit">Add Project</button>
      </form>

      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}

      <div className="folderGrid">
        {folders.map(folder => (
          <article className="clientFolderCard" key={folder.id} style={{ borderColor: folder.color }}>
            <div className="folderCardHeader">
              <span className="folderColor" style={{ background: folder.color }} />
              <div>
                <strong>{folder.name}</strong>
                <small>{folder.clientName}</small>
              </div>
              <select value={folder.status} onChange={event => changeStatus(folder, event.target.value)}>
                {STATUS_OPTIONS.map(status => <option value={status} key={status}>{status}</option>)}
              </select>
            </div>

            <div className="folderMetrics">
              <span>{folder.metrics.totalProjects} projects</span>
              <span>{folder.metrics.completedProjects} completed</span>
              <span>{folder.metrics.exports} exports</span>
            </div>

            {folder.notes && <p className="muted">{folder.notes}</p>}

            <div className="folderProjects">
              {folder.projects.map(project => (
                <div className="folderProjectRow" key={project.id}>
                  <div>
                    <strong>{project.title}</strong>
                    <small>{project.status} - {project.platform}</small>
                  </div>
                  <button type="button" className="tiny dangerButton" onClick={() => removeProject(folder.id, project.id)}>Remove</button>
                </div>
              ))}
              {!folder.projects.length && <p className="muted">No projects in this folder.</p>}
            </div>

            <button type="button" className="tiny dangerButton" onClick={() => deleteFolder(folder.id)}>Delete Folder</button>
          </article>
        ))}
        {!folders.length && <p className="muted">No client folders yet.</p>}
      </div>
    </section>
  );
}
