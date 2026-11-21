/* ==========================================================================
   PORTAS LÓGICAS — motor do jogo (50 fases)
   Depende de portas-fases.js (que define a lista FASES).

   Como o jogo funciona:
   - Cada fase é um circuito com LACUNAS nos fios e um estoque de portas.
   - O jogador arrasta portas do estoque para as lacunas.
   - INICIAR simula o circuito: se TODAS as lâmpadas acenderem, a fase é vencida.
   ========================================================================== */
(() => {
  'use strict'; // modo estrito: o navegador avisa de erros bobos (ex.: variável sem declarar)

  /* ---------- 1. CONSTANTES ---------- */
  const TIPOS = ['AND', 'OR', 'NOT', 'XOR', 'NAND', 'NOR'];
  const NOME_PT = { AND: 'E', OR: 'OU', NOT: 'NÃO', XOR: 'OU exclusivo', NAND: 'NÃO-E', NOR: 'NÃO-OU' };

  // Lógica de cada porta (entradas e saídas são 0 ou 1).
  // & = E bit a bit, | = OU bit a bit, ^ = OU exclusivo bit a bit; ^1 inverte o bit.
  const LOGICA = {
    AND: (a, b) => a & b,
    OR: (a, b) => a | b,
    NOT: (a) => a ^ 1,
    XOR: (a, b) => a ^ b,
    NAND: (a, b) => (a & b) ^ 1,
    NOR: (a, b) => (a | b) ^ 1
  };

  const TOTAL_FASES = FASES.length;
  const CHAVE_SAVE = 'portas-logicas-v1';
  const TEMPO_PASSO = 380; // ms entre um "passo" e outro da simulação

  // Medidas do desenho (em unidades do SVG)
  const SW = 84, SH = 56;                    // largura e altura de uma lacuna
  const COLW = 150, ROWH = 68;               // distância entre colunas e linhas
  const CHAVE_W = 56, CHAVE_H = 34, LAMP_R = 22;
  const ESC = SW / 72;                       // escala do desenho da porta (72x40) para caber na lacuna
  const OFFY = (SH - 40 * ESC) / 2;          // centraliza a porta na vertical dentro da lacuna
  const PORTA_Y = { 1: [20 * ESC + OFFY], 2: [12 * ESC + OFFY, 28 * ESC + OFFY] }; // altura dos "pinos" de entrada
  const SAIDA_Y = 20 * ESC + OFFY;

  const $ = (id) => document.getElementById(id);

  /* ---------- 2. DESENHO DAS PORTAS (SVG, símbolos técnicos) ---------- */
  // Cada porta é desenhada numa caixa de 72 x 40.
  function forma(tipo) {
    const E_CORPO = 'M10 4H30A16 16 0 0 1 30 36H10Z';                                   // corpo da AND/NAND
    const OU_CORPO = 'M8 4C28 4 44 10 56 20C44 30 28 36 8 36C16 28 16 12 8 4Z';         // corpo da OR/NOR/XOR
    const fio = (d) => '<path class="fio-gate" d="' + d + '"/>';
    const corpo = (d) => '<path class="corpo" d="' + d + '"/>';
    const bolha = (cx) => '<circle class="corpo" cx="' + cx + '" cy="20" r="4"/>';       // bolinha de inversão
    switch (tipo) {
      case 'AND':  return fio('M0 12H10M0 28H10M46 20H72') + corpo(E_CORPO);
      case 'NAND': return fio('M0 12H10M0 28H10M54 20H72') + corpo(E_CORPO) + bolha(50);
      case 'OR':   return fio('M0 12H13M0 28H13M56 20H72') + corpo(OU_CORPO);
      case 'NOR':  return fio('M0 12H13M0 28H13M64 20H72') + corpo(OU_CORPO) + bolha(60);
      case 'XOR':  return fio('M0 12H13M0 28H13M56 20H72') + corpo(OU_CORPO) + '<path class="fio-gate" d="M2 4C10 12 10 28 2 36"/>';
      case 'NOT':  return fio('M0 20H12M52 20H72') + corpo('M12 5L44 20L12 35Z') + bolha(48);
    }
    return '';
  }
  const svgPorta = (tipo) => '<svg class="simbolo" viewBox="0 0 72 40" aria-hidden="true">' + forma(tipo) + '</svg>';

  /* ---------- 3. ESTADO ---------- */
  const E = {
    fase: 1,
    def: null,          // dados da fase atual (de FASES)
    arvores: [],        // um circuito (árvore) por lâmpada
    slots: [],          // todas as lacunas (lista plana)
    layout: null,       // posições calculadas
    colocadas: {},      // { idDaLacuna: 'AND' }
    selecionada: null,  // tipo escolhido por clique
    tentativas: 0,
    simulando: false,
    venceu: false,
    valores: {},        // saída de cada lacuna na simulação
    reveladas: new Set(), // lacunas cuja saída já "apareceu" na animação
    lampOn: null,       // estado final das lâmpadas (null = ainda não simulou)
    timers: [],
    save: { concluidas: {}, atual: 1 }
  };

  /* ---------- 4. SAVE (localStorage) ---------- */
  function carregarSave() {
    try {
      const s = JSON.parse(localStorage.getItem(CHAVE_SAVE));
      if (s && s.concluidas) { E.save = s; }
    } catch (e) { /* sem save: tudo bem */ }
  }
  function gravarSave() {
    try { localStorage.setItem(CHAVE_SAVE, JSON.stringify(E.save)); } catch (e) { /* ignora */ }
  }
  const concluidasQtd = () => Object.keys(E.save.concluidas).length;
  const liberada = (n) => n === 1 || !!E.save.concluidas[n - 1];

  /* ---------- 5. PREPARAR A FASE ---------- */
  // Converte a estrutura de FASES em nós com id, profundidade e altura.
  // folha  = chave de entrada (texto 'A', 'B'...);  array = lacuna.
  function preparar(def) {
    let seq = 0;
    E.slots = [];
    const montar = (no, prof) => {
      if (typeof no === 'string') { return { folha: true, nome: no }; }
      const n = { id: seq++, ar: no.length, prof, ch: [], altura: 0 };
      E.slots.push(n);
      n.ch = no.map((c) => montar(c, prof + 1));
      n.altura = 1 + Math.max(...n.ch.map((c) => (c.folha ? 0 : c.altura)));
      return n;
    };
    E.arvores = def.lampadas.map((t) => montar(t, 0));
    E.layout = calcularLayout();
  }

  // Calcula a posição de tudo no desenho.
  function calcularLayout() {
    const D = Math.max(...E.slots.map((s) => s.prof));        // coluna mais profunda
    const X0 = 16 + CHAVE_W + 90;                              // x da primeira coluna de lacunas
    const padTop = 40;
    let linha = 0;
    const fios = [];

    // y das lacunas: média dos filhos; cada "folha" (entrada) ocupa uma linha nova
    const posY = (no) => {
      if (no.folha) { const y = padTop + linha * ROWH; linha++; return y; }
      const ys = no.ch.map(posY);
      no.cy = ys.reduce((a, b) => a + b, 0) / ys.length;
      no.x = X0 + (D - no.prof) * COLW;
      no.y = no.cy - SH / 2;
      return no.cy;
    };
    E.arvores.forEach((raiz) => { posY(raiz); linha += 0.6; }); // espaço entre circuitos

    const altura = Math.max(padTop * 2 + (linha - 0.6) * ROWH - ROWH * 0.4, ...E.slots.map((s) => s.y + SH + 14));

    // chaves de entrada (coluna da esquerda)
    const nomes = Object.keys(E.def.entradas);
    const chaves = nomes.map((nome, i) => ({ nome, x: 16, y: ((i + 0.5) * altura) / nomes.length - CHAVE_H / 2 }));
    const chaveDe = (nome) => chaves.find((c) => c.nome === nome);

    // fios
    E.slots.forEach((s) => {
      s.ch.forEach((c, j) => {
        const x2 = s.x, y2 = s.y + PORTA_Y[s.ar][j];
        if (c.folha) {
          const ch = chaveDe(c.nome);
          fios.push({ tipo: 'entrada', nome: c.nome, x1: ch.x + CHAVE_W, y1: ch.y + CHAVE_H / 2, x2, y2 });
        } else {
          fios.push({ tipo: 'slot', de: c.id, x1: c.x + SW, y1: c.y + SAIDA_Y, x2, y2 });
        }
      });
    });

    // lâmpadas (coluna da direita)
    const lampX = X0 + D * COLW + SW + 90;
    const lampadas = E.arvores.map((raiz, i) => {
      const l = { i, x: lampX, y: raiz.cy };
      fios.push({ tipo: 'lampada', de: raiz.id, x1: raiz.x + SW, y1: raiz.y + SAIDA_Y, x2: l.x - LAMP_R, y2: l.y });
      return l;
    });

    return { W: lampX + LAMP_R + 40, H: altura, chaves, lampadas, fios };
  }

  /* ---------- 6. SIMULAÇÃO ---------- */
  const ocupadas = () => E.slots.every((s) => E.colocadas[s.id]);

  // Calcula a saída de cada lacuna e de cada lâmpada (exige todas as lacunas preenchidas)
  function calcular() {
    const v = {};
    const ev = (n) => {
      if (n.folha) { return E.def.entradas[n.nome]; }
      const r = LOGICA[E.colocadas[n.id]](...n.ch.map(ev)); // ...lista "espalha" os itens como argumentos
      v[n.id] = r;
      return r;
    };
    const lamps = E.arvores.map(ev);
    return { v, lamps };
  }

  function limparSimulacao() {
    E.timers.forEach(clearTimeout);
    E.timers = [];
    E.simulando = false;
    E.valores = {};
    E.reveladas = new Set();
    E.lampOn = null;
  }

  function iniciar() {
    if (E.simulando || E.venceu) { return; }
    const vazias = E.slots.filter((s) => !E.colocadas[s.id]);
    if (vazias.length) {
      msg('Preencha todas as lacunas antes de iniciar (faltam ' + vazias.length + ').', 'erro');
      vazias.forEach((s) => sacudir(s.id));
      return;
    }
    E.tentativas++;
    atualizarHud();
    const r = calcular();
    E.valores = r.v;
    E.reveladas = new Set();
    E.lampOn = null;
    E.simulando = true;
    atualizarBotoes();
    msg('Simulando o circuito...', 'info');
    desenharCircuito();

    // anima: a cada passo, as lacunas de uma "altura" mostram sua saída (verde = 1, cinza = 0)
    const maxH = Math.max(...E.slots.map((s) => s.altura));
    for (let h = 1; h <= maxH; h++) {
      E.timers.push(setTimeout(() => {
        E.slots.filter((s) => s.altura === h).forEach((s) => E.reveladas.add(s.id));
        desenharCircuito();
      }, h * TEMPO_PASSO));
    }
    E.timers.push(setTimeout(() => {
      E.lampOn = r.lamps;
      E.simulando = false;
      desenharCircuito();
      terminar(r.lamps);
    }, (maxH + 1) * TEMPO_PASSO));
  }

  function terminar(lamps) {
    const acesas = lamps.filter((x) => x === 1).length;
    if (acesas === lamps.length) {
      E.venceu = true;
      const estrelas = E.tentativas === 1 ? 3 : E.tentativas <= 3 ? 2 : 1;
      const antes = E.save.concluidas[E.fase] || 0;
      E.save.concluidas[E.fase] = Math.max(antes, estrelas); // guarda a melhor nota
      E.save.atual = Math.min(TOTAL_FASES, Math.max(E.save.atual, E.fase + 1));
      gravarSave();
      msg('★'.repeat(estrelas) + '☆'.repeat(3 - estrelas) + '  Circuito energizado! Todas as lâmpadas acenderam.', 'ok');
      atualizarHud();
    } else {
      const total = lamps.length;
      msg(acesas + ' de ' + total + (total === 1 ? ' lâmpada acesa' : ' lâmpadas acesas') + '. Troque as portas e tente de novo.', 'erro');
    }
    atualizarBotoes();
  }

  function resetar() {
    limparSimulacao();
    E.colocadas = {};
    E.selecionada = null;
    E.venceu = false;
    msg('Portas devolvidas ao estoque. Monte outra combinação!', 'info');
    desenharTudo();
  }

  function proxima() {
    if (!E.venceu) { return; }
    if (E.fase >= TOTAL_FASES) { abrirFim(); return; }
    carregarFase(E.fase + 1);
  }

  /* ---------- 7. REGRAS DO ESTOQUE E DAS LACUNAS ---------- */
  const usados = (tipo, ignorar) => E.slots.filter((s) => s.id !== ignorar && E.colocadas[s.id] === tipo).length;
  const disponivel = (tipo, ignorar) => E.def.estoque[tipo] - usados(tipo, ignorar);

  // Lacuna de 1 entrada só aceita NOT; lacuna de 2 entradas aceita as demais.
  const cabe = (slot, tipo) => (slot.ar === 1 ? tipo === 'NOT' : tipo !== 'NOT');
  const slotPorId = (id) => E.slots.find((s) => s.id === id);

  function aplicar(slotId, tipo, de) {
    const slot = slotPorId(slotId);
    if (!cabe(slot, tipo)) {
      msg(slot.ar === 1 ? 'Lacunas de 1 entrada (verdes) só aceitam a porta NOT.' : 'A porta NOT só encaixa em lacunas de 1 entrada (verdes).', 'erro');
      sacudir(slotId);
      return false;
    }
    if (de === slotId) { return false; }
    const ocupante = E.colocadas[slotId];
    if (de === null || de === undefined) {
      if (disponivel(tipo, slotId) <= 0) { msg('Você já usou todas as portas ' + tipo + ' desta fase.', 'erro'); return false; }
      E.colocadas[slotId] = tipo;
    } else {
      E.colocadas[slotId] = tipo;                 // mover: troca de lugar com quem estava na lacuna
      if (ocupante) { E.colocadas[de] = ocupante; } else { delete E.colocadas[de]; }
    }
    depoisDeEditar();
    return true;
  }

  function retirar(slotId) {
    delete E.colocadas[slotId];
    depoisDeEditar();
  }

  function depoisDeEditar() {
    limparSimulacao();
    E.venceu = false;
    if (E.selecionada && disponivel(E.selecionada) <= 0) { E.selecionada = null; }
    const n = Object.keys(E.colocadas).length;
    msg(n === E.slots.length ? 'Todas as lacunas preenchidas. Clique em INICIAR!' : 'Portas no circuito: ' + n + ' de ' + E.slots.length + '.', 'info');
    desenharTudo();
  }

  /* ---------- 8. DESENHO DO CIRCUITO (SVG) ---------- */
  function caminho(f) {
    const dx = Math.max(40, (f.x2 - f.x1) * 0.5);
    return 'M' + f.x1 + ' ' + f.y1 + ' C' + (f.x1 + dx) + ' ' + f.y1 + ' ' + (f.x2 - dx) + ' ' + f.y2 + ' ' + f.x2 + ' ' + f.y2;
  }

  function classeFio(f) {
    let v = null;
    if (f.tipo === 'entrada') { v = E.def.entradas[f.nome]; }
    else if (E.reveladas.has(f.de)) { v = E.valores[f.de]; }
    return v === null ? '' : v === 1 ? 'v1' : 'v0';
  }

  function desenharCircuito() {
    const L = E.layout;
    const svg = $('circuito');
    svg.setAttribute('viewBox', '0 0 ' + Math.ceil(L.W) + ' ' + Math.ceil(L.H));
    svg.style.minWidth = Math.round(L.W * 0.62) + 'px';
    let s = '';

    // 1) fios (por baixo de tudo)
    L.fios.forEach((f) => { s += '<path class="fio ' + classeFio(f) + '" d="' + caminho(f) + '"/>'; });

    // 2) chaves de entrada
    L.chaves.forEach((c) => {
      const on = E.def.entradas[c.nome] === 1;
      s += '<g class="chave ' + (on ? 'on' : 'off') + '" transform="translate(' + c.x + ' ' + c.y + ')">' +
        '<rect width="' + CHAVE_W + '" height="' + CHAVE_H + '" rx="9"/>' +
        '<text class="chave-nome" x="14" y="22">' + c.nome + '</text>' +
        '<text class="chave-valor" x="' + (CHAVE_W - 12) + '" y="22" text-anchor="middle">' + (on ? '1' : '0') + '</text></g>';
    });

    // 3) lacunas / portas
    E.slots.forEach((sl) => {
      const tipo = E.colocadas[sl.id];
      const ativo = tipo && E.reveladas.has(sl.id) && E.valores[sl.id] === 1;
      let cls = 'slot ar' + sl.ar + (tipo ? ' preenchido' : ' vazio') + (ativo ? ' ativo' : '');
      s += '<g class="' + cls + '" data-slot="' + sl.id + '" transform="translate(' + sl.x + ' ' + sl.y + ')">' +
        '<title>' + (sl.ar === 1 ? 'Lacuna de 1 entrada (aceita NOT)' : 'Lacuna de 2 entradas') + '</title>' +
        '<rect class="slot-caixa" width="' + SW + '" height="' + SH + '" rx="10"/>';
      if (tipo) {
        s += '<g class="gate" transform="translate(0 ' + OFFY + ') scale(' + ESC + ')">' + forma(tipo) + '</g>' +
          '<text class="gate-nome" x="' + (SW / 2) + '" y="' + (SH + 12) + '" text-anchor="middle">' + tipo + '</text>';
      } else {
        PORTA_Y[sl.ar].forEach((py) => { s += '<circle class="pino" cx="0" cy="' + py + '" r="4"/>'; });
        s += '<circle class="pino" cx="' + SW + '" cy="' + SAIDA_Y + '" r="4"/>' +
          '<text class="slot-interroga" x="' + (SW / 2) + '" y="' + (SH / 2 + 8) + '" text-anchor="middle">?</text>';
      }
      s += '</g>';
    });

    // 4) lâmpadas
    L.lampadas.forEach((l) => {
      const estado = E.lampOn === null ? 'apagada' : E.lampOn[l.i] === 1 ? 'acesa' : 'falhou';
      s += '<g class="lampada ' + estado + '" transform="translate(' + l.x + ' ' + l.y + ')">' +
        '<circle class="halo" r="' + (LAMP_R + 10) + '"/>' +
        '<circle class="bulbo" r="' + LAMP_R + '"/>' +
        '<path class="filamento" d="M-9 4 L-4 -6 L0 4 L4 -6 L9 4"/>' +
        '<text class="lamp-nome" y="' + (LAMP_R + 18) + '" text-anchor="middle">LÂMPADA' + (L.lampadas.length > 1 ? ' ' + (l.i + 1) : '') + '</text></g>';
    });

    svg.innerHTML = s; // trocar innerHTML redesenha o SVG inteiro (é leve)
  }

  /* ---------- 9. INVENTÁRIO ---------- */
  function desenharInventario() {
    let h = '';
    TIPOS.forEach((t) => {
      const total = E.def.estoque[t];
      const resta = disponivel(t);
      const zerado = resta <= 0;
      h += '<div class="gate-card' + (zerado ? ' zerado' : '') + (E.selecionada === t ? ' sel' : '') + '" data-tipo="' + t + '">' +
        '<span class="gate-qtd">' + (total === 0 ? '—' : '×' + resta) + '</span>' +
        svgPorta(t) +
        '<strong>' + t + '</strong><small>' + NOME_PT[t] + '</small></div>';
    });
    $('inventario').innerHTML = h;
  }

  /* ---------- 10. HUD, MENSAGEM E BOTÕES ---------- */
  const dificuldade = (n) => n <= 10 ? ['Muito fácil', 'd1'] : n <= 20 ? ['Fácil', 'd2'] : n <= 30 ? ['Intermediária', 'd3'] : n <= 40 ? ['Difícil', 'd4'] : ['Muito difícil', 'd5'];

  function atualizarHud() {
    $('hudFase').textContent = String(E.fase).padStart(2, '0'); // padStart completa com zeros: 7 -> "07"
    $('hudTent').textContent = String(E.tentativas);
    const d = dificuldade(E.fase);
    $('hudDif').textContent = d[0];
    $('hudDif').className = 'selo-dif ' + d[1];
    const q = concluidasQtd();
    $('hudConcluidas').textContent = q + '/' + TOTAL_FASES;
    $('progressoFill').style.width = (q / TOTAL_FASES) * 100 + '%';
  }

  function msg(texto, tipo) {
    const m = $('mensagem');
    m.textContent = texto;
    m.className = tipo || 'info';
  }

  function atualizarBotoes() {
    $('btnIniciar').disabled = E.simulando || E.venceu;
    $('btnResetar').disabled = false;
    $('btnProxima').classList.toggle('hidden', !E.venceu);
    $('btnProxima').textContent = E.fase >= TOTAL_FASES ? 'CONCLUIR' : 'PRÓXIMA FASE';
  }

  // Faz a lacuna "balançar" (feedback de erro)
  function sacudir(slotId) {
    const el = document.querySelector('.slot[data-slot="' + slotId + '"]');
    if (!el) { return; }
    el.classList.remove('recusa');
    void el.getBoundingClientRect(); // força o navegador a reiniciar a animação
    el.classList.add('recusa');
  }

  function desenharTudo() {
    desenharCircuito();
    desenharInventario();
    atualizarHud();
    atualizarBotoes();
  }

  /* ---------- 11. CARREGAR FASE ---------- */
  function carregarFase(n) {
    limparSimulacao();
    E.fase = n;
    E.def = FASES[n - 1];
    E.colocadas = {};
    E.selecionada = null;
    E.tentativas = 0;
    E.venceu = false;
    preparar(E.def);
    E.save.atual = Math.max(E.save.atual, n);
    gravarSave();
    const nl = E.arvores.length;
    msg('Fase ' + n + ': acenda ' + (nl === 1 ? 'a lâmpada' : 'as ' + nl + ' lâmpadas') + ' usando as portas do estoque.', 'info');
    desenharTudo();
  }

  /* ---------- 12. ARRASTAR E SOLTAR (mouse e toque) ---------- */
  // Pointer events funcionam igual para mouse, dedo e caneta.
  let arraste = null;

  function comecarArraste(ev, tipo, de) {
    if (E.simulando || E.venceu) { return; }
    arraste = { tipo, de, x0: ev.clientX, y0: ev.clientY, moveu: false };
    window.addEventListener('pointermove', moverArraste);
    window.addEventListener('pointerup', terminarArraste);
    window.addEventListener('pointercancel', cancelarArraste);
  }

  function marcarCompativeis(tipo) {
    document.querySelectorAll('.slot').forEach((el) => {
      const sl = slotPorId(Number(el.getAttribute('data-slot')));
      el.classList.toggle('compativel', cabe(sl, tipo));
      el.classList.toggle('incompativel', !cabe(sl, tipo));
    });
  }
  function desmarcarCompativeis() {
    document.querySelectorAll('.slot').forEach((el) => el.classList.remove('compativel', 'incompativel', 'pegando'));
  }

  function moverArraste(ev) {
    if (!arraste) { return; }
    const dist = Math.hypot(ev.clientX - arraste.x0, ev.clientY - arraste.y0);
    if (!arraste.moveu && dist > 6) { // só vira "arraste" depois de mexer 6px (senão é um clique)
      arraste.moveu = true;
      const f = $('fantasma');
      f.innerHTML = svgPorta(arraste.tipo);
      f.classList.remove('hidden');
      marcarCompativeis(arraste.tipo);
      if (arraste.de !== null) {
        const el = document.querySelector('.slot[data-slot="' + arraste.de + '"]');
        if (el) { el.classList.add('pegando'); }
      }
    }
    if (arraste.moveu) {
      const f = $('fantasma');
      f.style.left = ev.clientX + 'px';
      f.style.top = ev.clientY + 'px';
    }
  }

  function limparArraste() {
    window.removeEventListener('pointermove', moverArraste);
    window.removeEventListener('pointerup', terminarArraste);
    window.removeEventListener('pointercancel', cancelarArraste);
    $('fantasma').classList.add('hidden');
    desmarcarCompativeis();
    arraste = null;
  }

  function cancelarArraste() { limparArraste(); }

  function terminarArraste(ev) {
    if (!arraste) { return; }
    const a = arraste;
    limparArraste();

    if (!a.moveu) { // foi só um clique
      if (a.de === null) { // clique numa porta do estoque: seleciona (ou desmarca)
        E.selecionada = E.selecionada === a.tipo ? null : a.tipo;
        desenharInventario();
        msg(E.selecionada ? 'Porta ' + a.tipo + ' selecionada: clique numa lacuna para encaixar.' : 'Seleção removida.', 'info');
      } else if (E.selecionada && cabe(slotPorId(a.de), E.selecionada)) { // clique numa porta já colocada, com outra selecionada: troca
        aplicar(a.de, E.selecionada, null);
      } else { // clique numa porta já colocada: devolve ao estoque
        retirar(a.de);
      }
      return;
    }

    // soltou: procura a lacuna que está embaixo do ponteiro
    const alvo = document.elementsFromPoint(ev.clientX, ev.clientY).map((el) => el.closest && el.closest('.slot')).find(Boolean);
    if (alvo) {
      aplicar(Number(alvo.getAttribute('data-slot')), a.tipo, a.de);
    } else if (a.de !== null) {
      retirar(a.de); // arrastou uma porta colocada para fora: volta ao estoque
    }
  }

  /* ---------- 13. MODAIS ---------- */
  function abrirFases() {
    let h = '';
    for (let n = 1; n <= TOTAL_FASES; n++) {
      const est = E.save.concluidas[n] || 0;
      const lib = liberada(n);
      h += '<button type="button" class="fase-btn ' + dificuldade(n)[1] + (n === E.fase ? ' atual' : '') + '" data-fase="' + n + '"' + (lib ? '' : ' disabled') + '>' +
        '<span class="fase-n">' + n + '</span><span class="fase-est">' + (lib ? '★'.repeat(est) + '☆'.repeat(3 - est) : '🔒') + '</span></button>';
    }
    $('gradeFases').innerHTML = h;
    $('modalFases').classList.remove('hidden');
  }

  function abrirFim() {
    let total = 0; Object.values(E.save.concluidas).forEach((x) => { total += x; });
    $('fimTexto').textContent = 'Você conquistou ' + total + ' de ' + TOTAL_FASES * 3 + ' estrelas. Dá para voltar às fases e tentar melhorar suas notas!';
    $('modalFim').classList.remove('hidden');
  }

  /* ---------- 14. EVENTOS ---------- */
  $('inventario').addEventListener('pointerdown', (e) => {
    const card = e.target.closest('.gate-card');
    if (!card || card.classList.contains('zerado')) { return; }
    e.preventDefault();
    comecarArraste(e, card.getAttribute('data-tipo'), null);
  });

  $('circuito').addEventListener('pointerdown', (e) => {
    const el = e.target.closest('.slot.preenchido');
    if (!el) { return; }
    e.preventDefault();
    const id = Number(el.getAttribute('data-slot'));
    comecarArraste(e, E.colocadas[id], id);
  });

  // clique numa lacuna VAZIA com uma porta selecionada: encaixa
  $('circuito').addEventListener('click', (e) => {
    const el = e.target.closest('.slot.vazio');
    if (!el || !E.selecionada || E.simulando || E.venceu) { return; }
    aplicar(Number(el.getAttribute('data-slot')), E.selecionada, null);
  });

  $('btnIniciar').addEventListener('click', iniciar);
  $('btnResetar').addEventListener('click', resetar);
  $('btnProxima').addEventListener('click', proxima);
  $('btnFases').addEventListener('click', abrirFases);
  $('btnFecharFases').addEventListener('click', () => $('modalFases').classList.add('hidden'));
  $('btnFecharFim').addEventListener('click', () => $('modalFim').classList.add('hidden'));
  $('gradeFases').addEventListener('click', (e) => {
    const b = e.target.closest('.fase-btn');
    if (!b || b.disabled) { return; }
    $('modalFases').classList.add('hidden');
    carregarFase(Number(b.getAttribute('data-fase')));
  });
  $('btnRecomecar').addEventListener('click', () => {
    $('modalFim').classList.add('hidden');
    carregarFase(1);
  });

  /* ---------- 15. INÍCIO ---------- */
  carregarSave();
  carregarFase(Math.min(TOTAL_FASES, Math.max(1, E.save.atual)));
})();