/* ─── DTC Admin — Global Search ─────────────────────────────────────────── */
'use strict';

const GlobalSearch = (() => {
  let _timer = null;
  let _visible = false;

  const search = (q) => {
    const clearBtn = document.getElementById('gs-clear');
    if (clearBtn) clearBtn.style.display = q ? 'block' : 'none';
    clearTimeout(_timer);
    if (!q || q.trim().length < 2) { _hideResults(); return; }
    _timer = setTimeout(() => _run(q.trim()), 160);
  };

  const _run = (q) => {
    const lq = q.toLowerCase();
    const tokens = Store.tokens || {};
    const results = [];

    for (const [token, t] of Object.entries(tokens)) {
      const match =
        (t.customerName || '').toLowerCase().includes(lq) ||
        (t.email        || '').toLowerCase().includes(lq) ||
        (t.wechat       || '').toLowerCase().includes(lq) ||
        (t.packageType  || '').toLowerCase().includes(lq) ||
        (t.productName  || '').toLowerCase().includes(lq) ||
        (t.notes || []).some(n => (n.text || '').toLowerCase().includes(lq));
      if (match) results.push({ token, t });
    }

    // Sort: approved first, then by name
    results.sort((a, b) => {
      if (a.t.approved && !b.t.approved) return -1;
      if (!a.t.approved && b.t.approved) return 1;
      return (a.t.customerName || '').localeCompare(b.t.customerName || '');
    });

    const label = document.getElementById('gs-results-label');
    const cnt   = document.getElementById('gs-count');
    const list  = document.getElementById('gs-results-list');

    label.textContent = results.length
      ? `${results.length} result${results.length !== 1 ? 's' : ''} for "${q}"`
      : `No results for "${q}"`;

    if (cnt) { cnt.textContent = results.length ? `${results.length} found` : ''; cnt.style.display = results.length ? '' : 'none'; }

    if (!results.length) {
      list.innerHTML = `<div style="padding:2.5rem;text-align:center;color:var(--muted);font-size:.85rem">No customers match <strong>"${esc(q)}"</strong>.<br/><span style="font-size:.78rem">Try name, email, WeChat ID, or package type.</span></div>`;
    } else {
      list.innerHTML = results.map(({ token, t }) => {
        const days    = t.subscriptionExpiresAt ? Math.ceil((new Date(t.subscriptionExpiresAt) - new Date()) / (1000*60*60*24)) : null;
        const isExp   = days !== null && days < 0;
        const isWarn  = days !== null && days >= 0 && days <= 30;
        const statusColor = t.deactivated ? '#94a3b8' : t.approved ? (isExp ? '#ef4444' : isWarn ? '#d97706' : '#16a34a') : '#94a3b8';
        const statusText  = t.deactivated ? 'Deactivated' : !t.approved ? 'Pending' : isExp ? `Expired ${Math.abs(days)}d ago` : t.approved ? (days !== null ? `${days}d left` : 'Active') : '—';
        const noteCount   = (t.notes || []).length;
        const sym = (Store.settings || {}).currencySymbol || '$';

        return `<div class="gs-result-row" onclick="GlobalSearch.jumpTo('${token}')" style="display:flex;align-items:flex-start;gap:.9rem;padding:.85rem 1.1rem;border-bottom:1px solid var(--border);cursor:pointer;transition:background .15s" onmouseenter="this.style.background='#f8faff'" onmouseleave="this.style.background=''">
          <div style="width:36px;height:36px;border-radius:9px;background:${statusColor}20;border:1px solid ${statusColor}40;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:1rem">
            ${t.product === 'chatgpt' ? '💬' : '🤖'}
          </div>
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap">
              <span style="font-weight:700;font-size:.88rem">${_highlight(esc(t.customerName), q)}</span>
              <span style="font-size:.65rem;background:${statusColor}15;border:1px solid ${statusColor}30;color:${statusColor};border-radius:99px;padding:.12rem .55rem;font-weight:600">${statusText}</span>
              ${t.price ? `<span style="font-size:.7rem;color:var(--success);font-weight:700">${sym}${t.price.toFixed(2)}</span>` : ''}
            </div>
            <div style="font-size:.76rem;color:var(--muted);margin-top:.2rem">${_highlight(esc(t.packageType), q)}${t.email ? ` · ${_highlight(esc(t.email), q)}` : ''}${t.wechat ? ` · ${_highlight(esc(t.wechat), q)}` : ''}</div>
            ${noteCount ? `<div style="font-size:.7rem;color:#7c3aed;margin-top:.2rem">📝 ${noteCount} note${noteCount !== 1 ? 's' : ''}</div>` : ''}
          </div>
          <div style="display:flex;flex-direction:column;gap:.3rem;align-items:flex-end;flex-shrink:0">
            <button onclick="event.stopPropagation();GlobalSearch.hide();Notes.open('${token}')" style="background:none;border:1px solid var(--border);border-radius:6px;padding:.25rem .6rem;font-size:.68rem;cursor:pointer;color:var(--muted)">📝 Notes</button>
            ${t.approved ? `<button onclick="event.stopPropagation();GlobalSearch.hide();RenewalModal.open('${token}')" style="background:none;border:1px solid #e9d5ff;border-radius:6px;padding:.25rem .6rem;font-size:.68rem;cursor:pointer;color:#7c3aed">🔁 Renew</button>` : ''}
          </div>
        </div>`;
      }).join('');
    }

    _showResults();
  };

  const _highlight = (text, q) => {
    if (!q) return text;
    const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi');
    return text.replace(re, '<mark style="background:#fef08a;border-radius:2px;padding:0 1px">$1</mark>');
  };

  const _showResults = () => {
    const overlay = document.getElementById('gs-results');
    if (overlay) { overlay.style.display = 'block'; _visible = true; }
  };
  const _hideResults = () => {
    const overlay = document.getElementById('gs-results');
    if (overlay) { overlay.style.display = 'none'; _visible = false; }
    const cnt = document.getElementById('gs-count');
    if (cnt) cnt.style.display = 'none';
  };

  const show  = () => { const q = (document.getElementById('global-search-inp')?.value || '').trim(); if (q.length >= 2) _run(q); };
  const hide  = () => _hideResults();
  const clear = () => {
    const inp = document.getElementById('global-search-inp');
    if (inp) inp.value = '';
    const clearBtn = document.getElementById('gs-clear');
    if (clearBtn) clearBtn.style.display = 'none';
    _hideResults();
  };

  const jumpTo = (token) => {
    _hideResults();
    // Navigate to dashboard and highlight
    Shell.navigate('dashboard', document.querySelector('.nav-item'));
    setTimeout(() => {
      const el = document.getElementById(`log-row-${token}`)?.previousElementSibling
              || document.querySelector(`[onclick*="'${token}'"]`)?.closest('tr');
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.style.outline = '2px solid var(--accent,#2563eb)'; el.style.borderRadius = '6px'; setTimeout(() => { el.style.outline = ''; el.style.borderRadius = ''; }, 2500); }
    }, 300);
  };

  // Keyboard shortcut: Ctrl+K / Cmd+K
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); document.getElementById('global-search-inp')?.focus(); }
    if (e.key === 'Escape') { hide(); clear(); }
  });

  return { search, show, hide, clear, jumpTo };
})();


/* ─── DTC Admin — Customer Notes ─────────────────────────────────────────── */

const Notes = (() => {

  const open = (token) => {
    const t = Store.tokens[token];
    if (!t) return;
    const modal = document.createElement('div');
    modal.id = 'notes-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center';
    modal.innerHTML = `
      <div style="background:var(--white,#fff);border-radius:14px;padding:1.6rem;width:min(500px,95vw);box-shadow:0 8px 40px rgba(0,0,0,.18);max-height:88vh;display:flex;flex-direction:column;gap:1rem">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:.95rem;font-weight:700">📝 Notes — ${esc(t.customerName)}</div>
            <div style="font-size:.72rem;color:var(--muted);margin-top:.15rem">${esc(t.packageType)} · Internal only</div>
          </div>
          <button onclick="document.getElementById('notes-modal').remove()" style="background:none;border:none;font-size:1.3rem;cursor:pointer;color:var(--muted)">✕</button>
        </div>

        <!-- Existing notes -->
        <div id="notes-list" style="flex:1;overflow-y:auto;min-height:80px;max-height:340px;display:flex;flex-direction:column;gap:.5rem">
          ${_renderNotes(t.notes || [], token)}
        </div>

        <!-- Add note -->
        <div style="border-top:1px solid var(--border);padding-top:.9rem;display:flex;flex-direction:column;gap:.5rem">
          <label style="font-size:.72rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em">Add Note</label>
          <div style="display:flex;gap:.5rem;align-items:flex-end">
            <textarea id="note-inp" rows="2" placeholder="e.g. Paid via WeChat, VIP customer, referred by Ahmed…" style="flex:1;padding:.55rem .75rem;border:1px solid var(--border);border-radius:8px;font-size:.83rem;font-family:inherit;color:var(--text);background:var(--bg,#f8faff);resize:none;outline:none;transition:border .15s"></textarea>
            <button id="note-save-btn" onclick="Notes._save('${token}')" style="background:var(--accent,#2563eb);color:#fff;border:none;border-radius:8px;padding:.55rem .9rem;font-size:.82rem;font-weight:600;cursor:pointer;white-space:nowrap">Add →</button>
          </div>
          <div id="note-msg" style="display:none;font-size:.75rem;padding:.3rem .6rem;border-radius:6px"></div>
        </div>
      </div>`;
    document.body.appendChild(modal);
    document.getElementById('note-inp').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); Notes._save(token); } });
  };

  const _renderNotes = (notes, token) => {
    if (!notes.length) return `<div style="text-align:center;padding:1.5rem;color:var(--muted);font-size:.82rem">No notes yet. Add the first one below.</div>`;
    return [...notes].reverse().map(n => `
      <div id="note-${n.id}" style="background:var(--bg,#f8faff);border:1px solid var(--border);border-radius:9px;padding:.65rem .85rem;display:flex;gap:.6rem;align-items:flex-start">
        <div style="flex:1">
          <div style="font-size:.83rem;color:var(--text);line-height:1.5;white-space:pre-wrap">${esc(n.text)}</div>
          <div style="font-size:.65rem;color:var(--muted);margin-top:.3rem">${new Date(n.createdAt).toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
        </div>
        <button onclick="Notes._delete('${token}','${n.id}')" title="Delete note" style="background:none;border:none;cursor:pointer;color:var(--muted);font-size:.85rem;flex-shrink:0;padding:.1rem .2rem;border-radius:5px;transition:all .15s" onmouseenter="this.style.color='var(--error,#dc2626)'" onmouseleave="this.style.color='var(--muted)'">🗑</button>
      </div>`).join('');
  };

  const _save = async (token) => {
    const inp  = document.getElementById('note-inp');
    const msg  = document.getElementById('note-msg');
    const btn  = document.getElementById('note-save-btn');
    const text = inp?.value.trim();
    if (!text) { _showMsg(msg, 'Note cannot be empty.', false); return; }
    btn.textContent = 'Saving…'; btn.disabled = true;
    const d = await api('/admin/notes/save', { adminKey: Store.adminKey, token, note: text });
    btn.textContent = 'Add →'; btn.disabled = false;
    if (d && d.success) {
      inp.value = '';
      msg.style.display = 'none';
      // Update store
      if (!Store.tokens[token].notes) Store.tokens[token].notes = [];
      Store.tokens[token].notes.push(d.note);
      // Re-render list
      document.getElementById('notes-list').innerHTML = _renderNotes(Store.tokens[token].notes, token);
      // Refresh dashboard note count badge
      Dashboard.render();
    } else {
      _showMsg(msg, '✕ Failed: ' + (d && d.error || 'Unknown'), false);
    }
  };

  const _delete = async (token, noteId) => {
    const d = await api('/admin/notes/delete', { adminKey: Store.adminKey, token, noteId });
    if (d && d.success) {
      Store.tokens[token].notes = (Store.tokens[token].notes || []).filter(n => n.id !== noteId);
      document.getElementById('notes-list').innerHTML = _renderNotes(Store.tokens[token].notes, token);
      Dashboard.render();
    }
  };

  const _showMsg = (el, text, ok) => {
    el.style.display = 'block';
    el.style.background = ok ? '#f0fdf4' : 'var(--error-bg,#fef2f2)';
    el.style.color = ok ? '#16a34a' : 'var(--error,#dc2626)';
    el.textContent = text;
  };

  return { open, _save, _delete };
})();


/* ─── DTC Admin — One-Click Renewal Modal ────────────────────────────────── */

const RenewalModal = (() => {

  const open = (token) => {
    const t = Store.tokens[token];
    if (!t) return;
    const sym = (Store.settings || {}).currencySymbol || '$';

    const modal = document.createElement('div');
    modal.id = 'renewal-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center';
    modal.innerHTML = `
      <div style="background:var(--white,#fff);border-radius:14px;padding:1.7rem;width:min(520px,95vw);box-shadow:0 8px 40px rgba(0,0,0,.18);max-height:90vh;overflow-y:auto">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.3rem">
          <div>
            <div style="font-size:.95rem;font-weight:700">🔁 Renewal — ${esc(t.customerName)}</div>
            <div style="font-size:.72rem;color:var(--muted);margin-top:.15rem">A new activation link will be generated with the same details.</div>
          </div>
          <button onclick="document.getElementById('renewal-modal').remove()" style="background:none;border:none;font-size:1.3rem;cursor:pointer;color:var(--muted)">✕</button>
        </div>

        <!-- Current details summary -->
        <div style="background:var(--bg,#f8faff);border:1px solid var(--border);border-radius:10px;padding:1rem;margin-bottom:1.2rem;display:grid;grid-template-columns:1fr 1fr;gap:.6rem">
          ${_row('Customer', t.customerName)}
          ${_row('Product', t.productName || t.product)}
          ${_row('Package', t.packageType)}
          ${_row('Last Price', sym + (t.price || 0).toFixed(2))}
          ${t.email  ? _row('Email',  t.email)  : ''}
          ${t.wechat ? _row('WeChat', t.wechat) : ''}
        </div>

        <!-- Editable fields -->
        <div style="display:flex;flex-direction:column;gap:.75rem;margin-bottom:1.1rem">
          <div>
            <label style="font-size:.72rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;display:block;margin-bottom:.3rem">Package <span style="font-weight:400;text-transform:none">(change if upgrading)</span></label>
            <select id="rn-pkg" style="width:100%;padding:.55rem .8rem;border:1px solid var(--border);border-radius:8px;font-size:.85rem;color:var(--text);background:var(--bg,#fff);font-family:inherit">
              ${_pkgOptions(t.productId, t.packageType)}
            </select>
          </div>
          <div>
            <label style="font-size:.72rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;display:block;margin-bottom:.3rem">Price (${sym})</label>
            <input id="rn-price" type="number" step="0.01" min="0.01" value="${t.price || ''}" style="width:100%;padding:.55rem .8rem;border:1px solid var(--border);border-radius:8px;font-size:.88rem;font-weight:700;color:var(--success,#16a34a);box-sizing:border-box;font-family:inherit"/>
          </div>
        </div>

        <div id="rn-result" style="display:none;margin-bottom:1rem">
          <div style="font-size:.73rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:.4rem">✓ Renewal Link Ready</div>
          <div style="display:flex;gap:.5rem;align-items:center;background:var(--bg,#f8faff);border:1px solid var(--border);border-radius:8px;padding:.55rem .75rem">
            <span id="rn-link-txt" style="flex:1;font-size:.75rem;font-family:monospace;color:var(--text);word-break:break-all"></span>
            <button id="rn-copy-btn" onclick="RenewalModal._copy()" style="background:var(--accent,#2563eb);color:#fff;border:none;border-radius:7px;padding:.35rem .75rem;font-size:.75rem;font-weight:600;cursor:pointer;white-space:nowrap">Copy</button>
          </div>
        </div>

        <div id="rn-msg" style="display:none;font-size:.8rem;padding:.4rem .75rem;border-radius:7px;margin-bottom:.8rem"></div>

        <div style="display:flex;gap:.7rem;justify-content:flex-end">
          <button onclick="document.getElementById('renewal-modal').remove()" style="background:none;border:1px solid var(--border);border-radius:8px;padding:.5rem 1rem;font-size:.85rem;cursor:pointer;color:var(--muted)">Cancel</button>
          <button id="rn-gen-btn" onclick="RenewalModal._generate('${token}')" style="background:var(--accent,#2563eb);color:#fff;border:none;border-radius:8px;padding:.5rem 1.3rem;font-size:.88rem;font-weight:600;cursor:pointer">⚡ Generate Renewal Link</button>
        </div>
      </div>`;

    document.body.appendChild(modal);
  };

  const _row = (label, val) => `
    <div>
      <div style="font-size:.65rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:.15rem">${label}</div>
      <div style="font-size:.82rem;font-weight:600;color:var(--text)">${esc(String(val || '—'))}</div>
    </div>`;

  const _pkgOptions = (productId, currentPkg) => {
    const products = Store.products || [];
    const prod = products.find(p => p.id === productId);
    if (!prod || !prod.packages) return `<option value="${esc(currentPkg)}" selected>${esc(currentPkg)}</option>`;
    return prod.packages.map(pk =>
      `<option value="${esc(pk.label)}" ${pk.label === currentPkg ? 'selected' : ''}>${esc(pk.label)} — ${(Store.settings||{}).currencySymbol||'$'}${pk.price}</option>`
    ).join('');
  };

  const _generate = async (fromToken) => {
    const btn = document.getElementById('rn-gen-btn');
    const msg = document.getElementById('rn-msg');
    const pkg = document.getElementById('rn-pkg')?.value;
    const price = parseFloat(document.getElementById('rn-price')?.value);
    const sym = (Store.settings || {}).currencySymbol || '$';

    if (!price || price <= 0) { _showMsg(msg, 'Price must be greater than 0.', false); return; }

    btn.textContent = 'Generating…'; btn.disabled = true;
    const d = await api('/admin/generate-renewal', { adminKey: Store.adminKey, fromToken });
    btn.textContent = '⚡ Generate Renewal Link'; btn.disabled = false;

    if (!d || d.error) { _showMsg(msg, '✕ ' + (d?.error || 'Failed'), false); return; }

    // If price or package changed, patch it
    if (pkg !== Store.tokens[fromToken]?.packageType || price !== Store.tokens[fromToken]?.price) {
      await api('/admin/edit-token', { adminKey: Store.adminKey, token: d.token, fields: { packageType: pkg, price } });
    }

    msg.style.display = 'none';
    const link = d.link;
    document.getElementById('rn-link-txt').textContent = link;
    document.getElementById('rn-result').style.display = 'block';
    document.getElementById('rn-gen-btn').style.display = 'none';

    // Show success note
    _showMsg(msg, `✓ Renewal link generated for ${sym}${price.toFixed(2)}. Copy and share with the customer.`, true);
    msg.style.display = 'block';

    Dashboard.reload();
  };

  const _copy = () => {
    const txt = document.getElementById('rn-link-txt')?.textContent || '';
    navigator.clipboard.writeText(txt).then(() => {
      const btn = document.getElementById('rn-copy-btn');
      if (btn) { btn.textContent = 'Copied ✓'; btn.style.background = '#16a34a'; }
    });
  };

  const _showMsg = (el, text, ok) => {
    el.style.display = 'block';
    el.style.background = ok ? '#f0fdf4' : 'var(--error-bg,#fef2f2)';
    el.style.color = ok ? '#16a34a' : 'var(--error,#dc2626)';
    el.style.border = ok ? '1px solid #bbf7d0' : '1px solid var(--error-border,#fecaca)';
    el.textContent = text;
  };

  return { open, _generate, _copy };
})();
