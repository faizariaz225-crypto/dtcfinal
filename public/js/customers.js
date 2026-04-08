/* ─── DTC Admin — Customers Module ──────────────────────────────────────── */

'use strict';

const Customers = (() => {

  const render = () => {
    const filter    = Store.custFilter;
    const activated = Object.entries(Store.tokens)
      .filter(([, t]) => t.approved && t.email)
      .sort((a, b) => daysUntil(a[1].subscriptionExpiresAt || '9999') - daysUntil(b[1].subscriptionExpiresAt || '9999'));

    // Update expiring-soon badge in sidebar
    const expiring = activated.filter(([, t]) => {
      const d = daysUntil(t.subscriptionExpiresAt || '9999');
      return d >= 0 && d <= 30;
    }).length;
    const nb = document.getElementById('nb-exp');
    nb.textContent = expiring;
    nb.style.display = expiring > 0 ? '' : 'none';

    const filtered = activated.filter(([, t]) => {
      if (filter === 'all')      return true;
      const st = getSubStatus(t);
      if (filter === 'active')   return st === 'ok';
      if (filter === 'expiring') return st === 'soon' || st === 'danger';
      if (filter === 'expired')  return st === 'expired';
      return true;
    });

    const wrap = document.getElementById('cust-list');
    if (!filtered.length) {
      wrap.innerHTML = '<div class="empty">No customers match this filter.</div>';
      return;
    }

    wrap.innerHTML = filtered.map(([token, t]) => _card(token, t)).join('');
  };

  const _card = (token, t) => {
    const subSt   = getSubStatus(t);
    const days    = t.subscriptionExpiresAt ? daysUntil(t.subscriptionExpiresAt) : null;
    const total   = t.subscriptionDays || 30;
    const pct     = Math.min(100, Math.max(0, ((total - (days || 0)) / total) * 100));
    const barColor= subSt === 'expired' || subSt === 'danger' ? '#dc2626' : subSt === 'soon' ? '#d97706' : '#16a34a';
    const dCls    = subSt === 'expired' || subSt === 'danger' ? 'red' : subSt === 'soon' ? 'warn' : 'green';
    const cardCls = 'cust-card' + (subSt === 'soon' || subSt === 'danger' ? ' expiring' : subSt === 'expired' ? ' expired-sub' : '');

    const expBadge = days === null ? ''
      : days < 0   ? `<span class="badge b-exp">✕ Expired</span>`
      : days <= 5  ? `<span class="badge" style="background:#fef2f2;border:1px solid #fecaca;color:#dc2626">⚠ ${days}d left</span>`
      : days <= 30 ? `<span class="badge" style="background:#fffbeb;border:1px solid #fde68a;color:#d97706">⏰ ${days}d left</span>`
      :              `<span class="badge b-act">✓ Active · ${days}d left</span>`;

    const expDate = t.subscriptionExpiresAt
      ? new Date(t.subscriptionExpiresAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
      : '—';

    const prodTag = t.product === 'chatgpt'
      ? `<span class="prod-tag prod-chatgpt">ChatGPT Plus</span>`
      : `<span class="prod-tag prod-claude">Claude Pro</span>`;

    const dataRow = t.product === 'chatgpt'
      ? `<div>
           <div class="cf-lbl">Session Data</div>
           <div style="display:flex;gap:.3rem">
             <button class="icopy btn-sm" style="color:var(--gpt)" onclick="Modals.viewSession('${token}')">View</button>
             <button class="icopy btn-sm" onclick="copyText(${JSON.stringify(t.sessionData || '')}, this)">Copy</button>
           </div>
         </div>`
      : `<div>
           <div class="cf-lbl">Organization ID</div>
           <div style="display:flex;align-items:flex-start;gap:.3rem">
             <div class="cf-val" style="flex:1">${esc((t.orgId || '—').slice(0, 22))}…</div>
             ${t.orgId ? `<button class="icopy btn-sm" onclick="copyText('${esc(t.orgId)}', this)">Copy</button>` : ''}
           </div>
         </div>`;

    const expiredNote = days !== null && days < 0
      ? `<div style="margin-top:.4rem;font-size:.72rem;background:var(--error-bg);border:1px solid var(--error-border);border-radius:7px;padding:.45rem .7rem;color:var(--error);font-weight:600">
           ⏱ Expired ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} ago
         </div>`
      : '';

    return `<div class="${cardCls}">
      <div class="cust-top">
        <div>
          <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.3rem">
            ${prodTag}
            <div class="cust-nm">${esc(t.customerName)}</div>
          </div>
          <div class="cust-pk">${esc(t.packageType)}</div>
        </div>
        <div>${expBadge}</div>
      </div>

      <div class="cust-grid">
        <div><div class="cf-lbl">Email</div><div class="cf-val">${esc(t.email || '—')}</div></div>
        <div><div class="cf-lbl">WeChat</div><div class="cf-val">${esc(t.wechat || '—')}</div></div>
        ${dataRow}
        <div>
          <div class="cf-lbl">Activated On</div>
          <div class="cf-val">${t.approvedAt ? new Date(t.approvedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</div>
        </div>
        <div><div class="cf-lbl">Expires On</div><div class="cf-val ${dCls}">${expDate}</div></div>
        <div>
          <div class="cf-lbl">Days Remaining</div>
          <div class="cf-val ${dCls}">${days === null ? '—' : days <= 0 ? 'Expired' : days + ' days'}</div>
        </div>
      </div>

      ${expiredNote}

      <div class="exp-bar-wrap" style="margin-top:${expiredNote ? '.6rem' : '.1rem'}">
        <div class="exp-bar-label">
          <span>Subscription Usage</span>
          <span style="font-weight:600">${Math.round(pct)}% used</span>
        </div>
        <div class="exp-bar">
          <div class="exp-bar-fill" style="width:${pct}%;background:${barColor}"></div>
        </div>
      </div>

      <div class="email-actions">
        <button class="btn btn-ghost-blue btn-sm" onclick="Customers.sendReminder('${token}', 'reminder')">📧 Send 5-day Reminder</button>
        <button class="btn btn-outline btn-sm" style="border-color:var(--error-border);color:var(--error)" onclick="Customers.sendReminder('${token}', 'expired')">📧 Send Expiry Notice</button>
        <button class="btn btn-outline btn-sm" style="border-color:#7c3aed;color:#7c3aed" onclick="Customers.openCustomEmail('${token}')">✉ Custom Email</button>
        <button class="btn btn-outline btn-sm" style="border-color:var(--accent);color:var(--accent)" onclick="Customers.openEdit('${token}')">✏ Edit</button>
      </div>
    </div>`;
  };

  const setFilter = (f, btn) => {
    Store.setCustFilter(f);
    document.querySelectorAll('#cf .fb').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    render();
  };

  const sendReminder = async (token, type) => {
    const d = await api('/admin/send-reminder', { adminKey: Store.adminKey, token, type });
    alert(d && d.ok ? '✓ Email sent successfully.' : '✕ Failed: ' + (d && d.error));
    if (d && d.ok) Dashboard.reload();
  };

  const openCustomEmail = (token) => {
    const t = Store.tokens[token];
    const defaultTo = (t && t.email) || '';
    const modal = document.createElement('div');
    modal.id = 'custom-email-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center';
    modal.innerHTML = `
      <div style="background:var(--card);border-radius:14px;padding:1.6rem;width:min(520px,95vw);box-shadow:0 8px 40px rgba(0,0,0,.18);max-height:90vh;overflow-y:auto">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.2rem">
          <h3 style="margin:0;font-size:1rem;font-weight:700">✉ Send Custom Email</h3>
          <button onclick="document.getElementById('custom-email-modal').remove()" style="background:none;border:none;font-size:1.3rem;cursor:pointer;color:var(--muted)">✕</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:.8rem">
          <div>
            <label style="font-size:.75rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em">To (Email)</label>
            <input id="ce-to" value="${esc(defaultTo)}" placeholder="customer@example.com" style="width:100%;margin-top:.3rem;padding:.55rem .8rem;border:1px solid var(--border);border-radius:8px;font-size:.88rem;background:var(--input-bg,#fff);color:var(--text);box-sizing:border-box"/>
            <div style="font-size:.71rem;color:var(--muted);margin-top:.2rem">No email on record? Type any address above.</div>
          </div>
          <div>
            <label style="font-size:.75rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em">Subject</label>
            <input id="ce-subject" placeholder="Your subject here…" style="width:100%;margin-top:.3rem;padding:.55rem .8rem;border:1px solid var(--border);border-radius:8px;font-size:.88rem;background:var(--input-bg,#fff);color:var(--text);box-sizing:border-box"/>
          </div>
          <div>
            <label style="font-size:.75rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em">Message (plain text)</label>
            <textarea id="ce-body" rows="6" placeholder="Write your message here…" style="width:100%;margin-top:.3rem;padding:.55rem .8rem;border:1px solid var(--border);border-radius:8px;font-size:.88rem;background:var(--input-bg,#fff);color:var(--text);resize:vertical;box-sizing:border-box;font-family:inherit"></textarea>
          </div>
          <div id="ce-msg" style="display:none;font-size:.8rem;padding:.4rem .7rem;border-radius:7px"></div>
          <button id="ce-send-btn" style="background:var(--accent);color:#fff;border:none;border-radius:8px;padding:.6rem 1.2rem;font-size:.88rem;font-weight:600;cursor:pointer" onclick="Customers._sendCustomEmail('${token}')">Send Email</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
  };

  const _sendCustomEmail = async (token) => {
    const to      = document.getElementById('ce-to').value.trim();
    const subject = document.getElementById('ce-subject').value.trim();
    const body    = document.getElementById('ce-body').value.trim();
    const msg     = document.getElementById('ce-msg');
    const btn     = document.getElementById('ce-send-btn');
    if (!to || !subject || !body) {
      msg.style.display='block'; msg.style.background='var(--error-bg)'; msg.style.color='var(--error)'; msg.textContent='Please fill all fields.'; return;
    }
    btn.textContent = 'Sending…'; btn.disabled = true;
    const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#1e293b;line-height:1.7">${body.replace(/\n/g,'<br>')}</div>`;
    const d = await api('/admin/send-custom-email', { adminKey: Store.adminKey, to, subject, html, token });
    btn.textContent = 'Send Email'; btn.disabled = false;
    msg.style.display='block';
    if (d && d.ok) {
      msg.style.background='#f0fdf4'; msg.style.color='#16a34a'; msg.textContent='✓ Email sent successfully.';
      setTimeout(() => document.getElementById('custom-email-modal')?.remove(), 1800);
    } else {
      msg.style.background='var(--error-bg)'; msg.style.color='var(--error)'; msg.textContent='✕ Failed: '+(d&&d.error||'Unknown error');
    }
  };

  const openEdit = (token) => {
    const t = Store.tokens[token];
    if (!t) return;
    const expDate = t.subscriptionExpiresAt ? t.subscriptionExpiresAt.split('T')[0] : '';
    const modal = document.createElement('div');
    modal.id = 'edit-token-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center';
    modal.innerHTML = `
      <div style="background:var(--card);border-radius:14px;padding:1.6rem;width:min(540px,95vw);box-shadow:0 8px 40px rgba(0,0,0,.18);max-height:90vh;overflow-y:auto">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.2rem">
          <h3 style="margin:0;font-size:1rem;font-weight:700">✏ Edit Customer — ${esc(t.customerName)}</h3>
          <button onclick="document.getElementById('edit-token-modal').remove()" style="background:none;border:none;font-size:1.3rem;cursor:pointer;color:var(--muted)">✕</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.8rem">
          ${_field('et-name',    'Customer Name',      t.customerName || '')}
          ${_field('et-pkg',     'Package Type',       t.packageType  || '')}
          ${_field('et-email',   'Email',              t.email        || '')}
          ${_field('et-wechat',  'WeChat',             t.wechat       || '')}
          ${_field('et-price',   'Price ($)',           t.price != null ? t.price : '', 'number')}
          ${_field('et-days',    'Subscription Days',  t.subscriptionDays || 30, 'number')}
          <div style="grid-column:1/-1">${_field('et-expiry', 'Expiry Date', expDate, 'date')}</div>
        </div>
        <div style="margin-top:.4rem;font-size:.72rem;color:var(--muted)">Changing days does NOT auto-recalculate the expiry date. Update both if needed.</div>
        <div id="et-msg" style="display:none;margin-top:.8rem;font-size:.8rem;padding:.4rem .7rem;border-radius:7px"></div>
        <div style="display:flex;gap:.7rem;margin-top:1.1rem;justify-content:flex-end">
          <button onclick="document.getElementById('edit-token-modal').remove()" style="background:none;border:1px solid var(--border);border-radius:8px;padding:.5rem 1rem;font-size:.85rem;cursor:pointer;color:var(--muted)">Cancel</button>
          <button id="et-save-btn" style="background:var(--accent);color:#fff;border:none;border-radius:8px;padding:.5rem 1.2rem;font-size:.88rem;font-weight:600;cursor:pointer" onclick="Customers._saveEdit('${token}')">Save Changes</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
  };

  const _field = (id, label, value, type='text') =>
    `<div>
      <label style="font-size:.75rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em">${label}</label>
      <input id="${id}" type="${type}" value="${esc(String(value))}" style="width:100%;margin-top:.3rem;padding:.55rem .8rem;border:1px solid var(--border);border-radius:8px;font-size:.88rem;background:var(--input-bg,#fff);color:var(--text);box-sizing:border-box"/>
    </div>`;

  const _saveEdit = async (token) => {
    const btn = document.getElementById('et-save-btn');
    const msg = document.getElementById('et-msg');
    const expiryVal = document.getElementById('et-expiry').value;
    btn.textContent = 'Saving…'; btn.disabled = true;
    const fields = {
      customerName:          document.getElementById('et-name').value.trim(),
      packageType:           document.getElementById('et-pkg').value.trim(),
      email:                 document.getElementById('et-email').value.trim(),
      wechat:                document.getElementById('et-wechat').value.trim(),
      price:                 parseFloat(document.getElementById('et-price').value) || 0,
      subscriptionDays:      parseInt(document.getElementById('et-days').value) || 30,
      subscriptionExpiresAt: expiryVal ? new Date(expiryVal).toISOString() : undefined,
    };
    if (!fields.customerName) { msg.style.display='block'; msg.style.background='var(--error-bg)'; msg.style.color='var(--error)'; msg.textContent='Customer name is required.'; btn.textContent='Save Changes'; btn.disabled=false; return; }
    const d = await api('/admin/edit-token', { adminKey: Store.adminKey, token, fields });
    btn.textContent = 'Save Changes'; btn.disabled = false;
    if (d && d.success) {
      msg.style.display='block'; msg.style.background='#f0fdf4'; msg.style.color='#16a34a'; msg.textContent='✓ Saved.';
      setTimeout(() => { document.getElementById('edit-token-modal')?.remove(); Dashboard.reload(); }, 900);
    } else {
      msg.style.display='block'; msg.style.background='var(--error-bg)'; msg.style.color='var(--error)'; msg.textContent='✕ Failed: '+(d&&d.error||'Unknown');
    }
  };

  return { render, setFilter, sendReminder, openCustomEmail, _sendCustomEmail, openEdit, _field, _saveEdit };
})();
