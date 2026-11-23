/* OrçaArq — SPA em JavaScript puro */
(() => {
  'use strict';

  // ================= Utilidades =================

  const state = { token: safeGet('token'), user: null, segments: [] };
  const app = document.getElementById('app');

  function safeGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
  function safeSet(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* ignore */ } }

  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const brl = (n) => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const numFmt = (n) => Number(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  const dateFmt = (s) => (s ? new Date(s.includes('T') ? s : s.replace(' ', 'T') + 'Z').toLocaleDateString('pt-BR') : '—');
  const dateTimeFmt = (s) => (s ? new Date(s.includes('T') ? s : s.replace(' ', 'T') + 'Z').toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—');
  const initials = (name) => String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const digits = (s) => String(s || '').replace(/\D/g, '');

  const STATUS = { rascunho: 'Rascunho', enviado: 'Enviado', aprovado: 'Aprovado', recusado: 'Recusado' };
  const SUB_STATUS = { active: 'Ativa', waitlist: 'Fila de espera', pending: 'Aguardando aprovação', inactive: 'Inativa' };
  const PLANS = { mensal: 'Mensal', trimestral: 'Trimestral', anual: 'Anual' };
  const UNITS = ['un', 'm', 'm²', 'm³', 'ml', 'kg', 'L', 'pç', 'cj', 'vb', 'h'];
  const ROOMS = ['Sala de estar', 'Sala de jantar', 'Cozinha', 'Suíte master', 'Dormitório', 'Banheiro social', 'Lavabo', 'Área gourmet', 'Lavanderia', 'Home office', 'Varanda', 'Hall de entrada', 'Área externa', 'Geral'];

  async function api(method, url, body) {
    const res = await fetch(url, {
      method,
      headers: { 'content-type': 'application/json', ...(state.token ? { authorization: `Bearer ${state.token}` } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && state.token) {
      setToken(null);
      state.user = null;
      route();
    }
    if (!res.ok) throw new Error(data.error || 'Algo deu errado.');
    return data;
  }

  function setToken(t) { state.token = t; safeSet('token', t); }

  function toast(msg, type = 'ok') {
    const el = document.createElement('div');
    el.className = `toast ${type === 'error' ? 'error' : ''}`;
    el.textContent = msg;
    document.getElementById('toasts').appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }

  function formObj(form) {
    const o = {};
    for (const el of form.elements) {
      if (!el.name || el.disabled) continue;
      if (el.type === 'checkbox') {
        if (el.dataset.multi) { (o[el.name] ||= []); if (el.checked) o[el.name].push(el.value); } else o[el.name] = el.checked;
      } else if (el.type === 'radio') { if (el.checked) o[el.name] = el.value; } else o[el.name] = el.value;
    }
    return o;
  }

  function modal({ title, body, foot = '', wide = false }) {
    const back = document.createElement('div');
    back.className = 'modal-backdrop';
    back.innerHTML = `
      <div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true">
        <div class="modal-head"><h2>${esc(title)}</h2><button class="btn ghost sm" data-close aria-label="Fechar">✕</button></div>
        <div class="modal-body">${body}</div>
        ${foot ? `<div class="modal-foot">${foot}</div>` : ''}
      </div>`;
    const close = () => { back.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    back.addEventListener('mousedown', (e) => { if (e.target === back) close(); });
    back.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', close));
    document.addEventListener('keydown', onKey);
    document.body.appendChild(back);
    const first = back.querySelector('input, select, textarea');
    if (first) first.focus();
    return { el: back, close };
  }

  function confirmDialog(message, okLabel = 'Confirmar') {
    return new Promise((resolve) => {
      const m = modal({
        title: 'Confirmação',
        body: `<p>${esc(message)}</p>`,
        foot: `<button class="btn" data-close>Cancelar</button><button class="btn primary" data-ok>${esc(okLabel)}</button>`,
      });
      m.el.querySelector('[data-ok]').addEventListener('click', () => { m.close(); resolve(true); });
      m.el.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => resolve(false)));
    });
  }

  async function loadSegments() { state.segments = await api('GET', '/api/segments'); return state.segments; }

  // ================= Cartão de loja (núcleo do produto) =================

  function contactLinks(st) {
    const links = [];
    const wa = digits(st.whatsapp);
    if (wa) {
      const num = wa.length <= 11 ? `55${wa}` : wa;
      const text = encodeURIComponent('Olá! Sou arquiteto(a) e encontrei sua loja no OrçaArq. Gostaria de um orçamento.');
      links.push(['whatsapp', `https://wa.me/${num}?text=${text}`, '💬 WhatsApp', 'wa']);
    }
    if (st.phone) links.push(['phone', `tel:${digits(st.phone)}`, `📞 ${st.phone}`, '']);
    if (st.email) links.push(['email', `mailto:${st.email}`, '✉️ E-mail', '']);
    if (st.website) links.push(['website', /^https?:\/\//.test(st.website) ? st.website : `https://${st.website}`, '🌐 Site', '']);
    if (st.instagram) links.push(['instagram', `https://instagram.com/${String(st.instagram).replace(/^@/, '')}`, '📷 Instagram', '']);
    return links;
  }

  function storeCard(st, opts = {}) {
    const { segmentId = '', budgetId = '', selectable = false, selected = false, track = true } = opts;
    const loc = [st.city, st.state].filter(Boolean).join(' - ');
    return `
      <div class="store-card ${selectable ? 'selectable' : ''} ${selected ? 'selected' : ''}" ${selectable ? `data-select-store="${st.id}"` : ''}>
        ${selectable ? '<span class="check-mark"></span>' : '<span class="sponsor">Parceira</span>'}
        <div class="head">
          <div class="logo" style="background:${esc(/^#[0-9a-f]{6}$/i.test(st.color || '') ? st.color : '#2f6f5e')}">${esc(initials(st.name))}</div>
          <div><div class="name">${esc(st.name)}</div>${loc ? `<div class="loc">📍 ${esc(loc)}</div>` : ''}</div>
        </div>
        ${st.description ? `<p class="desc">${esc(st.description)}</p>` : ''}
        <div class="contacts">
          ${contactLinks(st).map(([ch, href, label, cls]) => `
            <a class="contact-btn ${cls}" href="${esc(href)}" target="_blank" rel="noopener"
               ${track ? `data-contact="${st.id}" data-channel="${ch}" data-segment="${esc(segmentId)}" data-budget="${esc(budgetId)}"` : ''}>${esc(label)}</a>`).join('')}
        </div>
      </div>`;
  }

  function emptySlots(n) {
    return Array.from({ length: n }, () => '<div class="slot-empty">Vaga disponível para anunciante<br><span class="small">Sua loja pode aparecer aqui</span></div>').join('');
  }

  function slotsDots(active, max = 3) {
    return `<span class="slots" title="${active}/${max} vagas ocupadas">${Array.from({ length: max }, (_, i) => `<i class="${i < active ? 'on' : ''}"></i>`).join('')}</span>`;
  }

  // Registra cliques de contato (métrica para o lojista)
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-contact]');
    if (!a || state.user?.role !== 'architect') return;
    e.stopPropagation();
    api('POST', `/api/partners/${a.dataset.contact}/contact`, {
      channel: a.dataset.channel, segment_id: a.dataset.segment || null, budget_id: a.dataset.budget || null,
    }).catch(() => {});
  }, true);

  // ================= Layout =================

  const NAV = {
    architect: [['#/', '🏠', 'Painel'], ['#/orcamentos', '📋', 'Orçamentos'], ['#/clientes', '👥', 'Clientes'], ['#/parceiros', '🏬', 'Lojas parceiras'], ['#/perfil', '⚙️', 'Meu perfil']],
    store: [['#/', '📊', 'Painel'], ['#/loja/perfil', '🏬', 'Perfil da loja']],
    admin: [['#/', '📊', 'Visão geral'], ['#/admin/segmentos', '🧩', 'Segmentos e vagas'], ['#/parceiros', '🏬', 'Vitrine de parceiros']],
  };
  const ROLE_LABEL = { architect: 'Arquiteto(a)', store: 'Lojista', admin: 'Administrador' };

  function shell(content, active) {
    const u = state.user;
    app.innerHTML = `
      <div class="topbar"><button id="menuBtn" aria-label="Menu">☰</button><div class="brand">📐 Orça<span>Arq</span></div></div>
      <div class="shell">
        <nav class="sidebar" id="sidebar">
          <div class="brand">📐 Orça<span>Arq</span></div>
          <div class="nav">${NAV[u.role].map(([href, icon, label]) => `<a href="${href}" class="${href === active ? 'active' : ''}">${icon} ${label}</a>`).join('')}</div>
          <div class="user"><strong>${esc(u.name)}</strong>${esc(ROLE_LABEL[u.role])}<br><button class="btn sm" id="logoutBtn">Sair</button></div>
        </nav>
        <main class="main" id="main">${content}</main>
      </div>`;
    document.getElementById('logoutBtn').onclick = async () => {
      await api('POST', '/api/auth/logout').catch(() => {});
      setToken(null); state.user = null; location.hash = '#/'; route();
    };
    const sb = document.getElementById('sidebar');
    document.getElementById('menuBtn').onclick = () => sb.classList.toggle('open');
    sb.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => sb.classList.remove('open')));
    return document.getElementById('main');
  }

  function loading(active) { shell('<p class="muted">Carregando…</p>', active); }

  // ================= Landing / Auth =================

  function renderLanding(mode = 'login') {
    let role = 'architect';
    app.innerHTML = `
      <div class="landing">
        <section class="hero">
          <div class="brand" style="padding:0">📐 Orça<span>Arq</span></div>
          <h1>Orçamentos de projeto <em>prontos em minutos</em>, com fornecedores na mão.</h1>
          <p class="lead">Organize itens por ambiente e segmento, calcule honorários e descontos, gere o PDF para o cliente — e tenha o contato de até 3 lojas parceiras em cada segmento, direto no orçamento.</p>
          <div class="features">
            <div class="feature"><strong>📋 Orçamento por ambiente</strong><span>Cozinha, living, suítes… com totais automáticos.</span></div>
            <div class="feature"><strong>🏬 3 lojas por segmento</strong><span>Marcenaria, iluminação, revestimentos e mais.</span></div>
            <div class="feature"><strong>🧾 PDF profissional</strong><span>Documento com sua marca pronto para enviar.</span></div>
            <div class="feature"><strong>📈 Para lojistas</strong><span>Seja uma das 3 lojas do seu segmento e receba contatos qualificados.</span></div>
          </div>
        </section>
        <section class="auth">
          <div class="auth-box">
            <div class="tabs"><button data-tab="login">Entrar</button><button data-tab="register">Criar conta</button></div>
            <div id="authForm"></div>
            <div class="demo">
              <strong>Contas de demonstração</strong> (senha <code>123456</code>):<br>
              <button data-demo="arquiteta@orcaarq.com">Arquiteta</button> ·
              <button data-demo="ateliermadeiranobre@loja.com">Lojista</button> ·
              <button data-demo="admin@orcaarq.com">Admin</button>
            </div>
          </div>
        </section>
      </div>`;

    const box = document.getElementById('authForm');
    const tabs = app.querySelectorAll('[data-tab]');

    const doLogin = async (email, password) => {
      const { token } = await api('POST', '/api/auth/login', { email, password });
      setToken(token);
      location.hash = '#/';
      await route();
    };

    app.querySelectorAll('[data-demo]').forEach((b) => b.addEventListener('click', () => doLogin(b.dataset.demo, '123456').catch((e) => toast(e.message, 'error'))));

    const show = async (m) => {
      tabs.forEach((t) => t.classList.toggle('active', t.dataset.tab === m));
      if (m === 'login') {
        box.innerHTML = `
          <h2>Bem-vindo(a) de volta</h2>
          <form id="loginForm">
            <div class="field"><label>E-mail</label><input name="email" type="email" required autocomplete="email"></div>
            <div class="field"><label>Senha</label><input name="password" type="password" required autocomplete="current-password"></div>
            <button class="btn primary block lg">Entrar</button>
          </form>`;
        box.querySelector('form').onsubmit = (e) => {
          e.preventDefault();
          const d = formObj(e.target);
          doLogin(d.email, d.password).catch((err) => toast(err.message, 'error'));
        };
        return;
      }
      if (!state.segments.length) await loadSegments().catch(() => {});
      const draw = () => {
        box.innerHTML = `
          <div class="role-pick">
            <button type="button" data-role="architect" class="${role === 'architect' ? 'active' : ''}"><strong>📐 Sou arquiteto(a)</strong><span>Quero montar orçamentos</span></button>
            <button type="button" data-role="store" class="${role === 'store' ? 'active' : ''}"><strong>🏬 Sou lojista</strong><span>Quero anunciar minha loja</span></button>
          </div>
          <form id="regForm">
            <div class="form-grid">
              <div class="field full"><label>Seu nome</label><input name="name" required></div>
              <div class="field"><label>E-mail</label><input name="email" type="email" required></div>
              <div class="field"><label>Senha (mín. 6)</label><input name="password" type="password" minlength="6" required></div>
              <div class="field"><label>Telefone</label><input name="phone" placeholder="(11) 99999-0000"></div>
              ${role === 'architect' ? `
                <div class="field"><label>Registro CAU (opcional)</label><input name="cau"></div>
                <div class="field full"><label>Escritório / Estúdio</label><input name="company"></div>
              ` : `
                <div class="field"><label>WhatsApp da loja</label><input name="whatsapp" placeholder="(11) 99999-0000"></div>
                <div class="field full"><label>Nome da loja</label><input name="storeName" required></div>
                <div class="field"><label>CNPJ</label><input name="cnpj"></div>
                <div class="field"><label>Cidade / UF</label><div class="row" style="flex-wrap:nowrap"><input name="city" placeholder="Cidade"><input name="state" maxlength="2" placeholder="UF" style="width:70px"></div></div>
                <div class="field full"><label>Segmentos em que quer anunciar (máx. 3 lojas por segmento)</label>
                  <div class="seg-list">${state.segments.map((s) => `
                    <label class="check"><input type="checkbox" name="segments" data-multi="1" value="${s.id}"> ${esc(s.icon)} ${esc(s.name)}
                      <small>${s.free_slots ? `${s.free_slots} vaga(s)` : 'Lotado · fila de espera'}</small></label>`).join('')}
                  </div>
                </div>
                <div class="field full"><label>Plano</label>
                  <select name="plan"><option value="mensal">Mensal — R$ 199/mês por segmento</option><option value="trimestral">Trimestral — R$ 549 por segmento</option><option value="anual">Anual — R$ 1.990 por segmento</option></select>
                </div>
              `}
            </div>
            <button class="btn primary block lg">Criar conta</button>
            ${role === 'store' ? '<p class="small muted" style="margin-top:10px">Sua solicitação passa por aprovação. Se o segmento já tiver 3 lojas ativas, você entra na fila de espera e é ativado(a) assim que abrir uma vaga.</p>' : ''}
          </form>`;
        box.querySelectorAll('[data-role]').forEach((b) => b.addEventListener('click', () => { role = b.dataset.role; draw(); }));
        box.querySelector('form').onsubmit = async (e) => {
          e.preventDefault();
          try {
            const { token } = await api('POST', '/api/auth/register', { ...formObj(e.target), role });
            setToken(token);
            location.hash = '#/';
            toast('Conta criada!');
            await route();
          } catch (err) { toast(err.message, 'error'); }
        };
      };
      draw();
    };
    tabs.forEach((t) => t.addEventListener('click', () => show(t.dataset.tab)));
    show(mode);
  }

  // ================= Arquiteto =================

  async function architectDashboard() {
    loading('#/');
    const [d, budgets] = await Promise.all([api('GET', '/api/dashboard'), api('GET', '/api/budgets')]);
    const main = shell(`
      <div class="page-head">
        <div><h1>Olá, ${esc(state.user.name.split(' ')[0])} 👋</h1><p class="muted">Aqui está o resumo dos seus orçamentos.</p></div>
        <button class="btn primary lg" id="newBudget">+ Novo orçamento</button>
      </div>
      <div class="grid grid-4">
        <div class="card stat"><div class="label">Orçamentos</div><div class="value">${d.total}</div><div class="hint">${d.byStatus.rascunho} rascunho(s) · ${d.byStatus.enviado} enviado(s)</div></div>
        <div class="card stat"><div class="label">Em aberto</div><div class="value">${brl(d.openTotal)}</div><div class="hint">Rascunhos + enviados</div></div>
        <div class="card stat"><div class="label">Aprovados</div><div class="value">${brl(d.approvedTotal)}</div><div class="hint">${d.byStatus.aprovado} orçamento(s)</div></div>
        <div class="card stat"><div class="label">Conversão</div><div class="value">${d.conversion == null ? '—' : Math.round(d.conversion * 100) + '%'}</div><div class="hint">${d.clients} cliente(s)</div></div>
      </div>
      <div class="card" style="margin-top:16px">
        <div class="card-head"><h2>Orçamentos recentes</h2><a href="#/orcamentos">Ver todos →</a></div>
        ${budgetTable(budgets.slice(0, 6))}
      </div>`, '#/');
    bindBudgetTable(main);
    main.querySelector('#newBudget').onclick = newBudget;
  }

  function budgetTable(list) {
    if (!list.length) return '<div class="empty"><div class="icon">📋</div>Nenhum orçamento ainda. Crie o primeiro!</div>';
    return `<div class="table-wrap"><table>
      <thead><tr><th>Código</th><th>Projeto</th><th>Cliente</th><th>Status</th><th class="num">Total</th><th>Atualizado</th><th></th></tr></thead>
      <tbody>${list.map((b) => `
        <tr class="clickable" data-open="${b.id}">
          <td class="nowrap muted">${esc(b.code)}</td>
          <td><strong>${esc(b.title)}</strong><div class="small muted">${b.items_count} item(ns)</div></td>
          <td>${esc(b.client_name || '—')}</td>
          <td><span class="badge ${b.status}">${STATUS[b.status]}</span></td>
          <td class="num nowrap"><strong>${brl(b.totals.total)}</strong></td>
          <td class="nowrap muted">${dateFmt(b.updated_at)}</td>
          <td class="right nowrap">
            <button class="btn sm ghost" data-dup="${b.id}" title="Duplicar">⧉</button>
            <button class="btn sm ghost" data-del="${b.id}" title="Excluir">🗑</button>
          </td>
        </tr>`).join('')}</tbody></table></div>`;
  }

  function bindBudgetTable(root) {
    root.querySelectorAll('[data-open]').forEach((tr) => tr.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      location.hash = `#/orcamentos/${tr.dataset.open}`;
    }));
    root.querySelectorAll('[data-dup]').forEach((b) => b.addEventListener('click', async () => {
      const { id } = await api('POST', `/api/budgets/${b.dataset.dup}/duplicate`);
      toast('Orçamento duplicado.');
      location.hash = `#/orcamentos/${id}`;
    }));
    root.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
      if (!(await confirmDialog('Excluir este orçamento? Essa ação não pode ser desfeita.', 'Excluir'))) return;
      await api('DELETE', `/api/budgets/${b.dataset.del}`);
      toast('Orçamento excluído.');
      route();
    }));
  }

  async function newBudget() {
    const clients = await api('GET', '/api/clients');
    const m = modal({
      title: 'Novo orçamento',
      body: `<form id="nb">
        <div class="field"><label>Nome do projeto</label><input name="title" required placeholder="Ex.: Reforma apartamento Moema"></div>
        <div class="field"><label>Cliente</label><select name="client_id"><option value="">— Sem cliente —</option>${clients.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div>
        <div class="field"><label>Endereço da obra</label><input name="project_address"></div>
        <div class="field"><label>Honorários (%) sobre o subtotal</label><input name="fee_value" type="number" min="0" step="0.1" value="10"></div>
      </form>`,
      foot: '<button class="btn" data-close>Cancelar</button><button class="btn primary" form="nb">Criar e adicionar itens</button>',
    });
    m.el.querySelector('form').onsubmit = async (e) => {
      e.preventDefault();
      try {
        const { id } = await api('POST', '/api/budgets', formObj(e.target));
        m.close();
        location.hash = `#/orcamentos/${id}`;
      } catch (err) { toast(err.message, 'error'); }
    };
  }

  async function budgetsPage() {
    loading('#/orcamentos');
    const list = await api('GET', '/api/budgets');
    const main = shell(`
      <div class="page-head"><div><h1>Orçamentos</h1><p class="muted">${list.length} orçamento(s)</p></div>
        <div class="row"><select id="statusFilter" style="width:auto"><option value="">Todos os status</option>${Object.entries(STATUS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
        <button class="btn primary" id="newBudget">+ Novo orçamento</button></div></div>
      <div class="card" id="tbl">${budgetTable(list)}</div>`, '#/orcamentos');
    bindBudgetTable(main);
    main.querySelector('#newBudget').onclick = newBudget;
    main.querySelector('#statusFilter').onchange = (e) => {
      const f = e.target.value;
      const tbl = main.querySelector('#tbl');
      tbl.innerHTML = budgetTable(f ? list.filter((b) => b.status === f) : list);
      bindBudgetTable(tbl);
    };
  }

  // ---------- Editor ----------

  async function budgetEditor(id) {
    loading('#/orcamentos');
    if (!state.segments.length) await loadSegments();
    const [b, clients] = await Promise.all([api('GET', `/api/budgets/${id}`), api('GET', '/api/clients')]);

    const main = shell(`
      <div class="page-head">
        <div style="flex:1;min-width:260px">
          <a href="#/orcamentos" class="small">← Orçamentos</a>
          <input class="title-input" id="title" value="${esc(b.title)}" aria-label="Nome do projeto">
          <div class="row small muted"><span>${esc(b.code)}</span>·<span>Criado em ${dateFmt(b.created_at)}</span>·<span class="saved-indicator" id="saved"></span></div>
        </div>
        <div class="row">
          <select id="status" style="width:auto">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${b.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
          <a class="btn" href="#/orcamentos/${b.id}/imprimir">🧾 Gerar PDF</a>
          <button class="btn" id="dup">⧉ Duplicar</button>
        </div>
      </div>
      <div class="editor">
        <div>
          <div class="card">
            <div class="card-head"><h2>Itens do orçamento</h2><button class="btn primary" id="addItem">+ Adicionar item</button></div>
            <div id="items"></div>
          </div>
          <div class="card">
            <div class="card-head"><h2>Dados do orçamento</h2></div>
            <form id="meta" class="form-grid">
              <div class="field"><label>Cliente</label>
                <div class="row" style="flex-wrap:nowrap"><select name="client_id"><option value="">— Sem cliente —</option>${clients.map((c) => `<option value="${c.id}" ${b.client_id === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
                <button type="button" class="btn" id="newClient" title="Novo cliente">+</button></div></div>
              <div class="field"><label>Endereço da obra</label><input name="project_address" value="${esc(b.project_address || '')}"></div>
              <div class="field"><label>Honorários</label>
                <div class="row" style="flex-wrap:nowrap"><select name="fee_type" style="width:160px"><option value="percent" ${b.fee_type === 'percent' ? 'selected' : ''}>% do subtotal</option><option value="fixed" ${b.fee_type === 'fixed' ? 'selected' : ''}>Valor fixo (R$)</option></select>
                <input name="fee_value" type="number" min="0" step="0.01" value="${b.fee_value}"></div></div>
              <div class="field"><label>Desconto (R$)</label><input name="discount" type="number" min="0" step="0.01" value="${b.discount}"></div>
              <div class="field"><label>Validade (dias)</label><input name="validity_days" type="number" min="1" value="${b.validity_days}"></div>
              <div class="field full"><label>Observações / condições</label><textarea name="notes" placeholder="Prazo, forma de pagamento, o que não está incluso…">${esc(b.notes || '')}</textarea></div>
            </form>
          </div>
        </div>
        <aside id="aside"></aside>
      </div>`, '#/orcamentos');

    let current = b;

    const renderItems = () => {
      const box = main.querySelector('#items');
      if (!current.items.length) {
        box.innerHTML = '<div class="empty"><div class="icon">🧱</div>Adicione itens por ambiente e segmento.<br>Ao escolher o segmento, você verá até 3 lojas parceiras com contato.</div>';
        return;
      }
      const rooms = [...new Set(current.items.map((i) => i.room))];
      box.innerHTML = `<div class="table-wrap"><table>
        <thead><tr><th>Descrição</th><th>Segmento</th><th class="num">Qtd.</th><th class="num">Unitário</th><th class="num">Total</th><th></th></tr></thead>
        <tbody>${rooms.map((room) => {
          const its = current.items.filter((i) => i.room === room);
          const sub = its.reduce((s, i) => s + i.quantity * i.unit_price, 0);
          return `<tr class="room-row"><td colspan="4">${esc(room)}</td><td class="num">${brl(sub)}</td><td></td></tr>` +
            its.map((i) => `
              <tr class="clickable" data-item="${i.id}">
                <td>${esc(i.description)}${i.store_name ? `<div class="item-store">🏬 ${esc(i.store_name)}</div>` : ''}</td>
                <td class="small">${i.segment_name ? `${esc(i.segment_icon)} ${esc(i.segment_name)}` : '<span class="muted">—</span>'}</td>
                <td class="num nowrap">${numFmt(i.quantity)} ${esc(i.unit)}</td>
                <td class="num nowrap">${brl(i.unit_price)}</td>
                <td class="num nowrap"><strong>${brl(i.quantity * i.unit_price)}</strong></td>
                <td class="right"><button class="btn sm ghost" data-del-item="${i.id}" title="Remover">🗑</button></td>
              </tr>`).join('');
        }).join('')}</tbody></table></div>`;
      box.querySelectorAll('[data-item]').forEach((tr) => tr.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        itemModal(current.items.find((i) => i.id === Number(tr.dataset.item)));
      }));
      box.querySelectorAll('[data-del-item]').forEach((btn) => btn.addEventListener('click', async () => {
        await api('DELETE', `/api/budgets/${current.id}/items/${btn.dataset.delItem}`);
        await refresh();
      }));
    };

    const renderAside = () => {
      const t = current.totals;
      const segs = Object.entries(t.bySegment).sort((a, b) => b[1] - a[1]);
      const max = Math.max(1, ...segs.map((s) => s[1]));
      main.querySelector('#aside').innerHTML = `
        <div class="card">
          <h2>Resumo</h2>
          <table class="totals">
            <tr><td class="muted">Subtotal (materiais e serviços)</td><td class="num">${brl(t.subtotal)}</td></tr>
            <tr><td class="muted">Honorários ${current.fee_type === 'percent' ? `(${numFmt(current.fee_value)}%)` : ''}</td><td class="num">${brl(t.fee)}</td></tr>
            <tr><td class="muted">Desconto</td><td class="num">− ${brl(t.discount)}</td></tr>
            <tr class="total"><td>Total</td><td class="num">${brl(t.total)}</td></tr>
          </table>
        </div>
        ${segs.length ? `<div class="card"><h3>Por segmento</h3>${segs.map(([name, v]) => `
          <div class="seg-line"><div class="row"><span>${esc(name)}</span><strong>${brl(v)}</strong></div><div class="bar"><span style="width:${(v / max) * 100}%"></span></div></div>`).join('')}</div>` : ''}
        <div class="card">
          <h3>🏬 Lojas parceiras do orçamento</h3>
          ${current.partners.length ? current.partners.map((p) => `
            <div class="segment-block" style="margin-top:12px">
              <div class="small"><strong>${esc(p.icon)} ${esc(p.name)}</strong></div>
              ${p.stores.length ? p.stores.map((st) => `
                <div class="small" style="margin:6px 0 0 4px">
                  <strong>${esc(st.name)}</strong>
                  <div class="row" style="gap:6px;margin-top:3px">${contactLinks(st).slice(0, 3).map(([ch, href, label, cls]) => `<a class="contact-btn ${cls}" href="${esc(href)}" target="_blank" rel="noopener" data-contact="${st.id}" data-channel="${ch}" data-segment="${p.id}" data-budget="${current.id}">${esc(label)}</a>`).join('')}</div>
                </div>`).join('') : '<div class="small muted">Nenhuma loja parceira neste segmento ainda.</div>'}
            </div>`).join('') : '<p class="small muted">Adicione itens com segmento para ver aqui as lojas indicadas.</p>'}
        </div>`;
    };

    const refresh = async () => {
      current = await api('GET', `/api/budgets/${id}`);
      renderItems();
      renderAside();
    };

    const saved = main.querySelector('#saved');
    const save = async (patch) => {
      saved.textContent = 'Salvando…';
      try {
        await api('PUT', `/api/budgets/${id}`, patch);
        saved.textContent = '✓ Salvo';
        await refresh();
      } catch (err) { saved.textContent = ''; toast(err.message, 'error'); }
    };

    const metaForm = main.querySelector('#meta');
    metaForm.addEventListener('change', () => save(formObj(metaForm)));
    main.querySelector('#title').addEventListener('change', (e) => save({ title: e.target.value }));
    main.querySelector('#status').addEventListener('change', (e) => save({ status: e.target.value }));
    main.querySelector('#dup').onclick = async () => {
      const r = await api('POST', `/api/budgets/${id}/duplicate`);
      toast('Cópia criada.');
      location.hash = `#/orcamentos/${r.id}`;
    };
    main.querySelector('#newClient').onclick = () => clientModal(null, async (newId) => {
      const sel = metaForm.querySelector('[name=client_id]');
      const cs = await api('GET', '/api/clients');
      sel.innerHTML = `<option value="">— Sem cliente —</option>${cs.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}`;
      sel.value = String(newId);
      save(formObj(metaForm));
    });
    main.querySelector('#addItem').onclick = () => itemModal(null);

    function itemModal(item) {
      const rooms = [...new Set([...current.items.map((i) => i.room), ...ROOMS])];
      const lastRoom = current.items.length ? current.items[current.items.length - 1].room : 'Geral';
      let selectedStore = item?.store_id || null;
      const m = modal({
        title: item ? 'Editar item' : 'Adicionar item',
        wide: true,
        body: `<form id="itemForm">
          <div class="form-grid">
            <div class="field"><label>Ambiente</label><input name="room" list="roomsList" value="${esc(item?.room || lastRoom)}" required>
              <datalist id="roomsList">${rooms.map((r) => `<option value="${esc(r)}">`).join('')}</datalist></div>
            <div class="field"><label>Segmento</label><select name="segment_id"><option value="">— Selecione —</option>${state.segments.map((s) => `<option value="${s.id}" ${item?.segment_id === s.id ? 'selected' : ''}>${esc(s.icon)} ${esc(s.name)}</option>`).join('')}</select></div>
            <div class="field full"><label>Descrição do item / serviço</label><input name="description" value="${esc(item?.description || '')}" required placeholder="Ex.: Armário inferior em MDF laca branca"></div>
          </div>
          <div class="row" style="align-items:flex-end;flex-wrap:nowrap">
            <div class="field" style="flex:1"><label>Quantidade</label><input name="quantity" type="number" min="0" step="0.01" value="${item?.quantity ?? 1}"></div>
            <div class="field" style="width:110px"><label>Unidade</label><select name="unit">${UNITS.map((u) => `<option ${(item?.unit || 'un') === u ? 'selected' : ''}>${u}</option>`).join('')}</select></div>
            <div class="field" style="flex:1"><label>Valor unitário (R$)</label><input name="unit_price" type="number" min="0" step="0.01" value="${item?.unit_price ?? ''}"></div>
            <div class="field" style="flex:1"><label>Total</label><input id="lineTotal" disabled></div>
          </div>
          <div id="partnersBox"></div>
        </form>`,
        foot: `<button class="btn" data-close>Cancelar</button><button class="btn primary" form="itemForm">${item ? 'Salvar item' : 'Adicionar'}</button>`,
      });
      const f = m.el.querySelector('form');
      const updTotal = () => { m.el.querySelector('#lineTotal').value = brl(Number(f.quantity.value) * Number(f.unit_price.value)); };
      f.quantity.addEventListener('input', updTotal);
      f.unit_price.addEventListener('input', updTotal);
      updTotal();

      const box = m.el.querySelector('#partnersBox');
      const loadPartners = async () => {
        const segId = Number(f.segment_id.value);
        if (!segId) { box.innerHTML = ''; selectedStore = null; return; }
        box.innerHTML = '<p class="small muted">Carregando lojas parceiras…</p>';
        const [seg] = await api('GET', `/api/partners?segment_id=${segId}&budget_id=${current.id}`);
        if (selectedStore && !seg.stores.some((s) => s.id === selectedStore) && item?.store_id !== selectedStore) selectedStore = null;
        const keepOld = item?.store_id && item.segment_id === segId && !seg.stores.some((s) => s.id === item.store_id);
        const draw = () => {
          box.innerHTML = `
            <div class="segment-title" style="margin-top:6px"><h3>🏬 Lojas parceiras — ${esc(seg.name)}</h3><span class="small muted">Clique para indicar a loja no item (opcional)</span></div>
            ${keepOld ? `<p class="small muted">Loja atual do item: <strong>${esc(item.store_name)}</strong> (não é mais parceira ativa).</p>` : ''}
            <div class="partners">
              ${seg.stores.map((st) => storeCard(st, { segmentId: segId, budgetId: current.id, selectable: true, selected: selectedStore === st.id })).join('')}
              ${emptySlots(Math.max(0, 3 - seg.stores.length))}
            </div>`;
          box.querySelectorAll('[data-select-store]').forEach((c) => c.addEventListener('click', (e) => {
            if (e.target.closest('a')) return;
            const sid = Number(c.dataset.selectStore);
            selectedStore = selectedStore === sid ? null : sid;
            draw();
          }));
        };
        draw();
      };
      f.segment_id.addEventListener('change', () => { selectedStore = null; loadPartners(); });
      loadPartners();

      f.onsubmit = async (e) => {
        e.preventDefault();
        const data = { ...formObj(f), store_id: selectedStore };
        try {
          if (item) await api('PUT', `/api/budgets/${current.id}/items/${item.id}`, data);
          else await api('POST', `/api/budgets/${current.id}/items`, data);
          m.close();
          toast(item ? 'Item atualizado.' : 'Item adicionado.');
          await refresh();
        } catch (err) { toast(err.message, 'error'); }
      };
    }

    renderItems();
    renderAside();
  }

  // ---------- Documento / PDF ----------

  async function budgetPrint(id) {
    loading('#/orcamentos');
    const b = await api('GET', `/api/budgets/${id}`);
    const a = b.architect;
    const rooms = [...new Set(b.items.map((i) => i.room))];
    const validUntil = new Date(new Date(b.updated_at.replace(' ', 'T') + 'Z').getTime() + b.validity_days * 864e5);
    shell(`
      <div class="print-bar"><a class="btn" href="#/orcamentos/${b.id}">← Voltar ao editor</a><span class="spacer"></span><button class="btn primary" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button></div>
      <article class="doc">
        <header class="doc-head">
          <div>
            <div class="studio">${esc(a.company || a.name)}</div>
            <div class="small muted">${esc(a.name)}${a.cau ? ` · CAU ${esc(a.cau)}` : ''}<br>${esc(a.email)}${a.phone ? ` · ${esc(a.phone)}` : ''}</div>
          </div>
          <div class="right">
            <div style="font:600 1.2rem var(--serif)">ORÇAMENTO</div>
            <div class="small">${esc(b.code)}</div>
            <div class="small muted">Emitido em ${new Date().toLocaleDateString('pt-BR')}</div>
          </div>
        </header>
        <div class="meta">
          <div><strong>Projeto:</strong> ${esc(b.title)}</div>
          <div><strong>Cliente:</strong> ${esc(b.client?.name || '—')}</div>
          <div><strong>Endereço da obra:</strong> ${esc(b.project_address || '—')}</div>
          <div><strong>Contato:</strong> ${esc([b.client?.phone, b.client?.email].filter(Boolean).join(' · ') || '—')}</div>
        </div>

        <h2>Itens</h2>
        <table>
          <thead><tr><th>Descrição</th><th class="num">Qtd.</th><th class="num">Unitário</th><th class="num">Total</th></tr></thead>
          <tbody>${rooms.map((room) => {
            const its = b.items.filter((i) => i.room === room);
            return `<tr class="room-row"><td colspan="3">${esc(room)}</td><td class="num">${brl(b.totals.byRoom[room])}</td></tr>` +
              its.map((i) => `<tr><td>${esc(i.description)}${i.segment_name ? `<div class="small muted">${esc(i.segment_name)}${i.store_name ? ` · ${esc(i.store_name)}` : ''}</div>` : ''}</td>
                <td class="num nowrap">${numFmt(i.quantity)} ${esc(i.unit)}</td><td class="num nowrap">${brl(i.unit_price)}</td><td class="num nowrap">${brl(i.quantity * i.unit_price)}</td></tr>`).join('');
          }).join('') || '<tr><td colspan="4" class="muted">Sem itens.</td></tr>'}</tbody>
        </table>

        <table class="totals" style="max-width:340px;margin:18px 0 0 auto">
          <tr><td class="muted">Subtotal</td><td class="num">${brl(b.totals.subtotal)}</td></tr>
          <tr><td class="muted">Honorários ${b.fee_type === 'percent' ? `(${numFmt(b.fee_value)}%)` : ''}</td><td class="num">${brl(b.totals.fee)}</td></tr>
          ${b.totals.discount ? `<tr><td class="muted">Desconto</td><td class="num">− ${brl(b.totals.discount)}</td></tr>` : ''}
          <tr class="total"><td>Total</td><td class="num">${brl(b.totals.total)}</td></tr>
        </table>

        ${b.notes ? `<h2>Observações</h2><p style="white-space:pre-wrap">${esc(b.notes)}</p>` : ''}
        <p class="small muted">Orçamento válido até ${validUntil.toLocaleDateString('pt-BR')} (${b.validity_days} dias).</p>

        ${b.partners.some((p) => p.stores.length) ? `
          <h2>Fornecedores indicados</h2>
          <div class="partners-doc">${b.partners.filter((p) => p.stores.length).map((p) => `
            <div class="seg"><strong>${esc(p.name)}</strong>${p.stores.map((s) => `<div>${esc(s.name)} — ${esc([s.phone, s.email].filter(Boolean).join(' · '))}</div>`).join('')}</div>`).join('')}
          </div>` : ''}

        <div class="sign"><div>${esc(a.company || a.name)}</div><div>${esc(b.client?.name || 'Cliente')}</div></div>
      </article>`, '#/orcamentos');
  }

  // ---------- Clientes ----------

  function clientModal(c, onSaved) {
    const m = modal({
      title: c ? 'Editar cliente' : 'Novo cliente',
      body: `<form id="cf" class="form-grid">
        <div class="field full"><label>Nome</label><input name="name" value="${esc(c?.name || '')}" required></div>
        <div class="field"><label>E-mail</label><input name="email" type="email" value="${esc(c?.email || '')}"></div>
        <div class="field"><label>Telefone</label><input name="phone" value="${esc(c?.phone || '')}"></div>
        <div class="field"><label>CPF / CNPJ</label><input name="document" value="${esc(c?.document || '')}"></div>
        <div class="field full"><label>Endereço</label><input name="address" value="${esc(c?.address || '')}"></div>
      </form>`,
      foot: '<button class="btn" data-close>Cancelar</button><button class="btn primary" form="cf">Salvar</button>',
    });
    m.el.querySelector('form').onsubmit = async (e) => {
      e.preventDefault();
      try {
        const data = formObj(e.target);
        let id = c?.id;
        if (c) await api('PUT', `/api/clients/${c.id}`, data);
        else id = (await api('POST', '/api/clients', data)).id;
        m.close();
        toast('Cliente salvo.');
        onSaved(id);
      } catch (err) { toast(err.message, 'error'); }
    };
  }

  async function clientsPage() {
    loading('#/clientes');
    const list = await api('GET', '/api/clients');
    const main = shell(`
      <div class="page-head"><div><h1>Clientes</h1><p class="muted">${list.length} cliente(s)</p></div><button class="btn primary" id="add">+ Novo cliente</button></div>
      <div class="card">${list.length ? `<div class="table-wrap"><table>
        <thead><tr><th>Nome</th><th>Contato</th><th>Endereço</th><th class="num">Orçamentos</th><th></th></tr></thead>
        <tbody>${list.map((c) => `<tr>
          <td><strong>${esc(c.name)}</strong>${c.document ? `<div class="small muted">${esc(c.document)}</div>` : ''}</td>
          <td class="small">${esc(c.email || '')}<br>${esc(c.phone || '')}</td>
          <td class="small">${esc(c.address || '—')}</td>
          <td class="num">${c.budgets}</td>
          <td class="right nowrap"><button class="btn sm" data-edit="${c.id}">Editar</button> <button class="btn sm danger" data-del="${c.id}">Excluir</button></td>
        </tr>`).join('')}</tbody></table></div>` : '<div class="empty"><div class="icon">👥</div>Nenhum cliente cadastrado.</div>'}</div>`, '#/clientes');
    main.querySelector('#add').onclick = () => clientModal(null, route);
    main.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => clientModal(list.find((c) => c.id === Number(b.dataset.edit)), route)));
    main.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
      if (!(await confirmDialog('Excluir este cliente? Os orçamentos dele ficarão sem cliente.', 'Excluir'))) return;
      await api('DELETE', `/api/clients/${b.dataset.del}`);
      route();
    }));
  }

  // ---------- Diretório de parceiros ----------

  async function partnersPage() {
    loading('#/parceiros');
    const data = await api('GET', '/api/partners');
    const main = shell(`
      <div class="page-head"><div><h1>Lojas parceiras</h1><p class="muted">Até 3 lojas selecionadas por segmento, com contato direto.</p></div>
        <input id="q" placeholder="Buscar segmento ou loja…" style="max-width:280px"></div>
      <div id="list"></div>`, '#/parceiros');
    const draw = (q = '') => {
      const s = q.toLowerCase();
      const filtered = data.filter((seg) => !s || seg.name.toLowerCase().includes(s) || seg.stores.some((st) => st.name.toLowerCase().includes(s)));
      main.querySelector('#list').innerHTML = filtered.map((seg) => `
        <div class="card segment-block">
          <div class="segment-title"><h3>${esc(seg.icon)} ${esc(seg.name)}</h3>${slotsDots(seg.stores.length)}</div>
          <div class="partners">${seg.stores.map((st) => storeCard(st, { segmentId: seg.id })).join('')}${emptySlots(Math.max(0, 3 - seg.stores.length))}</div>
        </div>`).join('') || '<div class="empty">Nada encontrado.</div>';
    };
    main.querySelector('#q').addEventListener('input', (e) => draw(e.target.value));
    draw();
  }

  // ---------- Perfil ----------

  async function profilePage() {
    const u = state.user;
    const main = shell(`
      <div class="page-head"><div><h1>Meu perfil</h1><p class="muted">Esses dados aparecem no cabeçalho dos seus orçamentos.</p></div></div>
      <div class="card" style="max-width:640px"><form id="pf" class="form-grid">
        <div class="field full"><label>Nome</label><input name="name" value="${esc(u.name)}" required></div>
        <div class="field"><label>Escritório / Estúdio</label><input name="company" value="${esc(u.company || '')}"></div>
        <div class="field"><label>Registro CAU</label><input name="cau" value="${esc(u.cau || '')}"></div>
        <div class="field"><label>Telefone</label><input name="phone" value="${esc(u.phone || '')}"></div>
        <div class="field"><label>E-mail</label><input value="${esc(u.email)}" disabled></div>
        <div class="full"><button class="btn primary">Salvar</button></div>
      </form></div>`, '#/perfil');
    main.querySelector('form').onsubmit = async (e) => {
      e.preventDefault();
      try {
        await api('PUT', '/api/me', formObj(e.target));
        state.user = await api('GET', '/api/me');
        toast('Perfil atualizado.');
        route();
      } catch (err) { toast(err.message, 'error'); }
    };
  }

  // ================= Lojista =================

  async function storeDashboard() {
    loading('#/');
    const [d] = await Promise.all([api('GET', '/api/store/me'), loadSegments()]);
    const m30 = d.metrics.last30;
    const ctr = m30.impressions ? ((m30.contacts / m30.impressions) * 100).toFixed(1) + '%' : '—';
    const taken = new Set(d.subscriptions.filter((s) => s.status !== 'inactive').map((s) => s.segment_id));
    const available = state.segments.filter((s) => !taken.has(s.id));
    const statusInfo = (s) => {
      if (s.status === 'active') return `Ativa até ${dateFmt(s.expires_at)}`;
      if (s.status === 'waitlist') return `Posição ${s.waitlist_position} na fila · ${s.active_stores}/${d.max_per_segment} vagas ocupadas`;
      if (s.status === 'pending') return `Solicitada em ${dateFmt(s.requested_at)} · ${s.active_stores}/${d.max_per_segment} vagas ocupadas`;
      return 'Cancelada / expirada';
    };
    const main = shell(`
      <div class="page-head"><div><h1>${esc(d.store.name)}</h1><p class="muted">Painel do anunciante</p></div><a class="btn" href="#/loja/perfil">Editar perfil da loja</a></div>
      <div class="grid grid-4">
        <div class="card stat"><div class="label">Exibições (30d)</div><div class="value">${m30.impressions}</div><div class="hint">${d.metrics.allTime.impressions} no total</div></div>
        <div class="card stat"><div class="label">Contatos (30d)</div><div class="value">${m30.contacts}</div><div class="hint">Cliques em WhatsApp, telefone, e-mail…</div></div>
        <div class="card stat"><div class="label">Indicações em orçamentos</div><div class="value">${m30.selected}</div><div class="hint">Itens vinculados à sua loja (30d)</div></div>
        <div class="card stat"><div class="label">Taxa de contato</div><div class="value">${ctr}</div><div class="hint">Contatos ÷ exibições</div></div>
      </div>

      <div class="grid grid-2" style="margin-top:16px">
        <div class="card">
          <div class="card-head"><h2>Meus segmentos</h2></div>
          ${d.subscriptions.length ? `<div class="table-wrap"><table><tbody>${d.subscriptions.map((s) => `
            <tr><td><strong>${esc(s.segment_icon)} ${esc(s.segment_name)}</strong><div class="small muted">${statusInfo(s)}</div><div class="small muted">Plano ${PLANS[s.plan]} · ${brl(s.price)}</div></td>
              <td><span class="badge ${s.status}">${SUB_STATUS[s.status]}</span></td>
              <td class="right">${s.status !== 'inactive' ? `<button class="btn sm danger" data-cancel="${s.id}">Cancelar</button>` : ''}</td></tr>`).join('')}</tbody></table></div>`
            : '<div class="empty">Nenhum segmento contratado.</div>'}
        </div>
        <div class="card">
          <div class="card-head"><h2>Anunciar em novo segmento</h2></div>
          <p class="small muted">Cada segmento tem no máximo ${d.max_per_segment} lojas. Se estiver lotado, você entra na fila e é ativado(a) automaticamente quando abrir vaga.</p>
          <form id="sf">
            <div class="field"><label>Segmento</label><select name="segment_id" required>${available.map((s) => `<option value="${s.id}">${esc(s.icon)} ${esc(s.name)} — ${s.free_slots ? `${s.free_slots} vaga(s) livre(s)` : `lotado (${s.waitlist} na fila)`}</option>`).join('')}</select></div>
            <div class="field"><label>Plano</label><select name="plan"><option value="mensal">Mensal — R$ 199/mês</option><option value="trimestral">Trimestral — R$ 549</option><option value="anual">Anual — R$ 1.990</option></select></div>
            <button class="btn primary" ${available.length ? '' : 'disabled'}>Solicitar vaga</button>
          </form>
        </div>
      </div>

      <div class="card" style="margin-top:16px">
        <div class="card-head"><h2>Últimos contatos e indicações</h2></div>
        ${d.leads.length ? `<div class="table-wrap"><table>
          <thead><tr><th>Quando</th><th>Arquiteto(a)</th><th>Segmento</th><th>Ação</th></tr></thead>
          <tbody>${d.leads.map((l) => `<tr><td class="nowrap small">${dateTimeFmt(l.created_at)}</td>
            <td>${esc(l.architect_name || '—')}${l.architect_company ? `<div class="small muted">${esc(l.architect_company)}</div>` : ''}</td>
            <td class="small">${esc(l.segment_name || '—')}</td>
            <td>${l.type === 'contact' ? `<span class="badge enviado">Contato via ${esc(l.channel)}</span>` : '<span class="badge aprovado">Incluiu no orçamento</span>'}</td></tr>`).join('')}</tbody></table></div>`
          : '<div class="empty">Ainda sem contatos. Quando um arquiteto clicar no seu contato ou indicar sua loja, aparece aqui.</div>'}
      </div>

      <div class="card" style="margin-top:16px;max-width:380px">
        <h3>Como os arquitetos veem sua loja</h3>
        ${storeCard(d.store, { track: false })}
      </div>`, '#/');

    main.querySelector('#sf').onsubmit = async (e) => {
      e.preventDefault();
      try { await api('POST', '/api/store/segments', formObj(e.target)); toast('Solicitação enviada para aprovação.'); route(); } catch (err) { toast(err.message, 'error'); }
    };
    main.querySelectorAll('[data-cancel]').forEach((b) => b.addEventListener('click', async () => {
      if (!(await confirmDialog('Cancelar este segmento? Sua vaga será liberada para a próxima loja da fila.', 'Cancelar vaga'))) return;
      await api('DELETE', `/api/store/segments/${b.dataset.cancel}`);
      toast('Segmento cancelado.');
      route();
    }));
  }

  async function storeProfile() {
    loading('#/loja/perfil');
    const { store: s } = await api('GET', '/api/store/me');
    const main = shell(`
      <div class="page-head"><div><h1>Perfil da loja</h1><p class="muted">Essas informações aparecem para os arquitetos no momento do orçamento.</p></div></div>
      <div class="grid" style="grid-template-columns:minmax(0,1fr) 320px;align-items:start">
        <div class="card"><form id="sp" class="form-grid">
          <div class="field"><label>Nome da loja</label><input name="name" value="${esc(s.name)}" required></div>
          <div class="field"><label>CNPJ</label><input name="cnpj" value="${esc(s.cnpj || '')}"></div>
          <div class="field full"><label>Descrição curta (aparece no cartão)</label><textarea name="description" maxlength="600">${esc(s.description || '')}</textarea></div>
          <div class="field"><label>Telefone</label><input name="phone" value="${esc(s.phone || '')}"></div>
          <div class="field"><label>WhatsApp</label><input name="whatsapp" value="${esc(s.whatsapp || '')}"></div>
          <div class="field"><label>E-mail comercial</label><input name="email" type="email" value="${esc(s.email || '')}"></div>
          <div class="field"><label>Site</label><input name="website" value="${esc(s.website || '')}"></div>
          <div class="field"><label>Instagram</label><input name="instagram" value="${esc(s.instagram || '')}" placeholder="@sualoja"></div>
          <div class="field"><label>Cor da marca</label><input name="color" type="color" value="${esc(s.color)}" style="height:40px;padding:4px"></div>
          <div class="field full"><label>Endereço</label><input name="address" value="${esc(s.address || '')}"></div>
          <div class="field"><label>Cidade</label><input name="city" value="${esc(s.city || '')}"></div>
          <div class="field"><label>UF</label><input name="state" maxlength="2" value="${esc(s.state || '')}"></div>
          <div class="full"><button class="btn primary">Salvar</button></div>
        </form></div>
        <div class="card"><h3>Pré-visualização</h3><div id="preview"></div></div>
      </div>`, '#/loja/perfil');
    const f = main.querySelector('form');
    const prev = () => { main.querySelector('#preview').innerHTML = storeCard({ ...s, ...formObj(f), id: s.id }, { track: false }); };
    f.addEventListener('input', prev);
    prev();
    f.onsubmit = async (e) => {
      e.preventDefault();
      try { await api('PUT', '/api/store/me', formObj(f)); toast('Perfil salvo.'); } catch (err) { toast(err.message, 'error'); }
    };
  }

  // ================= Admin =================

  async function adminOverview() {
    loading('#/');
    const d = await api('GET', '/api/admin/overview');
    const full = d.segments.filter((s) => s.subscriptions.filter((x) => x.status === 'active').length >= d.max_per_segment).length;
    const main = shell(`
      <div class="page-head"><div><h1>Visão geral</h1><p class="muted">Aprovação de anunciantes e ocupação das vagas.</p></div></div>
      <div class="grid grid-4">
        <div class="card stat"><div class="label">Arquitetos</div><div class="value">${d.counts.architects}</div><div class="hint">${d.counts.budgets} orçamento(s) criados</div></div>
        <div class="card stat"><div class="label">Lojas</div><div class="value">${d.counts.stores}</div><div class="hint">${d.counts.pending} aguardando aprovação</div></div>
        <div class="card stat"><div class="label">Receita recorrente</div><div class="value">${brl(d.counts.mrr)}</div><div class="hint">Estimativa mensal (assinaturas ativas)</div></div>
        <div class="card stat"><div class="label">Segmentos lotados</div><div class="value">${full}/${d.segments.length}</div><div class="hint">Com ${d.max_per_segment} lojas ativas</div></div>
      </div>
      <div class="card" style="margin-top:16px">
        <div class="card-head"><h2>Solicitações pendentes</h2></div>
        ${d.pending.length ? `<div class="table-wrap"><table>
          <thead><tr><th>Loja</th><th>Segmento</th><th>Plano</th><th>Solicitado</th><th></th></tr></thead>
          <tbody>${d.pending.map((s) => {
            const seg = d.segments.find((g) => g.id === s.segment_id);
            const act = seg.subscriptions.filter((x) => x.status === 'active').length;
            return `<tr><td><strong>${esc(s.store_name)}</strong><div class="small muted">${esc([s.city, s.state].filter(Boolean).join(' - '))} · ${esc(s.email || '')}</div></td>
              <td>${esc(s.segment_name)} ${slotsDots(act, d.max_per_segment)}</td><td>${PLANS[s.plan]}</td><td class="small">${dateFmt(s.requested_at)}</td>
              <td class="right nowrap"><button class="btn sm primary" data-approve="${s.id}">${act >= d.max_per_segment ? 'Aprovar p/ fila' : 'Aprovar'}</button> <button class="btn sm danger" data-deact="${s.id}">Recusar</button></td></tr>`;
          }).join('')}</tbody></table></div>` : '<div class="empty">Nenhuma solicitação pendente. 🎉</div>'}
      </div>`, '#/');
    bindAdminActions(main);
  }

  function bindAdminActions(root) {
    root.querySelectorAll('[data-approve]').forEach((b) => b.addEventListener('click', async () => {
      const r = await api('POST', `/api/admin/subscriptions/${b.dataset.approve}/approve`);
      toast(r.status === 'active' ? 'Loja ativada no segmento.' : 'Segmento lotado: loja adicionada à fila de espera.');
      route();
    }));
    root.querySelectorAll('[data-deact]').forEach((b) => b.addEventListener('click', async () => {
      if (!(await confirmDialog('Desativar esta assinatura? Se houver fila, a próxima loja será ativada automaticamente.', 'Desativar'))) return;
      const r = await api('POST', `/api/admin/subscriptions/${b.dataset.deact}/deactivate`);
      toast(r.promoted.length ? 'Desativada. Próxima loja da fila foi ativada.' : 'Assinatura desativada.');
      route();
    }));
  }

  async function adminSegments() {
    loading('#/admin/segmentos');
    const d = await api('GET', '/api/admin/overview');
    const main = shell(`
      <div class="page-head"><div><h1>Segmentos e vagas</h1><p class="muted">Máximo de ${d.max_per_segment} lojas ativas por segmento. A fila é promovida automaticamente.</p></div></div>
      <div class="card" style="margin-bottom:16px"><form id="ns" class="row">
        <input name="icon" placeholder="Ícone" style="width:80px" maxlength="4"><input name="name" placeholder="Nome do novo segmento" required style="flex:1;min-width:200px">
        <button class="btn primary">+ Adicionar segmento</button></form></div>
      <div class="grid grid-2">${d.segments.map((seg) => {
        const subs = seg.subscriptions.filter((s) => s.status !== 'inactive');
        const act = subs.filter((s) => s.status === 'active').length;
        const order = { active: 0, waitlist: 1, pending: 2 };
        return `<div class="card" style="${seg.active ? '' : 'opacity:.6'}">
          <div class="card-head"><h3 style="margin:0">${esc(seg.icon)} ${esc(seg.name)}</h3>
            <div class="row">${slotsDots(act, d.max_per_segment)}<button class="btn sm ghost" data-toggle="${seg.id}" data-active="${seg.active ? 1 : 0}">${seg.active ? 'Ocultar' : 'Reativar'}</button></div></div>
          ${subs.length ? `<table><tbody>${subs.sort((a, b) => order[a.status] - order[b.status]).map((s) => `
            <tr><td>${esc(s.store_name)}<div class="small muted">${PLANS[s.plan]}${s.expires_at ? ` · até ${dateFmt(s.expires_at)}` : ''}</div></td>
              <td><span class="badge ${s.status}">${SUB_STATUS[s.status]}</span></td>
              <td class="right nowrap">${s.status === 'pending' ? `<button class="btn sm primary" data-approve="${s.id}">Aprovar</button> ` : ''}<button class="btn sm danger" data-deact="${s.id}">Desativar</button></td></tr>`).join('')}</tbody></table>`
            : '<p class="small muted">Nenhuma loja neste segmento.</p>'}
        </div>`;
      }).join('')}</div>`, '#/admin/segmentos');
    bindAdminActions(main);
    main.querySelector('#ns').onsubmit = async (e) => {
      e.preventDefault();
      try { await api('POST', '/api/admin/segments', formObj(e.target)); toast('Segmento criado.'); state.segments = []; route(); } catch (err) { toast(err.message, 'error'); }
    };
    main.querySelectorAll('[data-toggle]').forEach((b) => b.addEventListener('click', async () => {
      await api('PUT', `/api/admin/segments/${b.dataset.toggle}`, { active: b.dataset.active !== '1' });
      state.segments = [];
      route();
    }));
  }

  // ================= Roteador =================

  const ROUTES = {
    architect: [
      [/^\/$/, architectDashboard],
      [/^\/orcamentos$/, budgetsPage],
      [/^\/orcamentos\/(\d+)$/, budgetEditor],
      [/^\/orcamentos\/(\d+)\/imprimir$/, budgetPrint],
      [/^\/clientes$/, clientsPage],
      [/^\/parceiros$/, partnersPage],
      [/^\/perfil$/, profilePage],
    ],
    store: [[/^\/$/, storeDashboard], [/^\/loja\/perfil$/, storeProfile]],
    admin: [[/^\/$/, adminOverview], [/^\/admin\/segmentos$/, adminSegments], [/^\/parceiros$/, partnersPage]],
  };

  async function route() {
    const path = location.hash.replace(/^#/, '') || '/';
    if (!state.token) return renderLanding(path === '/cadastro' ? 'register' : 'login');
    try {
      if (!state.user) state.user = await api('GET', '/api/me');
    } catch {
      setToken(null);
      return renderLanding();
    }
    for (const [re, fn] of ROUTES[state.user.role]) {
      const m = path.match(re);
      if (m) {
        try { await fn(...m.slice(1)); } catch (err) {
          toast(err.message, 'error');
          shell(`<div class="empty"><div class="icon">⚠️</div>${esc(err.message)}<br><br><a href="#/">Voltar ao início</a></div>`, '');
        }
        window.scrollTo(0, 0);
        return;
      }
    }
    location.hash = '#/';
  }

  window.addEventListener('hashchange', route);
  route();
})();
