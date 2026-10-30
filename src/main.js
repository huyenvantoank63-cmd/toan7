import './style.css';

const answers = [
  { id: 'straight-angle', text: 'xÂB + BÂC + CÂy = xÂy = 180°' },
  { id: 'distractor', text: 'Vì xy ∥ BC nên CÂB = AĈB (so le trong)' },
  { id: 'parallel-line', text: 'Qua A kẻ đường thẳng xy ∥ BC' },
  { id: 'lower-alternate', text: 'Vì xy ∥ BC nên yÂC = AĈB (so le trong)' },
  { id: 'upper-alternate', text: 'Vì xy ∥ BC nên xÂB = AB̂C (so le trong)' },
  { id: 'conclusion', text: 'Suy ra AB̂C + BÂC + AĈB = 180°' },
];

const steps = [
  { step: 'Bước 1', label: 'Dựng đường thẳng song song', slots: [0] },
  { step: 'Bước 2', label: 'Cặp góc so le trong', slots: [1, 2] },
  { step: 'Bước 3', label: 'Tổng góc trên đường thẳng xy', slots: [3] },
  { step: 'Bước 4', label: 'Kết luận', slots: [4] },
];

const correct = ['parallel-line', 'upper-alternate', 'lower-alternate', 'straight-angle', 'conclusion'];
const placements = Array(5).fill(null);
let selectedAnswer = null;
let submitted = false;
let studentName = '';
let discardedAnswer = null;

const triangleScene = `
  <svg class="scene-svg" viewBox="0 0 640 410" role="img" aria-labelledby="scene-title scene-desc">
    <title id="scene-title">Tam giác ABC và đường thẳng xy song song với BC</title>
    <desc id="scene-desc">Qua đỉnh A kẻ đường thẳng xy song song với cạnh BC để chứng minh tổng ba góc trong tam giác bằng 180 độ.</desc>
    <defs>
      <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#cfe5e7" stroke-width=".7" opacity=".55"/></pattern>
    </defs>
    <rect width="640" height="410" rx="8" fill="#f8fcf8"/><rect width="640" height="410" rx="8" fill="url(#grid)"/>
    <text x="28" y="36" fill="#547461" font-family="Segoe UI, Arial, sans-serif" font-size="15" font-weight="700">Xét hình vẽ</text>
    <!-- xy qua A, song song với cạnh BC -->
    <path d="M78 143H560" stroke="#2879a6" stroke-width="4" stroke-linecap="round"/>
    <!-- tam giác ABC, vẽ lệch tâm để không gợi ý các góc bằng nhau -->
    <path d="M144 331L270 143L503 331Z" fill="#fffdf5" fill-opacity=".62" stroke="#284f78" stroke-width="4" stroke-linejoin="round"/>
    <g fill="#284f78"><circle cx="270" cy="143" r="5"/><circle cx="144" cy="331" r="5"/><circle cx="503" cy="331" r="5"/></g>
    <g font-family="Segoe UI, Arial, sans-serif" font-size="21" font-weight="800" paint-order="stroke" stroke="#f8fcf8" stroke-width="6" stroke-linejoin="round">
      <text x="67" y="136" fill="#284f78">x</text><text x="565" y="136" fill="#284f78">y</text>
      <text x="263" y="124" fill="#284f78">A</text><text x="126" y="359" fill="#284f78">B</text><text x="505" y="359" fill="#284f78">C</text>
    </g>
    <text x="27" y="389" fill="#6e839b" font-family="Segoe UI, Arial, sans-serif" font-size="13">xy // BC</text>
  </svg>`;

document.querySelector('#root').innerHTML = `
  <main class="app-shell">
    <article class="worksheet-sheet">
      <header class="sheet-banner">
        <div class="sheet-title">
          <span class="sheet-kicker">PHIẾU HỌC TẬP</span>
          <h1>GIẢI MÃ CHỨNG MINH</h1>
          <span class="sheet-subtitle">Định lý tổng ba góc trong một tam giác</span>
        </div>
        <div class="sheet-meta">
          <span class="grade-ribbon">TOÁN LỚP 7</span>
          <span class="meta-line">Họ và tên: <strong id="student-banner">................................</strong></span>
          <span class="meta-line">Lớp: <strong>.............</strong></span>
          <div class="media-controls">
            <span class="time-ribbon" id="timer-countdown" aria-label="Thời gian còn lại">03:00</span>
            <button class="music-toggle" id="music-toggle" type="button" aria-pressed="true">♫ Nhạc: bật</button>
            <label class="volume-control" title="Âm lượng">🔈<input id="music-volume" type="range" min="0" max="1" step="0.05" value="0.35" aria-label="Âm lượng nhạc" /></label>
          </div>
        </div>
      </header>

      <section class="instruction-strip">
        <div><strong>Nhiệm vụ:</strong> Hoàn thành sơ đồ chứng minh. Kéo thẻ đáp án hoặc chạm thẻ rồi chạm ô trả lời.</div>
        <div class="progress-mini"><strong id="progress-count">0 / 5</strong><span>đã xếp</span><div class="progress-track"><i id="progress-bar"></i></div></div>
      </section>

      <section class="sheet-top-grid" aria-label="Đề bài">
        <section class="worksheet-block diagram-block">
          <header class="block-heading heading-blue"><span>1</span> XÉT HÌNH VẼ</header>
          <div class="scene-wrap">${triangleScene}</div>
        </section>

        <section class="worksheet-block givens-block">
          <header class="block-heading heading-green"><span>2</span> GIẢ THIẾT &amp; KẾT LUẬN</header>
          <div class="given-content">
            <strong>Giả thiết</strong>
            <p>Cho tam giác ABC.</p>
            <strong>Kết luận</strong>
            <p>Tổng ba góc trong tam giác ABC bằng 180°.</p>
            <strong>Gợi ý</strong>
            <p>Vẽ đường thẳng xy // BC.</p>
            <div class="equation-card">${formatAngleNotation('AB̂C + BÂC + AĈB = 180°')}</div>
          </div>
        </section>
      </section>

      <section class="sheet-bottom-grid" aria-label="Thẻ đáp án, sơ đồ lời giải và khu vực loại bỏ">
        <section class="worksheet-block choices-block">
          <header class="block-heading heading-yellow"><span>3</span><div>6 THẺ MỆNH ĐỀ<small>Chạm thẻ rồi chạm ô, hoặc kéo thả</small></div></header>
          <div class="answer-bank" id="answer-bank" tabindex="-1"></div>
        </section>
        <section class="worksheet-block proof-block">
          <header class="block-heading heading-teal"><span>4</span> SƠ ĐỒ CHỨNG MINH</header>
          <div class="proof-caption">Chọn hoặc kéo thẻ vào từng ô. Nộp bài để chấm điểm (2 điểm/ô).</div>
          <div class="work-list" id="work-list"></div>
          <div class="submit-row"><p id="result-message" aria-live="polite">Hoàn thành 5 ô rồi nộp bài để chấm điểm.</p><div><button class="reset-button" id="reset-button" type="button">Làm lại</button><button class="submit-button" id="submit-button" type="button">Nộp bài <span aria-hidden="true">→</span></button></div></div>
        </section>
        <section class="worksheet-block discard-panel">
          <header class="block-heading heading-coral"><span>5</span> KHU VỰC LOẠI BỎ</header>
          <p>Thả thẻ mệnh đề không phù hợp vào đây.</p>
          <button class="discard-zone" id="discard-zone" type="button" aria-label="Khu vực loại bỏ, thả thẻ sai vào đây"><span id="discard-content">Thả thẻ sai vào đây</span></button>
        </section>
      </section>
      <footer class="sheet-footer"><span>✿</span> Cùng suy luận từng bước nhé! <span>✿</span></footer>
    </article>
  </main>

  <div class="start-overlay" id="start-overlay" role="dialog" aria-modal="true" aria-labelledby="start-title">
    <form class="start-card" id="start-form">
      <div class="start-mark" aria-hidden="true">✦</div><p class="start-eyebrow">SẴN SÀNG CHƯA?</p><h2 id="start-title">Bắt đầu làm bài</h2><p class="start-copy">Nhập tên để lưu tên trên màn hình kết quả.</p>
      <label class="name-label" for="student-name">Họ và tên</label><input id="student-name" name="studentName" maxlength="60" autocomplete="name" placeholder="Ví dụ: Nguyễn Minh Anh" required />
      <button class="start-button" id="start-button" type="submit" disabled>Bắt đầu làm bài <span aria-hidden="true">→</span></button>
      <p class="privacy-note">Tên chỉ hiển thị trong phiên học này.</p>
    </form>
  </div>
  <audio id="worksheet-music" src="/olympia-countdown.mp3" preload="auto" loop></audio>
`;

const root = document.querySelector('#root');
const bank = document.querySelector('#answer-bank');
const workList = document.querySelector('#work-list');
const discardZone = document.querySelector('#discard-zone');
const nameInput = document.querySelector('#student-name');
const startButton = document.querySelector('#start-button');
const music = document.querySelector('#worksheet-music');
const musicToggle = document.querySelector('#music-toggle');
const musicVolume = document.querySelector('#music-volume');
const timerDisplay = document.querySelector('#timer-countdown');
let secondsRemaining = 180;
let timerInterval = null;
let exerciseStarted = false;
let musicEnabled = true;

function updateTimerDisplay() {
  const minutes = Math.floor(secondsRemaining / 60).toString().padStart(2, '0');
  const seconds = (secondsRemaining % 60).toString().padStart(2, '0');
  timerDisplay.textContent = `${minutes}:${seconds}`;
  timerDisplay.classList.toggle('time-warning', secondsRemaining <= 30);
}

function formatAngleNotation(text) {
  return text
    .replaceAll('Â', 'Â')
    .replace(/([ABCxy])([ABCxy])̂([ABCxy])/g, '<span class="angle-term">$1$2$3</span>');
}

function getScoreSummary(prefix = '') {
  const score = placements.reduce((sum, answer, index) => sum + Number(answer === correct[index]), 0);
  const missing = placements.filter((answer) => !answer).length;
  return `${prefix}Kết quả: ${score * 2}/10 điểm · đúng ${score}/${placements.length} ô${missing ? ` · còn trống ${missing} ô` : ''}.`;
}

function setMusicButton() {
  musicToggle.textContent = musicEnabled ? '♫ Nhạc: bật' : '♫ Nhạc: tắt';
  musicToggle.setAttribute('aria-pressed', String(musicEnabled));
}

function playMusic() {
  if (!musicEnabled) return;
  music.volume = Number(musicVolume.value);
  music.play().catch(() => {
    musicEnabled = false;
    setMusicButton();
  });
}

function stopTimer() {
  if (timerInterval !== null) {
    window.clearInterval(timerInterval);
    timerInterval = null;
  }
}

function startTimer() {
  stopTimer();
  secondsRemaining = 180;
  updateTimerDisplay();
  timerInterval = window.setInterval(() => {
    secondsRemaining = Math.max(0, secondsRemaining - 1);
    updateTimerDisplay();
    if (secondsRemaining === 0) {
      stopTimer();
      submitted = true;
      render();
      const resultMessage = document.querySelector('#result-message');
      resultMessage.textContent = getScoreSummary('Hết giờ! ');
      resultMessage.className = 'result-message is-hint';
      music.pause();
    }
  }, 1000);
}

function render() {
  const used = new Set([...placements, discardedAnswer].filter(Boolean));
  bank.innerHTML = answers.map((answer, index) => {
    const isUsed = used.has(answer.id);
    const isSelected = selectedAnswer === answer.id;
    return `<button class="answer-chip ${isUsed ? 'is-used' : ''} ${isSelected ? 'is-selected' : ''}" type="button" draggable="${!isUsed && !submitted}" data-answer="${answer.id}" aria-pressed="${isSelected}" ${isUsed || submitted ? 'disabled' : ''}><span class="chip-index">${String(index + 1).padStart(2, '0')}</span><span>${formatAngleNotation(answer.text)}</span></button>`;
  }).join('');

  workList.innerHTML = steps.map((step) => {
    const slots = step.slots.map((index) => {
      const answerId = placements[index];
      const answer = answers.find((item) => item.id === answerId);
      const stateClass = submitted ? (answerId === correct[index] ? 'is-correct' : 'is-wrong') : '';
      return `<button class="drop-slot ${answer ? 'has-answer' : ''} ${stateClass}" type="button" data-slot="${index}" aria-label="${step.step}, ô ${index + 1}: ${answer ? answer.text : 'ô trả lời trống'}" ${submitted ? 'disabled' : ''}>${answer ? `<span>${formatAngleNotation(answer.text)}</span><span class="clear-slot" aria-hidden="true">×</span>` : '<span class="slot-hint">Thả mệnh đề vào đây <b>＋</b></span>'}</button>`;
    }).join('');
    return `<div class="work-row"><div class="work-row-head"><span class="step-num">${step.step}</span><span class="prompt-text">${step.label}</span></div><div class="drop-slots ${step.slots.length > 1 ? 'two-slots' : ''}">${slots}</div></div>`;
  }).join('');

  const discarded = answers.find((answer) => answer.id === discardedAnswer);
  discardZone.classList.toggle('has-discard', Boolean(discarded));
  discardZone.classList.toggle('is-correct', submitted && discardedAnswer === 'distractor');
  discardZone.classList.toggle('is-wrong', submitted && discardedAnswer !== 'distractor');
  document.querySelector('#discard-content').innerHTML = discarded
    ? `<span>${formatAngleNotation(discarded.text)}</span><b class="clear-discard" aria-hidden="true">×</b>`
    : '<span>Thả thẻ sai vào đây</span>';

  const filled = placements.filter(Boolean).length;
  document.querySelector('#progress-count').textContent = `${filled} / ${placements.length}`;
  document.querySelector('#progress-bar').style.width = `${filled * 100 / placements.length}%`;
  document.querySelector('#answer-count').textContent = `${answers.length - used.size} thẻ còn lại`;
  document.querySelector('#submit-button').disabled = submitted;
  document.querySelector('#reset-button').disabled = false;
}

function placeAnswer(slotIndex, answerId) {
  if (submitted || !answerId) return;
  const source = answers.find((item) => item.id === answerId);
  if (!source) return;
  if (discardedAnswer === answerId) discardedAnswer = null;
  for (let i = 0; i < placements.length; i += 1) {
    if (placements[i] === answerId) placements[i] = null;
  }
  placements[slotIndex] = answerId;
  selectedAnswer = null;
  render();
}

function discardAnswer(answerId) {
  if (submitted || !answers.some((item) => item.id === answerId)) return;
  for (let i = 0; i < placements.length; i += 1) {
    if (placements[i] === answerId) placements[i] = null;
  }
  discardedAnswer = answerId;
  selectedAnswer = null;
  render();
}

bank.addEventListener('click', (event) => {
  const chip = event.target.closest('[data-answer]');
  if (!chip || chip.disabled || submitted) return;
  selectedAnswer = selectedAnswer === chip.dataset.answer ? null : chip.dataset.answer;
  render();
});

bank.addEventListener('dragstart', (event) => {
  const chip = event.target.closest('[data-answer]');
  if (!chip || chip.disabled) return;
  event.dataTransfer.setData('text/plain', chip.dataset.answer);
  event.dataTransfer.effectAllowed = 'move';
  selectedAnswer = chip.dataset.answer;
  chip.classList.add('is-dragging');
});
bank.addEventListener('dragend', (event) => event.target.closest('[data-answer]')?.classList.remove('is-dragging'));

workList.addEventListener('click', (event) => {
  const slot = event.target.closest('[data-slot]');
  if (!slot) return;
  const slotIndex = Number(slot.dataset.slot);
  if (event.target.closest('.clear-slot')) {
    placements[slotIndex] = null;
    selectedAnswer = null;
    render();
    return;
  }
  if (selectedAnswer) {
    placeAnswer(slotIndex, selectedAnswer);
    return;
  }
  if (placements[slotIndex]) {
    selectedAnswer = placements[slotIndex];
    placements[slotIndex] = null;
    render();
  }
});

workList.addEventListener('dragover', (event) => {
  const slot = event.target.closest('[data-slot]');
  if (slot && !submitted) { event.preventDefault(); slot.classList.add('is-over'); }
});
workList.addEventListener('dragleave', (event) => event.target.closest('[data-slot]')?.classList.remove('is-over'));
workList.addEventListener('drop', (event) => {
  const slot = event.target.closest('[data-slot]');
  if (!slot || submitted) return;
  event.preventDefault();
  slot.classList.remove('is-over');
  placeAnswer(Number(slot.dataset.slot), event.dataTransfer.getData('text/plain'));
});

discardZone.addEventListener('click', (event) => {
  if (submitted) return;
  if (event.target.closest('.clear-discard')) {
    discardedAnswer = null;
    render();
  } else if (selectedAnswer) {
    discardAnswer(selectedAnswer);
  } else if (discardedAnswer) {
    discardedAnswer = null;
    render();
  }
});
discardZone.addEventListener('dragover', (event) => {
  if (!submitted) { event.preventDefault(); discardZone.classList.add('is-over'); }
});
discardZone.addEventListener('dragleave', () => discardZone.classList.remove('is-over'));
discardZone.addEventListener('drop', (event) => {
  if (submitted) return;
  event.preventDefault();
  discardZone.classList.remove('is-over');
  discardAnswer(event.dataTransfer.getData('text/plain'));
});

document.querySelector('#submit-button').addEventListener('click', () => {
  const message = document.querySelector('#result-message');
  submitted = true;
  stopTimer();
  const score = placements.reduce((sum, answer, index) => sum + Number(answer === correct[index]), 0);
  render();
  const discardResult = discardedAnswer === 'distractor'
    ? 'Đã loại đúng thẻ nhiễu.'
    : discardedAnswer
      ? 'Thẻ trong khu vực loại bỏ chưa phải thẻ nhiễu.'
      : 'Bạn chưa loại bỏ thẻ nhiễu.';
  message.textContent = `${studentName ? `${studentName} · ` : ''}${getScoreSummary()} ${discardResult}`;
  message.className = `result-message ${score === placements.length && discardedAnswer === 'distractor' ? 'is-success' : 'is-hint'}`;
  music.pause();
});

document.querySelector('#reset-button').addEventListener('click', () => {
  placements.fill(null);
  selectedAnswer = null;
  submitted = false;
  discardedAnswer = null;
  if (exerciseStarted) {
    startTimer();
    playMusic();
  } else {
    secondsRemaining = 180;
    updateTimerDisplay();
  }
  const message = document.querySelector('#result-message');
  message.textContent = 'Hoàn thành 5 ô rồi nộp bài để chấm điểm.';
  message.className = '';
  render();
});

nameInput.addEventListener('input', () => {
  startButton.disabled = !nameInput.value.trim();
});

document.querySelector('#start-form').addEventListener('submit', (event) => {
  event.preventDefault();
  studentName = nameInput.value.trim();
  if (!studentName) return;
  document.querySelector('#student-banner').textContent = studentName;
  document.querySelector('#start-overlay').classList.add('is-hidden');
  exerciseStarted = true;
  startTimer();
  playMusic();
  document.querySelector('#answer-bank').focus({ preventScroll: true });
});

musicToggle.addEventListener('click', () => {
  musicEnabled = !musicEnabled;
  setMusicButton();
  if (musicEnabled && exerciseStarted) playMusic();
  else music.pause();
});

musicVolume.addEventListener('input', () => {
  music.volume = Number(musicVolume.value);
});

music.volume = Number(musicVolume.value);
updateTimerDisplay();
setMusicButton();
render();
