const api = 'tasks-api.php';

document.addEventListener('DOMContentLoaded', () => {
  loadTasks();
  const form = document.getElementById('taskForm');
  form.addEventListener('submit', onAddTask);
});

async function loadTasks() {
  try {
    const res = await fetch(api + '?_=' + Date.now(), { cache: 'no-store' });
    const list = await res.json();
    renderTasks(Array.isArray(list) ? list : []);
  } catch (e) {
    renderTasks([]);
  }
}

function renderTasks(tasks) {
  const container = document.getElementById('taskList');
  container.innerHTML = '';
  if (!tasks.length) {
    container.innerHTML = '<div class="task-item">No tasks yet. Add your first task above.</div>';
    return;
  }
  tasks.forEach(t => container.appendChild(taskItem(t)));
}

function taskItem(t) {
  const el = document.createElement('div');
  el.className = 'task-item';
  el.innerHTML = `
    <div class="task-meta">
      <div class="task-title">${escapeHtml(t.title)}</div>
      ${t.assignee ? `<div class="chip">${escapeHtml(t.assignee)}</div>` : ''}
      <div class="chip ${t.priority.toLowerCase()}">${t.priority}</div>
    </div>
    <div class="task-actions">
      <button class="btn-outline" onclick="markDone('${t.id}')">Done</button>
      <button class="btn-delete" onclick="removeTask('${t.id}')">Delete</button>
    </div>
  `;
  return el;
}

async function onAddTask(e) {
  e.preventDefault();
  const title = document.getElementById('taskTitle').value.trim();
  const assignee = document.getElementById('taskAssignee').value.trim();
  const priority = document.getElementById('taskPriority').value;
  if (!title) return;
  await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, assignee, priority }) });
  e.target.reset();
  loadTasks();
}

async function removeTask(id) {
  await fetch(api, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
  loadTasks();
}

async function markDone(id) {
  await fetch(api + '?action=done&id=' + encodeURIComponent(id), { method: 'POST' });
  loadTasks();
}

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[s]));
}


