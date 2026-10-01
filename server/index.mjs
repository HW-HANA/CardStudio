import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const storageDir = path.resolve(process.env.STORAGE_DIR || path.join(__dirname, 'data'));
const uploadDir = path.join(storageDir, 'uploads');
const generatedDir = path.join(storageDir, 'generated');
const orderDir = path.join(storageDir, 'orders');
const dbPath = path.join(storageDir, 'db.json');
const port = Number(process.env.PORT || 8787);
const app = express();
app.set('trust proxy', true);
const upload = multer({dest: uploadDir, limits: {fileSize: 25 * 1024 * 1024}});
let db = {orders: [], jobs: [], grants: []};
let writeQueue = Promise.resolve();
const generationSessions = new Map();
const generationIps = new Map();

const json = value => JSON.stringify(value, null, 2);
const id = () => crypto.randomUUID();
const publicUrl = relative => `${String(process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '')}${relative}`;
const dimensions = orientation => orientation === 'landscape' ? {width: 1800, height: 1200} : {width: 1200, height: 1800};
const generationCooldownMs = () => Math.max(1, Number(process.env.GENERATION_SESSION_COOLDOWN_SECONDS || 30)) * 1000;
const generationIpWindowMs = () => Math.max(1, Number(process.env.GENERATION_IP_WINDOW_SECONDS || 600)) * 1000;
const generationIpMax = () => Math.max(1, Number(process.env.GENERATION_IP_MAX_REQUESTS || 30));

function clientIp(req) {
  return String(req.ip || req.socket.remoteAddress || 'unknown');
}

function pruneTimes(times, cutoff) {
  return times.filter(time => time > cutoff);
}

async function discardUpload(file) {
  if (file?.path) await fs.unlink(file.path).catch(() => {});
}

async function ensureStorage() {
  await Promise.all([uploadDir, generatedDir, orderDir].map(dir => fs.mkdir(dir, {recursive: true})));
  try { db = JSON.parse(await fs.readFile(dbPath, 'utf8')); }
  catch { await fs.writeFile(dbPath, json(db), 'utf8'); }
  db.orders ||= []; db.jobs ||= []; db.grants ||= [];
}

function persist() {
  writeQueue = writeQueue.then(() => fs.writeFile(dbPath, json(db), 'utf8'));
  return writeQueue;
}

function allowOrigin(origin) {
  if (!origin) return true;
  const allowed = String(process.env.ALLOWED_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean);
  return allowed.includes('*') || allowed.includes(origin);
}

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.json({limit: '1mb'}));
// Generated images are loaded into the customer's canvas for final JPG export.
// They are public order assets, so anonymous cross-origin reads are required when
// the static frontend and API run on different local or production origins.
app.use('/media', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(storageDir, {index: false, maxAge: '1h'}));

function sessionCookie(value, maxAge) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `merchant_session=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`;
}

function signSession(payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', process.env.SESSION_SECRET || 'dev-only-secret').update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

function readCookie(req, name) {
  const header = req.headers.cookie || '';
  return header.split(';').map(part => part.trim()).find(part => part.startsWith(`${name}=`))?.slice(name.length + 1);
}

function validSession(req) {
  const token = readCookie(req, 'merchant_session');
  if (!token) return false;
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return false;
  const expected = crypto.createHmac('sha256', process.env.SESSION_SECRET || 'dev-only-secret').update(encoded).digest('base64url');
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    return payload.role === 'merchant' && Number(payload.exp) > Date.now();
  } catch { return false; }
}

function requireMerchant(req, res, next) {
  if (validSession(req)) return next();
  res.status(401).json({error: 'merchant_login_required'});
}

function orderNumber() {
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  let value;
  do value = `DALI-${date}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  while (db.orders.some(order => order.orderNo === value));
  return value;
}

async function normalizeJpeg(inputPath, outputPath, orientation) {
  const {width, height} = dimensions(orientation);
  await sharp(inputPath)
    .rotate()
    .resize({width, height, fit: 'contain', background: {r: 247, g: 248, b: 246, alpha: 1}})
    .jpeg({quality: 95, chromaSubsampling: '4:4:4'})
    .withMetadata({density: 300})
    .toFile(outputPath);
  return {width, height};
}

async function fetchImage(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`AI image download failed: HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

async function callImageApi(inputPath, prompt, orientation) {
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = String(process.env.AI_BASE_URL || '').replace(/\/$/, '');
  const apiPath = process.env.AI_GENERATE_PATH || '/v1/images/edits';
  if (!apiKey || !baseUrl) throw new Error('AI_API_KEY and AI_BASE_URL are required when MOCK_MODE=false');
  const image = await sharp(inputPath).rotate().jpeg({quality: 95}).toBuffer();
  const form = new FormData();
  form.append('model', process.env.AI_MODEL || '');
  form.append('prompt', prompt || '');
  form.append('n', '1');
  if (process.env.AI_SIZE) form.append('size', process.env.AI_SIZE);
  form.append(process.env.AI_IMAGE_FIELD || 'image', new Blob([image], {type: 'image/jpeg'}), 'source.jpg');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number(process.env.AI_TIMEOUT_MS || 120000));
  try {
    const response = await fetch(`${baseUrl}${apiPath}`, {method: 'POST', headers: {Authorization: `Bearer ${apiKey}`}, body: form, signal: controller.signal});
    const text = await response.text();
    if (!response.ok) throw new Error(`AI API failed: HTTP ${response.status} ${text.slice(0, 500)}`);
    const data = JSON.parse(text);
    const item = data?.data?.[0] || data?.images?.[0] || data?.candidates?.[0] || data?.results?.[0];
    if (!item) throw new Error('AI API returned no image');
    if (item.b64_json || item.base64) return Buffer.from(item.b64_json || item.base64, 'base64');
    const url = typeof item === 'string' ? item : item.url || item.image || item.imageUrl || item.src;
    if (!url) throw new Error('AI API response has no image URL or base64 data');
    return fetchImage(url);
  } finally { clearTimeout(timer); }
}

async function processJob(jobId) {
  const job = db.jobs.find(item => item.id === jobId);
  if (!job) return;
  try {
    const source = process.env.MOCK_MODE === 'true' ? await fs.readFile(job.inputPath) : await callImageApi(job.inputPath, job.prompt, job.orientation);
    const rawPath = path.join(generatedDir, `${job.id}-raw`);
    await fs.writeFile(rawPath, source);
    const outputName = `${job.id}.jpg`;
    const outputPath = path.join(generatedDir, outputName);
    const size = await normalizeJpeg(rawPath, outputPath, job.orientation);
    job.status = 'ready';
    job.candidates = [{id: job.id, url: publicUrl(`/media/generated/${outputName}`), ...size}];
    job.finished = new Date().toISOString();
    await persist();
  } catch (error) {
    job.status = 'failed';
    job.error = error.message;
    job.finished = new Date().toISOString();
    if (job.grantCode) {
      const grant = db.grants.find(item => item.code === job.grantCode);
      if (grant) grant.remaining = Math.min(grant.uses, grant.remaining + 1);
    }
    await persist();
  }
}

app.post('/api/admin/login', (req, res) => {
  const password = String(req.body?.password || '');
  if (!process.env.MERCHANT_PASSWORD || password !== process.env.MERCHANT_PASSWORD) return res.status(401).json({error: 'invalid_login'});
  const ttl = Number(process.env.SESSION_TTL_SECONDS || 28800);
  const token = signSession({role: 'merchant', exp: Date.now() + ttl * 1000});
  res.setHeader('Set-Cookie', sessionCookie(token, ttl));
  res.json({ok: true});
});

app.post('/api/admin/generation-grants', requireMerchant, async (req, res) => {
  const uses = Math.min(5, Math.max(1, Number(req.body?.uses || 1)));
  const grant = {id: id(), code: `DALI-${crypto.randomBytes(3).toString('hex').toUpperCase()}`, uses, remaining: uses, created: new Date().toISOString()};
  db.grants.push(grant);
  await persist();
  res.status(201).json({code: grant.code, uses: grant.uses, remaining: grant.remaining});
});

app.post('/api/generate', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({error: 'image_required'});
  const requestId = String(req.body.requestId || '').trim();
  const sessionId = String(req.body.sessionId || '').trim();
  const grantCode = String(req.body.grantCode || '').trim().toUpperCase();
  const now = Date.now();
  const ip = clientIp(req);
  const cutoff = now - generationIpWindowMs();
  const ipTimes = pruneTimes(generationIps.get(ip) || [], cutoff);
  if (requestId) {
    const previous = db.jobs.find(job => job.requestId === requestId && job.status !== 'failed');
    if (previous) { await discardUpload(req.file); return res.status(previous.status === 'ready' ? 200 : 202).json(previous.status === 'ready' ? {candidates: previous.candidates} : {jobId: previous.id}); }
  }
  let grant = null;
  if (grantCode) {
    grant = db.grants.find(item => item.code === grantCode && item.remaining > 0);
    if (!grant) { await discardUpload(req.file); return res.status(400).json({error: 'invalid_generation_grant', message: '授权码无效或已用完，请联系店主。'}); }
  }
  if (ipTimes.length >= generationIpMax() && !grant) { await discardUpload(req.file); return res.status(429).json({error: 'generation_rate_limited', message: '生成请求较多，请稍后再试。'}); }
  if (sessionId && !grant) {
    const previousTime = generationSessions.get(sessionId) || 0;
    const remaining = previousTime + generationCooldownMs() - now;
    if (remaining > 0) { await discardUpload(req.file); return res.status(429).json({error: 'generation_cooldown', retryAfterSeconds: Math.ceil(remaining / 1000), message: `请等待 ${Math.ceil(remaining / 1000)} 秒后再生成。`}); }
  }
  ipTimes.push(now); generationIps.set(ip, ipTimes);
  if (sessionId) generationSessions.set(sessionId, now);
  if (grant) grant.remaining -= 1;
  const orientation = req.body.orientation === 'landscape' ? 'landscape' : 'portrait';
  const job = {id: id(), requestId: requestId || id(), sessionId, grantCode: grant?.code || '', status: 'processing', inputPath: req.file.path, prompt: req.body.prompt || '', style: req.body.style || '', skill: req.body.skill || '', orientation, created: new Date().toISOString()};
  db.jobs.push(job);
  await persist();
  void processJob(job.id);
  res.status(202).json({jobId: job.id});
});

app.get('/api/generate/:jobId', (req, res) => {
  const job = db.jobs.find(item => item.id === req.params.jobId);
  if (!job) return res.status(404).json({error: 'job_not_found'});
  if (job.status === 'ready') return res.json({candidates: job.candidates});
  if (job.status === 'failed') return res.status(502).json({error: job.error || 'generation_failed'});
  res.json({status: 'processing'});
});

app.post('/api/orders', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({error: 'final_image_required'});
  const existing = db.orders.find(order => order.requestId === req.body.requestId);
  if (existing) return res.json(existing);
  const orientation = req.body.orientation === 'landscape' ? 'landscape' : 'portrait';
  const orderId = id();
  const fileName = `${orderId}.jpg`;
  const outputPath = path.join(orderDir, fileName);
  const size = await normalizeJpeg(req.file.path, outputPath, orientation);
  const orderNo = orderNumber();
  const order = {id: orderId, orderNo, paymentRemark: orderNo, paymentStatus: 'unpaid', printStatus: 'pending', status: 'awaiting_payment', paymentQrUrl: process.env.PAYMENT_QR_URL || undefined, url: publicUrl(`/media/orders/${fileName}`), width: size.width, height: size.height, category: req.body.category || '', mode: req.body.mode || 'postcard', composition: req.body.composition || 'single-postcard', layout: req.body.layout || 'ai-output', style: req.body.style || '', skill: req.body.skill || '', orientation, requestId: req.body.requestId || '', created: new Date().toISOString()};
  db.orders.push(order);
  await persist();
  res.status(201).json(order);
});

app.get('/api/orders', requireMerchant, (req, res) => res.json({orders: db.orders}));
app.get('/api/orders/:id', (req, res) => {
  const order = db.orders.find(item => item.id === req.params.id || item.orderNo === req.params.id);
  if (!order) return res.status(404).json({error: 'order_not_found'});
  res.json(order);
});

app.patch('/api/orders/:id/payment', async (req, res) => {
  const order = db.orders.find(item => item.id === req.params.id);
  if (!order) return res.status(404).json({error: 'order_not_found'});
  const status = String(req.body?.status || '');
  if (!['customer_reported', 'paid'].includes(status)) return res.status(400).json({error: 'invalid_payment_status'});
  if (status === 'paid' && !validSession(req)) return res.status(401).json({error: 'merchant_login_required'});
  order.paymentStatus = status;
  order.status = status === 'paid' ? 'paid' : 'customer_reported';
  order.updated = new Date().toISOString();
  await persist();
  res.json(order);
});

app.patch('/api/orders/:id/print', requireMerchant, async (req, res) => {
  const order = db.orders.find(item => item.id === req.params.id);
  if (!order) return res.status(404).json({error: 'order_not_found'});
  if (req.body?.status !== 'printed') return res.status(400).json({error: 'invalid_print_status'});
  order.printStatus = 'printed';
  order.status = 'printed';
  order.updated = new Date().toISOString();
  await persist();
  res.json(order);
});

app.get('/health', (req, res) => res.json({ok: true, mockMode: process.env.MOCK_MODE === 'true'}));

await ensureStorage();
app.listen(port, () => console.log(`Card Studio API listening on http://127.0.0.1:${port}`));
