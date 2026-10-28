/* ========================================================
   KEdu — CẤU HÌNH KẾT NỐI SUPABASE
   ========================================================
   Hướng dẫn:
   1. Đăng nhập vào trang quản trị: https://supabase.com/dashboard
   2. Chọn Project của bạn -> Vào Project Settings -> API
   3. Sao chép "Project URL" và dán vào SUPABASE_URL dưới đây.
   4. Sao chép "anon public" API key và dán vào SUPABASE_ANON_KEY dưới đây.
   ======================================================== */

const SUPABASE_URL = "https://vhgpngrguazxymxcddvu.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

// Khởi tạo Supabase Client
function getSupabaseClient() {
  if (
    typeof window !== "undefined" &&
    window.supabase &&
    SUPABASE_URL &&
    SUPABASE_URL.startsWith("http") &&
    !SUPABASE_URL.includes("YOUR_SUPABASE") &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_ANON_KEY.includes("YOUR_SUPABASE")
  ) {
    // Supabase chặn khóa bí mật (sb_secret_...) trên trình duyệt với lỗi 401 Forbidden.
    // Chỉ khởi tạo client trên trình duyệt khi dùng Anon / Publishable Key (eyJ... hoặc sb_publishable_...).
    if (SUPABASE_ANON_KEY.startsWith("sb_secret_")) {
      if (!window._supabaseSecretKeyWarned) {
        window._supabaseSecretKeyWarned = true;
        console.info(
          "ℹ️ [KEdu] Đang sử dụng dữ liệu cục bộ. Lưu ý: SUPABASE_ANON_KEY hiện là khóa bí mật (sb_secret_...), chỉ dùng cho script Node.js. Để kết nối trực tiếp từ trình duyệt, hãy thay bằng khóa Anon/Publishable (sb_publishable_... hoặc eyJ...) từ Supabase Dashboard."
        );
      }
      return null;
    }

    if (!window._supabaseClientInstance) {
      window._supabaseClientInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return window._supabaseClientInstance;
  }
  return null;
}

window.getSupabaseClient = getSupabaseClient;
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
