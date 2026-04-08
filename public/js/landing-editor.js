/* ─── DTC Admin — Landing Page Content Editor ────────────────────────────── */
'use strict';

const LandingEditor = (() => {
  let _content = null;

  // ── Load ─────────────────────────────────────────────────────────────────────
  const load = async () => {
    const wrap = document.getElementById('landing-editor-wrap');
    if (!wrap) return;
    wrap.innerHTML = '<div class="empty">Loading…</div>';
    try {
      const r = await fetch('/landing-content');
      _content = await r.json();
      _render();
    } catch(e) {
      wrap.innerHTML = '<div class="empty">Failed to load landing content.</div>';
    }
  };

  // ── Render editor ─────────────────────────────────────────────────────────────
  const _render = () => {
    const wrap = document.getElementById('landing-editor-wrap');
    const c = _content;

    wrap.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:1.6rem">

      <!-- Preview bar -->
      <div style="background:var(--accent-light,#eff6ff);border:1px solid var(--accent-border,#bfdbfe);border-radius:10px;padding:.75rem 1.1rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap">
        <div style="font-size:.82rem;color:var(--accent,#2563eb);font-weight:500">✨ Changes are saved instantly and reflected on your public landing page.</div>
        <a href="/" target="_blank" style="font-size:.8rem;font-weight:600;color:var(--accent);text-decoration:none;border:1px solid var(--accent-border);border-radius:7px;padding:.3rem .8rem;background:#fff">🌐 Preview Landing Page →</a>
      </div>

      <!-- Hero Section -->
      ${_section('Hero Section', `
        ${_field('Badge text', 'le-badge', c.hero?.badge || '', 'Short label above the headline')}
        ${_field('Main Headline', 'le-headline', c.hero?.headline || '', 'The big headline — make it punchy')}
        ${_field('Sub-headline', 'le-sub', c.hero?.subheadline || '', 'One or two sentences explaining DTC', 'textarea')}
        ${_field('CTA Button text', 'le-cta', c.hero?.cta || '', 'e.g. Explore Tools')}
      `)}

      <!-- Stats -->
      ${_section('Stats Bar', `
        <div style="font-size:.75rem;color:var(--muted);margin-bottom:.8rem">4 stats displayed below the hero. Edit value and label for each.</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:.8rem" id="le-stats-grid">
          ${(c.stats||[]).map((s,i) => `
            <div style="background:var(--bg,#f4f6fc);border:1px solid var(--border);border-radius:9px;padding:.8rem">
              <div style="font-size:.68rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:.5rem">Stat ${i+1}</div>
              <input id="le-stat-val-${i}" value="${esc(s.value)}" placeholder="e.g. 500+" style="${_inp()}margin-bottom:.4rem"/>
              <input id="le-stat-lbl-${i}" value="${esc(s.label)}" placeholder="e.g. Students" style="${_inp()}"/>
            </div>`).join('')}
        </div>
      `)}

      <!-- Tools -->
      ${_section('Tools Grid', `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.8rem">
          <div style="font-size:.75rem;color:var(--muted)">Each card shows in the tools section. Drag to reorder is not supported — edit order by position.</div>
          <button class="btn btn-sm btn-primary" onclick="LandingEditor.addTool()">+ Add Tool</button>
        </div>
        <div id="le-tools-list" style="display:flex;flex-direction:column;gap:.7rem">
          ${(c.tools||[]).map((t,i) => _toolRow(t,i)).join('')}
        </div>
      `)}

      <!-- Features -->
      ${_section('Why DTC — Features', `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.8rem">
          <div style="font-size:.75rem;color:var(--muted)">Feature cards in the "Why DTC" section.</div>
          <button class="btn btn-sm btn-primary" onclick="LandingEditor.addFeature()">+ Add Feature</button>
        </div>
        <div id="le-features-list" style="display:flex;flex-direction:column;gap:.7rem">
          ${(c.features||[]).map((f,i) => _featRow(f,i)).join('')}
        </div>
      `)}

      <!-- Contact -->
      ${_section('Contact Info', `
        ${_field('WeChat ID', 'le-wechat', c.contact?.wechat || '', 'Your WeChat username')}
        ${_field('Email', 'le-email', c.contact?.email || '', 'Contact email address')}
        ${_field('Tagline', 'le-contact-tagline', c.contact?.tagline || '', 'Short phrase under the heading')}
      `)}

      <!-- Footer -->
      ${_section('Footer', `
        ${_field('Footer tagline', 'le-footer-tagline', c.footer?.tagline || '', 'Short sentence under the logo')}
      `)}

      <!-- Save button -->
      <div style="display:flex;align-items:center;gap:1rem;justify-content:flex-end;padding-top:.5rem;border-top:1px solid var(--border)">
        <div id="le-save-msg" style="display:none;font-size:.8rem;padding:.4rem .8rem;border-radius:7px"></div>
        <button class="btn btn-primary" onclick="LandingEditor.save()">💾 Save All Changes</button>
      </div>

    </div>`;
  };

  const _section = (title, inner) => `
    <div style="background:var(--white,#fff);border:1px solid var(--border);border-radius:12px;overflow:hidden">
      <div style="padding:.75rem 1.1rem;border-bottom:1px solid var(--border);font-size:.82rem;font-weight:700;color:var(--text);">${title}</div>
      <div style="padding:1.1rem;display:flex;flex-direction:column;gap:.7rem">${inner}</div>
    </div>`;

  const _inp = () => 'width:100%;padding:.5rem .75rem;border:1px solid var(--border);border-radius:7px;font-size:.83rem;color:var(--text);background:var(--bg,#f8faff);font-family:inherit;';
  const _inpStyle = _inp();

  const _field = (label, id, val, hint='', type='input') => `
    <div>
      <label style="font-size:.7rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;display:block;margin-bottom:.3rem">${label}</label>
      ${type === 'textarea'
        ? `<textarea id="${id}" rows="3" style="${_inpStyle}resize:vertical">${esc(val)}</textarea>`
        : `<input id="${id}" value="${esc(val)}" style="${_inpStyle}"/>`}
      ${hint ? `<div style="font-size:.68rem;color:var(--muted);margin-top:.2rem">${hint}</div>` : ''}
    </div>`;

  const _toolRow = (t, i) => `
    <div id="le-tool-${i}" style="display:grid;grid-template-columns:60px 1fr 1fr 1fr auto;gap:.6rem;align-items:center;background:var(--bg,#f8faff);border:1px solid var(--border);border-radius:9px;padding:.7rem">
      <input id="le-t-icon-${i}" value="${esc(t.icon||'')}" placeholder="🤖" style="${_inp()}text-align:center;font-size:1.3rem"/>
      <input id="le-t-name-${i}" value="${esc(t.name||'')}" placeholder="Tool Name" style="${_inp()}"/>
      <input id="le-t-tag-${i}"  value="${esc(t.tag||'')}"  placeholder="Category tag" style="${_inp()}"/>
      <input id="le-t-desc-${i}" value="${esc(t.desc||'')}" placeholder="Short description" style="${_inp()}"/>
      <button onclick="LandingEditor.removeTool(${i})" style="background:var(--error-bg,#fef2f2);border:1px solid var(--error-border,#fecaca);color:var(--error,#dc2626);border-radius:7px;padding:.4rem .6rem;cursor:pointer;font-size:.8rem;white-space:nowrap">✕ Remove</button>
    </div>`;

  const _featRow = (f, i) => `
    <div id="le-feat-${i}" style="display:grid;grid-template-columns:60px 1fr 1fr auto;gap:.6rem;align-items:center;background:var(--bg,#f8faff);border:1px solid var(--border);border-radius:9px;padding:.7rem">
      <input id="le-f-icon-${i}" value="${esc(f.icon||'')}" placeholder="⚡" style="${_inp()}text-align:center;font-size:1.3rem"/>
      <input id="le-f-title-${i}" value="${esc(f.title||'')}" placeholder="Feature title" style="${_inp()}"/>
      <input id="le-f-desc-${i}"  value="${esc(f.desc||'')}"  placeholder="Short description" style="${_inp()}"/>
      <button onclick="LandingEditor.removeFeature(${i})" style="background:var(--error-bg,#fef2f2);border:1px solid var(--error-border,#fecaca);color:var(--error,#dc2626);border-radius:7px;padding:.4rem .6rem;cursor:pointer;font-size:.8rem;white-space:nowrap">✕ Remove</button>
    </div>`;

  // ── Tool / Feature CRUD ───────────────────────────────────────────────────────
  const addTool = () => {
    _content.tools = _content.tools || [];
    _content.tools.push({ icon: '🛠', name: 'New Tool', desc: 'Description here.', tag: 'Tool' });
    _render();
  };
  const removeTool = (i) => {
    _content.tools.splice(i, 1);
    _render();
  };
  const addFeature = () => {
    _content.features = _content.features || [];
    _content.features.push({ icon: '✨', title: 'New Feature', desc: 'Description here.' });
    _render();
  };
  const removeFeature = (i) => {
    _content.features.splice(i, 1);
    _render();
  };

  // ── Collect & save ────────────────────────────────────────────────────────────
  const save = async () => {
    const msg = document.getElementById('le-save-msg');
    const showMsg = (text, ok) => {
      msg.style.display = 'block';
      msg.style.background = ok ? '#f0fdf4' : 'var(--error-bg,#fef2f2)';
      msg.style.color = ok ? '#16a34a' : 'var(--error,#dc2626)';
      msg.style.border = ok ? '1px solid #bbf7d0' : '1px solid var(--error-border,#fecaca)';
      msg.textContent = text;
    };

    // Collect hero
    _content.hero = {
      badge:       document.getElementById('le-badge')?.value.trim() || '',
      headline:    document.getElementById('le-headline')?.value.trim() || '',
      subheadline: document.getElementById('le-sub')?.value.trim() || '',
      cta:         document.getElementById('le-cta')?.value.trim() || '',
    };

    // Collect stats
    _content.stats = (_content.stats || []).map((_,i) => ({
      value: document.getElementById(`le-stat-val-${i}`)?.value.trim() || '',
      label: document.getElementById(`le-stat-lbl-${i}`)?.value.trim() || '',
    }));

    // Collect tools
    _content.tools = (_content.tools || []).map((_,i) => ({
      icon: document.getElementById(`le-t-icon-${i}`)?.value || '',
      name: document.getElementById(`le-t-name-${i}`)?.value.trim() || '',
      tag:  document.getElementById(`le-t-tag-${i}`)?.value.trim() || '',
      desc: document.getElementById(`le-t-desc-${i}`)?.value.trim() || '',
    }));

    // Collect features
    _content.features = (_content.features || []).map((_,i) => ({
      icon:  document.getElementById(`le-f-icon-${i}`)?.value || '',
      title: document.getElementById(`le-f-title-${i}`)?.value.trim() || '',
      desc:  document.getElementById(`le-f-desc-${i}`)?.value.trim() || '',
    }));

    // Collect contact
    _content.contact = {
      wechat:  document.getElementById('le-wechat')?.value.trim() || '',
      email:   document.getElementById('le-email')?.value.trim() || '',
      tagline: document.getElementById('le-contact-tagline')?.value.trim() || '',
    };

    // Collect footer
    _content.footer = {
      tagline: document.getElementById('le-footer-tagline')?.value.trim() || '',
    };

    const d = await api('/admin/landing-content', { adminKey: Store.adminKey, content: _content });
    if (d && d.success) {
      showMsg('✓ Landing page saved successfully.', true);
      setTimeout(() => { msg.style.display = 'none'; }, 3000);
    } else {
      showMsg('✕ Failed to save: ' + (d && d.error || 'Unknown error'), false);
    }
  };

  return { load, save, addTool, removeTool, addFeature, removeFeature };
})();
