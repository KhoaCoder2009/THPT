# KEdu

Website ôn luyện 6 môn thi chuẩn chương trình Giáo dục Phổ thông mới (GDPT 2018): **Toán học, Vật lí, Hóa học, Sinh học, Tin học, Lịch sử**.

**Người biên soạn**: **TRẦN ĐĂNG KHOA**

---

## 📁 CẤU TRÚC THƯ MỤC DỰ ÁN

```
THPT/
├── index.html                   # Trang chủ Cổng thông tin 6 môn học
├── README.md                    # Tài liệu tổng quan dự án
│
├── pages/                       # Các trang chức năng luyện thi 6 môn
│   ├── toan-hoc.html            # Môn Toán học 12
│   ├── vat-li.html              # Môn Vật lí 12
│   ├── hoa-hoc.html             # Môn Hóa học 12
│   ├── sinh-hoc.html            # Môn Sinh học 12
│   ├── tin-hoc.html             # Môn Tin học 12 (120 câu hỏi)
│   ├── lich-su.html             # Môn Lịch Sử 12
│   └── quan-ly-de.html          # Hệ thống Quản lý đề & Chỉnh sửa đáp án
│
├── css/                         # Định dạng giao diện & giao diện TV
│   └── style.css                # Toàn bộ CSS hệ thống (DOL THPT / KEdu theme)
│
├── js/                          # Mã nguồn xử lý ứng dụng & Engine làm bài
│   ├── quiz-engine.js           # Engine chấm điểm, xử lý trắc nghiệm, đúng/sai, trả lời ngắn
│   └── supabase-config.js       # File cấu hình kết nối Supabase Project URL & Key
│
├── assets/                      # Tài nguyên đa phương tiện
│   └── images/
│       └── logo_kedu.png # Logo chính thức hệ thống KEdu
│
└── database/                    # Cơ sở dữ liệu Supabase Backend
    ├── CAI_DAT_TOAN_BO_DATABASE.sql # Tập lệnh 1 bước tạo bảng, phân quyền & nạp dữ liệu
    ├── supabase-schema.sql      # Tập lệnh tạo bảng & thiết lập bảo mật RLS
    ├── supabase-seed.sql        # Bộ dữ liệu môn học, chuyên đề & câu hỏi
    ├── supabase-data.json       # Dữ liệu JSON cấu trúc chuẩn
    ├── upload_to_supabase.js    # Script tự động đẩy dữ liệu lên Cloud
    └── HUONG_DAN_SUPABASE.md    # Hướng dẫn chi tiết thiết lập Supabase
```

---

## 🚀 HƯỚNG DẪN SỬ DỤNG
1. **Mở website**: Nhấp đúp vào `index.html` để mở Cổng ôn luyện trên trình duyệt.
2. **Chế độ Tivi lớp học**: Nhấn nút **"Chế độ TV"** trên thanh tiêu đề để phóng to cỡ chữ, phù hợp với màn hình lớn và máy chiếu giảng dạy.
3. **Kết nối Supabase**: Mở file `js/supabase-config.js`, nhập `SUPABASE_URL` và `SUPABASE_ANON_KEY` (dùng Publishable / Anon Key) theo hướng dẫn trong `database/HUONG_DAN_SUPABASE.md`.

