/* Painel do corretor — SPA em JavaScript puro. */
(() => {
  'use strict';

  const app = document.getElementById('app');
  const state = { token: load('token'), me: null, newLeads: 0 };

  function load(k) { try { return localStorage.getItem(k); } catch { return null; } }
  function save(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* ignore */ } }

  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const brl = (n) => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  const when = (s) => {
    const d = new Date(String(s).replace(' ', 'T') + 'Z');
    const diff = (Date.now() - d) / 1000;
    if (diff < 60) return 'agora';
    if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
    if (diff < 86400 && d.getDate() === new Date().getDate()) return `hoje, ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };
  const phoneFmt = (p) => {
    const d = String(p || '').replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
    return d.length === 11 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : d.length === 10 ? `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}` : d;
  };
  const initials = (n) => String(n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const vitrineUrl = (slug, id) => `${location.origin}/${slug}${id ? `/${id}` : ''}`;
  const LEAD_CLASS = { 'Pediu contato': 'ls-new', 'Quer visitar': 'ls-hot', 'Respondido': 'ls-ok', 'Visita marcada': 'ls-ok', 'Fechou negócio': 'ls-won', 'Desistiu': 'ls-lost' };
  const TYPES = ['Apartamento', 'Casa', 'Casa em condomínio', 'Sobrado', 'Cobertura', 'Studio', 'Kitnet', 'Terreno', 'Sala comercial', 'Loja', 'Galpão', 'Chácara'];
  const FEATS = ['Piscina', 'Churrasqueira', 'Varanda gourmet', 'Academia', 'Portaria 24h', 'Elevador', 'Aceita pet', 'Mobiliado', 'Armários', 'Quintal', 'Ar-condicionado', 'Energia solar', 'Aceita financiamento', 'Aceita permuta'];

  async function api(method, url, body) {
    const res = await fetch(url, {
      method,
      headers: { 'content-type': 'application/json', ...(state.token ? { authorization: `Bearer ${state.token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && state.token) { logout(); throw new Error('Sua sessão expirou. Entre de novo.'); }
    if (!res.ok) throw new Error(data.error || 'Algo deu errado. Tente de novo.');
    return data;
  }

  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(() => { t.hidden = true; }, 2800);
  }
  async function copy(text, okMsg = 'Link copiado.') {
    try { await navigator.clipboard.writeText(text); toast(okMsg); } catch { prompt('Copie o link:', text); }
  }
  function confirmBox(message, okLabel) {
    return new Promise((resolve) => {
      const bg = document.createElement('div');
      bg.className = 'confirm-bg';
      bg.innerHTML = `<div class="confirm" role="dialog" aria-modal="true"><p>${esc(message)}</p><div class="row"><button class="btn" data-no>Cancelar</button><button class="btn primary" data-yes>${esc(okLabel)}</button></div></div>`;
      const done = (v) => { bg.remove(); resolve(v); };
      bg.querySelector('[data-no]').onclick = () => done(false);
      bg.querySelector('[data-yes]').onclick = () => done(true);
      bg.addEventListener('click', (e) => { if (e.target === bg) done(false); });
      document.body.appendChild(bg);
    });
  }
  const waShare = (text) => `https://wa.me/?text=${encodeURIComponent(text)}`;

  // Reduz a foto no próprio celular antes de enviar (mais rápido e economiza internet).
  function shrink(file) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, 1600 / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(img.src);
        resolve(c.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => { URL.revokeObjectURL(img.src); resolve(null); };
      img.src = URL.createObjectURL(file);
    });
  }

  function logout() {
    api('POST', '/api/auth/logout').catch(() => {});
    state.token = null; state.me = null; save('token', null);
    location.hash = '#/';
    route();
  }

  // ================= Layout =================
  const TABS = [['#/', '🏠', 'Início'], ['#/imoveis', '🏘️', 'Imóveis'], ['#/interessados', '👥', 'Interessados'], ['#/perfil', '⚙️', 'Perfil']];
  function shell(active, html) {
    app.innerHTML = `<main class="page">${html}</main>
      <nav class="tabs" aria-label="Menu">${TABS.map(([h, i, t]) => `<a href="${h}" class="${h === active ? 'on' : ''}"><span aria-hidden="true">${i}</span>${t}${h === '#/interessados' && state.newLeads ? `<i class="dot">${state.newLeads}</i>` : ''}</a>`).join('')}</nav>`;
    return app.querySelector('.page');
  }

  // ================= Entrar / Criar conta =================
  function authPage(mode = 'login') {
    app.innerHTML = `<div class="auth">
      <div><div class="brand">Vitrine do <em>Corretor</em></div><p class="muted">Seus imóveis num link só, e todos os interessados organizados.</p></div>
      <div class="switch"><button data-m="login" class="${mode === 'login' ? 'on' : ''}">Entrar</button><button data-m="register" class="${mode === 'register' ? 'on' : ''}">Criar conta grátis</button></div>
      <form class="stack" id="authForm">
        ${mode === 'register' ? `
          <label class="field"><span>Seu nome</span><input name="name" required autocomplete="name"></label>
          <label class="field"><span>Seu WhatsApp</span><input name="whatsapp" required inputmode="tel" placeholder="(11) 99999-0000"><small class="hint">É para onde os clientes vão te chamar.</small></label>
          <div class="fgrid"><label class="field"><span>Cidade</span><input name="city" placeholder="Ex.: Campinas - SP"></label><label class="field"><span>CRECI</span><input name="creci" placeholder="Opcional"></label></div>` : ''}
        <label class="field"><span>E-mail</span><input name="email" type="email" required autocomplete="email"></label>
        <label class="field"><span>Senha</span><input name="password" type="password" required minlength="6" autocomplete="${mode === 'login' ? 'current-password' : 'new-password'}"></label>
        <p class="error" id="authErr" hidden></p>
        <button class="btn primary block">${mode === 'login' ? 'Entrar' : 'Criar minha vitrine'}</button>
      </form></div>`;
    app.querySelectorAll('[data-m]').forEach((b) => b.onclick = () => authPage(b.dataset.m));
    app.querySelector('form').onsubmit = async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector('button.primary');
      btn.disabled = true;
      try {
        const data = Object.fromEntries(new FormData(e.target));
        const { token } = await api('POST', mode === 'login' ? '/api/auth/login' : '/api/auth/register', data);
        state.token = token; save('token', token);
        location.hash = mode === 'login' ? '#/' : '#/imoveis/novo';
        route();
      } catch (err) {
        const el = document.getElementById('authErr'); el.textContent = err.message; el.hidden = false;
      } finally { btn.disabled = false; }
    };
  }

  // ================= Início =================
  async function home() {
    const [s, { leads }] = await Promise.all([api('GET', '/api/stats'), api('GET', '/api/leads')]);
    const me = state.me;
    const url = vitrineUrl(me.slug);
    const hot = leads.filter((l) => l.status === 'Pediu contato' || l.status === 'Quer visitar');
    const max = Math.max(1, ...s.top.map((t) => t.views));
    const page = shell('#/', `
      <div><h1>Olá, ${esc(me.name.split(' ')[0])}</h1><p class="muted">Resumo dos últimos 7 dias.</p></div>
      <section class="box">
        <h3>Sua vitrine</h3>
        <div class="link-box"><span>${esc(url.replace(/^https?:\/\//, ''))}</span></div>
        <div class="row">
          <a class="btn wa" href="${esc(waShare(`Veja meus imóveis disponíveis: ${url}`))}" target="_blank" rel="noopener">Mandar no WhatsApp</a>
          <button class="btn" id="copyLink">Copiar link</button>
          <a class="btn" href="${esc(url)}" target="_blank" rel="noopener">Abrir</a>
        </div>
      </section>
      ${s.activeListings ? '' : `<section class="box empty"><div class="icon">🏠</div><p>Cadastre seu primeiro imóvel para a vitrine ganhar vida.</p><a class="btn primary" href="#/imoveis/novo">＋ Cadastrar imóvel</a></section>`}
      <section class="stats">
        <div class="stat"><b class="num">${s.visitors7}</b><span>pessoas abriram seu link</span></div>
        <div class="stat"><b class="num">${s.listingViews7}</b><span>visualizações de imóveis</span></div>
        <div class="stat"><b class="num">${s.leads7}</b><span>novos interessados</span></div>
        <div class="stat"><b class="num">${s.visits}</b><span>visitas marcadas</span></div>
      </section>
      ${hot.length ? `<section class="box"><div class="page-head"><h3>Responda primeiro</h3><a href="#/interessados">Ver todos</a></div>
        ${hot.slice(0, 3).map((l) => `<div class="lead-top"><span class="ini">${esc(initials(l.name))}</span><div style="min-width:0"><b>${esc(l.name)}</b><small>${esc(l.status)} · ${esc(l.listing_type ? `${l.listing_type} · ${l.listing_bairro}` : 'Vitrine')} · ${when(l.created_at)}</small></div>
          <a class="btn wa sm" href="${esc(l.whatsapp_url)}" target="_blank" rel="noopener">WhatsApp</a></div>`).join('')}</section>` : ''}
      ${s.top.length ? `<section class="box"><h3>Imóveis mais vistos</h3>${s.top.map((t) => `
        <div class="bar-row"><span class="label">${esc(t.type)} · ${esc(t.bairro)}</span><b class="num">${t.views}</b><div class="track"><span style="width:${(t.views / max) * 100}%"></span></div></div>`).join('')}</section>` : ''}
    `);
    page.querySelector('#copyLink').onclick = () => copy(url);
  }

  // ================= Imóveis =================
  async function listingsPage() {
    const list = await api('GET', '/api/listings');
    const page = shell('#/imoveis', `
      <div class="page-head"><h1>Imóveis</h1><a class="btn primary" href="#/imoveis/novo">＋ Cadastrar</a></div>
      ${list.length ? list.map((l) => `
        <article class="listing">
          <a class="thumb" href="#/imoveis/${l.id}">${l.photos[0] ? `<img src="${esc(l.photos[0].url)}" alt="">` : '🏠'}</a>
          <div style="min-width:0">
            <div class="price num">${brl(l.price)}${l.deal === 'aluguel' ? '<span class="small muted"> /mês</span>' : ''}</div>
            <div><b>${esc(l.type)}</b> · ${esc(l.bairro)}</div>
            <div class="meta">👁 ${l.views_total} visualizações · 👥 ${l.leads_total} interessados · 📷 ${l.photos.length}</div>
            <div class="row">
              <select class="status-sel st-${l.status}" data-status="${l.id}" aria-label="Situação do imóvel">
                ${[['ativo', 'No ar'], ['pausado', 'Pausado'], [l.deal === 'aluguel' ? 'alugado' : 'vendido', l.deal === 'aluguel' ? 'Alugado' : 'Vendido']].map(([v, t]) => `<option value="${v}" ${l.status === v ? 'selected' : ''}>${t}</option>`).join('')}
              </select>
              <a class="btn sm" href="#/imoveis/${l.id}">Editar</a>
              <a class="btn sm wa" href="${esc(waShare(`${l.type} no ${l.bairro} · ${brl(l.price)}${l.deal === 'aluguel' ? '/mês' : ''}\n${vitrineUrl(state.me.slug, l.id)}`))}" target="_blank" rel="noopener">Enviar</a>
              <button class="btn sm" data-copy="${l.id}">Link</button>
            </div>
          </div>
        </article>`).join('') : `<section class="box empty"><div class="icon">🏘️</div><p>Nenhum imóvel ainda.</p><a class="btn primary" href="#/imoveis/novo">＋ Cadastrar o primeiro</a></section>`}
    `);
    page.querySelectorAll('[data-status]').forEach((s) => s.addEventListener('change', async () => {
      try {
        await api('PUT', `/api/listings/${s.dataset.status}/status`, { status: s.value });
        s.className = `status-sel st-${s.value}`;
        toast(s.value === 'ativo' ? 'Imóvel no ar.' : s.value === 'pausado' ? 'Imóvel escondido da vitrine.' : 'Marcado. Ele aparece na vitrine com o selo.');
      } catch (err) { toast(err.message); }
    }));
    page.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', () => copy(vitrineUrl(state.me.slug, b.dataset.copy))));
  }

  async function listingForm(id) {
    const l = id ? await api('GET', `/api/listings/${id}`) : { deal: 'venda', type: 'Apartamento', bairro: '', price: '', area: '', beds: 2, suites: 1, baths: 1, parking: 1, condo_fee: 0, iptu: 0, description: '', features: [], photos: [] };
    const known = await api('GET', '/api/listings').then((all) => [...new Set(all.map((x) => x.bairro))].sort()).catch(() => []);
    let deal = l.deal;
    let photos = l.photos.slice();          // já salvas: {id, url}
    const pending = [];                       // novas: data URLs
    const numField = (name, label, val) => `<label class="field"><span>${label}</span><input name="${name}" type="number" inputmode="numeric" min="0" value="${esc(val)}"></label>`;

    const page = shell('#/imoveis', `
      <div class="page-head"><h1>${id ? 'Editar imóvel' : 'Cadastrar imóvel'}</h1>${id ? `<a class="btn sm" href="${esc(vitrineUrl(state.me.slug, id))}" target="_blank" rel="noopener">Ver na vitrine</a>` : ''}</div>
      <form class="stack" id="lf">
        <section class="box">
          <span class="flabel">Fotos</span>
          <label class="upload" for="fPhotos">📷 Escolher fotos</label>
          <input type="file" id="fPhotos" accept="image/*" multiple hidden>
          <div class="thumbs" id="thumbs"></div>
          <small class="hint">A primeira foto é a capa. Até 20 fotos.</small>
        </section>
        <section class="box">
          <span class="flabel">Venda ou aluguel?</span>
          <div class="chips" id="fDeal"><button type="button" class="chip" data-v="venda">Venda</button><button type="button" class="chip" data-v="aluguel">Aluguel</button></div>
          <div class="fgrid">
            <label class="field"><span>Tipo</span><select name="type">${[...new Set([l.type, ...TYPES])].map((t) => `<option ${t === l.type ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>
            <label class="field"><span>Bairro</span><input name="bairro" list="bairros" required value="${esc(l.bairro)}" placeholder="Ex.: Centro"><datalist id="bairros">${known.map((b) => `<option value="${esc(b)}">`).join('')}</datalist></label>
            <label class="field"><span id="priceLabel">Preço</span><input name="price" type="number" inputmode="numeric" min="1" required value="${esc(l.price)}"></label>
            <label class="field"><span>Área (m²)</span><input name="area" type="number" inputmode="numeric" min="0" value="${esc(l.area)}"></label>
          </div>
          <div class="fgrid four">${numField('beds', 'Quartos', l.beds)}${numField('suites', 'Suítes', l.suites)}${numField('baths', 'Banheiros', l.baths)}${numField('parking', 'Vagas', l.parking)}</div>
          <div class="fgrid">${numField('condo_fee', 'Condomínio (R$/mês)', l.condo_fee)}${numField('iptu', 'IPTU (R$/mês)', l.iptu)}</div>
        </section>
        <section class="box">
          <span class="flabel">Diferenciais</span>
          <div class="feat-pick">${[...new Set([...FEATS, ...l.features])].map((f) => `<label class="pick"><input type="checkbox" value="${esc(f)}" ${l.features.includes(f) ? 'checked' : ''}> ${esc(f)}</label>`).join('')}</div>
          <label class="field"><span>Descrição</span><textarea name="description" placeholder="Ex.: Reformado, sol da manhã, a 5 minutos do metrô.">${esc(l.description || '')}</textarea></label>
        </section>
        <div class="progress" id="prog" hidden><span style="width:0"></span></div>
        <div class="form-actions">
          ${id ? '<button type="button" class="btn danger" id="del">Excluir</button>' : '<a class="btn" href="#/imoveis">Cancelar</a>'}
          <button class="btn primary" id="saveBtn">${id ? 'Salvar' : 'Publicar na vitrine'}</button>
        </div>
      </form>`);

    const f = page.querySelector('#lf');
    const setDeal = (v) => {
      deal = v;
      page.querySelectorAll('#fDeal [data-v]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
      page.querySelector('#priceLabel').textContent = v === 'aluguel' ? 'Aluguel (R$/mês)' : 'Preço de venda (R$)';
    };
    page.querySelectorAll('#fDeal [data-v]').forEach((b) => b.onclick = () => setDeal(b.dataset.v));
    setDeal(deal);

    const drawThumbs = () => {
      const all = [...photos.map((p) => ({ src: p.url, saved: p })), ...pending.map((d) => ({ src: d, pending: d }))];
      page.querySelector('#thumbs').innerHTML = all.map((p, i) => `<div class="t"><img src="${esc(p.src)}" alt="Foto ${i + 1}">
        <button type="button" class="rm" data-rm="${i}" aria-label="Remover foto">✕</button>
        ${i === 0 ? '<span class="is-cover">Capa</span>' : `<button type="button" class="cover" data-cover="${i}">Capa</button>`}</div>`).join('');
      page.querySelectorAll('[data-rm]').forEach((b) => b.onclick = async () => {
        const i = Number(b.dataset.rm);
        if (i < photos.length) {
          try { await api('DELETE', `/api/listings/${id}/photos/${photos[i].id}`); photos.splice(i, 1); } catch (err) { toast(err.message); }
        } else pending.splice(i - photos.length, 1);
        drawThumbs();
      });
      page.querySelectorAll('[data-cover]').forEach((b) => b.onclick = async () => {
        const i = Number(b.dataset.cover);
        if (i < photos.length) {
          photos.unshift(photos.splice(i, 1)[0]);
          try { await api('PUT', `/api/listings/${id}/photos/order`, { ids: photos.map((p) => p.id) }); } catch (err) { toast(err.message); }
        } else if (!photos.length) {
          pending.unshift(pending.splice(i, 1)[0]);
        } else toast('Salve o imóvel primeiro para escolher esta foto como capa.');
        drawThumbs();
      });
    };
    drawThumbs();
    page.querySelector('#fPhotos').addEventListener('change', async (e) => {
      const files = [...e.target.files].slice(0, 20 - photos.length - pending.length);
      for (const file of files) { const d = await shrink(file); if (d) pending.push(d); }
      e.target.value = '';
      drawThumbs();
    });

    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = page.querySelector('#saveBtn');
      btn.disabled = true;
      const data = Object.fromEntries(new FormData(f));
      data.deal = deal;
      data.features = [...f.querySelectorAll('.pick input:checked')].map((c) => c.value);
      try {
        let listingId = id;
        if (id) await api('PUT', `/api/listings/${id}`, data);
        else listingId = (await api('POST', '/api/listings', data)).id;
        if (pending.length) {
          const prog = page.querySelector('#prog'); prog.hidden = false;
          for (let i = 0; i < pending.length; i++) {
            btn.textContent = `Enviando foto ${i + 1} de ${pending.length}…`;
            await api('POST', `/api/listings/${listingId}/photos`, { data: pending[i] });
            prog.firstElementChild.style.width = `${((i + 1) / pending.length) * 100}%`;
          }
        }
        toast(id ? 'Imóvel atualizado.' : 'Imóvel publicado na sua vitrine.');
        location.hash = '#/imoveis';
      } catch (err) {
        toast(err.message);
        btn.disabled = false;
        btn.textContent = id ? 'Salvar' : 'Publicar na vitrine';
      }
    });
    page.querySelector('#del')?.addEventListener('click', async () => {
      if (!(await confirmBox('Excluir este imóvel e as fotos dele? Não dá para desfazer.', 'Excluir'))) return;
      await api('DELETE', `/api/listings/${id}`);
      toast('Imóvel excluído.');
      location.hash = '#/imoveis';
    });
  }

  // ================= Interessados =================
  let leadFilter = 'Todos';
  async function leadsPage() {
    const { statuses, leads } = await api('GET', '/api/leads');
    save('seen_leads', String(Math.max(0, ...leads.map((l) => l.id))));
    state.newLeads = 0;
    const counts = {};
    leads.forEach((l) => { counts[l.status] = (counts[l.status] || 0) + 1; });
    const shown = leads.filter((l) => leadFilter === 'Todos' || l.status === leadFilter);
    const page = shell('#/interessados', `
      <div><h1>Interessados</h1><p class="muted">Quem pediu contato ou visita pela sua vitrine.</p></div>
      <div class="chips">${['Todos', ...statuses].map((s) => `<button type="button" class="chip" data-f="${esc(s)}" aria-pressed="${leadFilter === s}">${esc(s)} · ${s === 'Todos' ? leads.length : counts[s] || 0}</button>`).join('')}</div>
      ${shown.length ? shown.map((l) => `
        <article class="lead">
          <div class="lead-top">
            <span class="ini">${esc(initials(l.name))}</span>
            <div style="min-width:0"><b>${esc(l.name)}</b><small>${esc(phoneFmt(l.phone))} · ${when(l.created_at)}</small>
              <small>${l.listing_type ? `${esc(l.listing_type)} · ${esc(l.listing_bairro)} · ${brl(l.listing_price)}` : 'Pela vitrine'}</small></div>
            <select class="lead-sel ${LEAD_CLASS[l.status] || ''}" data-lead="${l.id}" aria-label="Status de ${esc(l.name)}">${statuses.map((s) => `<option ${s === l.status ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select>
          </div>
          <textarea class="note" data-note="${l.id}" rows="1" placeholder="Anotação (ex.: prefere sábado de manhã)">${esc(l.note || '')}</textarea>
          <div class="row"><a class="btn wa sm" href="${esc(l.whatsapp_url)}" target="_blank" rel="noopener">💬 WhatsApp</a>
            ${l.listing_id ? `<a class="btn sm" href="${esc(vitrineUrl(state.me.slug, l.listing_id))}" target="_blank" rel="noopener">Ver imóvel</a>` : ''}
            <button class="btn sm danger" data-del="${l.id}">Apagar</button></div>
        </article>`).join('') : `<section class="box empty"><div class="icon">👥</div><p>${leads.length ? 'Ninguém nessa etapa agora.' : 'Quando alguém tocar em "Tenho interesse" ou "Quero visitar" na sua vitrine, aparece aqui.'}</p></section>`}
    `);
    page.querySelectorAll('[data-f]').forEach((b) => b.onclick = () => { leadFilter = b.dataset.f; leadsPage(); });
    page.querySelectorAll('[data-lead]').forEach((s) => s.addEventListener('change', async () => {
      try { await api('PUT', `/api/leads/${s.dataset.lead}`, { status: s.value }); toast(`Status: ${s.value}`); leadsPage(); } catch (err) { toast(err.message); }
    }));
    page.querySelectorAll('[data-note]').forEach((t) => t.addEventListener('change', async () => {
      try { await api('PUT', `/api/leads/${t.dataset.note}`, { note: t.value }); toast('Anotação salva.'); } catch (err) { toast(err.message); }
    }));
    page.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
      if (!(await confirmBox('Apagar este interessado da lista?', 'Apagar'))) return;
      await api('DELETE', `/api/leads/${b.dataset.del}`);
      leadsPage();
    }));
  }

  // ================= Perfil =================
  function profilePage() {
    const me = state.me;
    const page = shell('#/perfil', `
      <div><h1>Perfil</h1><p class="muted">Essas informações aparecem na sua vitrine.</p></div>
      <form class="stack box" id="pf">
        <label class="field"><span>Nome</span><input name="name" required value="${esc(me.name)}"></label>
        <label class="field"><span>WhatsApp</span><input name="whatsapp" required inputmode="tel" value="${esc(me.whatsapp)}"><small class="hint">Os clientes chamam neste número.</small></label>
        <div class="fgrid"><label class="field"><span>CRECI</span><input name="creci" value="${esc(me.creci || '')}"></label><label class="field"><span>Cidade</span><input name="city" value="${esc(me.city || '')}"></label></div>
        <label class="field"><span>Apresentação</span><textarea name="bio" maxlength="600" placeholder="Ex.: Corretor há 8 anos na região. Atendo compra e aluguel.">${esc(me.bio || '')}</textarea></label>
        <label class="field"><span>Endereço da vitrine</span><input name="slug" required value="${esc(me.slug)}"><small class="hint" id="slugHint">${esc(location.host)}/${esc(me.slug)}</small></label>
        <label class="field"><span>Cor da sua marca</span><input name="color" type="color" value="${esc(me.color)}" style="height:44px;padding:4px"></label>
        <button class="btn primary">Salvar</button>
      </form>
      <button class="btn" id="logoutBtn">Sair da conta</button>
      <p class="small muted">Conta: ${esc(me.email)}</p>`);
    const slug = page.querySelector('[name=slug]');
    slug.addEventListener('input', () => {
      const s = slug.value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+/, '');
      page.querySelector('#slugHint').textContent = `${location.host}/${s}`;
    });
    page.querySelector('#pf').onsubmit = async (e) => {
      e.preventDefault();
      try {
        state.me = await api('PUT', '/api/me', Object.fromEntries(new FormData(e.target)));
        toast('Perfil salvo.');
        profilePage();
      } catch (err) { toast(err.message); }
    };
    page.querySelector('#logoutBtn').onclick = logout;
  }

  // ================= Rotas =================
  async function route() {
    if (!state.token) return authPage(location.hash === '#/cadastro' ? 'register' : 'login');
    try {
      if (!state.me) state.me = await api('GET', '/api/me');
    } catch { return; }
    const path = location.hash.replace(/^#/, '') || '/';
    try {
      // Bolinha de novos interessados na aba.
      if (path !== '/interessados') {
        api('GET', '/api/leads').then(({ leads }) => {
          const seen = Number(load('seen_leads') || 0);
          const n = leads.filter((l) => l.id > seen).length;
          if (n !== state.newLeads) { state.newLeads = n; const tab = app.querySelector('.tabs a[href="#/interessados"]'); if (tab) { tab.querySelector('.dot')?.remove(); if (n) tab.insertAdjacentHTML('beforeend', `<i class="dot">${n}</i>`); } }
        }).catch(() => {});
      }
      let m;
      if (path === '/') await home();
      else if (path === '/imoveis') await listingsPage();
      else if (path === '/imoveis/novo') await listingForm(null);
      else if ((m = path.match(/^\/imoveis\/(\d+)$/))) await listingForm(Number(m[1]));
      else if (path === '/interessados') await leadsPage();
      else if (path === '/perfil') profilePage();
      else { location.hash = '#/'; return; }
      window.scrollTo(0, 0);
    } catch (err) {
      shell('', `<section class="box empty"><div class="icon">⚠️</div><p>${esc(err.message)}</p><a class="btn" href="#/">Voltar ao início</a></section>`);
    }
  }

  window.addEventListener('hashchange', route);
  route();
})();
