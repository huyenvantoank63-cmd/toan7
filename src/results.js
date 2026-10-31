import './style.css';

const apiBase = import.meta.env.VITE_API_URL || '';
const root = document.querySelector('#results-root');
const answerLabels = {
  'straight-angle': '∠xAB + ∠BAC + ∠CAy = ∠xAy = 180°',
  distractor: 'Vì xy ∥ BC nên ∠CAB = ∠ACB (so le trong)',
  'parallel-line': 'Qua A kẻ đường thẳng xy ∥ BC',
  'lower-alternate': 'Vì xy ∥ BC nên ∠yAC = ∠ACB (so le trong)',
  'upper-alternate': 'Vì xy ∥ BC nên ∠xAB = ∠ABC (so le trong)',
  conclusion: 'Suy ra ∠ABC + ∠BAC + ∠ACB = 180°',
};

root.innerHTML = `
  <main class="results-page">
    <header class="results-header">
      <a class="results-back" href="/">← Về phiếu học tập</a>
      <span class="sheet-kicker">PHIẾU HỌC TẬP · TOÁN 7</span>
      <h1>Kết quả bài làm</h1>
      <p>Theo dõi điểm số và câu trả lời của các phiếu học tập đã nộp.</p>
    </header>
    <section class="results-card">
      <form id="teacher-login" class="teacher-login">
        <label for="teacher-password">Mã giáo viên</label>
        <input id="teacher-password" type="password" autocomplete="current-password" minlength="8" required placeholder="Nhập mã giáo viên" />
        <button class="results-button" type="submit">Xem kết quả</button>
      </form>
      <div class="results-toolbar">
        <strong id="submission-count">0 bài nộp</strong>
        <div>
          <button class="results-button secondary" id="refresh-results" type="button">Tải lại</button>
          <button class="results-button danger" id="clear-results" type="button">Xóa tất cả</button>
        </div>
      </div>
      <p class="results-status" id="results-status" role="status">Nhập mã giáo viên để xem bài làm.</p>
      <div class="results-table-wrap">
        <table class="results-table">
          <thead><tr><th>Học sinh</th><th>Lớp</th><th>Điểm</th><th>Đúng</th><th>Thời gian</th><th>Đáp án đã xếp</th><th>Nộp lúc</th></tr></thead>
          <tbody id="results-body"><tr><td colspan="7" class="empty-results">Chưa tải dữ liệu.</td></tr></tbody>
        </table>
      </div>
    </section>
    <footer class="results-footer">Bài nộp được lưu tập trung trên Render Postgres.</footer>
  </main>
  <div class="submission-modal" id="submission-modal" hidden role="dialog" aria-modal="true" aria-labelledby="submission-modal-title">
    <section class="submission-modal-card"><header class="submission-modal-header"><div><span class="sheet-kicker">BÀI LÀM HỌC SINH</span><h2 id="submission-modal-title">Phiếu đã nộp</h2></div><button class="submission-close" id="submission-close" type="button" aria-label="Đóng">×</button></header><div id="submission-preview"></div></section>
  </div>
`;

const form = document.querySelector('#teacher-login');
const passwordInput = document.querySelector('#teacher-password');
const status = document.querySelector('#results-status');
const body = document.querySelector('#results-body');
const count = document.querySelector('#submission-count');
const submissionModal = document.querySelector('#submission-modal');
const submissionPreview = document.querySelector('#submission-preview');
const headers = (password) => ({ 'X-Teacher-Password': password });
let activePassword = sessionStorage.getItem('teacherPassword') || '';
let loadedSubmissions = [];
passwordInput.value = activePassword;

function setStatus(message, kind = '') {
  status.textContent = message;
  status.className = `results-status ${kind}`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

function formatTime(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  return `${Math.floor(safeSeconds / 60)}:${String(safeSeconds % 60).padStart(2, '0')}`;
}

const anglePreviewTasks = [
  { triangle: 'ABC', target: 'A', expected: 70, kind: 'acute', kindLabel: 'Tam giác nhọn', points: [[345, 177], [120, 445], [500, 445]], labels: { A: [345, 150], B: [101, 480], C: [519, 480] }, given: { B: '50°', C: '60°' } },
  { triangle: 'FDE', target: 'D', expected: 100, kind: 'obtuse', kindLabel: 'Tam giác tù', points: [[94, 220], [135, 455], [500, 455]], labels: { F: [75, 194], D: [111, 493], E: [522, 493] }, given: { F: '50°', E: '30°' } },
  { triangle: 'MNP', target: 'P', expected: 30, kind: 'right', kindLabel: 'Tam giác vuông', points: [[219, 293], [125, 455], [500, 455]], labels: { M: [219, 264], N: [95, 493], P: [530, 493] }, given: { M: '90°', N: '60°' } },
];

function angleState(value, correct, correctText) {
  const answer = String(value ?? '').trim();
  if (correct) return `<span class="preview-answer is-correct">${escapeHtml(answer)}${answer ? '°' : ''}<b>✓ Đúng</b></span>`;
  return `<span class="preview-answer is-wrong">${escapeHtml(answer || 'Chưa trả lời')}${answer ? '°' : ''}<b>✗ Đáp án: ${escapeHtml(correctText)}</b></span>`;
}

function kindState(value, correct, correctText) {
  const labels = { acute: 'Tam giác nhọn', obtuse: 'Tam giác tù', right: 'Tam giác vuông' };
  return correct
    ? `<span class="preview-answer is-correct">${escapeHtml(labels[value])}<b>✓ Đúng</b></span>`
    : `<span class="preview-answer is-wrong">${escapeHtml(labels[value] || 'Chưa trả lời')}<b>✗ Đáp án: ${escapeHtml(correctText)}</b></span>`;
}

function previewTriangle(task) {
  const [a, b, c] = task.points;
  const pointString = task.points.map(([x, y]) => `${x},${y}`).join('L');
  const orderedPositions = Object.fromEntries([...task.triangle].map((letter, index) => [letter, task.points[index]]));
  const angleLabels = [...task.triangle].map((letter, index) => {
    const center = orderedPositions[letter];
    const first = orderedPositions[task.triangle[(index + 1) % 3]];
    const second = orderedPositions[task.triangle[(index + 2) % 3]];
    let start = Math.atan2(first[1] - center[1], first[0] - center[0]);
    let end = Math.atan2(second[1] - center[1], second[0] - center[0]);
    let sweep = (end - start + Math.PI * 2) % (Math.PI * 2);
    if (sweep > Math.PI) { [start, end] = [end, start]; sweep = Math.PI * 2 - sweep; }
    const bisector = start + sweep / 2;
    const [x, y] = center;
    const value = task.given[letter] || (letter === task.target ? '?' : '');
    const radius = 60;
    const lx = (x + radius * Math.cos(bisector)) / 6.2;
    const ly = (y + radius * Math.sin(bisector)) / 5.2;
    return value ? `<span class="preview-angle-label ${letter === task.target ? 'is-unknown' : ''}" style="left:${lx}%;top:${ly}%">${escapeHtml(value)}</span>` : '';
  }).join('');
  const vertices = Object.entries(task.labels).map(([letter, [x, y]]) => `<span class="preview-vertex-label" style="left:${x / 6.2}%;top:${y / 5.2}%">${escapeHtml(letter)}</span>`).join('');
  return `<div class="preview-triangle"><div class="preview-triangle-canvas"><svg viewBox="0 0 620 520" aria-label="Tam giác ${escapeHtml(task.triangle)}"><rect x="8" y="8" width="604" height="504" rx="26" fill="#f7fdff"/><path d="M${pointString}Z" fill="#aee8fb" stroke="#173b86" stroke-width="8" stroke-linejoin="round"/></svg>${vertices}${angleLabels}</div></div>`;
}

function angleMysteryPreview(item) {
  const answers = Array.isArray(item.answers) ? item.answers : [];
  return `<section class="student-sheet-preview angle-preview"><header class="student-preview-banner"><div><small>PHIẾU HỌC TẬP · TOÁN 7</small><h3>ĐỘI ĐẶC NHIỆM<br>GIẢI MÃ GÓC</h3><p>Vận dụng định lý tổng ba góc trong một tam giác</p></div><div class="student-preview-meta"><b>${escapeHtml(item.name)}</b><span>Lớp ${escapeHtml(item.class || '—')}</span><strong>${escapeHtml(item.score)}/10 điểm</strong><span>Thời gian: ${formatTime(item.elapsedSeconds)}</span></div></header><div class="student-preview-taskgrid">${anglePreviewTasks.map((task, index) => {
    const answer = answers[index] || {};
    const angleCorrect = Number(answer.angle) === task.expected;
    const kindCorrect = answer.kind === task.kind;
    return `<article class="student-preview-task task-${index + 1}"><header><span>${index + 1}</span><div><small>NHIỆM VỤ ${index + 1}</small><b>Giải mã góc ${task.target}</b></div></header><div class="student-preview-content"><p>Cho tam giác <strong>${task.triangle}</strong> có:</p><div class="student-preview-givens">${Object.entries(task.given).map(([vertex, value]) => `<span>Góc ${vertex} = <b>${value}</b></span>`).join('')}</div>${previewTriangle(task)}<div class="student-preview-response"><div><b>Góc ${task.target} =</b>${angleState(answer.angle, angleCorrect, `${task.expected}°`)}</div><div><b>Phân loại:</b>${kindState(answer.kind, kindCorrect, task.kindLabel)}</div></div></div></article>`;
  }).join('')}</div></section>`;
}

function proofPreview(item) {
  const answers = Array.isArray(item.answers) ? item.answers : [];
  const stepGroups = [
    { label: 'Bước 1 · Dựng đường thẳng song song', slots: [0] },
    { label: 'Bước 2 · Cặp góc so le trong', slots: [1, 2] },
    { label: 'Bước 3 · Tổng góc trên đường thẳng xy', slots: [3] },
    { label: 'Bước 4 · Kết luận', slots: [4] },
  ];
  const correct = ['parallel-line', 'upper-alternate', 'lower-alternate', 'straight-angle', 'conclusion'];
  return `<section class="student-sheet-preview proof-preview"><header class="student-preview-banner"><div><small>PHIẾU HỌC TẬP · TOÁN 7</small><h3>GIẢI MÃ CHỨNG MINH</h3><p>Định lý tổng ba góc trong một tam giác</p></div><div class="student-preview-meta"><b>${escapeHtml(item.name)}</b><span>Lớp ${escapeHtml(item.class || '—')}</span><strong>${escapeHtml(item.score)}/10 điểm</strong><span>Thời gian: ${formatTime(item.elapsedSeconds)}</span></div></header><div class="proof-preview-top"><div class="proof-preview-box"><h4>Xét hình vẽ</h4><svg viewBox="0 0 420 250" aria-label="Tam giác ABC và đường thẳng xy song song BC"><path d="M34 70H386 M95 210L210 70L325 210Z" fill="#e2f7ff" stroke="#244d82" stroke-width="4"/><text x="20" y="63">x</text><text x="390" y="63">y</text><text x="205" y="56">A</text><text x="79" y="232">B</text><text x="329" y="232">C</text></svg></div><div class="proof-preview-box"><h4>Giả thiết &amp; kết luận</h4><p><b>Giả thiết:</b> Cho tam giác ABC.</p><p><b>Kết luận:</b> ∠A + ∠B + ∠C = 180°</p><p><b>Gợi ý:</b> Vẽ đường thẳng xy ∥ BC.</p></div></div><div class="proof-preview-bottom"><section class="proof-preview-box"><h4>Sơ đồ chứng minh đã làm</h4><div class="proof-preview-steps">${stepGroups.map((group) => `<div class="proof-preview-step"><b>${escapeHtml(group.label)}</b>${group.slots.map((slot) => { const answer = answers[slot]; const good = answer === correct[slot]; return `<span class="preview-proof-answer ${good ? 'is-correct' : 'is-wrong'}">${escapeHtml(answerLabels[answer] || 'Chưa điền')} ${good ? '✓' : '· Sai'}</span>`; }).join('')}</div>`).join('')}</div></section><section class="proof-preview-box discard-preview"><h4>Thẻ đã loại bỏ</h4><div class="preview-proof-answer ${item.discardedAnswer === 'distractor' ? 'is-correct' : 'is-wrong'}">${escapeHtml(answerLabels[item.discardedAnswer] || 'Chưa chọn thẻ loại bỏ')}</div></section></div><div class="student-preview-summary">${escapeHtml(item.name)} · ${escapeHtml(item.score)}/10 điểm · đúng ${escapeHtml(item.correctCount)}/5 ô · ${formatTime(item.elapsedSeconds)}</div></section>`;
}

function openSubmission(item) {
  submissionPreview.innerHTML = item.exerciseId === 'angle-mystery' ? angleMysteryPreview(item) : proofPreview(item);
  submissionModal.hidden = false;
  document.body.classList.add('has-open-modal');
  document.querySelector('#submission-close').focus();
}

function closeSubmission() {
  submissionModal.hidden = true;
  document.body.classList.remove('has-open-modal');
}

function renderRows(submissions) {
  loadedSubmissions = submissions;
  count.textContent = `${submissions.length} bài nộp`;
  if (!submissions.length) {
    body.innerHTML = '<tr><td colspan="7" class="empty-results">Chưa có học sinh nộp bài.</td></tr>';
    return;
  }
  body.innerHTML = submissions.map((item) => {
    const answers = Array.isArray(item.answers) ? item.answers : [];
    const isAngleMystery = item.exerciseId === 'angle-mystery';
    const answerText = isAngleMystery
      ? answers.map((answer) => `${escapeHtml(answer.triangle)}: góc ${escapeHtml(answer.angle || '—')}°; ${escapeHtml({ acute: 'tam giác nhọn', obtuse: 'tam giác tù', right: 'tam giác vuông' }[answer.kind] || 'chưa chọn loại')}`).join(' · ')
      : answers.map((answer, index) => `${index + 1}. ${answerLabels[answer] || 'Chưa chọn'}`).join(' · ');
    const submittedAt = new Date(item.submittedAt).toLocaleString('vi-VN');
    return `<tr>
      <td class="student-name-cell">${escapeHtml(item.name)}<br><button class="view-submission-button" type="button" data-submission-id="${escapeHtml(item.id)}">Xem bài làm</button></td>
      <td>${escapeHtml(item.class || '—')}</td>
      <td><span class="score-pill">${escapeHtml(item.score)}/10</span></td>
      <td>${escapeHtml(item.correctCount)}/${isAngleMystery ? 6 : 5}</td>
      <td>${formatTime(item.elapsedSeconds)}</td>
      <td class="answer-list-cell"><strong>${isAngleMystery ? 'Đội đặc nhiệm giải mã góc' : 'Giải mã chứng minh'}</strong><br>${isAngleMystery ? answerText : `${escapeHtml(answerText)}<br><small>Thẻ loại bỏ: ${escapeHtml(answerLabels[item.discardedAnswer] || 'Chưa chọn')}</small>`}</td>
      <td>${escapeHtml(submittedAt)}</td>
    </tr>`;
  }).join('');
}

body.addEventListener('click', (event) => {
  const button = event.target.closest('[data-submission-id]');
  if (!button) return;
  const item = loadedSubmissions.find((submission) => String(submission.id) === button.dataset.submissionId);
  if (item) openSubmission(item);
});
document.querySelector('#submission-close').addEventListener('click', closeSubmission);
submissionModal.addEventListener('click', (event) => {
  if (event.target === submissionModal) closeSubmission();
});
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !submissionModal.hidden) closeSubmission();
});

async function loadResults(password = activePassword) {
  if (!password) {
    setStatus('Nhập mã giáo viên để xem kết quả.');
    return;
  }
  setStatus('Đang tải bài làm…');
  try {
    const response = await fetch(`${apiBase}/api/submissions`, { headers: headers(password), cache: 'no-store' });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Không thể tải bài làm.');
    activePassword = password;
    sessionStorage.setItem('teacherPassword', password);
    renderRows(payload.submissions || []);
    setStatus('Đã cập nhật danh sách bài nộp.', 'success');
  } catch (error) {
    if (error.message.includes('Mã giáo viên')) {
      activePassword = '';
      sessionStorage.removeItem('teacherPassword');
    }
    setStatus(error.message || 'Không kết nối được máy chủ.', 'error');
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  loadResults(passwordInput.value);
});
document.querySelector('#refresh-results').addEventListener('click', () => loadResults());
document.querySelector('#clear-results').addEventListener('click', async () => {
  if (!activePassword || !window.confirm('Xóa vĩnh viễn toàn bộ bài nộp? Hành động này không thể hoàn tác.')) return;
  try {
    const response = await fetch(`${apiBase}/api/submissions`, { method: 'DELETE', headers: headers(activePassword) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Không xóa được bài nộp.');
    renderRows([]);
    setStatus('Đã xóa toàn bộ bài nộp.', 'success');
  } catch (error) {
    setStatus(error.message || 'Không xóa được bài nộp.', 'error');
  }
});

if (activePassword) loadResults();
