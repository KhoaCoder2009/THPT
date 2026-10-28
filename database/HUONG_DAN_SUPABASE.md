# HƯỚNG DẪN KÍCH HOẠT SUPABASE CHO KEdu (1 BƯỚC DUY NHẤT)

Dự án Supabase của bạn:
- **Project URL**: `https://vhgpngrguazxymxcddvu.supabase.co`
- **File cấu hình**: `js/supabase-config.js` (Lưu ý: trên trình duyệt web, hãy điền khóa **Publishable / Anon public key** bắt đầu bằng `sb_publishable_...` hoặc `eyJ...`, không dùng khóa `sb_secret_...` trên trình duyệt).

---

### 👉 BƯỚC 1: TẠO BẢNG & NẠP DỮ LIỆU VÀO SUPABASE (MẤT 10 GIÂY)

1. Bấm vào đường dẫn mở thẳng SQL Editor của bạn:
   👉 **[https://supabase.com/dashboard/project/vhgpngrguazxymxcddvu/sql/new](https://supabase.com/dashboard/project/vhgpngrguazxymxcddvu/sql/new)**

2. Mở file **`database/CAI_DAT_TOAN_BO_DATABASE.sql`**:
   - Nhấn **Ctrl + A** (chọn tất cả) rồi **Ctrl + C** (sao chép).

3. Dán (**Ctrl + V**) vào khung soạn thảo trên Supabase rồi nhấn nút **RUN** (hoặc bấm tổ hợp **Ctrl + Enter**).

---

### 🎉 KẾT QUẢ SAU KHI BẤM "RUN":
- Toàn bộ **4 bảng** (`subjects`, `topics`, `questions`, `quiz_results`) được tạo tự động với đầy đủ cột `chapter` và khóa chính chuẩn.
- Toàn bộ **8 môn học THPT** cùng bộ **120 câu hỏi Tin học 12** được nạp trực tiếp vào Supabase.
- Hệ thống phân quyền Row-Level Security (RLS) được bật để học sinh truy cập làm bài mượt mà.
- Khi học sinh làm bài xong, điểm số sẽ tự động lưu vào bảng `quiz_results` trên Supabase của bạn!

---

*(Tùy chọn: Nếu bạn muốn nạp dữ liệu bằng script dòng lệnh sau khi đã tạo bảng xong, chỉ cần mở terminal và chạy lệnh `node database/upload_to_supabase.js`).*

