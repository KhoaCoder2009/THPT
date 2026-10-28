-- ========================================================
-- KEdu — SUPABASE DATABASE SCHEMA
-- Hướng dẫn: Mở Supabase -> SQL Editor -> Dán toàn bộ file này -> Nhấn RUN
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

-- 2. BẢNG CHUYÊN ĐỀ (TOPICS)
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

ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS chapter TEXT DEFAULT '';

-- 3. BẢNG CÂU HỎI (QUESTIONS: Trắc nghiệm, Đúng sai, Trả lời ngắn)
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
-- BẢO MẬT & PHÂN QUYỀN TRUY CẬP (ROW LEVEL SECURITY - RLS)
-- ========================================================

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

-- Cho phép mọi học sinh / người dùng đọc dữ liệu môn học, chuyên đề, câu hỏi
DROP POLICY IF EXISTS "Public read subjects" ON public.subjects;
CREATE POLICY "Public read subjects" ON public.subjects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read topics" ON public.topics;
CREATE POLICY "Public read topics" ON public.topics FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read questions" ON public.questions;
CREATE POLICY "Public read questions" ON public.questions FOR SELECT USING (true);

-- Cho phép học sinh gửi kết quả làm bài thi lên Supabase
DROP POLICY IF EXISTS "Public insert quiz_results" ON public.quiz_results;
CREATE POLICY "Public insert quiz_results" ON public.quiz_results FOR INSERT WITH CHECK (true);

-- Cho phép xem kết quả / bảng thành tích
DROP POLICY IF EXISTS "Public read quiz_results" ON public.quiz_results;
CREATE POLICY "Public read quiz_results" ON public.quiz_results FOR SELECT USING (true);

-- Cho phép cập nhật / xóa dữ liệu nếu cần
DROP POLICY IF EXISTS "Public all subjects" ON public.subjects;
CREATE POLICY "Public all subjects" ON public.subjects FOR ALL USING (true);

DROP POLICY IF EXISTS "Public all topics" ON public.topics;
CREATE POLICY "Public all topics" ON public.topics FOR ALL USING (true);

DROP POLICY IF EXISTS "Public all questions" ON public.questions;
CREATE POLICY "Public all questions" ON public.questions FOR ALL USING (true);
