-- ========================================================
-- KEdu — TẠO BẢNG LƯU LỊCH SỬ KẾT QUẢ BÀI THI TRÊN SUPABASE
-- Chạy đoạn script này trên Supabase SQL Editor:
-- https://supabase.com/dashboard/project/vhgpngrguazxymxcddvu/sql/new
-- ========================================================

CREATE TABLE IF NOT EXISTS public.quiz_results (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  student_name TEXT,
  subject_id TEXT NOT NULL,
  subject_name TEXT,
  topic_id TEXT NOT NULL,
  topic_title TEXT,
  mode TEXT NOT NULL,
  score NUMERIC(5,2) NOT NULL DEFAULT 0,
  max_score NUMERIC(5,2) NOT NULL DEFAULT 10.0,
  correct_count INT NOT NULL DEFAULT 0,
  total_count INT NOT NULL DEFAULT 0,
  wrong_count INT NOT NULL DEFAULT 0,
  percentage INT NOT NULL DEFAULT 0,
  duration_seconds INT NOT NULL DEFAULT 0,
  part_breakdown JSONB DEFAULT '{}'::jsonb,
  questions_detail JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bật RLS và cấp quyền đọc/ghi công khai cho học sinh
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read quiz_results" ON public.quiz_results;
CREATE POLICY "Public read quiz_results" ON public.quiz_results FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert quiz_results" ON public.quiz_results;
CREATE POLICY "Public insert quiz_results" ON public.quiz_results FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update quiz_results" ON public.quiz_results;
CREATE POLICY "Public update quiz_results" ON public.quiz_results FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public delete quiz_results" ON public.quiz_results;
CREATE POLICY "Public delete quiz_results" ON public.quiz_results FOR DELETE USING (true);
