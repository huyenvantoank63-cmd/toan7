import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import pg from 'pg';

const { Pool } = pg;
const port = Number(process.env.PORT || 10000);
const appOrigin = process.env.APP_ORIGIN || 'http://localhost:5173';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

const allowedAnswers = new Set([
  'straight-angle', 'distractor', 'parallel-line', 'lower-alternate', 'upper-alternate', 'conclusion',
]);
const rateLimits = new Map();

function send(response, status, payload, headers = {}) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers,
  });
  response.end(JSON.stringify(payload));
}

function isTeacher(request) {
  const expected = process.env.TEACHER_PASSWORD || '';
  const supplied = request.headers['x-teacher-password'] || '';
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  if (expectedBuffer.length < 8 || suppliedBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(suppliedBuffer, expectedBuffer);
}

function allowRequest(request, response) {
  const origin = request.headers.origin;
  if (origin && origin !== appOrigin) return false;
  if (origin) {
    response.setHeader('Access-Control-Allow-Origin', appOrigin);
    response.setHeader('Vary', 'Origin');
  }
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Teacher-Password');
  return true;
}

async function readBody(request) {
  let raw = '';
  for await (const chunk of request) {
    raw += chunk;
    if (raw.length > 16_000) throw new Error('Payload quá lớn.');
  }
  return JSON.parse(raw || '{}');
}

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS submissions (
      id BIGSERIAL PRIMARY KEY,
      student_name VARCHAR(60) NOT NULL,
      student_class VARCHAR(40) NOT NULL DEFAULT '',
      score SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 10),
      correct_count SMALLINT NOT NULL CHECK (correct_count BETWEEN 0 AND 5),
      answers JSONB NOT NULL,
      discarded_answer TEXT,
      elapsed_seconds SMALLINT NOT NULL DEFAULT 0,
      submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

const server = createServer(async (request, response) => {
  if (!allowRequest(request, response)) return send(response, 403, { error: 'Nguồn gửi không được phép.' });
  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    return response.end();
  }

  const path = new URL(request.url, 'http://localhost').pathname;
  if (request.method === 'GET' && path === '/api/health') {
    try {
      await pool.query('SELECT 1');
      return send(response, 200, { ok: true });
    } catch {
      return send(response, 503, { ok: false, error: 'Chưa kết nối được cơ sở dữ liệu.' });
    }
  }

  if (request.method === 'POST' && path === '/api/submissions') {
    const clientAddress = request.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const recent = (rateLimits.get(clientAddress) || []).filter((stamp) => now - stamp < 60 * 60 * 1000);
    if (recent.length >= 30) return send(response, 429, { error: 'Đã đạt giới hạn nộp bài. Vui lòng thử lại sau.' });
    recent.push(now);
    rateLimits.set(clientAddress, recent);

    try {
      const body = await readBody(request);
      const name = String(body.name || '').trim().slice(0, 60);
      const studentClass = String(body.studentClass || '').trim().slice(0, 40);
      const answers = Array.isArray(body.answers) ? body.answers : [];
      const correctAnswers = ['parallel-line', 'upper-alternate', 'lower-alternate', 'straight-angle', 'conclusion'];
      const correctCount = answers.reduce((sum, answer, index) => sum + Number(answer === correctAnswers[index]), 0);
      const score = correctCount * 2;
      const elapsed = Math.max(0, Math.min(180, Number(body.elapsedSeconds) || 0));
      if (!name || answers.length !== 5 || answers.some((answer) => answer !== null && !allowedAnswers.has(answer))) {
        return send(response, 400, { error: 'Thông tin bài làm chưa hợp lệ.' });
      }
      const result = await pool.query(
        `INSERT INTO submissions (student_name, student_class, score, correct_count, answers, discarded_answer, elapsed_seconds)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, submitted_at`,
        [name, studentClass, score, correctCount, JSON.stringify(answers), String(body.discardedAnswer || '').slice(0, 40), elapsed],
      );
      return send(response, 201, { ok: true, id: result.rows[0].id, submittedAt: result.rows[0].submitted_at });
    } catch (error) {
      if (error instanceof SyntaxError || error.message === 'Payload quá lớn.') {
        return send(response, error instanceof SyntaxError ? 400 : 413, { error: error.message });
      }
      console.error('Could not save student submission:', error);
      return send(response, 500, { error: 'Máy chủ chưa lưu được bài. Hãy thử gửi lại.' });
    }
  }

  if (request.method === 'GET' && path === '/api/submissions') {
    if (!isTeacher(request)) return send(response, 401, { error: 'Mã giáo viên không đúng hoặc chưa được cấu hình.' });
    try {
      const result = await pool.query(
        `SELECT id, student_name AS name, student_class AS class, score, correct_count AS "correctCount",
                answers, discarded_answer AS "discardedAnswer", elapsed_seconds AS "elapsedSeconds", submitted_at AS "submittedAt"
         FROM submissions ORDER BY submitted_at DESC LIMIT 1000`,
      );
      return send(response, 200, { submissions: result.rows });
    } catch {
      return send(response, 500, { error: 'Không tải được danh sách bài làm.' });
    }
  }

  if (request.method === 'DELETE' && path === '/api/submissions') {
    if (!isTeacher(request)) return send(response, 401, { error: 'Mã giáo viên không đúng hoặc chưa được cấu hình.' });
    try {
      await pool.query('DELETE FROM submissions');
      return send(response, 200, { ok: true });
    } catch {
      return send(response, 500, { error: 'Không xóa được bài làm.' });
    }
  }

  return send(response, 404, { error: 'Không tìm thấy đường dẫn.' });
});

await ensureSchema();
server.listen(port, '0.0.0.0', () => console.log(`Results API listening on ${port}`));
