const express = require('express');
const fs      = require('fs');
const path    = require('path');
const cors    = require('cors');

const app  = express();
const PORT = process.env.PORT || 3000;
const DATA = path.join(__dirname, 'data');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── HELPERS ──
function readJSON(file, def = []) {
  try {
    const p = path.join(DATA, file);
    if (!fs.existsSync(p)) return def;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch { return def; }
}
function writeJSON(file, data) {
  fs.writeFileSync(path.join(DATA, file), JSON.stringify(data, null, 2), 'utf8');
}

// Init admin
(function() {
  let accs = readJSON('dataacc.json', []);
  if (!accs.find(a => a.email === 'vophuong26987@gmail.com')) {
    accs.push({
      email: 'vophuong26987@gmail.com',
      pass: 'lekhanhhuyadmin207',
      balance: 999999, isAdmin: true, ip: 'server', created: Date.now()
    });
    writeJSON('dataacc.json', accs);
  }
  ['mondoupdate.json','lichsu.json','lichsucongtien.json'].forEach(f => {
    if (!fs.existsSync(path.join(DATA, f))) writeJSON(f, []);
  });
})();

// ══════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════
app.post('/api/register', (req, res) => {
  const { email, pass, ip } = req.body;
  if (!email || !pass) return res.json({ ok: false, msg: 'Thiếu thông tin' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.json({ ok: false, msg: 'Email không hợp lệ' });
  if (pass.length < 8) return res.json({ ok: false, msg: 'Mật khẩu tối thiểu 8 ký tự' });
  let accs = readJSON('dataacc.json', []);
  if (accs.find(a => a.email === email)) return res.json({ ok: false, msg: 'Email đã được đăng ký' });
  const clientIP = ip || req.ip || req.headers['x-forwarded-for'] || 'unknown';
  accs.push({ email, pass, balance: 0, isAdmin: false, ip: clientIP, created: Date.now() });
  writeJSON('dataacc.json', accs);
  res.json({ ok: true });
});

app.post('/api/login', (req, res) => {
  const { email, pass } = req.body;
  const accs = readJSON('dataacc.json', []);
  const acc  = accs.find(a => a.email === email && a.pass === pass);
  if (!acc) return res.json({ ok: false, msg: 'Email hoặc mật khẩu không đúng' });
  const { pass: _, ...safe } = acc;
  res.json({ ok: true, user: safe });
});

app.get('/api/me', (req, res) => {
  const email = req.query.email;
  const accs  = readJSON('dataacc.json', []);
  const acc   = accs.find(a => a.email === email);
  if (!acc) return res.json({ ok: false });
  const { pass: _, ...safe } = acc;
  res.json({ ok: true, user: safe });
});

// ══════════════════════════════════════════
// PRODUCTS
// ══════════════════════════════════════════
app.get('/api/products', (req, res) => {
  res.json(readJSON('mondoupdate.json', []));
});

app.post('/api/products', (req, res) => {
  const { email, name, img, link, price, code } = req.body;
  const accs = readJSON('dataacc.json', []);
  const me   = accs.find(a => a.email === email && a.isAdmin);
  if (!me) return res.json({ ok: false, msg: 'Không có quyền' });
  if (!name || !price || !code) return res.json({ ok: false, msg: 'Thiếu thông tin' });
  const items = readJSON('mondoupdate.json', []);
  if (items.find(i => i.code === code)) return res.json({ ok: false, msg: 'Mã đã tồn tại' });
  items.unshift({ name, img, link, price: +price, code, added: Date.now() });
  writeJSON('mondoupdate.json', items);
  res.json({ ok: true });
});

app.delete('/api/products/:code', (req, res) => {
  const { email } = req.body;
  const accs = readJSON('dataacc.json', []);
  const me   = accs.find(a => a.email === email && a.isAdmin);
  if (!me) return res.json({ ok: false, msg: 'Không có quyền' });
  let items = readJSON('mondoupdate.json', []);
  items = items.filter(i => i.code !== req.params.code);
  writeJSON('mondoupdate.json', items);
  res.json({ ok: true });
});

// ══════════════════════════════════════════
// BUY
// ══════════════════════════════════════════
app.post('/api/buy', (req, res) => {
  const { email, code } = req.body;
  const items = readJSON('mondoupdate.json', []);
  const item  = items.find(i => i.code === code);
  if (!item) return res.json({ ok: false, msg: 'Sản phẩm không tồn tại' });
  let accs = readJSON('dataacc.json', []);
  const idx = accs.findIndex(a => a.email === email);
  if (idx < 0) return res.json({ ok: false, msg: 'Tài khoản không tồn tại' });
  if ((accs[idx].balance || 0) < item.price) return res.json({ ok: false, msg: 'Số dư không đủ' });
  accs[idx].balance -= item.price;
  writeJSON('dataacc.json', accs);
  // Lịch sử
  const hist = readJSON('lichsu.json', []);
  hist.unshift({ type: 'mua', email, amount: -item.price, name: item.name, code: item.code, link: item.link, time: Date.now() });
  writeJSON('lichsu.json', hist);
  res.json({ ok: true, link: item.link, balance: accs[idx].balance });
});

// ══════════════════════════════════════════
// NẠP TIỀN (yêu cầu)
// ══════════════════════════════════════════
app.post('/api/nap-request', (req, res) => {
  const { email } = req.body;
  const hist = readJSON('lichsu.json', []);
  hist.unshift({ type: 'nap_pending', email, amount: 0, note: 'Đợi admin xác nhận', time: Date.now() });
  writeJSON('lichsu.json', hist);
  res.json({ ok: true });
});

// ══════════════════════════════════════════
// ADMIN: CỘNG TIỀN
// ══════════════════════════════════════════
app.post('/api/topup', (req, res) => {
  const { adminEmail, targetEmail, amount } = req.body;
  const accs  = readJSON('dataacc.json', []);
  const admin = accs.find(a => a.email === adminEmail && a.isAdmin);
  if (!admin) return res.json({ ok: false, msg: 'Không có quyền admin' });
  const idx = accs.findIndex(a => a.email === targetEmail);
  if (idx < 0) return res.json({ ok: false, msg: 'Tài khoản không tồn tại' });
  if (!amount || amount < 1000) return res.json({ ok: false, msg: 'Số tiền tối thiểu 1,000đ' });
  accs[idx].balance = (accs[idx].balance || 0) + (+amount);
  writeJSON('dataacc.json', accs);
  // Lịch sử user
  const hist = readJSON('lichsu.json', []);
  hist.unshift({ type: 'nap', email: targetEmail, amount: +amount, note: 'Admin cộng tiền', time: Date.now() });
  writeJSON('lichsu.json', hist);
  // Lịch sử admin
  const ahist = readJSON('lichsucongtien.json', []);
  ahist.unshift({ email: targetEmail, amount: +amount, by: adminEmail, time: Date.now() });
  writeJSON('lichsucongtien.json', ahist);
  res.json({ ok: true, balance: accs[idx].balance });
});

// ══════════════════════════════════════════
// LỊCH SỬ
// ══════════════════════════════════════════
app.get('/api/history', (req, res) => {
  const { email } = req.query;
  const hist = readJSON('lichsu.json', []).filter(h => h.email === email);
  res.json(hist);
});

app.get('/api/history/topup', (req, res) => {
  const { email } = req.query;
  const accs = readJSON('dataacc.json', []);
  const me   = accs.find(a => a.email === email && a.isAdmin);
  if (!me) return res.json([]);
  res.json(readJSON('lichsucongtien.json', []));
});

// ══════════════════════════════════════════
// ADMIN: DANH SÁCH USERS
// ══════════════════════════════════════════
app.get('/api/users', (req, res) => {
  const { email } = req.query;
  const accs = readJSON('dataacc.json', []);
  const me   = accs.find(a => a.email === email && a.isAdmin);
  if (!me) return res.json([]);
  res.json(accs.filter(a => !a.isAdmin).map(({ pass: _, ...u }) => u));
});

app.listen(PORT, () => console.log(`✅ Server chạy tại http://localhost:${PORT}`));
