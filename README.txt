==================================
  SHOP LE KHANH HUY — V2 BACKEND
==================================

CÀI ĐẶT:
1. Cài Node.js (nodejs.org)
2. Giải nén folder này
3. Mở terminal trong folder, chạy:
   npm install
4. Chạy server:
   node server.js
5. Mở trình duyệt vào: http://localhost:3000

FILES:
  server.js          — Backend Node.js
  package.json       — Dependencies
  public/            — HTML files
    index.html       — Trang đăng nhập
    danhsach.html    — Trang giới thiệu
    trangchu.html    — Shop + Nạp tiền + Admin
    lichsu.html      — Lịch sử giao dịch
  data/              — Data JSON (tự tạo khi chạy)
    dataacc.json     — Tài khoản users
    mondoupdate.json — Sản phẩm
    lichsu.json      — Lịch sử giao dịch
    lichsucongtien.json — Lịch sử admin cộng tiền

ADMIN:
  Email   : vophuong26987@gmail.com
  Mật khẩu: lekhanhhuyadmin207

LƯU Ý:
  - Dữ liệu lưu vào file JSON thật, dùng chung cho mọi người
  - Deploy lên server (Render, Railway, VPS...) để dùng online
