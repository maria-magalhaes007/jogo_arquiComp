/* ==========================================================================
   BYTE & THE LOST ARCHITECTURE
   JavaScript principal do JOGO 1 (oficina cyberpunk).
   O jogo 2 (O Laboratório Perdido) agora vive em game-lab.js.

   Este arquivo contém:
   1. Constantes e banco de dados dos 12 registros recuperáveis.
   2. Estado do jogo (XP, descobertas, tentativas, progresso).
   3. Funções utilitárias (normalização, console do BYTE, HUD).
   4. Desenho do sprite pixel art do BYTE e da bancada holográfica.
   5. Lógica de desafios, XP, dicas e telas.
   ========================================================================== */

/* ---------- 1. CONSTANTES DO JOGO ---------- */
var TOTAL_REGISTROS = 12;
var XP_POR_ACERTO = 100;
var XP_POR_DICA = -15;
var XP_MINIMO = 0;
var HINT_LIMIT = 3;
var MILESTONES = [3, 6, 9, 12];

var MENSAGENS_INICIO = [
  'Olá, montador! Temos um problema... O manual de arquitetura foi corrompido!',
  'Precisamos recuperar as informações para concluir a montagem.',
  'Você consegue resolver os enigmas?'
];

var TUTORIAL = [
  '1. Leia a pista técnica e preencha a lacuna com o termo correto.',
  '2. Cada acerto ilumina o projeto holográfico na bancada e soma +100 XP.',
  '3. Erros não causam Game Over: geram apenas uma dica orientadora.'
];

var BOOT_LINES = [
  'BYTE BIOS v2.6.1',
  'MEMORY CHECK ........ OK',
  'ARCHITECTURE RECOVERED .. OK',
  'NEURAL LINK ............ OK',
  'BOOT SEQUENCE INITIATED',
  'BYE.'
];

/* ---------- 2. BANCO DE DADOS DOS 12 REGISTROS ---------- */
var RECORDS = [
  {
    id: 1,
    term: 'registradores',
    category: 'MEMORIA',
    visual: 'memory',
    clue: 'Armazenam temporariamente informações utilizadas diretamente pelo processador em altíssima velocidade.',
    errorHint: 'Pense nas menores e mais rápidas unidades de armazenamento localizadas dentro da própria CPU.',
    success: 'Você encontrou os Registradores! Eles ficam dentro do processador e guardam dados e instruções imediatas durante a execução.',
    hints: [
      'Pense nas menores unidades de armazenamento localizadas dentro da própria CPU.',
      'É declarada a memória mais rápida do computador.',
      'Seus tipos variam conforme a área de aplicação (como acumulador, contador de programa e ponteiro de pilha).'
    ]
  },
  {
    id: 2,
    term: 'rom',
    category: 'MEMORIA',
    visual: 'memory',
    clue: 'Memória não volátil que guarda informações permanentes gravadas de fábrica, como o firmware inicial.',
    errorHint: 'É uma memória que guarda o que precisa para começar a funcionar.',
    success: 'ROM recuperada! Ela mantém instruções essenciais mesmo quando o computador está sem energia.',
    hints: [
      'É uma memória que guarda o que o sistema precisa para começar a funcionar.',
      'Seus dados não são apagados quando você desliga o dispositivo.',
      'É nela que ficam armazenados programas essenciais de inicialização, como a BIOS ou UEFI.'
    ]
  },
  {
    id: 3,
    term: 'eeprom',
    category: 'MEMORIA',
    visual: 'memory',
    clue: 'Tipo de memória não volátil que pode ser apagada e reprogramada eletricamente.',
    errorHint: 'É uma evolução da PROM/EPROM que usa pulsos elétricos para regravação.',
    success: 'EEPROM restaurada! Permite atualizar configurações de hardware sem precisar remover o chip fisicamente.',
    hints: [
      'É uma evolução da EPROM que usa pulsos elétricos para regravação.',
      'Diferente da memória Flash que apaga dados em blocos inteiros, este componente permite apagar e reescrever um único byte por vez.',
      'Possui vida útil limitada a cerca de 100 mil a 1 milhão de ciclos de escrita.'
    ]
  },
  {
    id: 4,
    term: 'flash',
    category: 'MEMORIA',
    visual: 'memory',
    clue: 'Memória não volátil de escrita rápida em blocos, amplamente usada em pendrives, cartões e BIOS modernas.',
    errorHint: 'Seu nome remete à velocidade com que blocos inteiros de dados são apagados e gravados.',
    success: 'Memória Flash ativada! Combina persistência de dados sem energia com alta velocidade de regravação.',
    hints: [
      'É uma evolução da EEPROM que apaga e grava dados em blocos inteiros de uma só vez.',
      'Não possui partes móveis e mantém os dados salvos mesmo sem energia elétrica.',
      'É a tecnologia base usada em pendrives, cartões SD e unidades SSD.'
    ]
  },
  {
    id: 5,
    term: 'cache',
    category: 'MEMORIA',
    visual: 'memory',
    clue: 'Memória ultrarrápida intermediária que armazena cópias dos dados mais acessados para evitar lentidão da RAM.',
    errorHint: 'Fica entre o processador e a memória principal, reduzindo o tempo de espera da CPU.',
    success: 'Memória Cache sincronizada! Ela antecipa os dados que o processador vai precisar, acelerando o sistema.',
    hints: [
      'Ela guarda uma cópia dos dados e instruções que a CPU usou há pouco.',
      'Fica entre o processador e a memória principal, reduzindo o tempo de espera da CPU.',
      'É dividida em níveis hierárquicos conhecidos como L1, L2 e L3.'
    ]
  },
  {
    id: 6,
    term: 'memoriademassa',
    aliases: ['memoriademassa'],
    category: 'MEMORIA',
    visual: 'memory',
    clue: 'Dispositivo de armazenamento secundário de grande capacidade para guardar arquivos e o sistema operacional permanentemente.',
    errorHint: 'Refere-se ao armazenamento principal de longo prazo do usuário, como HDs e SSDs.',
    success: 'Memória de Massa conectada! É aqui que programas, jogos e arquivos ficam salvos permanentemente.',
    hints: [
      'Ocupa a base da pirâmide da hierarquia de memória por ter alta capacidade e menor velocidade.',
      'Seus dados não são endereçáveis diretamente pela CPU (precisam passar antes pela RAM).',
      'Engloba dispositivos de armazenamento permanente como HDs, SSDs e fitas magnéticas.'
    ]
  },
  {
    id: 7,
    term: 'dma',
    category: 'COMUNICACAO',
    visual: 'communication',
    clue: 'Recurso que permite que periféricos transfiram dados diretamente para a memória sem sobrecarregar o processador.',
    errorHint: 'Sigla em inglês para Acesso Direto à Memória (Direct Memory Access).',
    success: 'DMA configurado! Libera a CPU de tarefas repetitivas de transferência de dados.',
    hints: [
      'Ele mesmo assume o controle do barramento e move os dados entre o dispositivo e a RAM enquanto a CPU executa outras instruções.',
      'A CPU apenas informa ao controlador de onde copiar, para onde enviar e quantos bytes transferir.',
      'Quando termina a transferência, envia uma interrupção sinalizando à CPU que os dados já estão na memória.'
    ]
  },
  {
    id: 8,
    term: 'addressbus',
    aliases: ['addressbus'],
    category: 'COMUNICACAO',
    visual: 'communication',
    clue: 'Barramento unidirecional responsável por transportar o endereço físico da memória onde os dados serão lidos ou gravados.',
    errorHint: 'Informa onde os dados devem ser lidos ou gravados.',
    success: 'Address Bus mapeado! Ele aponta exatamente em qual posição da memória a informação está localizada.',
    hints: [
      'Informa o local exato onde os dados devem ser lidos ou gravados.',
      'Transporta endereços de memória e de dispositivos de E/S da CPU para outros componentes do sistema.',
      'Não transporta o conteúdo dos dados em si nem os sinais de sincronização; sua largura determina a memória máxima endereçável.'
    ]
  },
  {
    id: 9,
    term: 'databus',
    aliases: ['databus'],
    category: 'COMUNICACAO',
    visual: 'communication',
    clue: 'Barramento bidirecional que transporta os dados reais entre o processador, a memória e os periféricos.',
    errorHint: 'Responsável por transportar os dados reais entre a CPU e os demais componentes.',
    success: 'Data Bus operacional! É a rodovia por onde os bits trafegam nos dois sentidos.',
    hints: [
      'Responsável por transportar as informações reais processadas entre a CPU, a memória e periféricos.',
      'Funciona como uma via de mão dupla (bidirecional) por onde os bits vão e voltam.',
      'Sua largura (como 32 ou 64 bits) define quantos bits podem trafegar simultaneamente em cada ciclo.'
    ]
  },
  {
    id: 10,
    term: 'microcontrolador',
    category: 'PROCESSAMENTO',
    visual: 'processing',
    clue: 'Circuito integrado compacto que reúne processador, memória e periféricos de entrada/saída em um único chip.',
    errorHint: 'Muito usado em sistemas embarcados, automação e placas como Arduino.',
    success: 'Microcontrolador integrado! Um verdadeiro computador completo em miniatura para controle de dispositivos.',
    hints: [
      'Muito usado em sistemas embarcados, automação e placas como Arduino.',
      'É um computador completo, pequeno e de baixo consumo feito para executar tarefas específicas.',
      'Integra processador (CPU), memória (RAM/Flash) e portas de entrada/saída em um único chip.'
    ]
  },
  {
    id: 11,
    term: 'dualcore',
    aliases: ['dualcore'],
    category: 'PROCESSAMENTO',
    visual: 'processing',
    clue: 'Arquitetura de processador que possui duas unidades físicas de processamento independentes no mesmo chip.',
    errorHint: 'Indica a presença de dois núcleos trabalhando em paralelo.',
    success: 'Arquitetura Dual Core ativada! Permite executar múltiplas tarefas simultaneamente com mais eficiência.',
    hints: [
      'Indica a presença de dois núcleos físicos trabalhando em paralelo no mesmo encapsulamento.',
      'Fica exatamente entre o processador de núcleo único (single-core) e o de quatro núcleos.',
      'Permite dividir a carga de trabalho entre duas unidades independentes de execução (2 cores).'
    ]
  },
  {
    id: 12,
    term: 'quadcore',
    aliases: ['quadcore'],
    category: 'PROCESSAMENTO',
    visual: 'processing',
    clue: 'Processador equipado com quatro núcleos físicos de execução para alto desempenho em multitarefa.',
    errorHint: 'Quatro unidades de processamento.',
    success: 'Potência Quad Core desbloqueada! Quatro núcleos sincronizados prontos para processamento pesado.',
    hints: [
      'Ideal para tarefas pesadas e multitarefas simultâneas sem gargalos.',
      'Possui o dobro de núcleos físicos de um processador Dual Core.',
      'Conta com quatro unidades independentes de processamento no mesmo chip.'
    ]
  }

];

/* Fecha o array de registros */

/* ---------- 3. ESTADO DO JOGO ---------- */
var state = {
  screen: 'hub',
  xp: 0,
  discovered: [],
  attempts: 0,
  currentId: 1,
  hintUsed: false
};

/* ---------- 4. REFERENCIAS DE ELEMENTOS DOM ---------- */
var el = {
  start: document.getElementById('screenStart'),
  tutorial: document.getElementById('screenTutorial'),
  game: document.getElementById('screenGame'),
  final: document.getElementById('screenFinal'),
  boot: document.getElementById('bootScreen'),
  finalReport: document.getElementById('finalReport'),
  byteDialog: document.getElementById('byteDialog'),
  byteCanvas: document.getElementById('byteCanvas'),
  hologram: document.getElementById('hologram'),
  topbar: document.getElementById('topbar'),
  regCount: document.getElementById('regCount'),
  xpDisplay: document.getElementById('xpDisplay'),
  progressBar: document.getElementById('progressBar'),
  stageBanner: document.getElementById('stageBanner'),
  challengeArea: document.getElementById('challengeArea'),
  catBadge: document.getElementById('catBadge'),
  clueText: document.getElementById('clueText'),
  answerInput: document.getElementById('answerInput'),
  errorBox: document.getElementById('errorBox'),
  btnCheck: document.getElementById('btnCheck'),
  btnHint: document.getElementById('btnHint'),
  recordNav: document.getElementById('recordNav'),
  btnPrev: document.getElementById('btnPrev'),
  btnNext: document.getElementById('btnNext'),
  recordLabel: document.getElementById('recordLabel'),
  byteConsole: document.getElementById('byteConsole'),
  btnStart: document.getElementById('btnStart'),
  btnStartTutorial: document.getElementById('btnStartTutorial'),
  btnManual: document.getElementById('btnManual'),
  manualModal: document.getElementById('manualModal'),
  manualList: document.getElementById('manualList'),
  btnCloseManual: document.getElementById('btnCloseManual'),
  btnBoot: document.getElementById('btnBoot'),
  finalXp: document.getElementById('finalXp'),
  finalAttempts: document.getElementById('finalAttempts'),
  finalClass: document.getElementById('finalClass'),
  btnReview: document.getElementById('btnReview'),
  btnPlayAgain: document.getElementById('btnPlayAgain')
};

/* ---------- 5. FUNCOES UTILITARIAS ---------- */
function normalizar(texto) {
  return (texto || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function getRecord(id) {
  return RECORDS.find(function (r) { return r.id === id; });
}

function isDiscovered(id) {
  return state.discovered.indexOf(id) !== -1;
}

function getRecordIndex() {
  for (var i = 0; i < RECORDS.length; i++) {
    if (RECORDS[i].id === state.currentId) { return i; }
  }
  return 0;
}

function addConsole(text, type) {
  var elConsole = document.getElementById('byteConsole');
  var line = document.createElement('div');
  line.className = 'console-line ' + (type || 'info');
  line.textContent = 'BYTE> ' + text;
  elConsole.appendChild(line);
  elConsole.scrollTop = elConsole.scrollHeight;
}

function renderTopbar() {
  document.getElementById('regCount').textContent = String(state.discovered.length);
  document.getElementById('xpDisplay').textContent = String(Math.max(0, state.xp)).padStart(3, '0');
}

function getStageName(count) {
  if (count >= TOTAL_REGISTROS) { return 'SISTEMA PRONTO'; }
  if (count >= 9) { return 'PROCESSAMENTO ATIVO'; }
  if (count >= 6) { return 'COMUNICACAO ATIVA'; }
  if (count >= 3) { return 'MEMORIA ATIVA'; }
  if (count > 0) { return 'RECOVERY...'; }
  return 'AGUARDANDO MANUAL';
}

function updateProgressVisual() {
  var count = state.discovered.length;
  var progress = Math.round((count / TOTAL_REGISTROS) * 100);
  document.getElementById('stageBanner').textContent =
    'PROGRESSO: ' + progress + '% // SISTEMA: ' + getStageName(count);

  var segs = document.querySelectorAll('#progressBar .seg');
  for (var i = 0; i < segs.length; i++) {
    var milestone = parseInt(segs[i].getAttribute('data-milestone'), 10);
    segs[i].classList.toggle('filled', count >= milestone);
  }
}

function getLitSectors() {
  var sectors = {};
  for (var i = 0; i < state.discovered.length; i++) {
    var rec = getRecord(state.discovered[i]);
    sectors[rec.visual] = true;
  }
  return sectors;
}

/* ---------- 5. DESENHO DO BYTE (SPRITE PIXEL ART) ---------- */
var byteState = 'idle';

function setByteState(s) { byteState = s; }

function drawByte(ctx, stateName, now) {
  var legPhase = Math.floor(now / 250) % 2;
  var visorColor = stateName === 'happy' ? '#7D8C5A' : stateName === 'excited' ? '#B07D2B' : stateName === 'think' ? '#C4B89A' : '#6E7A52';
  var accent = stateName === 'happy' ? '#7D8C5A' : stateName === 'excited' ? '#B07D2B' : '#9E4A3A';
  ctx.clearRect(0, 0, 64, 64);
  /* pernas (animacao de marcha) */
  ctx.fillStyle = '#1C1712';
  ctx.fillRect(18, 34 + (legPhase === 1 ? 1 : 0), 5, 12);
  ctx.fillRect(41, 34 + (legPhase === 0 ? 1 : 0), 5, 12);
  /* corpo */
  ctx.fillStyle = '#1C1712';
  ctx.fillRect(20, 24, 24, 11);
  /* peito */
  ctx.fillStyle = accent;
  ctx.fillRect(22, 27, 20, 3);
  /* bracos */
  ctx.fillRect(15, 26, 3, 6);
  ctx.fillRect(46, 26, 3, 6);
  /* cabeca */
  ctx.fillStyle = '#1C1712';
  ctx.fillRect(22, 10, 20, 12);
  /* antena */
  ctx.fillRect(29, 8, 2, 4);
  ctx.fillStyle = visorColor;
  ctx.fillRect(28, 5, 8, 3);
  /* visor LED */
  ctx.fillStyle = visorColor;
  ctx.shadowColor = visorColor;
  ctx.shadowBlur = 8;
  ctx.fillRect(24, 12, 16, 3);
  ctx.shadowBlur = 0;
}

function drawHologram(ctx, opts) {
  var canvas = ctx.canvas;
  var w = canvas.width;
  var h = canvas.height;
  var t = opts.time || 0;
  var lit = opts.litSectors || {};
  var stage = opts.stage || 'AGUARDANDO MANUAL';

  ctx.clearRect(0, 0, w, h);

  /* placa-mãe em wireframe */
  ctx.strokeStyle = 'rgba(125, 140, 90, 0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(20, 25, 320, 120);

  /* setor de memoria */
  if (lit.memory) {
    ctx.strokeStyle = '#6E7A52';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#6E7A52';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(50, 45);
    ctx.lineTo(310, 45);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(50, 62);
    ctx.lineTo(310, 62);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(125, 140, 90, 0.25)';
    ctx.fillRect(70, 38, 30, 16);
    ctx.fillRect(150, 38, 30, 16);
    ctx.fillRect(230, 38, 30, 16);
    ctx.strokeStyle = '#6E7A52';
    ctx.strokeRect(70, 38, 30, 16);
    ctx.strokeRect(150, 38, 30, 16);
    ctx.strokeRect(230, 38, 30, 16);
  } else {
    ctx.strokeStyle = 'rgba(125, 140, 90, 0.12)';
    ctx.beginPath();
    ctx.moveTo(50, 45);
    ctx.lineTo(310, 45);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(50, 62);
    ctx.lineTo(310, 62);
    ctx.stroke();
  }

  /* setor de comunicacao */
  if (lit.communication) {
    var pulse = (Math.sin(t / 200) + 1) / 2;
    for (var i = 0; i < 6; i++) {
      var x1 = 40 + i * 45;
      var x2 = x1 + 20;
      ctx.strokeStyle = '#9E4A3A';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#9E4A3A';
      ctx.shadowBlur = 8 + pulse * 10;
      ctx.beginPath();
      ctx.moveTo(x1, 95);
      ctx.lineTo(x2, 95);
      ctx.stroke();
      var px = x1 + ((t / 30) % 1) * (x2 - x1);
      ctx.fillStyle = '#9E4A3A';
      ctx.fillRect(px - 1, 92, 3, 6);
    }
    ctx.shadowBlur = 0;
  } else {
    for (var j = 0; j < 6; j++) {
      var x1b = 40 + j * 45;
      ctx.strokeStyle = 'rgba(158, 74, 58, 0.12)';
      ctx.beginPath();
      ctx.moveTo(x1b, 95);
      ctx.lineTo(x1b + 20, 95);
      ctx.stroke();
    }
  }

  /* setor de processamento */
  var cpuX = 160, cpuY = 85, cpuS = 50;
  if (lit.processing) {
    var pulse2 = (Math.sin(t / 300) + 1) / 2;
    ctx.strokeStyle = '#6E7A52';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#6E7A52';
    ctx.shadowBlur = 14 + pulse2 * 14;
    ctx.strokeRect(cpuX, cpuY, cpuS, cpuS);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(125, 140, 90, 0.4)';
    ctx.strokeRect(cpuX - 6, cpuY - 6, cpuS + 12, cpuS + 12);
  } else {
    ctx.strokeStyle = 'rgba(125, 140, 90, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(cpuX, cpuY, cpuS, cpuS);
  }

  /* boot final: monitor energizado */
  if (stage === 'SISTEMA PRONTO') {
    ctx.fillStyle = 'rgba(125, 140, 90, 0.08)';
    ctx.fillRect(60, 30, 240, 70);
    ctx.strokeStyle = '#7D8C5A';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#7D8C5A';
    ctx.shadowBlur = 12;
    ctx.strokeRect(60, 30, 240, 70);
    ctx.shadowBlur = 0;
  }
}


/* ---------- 6. LOOP DE ANIMACAO (BYTE + HOLOGRAMA) ---------- */
function updateBenchVisual() {
  var ctx = document.getElementById('hologram').getContext('2d');
  var count = state.discovered.length;
  var sectors = getLitSectors();
  drawHologram(ctx, {
    stage: getStageName(count),
    litSectors: sectors,
    time: performance.now()
  });
}

/* Desenha só o que está visível: antes o jogo redesenhava os dois canvas
   60 vezes por segundo mesmo no portal ou no laboratório, gastando CPU à toa. */
var byteCtx = document.getElementById('byteCanvas').getContext('2d'); // pega o contexto UMA vez só

function animate() {
  var now = performance.now();
  if (!document.getElementById('screenStart').classList.contains('hidden')) {
    drawByte(byteCtx, byteState, now);       // BYTE só aparece na tela inicial
  }
  if (!document.getElementById('screenGame').classList.contains('hidden')) {
    updateBenchVisual();                      // holograma só aparece na tela do jogo
  }
  requestAnimationFrame(animate);
}

/* ---------- 7. TELAS ----------
   showScreen esconde TODA tela (qualquer elemento com class="screen",
   inclusive as do jogo 2) e mostra só a pedida. Assim o game.js não
   precisa conhecer as telas do laboratório. */
function showScreen(name) {
  var ids = {
    start: 'screenStart',
    tutorial: 'screenTutorial',
    game: 'screenGame',
    final: 'screenFinal',
    hub: 'screenHub'
  };
  var screens = document.querySelectorAll('.screen'); // lista de todos os elementos .screen
  for (var i = 0; i < screens.length; i++) {
    screens[i].classList.add('hidden');
  }
  document.getElementById(ids[name]).classList.remove('hidden');
  state.screen = name;
}

/* ---------- 8. CARREGAR REGISTRO ATUAL ---------- */
function loadRecord(id) {
  state.currentId = id;
  state.hintUsed = false;
  var r = getRecord(id);
  document.getElementById('catBadge').textContent = '[' + r.category + ']';
  document.getElementById('clueText').textContent = r.clue;
  document.getElementById('answerInput').value = '';
  document.getElementById('errorBox').classList.add('hidden');
  document.getElementById('recordLabel').textContent = 'REGISTRO ' + r.id + '/12';
  if (isDiscovered(r.id)) {
    setByteState('happy');
    addConsole('Este registro já foi recuperado. Foco, montador!', 'info');
  } else {
    setByteState('idle');
  }
}

/* ---------- 9. LOGICA DO DESAFIO ---------- */
function handleCheck() {
  var r = getRecord(state.currentId);
  var input = document.getElementById('answerInput').value;
  var resp = normalizar(input);
  var correta = resp === r.term || (r.aliases || []).some(function (a) { return resp === normalizar(a); });
  state.attempts++;

  if (correta) {
    if (!isDiscovered(r.id)) {
      state.discovered.push(r.id);
      state.xp += XP_POR_ACERTO;
      addConsole(r.success, 'success');
      setByteState('happy');
      updateProgressVisual();
      renderTopbar();
      updateBenchVisual();
      if (state.discovered.length >= TOTAL_REGISTROS) {
        setTimeout(function () { goFinal(); }, 900);
      }
    } else {
      addConsole('Este registro já foi recuperado. A arquitetura está completa!', 'info');
    }
    document.getElementById('errorBox').classList.add('hidden');
  } else {
    addConsole('ERRO: TERMO NAO IDENTIFICADO. VOLTE A LER A PISTA E TENTE NOVAMENTE.', 'error');
    setByteState('think');
    document.getElementById('errorBox').textContent = 'ERRO: TERMO NAO IDENTIFICADO. BYTE ESTA ANALISANDO...';
    document.getElementById('errorBox').classList.remove('hidden');
  }

  updateProgressVisual();
  renderTopbar();
}

function handleHint() {
  var r = getRecord(state.currentId);
  if (isDiscovered(r.id)) {
    addConsole('REGISTRO JA RECOBRADO! NAO HA DICA PENDINGES.', 'info');
    return;
  }
  if (r.hintCount === undefined) { r.hintCount = 0; }
  if (r.hintCount >= HINT_LIMIT) {
    addConsole('LIMITE DE DICA ALCANCADO PARA ESTE REGISTRO.', 'error');
    return;
  }
  if (state.xp < 15) {
    addConsole('XP INSUFICIENTE PARA SOLICITAR DICA.', 'error');
    return;
  }
  state.xp = Math.max(XP_MINIMO, state.xp - 15);
  r.hintCount = r.hintCount + 1;
  var hintTexto = (r.hints && r.hints.length > 0 && r.hints[r.hintCount - 1]) ? r.hints[r.hintCount - 1] : r.errorHint;
  addConsole('DICA (GASTO: -15 XP): ' + hintTexto, 'warn');
  renderTopbar();
}

/* ---------- 10. MANUAL ---------- */
function renderManual() {
  var list = document.getElementById('manualList');
  list.innerHTML = '';
  for (var i = 0; i < RECORDS.length; i++) {
    var r = RECORDS[i];
    var item = document.createElement('div');
    item.className = 'manual-item' + (isDiscovered(r.id) ? ' known' : ' locked');
    var term = document.createElement('div');
    term.className = 'manual-term';
    term.textContent = isDiscovered(r.id) ? r.term.toUpperCase() : '???';
    var desc = document.createElement('div');
    desc.className = 'manual-desc';
    desc.textContent = isDiscovered(r.id) ? r.success : 'CONCEITO BLOQUEADO';
    item.appendChild(term);
    item.appendChild(desc);
    list.appendChild(item);
  }
}


/* ---------- 11. INICIAR JOGO ---------- */
function shuffleArray(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

function startGame() {
  RECORDS = shuffleArray(RECORDS);
  state.screen = 'game';
  state.xp = 30;
  state.discovered = [];
  state.attempts = 0;
  state.currentId = RECORDS[0].id;
  state.hintUsed = false;
  for (var q = 0; q < RECORDS.length; q++) { RECORDS[q].hintCount = 0; }
  showScreen('game');
  loadRecord(state.currentId);
  renderTopbar();
  updateProgressVisual();
  updateBenchVisual();
  addConsole('Missao iniciada. Recovery de 12 registros na bancada.', 'info');
  setByteState('idle');
}

/* ---------- 12. FINAL DA MISSAO ---------- */
function goFinal() {
  state.screen = 'final';
  document.getElementById('screenFinal').classList.remove('hidden');
  document.getElementById('screenGame').classList.add('hidden');
  document.getElementById('finalReport').classList.remove('hidden');
  document.getElementById('bootScreen').classList.add('hidden');

  document.getElementById('finalXp').textContent = String(Math.max(0, state.xp)).padStart(3, '0');
  document.getElementById('finalAttempts').textContent = String(state.attempts);

  var classification = 'MONTADOR APRENDIZ';
  if (state.xp >= 1000) { classification = 'ARQUITETO MESTRE'; }
  else if (state.xp >= 700) { classification = 'ENGENHEIRO CIBERNETICO'; }
  else if (state.xp >= 400) { classification = 'TECNICO DE SISTEMAS'; }
  document.getElementById('finalClass').textContent = classification;

  setByteState('excited');
}

/* ---------- 13. SEQUENCIA DE BOOT ---------- */
var bootInterval = null;

function startBoot() {
  state.screen = 'boot';
  document.getElementById('screenFinal').classList.remove('hidden');
  document.getElementById('finalReport').classList.add('hidden');
  var bootEl = document.getElementById('bootScreen');
  bootEl.classList.remove('hidden');
  var linesEl = document.getElementById('bootLines');
  linesEl.innerHTML = '';
  var lines = BOOT_LINES.slice();
  var i = 0;
  bootInterval = setInterval(function () {
    var line = document.createElement('div');
    line.className = 'boot-line';
    line.textContent = lines[i];
    linesEl.appendChild(line);
    i++;
    if (i >= lines.length) {
      clearInterval(bootInterval);
      setTimeout(function () {
        bootEl.classList.add('hidden');
        goFinal();
      }, 700);
    }
  }, 450);
}

/* ---------- 14. RESET / REINICIAR ---------- */
function resetGame() {
  state.screen = 'start';
  state.xp = 30;
  state.discovered = [];
  state.attempts = 0;
  state.currentId = 1;
  state.hintUsed = false;
  document.getElementById('byteDialog').innerHTML = '<p>' + MENSAGENS_INICIO.join(' ') + '</p>';
  setByteState('idle');
  showScreen('start');
}

/* ---------- 15. EVENTOS ---------- */

document.getElementById('btnEnterCyber').addEventListener('click', function () {
  showScreen('start');
});

document.getElementById('btnExitHubStart').addEventListener('click', function () {
  showScreen('hub');
});

document.getElementById('btnExitHubFinal').addEventListener('click', function () {
  showScreen('hub');
});

document.getElementById('btnExitHub').addEventListener('click', function () {
  showScreen('hub');
});

document.getElementById('btnStart').addEventListener('click', function () {
  showScreen('tutorial');
});

document.getElementById('btnStartTutorial').addEventListener('click', function () {
  startGame();
});

document.getElementById('btnCheck').addEventListener('click', function () {
  handleCheck();
});

document.getElementById('btnHint').addEventListener('click', function () {
  handleHint();
});

document.getElementById('btnPrev').addEventListener('click', function () {
  var idx = getRecordIndex();
  var novoId = RECORDS[(idx - 1 + RECORDS.length) % RECORDS.length].id;
  loadRecord(novoId);
});

document.getElementById('btnNext').addEventListener('click', function () {
  var idx = getRecordIndex();
  var novoId = RECORDS[(idx + 1) % RECORDS.length].id;
  loadRecord(novoId);
});

document.getElementById('btnManual').addEventListener('click', function () {
  renderManual();
  document.getElementById('manualModal').classList.remove('hidden');
});

document.getElementById('btnCloseManual').addEventListener('click', function () {
  document.getElementById('manualModal').classList.add('hidden');
});

document.getElementById('btnBoot').addEventListener('click', function () {
  startBoot();
});

document.getElementById('btnPlayAgain').addEventListener('click', function () {
  resetGame();
});

document.getElementById('btnReview').addEventListener('click', function () {
  renderManual();
  document.getElementById('manualModal').classList.remove('hidden');
});

document.getElementById('answerInput').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') { handleCheck(); }
});

/* ---------- 16. INICIALIZACAO ---------- */
function init() {
  renderTopbar();
  updateProgressVisual();
  updateBenchVisual();
  setByteState('idle');
  addConsole('Sistema BYTE online. Aguardando montador...', 'info');
  requestAnimationFrame(animate);
}

init();
