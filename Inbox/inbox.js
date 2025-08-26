const API_BASE = 'messages-api.php';

const state = {
  managers: [],
  currentUserId: null,
  activeRecipientId: null,
  pollHandle: null,
};

function $(id) { return document.getElementById(id); }

async function apiGet(params) {
  const url = API_BASE + '?' + new URLSearchParams(params).toString();
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error('API error');
  return res.json();
}

async function apiPost(action, body) {
  const res = await fetch(API_BASE + '?action=' + encodeURIComponent(action), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('API error');
  return res.json();
}

function initials(name) {
  return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
}

function renderManagers(filter = '') {
  const list = $('managerList');
  const query = filter.trim().toLowerCase();
  const filtered = state.managers.filter(m => m.name.toLowerCase().includes(query) && m.id !== state.currentUserId);
  list.innerHTML = '';
  filtered.forEach(m => {
    const li = document.createElement('li');
    li.className = 'manager-item';
    li.dataset.id = m.id;
    li.innerHTML = `
      <div class="avatar">${initials(m.name)}</div>
      <div class="manager-meta">
        <div class="manager-name">${m.name}</div>
        <div class="manager-role">${m.role || ''}</div>
      </div>
      <div class="last-message" data-last-for="${m.id}"></div>
    `;
    li.addEventListener('click', () => openConversation(m.id));
    list.appendChild(li);
  });
}

function renderRecipient(recipient) {
  $('recipientName').textContent = recipient ? recipient.name : 'Select a manager';
  $('recipientRole').textContent = recipient ? (recipient.role || '') : '';
}

function renderMessages(messages) {
  const container = $('messages');
  container.innerHTML = '';
  messages.forEach(msg => {
    const el = document.createElement('div');
    el.className = 'message' + (msg.senderId === state.currentUserId ? ' me' : '');
    el.innerHTML = `
      <div class="content">${escapeHtml(msg.content)}</div>
      <div class="meta">${formatTime(msg.timestamp)}</div>
    `;
    container.appendChild(el);
  });
  container.scrollTop = container.scrollHeight;
}

function escapeHtml(str) {
  return str.replace(/[&<>\"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]));
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString();
}

async function loadManagers() {
  const res = await fetch('../Uploads/managers.json?ts=' + Date.now(), { cache: 'no-store' });
  const data = await res.json();
  state.managers = (data && Array.isArray(data.managers)) ? data.managers : [];
  const select = $('currentUser');
  select.innerHTML = state.managers.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
  const urlUser = new URLSearchParams(location.search).get('user');
  state.currentUserId = urlUser || (state.managers[0] && state.managers[0].id);
  select.value = state.currentUserId;
  renderManagers();
  await refreshLastMessages();
}

async function refreshLastMessages() {
  const res = await apiGet({ action: 'conversations', userId: state.currentUserId });
  const lastMap = res.conversations || {};
  document.querySelectorAll('[data-last-for]').forEach(el => {
    const id = el.getAttribute('data-last-for');
    const last = lastMap[id];
    el.textContent = last ? last.content.slice(0, 40) : '';
  });
}

async function openConversation(recipientId) {
  state.activeRecipientId = recipientId;
  const recipient = state.managers.find(m => m.id === recipientId);
  renderRecipient(recipient);
  const data = await apiGet({ action: 'messages', userId: state.currentUserId, with: recipientId });
  renderMessages(data.messages || []);
  startPolling();
}

function startPolling() {
  if (state.pollHandle) window.clearInterval(state.pollHandle);
  state.pollHandle = window.setInterval(async () => {
    if (!state.activeRecipientId) return;
    const data = await apiGet({ action: 'messages', userId: state.currentUserId, with: state.activeRecipientId });
    renderMessages(data.messages || []);
    await refreshLastMessages();
  }, 5000);
}

async function onSend(e) {
  e.preventDefault();
  const input = $('messageInput');
  const content = input.value.trim();
  if (!content || !state.activeRecipientId) return;
  await apiPost('send', {
    senderId: state.currentUserId,
    recipientId: state.activeRecipientId,
    content
  });
  input.value = '';
  const data = await apiGet({ action: 'messages', userId: state.currentUserId, with: state.activeRecipientId });
  renderMessages(data.messages || []);
  await refreshLastMessages();
}

function attachEvents() {
  $('currentUser').addEventListener('change', async (e) => {
    state.currentUserId = e.target.value;
    renderManagers($('searchManagers').value);
    await refreshLastMessages();
  });
  $('searchManagers').addEventListener('input', (e) => {
    renderManagers(e.target.value);
  });
  $('messageForm').addEventListener('submit', onSend);
}

async function init() {
  attachEvents();
  await loadManagers();
}

document.addEventListener('DOMContentLoaded', init);


