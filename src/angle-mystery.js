import './style.css';

const challenges = [
  { id: 'A', triangle: 'ABC', given: [['Góc B', '50°'], ['Góc C', '60°']], answer: 70, kind: 'acute', kindLabel: 'Tam giác nhọn', palette: 'leaf', points: '285,250 120,460 465,460', labels: { A: [285, 230], B: [103, 488], C: [472, 488] }, marks: [['B', '50°', 175, 435], ['C', '60°', 400, 435], ['A', '?', 285, 283]] },
  { id: 'D', triangle: 'FDE', given: [['Góc F', '50°'], ['Góc E', '30°']], answer: 100, kind: 'obtuse', kindLabel: 'Tam giác tù', palette: 'sun', points: '165,275 175,460 500,460', labels: { F: [149, 254], D: [153, 489], E: [509, 489] }, marks: [['F', '50°', 201, 330], ['E', '30°', 438, 434], ['D', '?', 204, 430]] },
  { id: 'P', triangle: 'MNP', given: [['Góc M', '90° (góc vuông)'], ['Góc N', '60°']], answer: 30, kind: 'right', kindLabel: 'Tam giác vuông', palette: 'violet', points: '285,250 115,460 470,460', labels: { M: [285, 230], N: [97, 489], P: [480, 489] }, marks: [['M', '90°', 285, 306], ['N', '60°', 173, 431], ['P', '?', 415, 431]] },
];

const root = document.querySelector('#angle-root');
root.innerHTML = `
  <main class="angle-app">
    <article class="angle-sheet">
      <header class="angle-banner">
        <div class="banner-plaque"><span class="plaque-icon">△</span><span>PHIẾU HỌC TẬP</span></div>
        <div class="banner-title"><span>ĐỘI ĐẶC NHIỆM</span><h1>GIẢI MÃ GÓC</h1><p>Vận dụng định lý tổng ba góc trong một tam giác</p></div>
        <div class="banner-student"><b>TOÁN LỚP 7</b><span>Họ và tên: <strong id="angle-student">................................</strong></span><span>Lớp: <strong id="angle-class">.............</strong></span><div class="angle-media"><span class="time-ribbon" id="angle-timer">03:00</span><button id="angle-music-toggle" class="music-toggle" type="button" aria-pressed="true">♫ Nhạc: bật</button><label class="volume-control" title="Âm lượng">🔈<input id="angle-volume" type="range" min="0" max="1" step="0.05" value="0.35" aria-label="Âm lượng nhạc" /></label></div></div>
      </header>
      <div class="angle-mission"><span aria-hidden="true">🧭</span><div><strong>Nhiệm vụ:</strong> Tính góc còn thiếu trong mỗi tam giác, rồi xác định tam giác đó là tam giác nhọn, tam giác tù hay tam giác vuông.<small>Nhập số và chữ, không cần gõ ký hiệu độ (°).</small></div><div class="angle-progress"><b id="angle-progress">0 / 6</b><span>ô đã điền</span><i><em id="angle-progress-bar"></em></i></div></div>
      <section class="challenge-grid" aria-label="Ba nhiệm vụ giải mã góc">${challenges.map((item, index) => `
        <article class="challenge-card ${item.palette}">
          <header class="challenge-heading"><span class="challenge-badge">${index + 1}</span><div><small>NHIỆM VỤ ${index + 1}</small><h2>Giải mã góc ${item.id}</h2></div><span class="sparkle" aria-hidden="true">✦</span></header>
          <div class="challenge-body">
            <p class="given-intro">Cho tam giác <b>${item.triangle}</b> có:</p>
            <ul class="given-list">${item.given.map(([label, value]) => `<li><span>${label}</span><b>${value}</b></li>`).join('')}</ul>
            <div class="triangle-card"><svg viewBox="0 0 620 520" role="img" aria-label="Hình tam giác ${item.triangle} với các góc đã cho">${triangleSvg(item)}</svg></div>
            <div class="answer-card">
              <label class="angle-answer-label" for="angle-value-${item.id}"><span>☞</span> Đáp án: Góc ${item.id} =</label>
              <div class="angle-input-line"><input id="angle-value-${item.id}" data-angle="${item.id}" type="number" min="0" max="180" inputmode="numeric" aria-label="Số đo góc ${item.id}" autocomplete="off" /><span>°</span></div>
              <label class="kind-answer-label" for="angle-kind-${item.id}">Tam giác</label>
              <select id="angle-kind-${item.id}" data-kind="${item.id}" aria-label="Loại tam giác ${item.triangle}"><option value="">Chọn loại tam giác</option><option value="acute">Tam giác nhọn</option><option value="obtuse">Tam giác tù</option><option value="right">Tam giác vuông</option></select>
            </div>
            <div class="card-feedback" id="feedback-${item.id}" aria-live="polite">Tính tổng ba góc bằng 180° nhé!</div>
          </div>
        </article>`).join('')}</section>
      <section class="angle-submit-panel"><div class="submit-emblem" aria-hidden="true">🏆</div><div class="submit-copy"><h2>Hoàn thành nhiệm vụ</h2><p id="angle-result-message" aria-live="polite">Điền 6 ô trả lời rồi nộp bài để xem điểm.</p></div><div class="submit-actions"><button id="angle-reset" class="reset-button" type="button">Làm lại</button><button id="angle-submit" class="submit-button" type="button">Nộp bài <span aria-hidden="true">→</span></button></div></section>
      <footer class="angle-footer"><span>△</span> Bình tĩnh suy luận — chinh phục cả ba thử thách! <span>△</span></footer>
    </article>
  </main>
  <div class="start-overlay" id="angle-start-overlay" role="dialog" aria-modal="true" aria-labelledby="angle-start-title"><form class="start-card" id="angle-start-form"><div class="start-mark" aria-hidden="true">✦</div><p class="start-eyebrow">SẴN SÀNG CHƯA?</p><h2 id="angle-start-title">Bắt đầu giải mã</h2><p class="start-copy">Nhập thông tin để lưu kết quả cho giáo viên.</p><label class="name-label" for="angle-name">Họ và tên</label><input id="angle-name" maxlength="60" autocomplete="name" placeholder="Ví dụ: Nguyễn Minh Anh" required /><label class="name-label" for="angle-class-input">Lớp</label><input id="angle-class-input" maxlength="40" placeholder="Ví dụ: 7A" /><button class="start-button" id="angle-start-button" type="submit" disabled>Bắt đầu làm bài <span aria-hidden="true">→</span></button><p class="privacy-note">Tên, lớp, câu trả lời và điểm sẽ được gửi cho giáo viên.</p></form></div>
  <audio id="angle-music" src="/olympia-countdown.mp3" preload="auto" loop></audio>
`;

function triangleSvg(item) {
  const [a, b, c] = item.points.split(' ').map((point) => point.split(',').map(Number));
  const vertexKeys = Object.keys(item.labels);
  const positions = Object.fromEntries(vertexKeys.map((key, index) => [key, [a, b, c][index]]));
  return `<defs><linearGradient id="water-${item.id}" x2="0" y2="1"><stop stop-color="#c4f1ff"/><stop offset="1" stop-color="#86d9f7"/></linearGradient></defs><rect x="8" y="8" width="604" height="504" rx="26" fill="#f7fdff"/><path d="M${item.points.replaceAll(' ', 'L')}Z" fill="url(#water-${item.id})" stroke="#173b86" stroke-width="8" stroke-linejoin="round"/><path d="M${item.points.replaceAll(' ', 'L')}Z" fill="none" stroke="#fff" stroke-width="2" opacity=".55"/>${Object.entries(item.labels).map(([letter, [x, y]]) => `<text x="${x}" y="${y}" class="vertex-label">${letter}</text>`).join('')}${item.marks.map(([vertex, value, x, y]) => `<g class="angle-mark" transform="translate(${positions[vertex][0]} ${positions[vertex][1]})"><circle r="26" fill="#fff5ad" stroke="#ffc62e" stroke-width="5"/><text x="${x - positions[vertex][0]}" y="${y - positions[vertex][1] + 7}" text-anchor="middle">${value}</text></g>`).join('')}</svg>`;
}

const music = document.querySelector('#angle-music');
const volume = document.querySelector('#angle-volume');
const musicToggle = document.querySelector('#angle-music-toggle');
const timerDisplay = document.querySelector('#angle-timer');
const angleInputs = [...document.querySelectorAll('[data-angle]')];
const kindInputs = [...document.querySelectorAll('[data-kind]')];
const resultMessage = document.querySelector('#angle-result-message');
let studentName = '';
let studentClass = '';
let secondsRemaining = 180;
let timerInterval = null;
let started = false;
let submitted = false;
let submissionSent = false;
let musicEnabled = true;

function updateTimer() {
  timerDisplay.textContent = `${String(Math.floor(secondsRemaining / 60)).padStart(2, '0')}:${String(secondsRemaining % 60).padStart(2, '0')}`;
  timerDisplay.classList.toggle('time-warning', secondsRemaining <= 30);
}

function updateProgress() {
  const filled = [...angleInputs, ...kindInputs].filter((input) => input.value !== '').length;
  document.querySelector('#angle-progress').textContent = `${filled} / 6`;
  document.querySelector('#angle-progress-bar').style.width = `${filled / 6 * 100}%`;
}

function updateMusicButton() {
  musicToggle.textContent = musicEnabled ? '♫ Nhạc: bật' : '♫ Nhạc: tắt';
  musicToggle.setAttribute('aria-pressed', String(musicEnabled));
}

function playMusic() {
  if (!musicEnabled) return;
  music.volume = Number(volume.value);
  music.play().catch(() => {
    musicEnabled = false;
    updateMusicButton();
  });
}

function scoreAnswers() {
  return challenges.flatMap((challenge) => {
    const angle = document.querySelector(`[data-angle="${challenge.id}"]`).value;
    const kind = document.querySelector(`[data-kind="${challenge.id}"]`).value;
    return [Number(angle) === challenge.answer, kind === challenge.kind];
  });
}

function scoreLabel() {
  const flags = scoreAnswers();
  const correct = flags.filter(Boolean).length;
  const score = Math.round((correct / 6 * 100)) / 10;
  return { flags, correct, score };
}

async function saveSubmission() {
  if (submissionSent) return;
  submissionSent = true;
  const { flags, correct, score } = scoreLabel();
  resultMessage.textContent = `Điểm: ${score}/10 · đúng ${correct}/6 ý. Đang gửi bài cho giáo viên…`;
  resultMessage.className = 'is-hint';
  try {
    const apiBase = import.meta.env.VITE_API_URL || '';
    const response = await fetch(`${apiBase}/api/submissions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exerciseId: 'angle-mystery', name: studentName, studentClass, score, correctCount: correct, answers: challenges.map((challenge) => ({ triangle: challenge.triangle, angle: document.querySelector(`[data-angle="${challenge.id}"]`).value, kind: document.querySelector(`[data-kind="${challenge.id}"]`).value })), elapsedSeconds: 180 - secondsRemaining }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Không gửi được bài.');
    resultMessage.textContent = `${studentName} · Điểm: ${score}/10 · đúng ${correct}/6 ý. Đã gửi bài cho giáo viên.`;
    resultMessage.className = correct === 6 ? 'is-success' : 'is-hint';
  } catch (error) {
    submissionSent = false;
    resultMessage.textContent = `${studentName} · Điểm: ${score}/10 · đúng ${correct}/6 ý. ${error.message} Hãy kiểm tra kết nối rồi bấm gửi lại.`;
    resultMessage.className = 'is-hint';
    const retry = document.querySelector('#angle-retry');
    if (!retry) {
      const button = document.createElement('button');
      button.id = 'angle-retry'; button.type = 'button'; button.className = 'submit-button'; button.textContent = 'Gửi lại cho giáo viên';
      button.addEventListener('click', saveSubmission);
      document.querySelector('.angle-submit-panel').append(button);
    }
  }
}

function finishExercise(prefix = '') {
  if (submitted) return;
  submitted = true;
  window.clearInterval(timerInterval);
  timerInterval = null;
  music.pause();
  const { flags, correct, score } = scoreLabel();
  challenges.forEach((challenge, index) => {
    const answerInput = document.querySelector(`[data-angle="${challenge.id}"]`);
    const kindInput = document.querySelector(`[data-kind="${challenge.id}"]`);
    answerInput.disabled = true;
    kindInput.disabled = true;
    answerInput.classList.toggle('answer-correct', flags[index * 2]);
    answerInput.classList.toggle('answer-wrong', !flags[index * 2]);
    kindInput.classList.toggle('answer-correct', flags[index * 2 + 1]);
    kindInput.classList.toggle('answer-wrong', !flags[index * 2 + 1]);
    const feedback = document.querySelector(`#feedback-${challenge.id}`);
    feedback.textContent = `${flags[index * 2] ? '✓' : `✗ Đáp án đúng: ${challenge.answer}°`} · ${flags[index * 2 + 1] ? '✓' : `✗ ${challenge.kindLabel}`}`;
    feedback.classList.add(flags[index * 2] && flags[index * 2 + 1] ? 'feedback-correct' : 'feedback-wrong');
  });
  resultMessage.textContent = `${prefix}${studentName ? `${studentName} · ` : ''}Điểm: ${score}/10 · đúng ${correct}/6 ý.`;
  resultMessage.className = correct === 6 ? 'is-success' : 'is-hint';
  document.querySelector('#angle-submit').disabled = true;
  saveSubmission();
}

document.querySelector('#angle-start-form').addEventListener('submit', (event) => {
  event.preventDefault();
  studentName = document.querySelector('#angle-name').value.trim();
  studentClass = document.querySelector('#angle-class-input').value.trim();
  if (!studentName) return;
  document.querySelector('#angle-student').textContent = studentName;
  document.querySelector('#angle-class').textContent = studentClass || '—';
  document.querySelector('#angle-start-overlay').classList.add('is-hidden');
  started = true;
  timerInterval = window.setInterval(() => {
    secondsRemaining = Math.max(0, secondsRemaining - 1);
    updateTimer();
    if (secondsRemaining === 0) finishExercise('Hết giờ! ');
  }, 1000);
  playMusic();
  angleInputs[0].focus({ preventScroll: true });
});

document.querySelector('#angle-name').addEventListener('input', (event) => {
  document.querySelector('#angle-start-button').disabled = !event.target.value.trim();
});
[...angleInputs, ...kindInputs].forEach((input) => input.addEventListener('input', updateProgress));
document.querySelector('#angle-submit').addEventListener('click', () => finishExercise());
document.querySelector('#angle-reset').addEventListener('click', () => {
  if (submitted) return;
  [...angleInputs, ...kindInputs].forEach((input) => { input.value = ''; input.classList.remove('answer-correct', 'answer-wrong'); });
  updateProgress();
  resultMessage.textContent = 'Điền 6 ô trả lời rồi nộp bài để xem điểm.';
  resultMessage.className = '';
});
musicToggle.addEventListener('click', () => {
  musicEnabled = !musicEnabled;
  updateMusicButton();
  if (musicEnabled && started && !submitted) playMusic(); else music.pause();
});
volume.addEventListener('input', () => { music.volume = Number(volume.value); });

music.volume = Number(volume.value);
updateTimer();
updateProgress();
updateMusicButton();
