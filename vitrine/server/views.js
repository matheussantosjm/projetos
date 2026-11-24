// Páginas públicas renderizadas no servidor (rápidas no celular e com prévia bonita no WhatsApp).

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const brl = (n) => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const safeColor = (c) => (/^#[0-9a-f]{6}$/i.test(c || '') ? c : '#1f5f8b');
const initials = (name) => String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const STATUS_BADGE = { vendido: 'Vendido', alugado: 'Alugado' };

function priceHtml(l) {
  return l.deal === 'aluguel' ? `${brl(l.price)} <small>/mês</small>` : brl(l.price);
}
function priceText(l) {
  return l.deal === 'aluguel' ? `${brl(l.price)}/mês` : brl(l.price);
}
function specsText(l) {
  return [l.area ? `${Number(l.area).toLocaleString('pt-BR')} m²` : '', l.beds ? plural(l.beds, 'quarto', 'quartos') : '', l.parking ? plural(l.parking, 'vaga', 'vagas') : '']
    .filter(Boolean).join(' · ');
}

function placeholder(l) {
  const house = /casa|sobrado|ch[aá]cara/i.test(l.type);
  return `<svg viewBox="0 0 400 300" class="ph" role="img" aria-label="Sem foto">
    <rect width="400" height="300" fill="var(--ph-bg)"/>
    ${house
      ? '<polygon points="120,150 200,90 280,150" fill="var(--ph-fg)"/><rect x="140" y="150" width="120" height="80" fill="var(--ph-fg)"/>'
      : '<rect x="160" y="70" width="80" height="160" rx="4" fill="var(--ph-fg)"/>'}
    <text x="200" y="265" text-anchor="middle" font-size="16" fill="var(--ph-fg)" font-family="sans-serif">Fotos em breve</text></svg>`;
}

function layout({ title, description, image, url, color, body, scripts = '' }) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
${image ? `<meta property="og:image" content="${esc(image)}">` : ''}
${url ? `<meta property="og:url" content="${esc(url)}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="${esc(color)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/vitrine.css">
<style>:root{--brand:${esc(color)}}</style>
</head>
<body>
${body}
<div class="toast" id="toast" hidden></div>
${scripts}
</body>
</html>`;
}

function brokerHeader(broker, { compact = false } = {}) {
  return `<header class="broker ${compact ? 'compact' : ''}">
    <a class="avatar" href="/${esc(broker.slug)}" aria-label="Vitrine de ${esc(broker.name)}">${esc(initials(broker.name))}</a>
    <div class="broker-info">
      <${compact ? 'div class="name"' : 'h1'}>${esc(broker.name)}</${compact ? 'div' : 'h1'}>
      <div class="sub">Corretor(a) de imóveis${broker.creci ? ` · CRECI ${esc(broker.creci)}` : ''}${broker.city ? ` · ${esc(broker.city)}` : ''}</div>
    </div>
  </header>`;
}

function leadDialog(broker, listing) {
  return `<dialog class="lead-dialog" id="leadDialog">
    <form id="leadForm" method="dialog">
      <h2 id="leadTitle">Falar com ${esc(broker.name.split(' ')[0])}</h2>
      <p class="muted" id="leadText">Deixe seu nome e WhatsApp. Em seguida abrimos a conversa com o corretor.</p>
      <label>Seu nome<input name="name" id="leadName" required maxlength="80" autocomplete="name"></label>
      <label>Seu WhatsApp<input name="phone" id="leadPhone" required inputmode="tel" autocomplete="tel" placeholder="(11) 99999-0000"></label>
      <input type="hidden" name="kind" id="leadKind" value="contato">
      <input type="hidden" name="slug" value="${esc(broker.slug)}">
      <input type="hidden" name="listing_id" value="${listing ? listing.id : ''}">
      <p class="error" id="leadError" hidden></p>
      <div class="dialog-actions">
        <button type="button" class="btn" id="leadCancel">Cancelar</button>
        <button type="submit" class="btn primary" id="leadSubmit">Abrir WhatsApp</button>
      </div>
      <p class="tiny muted">Seus dados vão só para este corretor.</p>
    </form>
  </dialog>`;
}

function showcase({ broker, listings, origin }) {
  const color = safeColor(broker.color);
  const active = listings.filter((l) => l.status === 'ativo');
  const bairros = [...new Set(active.map((l) => l.bairro))].sort((a, b) => a.localeCompare(b));
  const hasSale = active.some((l) => l.deal === 'venda');
  const hasRent = active.some((l) => l.deal === 'aluguel');
  const cover = listings.find((l) => l.photos.length);
  const cards = listings.map((l) => `
    <a class="card ${l.status !== 'ativo' ? 'closed' : ''}" href="/${esc(broker.slug)}/${l.id}"
       data-deal="${l.deal}" data-bairro="${esc(l.bairro)}" data-beds="${l.beds}" data-price="${l.price}" data-status="${l.status}">
      <div class="photo">${l.photos.length ? `<img src="${esc(l.photos[0].url)}" alt="${esc(l.type)} no ${esc(l.bairro)}" loading="lazy">` : placeholder(l)}
        <span class="deal">${l.deal === 'venda' ? 'Venda' : 'Aluguel'}</span>
        ${STATUS_BADGE[l.status] ? `<span class="tag sold">${STATUS_BADGE[l.status]}</span>` : ''}
        ${l.photos.length > 1 ? `<span class="count-photos">📷 ${l.photos.length}</span>` : ''}
      </div>
      <div class="card-body">
        <div class="price">${priceHtml(l)}</div>
        <div class="place">${esc(l.type)} · ${esc(l.bairro)}</div>
        <div class="specs">${esc(specsText(l))}</div>
      </div>
    </a>`).join('');

  const body = `
  <main class="wrap">
    ${brokerHeader(broker)}
    ${broker.bio ? `<p class="bio">${esc(broker.bio)}</p>` : ''}
    <div class="actions">
      <button type="button" class="btn primary" data-lead="contato">💬 Falar no WhatsApp</button>
      <button type="button" class="btn" data-share="${esc(`${origin}/${broker.slug}`)}" data-share-title="Imóveis de ${esc(broker.name)}">🔗 Compartilhar</button>
    </div>
    ${active.length > 3 ? `
    <section class="filters" aria-label="Filtros">
      ${hasSale && hasRent ? `<div class="chips" id="dealChips">
        <button type="button" class="chip" data-deal="" aria-pressed="true">Todos</button>
        <button type="button" class="chip" data-deal="venda" aria-pressed="false">Comprar</button>
        <button type="button" class="chip" data-deal="aluguel" aria-pressed="false">Alugar</button>
      </div>` : ''}
      <div class="filter-row">
        ${bairros.length > 1 ? `<select id="fBairro" aria-label="Bairro"><option value="">Bairro: todos</option>${bairros.map((b) => `<option>${esc(b)}</option>`).join('')}</select>` : ''}
        <select id="fBeds" aria-label="Quartos"><option value="0">Quartos: todos</option><option value="1">1+ quarto</option><option value="2">2+ quartos</option><option value="3">3+ quartos</option><option value="4">4+ quartos</option></select>
      </div>
    </section>` : ''}
    <p class="count" id="count">${plural(active.length, 'imóvel disponível', 'imóveis disponíveis')}</p>
    <section class="grid" id="grid">${cards || '<p class="empty">Nenhum imóvel publicado ainda.</p>'}</section>
    <p class="empty" id="noMatch" hidden>Nenhum imóvel com esses filtros.</p>
    <footer class="foot">Vitrine de ${esc(broker.name)}</footer>
  </main>
  ${leadDialog(broker, null)}`;

  return layout({
    title: `Imóveis de ${broker.name}`,
    description: `${plural(active.length, 'imóvel', 'imóveis')} disponíveis${broker.city ? ` em ${broker.city}` : ''}. Fale direto com ${broker.name} pelo WhatsApp.`,
    image: cover ? origin + cover.photos[0].url : null,
    url: `${origin}/${broker.slug}`,
    color,
    body,
    scripts: '<script src="/assets/vitrine.js" defer></script>',
  });
}

function listingPage({ broker, listing: l, origin }) {
  const color = safeColor(broker.color);
  const url = `${origin}/${broker.slug}/${l.id}`;
  const closed = l.status !== 'ativo';
  const slides = l.photos.length
    ? l.photos.map((p, i) => `<div class="slide"><img src="${esc(p.url)}" alt="Foto ${i + 1} de ${l.photos.length}" ${i ? 'loading="lazy"' : ''}></div>`).join('')
    : `<div class="slide">${placeholder(l)}</div>`;
  const facts = [
    l.area ? [Number(l.area).toLocaleString('pt-BR'), 'm²'] : null,
    [l.beds, l.suites ? `quartos · ${plural(l.suites, 'suíte', 'suítes')}` : (l.beds === 1 ? 'quarto' : 'quartos')],
    [l.baths, l.baths === 1 ? 'banheiro' : 'banheiros'],
    [l.parking, l.parking === 1 ? 'vaga' : 'vagas'],
  ].filter(Boolean);
  const monthly = l.price + l.condo_fee + l.iptu;

  const body = `
  <main class="wrap detail">
    <a class="back" href="/${esc(broker.slug)}">← Todos os imóveis</a>
    <div class="gallery">
      <div class="slides" id="slides">${slides}</div>
      ${l.photos.length > 1 ? `<button type="button" class="gal-btn prev" id="galPrev" aria-label="Foto anterior">‹</button>
      <button type="button" class="gal-btn next" id="galNext" aria-label="Próxima foto">›</button>
      <span class="gal-count" id="galCount">1 / ${l.photos.length}</span>` : ''}
      ${STATUS_BADGE[l.status] ? `<span class="tag sold">${STATUS_BADGE[l.status]}</span>` : ''}
    </div>
    <section class="info">
      <div>
        <div class="price big">${priceHtml(l)}</div>
        <h1>${esc(l.type)} no ${esc(l.bairro)}${l.city ? `, ${esc(l.city)}` : ''}</h1>
        <span class="pill">${l.deal === 'venda' ? 'Venda' : 'Aluguel'}</span>
      </div>
      <div class="facts">${facts.map(([v, t]) => `<div class="fact"><b>${esc(v)}</b><span>${esc(t)}</span></div>`).join('')}</div>
      ${l.description ? `<p class="desc">${esc(l.description)}</p>` : ''}
      ${l.features.length ? `<div class="feat">${l.features.map((f) => `<span>${esc(f)}</span>`).join('')}</div>` : ''}
      <div class="costs">
        <div><span>${l.deal === 'aluguel' ? 'Aluguel' : 'Valor de venda'}</span><b>${brl(l.price)}</b></div>
        <div><span>Condomínio</span><span>${l.condo_fee ? `${brl(l.condo_fee)}/mês` : 'Não tem'}</span></div>
        <div><span>IPTU</span><span>${l.iptu ? `${brl(l.iptu)}/mês` : 'Não informado'}</span></div>
        ${l.deal === 'aluguel' ? `<div class="sum"><b>Total por mês</b><b>${brl(monthly)}</b></div>` : ''}
      </div>
      ${brokerHeader(broker, { compact: true })}
    </section>
  </main>
  <div class="cta">
    ${closed
      ? `<a class="btn primary" href="/${esc(broker.slug)}">Ver imóveis disponíveis</a>`
      : `<button type="button" class="btn primary" data-lead="contato">💬 Tenho interesse</button>
         <button type="button" class="btn" data-lead="visita">📅 Quero visitar</button>`}
    <button type="button" class="btn icon" data-share="${esc(url)}" data-share-title="${esc(`${l.type} no ${l.bairro} · ${priceText(l)}`)}" aria-label="Compartilhar">🔗</button>
  </div>
  ${leadDialog(broker, l)}`;

  return layout({
    title: `${l.type} no ${l.bairro} · ${priceText(l)}`,
    description: [specsText(l), l.description].filter(Boolean).join('. ').slice(0, 200),
    image: l.photos.length ? origin + l.photos[0].url : null,
    url,
    color,
    body,
    scripts: '<script src="/assets/vitrine.js" defer></script>',
  });
}

function notFound(broker) {
  return layout({
    title: 'Página não encontrada',
    description: 'Este endereço não existe ou o imóvel saiu do ar.',
    color: safeColor(broker?.color),
    body: `<main class="wrap notfound"><h1>Não encontramos esta página</h1><p class="muted">O imóvel pode ter saído do ar ou o link está incompleto.</p>
      ${broker ? `<a class="btn primary" href="/${esc(broker.slug)}">Ver imóveis de ${esc(broker.name)}</a>` : ''}</main>`,
  });
}

module.exports = { showcase, listingPage, notFound, esc };
