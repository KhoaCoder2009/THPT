/* ========================================================
   KEdu • QUIZ HISTORY SYSTEM (LỊCH SỬ LÀM BÀI THI & ÔN LUYỆN)
   Tự động lưu lại bài làm, điểm số, thời gian, đáp án chi tiết
   Hỗ trợ xem lại bài làm câu hỏi từng phần, phân tích lỗi sai & làm lại đề
   ======================================================== */

(function () {
  "use strict";

  const STORAGE_KEY = "kedu_quiz_history_v1";
  const MAX_HISTORY_ITEMS = 100;
  let currentViewMode = "grouped"; // "grouped" (Theo bộ đề) | "list" (Từng lượt làm)

  /* Helper: Escape HTML */
  function escapeHTML(str) {
    return String(str || "").replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

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
  function isCurrentUserAdmin() {
    try {
      if (window.KeduAuth && typeof window.KeduAuth.isAdmin === "function") {
        return window.KeduAuth.isAdmin();
      }
    } catch (e) {}
    return false;
  }

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

      // 2. Kích hoạt đồng bộ đám mây 2 chiều (Cloud <-> Local) ngầm trong nền
      setTimeout(() => {
        KeduQuizHistory.syncWithCloud(false).catch(() => {});
      }, 100);

      // 3. Dispatch sự kiện thông báo cho toàn hệ thống
      if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
        try {
          window.dispatchEvent(new CustomEvent("kedu:quiz-history-saved", { detail: attempt }));
        } catch (_) {}
      }

      return attempt;
    },

    /**
     * Đồng bộ lịch sử bài làm 2 chiều giữa LocalStorage và Supabase Cloud
     * Đảm bảo học sinh dùng trên máy tính hay điện thoại đều có cùng lịch sử
     */
    syncWithCloud: async function (manualTrigger = false) {
      const client = window.getSupabaseClient ? window.getSupabaseClient() : null;
      const statusEl = document.getElementById("qhSyncStatus");
      const setStatus = (msg) => {
        if (statusEl) statusEl.innerHTML = msg;
      };

      if (!client) {
        if (manualTrigger) setStatus("⚠️ Chưa kết nối Supabase (chạy ngoại tuyến)");
        return { success: false, reason: "no_client" };
      }

      const currentUser = window.KeduAuth && typeof window.KeduAuth.getCurrentUser === "function"
        ? window.KeduAuth.getCurrentUser()
        : null;

      if (!currentUser || !currentUser.username) {
        if (manualTrigger) setStatus("ℹ️ Đăng nhập để đồng bộ lịch sử");
        return { success: false, reason: "not_logged_in" };
      }

      setStatus("🔄 Đang đồng bộ với Cloud...");

      try {
        let localList = getRawHistory();
        let cloudAttempts = [];
        let useTableQuizResults = false;

        // 1. Thử kéo từ bảng quiz_results trước
        try {
          const { data, error } = await client
            .from("quiz_results")
            .select("*")
            .eq("username", currentUser.username)
            .order("created_at", { ascending: false })
            .limit(100);

          if (!error && Array.isArray(data)) {
            useTableQuizResults = true;
            cloudAttempts = data.map(row => ({
              id: row.id || ("att_cloud_" + new Date(row.created_at).getTime()),
              createdAt: row.created_at,
              displayTime: formatDateTime(new Date(row.created_at)),
              username: row.username,
              userFullName: row.student_name || row.username,
              subjectId: row.subject_id,
              subjectName: row.subject_name || row.subject_id,
              topicId: (row.topic_id || "1").toString(),
              topicTitle: row.topic_title || "Bộ đề ôn tập",
              mode: row.mode || "full",
              modeLabel: row.mode === "full" ? "Trọn bộ 3 phần" : (row.mode === "mc" ? "Phần I • Trắc nghiệm" : (row.mode === "tf" ? "Phần II • Đúng/Sai" : "Phần III • Trả lời ngắn")),
              score: Number(row.score) || 0,
              maxScore: Number(row.max_score) || 10.0,
              correctCount: row.correct_count || 0,
              totalCount: row.total_count || row.total || 0,
              wrongCount: row.wrong_count || 0,
              percentage: row.percentage || 0,
              durationSeconds: row.duration_seconds || 0,
              durationFormatted: formatDuration(row.duration_seconds || 0),
              partBreakdown: row.part_breakdown || { mc: { earned: 0, max: 0 }, tf: { earned: 0, max: 0 }, sa: { earned: 0, max: 0 } },
              questionsDetail: Array.isArray(row.questions_detail) ? row.questions_detail : []
            }));
          }
        } catch (_) {}

        // 2. Nếu bảng quiz_results chưa có, dự phòng đồng bộ qua bảng users
        if (!useTableQuizResults) {
          try {
            const { data: userData, error: userErr } = await client
              .from("users")
              .select("email")
              .eq("username", currentUser.username)
              .maybeSingle();

            if (!userErr && userData && userData.email && typeof userData.email === "string" && userData.email.startsWith("kedu_h:")) {
              const rawJson = userData.email.substring(7);
              const parsed = JSON.parse(rawJson);
              if (Array.isArray(parsed)) {
                cloudAttempts = parsed;
              }
            }
          } catch (_) {}
        }

        // 3. Hợp nhất (Merge) 2 chiều không trùng lặp
        const localMap = new Map();
        localList.forEach(item => {
          const key = item.id || `${item.subjectId}_${item.topicId}_${item.score}_${Math.floor(new Date(item.createdAt).getTime() / 60000)}`;
          localMap.set(key, item);
        });

        let newFromCloudCount = 0;
        cloudAttempts.forEach(cItem => {
          const key = cItem.id || `${cItem.subjectId}_${cItem.topicId}_${cItem.score}_${Math.floor(new Date(cItem.createdAt).getTime() / 60000)}`;
          if (!localMap.has(key)) {
            localMap.set(key, cItem);
            newFromCloudCount++;
          }
        });

        const mergedList = Array.from(localMap.values());
        mergedList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        saveRawHistory(mergedList);

        // 4. Đẩy (Push) ngược lại lên Cloud để các thiết bị khác cũng có
        const toSyncUp = mergedList.slice(0, 50).map(it => ({
          id: it.id,
          createdAt: it.createdAt,
          displayTime: it.displayTime,
          username: currentUser.username,
          userFullName: it.userFullName || currentUser.fullName || currentUser.username,
          subjectId: it.subjectId,
          subjectName: it.subjectName,
          topicId: it.topicId,
          topicTitle: it.topicTitle,
          mode: it.mode,
          modeLabel: it.modeLabel,
          score: it.score,
          maxScore: it.maxScore,
          correctCount: it.correctCount,
          totalCount: it.totalCount,
          wrongCount: it.wrongCount,
          percentage: it.percentage,
          durationSeconds: it.durationSeconds,
          durationFormatted: it.durationFormatted,
          partBreakdown: it.partBreakdown
        }));

        if (useTableQuizResults) {
          const existingIds = new Set(cloudAttempts.map(c => c.id));
          const rowsToInsert = mergedList
            .filter(it => !existingIds.has(it.id))
            .map(it => ({
              id: it.id,
              username: currentUser.username,
              student_name: it.userFullName,
              subject_id: it.subjectId,
              subject_name: it.subjectName,
              topic_id: it.topicId,
              topic_title: it.topicTitle,
              mode: it.mode,
              score: it.score,
              max_score: it.maxScore || 10.0,
              correct_count: it.correctCount,
              total_count: it.totalCount,
              wrong_count: it.wrongCount,
              percentage: it.percentage,
              duration_seconds: it.durationSeconds || 0,
              part_breakdown: it.partBreakdown || {},
              questions_detail: it.questionsDetail || [],
              created_at: it.createdAt
            }));

          if (rowsToInsert.length > 0) {
            client.from("quiz_results").insert(rowsToInsert).catch(() => {});
          }
        }

        // Luôn cập nhật bản sao backup vào bảng users
        const cloudPayload = "kedu_h:" + JSON.stringify(toSyncUp);
        await client
          .from("users")
          .update({ email: cloudPayload, updated_at: new Date().toISOString() })
          .eq("username", currentUser.username);

        setStatus(`🟢 Đã đồng bộ Cloud (${mergedList.length} bài)`);

        // Tự động render lại modal nếu đang mở
        const overlay = document.getElementById("quizHistoryModalOverlay");
        if (overlay && overlay.classList.contains("active")) {
          renderHistoryList();
        }

        if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
          try {
            window.dispatchEvent(new CustomEvent("kedu:quiz-history-synced", { detail: { count: mergedList.length } }));
          } catch (_) {}
        }

        return { success: true, count: mergedList.length, newFromCloud: newFromCloudCount };
      } catch (err) {
        console.warn("Lỗi đồng bộ lịch sử Cloud:", err);
        setStatus("⚠️ Đồng bộ Cloud tạm thời gián đoạn");
        return { success: false, error: err.message };
      }
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
      if (!isCurrentUserAdmin()) {
        alert("Học sinh chỉ có quyền xem lại bài làm, không có quyền xóa hay chỉnh sửa lịch sử bài thi!");
        return false;
      }
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
      if (!isCurrentUserAdmin()) {
        alert("Học sinh chỉ có quyền xem lại bài làm, không có quyền xóa toàn bộ lịch sử thi!");
        return false;
      }
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
     * Thống kê tổng quan hoặc theo từng bộ đề
     * Tính toán: Số lượt làm, Điểm cao nhất, Điểm trung bình, Lần gần nhất
     */
    getStats: function (subjectId = null, topicId = null) {
      const list = this.getHistory({ subjectId, topicId });
      const totalAttempts = list.length;
      if (totalAttempts === 0) {
        return {
          totalAttempts: 0,
          averageScore: "0.00",
          highestScore: "0.00",
          lowestScore: "0.00",
          latestScore: "0.00",
          latestTime: "",
          totalQuestionsAnswered: 0,
          accuracyRate: 0,
          totalDurationSeconds: 0
        };
      }

      let sumScore = 0;
      let highest = 0;
      let lowest = 10;
      let totalQ = 0;
      let totalCorrect = 0;
      let totalDuration = 0;

      list.forEach(a => {
        const s = Number(a.score) || 0;
        sumScore += s;
        if (s > highest) highest = s;
        if (s < lowest) lowest = s;
        totalQ += (a.totalCount || 0);
        totalCorrect += (a.correctCount || 0);
        totalDuration += (a.durationSeconds || 0);
      });

      const latest = list[0];

      return {
        totalAttempts,
        averageScore: (sumScore / totalAttempts).toFixed(2),
        highestScore: highest.toFixed(2),
        lowestScore: lowest.toFixed(2),
        latestScore: (Number(latest?.score) || 0).toFixed(2),
        latestTime: latest?.displayTime || "",
        totalQuestionsAnswered: totalQ,
        accuracyRate: totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0,
        totalDurationSeconds: totalDuration
      };
    },

    /**
     * Thống kê gom nhóm theo từng bộ đề (tính điểm cao nhất & điểm trung bình của từng đề)
     */
    getTopicSummaries: function (subjectId = null, search = "") {
      const list = this.getHistory({ subjectId, search });
      const groups = {};

      list.forEach(item => {
        const sId = item.subjectId || "toan";
        const tId = String(item.topicId || "1");
        const key = `${sId}___${tId}`;

        if (!groups[key]) {
          groups[key] = {
            key: key,
            subjectId: sId,
            subjectName: item.subjectName || sId,
            topicId: tId,
            topicTitle: item.topicTitle || "Bộ đề ôn tập",
            attempts: []
          };
        }
        groups[key].attempts.push(item);
      });

      const summaries = Object.values(groups).map(g => {
        const attempts = g.attempts;
        const count = attempts.length;
        let sumScore = 0;
        let highest = 0;
        let lowest = 10;
        let totalQ = 0;
        let totalCorrect = 0;
        let totalDuration = 0;

        attempts.forEach(a => {
          const s = Number(a.score) || 0;
          sumScore += s;
          if (s > highest) highest = s;
          if (s < lowest) lowest = s;
          totalQ += (a.totalCount || 0);
          totalCorrect += (a.correctCount || 0);
          totalDuration += (a.durationSeconds || 0);
        });

        const latest = attempts[0];

        return {
          key: g.key,
          subjectId: g.subjectId,
          subjectName: g.subjectName,
          topicId: g.topicId,
          topicTitle: g.topicTitle,
          totalAttempts: count,
          averageScore: (sumScore / count).toFixed(2),
          highestScore: highest.toFixed(2),
          lowestScore: lowest.toFixed(2),
          latestScore: (Number(latest?.score) || 0).toFixed(2),
          latestTime: latest?.displayTime || "",
          accuracyRate: totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0,
          totalDurationSeconds: totalDuration,
          attempts: attempts
        };
      });

      return summaries;
    },

    /**
     * Lấy danh sách các bộ đề khả dụng (từ lịch sử hoặc từ trang hiện tại)
     */
    getAllTopicsForSubject: function (subjectId = null) {
      const historyList = getRawHistory();
      const topicMap = new Map();

      // 1. Quét từ lịch sử làm bài
      historyList.forEach(item => {
        if (!subjectId || subjectId === "all" || item.subjectId === subjectId) {
          const key = `${item.subjectId}___${item.topicId}`;
          if (!topicMap.has(key)) {
            topicMap.set(key, {
              key: key,
              subjectId: item.subjectId,
              subjectName: item.subjectName || item.subjectId,
              topicId: String(item.topicId),
              topicTitle: item.topicTitle || `Bộ đề #${item.topicId}`
            });
          }
        }
      });

      // 2. Bổ sung từ TOPIC_SETS nếu có
      if (typeof window !== "undefined" && Array.isArray(window.TOPIC_SETS)) {
        const curSubj = window.CURRENT_SUBJECT_ID || subjectId;
        window.TOPIC_SETS.forEach(ts => {
          if (!subjectId || subjectId === "all" || curSubj === subjectId) {
            const key = `${curSubj}___${ts.id}`;
            if (!topicMap.has(key)) {
              topicMap.set(key, {
                key: key,
                subjectId: curSubj,
                subjectName: window.CURRENT_SUBJECT_NAME || curSubj,
                topicId: String(ts.id),
                topicTitle: ts.title || `Bộ đề #${ts.id}`
              });
            }
          }
        });
      }

      return Array.from(topicMap.values());
    },

    /**
     * Mở Modal Lịch sử làm bài (hỗ trợ mở trực tiếp theo môn và bộ đề)
     */
    openModal: function (defaultSubjectId = null, defaultTopicId = null) {
      injectStyles();
      injectModalDOM();

      const overlay = document.getElementById("quizHistoryModalOverlay");
      if (!overlay) return;

      const subjFilter = document.getElementById("qhFilterSubject");
      const targetSubj = defaultSubjectId || (subjFilter && subjFilter.value !== "all" ? subjFilter.value : (window.CURRENT_SUBJECT_ID || "all"));
      if (subjFilter && targetSubj) {
        subjFilter.value = targetSubj;
      }

      populateTopicFilter(targetSubj, defaultTopicId || "all");

      renderHistoryList();
      overlay.classList.add("active");
      document.body.style.overflow = "hidden";

      // Tự động kiểm tra và đồng bộ hai chiều với Cloud Supabase ngầm
      setTimeout(() => {
        KeduQuizHistory.syncWithCloud(false).catch(() => {});
      }, 50);
    },

    openHistoryModal: function (defaultSubjectId = null, defaultTopicId = null) {
      this.openModal(defaultSubjectId, defaultTopicId);
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
        border: 1.5px solid #e2e8f0;
        border-radius: 14px;
        padding: 14px 16px;
        box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .qh-stat-card:hover {
        border-color: #cbd5e1;
        transform: translateY(-2px);
        box-shadow: 0 6px 16px -2px rgba(15, 23, 42, 0.08);
      }
      .qh-stat-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 6px;
      }
      .qh-stat-lbl {
        font-size: 11.5px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #64748b;
      }
      .qh-stat-icon {
        width: 28px;
        height: 28px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .qh-stat-icon.slate { background: #f1f5f9; color: #475569; }
      .qh-stat-icon.blue { background: #eff6ff; color: #2563eb; }
      .qh-stat-icon.green { background: #f0fdf4; color: #16a34a; }
      .qh-stat-icon.purple { background: #faf5ff; color: #7c3aed; }
      .qh-stat-val {
        font-family: var(--font-heading, "Plus Jakarta Sans", sans-serif);
        font-size: 23px;
        font-weight: 850;
        color: #0f2657;
        line-height: 1.15;
      }

      /* CONTROLS BAR */
      .qh-controls-bar {
        padding: 14px 24px;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: #ffffff;
        flex-shrink: 0;
      }
      .qh-controls-top-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        flex-wrap: wrap;
      }
      .qh-search-wrap {
        position: relative;
        flex: 1;
        min-width: 260px;
        display: flex;
        align-items: center;
      }
      .qh-search-icon {
        position: absolute;
        left: 12px;
        color: #94a3b8;
        pointer-events: none;
      }
      .qh-search-input {
        width: 100%;
        padding: 9px 36px 9px 36px;
        border-radius: 10px;
        border: 1.5px solid #cbd5e1;
        font-size: 13.5px;
        color: #0f172a;
        outline: none;
        background: #f8fafc;
        transition: all 0.2s ease;
      }
      .qh-search-input:focus {
        background: #ffffff;
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
      }
      .qh-search-clear {
        position: absolute;
        right: 10px;
        background: #e2e8f0;
        border: none;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        color: #64748b;
        cursor: pointer;
        padding: 0;
        transition: all 0.15s ease;
      }
      .qh-search-clear:hover {
        background: #cbd5e1;
        color: #0f172a;
      }

      /* VIEW SWITCHER SEGMENTED CONTROL */
      .qh-view-switcher {
        display: inline-flex;
        background: #f1f5f9;
        padding: 4px;
        border-radius: 10px;
        border: 1px solid #e2e8f0;
        flex-shrink: 0;
      }
      .qh-view-btn, .qh-view-tab-btn {
        padding: 7px 14px;
        border-radius: 7px;
        border: none;
        background: transparent;
        color: #64748b;
        font-size: 12.5px;
        font-weight: 750;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: all 0.18s ease;
      }
      .qh-view-btn:hover, .qh-view-tab-btn:hover {
        color: #0f2657;
      }
      .qh-view-btn.active, .qh-view-tab-btn.active {
        background: #ffffff;
        color: #1d4ed8;
        box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08);
      }

      /* ROW 2: FILTERS */
      .qh-controls-filter-row {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      .qh-filter-group {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .qh-filter-group.flex-1 {
        flex: 1;
        min-width: 220px;
      }
      .qh-filter-label {
        font-size: 12px;
        font-weight: 750;
        color: #64748b;
        white-space: nowrap;
      }
      .qh-select-wrap {
        position: relative;
        display: inline-flex;
        align-items: center;
      }
      .qh-select-wrap.flex-1 {
        flex: 1;
      }
      .qh-filter-select {
        appearance: none;
        -webkit-appearance: none;
        padding: 7px 30px 7px 12px;
        border-radius: 8px;
        border: 1.5px solid #cbd5e1;
        font-size: 12.5px;
        font-weight: 650;
        color: #1e293b;
        background: #ffffff;
        outline: none;
        cursor: pointer;
        transition: all 0.15s ease;
        width: 100%;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
      }
      .qh-filter-select:focus {
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
      }
      .qh-select-arrow {
        position: absolute;
        right: 9px;
        color: #64748b;
        pointer-events: none;
      }

      /* CONTEXT NOTICE BANNER */
      .qh-context-notice {
        grid-column: 1 / -1;
        padding: 9px 14px;
        border-radius: 10px;
        background: #eff6ff;
        border: 1px solid #bfdbfe;
        color: #1e40af;
        font-size: 13px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
        animation: qhFadeIn 0.2s ease;
      }
      @keyframes qhFadeIn {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: translateY(0); }
      }

      /* TOPIC GROUP CARD (CHẾ ĐỘ XEM THEO BỘ ĐỀ) */
      .qh-topic-group-card {
        background: #ffffff;
        border: 1.5px solid #e2e8f0;
        border-radius: 16px;
        padding: 20px 22px;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
        flex-direction: column;
        gap: 14px;
        box-shadow: 0 2px 6px rgba(15, 23, 42, 0.02);
      }
      .qh-topic-group-card:hover {
        border-color: #93c5fd;
        box-shadow: 0 8px 24px -4px rgba(37, 99, 235, 0.1);
        transform: translateY(-1px);
      }
      .qh-tg-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
      }
      .qh-tg-title-wrap {
        flex: 1;
        min-width: 250px;
      }
      .qh-tg-subj-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;
        flex-wrap: wrap;
      }
      .qh-tg-count-badge {
        background: #f8fafc;
        color: #475569;
        border: 1px solid #e2e8f0;
        font-size: 11.5px;
        font-weight: 700;
        padding: 3px 9px;
        border-radius: 6px;
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
      .qh-tg-title {
        font-family: var(--font-heading, "Plus Jakarta Sans", sans-serif);
        font-size: 17px;
        font-weight: 800;
        color: #0f2657;
        margin: 0;
        line-height: 1.4;
      }

      /* Nút "Làm bài thi đề này" */
      .qh-tg-retry-btn {
        background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
        color: #ffffff;
        border: none;
        border-radius: 9px;
        padding: 9px 18px;
        font-size: 13px;
        font-weight: 750;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 7px;
        box-shadow: 0 3px 10px rgba(37, 99, 235, 0.28);
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        flex-shrink: 0;
      }
      .qh-tg-retry-btn:hover {
        background: linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%);
        transform: translateY(-1px);
        box-shadow: 0 5px 16px rgba(37, 99, 235, 0.38);
      }
      .qh-tg-retry-btn:active {
        transform: translateY(0);
      }

      /* KHỐI 3 KPI METRIC CHO BỘ ĐỀ */
      .qh-tg-kpi-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
      }
      @media (max-width: 640px) {
        .qh-tg-kpi-grid {
          grid-template-columns: 1fr;
        }
      }
      .qh-tg-kpi-item {
        border-radius: 12px;
        padding: 12px 16px;
        border: 1.5px solid #e2e8f0;
        background: #f8fafc;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        transition: all 0.15s ease;
      }
      .qh-tg-kpi-item.high {
        background: #f0fdf4;
        border-color: #bbf7d0;
      }
      .qh-tg-kpi-item.avg {
        background: #eff6ff;
        border-color: #bfdbfe;
      }
      .qh-tg-kpi-item.latest {
        background: #faf5ff;
        border-color: #e9d5ff;
      }
      .qh-tg-kpi-lbl {
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 6px;
      }
      .qh-tg-kpi-item.high .qh-tg-kpi-lbl { color: #15803d; }
      .qh-tg-kpi-item.avg .qh-tg-kpi-lbl { color: #1d4ed8; }
      .qh-tg-kpi-item.latest .qh-tg-kpi-lbl { color: #7e22ce; }
      .qh-tg-kpi-val {
        font-family: var(--font-heading, "Plus Jakarta Sans", sans-serif);
        font-size: 23px;
        font-weight: 850;
        line-height: 1.1;
      }
      .qh-tg-kpi-item.high .qh-tg-kpi-val { color: #16a34a; }
      .qh-tg-kpi-item.avg .qh-tg-kpi-val { color: #2563eb; }
      .qh-tg-kpi-item.latest .qh-tg-kpi-val { color: #9333ea; }
      .qh-tg-kpi-unit {
        font-size: 12.5px;
        font-weight: 700;
        opacity: 0.8;
      }
      .qh-tg-kpi-time {
        font-size: 11.5px;
        font-weight: 600;
        color: #7e22ce;
        display: flex;
        align-items: center;
        gap: 4px;
        margin-top: 4px;
      }

      /* ACCORDION XEM DANH SÁCH LẦN THI */
      .qh-tg-accordion-btn {
        width: 100%;
        padding: 10px 16px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 700;
        color: #334155;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: space-between;
        transition: all 0.18s ease;
      }
      .qh-tg-accordion-btn:hover {
        background: #f1f5f9;
        border-color: #cbd5e1;
        color: #0f2657;
      }
      .qh-accordion-arrow {
        font-size: 14px;
        transition: transform 0.2s ease;
      }
      .qh-tg-accordion-panel {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 8px;
        padding: 12px;
        background: #f8fafc;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
      }
      .qh-tg-nested-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 9px 14px;
        background: #ffffff;
        border-radius: 9px;
        border: 1px solid #e2e8f0;
        font-size: 13px;
        flex-wrap: wrap;
        box-shadow: 0 1px 2px rgba(0,0,0,0.02);
      }
        border: 1px solid #e2e8f0;
        font-size: 13px;
        flex-wrap: wrap;
      }
      .qh-tg-nested-left {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .qh-nested-order {
        font-size: 11.5px;
        font-weight: 800;
        background: #eff6ff;
        color: #2563eb;
        padding: 2px 7px;
        border-radius: 5px;
      }
      .qh-nested-time, .qh-nested-dur {
        color: #64748b;
        font-size: 12px;
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
      .qh-nested-mode {
        font-size: 11px;
        font-weight: 700;
        background: #fef3c7;
        color: #92400e;
        padding: 2px 6px;
        border-radius: 4px;
      }
      .qh-tg-nested-right {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .qh-nested-score {
        font-size: 14px;
        font-weight: 800;
      }
      .qh-nested-score.high { color: #16a34a; }
      .qh-nested-score.med { color: #2563eb; }
      .qh-nested-score.low { color: #dc2626; }
      .qh-nested-pct {
        font-size: 11.5px;
        font-weight: 500;
        color: #64748b;
        margin-left: 4px;
      }
      .btn-mini {
        padding: 4px 10px;
        font-size: 11.5px;
        border-radius: 6px;
      }

      /* TOPIC RECORD PILL ON ITEM CARD */
      .qh-topic-record-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 11.5px;
        font-weight: 700;
        background: #f0fdf4;
        color: #15803d;
        border: 1px solid #bbf7d0;
        padding: 3px 8px;
        border-radius: 6px;
        margin-top: 4px;
      }

      /* SUBJECT CARD HISTORY BADGE */
      .h-card-history-stats {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-top: 6px;
        padding: 4px 10px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .h-card-history-stats:hover {
        background: #eff6ff;
        border-color: #bfdbfe;
        transform: translateY(-1px);
      }
      .h-stat-pill.high {
        color: #16a34a;
        font-weight: 700;
      }
      .h-stat-pill.avg {
        color: #2563eb;
        font-weight: 700;
      }
      .h-stat-pill.count {
        color: #64748b;
        font-size: 11.5px;
      }

      /* CLOUD SYNC BAR */
      .qh-sync-badge-wrap {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(255, 255, 255, 0.12);
        border: 1px solid rgba(255, 255, 255, 0.22);
        padding: 5px 12px;
        border-radius: 10px;
        backdrop-filter: blur(8px);
      }
      .qh-sync-status {
        font-size: 12px;
        font-weight: 600;
        color: #f1f5f9;
        display: inline-flex;
        align-items: center;
        gap: 5px;
      }
      .btn-qh-sync {
        background: #ffffff;
        border: none;
        color: #1e3a8a;
        padding: 5px 12px;
        border-radius: 7px;
        font-size: 12px;
        font-weight: 750;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.12);
        transition: all 0.18s ease;
      }
      .btn-qh-sync:hover {
        background: #eff6ff;
        color: #1d4ed8;
        transform: translateY(-1px);
        box-shadow: 0 3px 8px rgba(0,0,0,0.18);
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
          <div style="display:flex; align-items:center; gap:12px;">
            <div class="qh-sync-badge-wrap">
              <span class="qh-sync-status" id="qhSyncStatus">🟢 Sẵn sàng</span>
              <button type="button" class="btn-qh-sync" id="btnQhSyncCloud" title="Nhấn để kiểm tra và đồng bộ bài thi mới nhất giữa các thiết bị qua Cloud Supabase">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                <span>Đồng bộ Cloud</span>
              </button>
            </div>
            <button type="button" class="qh-btn-close" id="btnQhClose" title="Đóng">✕</button>
          </div>
        </div>

        <!-- STATS BAR -->
        <div class="qh-stats-row">
          <div class="qh-stat-card">
            <div class="qh-stat-header">
              <span class="qh-stat-lbl">Lượt làm bài</span>
              <span class="qh-stat-icon slate">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              </span>
            </div>
            <div class="qh-stat-val" id="qhStatAttempts">0</div>
          </div>
          <div class="qh-stat-card">
            <div class="qh-stat-header">
              <span class="qh-stat-lbl">Điểm trung bình</span>
              <span class="qh-stat-icon blue">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m19 9-5 5-4-4-3 3"/><path d="M3 3v18h18"/></svg>
              </span>
            </div>
            <div class="qh-stat-val" id="qhStatAvg" style="color:#2563eb;">0.00đ</div>
          </div>
          <div class="qh-stat-card">
            <div class="qh-stat-header">
              <span class="qh-stat-lbl">Điểm cao nhất</span>
              <span class="qh-stat-icon green">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
              </span>
            </div>
            <div class="qh-stat-val" id="qhStatHigh" style="color:#16a34a;">0.00đ</div>
          </div>
          <div class="qh-stat-card">
            <div class="qh-stat-header">
              <span class="qh-stat-lbl">Tỷ lệ chính xác</span>
              <span class="qh-stat-icon purple">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
              </span>
            </div>
            <div class="qh-stat-val" id="qhStatAcc" style="color:#7c3aed;">0%</div>
          </div>
        </div>

        <div id="qhStatsContextNotice" class="qh-context-notice" style="display:none;"></div>

        <!-- CONTROLS BAR -->
        <div class="qh-controls-bar">
          <!-- HÀNG 1: TÌM KIẾM & CHUYỂN CHẾ ĐỘ XEM (SEGMENTED CONTROL) -->
          <div class="qh-controls-top-row">
            <div class="qh-search-wrap">
              <svg class="qh-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" class="qh-search-input" id="qhSearchInput" placeholder="Tìm tên đề thi, bài học, môn học...">
              <button type="button" class="qh-search-clear" id="btnQhSearchClear" style="display:none;" title="Xóa tìm kiếm">✕</button>
            </div>

            <div class="qh-view-switcher">
              <button type="button" class="qh-view-btn qh-view-tab-btn active" id="btnQhViewByTopic" title="Gom nhóm lịch sử theo từng bộ đề thi">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                <span>Theo bộ đề</span>
              </button>
              <button type="button" class="qh-view-btn qh-view-tab-btn" id="btnQhViewByList" title="Xem danh sách chi tiết tất cả các lượt làm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span>Từng lượt làm</span>
              </button>
            </div>
          </div>

          <!-- HÀNG 2: BỘ LỌC MÔN HỌC, BỘ ĐỀ VÀ SẮP XẾP -->
          <div class="qh-controls-filter-row">
            <div class="qh-filter-group">
              <label class="qh-filter-label">Môn học:</label>
              <div class="qh-select-wrap">
                <select class="qh-filter-select" id="qhFilterSubject">
                  <option value="all">Tất cả môn học</option>
                  <option value="toan">Toán học 12</option>
                  <option value="vatli">Vật lí 12</option>
                  <option value="hoa">Hóa học 12</option>
                  <option value="sinh">Sinh học 12</option>
                  <option value="tinhoc">Tin học 12</option>
                  <option value="lichsu">Lịch sử 12</option>
                </select>
                <svg class="qh-select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>

            <div class="qh-filter-group flex-1">
              <label class="qh-filter-label">Bộ đề thi:</label>
              <div class="qh-select-wrap flex-1">
                <select class="qh-filter-select" id="qhFilterTopic">
                  <option value="all">Tất cả bộ đề thi</option>
                </select>
                <svg class="qh-select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>

            <div class="qh-filter-group">
              <label class="qh-filter-label">Sắp xếp:</label>
              <div class="qh-select-wrap">
                <select class="qh-filter-select" id="qhSortBy">
                  <option value="newest">Mới nhất trước</option>
                  <option value="highest">Điểm cao nhất</option>
                  <option value="lowest">Điểm thấp nhất</option>
                </select>
                <svg class="qh-select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
          </div>
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
        <div class="qh-footer" style="justify-content: flex-end;">
          <button type="button" class="btn-qh-sec" id="btnQhdBack" style="padding:9px 22px; font-weight:600;">
            ← Đóng xem lại (Về danh sách)
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(detailWrap);

    // Wire Event Listeners
    document.getElementById("btnQhSyncCloud")?.addEventListener("click", () => {
      KeduQuizHistory.syncWithCloud(true);
    });
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

    document.getElementById("qhFilterSubject")?.addEventListener("change", (e) => {
      populateTopicFilter(e.target.value, "all");
      renderHistoryList();
    });
    document.getElementById("qhFilterTopic")?.addEventListener("change", renderHistoryList);
    document.getElementById("qhSortBy")?.addEventListener("change", renderHistoryList);

    // Switch View Mode buttons
    const btnViewTopic = document.getElementById("btnQhViewByTopic");
    const btnViewList = document.getElementById("btnQhViewByList");

    btnViewTopic?.addEventListener("click", () => {
      currentViewMode = "grouped";
      btnViewTopic.classList.add("active");
      btnViewList?.classList.remove("active");
      renderHistoryList();
    });

    btnViewList?.addEventListener("click", () => {
      currentViewMode = "list";
      btnViewList.classList.add("active");
      btnViewTopic?.classList.remove("active");
      renderHistoryList();
    });

    let searchDebounce = null;
    const qhSearchInp = document.getElementById("qhSearchInput");
    const qhSearchClr = document.getElementById("btnQhSearchClear");
    qhSearchInp?.addEventListener("input", () => {
      if (qhSearchClr) qhSearchClr.style.display = qhSearchInp.value.trim() ? "flex" : "none";
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(renderHistoryList, 250);
    });
    qhSearchClr?.addEventListener("click", () => {
      if (qhSearchInp) qhSearchInp.value = "";
      qhSearchClr.style.display = "none";
      renderHistoryList();
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

  /**
   * Cập nhật danh sách bộ đề trong dropdown #qhFilterTopic
   */
  function populateTopicFilter(selectedSubj = "all", keepSelectedTopic = "all") {
    const topicSelect = document.getElementById("qhFilterTopic");
    if (!topicSelect) return;

    const topics = KeduQuizHistory.getAllTopicsForSubject(selectedSubj);
    let optionsHtml = '<option value="all">Tất cả bộ đề thi</option>';

    topics.forEach(t => {
      const isSel = (String(t.topicId) === String(keepSelectedTopic)) ? 'selected' : '';
      optionsHtml += `<option value="${escapeHTML(t.topicId)}" ${isSel}>${escapeHTML(t.topicTitle)}</option>`;
    });

    topicSelect.innerHTML = optionsHtml;
  }

  /* Render Danh Sách Lịch Sử (Điều phối Chế độ xem: Theo bộ đề | Từng lượt làm) */
  function renderHistoryList() {
    const listContainer = document.getElementById("qhListContainer");
    if (!listContainer) return;

    const subj = document.getElementById("qhFilterSubject")?.value || "all";
    const topicId = document.getElementById("qhFilterTopic")?.value || "all";
    const sortBy = document.getElementById("qhSortBy")?.value || "newest";
    const search = document.getElementById("qhSearchInput")?.value || "";

    // 1. Cập nhật Thống kê KPIs (hỗ trợ lọc chuẩn theo từng bộ đề cụ thể)
    const stats = KeduQuizHistory.getStats(subj, topicId);
    const statAttemptsEl = document.getElementById("qhStatAttempts");
    const statAvgEl = document.getElementById("qhStatAvg");
    const statHighEl = document.getElementById("qhStatHigh");
    const statAccEl = document.getElementById("qhStatAcc");

    if (statAttemptsEl) statAttemptsEl.textContent = stats.totalAttempts + " lượt";
    if (statAvgEl) statAvgEl.textContent = stats.averageScore + "đ";
    if (statHighEl) statHighEl.textContent = stats.highestScore + "đ";
    if (statAccEl) statAccEl.textContent = stats.accuracyRate + "%";

    // 2. Thông báo ngữ cảnh khi đang lọc theo 1 bộ đề riêng biệt
    const noticeEl = document.getElementById("qhStatsContextNotice");
    if (noticeEl) {
      if (topicId !== "all" && stats.totalAttempts > 0) {
        const topicSelect = document.getElementById("qhFilterTopic");
        const topicText = topicSelect?.options[topicSelect.selectedIndex]?.text || "Bộ đề đã chọn";
        noticeEl.style.display = "flex";
        noticeEl.innerHTML = `
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
          <div class="qh-context-notice-text">
            Đang lọc dữ liệu bài thi: <strong>${escapeHTML(topicText)}</strong> • 
            Điểm cao nhất: <span class="qh-highlight-score high">${stats.highestScore}đ</span> • 
            Điểm trung bình: <span class="qh-highlight-score avg">${stats.averageScore}đ</span> • 
            Lần thi gần nhất: <strong>${stats.latestScore}đ</strong> (${stats.latestTime || 'Chưa rõ'})
          </div>
        `;
      } else {
        noticeEl.style.display = "none";
        noticeEl.innerHTML = "";
      }
    }

    // 3. Phân nhánh hiển thị theo currentViewMode
    if (currentViewMode === "grouped") {
      renderGroupedByTopicView(listContainer, subj, topicId, sortBy, search);
    } else {
      renderFlatHistoryListView(listContainer, subj, topicId, sortBy, search);
    }

    const btnClearEl = document.getElementById("btnQhClear");
    if (btnClearEl) btnClearEl.style.display = isCurrentUserAdmin() ? "" : "none";
  }

  /**
   * CHẾ ĐỘ XEM 1: GOM NHÓM THEO TỪNG BỘ ĐỀ (TÍNH ĐIỂM CAO NHẤT & ĐIỂM TRUNG BÌNH CỦA BỘ ĐỀ ĐÓ)
   */
  function renderGroupedByTopicView(listContainer, subj, topicId, sortBy, search) {
    let summaries = KeduQuizHistory.getTopicSummaries(subj, search);

    if (topicId !== "all") {
      summaries = summaries.filter(s => String(s.topicId) === String(topicId));
    }

    // Sắp xếp các bộ đề
    if (sortBy === "highest") {
      summaries.sort((a, b) => (Number(b.highestScore) || 0) - (Number(a.highestScore) || 0));
    } else if (sortBy === "lowest") {
      summaries.sort((a, b) => (Number(a.highestScore) || 0) - (Number(b.highestScore) || 0));
    } else {
      // Sắp xếp theo lần thi gần nhất
      summaries.sort((a, b) => {
        const timeA = a.attempts[0]?.createdAt ? new Date(a.attempts[0].createdAt).getTime() : 0;
        const timeB = b.attempts[0]?.createdAt ? new Date(b.attempts[0].createdAt).getTime() : 0;
        return timeB - timeA;
      });
    }

    if (summaries.length === 0) {
      listContainer.innerHTML = `
        <div class="qh-empty-wrap">
          <div class="qh-empty-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div class="qh-empty-title">Chưa có lịch sử làm bài</div>
          <p class="qh-empty-desc">
            ${subj !== "all" ? "Bạn chưa hoàn thành bài thi nào cho môn học này." : "Bạn chưa làm bài thi ôn tập nào. Hãy chọn một bộ đề và bắt đầu làm bài!"}
          </p>
          <button type="button" class="btn-qh-action btn-qh-view" onclick="KeduQuizHistory.closeModal();">
            Làm bài thi ngay →
          </button>
        </div>
      `;
      return;
    }

    let html = "";
    summaries.forEach((sum, idx) => {
      const panelId = `qhTgPanel_${idx}_${sum.subjectId}_${sum.topicId}`;
      const highestNum = Number(sum.highestScore) || 0;
      const avgNum = Number(sum.averageScore) || 0;

      // HTML cho các lượt làm chi tiết bên trong accordion
      let nestedAttemptsHtml = "";
      sum.attempts.forEach((att, attIdx) => {
        const attScore = Number(att.score) || 0;
        const scoreClass = attScore >= 8.0 ? "high" : (attScore >= 5.0 ? "med" : "low");

        nestedAttemptsHtml += `
          <div class="qh-tg-nested-row">
            <div class="qh-tg-nested-left">
              <span class="qh-nested-order">#${sum.attempts.length - attIdx}</span>
              <span class="qh-nested-time">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                ${escapeHTML(att.displayTime)}
              </span>
              ${att.durationFormatted ? `
                <span class="qh-nested-dur">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 10"/></svg>
                  ${escapeHTML(att.durationFormatted)}
                </span>
              ` : ''}
              <span class="qh-nested-mode">${escapeHTML(att.modeLabel || 'Trọn bộ')}</span>
            </div>

            <div class="qh-tg-nested-right">
              <span class="qh-nested-score ${scoreClass}">
                ${formatPoints(attScore)} <span style="font-size:11px; font-weight:600; opacity:0.75;">/ 10đ</span>
                <span class="qh-nested-pct">(${att.percentage || 0}%)</span>
              </span>
              <button type="button" class="btn-qh-action btn-qh-view btn-mini" onclick="window.KeduQuizHistory.viewAttemptDetail('${att.id}')">
                Chi tiết
              </button>
            </div>
          </div>
        `;
      });

      html += `
        <div class="qh-topic-group-card" id="qhTopicCard_${sum.key}">
          <div class="qh-tg-header">
            <div class="qh-tg-title-wrap">
              <div class="qh-tg-subj-row">
                <span class="qh-badge qh-badge-subj">${escapeHTML(sum.subjectName)}</span>
                <span class="qh-tg-count-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  ${sum.totalAttempts} lượt làm bài
                </span>
              </div>
              <h3 class="qh-tg-title">${escapeHTML(sum.topicTitle)}</h3>
            </div>

            <button type="button" class="qh-tg-retry-btn" onclick="window.retryTopicFromHistory('${escapeHTML(sum.subjectId)}', '${escapeHTML(sum.topicId)}')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              <span>Làm bài thi đề này</span>
            </button>
          </div>

          <!-- KHỐI KPI ĐIỂM CAO NHẤT & ĐIỂM TRUNG BÌNH CỦA RIÊNG BỘ ĐỀ ĐÓ -->
          <div class="qh-tg-kpi-grid">
            <div class="qh-tg-kpi-item high">
              <div class="qh-tg-kpi-lbl">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45 1-1 1H7.5c-.55 0-1 .45-1 1v1c0 .55.45 1 1 1h9c.55 0 1-.45 1-1v-1c0-.55-.45-1-1-1H15c-.55 0-1-.45-1-1v-2.34"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                <span>Điểm cao nhất</span>
              </div>
              <div class="qh-tg-kpi-val">
                ${sum.highestScore} <span class="qh-tg-kpi-unit">/ 10đ</span>
              </div>
            </div>

            <div class="qh-tg-kpi-item avg">
              <div class="qh-tg-kpi-lbl">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                <span>Điểm trung bình</span>
              </div>
              <div class="qh-tg-kpi-val">
                ${sum.averageScore} <span class="qh-tg-kpi-unit">/ 10đ</span>
              </div>
            </div>

            <div class="qh-tg-kpi-item latest">
              <div class="qh-tg-kpi-lbl">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span>Lần gần nhất</span>
              </div>
              <div class="qh-tg-kpi-val">
                ${sum.latestScore} <span class="qh-tg-kpi-unit">/ 10đ</span>
              </div>
              <span class="qh-tg-kpi-time">${escapeHTML(sum.latestTime || '')}</span>
            </div>
          </div>

          <!-- ACCORDION XEM DANH SÁCH CÁC LẦN THI CỦA BỘ ĐỀ NÀY -->
          <div class="qh-tg-accordion">
            <button type="button" class="qh-tg-accordion-btn" onclick="window.toggleTopicAttemptsAccordion('${panelId}', this)">
              <span>Lịch sử chi tiết (${sum.attempts.length} lượt làm)</span>
              <span class="qh-accordion-arrow">▾</span>
            </button>
            <div class="qh-tg-accordion-panel" id="${panelId}" style="display:none;">
              ${nestedAttemptsHtml}
            </div>
          </div>
        </div>
      `;
    });

    listContainer.innerHTML = html;
  }

  /**
   * CHẾ ĐỘ XEM 2: DANH SÁCH TUẦN TỰ TỪNG LƯỢT LÀM
   */
  function renderFlatHistoryListView(listContainer, subj, topicId, sortBy, search) {
    let items = KeduQuizHistory.getHistory({
      subjectId: subj,
      topicId: topicId,
      search: search
    });

    // Sắp xếp
    if (sortBy === "highest") {
      items.sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0));
    } else if (sortBy === "lowest") {
      items.sort((a, b) => (Number(a.score) || 0) - (Number(b.score) || 0));
    } else {
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

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

    // Tra cứu điểm cao nhất của từng bộ đề để gắn huy hiệu kỉ lục
    const topicMaxScores = {};
    items.forEach(it => {
      const key = `${it.subjectId}_${it.topicId}`;
      const sc = Number(it.score) || 0;
      if (!topicMaxScores[key] || sc > topicMaxScores[key]) {
        topicMaxScores[key] = sc;
      }
    });

    let html = "";
    items.forEach(it => {
      const score = Number(it.score) || 0;
      const scoreClass = score >= 8.0 ? "high" : (score >= 5.0 ? "med" : "low");
      const key = `${it.subjectId}_${it.topicId}`;
      const isRecord = score > 0 && score === topicMaxScores[key];

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
                <span class="qh-badge qh-badge-subj">${escapeHTML(it.subjectName || it.subjectId)}</span>
                <span class="qh-badge qh-badge-mode">${escapeHTML(it.modeLabel)}</span>
                <span class="qh-badge-time">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  ${escapeHTML(it.displayTime)}
                </span>
                ${it.durationFormatted ? `
                  <span class="qh-badge-time" style="color:#2563eb;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 10"/></svg>
                    ${escapeHTML(it.durationFormatted)}
                  </span>
                ` : ''}
              </div>

              <h3 class="qh-item-title">${escapeHTML(it.topicTitle)}</h3>
              ${isRecord ? `
                <div class="qh-topic-record-pill">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45 1-1 1H7.5c-.55 0-1 .45-1 1v1c0 .55.45 1 1 1h9c.55 0 1-.45 1-1v-1c0-.55-.45-1-1-1H15c-.55 0-1-.45-1-1v-2.34"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                  <span>Điểm cao nhất của bộ đề này</span>
                </div>
              ` : ''}
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
              <button type="button" class="btn-qh-action btn-qh-view" onclick="window.KeduQuizHistory.viewAttemptDetail('${it.id}')" title="Xem lại chi tiết bài làm đã nộp">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/></svg>
                <span>Xem lại bài làm</span>
              </button>
              ${isCurrentUserAdmin() ? `
                <button type="button" class="btn-qh-action btn-qh-del" onclick="window.deleteHistoryEntry('${it.id}')" title="Xóa lượt này khỏi lịch sử (Chỉ Quản trị viên)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    });

    listContainer.innerHTML = html;
  }

  // Toggle Accordion
  window.toggleTopicAttemptsAccordion = function (panelId, btnEl) {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    const isHidden = panel.style.display === "none";
    panel.style.display = isHidden ? "flex" : "none";
    const arrow = btnEl ? btnEl.querySelector(".qh-accordion-arrow") : null;
    if (arrow) {
      arrow.textContent = isHidden ? "▴" : "▾";
    }
  };

  // Làm bài thi lại từ lịch sử
  window.retryTopicFromHistory = function (subjectId, topicId) {
    KeduQuizHistory.closeModal();
    if (window.startQuiz && typeof window.startQuiz === "function") {
      window.startQuiz(topicId, "full");
    } else {
      const pageMap = {
        toan: "toan-hoc.html",
        vatli: "vat-li.html",
        hoa: "hoa-hoc.html",
        sinh: "sinh-hoc.html",
        tinhoc: "tin-hoc.html",
        lichsu: "lich-su.html"
      };
      const pageName = pageMap[subjectId] || "toan-hoc.html";
      const targetUrl = window.location.pathname.includes("/pages/") ? pageName : `pages/${pageName}`;
      window.location.href = targetUrl;
    }
  };

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
      <span style="display:inline-flex; align-items:center; gap:5px; background:#f1f5f9; color:#475569; padding:3px 10px; border-radius:6px; font-weight:700; font-size:12px; border:1px solid #cbd5e1;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        Hồ sơ xem lại bài đã làm (Chỉ đọc • Điểm và câu trả lời đã được khóa)
      </span>
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
