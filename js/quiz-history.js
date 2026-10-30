/* ========================================================
   KEdu • QUIZ HISTORY SYSTEM (LỊCH SỬ LÀM BÀI THI & ÔN LUYỆN)
   Tự động lưu lại bài làm, điểm số, thời gian, đáp án chi tiết
   Hỗ trợ xem lại bài làm câu hỏi từng phần, phân tích lỗi sai & làm lại đề
   ======================================================== */

(function () {
  "use strict";

  const STORAGE_KEY = "kedu_quiz_history_v1";
  const MAX_HISTORY_ITEMS = 100;

  /* Helper: Định dạng thời gian Việt Nam */
  function formatDateTime(date) {
    if (!(date instanceof Date)) date = new Date(date);
    if (isNaN(date.getTime())) date = new Date();
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();
    const h = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${h}:${min} • ${d}/${m}/${y}`;
  }

  /* Helper: Định dạng khoảng thời gian làm bài */
  function formatDuration(sec) {
    sec = Math.max(0, parseInt(sec, 10) || 0);
    if (sec < 60) return `${sec} giây`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (s === 0) return `${m} phút`;
    return `${m} phút ${s} giây`;
  }

  /* Helper: Định dạng điểm số */
  function formatPoints(val) {
    const num = Math.round((Number(val) || 0) * 100) / 100;
    return num.toFixed(2);
  }

  /* Helper: Lấy danh sách lịch sử từ LocalStorage */
  function getRawHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn("Lỗi đọc lịch sử làm bài:", e);
      return [];
    }
  }

  /* Helper: Lưu danh sách lịch sử */
  function saveRawHistory(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_HISTORY_ITEMS)));
    } catch (e) {
      console.warn("Lỗi ghi lịch sử làm bài:", e);
    }
  }

  /* Core API */
  const KeduQuizHistory = {
    /**
     * Lưu một lượt hoàn thành bài thi
     */
    saveAttempt: async function (data) {
      if (!data) return null;

      // Tài khoản Admin chỉ quản lý, không tham gia làm đề -> Không lưu lịch sử làm bài
      if (window.KeduAuth && typeof window.KeduAuth.isAdmin === 'function' && window.KeduAuth.isAdmin()) {
        return null;
      }

      const now = new Date();
      const currentUser = window.KeduAuth && typeof window.KeduAuth.getCurrentUser === "function"
        ? window.KeduAuth.getCurrentUser()
        : null;

      const attempt = {
        id: "att_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
        createdAt: now.toISOString(),
        displayTime: formatDateTime(now),
        username: currentUser?.username || "khach",
        userFullName: currentUser?.fullName || currentUser?.username || "Học viên",
        subjectId: data.subjectId || window.CURRENT_SUBJECT_ID || "toan",
        subjectName: data.subjectName || "Môn học 12",
        topicId: (data.topicId || "1").toString(),
        topicTitle: data.topicTitle || "Bộ đề ôn tập",
        mode: data.mode || "full",
        modeLabel: data.mode === "full" ? "Trọn bộ 3 phần" : (data.mode === "mc" ? "Phần I • Trắc nghiệm" : (data.mode === "tf" ? "Phần II • Đúng/Sai" : "Phần III • Trả lời ngắn")),
        score: Math.min(10.0, Math.round((Number(data.score) || 0) * 100) / 100),
        maxScore: 10.0,
        correctCount: parseInt(data.correctCount, 10) || 0,
        totalCount: parseInt(data.totalCount, 10) || 0,
        wrongCount: parseInt(data.wrongCount, 10) || 0,
        percentage: Math.round(Number(data.percentage) || 0),
        durationSeconds: parseInt(data.durationSeconds, 10) || 0,
        durationFormatted: formatDuration(data.durationSeconds),
        partBreakdown: data.partBreakdown || { mc: { earned: 0, max: 0 }, tf: { earned: 0, max: 0 }, sa: { earned: 0, max: 0 } },
        questionsDetail: Array.isArray(data.questionsDetail) ? data.questionsDetail : []
      };

      // 1. Lưu vào LocalStorage
      const list = getRawHistory();
      list.unshift(attempt);
      saveRawHistory(list);

      // 2. Đồng bộ tùy chọn lên Supabase (chạy ngầm không ảnh hưởng UI)
      try {
        const client = window.getSupabaseClient ? window.getSupabaseClient() : null;
        if (client) {
          client.from("quiz_results").insert([{
            subject_id: attempt.subjectId,
            topic_id: attempt.topicId,
            mode: attempt.mode,
            score: attempt.score,
            total: attempt.totalCount,
            percentage: attempt.percentage,
            student_name: attempt.username
          }]).then(({ error }) => {
            if (error) console.log("Ghi nhận Supabase:", error.message);
          }).catch(() => {});
        }
      } catch (_) {}

      // 3. Dispatch sự kiện thông báo cho toàn hệ thống
      window.dispatchEvent(new CustomEvent("kedu:quiz-history-saved", { detail: attempt }));

      return attempt;
    },

    /**
     * Lấy danh sách lịch sử theo bộ lọc
     */
    getHistory: function (filters = {}) {
      let list = getRawHistory();
      const { subjectId, topicId, username, search } = filters;

      if (subjectId && subjectId !== "all") {
        list = list.filter(item => item.subjectId === subjectId);
      }
      if (topicId && topicId !== "all") {
        list = list.filter(item => String(item.topicId) === String(topicId));
      }
      if (username) {
        list = list.filter(item => item.username === username);
      }
      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        list = list.filter(item =>
          (item.topicTitle && item.topicTitle.toLowerCase().includes(q)) ||
          (item.subjectName && item.subjectName.toLowerCase().includes(q))
        );
      }

      return list;
    },

    /**
     * Lấy chi tiết 1 bài thi theo ID
     */
    getAttemptById: function (id) {
      if (!id) return null;
      const list = getRawHistory();
      return list.find(item => item.id === id) || null;
    },

    /**
     * Xóa 1 bài thi
     */
    deleteAttempt: function (id) {
      if (!id) return false;
      let list = getRawHistory();
      const initialLen = list.length;
      list = list.filter(item => item.id !== id);
      if (list.length !== initialLen) {
        saveRawHistory(list);
        window.dispatchEvent(new CustomEvent("kedu:quiz-history-updated"));
        return true;
      }
      return false;
    },

    /**
     * Xóa toàn bộ lịch sử
     */
    clearAllHistory: function (subjectId = null) {
      if (subjectId && subjectId !== "all") {
        let list = getRawHistory();
        list = list.filter(item => item.subjectId !== subjectId);
        saveRawHistory(list);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
      window.dispatchEvent(new CustomEvent("kedu:quiz-history-updated"));
      return true;
    },

    /**
     * Thống kê tổng quan
     */
    getStats: function (subjectId = null) {
      const list = this.getHistory({ subjectId });
      const totalAttempts = list.length;
      if (totalAttempts === 0) {
        return {
          totalAttempts: 0,
          averageScore: "0.00",
          highestScore: "0.00",
          totalQuestionsAnswered: 0,
          accuracyRate: 0,
          totalDurationSeconds: 0
        };
      }

      let sumScore = 0;
      let highest = 0;
      let totalQ = 0;
      let totalCorrect = 0;
      let totalDuration = 0;

      list.forEach(a => {
        const s = Number(a.score) || 0;
        sumScore += s;
        if (s > highest) highest = s;
        totalQ += (a.totalCount || 0);
        totalCorrect += (a.correctCount || 0);
        totalDuration += (a.durationSeconds || 0);
      });

      return {
        totalAttempts,
        averageScore: (sumScore / totalAttempts).toFixed(2),
        highestScore: highest.toFixed(2),
        totalQuestionsAnswered: totalQ,
        accuracyRate: totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0,
        totalDurationSeconds: totalDuration
      };
    },

    /**
     * Mở Modal Lịch sử làm bài
     */
    openModal: function (defaultSubjectId = null) {
      injectStyles();
      injectModalDOM();

      const overlay = document.getElementById("quizHistoryModalOverlay");
      if (!overlay) return;

      const subjFilter = document.getElementById("qhFilterSubject");
      if (subjFilter && defaultSubjectId) {
        subjFilter.value = defaultSubjectId;
      } else if (subjFilter && window.CURRENT_SUBJECT_ID) {
        subjFilter.value = window.CURRENT_SUBJECT_ID;
      }

      renderHistoryList();
      overlay.classList.add("active");
      document.body.style.overflow = "hidden";
    },

    /**
     * Đóng Modal Lịch sử làm bài
     */
    closeModal: function () {
      const overlay = document.getElementById("quizHistoryModalOverlay");
      if (overlay) overlay.classList.remove("active");
      const detailOverlay = document.getElementById("quizHistoryDetailOverlay");
      if (detailOverlay) detailOverlay.classList.remove("active");
      document.body.style.overflow = "";
    },

    /**
     * Mở xem chi tiết bài làm của 1 lượt
     */
    viewAttemptDetail: function (id) {
      const attempt = this.getAttemptById(id);
      if (!attempt) {
        alert("Không tìm thấy thông tin bài làm này!");
        return;
      }

      const detailOverlay = document.getElementById("quizHistoryDetailOverlay");
      if (!detailOverlay) return;

      renderDetailContent(attempt);
      detailOverlay.classList.add("active");
    },

    /**
     * Đóng xem chi tiết
     */
    closeDetailModal: function () {
      const detailOverlay = document.getElementById("quizHistoryDetailOverlay");
      if (detailOverlay) detailOverlay.classList.remove("active");
    },

    /**
     * Xuất lịch sử ra file JSON
     */
    exportHistory: function () {
      const list = getRawHistory();
      if (list.length === 0) {
        alert("Hiện tại chưa có dữ liệu lịch sử làm bài để xuất!");
        return;
      }
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(list, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `kedu_lich_su_lam_bai_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }
  };

  /* ========================================================
     MODAL HTML INJECTION & RENDERING
     ======================================================== */

  function injectStyles() {
    if (document.getElementById("quizHistoryStyles")) return;

    const style = document.createElement("style");
    style.id = "quizHistoryStyles";
    style.textContent = `
      /* OVERLAY */
      .qh-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.65);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.25s ease;
      }
      .qh-overlay.active {
        opacity: 1;
        pointer-events: auto;
      }

      /* MODAL CARD */
      .qh-card {
        background: #ffffff;
        border-radius: 20px;
        width: 100%;
        max-width: 900px;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 25px 60px -15px rgba(15, 23, 42, 0.35);
        border: 1px solid rgba(226, 232, 240, 0.8);
        overflow: hidden;
        animation: qhScaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes qhScaleUp {
        from { transform: scale(0.96) translateY(8px); }
        to { transform: scale(1) translateY(0); }
      }

      /* HEADER */
      .qh-header {
        padding: 20px 24px;
        background: linear-gradient(135deg, #0b1e42 0%, #1e3a8a 100%);
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        flex-shrink: 0;
      }
      .qh-header-title-wrap {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .qh-header-icon {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.25);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        flex-shrink: 0;
      }
      .qh-header-title {
        font-family: var(--font-heading, "Plus Jakarta Sans", sans-serif);
        font-size: 19px;
        font-weight: 800;
        margin: 0;
        color: #ffffff;
        line-height: 1.25;
      }
      .qh-header-sub {
        font-size: 12.5px;
        color: #cbd5e1;
        margin-top: 3px;
      }
      .qh-btn-close {
        width: 34px;
        height: 34px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.12);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #ffffff;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        transition: all 0.2s ease;
      }
      .qh-btn-close:hover {
        background: rgba(239, 68, 68, 0.85);
        color: #ffffff;
        transform: rotate(90deg);
      }

      /* STATS SUMMARY BAR */
      .qh-stats-row {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
        padding: 16px 24px;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
        flex-shrink: 0;
      }
      @media (max-width: 640px) {
        .qh-stats-row {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      .qh-stat-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 12px 14px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.03);
      }
      .qh-stat-lbl {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: #64748b;
        margin-bottom: 4px;
      }
      .qh-stat-val {
        font-family: var(--font-heading, "Plus Jakarta Sans", sans-serif);
        font-size: 18px;
        font-weight: 800;
        color: #0f2657;
      }

      /* CONTROLS BAR */
      .qh-controls-bar {
        padding: 12px 24px;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
        background: #ffffff;
        flex-shrink: 0;
      }
      .qh-filter-select {
        padding: 7px 12px;
        border-radius: 8px;
        border: 1.5px solid #cbd5e1;
        font-size: 13px;
        font-weight: 600;
        color: #1e293b;
        background: #ffffff;
        outline: none;
      }
      .qh-filter-select:focus {
        border-color: #2563eb;
      }
      .qh-search-input {
        padding: 7px 12px;
        border-radius: 8px;
        border: 1.5px solid #cbd5e1;
        font-size: 13px;
        color: #1e293b;
        outline: none;
        min-width: 200px;
      }
      .qh-search-input:focus {
        border-color: #2563eb;
      }

      /* LIST BODY */
      .qh-body {
        padding: 20px 24px;
        overflow-y: auto;
        flex: 1;
        min-height: 250px;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      /* ATTEMPT ITEM CARD */
      .qh-item-card {
        background: #ffffff;
        border: 1.5px solid #e2e8f0;
        border-radius: 14px;
        padding: 16px 20px;
        transition: all 0.2s ease;
        display: flex;
        flex-direction: column;
        gap: 12px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.02);
      }
      .qh-item-card:hover {
        border-color: #93c5fd;
        box-shadow: 0 8px 20px -6px rgba(37, 99, 235, 0.12);
        transform: translateY(-1px);
      }
      .qh-item-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 14px;
        flex-wrap: wrap;
      }
      .qh-item-meta-left {
        flex: 1;
        min-width: 250px;
      }
      .qh-item-badges {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 6px;
        flex-wrap: wrap;
      }
      .qh-badge {
        font-size: 11px;
        font-weight: 700;
        padding: 3px 8px;
        border-radius: 6px;
        background: #f1f5f9;
        color: #475569;
      }
      .qh-badge-subj {
        background: #eff6ff;
        color: #1d4ed8;
        font-weight: 800;
      }
      .qh-badge-mode {
        background: #fef3c7;
        color: #92400e;
      }
      .qh-badge-time {
        color: #64748b;
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .qh-item-title {
        font-family: var(--font-heading, "Plus Jakarta Sans", sans-serif);
        font-size: 15.5px;
        font-weight: 800;
        color: #0f2657;
        margin: 0;
        line-height: 1.35;
      }

      /* SCORE BADGE IN ITEM */
      .qh-score-box {
        text-align: right;
        flex-shrink: 0;
      }
      .qh-score-val {
        font-family: var(--font-heading, "Plus Jakarta Sans", sans-serif);
        font-size: 22px;
        font-weight: 800;
        line-height: 1;
      }
      .qh-score-val.high { color: #16a34a; }
      .qh-score-val.med { color: #2563eb; }
      .qh-score-val.low { color: #dc2626; }
      .qh-score-sub {
        font-size: 12px;
        color: #64748b;
        margin-top: 3px;
        font-weight: 600;
      }

      /* BOTTOM ACTIONS OF CARD */
      .qh-item-bottom {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding-top: 10px;
        border-top: 1px solid #f1f5f9;
        flex-wrap: wrap;
      }
      .qh-part-pills {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
      }
      .qh-part-pill {
        font-size: 11.5px;
        padding: 3px 8px;
        border-radius: 6px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        color: #475569;
        font-weight: 600;
      }
      .qh-item-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .btn-qh-action {
        padding: 6px 12px;
        border-radius: 8px;
        font-size: 12.5px;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border: 1px solid transparent;
        transition: all 0.15s ease;
      }
      .btn-qh-view {
        background: #2563eb;
        color: #ffffff;
      }
      .btn-qh-view:hover {
        background: #1d4ed8;
      }
      .btn-qh-retry {
        background: #f1f5f9;
        color: #0f2657;
        border-color: #cbd5e1;
      }
      .btn-qh-retry:hover {
        background: #e2e8f0;
      }
      .btn-qh-del {
        background: transparent;
        color: #94a3b8;
        padding: 6px 8px;
      }
      .btn-qh-del:hover {
        color: #ef4444;
        background: #fee2e2;
      }

      /* EMPTY STATE */
      .qh-empty-wrap {
        text-align: center;
        padding: 48px 24px;
        color: #64748b;
      }
      .qh-empty-icon {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: #f1f5f9;
        color: #94a3b8;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 16px;
      }
      .qh-empty-title {
        font-size: 16px;
        font-weight: 800;
        color: #334155;
        margin-bottom: 6px;
      }
      .qh-empty-desc {
        font-size: 13.5px;
        color: #64748b;
        max-width: 400px;
        margin: 0 auto 20px;
        line-height: 1.5;
      }

      /* FOOTER */
      .qh-footer {
        padding: 14px 24px;
        background: #f8fafc;
        border-top: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-shrink: 0;
        flex-wrap: wrap;
      }
      .btn-qh-sec {
        padding: 8px 16px;
        border-radius: 8px;
        background: #ffffff;
        border: 1px solid #cbd5e1;
        color: #334155;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .btn-qh-sec:hover {
        background: #f1f5f9;
      }
      .btn-qh-danger {
        color: #dc2626;
        border-color: #fecaca;
      }
      .btn-qh-danger:hover {
        background: #fee2e2;
      }

      /* DETAIL REVIEW MODAL */
      .qh-detail-card {
        max-width: 960px;
      }
      .qh-detail-header-sub {
        font-size: 13px;
        color: #cbd5e1;
        margin-top: 4px;
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      .qh-qdetail-item {
        background: #ffffff;
        border: 1.5px solid #e2e8f0;
        border-radius: 12px;
        padding: 16px 20px;
        margin-bottom: 14px;
      }
      .qh-qdetail-item.is-correct {
        border-left: 5px solid #16a34a;
      }
      .qh-qdetail-item.is-wrong {
        border-left: 5px solid #dc2626;
      }
      .qh-qdetail-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 10px;
      }
      .qh-qdetail-prompt {
        font-size: 14.5px;
        font-weight: 600;
        color: #1e293b;
        line-height: 1.55;
        margin-bottom: 12px;
      }
      .qh-answer-callout {
        padding: 10px 14px;
        border-radius: 8px;
        font-size: 13px;
        margin-bottom: 10px;
        line-height: 1.45;
      }
      .qh-answer-callout.correct {
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        color: #166534;
      }
      .qh-answer-callout.wrong {
        background: #fef2f2;
        border: 1px solid #fecaca;
        color: #991b1b;
      }
      .qh-explain-box {
        background: #f8fafc;
        border: 1px dashed #cbd5e1;
        border-radius: 8px;
        padding: 12px 14px;
        font-size: 13px;
        color: #334155;
        line-height: 1.5;
      }
    `;
    document.head.appendChild(style);
  }

  function injectModalDOM() {
    if (document.getElementById("quizHistoryModalOverlay")) return;

    // 1. History List Modal
    const modalWrap = document.createElement("div");
    modalWrap.id = "quizHistoryModalOverlay";
    modalWrap.className = "qh-overlay";
    modalWrap.innerHTML = `
      <div class="qh-card">
        <!-- HEADER -->
        <div class="qh-header">
          <div class="qh-header-title-wrap">
            <div class="qh-header-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div>
              <h2 class="qh-header-title">Lịch Sử Làm Bài & Ôn Luyện</h2>
              <div class="qh-header-sub">Hệ thống tự động lưu giữ chi tiết kết quả, thời gian và đáp án từng bài thi</div>
            </div>
          </div>
          <button type="button" class="qh-btn-close" id="btnQhClose" title="Đóng">✕</button>
        </div>

        <!-- STATS BAR -->
        <div class="qh-stats-row">
          <div class="qh-stat-card">
            <div class="qh-stat-lbl">Lượt làm bài</div>
            <div class="qh-stat-val" id="qhStatAttempts">0</div>
          </div>
          <div class="qh-stat-card">
            <div class="qh-stat-lbl">Điểm trung bình</div>
            <div class="qh-stat-val" id="qhStatAvg" style="color:#2563eb;">0.00đ</div>
          </div>
          <div class="qh-stat-card">
            <div class="qh-stat-lbl">Điểm cao nhất</div>
            <div class="qh-stat-val" id="qhStatHigh" style="color:#16a34a;">0.00đ</div>
          </div>
          <div class="qh-stat-card">
            <div class="qh-stat-lbl">Tỷ lệ chính xác</div>
            <div class="qh-stat-val" id="qhStatAcc">0%</div>
          </div>
        </div>

        <!-- CONTROLS BAR -->
        <div class="qh-controls-bar">
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <select class="qh-filter-select" id="qhFilterSubject">
              <option value="all">-- Tất cả môn học --</option>
              <option value="toan">Toán học 12</option>
              <option value="vatli">Vật lí 12</option>
              <option value="hoa">Hóa học 12</option>
              <option value="sinh">Sinh học 12</option>
              <option value="tinhoc">Tin học 12</option>
              <option value="lichsu">Lịch sử 12</option>
            </select>

            <select class="qh-filter-select" id="qhSortBy">
              <option value="newest">Thời gian: Mới nhất trước</option>
              <option value="highest">Điểm số: Cao xuống thấp</option>
              <option value="lowest">Điểm số: Thấp lên cao</option>
            </select>
          </div>

          <input type="text" class="qh-search-input" id="qhSearchInput" placeholder="Tìm tên đề thi, bài học...">
        </div>

        <!-- LIST CONTAINER -->
        <div class="qh-body" id="qhListContainer">
          <!-- Rendered dynamically -->
        </div>

        <!-- FOOTER -->
        <div class="qh-footer">
          <div style="display:flex; gap:10px;">
            <button type="button" class="btn-qh-sec" id="btnQhExport" title="Xuất dữ liệu lịch sử bài làm ra máy">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>Xuất File JSON</span>
            </button>
            <button type="button" class="btn-qh-sec btn-qh-danger" id="btnQhClear" title="Xóa toàn bộ lịch sử bài làm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              <span>Xóa toàn bộ lịch sử</span>
            </button>
          </div>

          <button type="button" class="btn-qh-sec" id="btnQhCloseFooter">Đóng</button>
        </div>
      </div>
    `;
    document.body.appendChild(modalWrap);

    // 2. Detail Review Modal
    const detailWrap = document.createElement("div");
    detailWrap.id = "quizHistoryDetailOverlay";
    detailWrap.className = "qh-overlay";
    detailWrap.innerHTML = `
      <div class="qh-card qh-detail-card">
        <!-- HEADER -->
        <div class="qh-header">
          <div>
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
              <span class="qh-badge qh-badge-subj" id="qhdSubjBadge">Toán học 12</span>
              <span class="qh-badge qh-badge-mode" id="qhdModeBadge">Trọn bộ</span>
            </div>
            <h2 class="qh-header-title" id="qhdTitle">Chi tiết bài thi</h2>
            <div class="qh-detail-header-sub" id="qhdMetaSub"></div>
          </div>
          <button type="button" class="qh-btn-close" id="btnQhdClose" title="Đóng">✕</button>
        </div>

        <!-- DETAIL BODY -->
        <div class="qh-body" id="qhdBody">
          <!-- Rendered dynamically -->
        </div>

        <!-- FOOTER -->
        <div class="qh-footer">
          <button type="button" class="btn-qh-sec" id="btnQhdBack">
            ← Quay lại danh sách lịch sử
          </button>
          <button type="button" class="btn-qh-action btn-qh-view" id="btnQhdRetry">
            🔄 Làm lại bài thi này ngay
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(detailWrap);

    // Wire Event Listeners
    document.getElementById("btnQhClose")?.addEventListener("click", KeduQuizHistory.closeModal);
    document.getElementById("btnQhCloseFooter")?.addEventListener("click", KeduQuizHistory.closeModal);
    modalWrap.addEventListener("click", (e) => {
      if (e.target === modalWrap) KeduQuizHistory.closeModal();
    });

    document.getElementById("btnQhdClose")?.addEventListener("click", KeduQuizHistory.closeDetailModal);
    document.getElementById("btnQhdBack")?.addEventListener("click", KeduQuizHistory.closeDetailModal);
    detailWrap.addEventListener("click", (e) => {
      if (e.target === detailWrap) KeduQuizHistory.closeDetailModal();
    });

    document.getElementById("qhFilterSubject")?.addEventListener("change", renderHistoryList);
    document.getElementById("qhSortBy")?.addEventListener("change", renderHistoryList);

    let searchDebounce = null;
    document.getElementById("qhSearchInput")?.addEventListener("input", () => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(renderHistoryList, 250);
    });

    document.getElementById("btnQhExport")?.addEventListener("click", () => KeduQuizHistory.exportHistory());
    document.getElementById("btnQhClear")?.addEventListener("click", () => {
      const curSubj = document.getElementById("qhFilterSubject")?.value;
      const msg = curSubj && curSubj !== "all"
        ? `Bạn có chắc muốn xóa toàn bộ lịch sử làm bài của môn này?`
        : `Bạn có chắc chắn muốn xóa toàn bộ lịch sử làm bài của tất cả các môn?`;
      if (confirm(msg)) {
        KeduQuizHistory.clearAllHistory(curSubj);
        renderHistoryList();
      }
    });

    // Wire all static .btn-open-quiz-history buttons
    document.querySelectorAll(".btn-open-quiz-history").forEach(b => {
      b.addEventListener("click", (e) => {
        e.preventDefault();
        KeduQuizHistory.openModal();
      });
    });
  }

  /* Render Danh Sách Lịch Sử */
  function renderHistoryList() {
    const listContainer = document.getElementById("qhListContainer");
    if (!listContainer) return;

    const subj = document.getElementById("qhFilterSubject")?.value || "all";
    const sortBy = document.getElementById("qhSortBy")?.value || "newest";
    const search = document.getElementById("qhSearchInput")?.value || "";

    let items = KeduQuizHistory.getHistory({
      subjectId: subj,
      search: search
    });

    // Sắp xếp
    if (sortBy === "highest") {
      items.sort((a, b) => (b.score || 0) - (a.score || 0));
    } else if (sortBy === "lowest") {
      items.sort((a, b) => (a.score || 0) - (b.score || 0));
    } else {
      // newest
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Cập nhật thống kê
    const stats = KeduQuizHistory.getStats(subj);
    document.getElementById("qhStatAttempts").textContent = stats.totalAttempts + " lượt";
    document.getElementById("qhStatAvg").textContent = stats.averageScore + "đ";
    document.getElementById("qhStatHigh").textContent = stats.highestScore + "đ";
    document.getElementById("qhStatAcc").textContent = stats.accuracyRate + "%";

    if (items.length === 0) {
      listContainer.innerHTML = `
        <div class="qh-empty-wrap">
          <div class="qh-empty-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div class="qh-empty-title">Chưa có lịch sử làm bài</div>
          <p class="qh-empty-desc">
            ${subj !== "all" ? "Bạn chưa hoàn thành bài thi nào cho môn học này." : "Bạn chưa làm bài thi ôn tập nào. Kết quả thi sẽ tự động được lưu lại sau khi hoàn thành bài làm."}
          </p>
          <button type="button" class="btn-qh-action btn-qh-view" onclick="KeduQuizHistory.closeModal();">
            Làm bài thi ngay →
          </button>
        </div>
      `;
      return;
    }

    let html = "";
    items.forEach(it => {
      const score = Number(it.score) || 0;
      const scoreClass = score >= 8.0 ? "high" : (score >= 5.0 ? "med" : "low");

      let partPillsHtml = "";
      if (it.partBreakdown) {
        const pb = it.partBreakdown;
        if (pb.mc && pb.mc.max > 0) {
          partPillsHtml += `<span class="qh-part-pill">P.I: ${formatPoints(pb.mc.earned)}/${formatPoints(pb.mc.max)}đ</span>`;
        }
        if (pb.tf && pb.tf.max > 0) {
          partPillsHtml += `<span class="qh-part-pill">P.II: ${formatPoints(pb.tf.earned)}/${formatPoints(pb.tf.max)}đ</span>`;
        }
        if (pb.sa && pb.sa.max > 0) {
          partPillsHtml += `<span class="qh-part-pill">P.III: ${formatPoints(pb.sa.earned)}/${formatPoints(pb.sa.max)}đ</span>`;
        }
      }

      html += `
        <div class="qh-item-card" id="qhItem_${it.id}">
          <div class="qh-item-top">
            <div class="qh-item-meta-left">
              <div class="qh-item-badges">
                <span class="qh-badge qh-badge-subj">${it.subjectName || it.subjectId}</span>
                <span class="qh-badge qh-badge-mode">${it.modeLabel}</span>
                <span class="qh-badge-time">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  ${it.displayTime}
                </span>
                ${it.durationFormatted ? `
                  <span class="qh-badge-time" style="color:#2563eb;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 10"/></svg>
                    ${it.durationFormatted}
                  </span>
                ` : ''}
              </div>

              <h3 class="qh-item-title">${it.topicTitle}</h3>
            </div>

            <div class="qh-score-box">
              <div class="qh-score-val ${scoreClass}">${formatPoints(score)} <span style="font-size:13px; font-weight:700; opacity:0.8;">/ 10đ</span></div>
              <div class="qh-score-sub">✓ Đúng ${it.correctCount} / ${it.totalCount} câu (${it.percentage}%)</div>
            </div>
          </div>

          <div class="qh-item-bottom">
            <div class="qh-part-pills">
              ${partPillsHtml}
            </div>

            <div class="qh-item-actions">
              <button type="button" class="btn-qh-action btn-qh-view" onclick="window.KeduQuizHistory.viewAttemptDetail('${it.id}')" title="Xem chi tiết từng câu hỏi trong lần thi này">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/></svg>
                <span>Xem chi tiết bài làm</span>
              </button>

              <button type="button" class="btn-qh-action btn-qh-retry" onclick="window.retryFromHistory('${it.subjectId}', '${it.topicId}', '${it.mode}')" title="Làm lại đề thi này">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                <span>Làm lại</span>
              </button>

              <button type="button" class="btn-qh-action btn-qh-del" onclick="window.deleteHistoryEntry('${it.id}')" title="Xóa lượt này khỏi lịch sử">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
        </div>
      `;
    });

    listContainer.innerHTML = html;
  }

  /* Render Chi Tiết Bài Làm */
  function renderDetailContent(attempt) {
    document.getElementById("qhdSubjBadge").textContent = attempt.subjectName || attempt.subjectId;
    document.getElementById("qhdModeBadge").textContent = attempt.modeLabel;
    document.getElementById("qhdTitle").textContent = attempt.topicTitle;

    const subEl = document.getElementById("qhdMetaSub");
    subEl.innerHTML = `
      <span>📅 Thời gian nộp: <strong>${attempt.displayTime}</strong></span>
      <span>⏱️ Thời lượng làm bài: <strong>${attempt.durationFormatted}</strong></span>
      <span>🏆 Điểm đạt được: <strong style="color:#22c55e; font-size:15px;">${formatPoints(attempt.score)} / 10.00 điểm</strong> (${attempt.correctCount}/${attempt.totalCount} câu đúng • ${attempt.percentage}%)</span>
    `;

    const retryBtn = document.getElementById("btnQhdRetry");
    if (retryBtn) {
      retryBtn.onclick = () => window.retryFromHistory(attempt.subjectId, attempt.topicId, attempt.mode);
    }

    const bodyEl = document.getElementById("qhdBody");
    const qList = attempt.questionsDetail || [];

    if (qList.length === 0) {
      bodyEl.innerHTML = `
        <div class="qh-empty-wrap">
          <div class="qh-empty-title">Không có dữ liệu chi tiết từng câu</div>
          <p class="qh-empty-desc">Lượt làm bài này được ghi nhận tóm tắt điểm số nhưng chưa lưu chi tiết câu trả lời.</p>
        </div>
      `;
      return;
    }

    let html = "";
    qList.forEach((q, idx) => {
      const isCorrect = q.isCorrect;
      const partLabel = q.part === "mc" ? "Phần I • Trắc nghiệm" : (q.part === "tf" ? "Phần II • Đúng/Sai" : "Phần III • Trả lời ngắn");
      const numLabel = q.questionNumber || (idx + 1);

      let answerBoxHtml = "";
      if (q.part === "tf" && q.subItems) {
        answerBoxHtml = `
          <div class="qh-answer-callout ${isCorrect ? 'correct' : 'wrong'}">
            <div style="font-weight:700; margin-bottom:6px;">
              ${isCorrect ? '✓ Bạn đã chọn ĐÚNG tất cả 4 mệnh đề' : '● Chi tiết các mệnh đề Đúng / Sai:'}
            </div>
            <table style="width:100%; border-collapse:collapse; font-size:12.5px;">
              ${q.subItems.map(it => {
                const isMatch = (it.userVal === it.correctVal);
                return `
                  <tr style="border-bottom:1px solid rgba(0,0,0,0.06);">
                    <td style="padding:4px 0; width:22px; font-weight:800;">${it.letter})</td>
                    <td style="padding:4px 6px;">${it.text}</td>
                    <td style="padding:4px 6px; text-align:right;">
                      <span style="font-weight:700; color:${isMatch ? '#16a34a' : '#dc2626'};">
                        Bạn chọn: ${it.userVal !== undefined ? (it.userVal ? 'Đúng' : 'Sai') : '(Chưa chọn)'}
                      </span>
                      ${!isMatch ? ` → <span style="font-weight:800; color:#16a34a;">Đáp án: ${it.correctVal ? 'Đúng' : 'Sai'}</span>` : ''}
                    </td>
                  </tr>
                `;
              }).join('')}
            </table>
          </div>
        `;
      } else {
        answerBoxHtml = `
          <div class="qh-answer-callout ${isCorrect ? 'correct' : 'wrong'}">
            <div><strong>Câu trả lời của bạn:</strong> ${q.userAnswer || '(Không trả lời)'} ${isCorrect ? '<span style="color:#16a34a; font-weight:800;">✓ CHÍNH XÁC</span>' : '<span style="color:#dc2626; font-weight:800;">✗ CHƯA CHÍNH XÁC</span>'}</div>
            ${!isCorrect && q.correctAnswer ? `<div style="margin-top:4px;"><strong>Đáp án chuẩn:</strong> <span style="color:#16a34a; font-weight:700;">${q.correctAnswer}</span></div>` : ''}
          </div>
        `;
      }

      const diagramHtml = q.diagram ? `<div style="margin-bottom:12px;">${q.diagram}</div>` : '';
      const explainHtml = q.explain ? `
        <div class="qh-explain-box">
          <div style="font-weight:700; margin-bottom:4px; display:flex; align-items:center; gap:6px; color:#0f2657;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <span>Hướng dẫn giải chi tiết:</span>
          </div>
          <div>${q.explain}</div>
        </div>
      ` : '';

      html += `
        <div class="qh-qdetail-item ${isCorrect ? 'is-correct' : 'is-wrong'}">
          <div class="qh-qdetail-top">
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="qh-badge qh-badge-subj">Câu ${numLabel}</span>
              <span class="qh-badge qh-badge-mode">${partLabel}</span>
            </div>
            <div style="font-size:12.5px; font-weight:800; color:${isCorrect ? '#16a34a' : '#dc2626'};">
              +${formatPoints(q.earnedPts || 0)} / ${formatPoints(q.maxPts || 0)} điểm
            </div>
          </div>

          <div class="qh-qdetail-prompt">
            <strong>Câu ${numLabel}.</strong> ${q.qText}
          </div>

          ${diagramHtml}
          ${answerBoxHtml}
          ${explainHtml}
        </div>
      `;
    });

    bodyEl.innerHTML = html;

    // Render KaTeX math in detail review
    if (window.renderMathInElement) {
      renderMathInElement(bodyEl, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
          { left: "\\(", right: "\\)", display: false },
          { left: "\\[", right: "\\]", display: true }
        ],
        throwOnError: false
      });
    }
  }

  /* Global Window Helpers */
  window.deleteHistoryEntry = function (id) {
    if (confirm("Bạn có chắc muốn xóa lượt làm bài này khỏi lịch sử?")) {
      KeduQuizHistory.deleteAttempt(id);
      renderHistoryList();
    }
  };

  window.retryFromHistory = function (subjectId, topicId, mode) {
    KeduQuizHistory.closeModal();
    // Nếu đang ở trang môn học tương ứng và hàm startQuiz tồn tại
    if (window.startQuiz && (!window.CURRENT_SUBJECT_ID || window.CURRENT_SUBJECT_ID === subjectId)) {
      window.startQuiz(topicId, mode);
    } else {
      // Chuyển sang trang môn học tương ứng
      const subjectPageMap = {
        toan: "toan-hoc.html",
        vatli: "vat-li.html",
        hoa: "hoa-hoc.html",
        sinh: "sinh-hoc.html",
        tinhoc: "tin-hoc.html",
        lichsu: "lich-su.html"
      };
      const page = subjectPageMap[subjectId] || "toan-hoc.html";
      const isSubPage = window.location.pathname.includes("/pages/");
      const targetUrl = (isSubPage ? page : `pages/${page}`) + `?topic=${topicId}&mode=${mode}`;
      window.location.href = targetUrl;
    }
  };

  window.openQuizHistoryModal = function (subjectId = null) {
    KeduQuizHistory.openModal(subjectId);
  };

  // Khởi động khi tải xong DOM
  document.addEventListener("DOMContentLoaded", () => {
    injectStyles();
    injectModalDOM();
  });

  // Export module ra toàn cục
  window.KeduQuizHistory = KeduQuizHistory;
})();
