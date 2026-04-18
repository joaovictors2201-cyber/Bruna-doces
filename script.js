(async function () {
  const navInner  = document.getElementById('categoryNavInner');
  const menu      = document.getElementById('menu');
  const loading   = document.getElementById('loading');
  const errorBox  = document.getElementById('error');
  const errorMsg  = document.getElementById('errorMsg');

  // Lightbox
  const lightbox     = document.getElementById('lightbox');
  const lightboxImg  = document.getElementById('lightboxImg');
  const lightboxName = document.getElementById('lightboxName');
  const lightboxDesc = document.getElementById('lightboxDesc');

  document.getElementById('lightboxClose').addEventListener('click', fecharLightbox);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) fecharLightbox(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') fecharLightbox(); });

  function abrirLightbox(src, nome, desc) {
    lightboxImg.src       = src;
    lightboxImg.alt       = nome;
    lightboxName.textContent = nome;
    lightboxDesc.textContent = desc;
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function fecharLightbox() {
    lightbox.hidden = true;
    lightboxImg.src = '';
    document.body.style.overflow = '';
  }

  // Footer
  const phone = CONFIG.WHATSAPP.replace(/\D/g, '');
  const wpEl  = document.getElementById('footerWhatsapp');
  wpEl.href   = `https://wa.me/55${phone}`;
  document.getElementById('footerWhatsappText').textContent = CONFIG.WHATSAPP;

  const igEl  = document.getElementById('footerInstagram');
  igEl.href   = `https://instagram.com/${CONFIG.INSTAGRAM.replace('@', '')}`;
  document.getElementById('footerInstagramText').textContent = CONFIG.INSTAGRAM;

  document.getElementById('footerAno').textContent = new Date().getFullYear();

  // Avisa se a planilha ainda não foi configurada
  if (CONFIG.SHEET_CSV_URL === 'COLE_AQUI_A_URL_DO_CSV') {
    showError('O cardápio ainda não foi configurado.\nConsulte o arquivo COMO_USAR.md para as instruções de configuração.');
    return;
  }

  try {
    const url = CONFIG.SHEET_CSV_URL + '&t=' + Date.now();
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Erro ao buscar planilha (${res.status})`);
    const text = await res.text();

    const rows    = parseCSV(text);
    const visiveis = rows.filter(r => isVisivel(r.visivel));

    if (visiveis.length === 0) {
      showError('Nenhum produto disponível no momento. Volte em breve!');
      return;
    }

    // Agrupar por categoria, preservando a ordem de aparição
    const categorias = new Map();
    for (const p of visiveis) {
      const cat = (p.categoria || 'Outros').trim();
      if (!categorias.has(cat)) categorias.set(cat, []);
      categorias.get(cat).push(p);
    }

    loading.hidden = true;

    // Montar tabs de navegação
    navInner.appendChild(criarTab('Todos', true));
    for (const cat of categorias.keys()) {
      navInner.appendChild(criarTab(cat, false));
    }

    // Montar seções de produtos
    for (const [cat, produtos] of categorias) {
      menu.appendChild(criarSecao(cat, produtos));
    }

    configurarTabs();

  } catch (e) {
    console.error(e);
    showError('Não foi possível carregar o cardápio.\nVerifique sua conexão e tente novamente.');
  }

  // ── Helpers de UI ────────────────────────────────

  function showError(msg) {
    loading.hidden  = true;
    errorBox.hidden = false;
    errorMsg.textContent = msg;
  }

  function criarTab(label, ativo) {
    const btn = document.createElement('button');
    btn.className   = 'category-tab' + (ativo ? ' category-tab--active' : '');
    btn.textContent = label;
    btn.dataset.tab = label;
    return btn;
  }

  function configurarTabs() {
    const tabs     = navInner.querySelectorAll('.category-tab');
    const secoes   = menu.querySelectorAll('.category-section');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('category-tab--active'));
        tab.classList.add('category-tab--active');

        const selecionada = tab.dataset.tab;
        secoes.forEach(s => {
          s.hidden = selecionada !== 'Todos' && s.dataset.categoria !== selecionada;
        });

        tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      });
    });
  }

  function criarSecao(cat, produtos) {
    const section = document.createElement('section');
    section.className        = 'category-section';
    section.dataset.categoria = cat;

    const h2 = document.createElement('h2');
    h2.className   = 'category-section__title';
    h2.textContent = cat;
    section.appendChild(h2);

    const grid = document.createElement('div');
    grid.className = 'products-grid';
    produtos.forEach(p => grid.appendChild(criarCard(p)));
    section.appendChild(grid);

    return section;
  }

  function criarCard(prod) {
    const card = document.createElement('article');
    card.className = 'product-card';

    // Imagem
    const imgWrap = document.createElement('div');
    imgWrap.className = 'product-card__img-wrap';

    const url = (prod.imagem_url || '').trim();
    if (url) {
      const img    = document.createElement('img');
      img.src      = url;
      img.alt      = prod.nome || '';
      img.className = 'product-card__img';
      img.loading  = 'lazy';
      img.onerror  = () => { imgWrap.classList.add('product-card__img-wrap--placeholder'); img.remove(); };
      imgWrap.appendChild(img);

      imgWrap.style.cursor = 'zoom-in';
      imgWrap.addEventListener('click', () => abrirLightbox(url, prod.nome || '', prod.descricao || ''));
    } else {
      imgWrap.classList.add('product-card__img-wrap--placeholder');
      imgWrap.innerHTML = `
        <svg class="product-card__placeholder-svg" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M21 45 L27 67 Q40 72 53 67 L59 45 Z" fill="rgba(251,249,235,0.82)"/>
          <line x1="33" y1="46" x2="30" y2="66" stroke="rgba(58,112,172,0.28)" stroke-width="1"/>
          <line x1="40" y1="46" x2="40" y2="69" stroke="rgba(58,112,172,0.28)" stroke-width="1"/>
          <line x1="47" y1="46" x2="50" y2="66" stroke="rgba(58,112,172,0.28)" stroke-width="1"/>
          <ellipse cx="40" cy="44" rx="19" ry="6.5" fill="rgba(251,249,235,0.92)"/>
          <path d="M21 44 Q21 20 40 16 Q59 20 59 44" fill="rgba(251,249,235,0.92)"/>
          <path d="M33 29 Q37 21 40 24 Q43 21 47 29" fill="none" stroke="rgba(58,112,172,0.32)" stroke-width="1.8" stroke-linecap="round"/>
          <circle cx="40" cy="15" r="4.5" fill="rgba(210,75,75,0.75)"/>
          <path d="M40 11 Q45 5 47 8" fill="none" stroke="rgba(55,110,55,0.65)" stroke-width="1.4" stroke-linecap="round"/>
        </svg>`;
    }

    // Corpo
    const body = document.createElement('div');
    body.className = 'product-card__body';

    const nome = document.createElement('h3');
    nome.className   = 'product-card__name';
    nome.textContent = (prod.nome || '').trim();
    body.appendChild(nome);

    const desc = (prod.descricao || '').trim();
    if (desc) {
      const p = document.createElement('p');
      p.className   = 'product-card__desc';
      p.textContent = desc;
      body.appendChild(p);
    }

    const precoRaw = (prod.preco || '').trim().replace(',', '.');
    if (precoRaw) {
      const val = parseFloat(precoRaw);
      if (!isNaN(val)) {
        const span = document.createElement('span');
        span.className   = 'product-card__price';
        span.textContent = 'R$ ' + val.toFixed(2).replace('.', ',');
        body.appendChild(span);
      }
    }

    // Botão WhatsApp
    const phone = CONFIG.WHATSAPP.replace(/\D/g, '');
    const msg   = encodeURIComponent(`Olá! Gostaria de pedir: ${(prod.nome || '').trim()}`);
    const btn   = document.createElement('a');
    btn.className = 'product-card__order';
    btn.href      = `https://wa.me/55${phone}?text=${msg}`;
    btn.target    = '_blank';
    btn.rel       = 'noopener';
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.122 1.528 5.858L.057 23.27a.75.75 0 0 0 .916.919l5.487-1.462A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.724 9.724 0 0 1-4.947-1.35l-.355-.21-3.656.974.988-3.585-.232-.369A9.724 9.724 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/></svg> Fazer pedido`;
    body.appendChild(btn);

    card.appendChild(imgWrap);
    card.appendChild(body);
    return card;
  }

  // ── CSV Parser ───────────────────────────────────

  function parseCSV(text) {
    const linhas = text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trim()
      .split('\n');

    if (linhas.length < 2) return [];

    const cabecalhos = parseRow(linhas[0]).map(h => h.trim().toLowerCase());

    return linhas.slice(1)
      .map(linha => {
        const vals = parseRow(linha);
        return Object.fromEntries(
          cabecalhos.map((h, i) => [h, (vals[i] || '').trim()])
        );
      })
      .filter(row => row[cabecalhos[0]]); // ignora linhas completamente vazias
  }

  function parseRow(row) {
    const result = [];
    let cur   = '';
    let inQ   = false;

    for (let i = 0; i < row.length; i++) {
      const c = row[i];
      if (c === '"') {
        if (inQ && row[i + 1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (c === ',' && !inQ) {
        result.push(cur); cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur);
    return result;
  }

  function isVisivel(val) {
    if (!val || val.trim() === '') return true; // sem coluna = visível por padrão
    const v = val.trim().toUpperCase();
    return v === 'SIM' || v === 'TRUE' || v === '1' || v === 'S';
  }
})();
