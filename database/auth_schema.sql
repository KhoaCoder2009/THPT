-- ========================================================
-- KEdu — SUPABASE USERS AUTH SCHEMA (BẢNG TÀI KHOẢN NGƯỜI DÙNG)
-- Hỗ trợ tài khoản: username và mật khẩu
-- ========================================================

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'student',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bật Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Cho phép đọc công khai thông tin cơ bản hoặc đăng nhập
CREATE POLICY "Public Read Users" 
ON public.users FOR SELECT 
USING (true);

-- Cho phép người dùng mới đăng ký tài khoản
CREATE POLICY "Public Register Users" 
ON public.users FOR INSERT 
WITH CHECK (true);

-- Cho phép người dùng cập nhật thông tin cá nhân
CREATE POLICY "Public Update Users" 
ON public.users FOR UPDATE 
USING (true);

-- Index tìm kiếm nhanh theo username
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users (lower(username));

-- Ghi chú: Tài khoản Quản trị viên (Admin) chính:
-- Username: tdka
-- Password: Khoavip123@
-- Role: admin

-- ========================================================
-- BẢNG QUẢN LÝ MÃ KEY MÔN HỌC (LICENSE KEYS)
-- Mỗi key chỉ được dùng cho 1 tài khoản duy nhất
-- ========================================================
CREATE TABLE IF NOT EXISTS public.license_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_code TEXT UNIQUE NOT NULL,
    subject_id TEXT NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_by TEXT,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.license_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Keys" ON public.license_keys FOR SELECT USING (true);
CREATE POLICY "Public Update Keys" ON public.license_keys FOR UPDATE USING (true);
