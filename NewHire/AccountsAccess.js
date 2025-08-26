document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const userName = params.get('user') || '';

  const form = document.getElementById('accountsAccessForm');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      userName,
      firstName: document.getElementById('firstName').value.trim(),
      lastName: document.getElementById('lastName').value.trim(),
      gender: document.getElementById('gender').value,
      birthdate: normalizeBirthdate(document.getElementById('birthdate').value),
      bios: document.getElementById('bios').value.trim(),
      feedback: document.getElementById('feedback').value.trim()
    };

    try {
      const resp = await fetch('AccountsAccess-api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await resp.json();
      const statusEl = document.getElementById('saveStatus');
      if (statusEl) {
        if (result.success) {
          statusEl.style.display = 'block';
          statusEl.textContent = 'Saved. Proceeding to IT setup...';
        } else {
          statusEl.style.display = 'block';
          statusEl.style.background = '#fdecea';
          statusEl.style.color = '#b71c1c';
          statusEl.style.borderColor = '#f5c6cb';
          statusEl.textContent = 'Failed to save: ' + (result.error || 'Unknown error');
          return;
        }
      }
      setTimeout(() => {
        const params = new URLSearchParams(window.location.search);
        const user = params.get('user') || '';
        window.location.href = `ITSetup.html?user=${encodeURIComponent(user)}`;
      }, 800);
    } catch (err) {
      alert('Error saving: ' + err.message);
    }
  });
});

function normalizeBirthdate(input) {
  const m = String(input).trim().match(/^([0-3]?\d)-([0-1]?\d)-(\d{4})$/);
  if (!m) return input; // fallback
  const d = m[1].padStart(2, '0');
  const mo = m[2].padStart(2, '0');
  const y = m[3];
  return `${y}-${mo}-${d}`;
}
