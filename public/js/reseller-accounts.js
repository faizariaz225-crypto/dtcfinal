/* ─── DTC Admin — Reseller Portal Account Manager ────────────────────────── */
'use strict';

const ResellerAccounts = (() => {

  let _list = []; // cached list from server

  // ── Load & render ────────────────────────────────────────────────────────────
  const load = async () => {
    const wrap = document.getElementById('reseller-accounts-list');
    if (!wrap) return;
    wrap.innerHTML = '<div class="empty">Loading…</div>';
    const d = await api(`/admin/reseller-accounts?adminKey=${encodeURIComponent(Store.adminKey)}`);
    if (!d || d.error) { wrap.innerHTML = '<div class="empty">Failed to load reseller accounts.</div>'; return; }
    _list = d.resellers || [];
    _render();
  };

  const _render = () => {
    const wrap = document.getElementById('reseller-accounts-list');
    if (!wrap) return;
    if (!_list.length) {
      wrap.innerHTML = '<div class="empty">No reseller accounts yet. Add one to give a reseller access to their portal.</div>';
      return;
    }
    const sym = (Store.settings || {}).currencySymbol || '$';
    wrap.innerHTML = `
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:.82rem">
          <thead>
            <tr style="background:var(--bg);text-align:left">
              <th style="padding:.5rem .75rem;font-size:.7rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--border)">Reseller ID</th>
              <th style="padding:.5rem .75rem;font-size:.7rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--border)">Name</th>
              <th style="padding:.5rem .75rem;font-size:.7rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--border)">Commission</th>
              <th style="padding:.5rem .75rem;font-size:.7rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--border)">Created</th>
              <th style="padding:.5rem .75rem;font-size:.7rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--border)">Portal Link</th>
              <th style="padding:.5rem .75rem;font-size:.7rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--border)">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${_list.map(r => `
              <tr style="border-bottom:1px solid var(--border)">
                <td style="padding:.6rem .75rem;font-family:monospace;font-size:.78rem;color:var(--muted)">${esc(r.id)}</td>
                <td style="padding:.6rem .75rem;font-weight:600">${esc(r.name)}</td>
                <td style="padding:.6rem .75rem;color:${r.commissionPct > 0 ? 'var(--success)' : 'var(--muted)'}">${r.commissionPct > 0 ? r.commissionPct + '%' : '—'}</td>
                <td style="padding:.6rem .75rem;color:var(--muted)">${r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—'}</td>
                <td style="padding:.6rem .75rem">
                  <button class="btn btn-sm btn-ghost-blue" style="font-size:.72rem" onclick="copyText(window.location.origin+'/reseller',this)">Copy Link</button>
                </td>
                <td style="padding:.6rem .75rem;display:flex;gap:.4rem;align-items:center">
                  <button class="btn btn-sm btn-outline" onclick="ResellerAccounts.openEdit('${esc(r.id)}')">Edit</button>
                  <button class="btn btn-sm" style="background:var(--error-bg);color:var(--error);border:1px solid var(--error-border)" onclick="ResellerAccounts.del('${esc(r.id)}','${esc(r.name)}')">Delete</button>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  };

  // ── Add / Edit modal ─────────────────────────────────────────────────────────
  const openAdd  = () => _openModal(null);
  const openEdit = (id) => {
    const r = _list.find(x => x.id === id);
    if (r) _openModal(r);
  };

  const _openModal = (existing) => {
    const isEdit = !!existing;
    const modal = document.createElement('div');
    modal.id = 'ra-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center';
    modal.innerHTML = `
      <div style="background:var(--white,#fff);border-radius:14px;padding:1.7rem;width:min(480px,95vw);box-shadow:0 8px 40px rgba(0,0,0,.18);max-height:90vh;overflow-y:auto">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.3rem">
          <h3 style="margin:0;font-size:1rem;font-weight:700">${isEdit ? '✏ Edit Reseller Account' : '+ New Reseller Account'}</h3>
          <button onclick="document.getElementById('ra-modal').remove()" style="background:none;border:none;font-size:1.3rem;cursor:pointer;color:var(--muted)">✕</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:.85rem">
          <div>
            <label style="font-size:.73rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;display:block;margin-bottom:.3rem">Reseller ID <span style="color:var(--error)">*</span></label>
            <input id="ra-id" value="${isEdit ? esc(existing.id) : ''}" placeholder="e.g. reseller_ahmed" ${isEdit ? 'readonly style="background:#f8faff;color:var(--muted)"' : ''} style="width:100%;padding:.55rem .8rem;border:1px solid var(--border);border-radius:8px;font-size:.88rem;font-family:monospace;box-sizing:border-box"/>
            ${!isEdit ? '<div style="font-size:.7rem;color:var(--muted);margin-top:.2rem">Used as login username. Lowercase, no spaces. Cannot be changed later.</div>' : ''}
          </div>
          <div>
            <label style="font-size:.73rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;display:block;margin-bottom:.3rem">Display Name <span style="color:var(--error)">*</span></label>
            <input id="ra-name" value="${isEdit ? esc(existing.name) : ''}" placeholder="e.g. Ahmed Khan" style="width:100%;padding:.55rem .8rem;border:1px solid var(--border);border-radius:8px;font-size:.88rem;box-sizing:border-box"/>
          </div>
          <div>
            <label style="font-size:.73rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;display:block;margin-bottom:.3rem">Password <span style="color:var(--error)">*</span></label>
            <input id="ra-pw" type="password" placeholder="${isEdit ? 'Enter new password to change' : 'Set a strong password'}" style="width:100%;padding:.55rem .8rem;border:1px solid var(--border);border-radius:8px;font-size:.88rem;box-sizing:border-box"/>
            ${isEdit ? '<div style="font-size:.7rem;color:var(--muted);margin-top:.2rem">Leave blank to keep current password.</div>' : ''}
          </div>
          <div>
            <label style="font-size:.73rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;display:block;margin-bottom:.3rem">Commission % <span style="font-weight:400;text-transform:none;color:var(--muted)">(optional)</span></label>
            <input id="ra-comm" type="number" min="0" max="100" step="0.1" value="${isEdit ? (existing.commissionPct || '') : ''}" placeholder="e.g. 10" style="width:100%;padding:.55rem .8rem;border:1px solid var(--border);border-radius:8px;font-size:.88rem;box-sizing:border-box"/>
            <div style="font-size:.7rem;color:var(--muted);margin-top:.2rem">If set, the reseller portal will display their estimated earnings. Set to 0 to hide.</div>
          </div>
          <div id="ra-msg" style="display:none;font-size:.8rem;padding:.45rem .75rem;border-radius:7px"></div>
          <div style="display:flex;gap:.7rem;justify-content:flex-end;margin-top:.3rem">
            <button onclick="document.getElementById('ra-modal').remove()" style="background:none;border:1px solid var(--border);border-radius:8px;padding:.5rem 1rem;font-size:.85rem;cursor:pointer;color:var(--muted)">Cancel</button>
            <button id="ra-save-btn" style="background:var(--accent,#2563eb);color:#fff;border:none;border-radius:8px;padding:.5rem 1.3rem;font-size:.88rem;font-weight:600;cursor:pointer" onclick="ResellerAccounts._save(${isEdit})">
              ${isEdit ? 'Save Changes' : 'Create Account'}
            </button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(modal);
    if (!isEdit) document.getElementById('ra-id').focus();
    else document.getElementById('ra-name').focus();
  };

  // ── Save ─────────────────────────────────────────────────────────────────────
  const _save = async (isEdit) => {
    const btn  = document.getElementById('ra-save-btn');
    const msg  = document.getElementById('ra-msg');
    const id   = document.getElementById('ra-id').value.trim();
    const name = document.getElementById('ra-name').value.trim();
    const pw   = document.getElementById('ra-pw').value;
    const comm = parseFloat(document.getElementById('ra-comm').value) || 0;

    const showErr = (t) => { msg.style.display='block'; msg.style.background='var(--error-bg,#fef2f2)'; msg.style.color='var(--error,#dc2626)'; msg.style.border='1px solid var(--error-border,#fecaca)'; msg.textContent=t; };
    const showOk  = (t) => { msg.style.display='block'; msg.style.background='#f0fdf4'; msg.style.color='#16a34a'; msg.style.border='1px solid #bbf7d0'; msg.textContent=t; };

    if (!id)   { showErr('Reseller ID is required.'); return; }
    if (!name) { showErr('Display name is required.'); return; }
    if (!isEdit && !pw) { showErr('Password is required.'); return; }
    if (!/^[a-zA-Z0-9_\-]+$/.test(id)) { showErr('Reseller ID can only contain letters, numbers, underscores and hyphens.'); return; }

    // For edit with blank password, use a placeholder the server will ignore
    // Actually we'll fetch existing password if blank (server handles it by merging)
    const reseller = { id, name, password: pw || '__KEEP__', commissionPct: comm };

    btn.textContent = 'Saving…'; btn.disabled = true;
    const d = await api('/admin/reseller-accounts/save', { adminKey: Store.adminKey, reseller });
    btn.textContent = isEdit ? 'Save Changes' : 'Create Account'; btn.disabled = false;

    if (d && d.success) {
      showOk('✓ Saved successfully.');
      setTimeout(() => { document.getElementById('ra-modal')?.remove(); load(); }, 900);
    } else {
      showErr('✕ ' + (d && d.error || 'Failed to save.'));
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const del = async (id, name) => {
    if (!confirm(`Delete reseller account "${name}" (${id})?\n\nThis will remove their portal login. Their customer records will not be affected.`)) return;
    const d = await api('/admin/reseller-accounts/delete', { adminKey: Store.adminKey, resellerId: id });
    if (d && d.success) { load(); }
    else alert('Failed to delete: ' + (d && d.error || 'Unknown error'));
  };

  return { load, openAdd, openEdit, _save, del };
})();
