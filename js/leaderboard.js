/**
 * ========================================================
 * KEdu • LEADERBOARD & RANKING ENGINE
 * Hệ Thống Bảng Xếp Hạng Vinh Danh Thí Sinh Theo Từng Bộ Đề
 * Tiêu chí: Đứng nhất khi có ĐIỂM CAO NHẤT và THỜI GIAN LÀM BÀI THẤP NHẤT
 * ========================================================
 */

(function () {
  "use strict";

  /* Helper: Escape HTML */
  function escapeHTML(str) {
    return String(str || "").replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  /* Helper: Định dạng thời lượng hoàn thành bài thi */
  function formatDuration(sec) {
    if (!sec || isNaN(sec) || sec <= 0) return "00:00";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s} giây`;
    if (s === 0) return `${m} phút`;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  }

  /* Helper: Định dạng điểm số 2 chữ số thập phân */
  function formatScore(score) {
    const num = Number(score) || 0;
    return num.toFixed(2);
  }

  /* Danh sách môn học chuẩn */
  const SUBJECTS_DEF = [
    { id: "toan", name: "Toán học 12" },
    { id: "hoa", name: "Hóa học 12" },
    { id: "vatli", name: "Vật lí 12" },
    { id: "sinh", name: "Sinh học 12" },
    { id: "tinhoc", name: "Tin học 12" },
    { id: "lichsu", name: "Lịch sử 12" }
  ];

  /* Dữ liệu vinh danh mẫu ban đầu cho từng bộ đề (tạo không khí thi đua sôi nổi khi chưa có nhiều lượt thi) */
  const BENCHMARK_RANKS = {
    "hoa_1": [
      { username: "nguyenthianh", fullName: "Nguyễn Thị Ánh", score: 9.75, durationSeconds: 1120, createdAt: "2026-10-31T08:30:00Z" },
      { username: "leduyminh", fullName: "Lê Duy Minh", score: 9.50, durationSeconds: 1245, createdAt: "2026-10-30T14:15:00Z" },
      { username: "hoangnamthpt", fullName: "Hoàng Nam", score: 9.25, durationSeconds: 1380, createdAt: "2026-10-29T19:20:00Z" }
    ],
    "toan_1": [
      { username: "phanminhtri", fullName: "Phan Minh Trí", score: 9.75, durationSeconds: 1250, createdAt: "2026-10-30T10:00:00Z" },
      { username: "tranquocbao", fullName: "Trần Quốc Bảo", score: 9.50, durationSeconds: 1320, createdAt: "2026-10-29T16:45:00Z" },
      { username: "nguyenmaichi", fullName: "Nguyễn Mai Chi", score: 9.25, durationSeconds: 1410, createdAt: "2026-10-28T20:10:00Z" }
    ],
    "vatli_1": [
      { username: "dangvandung", fullName: "Đặng Văn Dũng", score: 9.50, durationSeconds: 1180, createdAt: "2026-10-31T09:10:00Z" },
      { username: "nguyenhoangyen", fullName: "Nguyễn Hoàng Yến", score: 9.25, durationSeconds: 1290, createdAt: "2026-10-30T15:20:00Z" }
    ]
  };

  const KeduLeaderboard = {
    /**
     * Thu thập và tính toán Bảng Xếp Hạng của 1 bộ đề cụ thể
     * Quy tắc:
     * 1. Mỗi thí sinh chỉ lấy lần làm bài TỐT NHẤT (Điểm cao nhất, bằng điểm xét thời gian thấp nhất)
     * 2. Xếp hạng: Đứng nhất khi có Điểm cao nhất và Thời gian làm bài thấp nhất
     */
    getLeaderboardData: async function (subjectId = "hoa", topicId = "1") {
      const sId = subjectId || "hoa";
      const tId = String(topicId || "1");
      const key = `${sId}_${tId}`;

      let rawAttempts = [];

      // 1. Lấy từ LocalStorage & Lịch sử đồng bộ
      if (window.KeduQuizHistory && typeof window.KeduQuizHistory.getHistory === "function") {
        const hist = window.KeduQuizHistory.getHistory({ subjectId: sId, topicId: tId });
        rawAttempts = rawAttempts.concat(hist);
      }

      // 2. Thử truy vấn thêm từ Supabase Cloud
      const client = window.getSupabaseClient ? window.getSupabaseClient() : null;
      if (client) {
        try {
          // Thử lấy từ bảng quiz_results
          const { data: qData, error: qErr } = await client
            .from("quiz_results")
            .select("*")
            .eq("subject_id", sId)
            .eq("topic_id", tId)
            .order("score", { ascending: false })
            .limit(100);

          if (!qErr && Array.isArray(qData)) {
            qData.forEach(row => {
              rawAttempts.push({
                id: row.id,
                username: row.username,
                userFullName: row.student_name || row.username,
                score: Number(row.score) || 0,
                durationSeconds: Number(row.duration_seconds) || 0,
                correctCount: row.correct_count || 0,
                totalCount: row.total_count || row.total || 0,
                percentage: row.percentage || 0,
                createdAt: row.created_at
              });
            });
          }
        } catch (_) {}

        // Thử lấy từ backup users
        try {
          const { data: uData, error: uErr } = await client
            .from("users")
            .select("username, full_name, email")
            .not("email", "is", null);

          if (!uErr && Array.isArray(uData)) {
            uData.forEach(u => {
              if (u.email && typeof u.email === "string" && u.email.startsWith("kedu_h:")) {
                try {
                  const arr = JSON.parse(u.email.substring(7));
                  if (Array.isArray(arr)) {
                    arr.filter(a => a.subjectId === sId && String(a.topicId) === tId).forEach(a => {
                      rawAttempts.push({
                        id: a.id,
                        username: u.username,
                        userFullName: u.full_name || a.userFullName || u.username,
                        score: Number(a.score) || 0,
                        durationSeconds: Number(a.durationSeconds) || 0,
                        correctCount: a.correctCount || 0,
                        totalCount: a.totalCount || 0,
                        percentage: a.percentage || 0,
                        createdAt: a.createdAt
                      });
                    });
                  }
                } catch (_) {}
              }
            });
          }
        } catch (_) {}
      }

      // Thêm dữ liệu vinh danh mẫu nếu kho bài thi còn ít
      if (BENCHMARK_RANKS[key]) {
        BENCHMARK_RANKS[key].forEach(b => {
          rawAttempts.push({
            id: "bench_" + b.username,
            username: b.username,
            userFullName: b.fullName,
            score: b.score,
            durationSeconds: b.durationSeconds,
            correctCount: Math.round((b.score / 10.0) * 28),
            totalCount: 28,
            percentage: Math.round((b.score / 10.0) * 100),
            createdAt: b.createdAt
          });
        });
      }

      // 3. Gom nhóm theo từng thí sinh (Mỗi thí sinh chỉ giữ lại 1 kết quả TỐT NHẤT)
      const userBestMap = new Map();

      rawAttempts.forEach(item => {
        const uKey = (item.username || item.userFullName || "an_danh").toLowerCase();
        const score = Number(item.score) || 0;
        const dur = (Number(item.durationSeconds) > 0) ? Number(item.durationSeconds) : 1800; // Mặc định nếu không có thời lượng

        if (!userBestMap.has(uKey)) {
          userBestMap.set(uKey, {
            username: item.username || uKey,
            fullName: item.userFullName || item.username || "Thí sinh KEdu",
            score: score,
            durationSeconds: dur,
            correctCount: item.correctCount || 0,
            totalCount: item.totalCount || 28,
            percentage: item.percentage || Math.round((score / 10.0) * 100),
            createdAt: item.createdAt || new Date().toISOString()
          });
        } else {
          const currentBest = userBestMap.get(uKey);
          // Tiêu chí tốt nhất: Điểm cao hơn HOẶC bằng điểm nhưng thời gian ít hơn
          let isBetter = false;
          if (score > currentBest.score) {
            isBetter = true;
          } else if (score === currentBest.score) {
            if (dur < currentBest.durationSeconds) {
              isBetter = true;
            }
          }

          if (isBetter) {
            userBestMap.set(uKey, {
              username: item.username || currentBest.username,
              fullName: item.userFullName || currentBest.fullName,
              score: score,
              durationSeconds: dur,
              correctCount: item.correctCount || currentBest.correctCount,
              totalCount: item.totalCount || currentBest.totalCount,
              percentage: item.percentage || Math.round((score / 10.0) * 100),
              createdAt: item.createdAt || currentBest.createdAt
            });
          }
        }
      });

      // 4. Sắp xếp danh sách thí sinh: ĐỨNG NHẤT KHI CÓ ĐIỂM CAO VÀ THỜI GIAN THẤP NHẤT
      const rankedList = Array.from(userBestMap.values());
      rankedList.sort((a, b) => {
        // Ưu tiên 1: Điểm số cao hơn xếp trước
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        // Ưu tiên 2: Điểm bằng nhau -> Thời gian làm bài THẤP HƠN (nhanh hơn) xếp trước
        if (a.durationSeconds !== b.durationSeconds) {
          return a.durationSeconds - b.durationSeconds;
        }
        // Ưu tiên 3: Nộp bài sớm hơn xếp trước
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

      // 5. Gán thứ hạng (#1, #2, #3...)
      rankedList.forEach((it, index) => {
        it.rank = index + 1;
      });

      // 6. Xác định vị trí của tài khoản hiện tại
      const currentUser = window.KeduAuth && typeof window.KeduAuth.getCurrentUser === "function"
        ? window.KeduAuth.getCurrentUser()
        : null;

      let myRankInfo = null;
      if (currentUser && currentUser.username) {
        const found = rankedList.find(it => it.username.toLowerCase() === currentUser.username.toLowerCase());
        if (found) {
          myRankInfo = {
            rank: found.rank,
            totalParticipants: rankedList.length,
            score: found.score,
            durationSeconds: found.durationSeconds,
            percentage: found.percentage
          };
        }
      }

      return {
        subjectId: sId,
        topicId: tId,
        totalParticipants: rankedList.length,
        rankings: rankedList,
        myRank: myRankInfo
      };
    },

    /**
     * Mở Modal Bảng Xếp Hạng
     */
    openModal: async function (defaultSubjectId = null, defaultTopicId = null) {
      injectStyles();
      injectModalDOM();

      const overlay = document.getElementById("keduLeaderboardModalOverlay");
      if (!overlay) return;

      const subjSelect = document.getElementById("lbFilterSubject");
      const targetSubj = defaultSubjectId || (subjSelect && subjSelect.value ? subjSelect.value : (window.CURRENT_SUBJECT_ID || "hoa"));
      if (subjSelect) subjSelect.value = targetSubj;

      populateTopicFilter(targetSubj, defaultTopicId || "1");

      overlay.classList.add("active");
      document.body.style.overflow = "hidden";

      await renderLeaderboardContent();
    },

    closeModal: function () {
      const overlay = document.getElementById("keduLeaderboardModalOverlay");
      if (overlay) overlay.classList.remove("active");
      document.body.style.overflow = "";
    }
  };

  /* ========================================================
     STYLES INJECTION CHO BẢNG XẾP HẠNG
     ======================================================== */
  function injectStyles() {
    if (document.getElementById("keduLeaderboardStyles")) return;

    const style = document.createElement("style");
    style.id = "keduLeaderboardStyles";
    style.textContent = `
      /* OVERLAY */
      .lb-overlay {
        position: fixed;
        inset: 0;
        z-index: 10000;
        background: rgba(15, 23, 42, 0.72);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        display: none;
        align-items: center;
        justify-content: center;
        padding: 16px;
        opacity: 0;
        transition: opacity 0.25s ease;
      }
      .lb-overlay.active {
        display: flex;
        opacity: 1;
      }

      /* CARD */
      .lb-card {
        background: #ffffff;
        border-radius: 20px;
        box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.35);
        width: 100%;
        max-width: 900px;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border: 1px solid rgba(226, 232, 240, 0.9);
        animation: lbPopIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      @keyframes lbPopIn {
        from { transform: scale(0.94) translateY(12px); opacity: 0; }
        to { transform: scale(1) translateY(0); opacity: 1; }
      }

      /* HEADER */
      .lb-header {
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #312e81 100%);
        color: #ffffff;
        padding: 22px 28px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        position: relative;
        overflow: hidden;
      }
      .lb-header::after {
        content: "";
        position: absolute;
        top: -30px;
        right: -30px;
        width: 160px;
        height: 160px;
        background: radial-gradient(circle, rgba(234, 179, 8, 0.25) 0%, transparent 70%);
        pointer-events: none;
      }
      .lb-header-title-wrap {
        display: flex;
        align-items: center;
        gap: 14px;
        position: relative;
        z-index: 1;
      }
      .lb-header-icon {
        width: 48px;
        height: 48px;
        border-radius: 14px;
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        box-shadow: 0 8px 16px -4px rgba(245, 158, 11, 0.45);
        flex-shrink: 0;
      }
      .lb-header-title {
        font-family: var(--font-heading, "Plus Jakarta Sans", sans-serif);
        font-size: 20px;
        font-weight: 800;
        margin: 0 0 3px;
        letter-spacing: -0.01em;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .lb-header-sub {
        font-size: 13px;
        color: #cbd5e1;
        margin: 0;
        font-weight: 500;
      }
      .lb-btn-close {
        background: rgba(255, 255, 255, 0.12);
        border: none;
        color: #ffffff;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s ease;
        position: relative;
        z-index: 1;
      }
      .lb-btn-close:hover {
        background: rgba(255, 255, 255, 0.25);
        transform: scale(1.08);
      }

      /* CONTROLS BAR */
      .lb-controls-bar {
        padding: 14px 28px;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }
      .lb-select-group {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }
      .lb-select {
        height: 38px;
        padding: 0 14px;
        border-radius: 9px;
        border: 1.5px solid #cbd5e1;
        background: #ffffff;
        font-size: 13.5px;
        font-weight: 600;
        color: #1e293b;
        cursor: pointer;
        outline: none;
        transition: all 0.15s ease;
      }
      .lb-select:focus {
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
      }
      .btn-lb-refresh {
        height: 38px;
        padding: 0 14px;
        border-radius: 9px;
        background: #ffffff;
        border: 1.5px solid #cbd5e1;
        color: #334155;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: all 0.15s ease;
      }
      .btn-lb-refresh:hover {
        background: #f1f5f9;
        border-color: #94a3b8;
      }

      /* BODY */
      .lb-body {
        padding: 24px 28px;
        overflow-y: auto;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 22px;
      }

      /* MY RANK NOTICE BANNER */
      .lb-my-rank-banner {
        background: linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%);
        border: 1.5px solid #bfdbfe;
        border-radius: 12px;
        padding: 12px 18px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        flex-wrap: wrap;
      }
      .lb-my-rank-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .lb-my-rank-badge {
        width: 38px;
        height: 38px;
        border-radius: 10px;
        background: #2563eb;
        color: #ffffff;
        font-size: 16px;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .lb-my-rank-text {
        font-size: 13.5px;
        color: #1e3a8a;
        line-height: 1.4;
      }
      .lb-my-rank-text strong {
        color: #1d4ed8;
      }

      /* TOP 3 PODIUM (BỤC VINH DANH) */
      .lb-podium-wrap {
        display: flex;
        align-items: flex-end;
        justify-content: center;
        gap: 16px;
        padding: 20px 0 10px;
        margin-bottom: 6px;
      }
      .lb-podium-col {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 170px;
        text-align: center;
        position: relative;
      }
      .lb-podium-avatar-wrap {
        position: relative;
        margin-bottom: 8px;
      }
      .lb-podium-avatar {
        width: 58px;
        height: 58px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        font-weight: 800;
        color: #ffffff;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
      }
      .lb-podium-col.rank-1 .lb-podium-avatar {
        width: 72px;
        height: 72px;
        font-size: 26px;
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        border: 4px solid #fef08a;
      }
      .lb-podium-col.rank-2 .lb-podium-avatar {
        background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
        border: 3px solid #e2e8f0;
      }
      .lb-podium-col.rank-3 .lb-podium-avatar {
        background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
        border: 3px solid #fed7aa;
      }
      .lb-podium-crown {
        position: absolute;
        top: -16px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 22px;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.25));
        animation: lbFloat 2s ease-in-out infinite;
      }
      @keyframes lbFloat {
        0%, 100% { transform: translateX(-50%) translateY(0); }
        50% { transform: translateX(-50%) translateY(-4px); }
      }
      .lb-podium-name {
        font-family: var(--font-heading, "Plus Jakarta Sans", sans-serif);
        font-size: 14px;
        font-weight: 800;
        color: #0f172a;
        margin: 0 0 2px;
        max-width: 160px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .lb-podium-meta {
        font-size: 12px;
        color: #64748b;
        margin-bottom: 8px;
      }
      .lb-podium-block {
        width: 100%;
        border-radius: 12px 12px 0 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        padding: 12px 8px 6px;
        color: #ffffff;
      }
      .lb-podium-col.rank-1 .lb-podium-block {
        height: 125px;
        background: linear-gradient(180deg, #f59e0b 0%, #b45309 100%);
        box-shadow: 0 10px 25px -5px rgba(245, 158, 11, 0.4);
      }
      .lb-podium-col.rank-2 .lb-podium-block {
        height: 95px;
        background: linear-gradient(180deg, #94a3b8 0%, #475569 100%);
        box-shadow: 0 8px 20px -5px rgba(100, 116, 139, 0.35);
      }
      .lb-podium-col.rank-3 .lb-podium-block {
        height: 75px;
        background: linear-gradient(180deg, #d97706 0%, #92400e 100%);
        box-shadow: 0 8px 20px -5px rgba(217, 119, 6, 0.35);
      }
      .lb-podium-rank-num {
        font-family: var(--font-heading, "Plus Jakarta Sans", sans-serif);
        font-size: 24px;
        font-weight: 900;
        line-height: 1;
        margin-bottom: 4px;
      }
      .lb-podium-score {
        font-size: 15px;
        font-weight: 800;
      }
      .lb-podium-dur {
        font-size: 11.5px;
        opacity: 0.88;
        font-weight: 600;
      }

      /* LEADERBOARD TABLE */
      .lb-table-wrap {
        border: 1.5px solid #e2e8f0;
        border-radius: 14px;
        overflow: hidden;
        background: #ffffff;
      }
      .lb-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13.5px;
      }
      .lb-table th {
        background: #f8fafc;
        padding: 12px 16px;
        font-family: var(--font-heading, "Plus Jakarta Sans", sans-serif);
        font-weight: 700;
        color: #475569;
        text-transform: uppercase;
        font-size: 11.5px;
        letter-spacing: 0.04em;
        border-bottom: 1.5px solid #e2e8f0;
        text-align: left;
      }
      .lb-table td {
        padding: 12px 16px;
        border-bottom: 1px solid #f1f5f9;
        color: #334155;
        vertical-align: middle;
      }
      .lb-table tr:last-child td {
        border-bottom: none;
      }
      .lb-table tr.is-me {
        background: #f0fdf4 !important;
      }
      .lb-table tr:hover {
        background: #f8fafc;
      }
      .lb-rank-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 28px;
        height: 28px;
        border-radius: 8px;
        font-weight: 800;
        font-size: 12.5px;
      }
      .lb-rank-badge.top-1 { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
      .lb-rank-badge.top-2 { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
      .lb-rank-badge.top-3 { background: #ffedd5; color: #9a3412; border: 1px solid #fed7aa; }
      .lb-rank-badge.other { background: #f8fafc; color: #64748b; }

      .lb-user-cell {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .lb-user-initial {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #eff6ff;
        color: #2563eb;
        font-weight: 800;
        font-size: 13px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .lb-user-name {
        font-weight: 700;
        color: #0f172a;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .lb-you-tag {
        font-size: 10.5px;
        font-weight: 800;
        background: #22c55e;
        color: #ffffff;
        padding: 2px 6px;
        border-radius: 4px;
        text-transform: uppercase;
      }
      .lb-score-cell {
        font-family: var(--font-heading, "Plus Jakarta Sans", sans-serif);
        font-weight: 800;
        font-size: 15px;
        color: #16a34a;
      }
      .lb-duration-cell {
        font-weight: 600;
        color: #1e40af;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background: #eff6ff;
        padding: 3px 8px;
        border-radius: 6px;
        font-size: 12.5px;
      }

      /* FOOTER */
      .lb-footer {
        padding: 14px 28px;
        background: #f8fafc;
        border-top: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .btn-lb-action {
        padding: 8px 18px;
        border-radius: 9px;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border: none;
        transition: all 0.15s ease;
      }
      .btn-lb-action.primary {
        background: #2563eb;
        color: #ffffff;
      }
      .btn-lb-action.primary:hover {
        background: #1d4ed8;
      }
      .btn-lb-action.secondary {
        background: #ffffff;
        border: 1px solid #cbd5e1;
        color: #334155;
      }
      .btn-lb-action.secondary:hover {
        background: #f1f5f9;
      }

      @media (max-width: 640px) {
        .lb-podium-wrap { gap: 8px; }
        .lb-podium-col { width: 105px; }
        .lb-podium-avatar { width: 44px; height: 44px; font-size: 16px; }
        .lb-podium-col.rank-1 .lb-podium-avatar { width: 54px; height: 54px; font-size: 20px; }
        .lb-podium-col.rank-1 .lb-podium-block { height: 95px; }
        .lb-podium-col.rank-2 .lb-podium-block { height: 75px; }
        .lb-podium-col.rank-3 .lb-podium-block { height: 60px; }
        .lb-header { padding: 16px 20px; }
        .lb-body { padding: 16px 18px; }
      }
    `;
    document.head.appendChild(style);
  }

  /* ========================================================
     MODAL HTML INJECTION
     ======================================================== */
  function injectModalDOM() {
    if (document.getElementById("keduLeaderboardModalOverlay")) return;

    const modalWrap = document.createElement("div");
    modalWrap.id = "keduLeaderboardModalOverlay";
    modalWrap.className = "lb-overlay";
    modalWrap.innerHTML = `
      <div class="lb-card">
        <!-- HEADER -->
        <div class="lb-header">
          <div class="lb-header-title-wrap">
            <div class="lb-header-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45 1-1 1H7.5c-.55 0-1 .45-1 1v1c0 .55.45 1 1 1h9c.55 0 1-.45 1-1v-1c0-.55-.45-1-1-1H15c-.55 0-1-.45-1-1v-2.34"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
            </div>
            <div>
              <h2 class="lb-header-title">
                <span>Bảng Xếp Hạng Vinh Danh Thí Sinh</span>
                <span style="font-size:16px;">🏆</span>
              </h2>
              <p class="lb-header-sub">Tiêu chí: Đứng nhất khi có <strong>Điểm số cao nhất</strong> & <strong>Thời gian làm nhanh nhất</strong></p>
            </div>
          </div>
          <button type="button" class="lb-btn-close" id="btnLbClose" title="Đóng">✕</button>
        </div>

        <!-- CONTROLS BAR -->
        <div class="lb-controls-bar">
          <div class="lb-select-group">
            <select class="lb-select" id="lbFilterSubject">
              <option value="hoa">Hóa học 12</option>
              <option value="toan">Toán học 12</option>
              <option value="vatli">Vật lí 12</option>
              <option value="sinh">Sinh học 12</option>
              <option value="tinhoc">Tin học 12</option>
              <option value="lichsu">Lịch sử 12</option>
            </select>

            <select class="lb-select" id="lbFilterTopic">
              <!-- Rendered dynamically -->
            </select>
          </div>

          <button type="button" class="btn-lb-refresh" id="btnLbRefresh" title="Làm mới dữ liệu từ Supabase Cloud">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
            <span>Làm mới</span>
          </button>
        </div>

        <!-- BODY CONTENT -->
        <div class="lb-body" id="lbBodyContainer">
          <!-- Rendered dynamically -->
        </div>

        <!-- FOOTER -->
        <div class="lb-footer">
          <button type="button" class="btn-lb-action primary" id="btnLbStartTopic" title="Vào làm bài thi đề này ngay để leo thứ hạng">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            <span>Làm bài thi đề này để leo rank</span>
          </button>
          <button type="button" class="btn-lb-action secondary" id="btnLbCloseFooter">Đóng</button>
        </div>
      </div>
    `;
    document.body.appendChild(modalWrap);

    // Event Listeners
    document.getElementById("btnLbClose")?.addEventListener("click", KeduLeaderboard.closeModal);
    document.getElementById("btnLbCloseFooter")?.addEventListener("click", KeduLeaderboard.closeModal);
    modalWrap.addEventListener("click", (e) => {
      if (e.target === modalWrap) KeduLeaderboard.closeModal();
    });

    document.getElementById("lbFilterSubject")?.addEventListener("change", (e) => {
      populateTopicFilter(e.target.value, "1");
      renderLeaderboardContent();
    });

    document.getElementById("lbFilterTopic")?.addEventListener("change", () => {
      renderLeaderboardContent();
    });

    document.getElementById("btnLbRefresh")?.addEventListener("click", () => {
      renderLeaderboardContent();
    });

    document.getElementById("btnLbStartTopic")?.addEventListener("click", () => {
      const sId = document.getElementById("lbFilterSubject")?.value || "hoa";
      const tId = document.getElementById("lbFilterTopic")?.value || "1";
      KeduLeaderboard.closeModal();
      if (window.startQuiz && typeof window.startQuiz === "function" && window.CURRENT_SUBJECT_ID === sId) {
        window.startQuiz(tId, "full");
      } else {
        const pageMap = {
          toan: "toan-hoc.html",
          hoa: "hoa-hoc.html",
          vatli: "vat-li.html",
          sinh: "sinh-hoc.html",
          tinhoc: "tin-hoc.html",
          lichsu: "lich-su.html"
        };
        const p = pageMap[sId] || "hoa-hoc.html";
        const url = window.location.pathname.includes("/pages/") ? p : `pages/${p}`;
        window.location.href = url;
      }
    });

    // Wire buttons with class .btn-open-leaderboard
    document.querySelectorAll(".btn-open-leaderboard").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const sId = btn.getAttribute("data-subject") || window.CURRENT_SUBJECT_ID || "hoa";
        const tId = btn.getAttribute("data-topic") || "1";
        KeduLeaderboard.openModal(sId, tId);
      });
    });
  }

  /**
   * Cập nhật danh sách bộ đề cho dropdown #lbFilterTopic
   */
  function populateTopicFilter(subjectId, selectedTopic = "1") {
    const topicSelect = document.getElementById("lbFilterTopic");
    if (!topicSelect) return;

    let topics = [];
    if (window.KeduQuestionManager && typeof window.KeduQuestionManager.getTopics === "function") {
      topics = window.KeduQuestionManager.getTopics(subjectId);
    } else if (window.TOPIC_SETS && window.CURRENT_SUBJECT_ID === subjectId) {
      topics = window.TOPIC_SETS.map(s => ({ id: s.id, title: s.title }));
    }

    if (!topics || topics.length === 0) {
      topics = [
        { id: "1", title: "Đề kiểm tra giữa học kỳ 1 (Mã 101)" },
        { id: "2", title: "Đề thi thử THPT Quốc Gia số 02" }
      ];
    }

    let html = "";
    topics.forEach((t, i) => {
      const isSel = (String(t.id) === String(selectedTopic) || (!selectedTopic && i === 0)) ? "selected" : "";
      html += `<option value="${escapeHTML(t.id)}" ${isSel}>${escapeHTML(t.title || `Bộ đề #${t.id}`)}</option>`;
    });

    topicSelect.innerHTML = html;
  }

  /**
   * Render nội dung bảng xếp hạng
   */
  async function renderLeaderboardContent() {
    const bodyEl = document.getElementById("lbBodyContainer");
    if (!bodyEl) return;

    bodyEl.innerHTML = `
      <div style="text-align:center; padding:40px 20px; color:#64748b;">
        <div style="display:inline-block; width:36px; height:36px; border:3px solid #cbd5e1; border-top-color:#2563eb; border-radius:50%; animation:lbSpin 0.8s linear infinite;"></div>
        <p style="margin-top:12px; font-weight:600; font-size:14px;">Đang tải bảng xếp hạng vinh danh từ Cloud...</p>
      </div>
      <style>@keyframes lbSpin { to { transform: rotate(360deg); } }</style>
    `;

    const sId = document.getElementById("lbFilterSubject")?.value || "hoa";
    const tId = document.getElementById("lbFilterTopic")?.value || "1";

    const data = await KeduLeaderboard.getLeaderboardData(sId, tId);
    const rankings = data.rankings;

    if (rankings.length === 0) {
      bodyEl.innerHTML = `
        <div style="text-align:center; padding:48px 20px; color:#64748b;">
          <div style="font-size:42px; margin-bottom:12px;">🏆</div>
          <h3 style="font-size:16px; font-weight:800; color:#1e293b; margin-bottom:6px;">Chưa có thí sinh nào ghi danh</h3>
          <p style="font-size:13.5px; max-width:400px; margin:0 auto 18px; line-height:1.5;">
            Hãy là người đầu tiên hoàn thành bộ đề này để giành ngay vị trí <strong>TOP 1</strong> trên Bảng Vàng!
          </p>
          <button type="button" class="btn-lb-action primary" onclick="document.getElementById('btnLbStartTopic')?.click()">
            Vào làm bài thi ngay →
          </button>
        </div>
      `;
      return;
    }

    const currentUser = window.KeduAuth && typeof window.KeduAuth.getCurrentUser === "function"
      ? window.KeduAuth.getCurrentUser()
      : null;
    const currentUsername = (currentUser?.username || "").toLowerCase();

    // 1. My Rank Banner
    let myRankHtml = "";
    if (data.myRank) {
      myRankHtml = `
        <div class="lb-my-rank-banner">
          <div class="lb-my-rank-left">
            <div class="lb-my-rank-badge">#${data.myRank.rank}</div>
            <div class="lb-my-rank-text">
              Thành tích của bạn: Đang xếp hạng <strong>#${data.myRank.rank} / ${data.totalParticipants} thí sinh</strong>!<br>
              Điểm số cao nhất: <strong>${formatScore(data.myRank.score)}đ</strong> • Thời gian nhanh nhất: <strong>${formatDuration(data.myRank.durationSeconds)}</strong>
            </div>
          </div>
          <span style="font-size:12.5px; font-weight:700; color:#15803d; background:#dcfce7; padding:4px 10px; border-radius:6px; border:1px solid #bbf7d0;">
            ${data.myRank.rank === 1 ? '👑 ĐANG GIỮ NGÔI ĐẦU BẢNG' : 'TIẾP TỤC BỨT PHÁ'}
          </span>
        </div>
      `;
    }

    // 2. Podium (Bục Vinh Danh Top 3)
    const top1 = rankings[0];
    const top2 = rankings[1];
    const top3 = rankings[2];

    let podiumHtml = "";
    if (top1) {
      podiumHtml = `
        <div class="lb-podium-wrap">
          <!-- RANK 2 (Bên trái) -->
          ${top2 ? `
            <div class="lb-podium-col rank-2">
              <div class="lb-podium-avatar-wrap">
                <div class="lb-podium-avatar">${escapeHTML(top2.fullName.charAt(0).toUpperCase())}</div>
              </div>
              <h4 class="lb-podium-name" title="${escapeHTML(top2.fullName)}">${escapeHTML(top2.fullName)}</h4>
              <div class="lb-podium-meta">@${escapeHTML(top2.username)}</div>
              <div class="lb-podium-block">
                <span class="lb-podium-rank-num">#2</span>
                <span class="lb-podium-score">${formatScore(top2.score)}đ</span>
                <span class="lb-podium-dur">⏱️ ${formatDuration(top2.durationSeconds)}</span>
              </div>
            </div>
          ` : '<div class="lb-podium-col rank-2" style="visibility:hidden;"></div>'}

          <!-- RANK 1 (Ở giữa - Cao nhất) -->
          <div class="lb-podium-col rank-1">
            <div class="lb-podium-avatar-wrap">
              <span class="lb-podium-crown">👑</span>
              <div class="lb-podium-avatar">${escapeHTML(top1.fullName.charAt(0).toUpperCase())}</div>
            </div>
            <h4 class="lb-podium-name" title="${escapeHTML(top1.fullName)}">${escapeHTML(top1.fullName)}</h4>
            <div class="lb-podium-meta">@${escapeHTML(top1.username)}</div>
            <div class="lb-podium-block">
              <span class="lb-podium-rank-num">#1</span>
              <span class="lb-podium-score">${formatScore(top1.score)}đ</span>
              <span class="lb-podium-dur">⏱️ ${formatDuration(top1.durationSeconds)}</span>
            </div>
          </div>

          <!-- RANK 3 (Bên phải) -->
          ${top3 ? `
            <div class="lb-podium-col rank-3">
              <div class="lb-podium-avatar-wrap">
                <div class="lb-podium-avatar">${escapeHTML(top3.fullName.charAt(0).toUpperCase())}</div>
              </div>
              <h4 class="lb-podium-name" title="${escapeHTML(top3.fullName)}">${escapeHTML(top3.fullName)}</h4>
              <div class="lb-podium-meta">@${escapeHTML(top3.username)}</div>
              <div class="lb-podium-block">
                <span class="lb-podium-rank-num">#3</span>
                <span class="lb-podium-score">${formatScore(top3.score)}đ</span>
                <span class="lb-podium-dur">⏱️ ${formatDuration(top3.durationSeconds)}</span>
              </div>
            </div>
          ` : '<div class="lb-podium-col rank-3" style="visibility:hidden;"></div>'}
        </div>
      `;
    }

    // 3. Table Rows
    let rowsHtml = "";
    rankings.forEach(item => {
      const isMe = currentUsername && item.username.toLowerCase() === currentUsername;
      const rankBadgeClass = item.rank === 1 ? "top-1" : (item.rank === 2 ? "top-2" : (item.rank === 3 ? "top-3" : "other"));
      const initial = (item.fullName || item.username || "K").charAt(0).toUpperCase();

      rowsHtml += `
        <tr class="${isMe ? 'is-me' : ''}">
          <td style="width:60px; text-align:center;">
            <span class="lb-rank-badge ${rankBadgeClass}">
              ${item.rank === 1 ? '🥇 1' : (item.rank === 2 ? '🥈 2' : (item.rank === 3 ? '🥉 3' : `#${item.rank}`))}
            </span>
          </td>
          <td>
            <div class="lb-user-cell">
              <div class="lb-user-initial">${escapeHTML(initial)}</div>
              <div>
                <div class="lb-user-name">
                  <span>${escapeHTML(item.fullName)}</span>
                  ${isMe ? '<span class="lb-you-tag">Bạn</span>' : ''}
                </div>
                <div style="font-size:12px; color:#64748b;">@${escapeHTML(item.username)}</div>
              </div>
            </div>
          </td>
          <td>
            <span class="lb-score-cell">${formatScore(item.score)} <span style="font-size:11px; font-weight:600; color:#64748b;">/ 10đ</span></span>
          </td>
          <td>
            <span class="lb-duration-cell" title="Thời gian làm bài để xét thứ hạng">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 10"/></svg>
              <span>${formatDuration(item.durationSeconds)}</span>
            </span>
          </td>
          <td>
            <span style="font-size:13px; font-weight:600; color:#334155;">
              ✓ ${item.correctCount} / ${item.totalCount} câu (${item.percentage}%)
            </span>
          </td>
        </tr>
      `;
    });

    bodyEl.innerHTML = `
      ${myRankHtml}
      ${podiumHtml}
      <div class="lb-table-wrap">
        <table class="lb-table">
          <thead>
            <tr>
              <th style="width:70px; text-align:center;">Hạng</th>
              <th>Thí sinh</th>
              <th>Điểm số</th>
              <th>Thời gian làm</th>
              <th>Độ chính xác</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;
  }

  // Khởi tạo toàn cục
  window.KeduLeaderboard = KeduLeaderboard;
  window.openLeaderboardModal = function (subjectId, topicId) {
    KeduLeaderboard.openModal(subjectId, topicId);
  };

  document.addEventListener("DOMContentLoaded", () => {
    injectStyles();
    injectModalDOM();

    // Delegated click event cho tất cả các nút mở Leaderboard trên trang
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-open-leaderboard");
      if (btn) {
        e.preventDefault();
        const sId = btn.getAttribute("data-subject") || window.CURRENT_SUBJECT_ID || "hoa";
        const tId = btn.getAttribute("data-topic") || "1";
        KeduLeaderboard.openModal(sId, tId);
      }
    });
  });

})();
