-- ========================================================
-- KEdu — SUPABASE DATABASE SCHEMA CHO 6 MÔN HỌC THPT
-- Hướng dẫn: 
-- 1. Mở https://supabase.com/dashboard/project/vhgpngrguazxymxcddvu/sql/new
-- 2. Dán toàn bộ nội dung file này vào khung SQL Editor
-- 3. Nhấn "Run" (hoặc Ctrl + Enter) để kích hoạt
-- ========================================================

-- 1. BẢNG MÔN HỌC (SUBJECTS)
CREATE TABLE IF NOT EXISTS public.subjects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  badge TEXT DEFAULT '',
  corner TEXT NOT NULL,
  hero_title TEXT NOT NULL,
  hero_desc TEXT NOT NULL,
  author TEXT NOT NULL,
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BẢNG CHUYÊN ĐỀ / BỘ ĐỀ (TOPICS)
CREATE TABLE IF NOT EXISTS public.topics (
  id TEXT NOT NULL,
  subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  index_code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  chapter TEXT DEFAULT '',
  theme TEXT DEFAULT 'blue',
  icon_svg TEXT,
  is_full BOOLEAN DEFAULT FALSE,
  order_index INT DEFAULT 0,
  PRIMARY KEY (subject_id, id)
);

-- 3. BẢNG CÂU HỎI (QUESTIONS: Trắc nghiệm 4 lựa chọn, Đúng/Sai, Trả lời ngắn)
CREATE TABLE IF NOT EXISTS public.questions (
  id TEXT DEFAULT gen_random_uuid()::text PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('mc', 'tf', 'sa', 'fb')),
  question_text TEXT NOT NULL,
  options JSONB DEFAULT '[]'::JSONB,
  correct_index INT,
  accepted_answers JSONB DEFAULT '[]'::JSONB,
  explanation TEXT,
  diagram TEXT,
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BẢNG LƯU KẾT QUẢ BÀI THI (QUIZ_RESULTS)
CREATE TABLE IF NOT EXISTS public.quiz_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('mc', 'tf', 'sa', 'fb')),
  score INT NOT NULL,
  total INT NOT NULL,
  percentage INT NOT NULL,
  student_name TEXT DEFAULT 'Học sinh KEdu',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- PHÂN QUYỀN TRUY CẬP (ROW LEVEL SECURITY - RLS)
-- ========================================================

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

-- Cho phép đọc công khai
DROP POLICY IF EXISTS "Public read subjects" ON public.subjects;
CREATE POLICY "Public read subjects" ON public.subjects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read topics" ON public.topics;
CREATE POLICY "Public read topics" ON public.topics FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read questions" ON public.questions;
CREATE POLICY "Public read questions" ON public.questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read quiz_results" ON public.quiz_results;
CREATE POLICY "Public read quiz_results" ON public.quiz_results FOR SELECT USING (true);

-- Cho phép học sinh gửi kết quả thi
DROP POLICY IF EXISTS "Public insert quiz_results" ON public.quiz_results;
CREATE POLICY "Public insert quiz_results" ON public.quiz_results FOR INSERT WITH CHECK (true);

-- Cho phép Admin quản lý dữ liệu môn, chuyên đề, câu hỏi
DROP POLICY IF EXISTS "Admin write subjects" ON public.subjects;
CREATE POLICY "Admin write subjects" ON public.subjects FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin write topics" ON public.topics;
CREATE POLICY "Admin write topics" ON public.topics FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin write questions" ON public.questions;
CREATE POLICY "Admin write questions" ON public.questions FOR ALL USING (true);

-- ========================================================
-- NẠP SẴN THÔNG TIN 6 MÔN HỌC CHUẨN
-- ========================================================
INSERT INTO public.subjects (id, name, corner, hero_title, hero_desc, author, order_index)
VALUES 
  ('toan', 'Toán học 12', 'CHƯƠNG 1', 'Toán học 12: Ứng dụng đạo hàm khảo sát hàm số', 'Tính đơn điệu, cực trị, GTLN - GTNN, đường tiệm cận đứng / ngang / xiên của đồ thị hàm số và bài toán thực tế.', 'TRẦN ĐĂNG KHOA', 1),
  ('vatli', 'Vật lí 12', 'CHƯƠNG 1', 'Vật lí 12: Chuyên đề Vật lí nhiệt', 'Mô hình động học phân tử, cấu trúc 3 thể, các quá trình chuyển thể và định luật nhiệt động lực học.', 'TRẦN ĐĂNG KHOA', 2),
  ('hoa', 'Hóa học 12', 'CHƯƠNG 1', 'Hóa học 12: Este - Lipit - Xà phòng & Chất giặt rửa', 'Cấu tạo đồng phân danh pháp Este, phản ứng xà phòng hóa, chất béo Triglyceride và cơ chế tẩy rửa.', 'TRẦN ĐĂNG KHOA', 3),
  ('sinh', 'Sinh học 12', 'PHẦN 4', 'Sinh học 12: Di truyền phân tử & Nhiễm sắc thể', 'Mã di truyền, tái bản ADN, phiên mã, dịch mã, điều hòa hoạt động gen Operon Lac và đột biến NST.', 'TRẦN ĐĂNG KHOA', 4),
  ('tinhoc', 'Tin học 12', 'CHUYÊN ĐỀ', 'Tin học 12: Khoa học máy tính & Mạng máy tính', 'Hệ thống mạng máy tính, giao thức TCP/IP, thuật toán, cơ sở dữ liệu quan hệ SQL và ứng dụng công nghệ trí tuệ nhân tạo (AI).', 'TRẦN ĐĂNG KHOA', 5),
  ('lichsu', 'Lịch Sử 12', 'CHUYÊN ĐỀ', 'Lịch Sử 12: Lịch sử thế giới & Lịch sử Việt Nam hiện đại', 'Trật tự thế giới sau Chiến tranh lạnh, Liên Hợp Quốc, ASEAN, các mốc lịch sử cách mạng Việt Nam và công cuộc Đổi mới.', 'TRẦN ĐĂNG KHOA', 6)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  corner = EXCLUDED.corner,
  hero_title = EXCLUDED.hero_title,
  hero_desc = EXCLUDED.hero_desc,
  author = EXCLUDED.author,
  order_index = EXCLUDED.order_index;
