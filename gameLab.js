/* ==========================================================================
   O LABORATÓRIO PERDIDO — JOGO 2 (cruzadinha + dossiês)
   Arquivo INDEPENDENTE do game.js. Carregue depois dele no index.html.

   O motor da cruzadinha segue o modelo "PALAVRAS = lista de palavras":
   o tamanho da grade, os cruzamentos e a numeração são calculados sozinhos.
   ========================================================================== */

/* ==========================================================================
   COMO ADICIONAR OU ALTERAR PALAVRAS
   --------------------------------------------------------------------------
   Cada palavra é um bloco { ... } na lista PALAVRAS:
     id      : nome curto e único (é o que o dossiê usa em [[id]])
     resposta: a palavra (acentos e maiúsculas/minúsculas não importam)
     rotulo  : como a palavra aparece escrita no dossiê depois de acertada
     dica    : texto da dica (NÃO escreva a resposta nele)
     linha   : linha da PRIMEIRA letra (começa em 0, de cima para baixo)
     coluna  : coluna da PRIMEIRA letra (começa em 0, da esquerda p/ direita)
     direcao : "H" = horizontal (→)  |  "V" = vertical (↓)
   Onde duas palavras se cruzam, a letra precisa ser a mesma; se houver
   conflito, uma mensagem de erro aparece no painel de status do jogo.
   ========================================================================== */
const PALAVRAS = [
  { id: 'memoriademassa',   resposta: 'MEMORIADEMASSA',   rotulo: 'MEMÓRIA DE MASSA', dica: 'Armazenamento secundário de grande capacidade, onde ficam arquivos e o sistema de forma permanente.', linha: 0,  coluna: 0,  direcao: 'V' },
  { id: 'cache',            resposta: 'CACHE',            rotulo: 'CACHE',            dica: 'Memória ultrarrápida intermediária que guarda cópias dos dados mais acessados.',                     linha: 0,  coluna: 5,  direcao: 'V' },
  { id: 'quadcore',         resposta: 'QUADCORE',         rotulo: 'QUAD CORE',        dica: 'Processador com quatro núcleos físicos de execução.',                                                linha: 0,  coluna: 12, direcao: 'V' },
  { id: 'microcontrolador', resposta: 'MICROCONTROLADOR', rotulo: 'MICROCONTROLADOR', dica: 'Circuito integrado compacto que reúne processador, memória e periféricos de E/S em um único chip.',  linha: 2,  coluna: 0,  direcao: 'H' },
  { id: 'dualcore',         resposta: 'DUALCORE',         rotulo: 'DUAL CORE',        dica: 'Arquitetura com duas unidades físicas de processamento independentes no mesmo chip.',                linha: 4,  coluna: 8,  direcao: 'H' },
  { id: 'addressbus',       resposta: 'ADDRESSBUS',       rotulo: 'ADDRESS BUS',      dica: 'Barramento unidirecional que transporta o endereço físico da memória.',                              linha: 4,  coluna: 10, direcao: 'V' },
  { id: 'eeprom',           resposta: 'EEPROM',           rotulo: 'EEPROM',           dica: 'Memória não volátil que pode ser apagada e reprogramada por pulsos elétricos.',                      linha: 5,  coluna: 3,  direcao: 'V' },
  { id: 'registradores',    resposta: 'REGISTRADORES',    rotulo: 'REGISTRADORES',    dica: 'Armazenam temporariamente dados usados diretamente pelo processador, em altíssima velocidade.',      linha: 6,  coluna: 2,  direcao: 'H' },
  { id: 'rom',              resposta: 'ROM',              rotulo: 'ROM',              dica: 'Memória não volátil com informações permanentes gravadas de fábrica, como o firmware inicial.',      linha: 9,  coluna: 2,  direcao: 'H' },
  { id: 'flash',            resposta: 'FLASH',            rotulo: 'FLASH',            dica: 'Memória não volátil de escrita rápida em blocos, usada em pendrives e BIOS modernas.',               linha: 9,  coluna: 7,  direcao: 'H' },
  { id: 'dma',              resposta: 'DMA',              rotulo: 'DMA',              dica: 'Recurso que permite aos periféricos transferirem dados direto para a memória sem sobrecarregar a CPU.', linha: 11, coluna: 7,  direcao: 'V' },
  { id: 'databus',          resposta: 'DATABUS',          rotulo: 'DATA BUS',         dica: 'Barramento bidirecional que transporta os dados reais entre processador, memória e periféricos.',    linha: 13, coluna: 4,  direcao: 'H' }
];

/* ==========================================================================
   OS PAPÉIS (DOSSIÊS) DO DR. VOSS
   No texto, [[id]] marca uma lacuna que se preenche sozinha quando a palavra
   correspondente é acertada na cruzadinha.
   ========================================================================== */
const FICHAS = [
  { id: 1, rotulo: 'ARQUIVO 001', palavras: ['registradores', 'rom'], comentario: null,
    texto: 'Registro Inicial. Para que o núcleo execute instruções sem gargalos, precisei estruturar a hierarquia interna. Implementei os [[registradores]] dentro da própria unidade central para guardar dados imediatos. Para as instruções permanentes de inicialização gravadas de fábrica, utilizei uma memória [[rom]].' },
  { id: 2, rotulo: 'ARQUIVO 002', palavras: ['eeprom', 'flash', 'cache', 'memoriademassa'],
    comentario: 'Finalmente consegui fazer todos os componentes trabalharem em conjunto. Mas algo inesperado aconteceu durante o último experimento...',
    texto: 'Os testes avançam. Substituí os antigos chips por uma [[eeprom]], permitindo apagar e regravar dados eletricamente. Para blocos de alta velocidade, adotei a memória [[flash]]. Já para evitar a lentidão da memória principal, posicionei uma memória [[cache]] intermediária, enquanto grandes volumes de dados do sistema ficam na [[memoriademassa]].' },
  { id: 3, rotulo: 'ARQUIVO 003', palavras: ['addressbus', 'databus', 'dma'],
    comentario: 'A comunicação está limpa agora. Mas e se o sinal que estamos transmitindo já tivesse sido... roubado?',
    texto: 'Um sistema isolado é inútil. Mapeei as vias de comunicação: o [[addressbus]] define exclusivamente o destino físico na memória, enquanto o [[databus]] transporta as informações nos dois sentidos. Para evitar que a CPU perdesse ciclos copiando dados de periféricos, ativei o protocolo [[dma]].' },
  { id: 4, rotulo: 'ARQUIVO 004', palavras: ['microcontrolador', 'dualcore', 'quadcore'],
    comentario: 'Paralelismo real alcançado. O núcleo vai... está vindo online.',
    texto: 'Nos módulos auxiliares de controle de válvulas do laboratório, integrei um [[microcontrolador]] completo em um único chip. Contudo, o núcleo central exigia paralelismo real: evoluí o protótipo de uma arquitetura [[dualcore]] de dois núcleos para uma poderosa estrutura [[quadcore]].' },
  { id: 5, rotulo: 'ARQUIVO 005', palavras: [], precisaTodas: true, comentario: null,
    texto: '04:17 AM. Todos os 12 módulos estão sincronizados. A frequência estabilizou. Se alguém estiver lendo estas anotações reconstruídas, saiba que não desapareci por acidente — ocultei o núcleo experimental antes que caísse em mãos erradas. O futuro desta arquitetura agora pertence a quem soube decifrá-la. — Dr. Elias Voss.' }
];

/* ==========================================================================
   MOTOR DO JOGO (não precisa mexer daqui para baixo)
   ========================================================================== */
/* (() => { ... })();  = função que se executa sozinha: tudo que for criado aqui
   dentro fica privado e não bate com nomes do game.js. */
(() => {
  'use strict'; // modo estrito: o navegador avisa de erros bobos

  const PONTOS_ACERTO = 100;   // pontos por palavra
  const PENALIDADE_ERRO = 10;  // pontos perdidos por tentativa errada
  const FLASH_MS = 700;        // tempo que as letras erradas ficam vermelhas

  /* const = variável que não pode ser reatribuída.
     ($ = (id) => ...) é uma "arrow function": jeito curto de escrever uma função. */
  const $ = (id) => document.getElementById(id);
  // norm: tira acentos e tudo que não é letra, e deixa MAIÚSCULO
  const norm = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z]/g, '').toUpperCase();

  const cells = {};   // "linha,coluna" -> célula
  const words = [];   // palavras válidas
  const porId = {};   // id -> palavra
  const erros = [];   // problemas de configuração

  /* ---------- 1) Monta as palavras e as células ---------- */
  PALAVRAS.forEach((p, i) => {
    const resp = norm(p.resposta);
    const dir = String(p.direcao || '').toUpperCase();
    if (!p.id || !resp || (dir !== 'H' && dir !== 'V') || !Number.isInteger(p.linha) || !Number.isInteger(p.coluna)) {
      erros.push('Palavra #' + (i + 1) + ' está com dados inválidos.');
      return;
    }
    const w = { id: p.id, rotulo: p.rotulo || resp, resp, dica: p.dica, dir, keys: [], num: 0, resolvida: false, item: null };
    for (let k = 0; k < resp.length; k++) {
      const r = p.linha + (dir === 'V' ? k : 0);
      const c = p.coluna + (dir === 'H' ? k : 0);
      const key = r + ',' + c;
      let cell = cells[key];
      if (!cell) {
        cell = cells[key] = { r, c, key, sol: resp[k], H: null, V: null, num: 0, travada: false, el: null, input: null };
      } else if (cell.sol !== resp[k]) {
        erros.push('Conflito na linha ' + r + ', coluna ' + c + ': "' + cell.sol + '" x "' + resp[k] + '" (palavra ' + p.resposta + ').');
      }
      if (cell[dir]) { erros.push('Duas palavras na mesma direção se sobrepõem na linha ' + r + ', coluna ' + c + '.'); }
      cell[dir] = w;
      w.keys.push(key);
    }
    words.push(w);
    porId[w.id] = w;
  });

  const lista = Object.values(cells); // Object.values: transforma o objeto em array de células
  if (!lista.length) { return; }
  const linhas = Math.max(...lista.map((c) => c.r)) + 1;   // ... "espalha" o array como argumentos
  const colunas = Math.max(...lista.map((c) => c.c)) + 1;

  /* ---------- 2) Numeração automática (esquerda→direita, cima→baixo) ---------- */
  let n = 0;
  for (let r = 0; r < linhas; r++) {
    for (let c = 0; c < colunas; c++) {
      const cell = cells[r + ',' + c];
      if (!cell) { continue; }
      const comecaH = cell.H && cell.H.keys[0] === cell.key;
      const comecaV = cell.V && cell.V.keys[0] === cell.key;
      if (comecaH || comecaV) {
        n++;
        cell.num = n;
        if (comecaH) { cell.H.num = n; }
        if (comecaV) { cell.V.num = n; }
      }
    }
  }
  const ordenadas = words.slice().sort((a, b) => a.num - b.num);

  /* ---------- 3) Estado ---------- */
  const estado = {
    acertos: [],        // ids das palavras acertadas
    tentativas: 0,
    fichaId: 1,         // dossiê aberto
    inicio: 0,
    timer: null,
    segundosFinais: 0,
    ocupado: false,     // true durante a piscada vermelha
    passo: 'revelation'
  };
  let sel = null;       // célula selecionada
  let dir = 'H';        // direção atual

  /* ---------- 4) Telas, HUD e tempo ---------- */
  // Esconde TODA tela (class="screen") e mostra só a pedida
  function mostrarTela(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.add('hidden'));
    $(id).classList.remove('hidden');
  }

  function led(texto, modo) {
    $('labLedText').textContent = texto;
    $('labLedDot').className = 'lab-led-dot' + (modo ? ' ' + modo : '');
  }

  function atualizarHud() {
    $('labRegCount').textContent = String(estado.acertos.length);
    $('labAttempts').textContent = String(estado.tentativas);
  }

  const doisDigitos = (x) => String(x).padStart(2, '0'); // 5 -> "05"
  const formatarTempo = (s) => doisDigitos(Math.floor(s / 60)) + ':' + doisDigitos(s % 60);
  const segundosPassados = () => Math.floor((Date.now() - estado.inicio) / 1000);

  function pararTempo() { if (estado.timer) { clearInterval(estado.timer); estado.timer = null; } }
  function iniciarTempo() {
    pararTempo();
    estado.inicio = Date.now();
    estado.timer = setInterval(() => { $('labTimer').textContent = formatarTempo(segundosPassados()); }, 500);
  }

  /* ---------- 5) Desenha a grade ---------- */
  const grade = $('labGrid');
  grade.style.gridTemplateColumns = 'repeat(' + colunas + ', 30px)';
  for (let r = 0; r < linhas; r++) {
    for (let c = 0; c < colunas; c++) {
      const cell = cells[r + ',' + c];
      const el = document.createElement('div');
      if (!cell) { el.className = 'lab-cell empty'; grade.appendChild(el); continue; } // casa sem palavra
      el.className = 'lab-cell';
      if (cell.num) {
        const s = document.createElement('span');
        s.className = 'lab-num';
        s.textContent = cell.num;
        el.appendChild(s);
      }
      // Cada casa é um <input>: o teclado do celular também funciona
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.autocomplete = 'off';
      inp.autocapitalize = 'characters';
      inp.spellcheck = false;
      el.appendChild(inp);
      grade.appendChild(el);
      cell.el = el;
      cell.input = inp;
    }
  }

  /* ---------- 6) Lista de dicas (só dica + tamanho, sem a resposta) ---------- */
  ordenadas.forEach((w) => {
    const item = document.createElement('div');
    item.className = 'lab-clue';
    const num = document.createElement('span');
    num.className = 'lab-clue-num';
    num.textContent = w.num + '.';
    const txt = document.createElement('span');
    txt.className = 'lab-clue-text';
    txt.textContent = w.dica;
    const len = document.createElement('span');
    len.className = 'lab-clue-len';
    len.textContent = '(' + w.resp.length + ')';
    item.appendChild(num);
    item.appendChild(txt);
    item.appendChild(len);
    item.addEventListener('click', () => selecionarPalavra(w));
    $(w.dir === 'H' ? 'labCluesH' : 'labCluesV').appendChild(item);
    w.item = item;
  });

  /* ---------- 7) Dossiês ---------- */
  const fichaDe = (id) => FICHAS.find((f) => f.palavras.indexOf(id) !== -1) || null; // .find: primeiro item que satisfaz
  const contarAcertos = (f) => f.palavras.filter((id) => porId[id] && porId[id].resolvida).length; // .filter: só os que satisfazem

  function desenharAbas() {
    const abas = $('labDossierTabs');
    abas.innerHTML = '';
    FICHAS.forEach((f) => {
      const status = f.precisaTodas
        ? (estado.acertos.length === words.length ? '[LIBERADO]' : '[BLOQUEADO]')
        : '[' + contarAcertos(f) + '/' + f.palavras.length + ']';
      const b = document.createElement('button');
      b.className = 'lab-tab' + (f.id === estado.fichaId ? ' active' : '');
      b.textContent = f.rotulo + ' ' + status;
      b.addEventListener('click', () => { estado.fichaId = f.id; desenharAbas(); desenharDossie(); });
      abas.appendChild(b);
    });
  }

  function desenharDossie() {
    const f = FICHAS.find((x) => x.id === estado.fichaId);
    const caixa = $('labDossierContent');
    const comentario = $('labFileComment');
    caixa.innerHTML = '';
    comentario.classList.add('hidden');

    if (f.precisaTodas && estado.acertos.length < words.length) {
      caixa.textContent = 'ARQUIVO CRIPTOGRAFADO. RESTAURE TODOS OS 12 REGISTROS PARA LER.';
      return;
    }

    // split com parênteses na expressão regular mantém o texto capturado:
    // 'a [[x]] b' vira ['a ', 'x', ' b']. Posições ímpares são os ids das lacunas.
    const partes = f.texto.split(/\[\[([a-z]+)\]\]/);
    partes.forEach((parte, i) => {
      if (i % 2 === 0) {
        caixa.appendChild(document.createTextNode(parte)); // texto puro
        return;
      }
      const w = porId[parte];
      const lacuna = document.createElement('span');
      const ativa = sel && sel[dir] === w;
      lacuna.className = 'lab-gap' + (w.resolvida ? ' filled' : '') + (ativa ? ' active' : '');
      lacuna.textContent = w.resolvida ? w.rotulo : '[ ' + w.num + ' - ______ ]';
      lacuna.addEventListener('click', () => selecionarPalavra(w));
      caixa.appendChild(lacuna);
    });

    if (f.comentario && contarAcertos(f) === f.palavras.length) {
      comentario.textContent = f.comentario;
      comentario.classList.remove('hidden');
    }
  }

  /* ---------- 8) Seleção ---------- */
  function atualizar() {
    lista.forEach((c) => c.el.classList.remove('selected', 'cursor'));
    words.forEach((w) => w.item.classList.remove('active'));
    const w = sel && sel[dir];
    if (w) {
      w.keys.forEach((k) => cells[k].el.classList.add('selected'));
      w.item.classList.add('active');
      $('labCurrentClue').textContent = w.num + (w.dir === 'H' ? ' Horizontal' : ' Vertical') + ': ' + w.dica + ' (' + w.resp.length + ' letras)';
      const f = fichaDe(w.id);
      if (f) { estado.fichaId = f.id; } // abre sozinho o dossiê dessa palavra
    }
    if (sel) { sel.el.classList.add('cursor'); }
    desenharAbas();
    desenharDossie();
  }

  function selecionar(cell, d, focar) {
    if (d && cell[d]) { dir = d; }
    else if (!cell[dir]) { dir = dir === 'H' ? 'V' : 'H'; }
    sel = cell;
    atualizar();
    if (focar !== false) { cell.input.focus(); }
  }

  const primeiraLivre = (w) => {
    const k = w.keys.find((key) => !cells[key].input.value);
    return cells[k || w.keys[0]];
  };

  // Clicar numa dica ou lacuna posiciona o cursor na PRIMEIRA letra da palavra
  function selecionarPalavra(w) { selecionar(cells[w.keys[0]], w.dir); }

  function avancar() {
    const w = sel[dir];
    if (!w) { return; }
    const i = w.keys.indexOf(sel.key) + 1;
    if (i < w.keys.length) { selecionar(cells[w.keys[i]], dir); }
  }

  function limpar(cell) {
    if (cell.travada) { return; }
    cell.input.value = '';
    cell.el.classList.remove('filled', 'wrong');
  }

  function retroceder() {
    const w = sel[dir];
    if (!w) { return; }
    const i = w.keys.indexOf(sel.key) - 1;
    if (i >= 0) {
      const ant = cells[w.keys[i]];
      limpar(ant);
      selecionar(ant, dir);
    }
  }

  function mover(dr, dc) {
    let r = sel.r + dr, c = sel.c + dc;
    while (r >= 0 && c >= 0 && r < linhas && c < colunas) {
      const cell = cells[r + ',' + c];
      if (cell) { selecionar(cell, dr ? 'V' : 'H'); return; }
      r += dr; c += dc;
    }
  }

  /* ---------- 9) Conferência automática (sem botão "verificar") ---------- */
  function travar(w) {
    w.resolvida = true;
    w.keys.forEach((k) => {
      const c = cells[k];
      c.travada = true;
      c.el.classList.add('locked');
      c.el.classList.remove('wrong');
    });
    w.item.classList.add('done');
    estado.acertos.push(w.id);
    led('REGISTRO ' + doisDigitos(w.num) + ' RESTAURADO', '');
    atualizarHud();
    if (estado.acertos.length === words.length) { $('btnLabFinalize').classList.remove('hidden'); }
    desenharAbas();
    desenharDossie();
  }

  function errar(erradas) {
    estado.tentativas++;
    estado.ocupado = true;
    const marcadas = [];
    erradas.forEach((w) => w.keys.forEach((k) => {
      const c = cells[k];
      if (!c.travada) { c.el.classList.add('wrong'); marcadas.push(c); }
    }));
    // readOnly: o campo não aceita digitação (usado só durante a piscada vermelha)
    lista.forEach((c) => { c.input.readOnly = true; });
    led('FALHA: PALAVRA INCORRETA', 'alert');
    atualizarHud();

    setTimeout(() => {
      marcadas.forEach(limpar);
      lista.forEach((c) => { c.input.readOnly = false; });
      estado.ocupado = false;
      led('STANDBY', '');
      const w = sel && sel[dir];
      if (w) { selecionar(primeiraLivre(w), dir); }
    }, FLASH_MS);
  }

  // Depois de cada letra, confere as palavras que passam pela casa digitada
  function conferir(cell) {
    const erradas = [];
    [cell.H, cell.V].forEach((w) => {
      if (!w || w.resolvida) { return; }
      const digitado = w.keys.map((k) => cells[k].input.value).join('');
      if (digitado.length < w.keys.length) { return; } // ainda incompleta: não conta como erro
      if (digitado === w.resp) { travar(w); } else { erradas.push(w); }
    });
    if (erradas.length) { errar(erradas); }
  }

  /* ---------- 10) Eventos das casas ---------- */
  lista.forEach((cell) => {
    cell.input.addEventListener('focus', () => { if (sel !== cell) { selecionar(cell, null, false); } });

    // Guarda se a casa JÁ estava selecionada antes do clique (para alternar H/V só no 2º clique)
    let jaSelecionada = false;
    cell.el.addEventListener('mousedown', () => { jaSelecionada = (sel === cell); });
    cell.el.addEventListener('click', () => {
      if (jaSelecionada) {
        const outra = dir === 'H' ? 'V' : 'H';
        if (cell[outra]) { dir = outra; atualizar(); }
      }
      cell.input.focus();
    });

    cell.input.addEventListener('input', () => {
      if (estado.ocupado) { return; }
      if (cell.travada) {
        // casa já certa (cruzamento): mantém a letra correta e segue para a próxima,
        // assim dá para digitar a palavra inteira de uma vez
        cell.input.value = cell.sol;
        avancar();
        conferir(cell); // se esta era a última casa que faltava, a palavra é conferida
        return;
      }
      const ch = norm(cell.input.value).slice(-1); // fica só com a última letra digitada
      cell.input.value = ch;
      cell.el.classList.toggle('filled', !!ch);
      if (ch) { avancar(); conferir(cell); }
    });

    cell.input.addEventListener('keydown', (e) => {
      const k = e.key;
      if (k === 'ArrowRight') { e.preventDefault(); mover(0, 1); }
      else if (k === 'ArrowLeft') { e.preventDefault(); mover(0, -1); }
      else if (k === 'ArrowDown') { e.preventDefault(); mover(1, 0); }
      else if (k === 'ArrowUp') { e.preventDefault(); mover(-1, 0); }
      else if (k === 'Backspace') {
        e.preventDefault();
        if (estado.ocupado) { return; }
        if (cell.input.value && !cell.travada) { limpar(cell); } else { retroceder(); }
      } else if (k === 'Delete') { e.preventDefault(); if (!estado.ocupado) { limpar(cell); } }
    });
  });

  /* ---------- 11) Início, final e relatório ---------- */
  function iniciar() {
    lista.forEach((c) => {
      c.input.value = '';
      c.input.readOnly = false;
      c.travada = false;
      c.el.classList.remove('filled', 'locked', 'wrong', 'selected', 'cursor');
    });
    words.forEach((w) => { w.resolvida = false; w.item.classList.remove('done', 'active'); });
    estado.acertos = [];
    estado.tentativas = 0;
    estado.fichaId = 1;
    estado.ocupado = false;
    estado.passo = 'revelation';
    sel = null;

    $('btnLabFinalize').classList.add('hidden');
    $('labTimer').textContent = '00:00';
    led('STANDBY', '');
    atualizarHud();

    mostrarTela('screenLabGame');   // primeiro mostra a tela (campo escondido não recebe foco)
    iniciarTempo();
    const primeira = ordenadas[0];
    selecionar(cells[primeira.keys[0]], primeira.dir);
  }

  function sairParaPortal() { pararTempo(); mostrarTela('screenHub'); }

  function desenharFinal() {
    $('labFinalRevelation').classList.toggle('hidden', estado.passo !== 'revelation');
    $('labFinalReport').classList.toggle('hidden', estado.passo !== 'report');
  }

  function irParaFinal() {
    pararTempo();
    estado.segundosFinais = segundosPassados();
    estado.passo = 'revelation';
    desenharFinal();
    mostrarTela('screenLabFinal');
  }

  function montarRelatorio() {
    const pontos = Math.max(0, words.length * PONTOS_ACERTO - estado.tentativas * PENALIDADE_ERRO);
    $('labFinalFound').textContent = estado.acertos.length + '/' + words.length;
    $('labFinalAttempts').textContent = String(estado.tentativas);
    $('labFinalTime').textContent = formatarTempo(estado.segundosFinais);
    $('labFinalScore').textContent = String(pontos);

    const caixa = $('labFinalAchievements');
    caixa.innerHTML = '';
    [estado.tentativas === 0 ? 'DECIFRADOR PERFEITO' : 'DECIFRADOR IMPERFEITO',
     'ESPECIALISTA EM MEMORIA', 'ESPECIALISTA EM COMUNICACAO', 'ESPECIALISTA EM PROCESSAMENTO'
    ].forEach((nome) => {
      const a = document.createElement('div');
      a.className = 'lab-final-achievement';
      a.textContent = 'CONQUISTA DESBLOQUEADA: ' + nome;
      caixa.appendChild(a);
    });
  }

  /* ---------- 12) Botões do fluxo ---------- */
  $('btnEnterAtom').addEventListener('click', () => mostrarTela('screenLabIntro'));
  $('btnLabStart').addEventListener('click', () => $('labTutorialModal').classList.remove('hidden'));
  $('btnLabGo').addEventListener('click', () => { $('labTutorialModal').classList.add('hidden'); iniciar(); });
  $('btnLabExit').addEventListener('click', sairParaPortal);
  $('btnLabFinalize').addEventListener('click', irParaFinal);
  $('btnLabToReport').addEventListener('click', () => { estado.passo = 'report'; montarRelatorio(); desenharFinal(); });
  $('btnLabReplay').addEventListener('click', iniciar);
  $('btnLabExitFinal').addEventListener('click', sairParaPortal);

  /* ---------- 13) Erros de configuração ---------- */
  if (erros.length) {
    console.error('Cruzadinha:\n' + erros.join('\n'));
    led('ERRO NA CONFIGURAÇÃO (veja o Console, F12)', 'error');
  }
})();