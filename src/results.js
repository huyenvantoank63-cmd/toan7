import './style.css';

const apiBase = import.meta.env.VITE_API_URL || '';
const root = document.querySelector('#results-root');
const answerLabels = {
  'straight-angle': 'Tổng các góc trên đường thẳng xy bằng 180°',
  distractor: 'Mệnh đề nhiễu về góc CAB và ACB',
  'parallel-line': 'Qua A kẻ đường thẳng xy // BC',
  'lower-alternate': 'Cặp góc so le trong phía AC',
  'upper-alternate': 'Cặp góc so le trong phía AB',
  conclusion: 'Kết luận tổng ba góc bằng 180°',
};

root.innerHTML = `
  <main class="results-page">
    <header class="results-header">
      <a class="results-back" href="/">← Về phiếu học tập</a>
      <span class="sheet-kicker">PHIẾU HỌC TẬP · TOÁN 7</span>
      <h1>Kết quả bài làm</h1>
      <p>Theo dõi điểm số và câu trả lời học sinh đã nộp.</p>
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
`;

const form = document.querySelector('#teacher-login');
const passwordInput = document.querySelector('#teacher-password');
const status = document.querySelector('#results-status');
const body = document.querySelector('#results-body');
const count = document.querySelector('#submission-count');
const headers = (password) => ({ 'X-Teacher-Password': password });
let activePassword = sessionStorage.getItem('teacherPassword') || '';
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

function renderRows(submissions) {
  count.textContent = `${submissions.length} bài nộp`;
  if (!submissions.length) {
    body.innerHTML = '<tr><td colspan="7" class="empty-results">Chưa có học sinh nộp bài.</td></tr>';
    return;
  }
  body.innerHTML = submissions.map((item) => {
    const answers = Array.isArray(item.answers) ? item.answers : [];
    const answerText = answers.map((answer, index) => `${index + 1}. ${answerLabels[answer] || 'Chưa chọn'}`).join(' · ');
    const submittedAt = new Date(item.submittedAt).toLocaleString('vi-VN');
    return `<tr>
      <td class="student-name-cell">${escapeHtml(item.name)}</td>
      <td>${escapeHtml(item.class || '—')}</td>
      <td><span class="score-pill">${escapeHtml(item.score)}/10</span></td>
      <td>${escapeHtml(item.correctCount)}/5</td>
      <td>${formatTime(item.elapsedSeconds)}</td>
      <td class="answer-list-cell">${escapeHtml(answerText)}<br><small>Thẻ loại bỏ: ${escapeHtml(answerLabels[item.discardedAnswer] || 'Chưa chọn')}</small></td>
      <td>${escapeHtml(submittedAt)}</td>
    </tr>`;
  }).join('');
}

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
