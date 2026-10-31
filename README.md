# Giải mã chứng minh · Toán 7

Ứng dụng phiếu học tập Toán 7 có hai bài: `/` là sơ đồ chứng minh tổng ba góc; `/giai-ma-goc` là ba bài tính góc và nhận dạng tam giác. Học sinh nhập tên và lớp rồi nộp để chấm điểm trên thang 10. Bài nộp lưu trong Render Postgres cùng điểm và thời gian làm bài; giáo viên xem tại `/results` bằng mã riêng. Mỗi phiếu có thời gian 3 phút và nhạc nền từ tệp MP3 người dùng cung cấp.

## Chạy ứng dụng

```bash
npm install
npm run dev
```

Mở địa chỉ Vite in ra trong terminal. Để tạo bản build dùng `npm run build`.

## Ghi chú

Ứng dụng không nhúng trang Liveworksheets. Render Blueprint tạo trang tĩnh, API Node và Postgres miễn phí. Cần đặt biến môi trường `TEACHER_PASSWORD` trên API service, tối thiểu 8 ký tự, trước khi giáo viên đăng nhập `/results`. API tính lại điểm ở máy chủ; chỉ trang kết quả được bảo vệ bằng mã giáo viên.

Lưu ý: Cơ sở dữ liệu Render miễn phí hết hạn sau 30 ngày và không có sao lưu. Nâng cấp DB hoặc xuất dữ liệu định kỳ nếu cần lưu bài lâu dài.
