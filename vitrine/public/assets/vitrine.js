(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);

  function toast(msg) {
    const t = $('toast');
    if (!t) return;
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast.t);
    toast.t = setTimeout(() => { t.hidden = true; }, 2600);
  }
  const store = {
    get(k) { try { return localStorage.getItem(k) || ''; } catch { return ''; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
  };

  // ---------- Filtros da vitrine ----------
  const grid = $('grid');
  if (grid) {
    const f = { deal: '', bairro: '', beds: 0 };
    const apply = () => {
      let n = 0;
      grid.querySelectorAll('.card').forEach((c) => {
        const ok = (!f.deal || c.dataset.deal === f.deal) && (!f.bairro || c.dataset.bairro === f.bairro) && Number(c.dataset.beds) >= f.beds;
        c.hidden = !ok;
        if (ok && c.dataset.status === 'ativo') n++;
      });
      $('count').textContent = `${n} ${n === 1 ? 'imóvel disponível' : 'imóveis disponíveis'}`;
      $('noMatch').hidden = n > 0 || !grid.querySelector('.card');
    };
    $('dealChips')?.querySelectorAll('[data-deal]').forEach((b) => b.addEventListener('click', () => {
      f.deal = b.dataset.deal;
      $('dealChips').querySelectorAll('[data-deal]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      apply();
    }));
    $('fBairro')?.addEventListener('change', (e) => { f.bairro = e.target.value; apply(); });
    $('fBeds')?.addEventListener('change', (e) => { f.beds = Number(e.target.value); apply(); });
  }

  // ---------- Galeria ----------
  const slides = $('slides');
  if (slides && $('galNext')) {
    const total = slides.children.length;
    const current = () => Math.round(slides.scrollLeft / slides.clientWidth);
    const go = (i) => slides.scrollTo({ left: ((i + total) % total) * slides.clientWidth, behavior: 'smooth' });
    $('galPrev').addEventListener('click', () => go(current() - 1));
    $('galNext').addEventListener('click', () => go(current() + 1));
    slides.addEventListener('scroll', () => { $('galCount').textContent = `${current() + 1} / ${total}`; }, { passive: true });
  }

  // ---------- Compartilhar ----------
  document.querySelectorAll('[data-share]').forEach((b) => b.addEventListener('click', async () => {
    const url = b.dataset.share;
    const title = b.dataset.shareTitle || document.title;
    if (navigator.share) {
      try { await navigator.share({ title, url }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    try { await navigator.clipboard.writeText(url); toast('Link copiado.'); } catch { toast(url); }
  }));

  // ---------- Pedido de contato ----------
  const dialog = $('leadDialog');
  if (dialog) {
    const form = $('leadForm');
    const err = $('leadError');
    const submit = $('leadSubmit');
    document.querySelectorAll('[data-lead]').forEach((b) => b.addEventListener('click', () => {
      const visit = b.dataset.lead === 'visita';
      $('leadKind').value = visit ? 'visita' : 'contato';
      $('leadTitle').textContent = visit ? 'Agendar uma visita' : 'Falar com o corretor';
      $('leadName').value = $('leadName').value || store.get('lead_name');
      $('leadPhone').value = $('leadPhone').value || store.get('lead_phone');
      err.hidden = true;
      if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
    }));
    $('leadCancel').addEventListener('click', () => dialog.close ? dialog.close() : dialog.removeAttribute('open'));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      err.hidden = true;
      submit.disabled = true;
      const data = Object.fromEntries(new FormData(form));
      try {
        const res = await fetch('/api/public/leads', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) });
        const out = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(out.error || 'Não foi possível enviar. Tente de novo.');
        store.set('lead_name', data.name);
        store.set('lead_phone', data.phone);
        window.location.href = out.whatsapp_url;
      } catch (ex) {
        err.textContent = ex.message;
        err.hidden = false;
      } finally {
        submit.disabled = false;
      }
    });
  }
})();
