/**
 * ========================================================
 * KEdu • QUESTION & ANSWER MANAGEMENT ENGINE
 * H? Th?ng Qu?n L Ngn Hng ??, Coi & Ch?nh S?a ?p n
 * ========================================================
 */

(function() {
  const STORAGE_KEY = 'kedu_question_overrides';

  let cachedData = null;
  let isInitialized = false;

  function getOverrides() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.error('Error reading question overrides:', e);
      return {};
    }
  }

  function saveOverrides(overrides) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    } catch (e) {
      console.error('Error saving question overrides:', e);
    }
  }

  /**
   * Kh?i t?o d? li?u t? window.KEDU_DATABASE_DATA ho?c fetch JSON
   */
  async function init() {
    if (isInitialized && cachedData) return cachedData;

    if (window.KEDU_DATABASE_DATA) {
      cachedData = JSON.parse(JSON.stringify(window.KEDU_DATABASE_DATA));
      isInitialized = true;
      return cachedData;
    }

    // Th? fetch supabase-data.json n?u ch?y trn Web Server
    try {
      const candidates = [
        '../database/supabase-data.json',
        './database/supabase-data.json',
        '/database/supabase-data.json'
      ];
      for (const url of candidates) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            cachedData = await res.json();
            isInitialized = true;
            return cachedData;
          }
        } catch (_) {}
      }
    } catch (e) {
      console.warn('Cannot fetch supabase-data.json directly:', e);
    }

    // Fallback: Tạo cấu trúc rỗng hợp lệ nếu không có dữ liệu
    cachedData = {
      subjects: [
        { id: 'toan', name: 'Toán học' },
        { id: 'vatli', name: 'Vật lí' },
        { id: 'hoa', name: 'Hóa học' },
        { id: 'sinh', name: 'Sinh học' },
        { id: 'tinhoc', name: 'Tin học' },
        { id: 'lichsu', name: 'Lịch sử' }
      ],
      topics: [],
      questions: []
    };
    isInitialized = true;
    return cachedData;
  }

  /**
   * L?y ton b? danh sch mn h?c
   */
  function getSubjects() {
    return cachedData?.subjects || [];
  }

  /**
   * L?y danh sch cc b? ?? thu?c mn h?c
   */
  function getTopics(subjectId) {
    if (!cachedData?.topics) return [];
    if (!subjectId || subjectId === 'all') return cachedData.topics;
    return cachedData.topics.filter(t => t.subject_id === subjectId);
  }

  /**
   * L?y danh sch cu h?i theo b? l?c (mn, ??, d?ng cu h?i, tm ki?m)
   */
  function getQuestions(filters = {}) {
    if (!cachedData?.questions) return [];
    const overrides = getOverrides();

    const {
      subjectId = 'all',
      topicId = 'all',
      type = 'all',
      searchQuery = '',
      status = 'all' // 'all', 'modified', 'original'
    } = filters;

    const query = searchQuery.trim().toLowerCase();

    return cachedData.questions
      .map(q => {
        const override = overrides[q.id];
        if (override) {
          return {
            ...q,
            question_text: override.question_text !== undefined ? override.question_text : q.question_text,
            options: override.options !== undefined ? override.options : q.options,
            correct_index: override.correct_index !== undefined ? override.correct_index : q.correct_index,
            accepted_answers: override.accepted_answers !== undefined ? override.accepted_answers : q.accepted_answers,
            explanation: override.explanation !== undefined ? override.explanation : q.explanation,
            isOverridden: true,
            originalData: {
              question_text: q.question_text,
              options: q.options,
              correct_index: q.correct_index,
              accepted_answers: q.accepted_answers,
              explanation: q.explanation
            },
            updated_at: override.updated_at
          };
        }
        return {
          ...q,
          isOverridden: false
        };
      })
      .filter(q => {
        if (subjectId !== 'all' && q.subject_id !== subjectId) return false;
        if (topicId !== 'all' && q.topic_id !== topicId && q.topic_id?.toString() !== topicId?.toString()) return false;
        if (type !== 'all' && q.type !== type) return false;
        if (status === 'modified' && !q.isOverridden) return false;
        if (status === 'original' && q.isOverridden) return false;

        if (query) {
          const matchId = (q.id || '').toLowerCase().includes(query);
          const matchText = (q.question_text || '').toLowerCase().includes(query);
          const matchExplain = (q.explanation || '').toLowerCase().includes(query);
          
          let matchOpts = false;
          if (Array.isArray(q.options)) {
            matchOpts = q.options.some(opt => {
              if (typeof opt === 'string') return opt.toLowerCase().includes(query);
              if (opt && typeof opt === 'object' && opt.text) return opt.text.toLowerCase().includes(query);
              return false;
            });
          }

          let matchAnswers = false;
          if (Array.isArray(q.accepted_answers)) {
            matchAnswers = q.accepted_answers.some(ans => (ans || '').toLowerCase().includes(query));
          }

          if (!matchId && !matchText && !matchExplain && !matchOpts && !matchAnswers) {
            return false;
          }
        }

        return true;
      });
  }

  /**
   * L?y thng tin chi ti?t 1 cu h?i theo ID
   */
  function getQuestionById(id) {
    if (!cachedData?.questions) return null;
    const q = cachedData.questions.find(item => item.id === id);
    if (!q) return null;

    const overrides = getOverrides();
    const override = overrides[id];
    if (override) {
      return {
        ...q,
        question_text: override.question_text !== undefined ? override.question_text : q.question_text,
        options: override.options !== undefined ? override.options : q.options,
        correct_index: override.correct_index !== undefined ? override.correct_index : q.correct_index,
        accepted_answers: override.accepted_answers !== undefined ? override.accepted_answers : q.accepted_answers,
        explanation: override.explanation !== undefined ? override.explanation : q.explanation,
        isOverridden: true,
        originalData: {
          question_text: q.question_text,
          options: q.options,
          correct_index: q.correct_index,
          accepted_answers: q.accepted_answers,
          explanation: q.explanation
        },
        updated_at: override.updated_at
      };
    }

    return {
      ...q,
      isOverridden: false
    };
  }

  /**
   * Cập nhật / Chỉnh sửa đáp án hoặc nội dung câu hỏi (Chỉ dành cho Admin)
   */
  async function updateQuestion(id, patch) {
    if (window.KeduAuth && typeof window.KeduAuth.isAdmin === 'function' && !window.KeduAuth.isAdmin()) {
      return { success: false, message: 'Từ chối quyền: Chức năng quản lý đề và chỉnh sửa đáp án chỉ dành riêng cho Quản trị viên (Admin)!' };
    }

    const q = getQuestionById(id);
    if (!q) return { success: false, message: 'Không tìm thấy câu hỏi ID: ' + id };

    const overrides = getOverrides();
    const currentOverride = overrides[id] || {};

    const updated = {
      ...currentOverride,
      ...patch,
      updated_at: new Date().toISOString()
    };

    overrides[id] = updated;
    saveOverrides(overrides);

    // Cập nhật trên Supabase nếu đang có kết nối trực tuyến
    try {
      const client = window.getSupabaseClient ? window.getSupabaseClient() : null;
      if (client) {
        const dbPatch = {};
        if (patch.question_text !== undefined) dbPatch.question_text = patch.question_text;
        if (patch.options !== undefined) dbPatch.options = patch.options;
        if (patch.correct_index !== undefined) dbPatch.correct_index = patch.correct_index;
        if (patch.accepted_answers !== undefined) dbPatch.accepted_answers = patch.accepted_answers;
        if (patch.explanation !== undefined) dbPatch.explanation = patch.explanation;

        await client.from('questions').update(dbPatch).eq('id', id);
      }
    } catch (e) {
      console.warn('Supabase remote sync warning:', e);
    }

    // Phát sự kiện để toàn bộ các trang cập nhật theo thời gian thực
    if (typeof CustomEvent !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('kedu-question-updated', {
        detail: { id, patch: updated }
      }));
    }

    return { success: true, question: getQuestionById(id) };
  }

  /**
   * Khôi phục câu hỏi về đáp án nguyên bản ban đầu (Chỉ dành cho Admin)
   */
  async function resetQuestion(id) {
    if (window.KeduAuth && typeof window.KeduAuth.isAdmin === 'function' && !window.KeduAuth.isAdmin()) {
      return { success: false, message: 'Từ chối quyền: Chức năng khôi phục đáp án chỉ dành riêng cho Quản trị viên (Admin)!' };
    }

    const overrides = getOverrides();
    if (!overrides[id]) return { success: true, message: 'Câu hỏi chưa bị thay đổi.' };

    delete overrides[id];
    saveOverrides(overrides);

    if (typeof CustomEvent !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('kedu-question-updated', {
        detail: { id, isReset: true }
      }));
    }

    return { success: true, message: 'Đã khôi phục câu hỏi về nguyên bản.' };
  }

  /**
   * Khôi phục toàn bộ các câu đã chỉnh sửa (Chỉ dành cho Admin)
   */
  function resetAll() {
    if (window.KeduAuth && typeof window.KeduAuth.isAdmin === 'function' && !window.KeduAuth.isAdmin()) {
      return { success: false, message: 'Từ chối quyền: Chức năng khôi phục ngân hàng đề chỉ dành riêng cho Quản trị viên (Admin)!' };
    }

    localStorage.removeItem(STORAGE_KEY);
    if (typeof CustomEvent !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('kedu-question-updated', { detail: { allReset: true } }));
    }
    return { success: true, message: 'Đã khôi phục toàn bộ ngân hàng câu hỏi.' };
  }

  /**
   * Xu?t ton b? d? li?u d??i d?ng JSON ?? ng??i dng t?i v?
   */
  function exportMergedDatabase() {
    if (!cachedData) return null;
    const all = getQuestions();
    const cleanQuestions = all.map(q => {
      const copy = { ...q };
      delete copy.isOverridden;
      delete copy.originalData;
      return copy;
    });

    return {
      subjects: cachedData.subjects,
      topics: cachedData.topics,
      questions: cleanQuestions
    };
  }

  /**
   * T?o cu l?nh SQL UPDATE cho cc cu h?i ? ch?nh s?a ?p n
   */
  function generateSqlUpdateScript() {
    const overrides = getOverrides();
    const keys = Object.keys(overrides);
    if (keys.length === 0) return '-- Ch?a c cu h?i no b? thay ??i ?p n.';

    let sql = `-- ========================================================\n-- C?P NH?T ?P N CU H?I KEDU (${keys.length} cu ? s?a)\n-- Xu?t lc: ${new Date().toLocaleString('vi-VN')}\n-- ========================================================\n\n`;

    for (const id of keys) {
      const q = getQuestionById(id);
      if (!q) continue;

      const optsJson = JSON.stringify(q.options || []).replace(/'/g, "''");
      const ansJson = JSON.stringify(q.accepted_answers || []).replace(/'/g, "''");
      const cIdx = q.correct_index !== null && q.correct_index !== undefined ? q.correct_index : 'NULL';
      const qText = (q.question_text || '').replace(/'/g, "''");
      const qExp = (q.explanation || '').replace(/'/g, "''");

      sql += `UPDATE public.questions SET\n`;
      sql += `  question_text = '${qText}',\n`;
      sql += `  options = '${optsJson}'::jsonb,\n`;
      sql += `  correct_index = ${cIdx},\n`;
      sql += `  accepted_answers = '${ansJson}'::jsonb,\n`;
      sql += `  explanation = '${qExp}'\n`;
      sql += `WHERE id = '${id}';\n\n`;
    }

    return sql;
  }

  /**
   * Lấy ghi đè đáp án cho câu hỏi dạng mảng raw trong quiz-engine
   */
  function getOverrideForRaw(qText, type, topicId) {
    const overrides = getOverrides();
    // 1. Kiểm tra so khớp trực tiếp theo nội dung câu hỏi
    for (const id in overrides) {
      const ov = overrides[id];
      if (ov.question_text === qText || (ov.originalData && ov.originalData.question_text === qText)) {
        return ov;
      }
    }
    // 2. Tra cứu trong cachedData.questions
    if (cachedData && cachedData.questions) {
      const found = cachedData.questions.find(q => {
        if (q.question_text !== qText) return false;
        if (type && q.type !== type) return false;
        if (topicId && q.topic_id?.toString() !== topicId?.toString()) return false;
        return true;
      });
      if (found && overrides[found.id]) {
        return overrides[found.id];
      }
    }
    return null;
  }

  // Khởi tạo ngay khi tải script
  init();

  // Export API ra toàn cục
  window.KeduQuestionManager = {
    init,
    getSubjects,
    getTopics,
    getQuestions,
    getQuestionById,
    getOverrideForRaw,
    updateQuestion,
    resetQuestion,
    resetAll,
    getOverrides,
    exportMergedDatabase,
    generateSqlUpdateScript
  };
})();
