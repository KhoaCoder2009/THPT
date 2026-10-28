/* ========================================================
   KEdu • MODULAR QUIZ ENGINE WITH SUPABASE INTEGRATION
   Live Data Fetching, Question Parsing, Scoring & Quiz Results Storage
   ======================================================== */

let currentSetId = null;
let currentMode = "mc"; // "mc", "tf", "sa", or "full"
let activeQuestions = [];
let currentIndex = 0;
let currentScore = 0; // Số câu đúng hoàn toàn
let currentEarnedPoints = 0; // Điểm đạt được trên thang 10.0
let currentMaxPoints = 10; // Tổng điểm tối đa của bài làm (luôn = 10.0)
let partEarnedPoints = { mc: 0, tf: 0, sa: 0 };
let partMaxPoints = { mc: 0, tf: 0, sa: 0 };
let hasAnswered = false;
let isLoadedFromSupabase = false;
let wrongAnswersList = [];

// DOM Hooks
let dashboardView, quizView, setsGridContainer, totalMCLabel, totalTFLabel, totalSALabel, totalFBLabel;
let backToMenuBtn, quizModeBadge, progressCountEl, progressBarEl, scoreCountEl, quizBox;
let supabaseStatusPill;

/* Định dạng điểm số thang 10 gọn đẹp (tối đa 2 chữ số thập phân) */
function formatPoints(val, fixedTwo = false) {
  const num = Math.round((Number(val) || 0) * 100) / 100;
  if (fixedTwo) return num.toFixed(2);
  if (Number.isInteger(num)) return num.toFixed(1);
  return num.toFixed(2).replace(/0$/, '');
}

/* Quy tắc chấm điểm câu Đúng/Sai (4 mệnh đề a, b, c, d) chuẩn Bộ GD&ĐT:
   - Đúng 1/4 ý: 10% điểm câu (0.10đ nếu câu 1.0đ)
   - Đúng 2/4 ý: 25% điểm câu (0.25đ nếu câu 1.0đ)
   - Đúng 3/4 ý: 50% điểm câu (0.50đ nếu câu 1.0đ)
   - Đúng 4/4 ý: 100% điểm câu (1.00đ nếu câu 1.0đ) */
function calculateTfRatio(correctCount, totalItems) {
  if (!totalItems || totalItems <= 0) return 0;
  if (totalItems === 4) {
    const scale = [0, 0.10, 0.25, 0.50, 1.00];
    return scale[Math.min(4, Math.max(0, correctCount))];
  }
  return correctCount / totalItems;
}

/* Nhận diện mục kiến thức cụ thể từ nội dung câu hỏi để nhắc ôn tập */
function detectKnowledgePoint(qText, topicId) {
  const t = (qText || "").trim();
  // Nếu câu hỏi có nhãn mục ở đầu trước dấu ":" hoặc "—"
  const prefixMatch = t.match(/^([^:—]{3,48}?)\s*(?:—|:)\s+/);
  if (prefixMatch) {
    return prefixMatch[1].trim();
  }
  if (/F\s*đẩy|F\s*hút|lực tương tác|khoảng cách/i.test(t)) return "Mô hình động học & Lực tương tác phân tử";
  if (/thể rắn|thể lỏng|thể khí|cấu trúc chất/i.test(t)) return "Cấu trúc chất rắn, lỏng, khí";
  if (/Brown|phấn hoa/i.test(t)) return "Thí nghiệm chuyển động Brown";
  if (/nóng chảy|kết tinh|vô định hình/i.test(t)) return "Sự nóng chảy & Chất rắn kết tinh / vô định hình";
  if (/bay hơi|sôi|hóa hơi/i.test(t)) return "Sự hóa hơi (Bay hơi & Sôi)";
  if (/đồ thị|đoạn nằm ngang|đoạn dốc/i.test(t)) return "Phân tích đồ thị nhiệt độ - thời gian";
  if (/nội năng|thực hiện công|truyền nhiệt/i.test(t)) return "Nội năng U & Cách làm thay đổi nội năng";
  if (/Định luật I|ΔU\s*=\s*A\s*\+\s*Q|xi lanh|xi-lanh/i.test(t)) return "Định luật I nhiệt động lực học (ΔU = A + Q)";
  if (/\|A\||độ lớn công/i.test(t)) return "Công thức xác định độ lớn công |A|";
  if (/Celsius|Kelvin|Fahrenheit|thang nhiệt độ|điểm ba|không tuyệt đối/i.test(t)) return "Thang nhiệt độ (Celsius, Kelvin, Fahrenheit)";
  if (/nhiệt dung riêng|nhiệt nóng chảy riêng|nhiệt hóa hơi riêng|Q\s*=\s*m/i.test(t)) return "Công thức tính nhiệt lượng Q & Bảng (c, λ, L)";
  if (/cân bằng nhiệt|nước đá tan|Q\s*tỏa/i.test(t)) return "Phương trình cân bằng nhiệt & Nước đá tan một phần";
  if (/hiệu suất|cường độ ánh sáng/i.test(t)) return "Hiệu suất động cơ nhiệt & Cường độ ánh sáng";
  if (/tiếp tuyến|đạo hàm|vận tốc tức thời|gia tốc/i.test(t)) return "Quy tắc tính đạo hàm, Phương trình tiếp tuyến & Vận tốc - Gia tốc";
  if (/đồng biến|nghịch biến|đơn điệu/i.test(t)) return "Tính đơn điệu (Đồng biến, Nghịch biến) của hàm số";
  if (/cực đại|cực tiểu|cực trị/i.test(t)) return "Cực trị của hàm số";
  if (/giá trị lớn nhất|giá trị nhỏ nhất|\bmax\b|\bmin\b|GTLN|GTNN/i.test(t)) return "Giá trị lớn nhất & Giá trị nhỏ nhất (GTLN - GTNN)";
  if (/tiệm cận đứng|tiệm cận ngang|tiệm cận xiên|tiệm cận/i.test(t)) return "Đường tiệm cận của đồ thị hàm số";
  if (/bảng biến thiên|đồ thị hàm số|tâm đối xứng/i.test(t)) return "Khảo sát sự biến thiên & Nhận dạng đồ thị hàm số";
  if (/vectơ|tích vô hướng|trọng tâm|hình hộp|tứ diện/i.test(t)) return "Vectơ & Biểu thức tọa độ các phép toán vectơ trong không gian";
  if (/khoảng biến thiên|tứ phân vị|phương sai|độ lệch chuẩn|mẫu số liệu ghép nhóm/i.test(t)) return "Các số đặc trưng đo mức độ phân tán mẫu số liệu ghép nhóm";
  if (/nguyên hàm|tích phân|diện tích hình phẳng|thể tích khối tròn xoay/i.test(t)) return "Nguyên hàm, Tích phân & Ứng dụng hình học";
  if (/mặt phẳng|đường thẳng|mặt cầu|pháp tuyến|chỉ phương/i.test(t)) return "Phương trình Mặt phẳng, Đường thẳng & Mặt cầu trong Oxyz";
  if (/xác suất|biến cố|Bayes|toàn phần/i.test(t)) return "Xác suất có điều kiện, Công thức xác suất toàn phần & Bayes";

  const topicSets = window.TOPIC_SETS || [];
  const found = topicSets.find(s => s.id === topicId || s.id?.toString() === topicId?.toString());
  return found ? found.title : "Kiến thức trọng tâm trong chuyên đề";
}

function getMistakeStorageKey() {
  const subj = window.CURRENT_SUBJECT_ID || "vatli";
  return `kedu_mistakes_${subj}`;
}

function getHistoricalMistakes() {
  try {
    const raw = localStorage.getItem(getMistakeStorageKey());
    return raw ? JSON.parse(raw) : { topics: {}, questions: {} };
  } catch (e) {
    return { topics: {}, questions: {} };
  }
}

function recordMistake(entry) {
  wrongAnswersList.push(entry);
  try {
    const stats = getHistoricalMistakes();
    const kp = entry.knowledgePoint;
    stats.topics[kp] = (stats.topics[kp] || 0) + 1;
    const qKey = (entry.q || "").slice(0, 120);
    stats.questions[qKey] = (stats.questions[qKey] || 0) + 1;
    localStorage.setItem(getMistakeStorageKey(), JSON.stringify(stats));
  } catch (e) {
    // ignore storage errors
  }
}

function getQuestionsForTopic(mode, topicId) {
  // Normalize modes: 'sa' and 'fb' are Trả lời ngắn
  const normalizedMode = (mode === 'fb') ? 'sa' : mode;

  let raw = [];
  if (normalizedMode === "mc") {
    raw = window.ALL_MC || [];
  } else if (normalizedMode === "tf") {
    raw = window.ALL_TF || [];
  } else if (normalizedMode === "sa") {
    raw = window.ALL_SA || window.ALL_FB || [];
  }

  if (topicId === "all") return raw;
  const num = parseInt(topicId, 10);
  const topicSets = window.TOPIC_SETS || [];
  const setObj = topicSets.find(s => s.id === num || s.id === topicId || s.id?.toString() === topicId?.toString());

  const directMatches = raw.filter(item => {
    // For MC: [q, opts, correct, explain, topicId, diagram] -> item[4] is topicId
    // For TF/SA: [q, items/answers, explain, topicId, diagram] -> item[3] is topicId
    const val = (normalizedMode === "mc")
      ? item[4]
      : (item[3] !== undefined && typeof item[3] !== 'object' ? item[3] : item[item.length - 1]);
    return val === num || val === topicId || val?.toString() === topicId?.toString();
  });

  if (setObj && setObj.isFull) {
    if (directMatches.length > 0) return directMatches;
    if (setObj.chapter) {
      const chapIds = new Set(
        topicSets.filter(s => s.chapter === setObj.chapter).map(s => s.id?.toString())
      );
      return raw.filter(item => {
        const val = (normalizedMode === "mc")
          ? item[4]
          : (item[3] !== undefined && typeof item[3] !== 'object' ? item[3] : item[item.length - 1]);
        return chapIds.has(val?.toString());
      });
    }
    return raw;
  }

  return directMatches;
}

/* ========================================================
   PHÂN BỔ 10 ĐIỂM / BỘ ĐỀ HỢP LÍ NHẤT CÓ THỂ
   - Với bộ đề có đủ 3 phần (Trắc nghiệm, Đúng/Sai, Trả lời ngắn):
     + Bộ đề tiêu chuẩn (1-4 câu Đúng/Sai, 1-6 câu Trả lời ngắn):
       • Mỗi câu Đúng/Sai (4 ý a,b,c,d) = 1.0 điểm (đúng 1 ý: 0.1đ, 2 ý: 0.25đ, 3 ý: 0.5đ, 4 ý: 1.0đ)
       • Mỗi câu Trả lời ngắn = 0.5 điểm
       • Toàn bộ điểm còn lại (7.0đ - 8.0đ) chia đều cho các câu Trắc nghiệm 4 lựa chọn
     + Bộ đề tổng hợp lớn: Trắc nghiệm 7.0đ + Đúng/Sai 2.0đ + Trả lời ngắn 1.0đ = 10.0đ
   - Với bộ đề có 1 hoặc 2 phần: Chia theo trọng số (MC: 1, TF: 4, SA: 2) quy tròn tổng = 10.0đ
   ======================================================== */
function getSetPointBreakdown(setId) {
  const mcCount = getQuestionsForTopic("mc", setId).length;
  const tfCount = getQuestionsForTopic("tf", setId).length;
  const saCount = getQuestionsForTopic("sa", setId).length;
  const totalCount = mcCount + tfCount + saCount;

  let mcTotal = 0, tfTotal = 0, saTotal = 0;

  if (mcCount > 0 && tfCount > 0 && saCount > 0) {
    if (tfCount <= 4 && saCount <= 6 && (tfCount * 1.0 + saCount * 0.5) <= 4.5) {
      tfTotal = tfCount * 1.0;
      saTotal = saCount * 0.5;
      mcTotal = Math.round((10.0 - tfTotal - saTotal) * 100) / 100;
    } else {
      mcTotal = 7.0;
      tfTotal = 2.0;
      saTotal = 1.0;
    }
  } else if (totalCount > 0) {
    const wMc = mcCount * 1;
    const wTf = tfCount * 4;
    const wSa = saCount * 2;
    const wSum = wMc + wTf + wSa || 1;
    mcTotal = mcCount > 0 ? Math.round((wMc / wSum) * 20) / 2 : 0;
    tfTotal = tfCount > 0 ? Math.round((wTf / wSum) * 20) / 2 : 0;
    saTotal = saCount > 0 ? Math.round((10.0 - mcTotal - tfTotal) * 100) / 100 : 0;
    if (saCount === 0 && tfCount > 0) {
      tfTotal = Math.round((10.0 - mcTotal) * 100) / 100;
    } else if (saCount === 0 && tfCount === 0) {
      mcTotal = 10.0;
    }
  }

  return {
    mcCount,
    tfCount,
    saCount,
    totalCount,
    mcTotal,
    tfTotal,
    saTotal,
    mcPerQ: mcCount > 0 ? mcTotal / mcCount : 0,
    tfPerQ: tfCount > 0 ? tfTotal / tfCount : 0,
    saPerQ: saCount > 0 ? saTotal / saCount : 0
  };
}

function getScoreStorageKey() {
  const subj = window.CURRENT_SUBJECT_ID || "vatli";
  return `kedu_scores_${subj}`;
}

function getAllSavedSetScores() {
  try {
    const raw = localStorage.getItem(getScoreStorageKey());
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

/* Lưu lại tỷ lệ điểm đạt được của từng phần để tính tổng điểm 10đ/bộ */
function saveSetScoreProgress(setId, mode, ratiosByPart) {
  try {
    const all = getAllSavedSetScores();
    const key = String(setId);
    if (!all[key]) all[key] = { mcRatio: null, tfRatio: null, saRatio: null, bestFullScore: null };

    if (mode === "full") {
      if (ratiosByPart.mc !== undefined) all[key].mcRatio = Math.max(all[key].mcRatio || 0, ratiosByPart.mc);
      if (ratiosByPart.tf !== undefined) all[key].tfRatio = Math.max(all[key].tfRatio || 0, ratiosByPart.tf);
      if (ratiosByPart.sa !== undefined) all[key].saRatio = Math.max(all[key].saRatio || 0, ratiosByPart.sa);
    } else if (mode === "mc" && ratiosByPart.mc !== undefined) {
      all[key].mcRatio = Math.max(all[key].mcRatio || 0, ratiosByPart.mc);
    } else if (mode === "tf" && ratiosByPart.tf !== undefined) {
      all[key].tfRatio = Math.max(all[key].tfRatio || 0, ratiosByPart.tf);
    } else if (mode === "sa" && ratiosByPart.sa !== undefined) {
      all[key].saRatio = Math.max(all[key].saRatio || 0, ratiosByPart.sa);
    }

    localStorage.setItem(getScoreStorageKey(), JSON.stringify(all));
  } catch (e) {
    // ignore storage errors
  }
}

function getSetAccumulatedScore(setId) {
  const bd = getSetPointBreakdown(setId);
  const all = getAllSavedSetScores();
  const rec = all[String(setId)];
  if (!rec) return null;

  const hasAny = rec.mcRatio !== null || rec.tfRatio !== null || rec.saRatio !== null;
  if (!hasAny) return null;

  const mcPts = (rec.mcRatio || 0) * bd.mcTotal;
  const tfPts = (rec.tfRatio || 0) * bd.tfTotal;
  const saPts = (rec.saRatio || 0) * bd.saTotal;
  const totalPts = mcPts + tfPts + saPts;

  const completedParts = (bd.mcCount > 0 ? (rec.mcRatio !== null ? 1 : 0) : 0)
    + (bd.tfCount > 0 ? (rec.tfRatio !== null ? 1 : 0) : 0)
    + (bd.saCount > 0 ? (rec.saRatio !== null ? 1 : 0) : 0);
  const totalParts = (bd.mcCount > 0 ? 1 : 0) + (bd.tfCount > 0 ? 1 : 0) + (bd.saCount > 0 ? 1 : 0);

  return {
    mcPts,
    tfPts,
    saPts,
    totalPts,
    completedParts,
    totalParts
  };
}


/* Helper to get clean Chapter name based on Subject */
function getSubjectChapterName(subjectId) {
  const map = {
    'toan': 'Chương 1: Ứng dụng đạo hàm',
    'vatli': 'Chương 1: Vật lí nhiệt',
    'hoa': 'Chương 1: Este - Lipit - Xà phòng',
    'sinh': 'Chương 1: Di truyền học',
    'tinhoc': 'Chuyên đề: Khoa học máy tính & Ứng dụng',
    'nguvan': 'Chuyên đề: Đọc hiểu & Nghị luận',
    'lichsu': 'Chuyên đề: Lịch sử hiện đại',
    'ngoaingu': 'Học kì 1: Units 1 - 3',
    'anh': 'Học kì 1: Units 1 - 3'
  };
  return map[subjectId] || 'Chuyên đề ôn tập';
}

/* Render Topic Index Grid (Chia theo các Chương & Card Bộ đề nằm ngang) */
function renderDashboard() {
  if (!dashboardView) dashboardView = document.getElementById("dashboardView");
  if (!quizView) quizView = document.getElementById("quizView");
  if (!setsGridContainer) setsGridContainer = document.getElementById("setsGridContainer");
  if (!totalMCLabel) totalMCLabel = document.getElementById("totalMCLabel");
  if (!totalTFLabel) totalTFLabel = document.getElementById("totalTFLabel");
  if (!totalSALabel) totalSALabel = document.getElementById("totalSALabel");
  if (!totalFBLabel) totalFBLabel = document.getElementById("totalFBLabel");

  const topicSets = window.TOPIC_SETS || [];
  const allMC = window.ALL_MC || [];
  const allFB = window.ALL_FB || [];
  const allTF = window.ALL_TF || [];
  const allSA = window.ALL_SA || window.ALL_FB || [];

  if (totalMCLabel) totalMCLabel.textContent = allMC.length;
  if (totalTFLabel) totalTFLabel.textContent = allTF.length;
  if (totalSALabel) totalSALabel.textContent = allSA.length || allFB.length;
  if (totalFBLabel && !totalSALabel) totalFBLabel.textContent = allSA.length || allFB.length;

  const subjectId = window.CURRENT_SUBJECT_ID || 'vatli';
  const defaultChapter = getSubjectChapterName(subjectId);

  if (!setsGridContainer) {
    setsGridContainer = document.getElementById("setsGridContainer");
  }
  if (!setsGridContainer) return;

  // 1. Lọc và chỉ giữ lại các bộ đề CÓ câu hỏi (mc + tf + sa > 0)
  // Xóa/ẩn toàn bộ các bộ câu hỏi rỗng (không có câu hỏi nào)
  const validTopicSets = topicSets.filter(set => {
    const mcCount = getQuestionsForTopic("mc", set.id).length;
    const tfCount = getQuestionsForTopic("tf", set.id).length;
    const saCount = getQuestionsForTopic("sa", set.id).length;
    return (mcCount + tfCount + saCount) > 0;
  });

  const totalSetsEl = document.getElementById("totalSetsLabel");
  if (totalSetsEl) totalSetsEl.textContent = `${validTopicSets.length} Bộ đề`;

  const sectionBar = document.getElementById("sectionBar") || document.querySelector(".section-bar");

  // Nếu cả môn học không có câu hỏi nào hết -> Ẩn sectionBar và hiển thị khung thông báo trạng thái rỗng thân thiện
  if (validTopicSets.length === 0) {
    if (sectionBar) sectionBar.style.display = "none";
    setsGridContainer.innerHTML = `
      <div class="empty-subject-box">
        <div class="empty-icon-wrap">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            <line x1="9" y1="13" x2="15" y2="13"/>
          </svg>
        </div>
        <h3 class="empty-title">Ngân hàng câu hỏi đang được cập nhật</h3>
        <p class="empty-desc">Môn học này hiện chưa có bộ câu hỏi nào được nạp. Vui lòng quay lại sau hoặc thêm câu hỏi từ cơ sở dữ liệu Supabase.</p>
        <a href="../index.html" class="btn-empty-back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Về trang chủ chọn môn khác</span>
        </a>
      </div>
    `;
    return;
  }

  if (sectionBar) sectionBar.style.display = "";

  // 2. Phân nhóm các bộ đề có câu hỏi theo Chương (Chapters)
  const chaptersMap = new Map();

  validTopicSets.forEach(set => {
    let chapName = set.chapter || defaultChapter;
    if (!chaptersMap.has(chapName)) {
      chaptersMap.set(chapName, []);
    }
    chaptersMap.get(chapName).push(set);
  });

  // 3. Render Chapter Filter Bar (Nút chọn lọc nhanh theo từng chương)
  let filterBarHtml = '';
  if (chaptersMap.size > 1) {
    filterBarHtml = `
      <div class="chapter-filter-bar">
        <button type="button" class="chapter-chip active" onclick="filterChapter('all', this)">
          <span>Tất cả các chương</span>
        </button>
        ${Array.from(chaptersMap.keys()).map((chap, idx) => `
          <button type="button" class="chapter-chip" onclick="filterChapter('${idx}', this)">
            <span>${chap}</span>
          </button>
        `).join('')}
      </div>
    `;
  }

  // 4. Render các nhóm Chương & Card bộ đề nằm ngang bên trong
  let chaptersHtml = '';
  let chapterIndex = 0;

  chaptersMap.forEach((sets, chapName) => {
    const chapTagMatch = chapName.match(/^(Chương \d+|Chủ đề \d+|Unit \d+|Phần \d+|Chuyên đề \d+)/i);
    const chapBadge = chapTagMatch ? chapTagMatch[1].toUpperCase() : `CHƯƠNG ${chapterIndex + 1}`;
    const cleanChapTitle = chapName.replace(/^(Chương \d+|Chủ đề \d+|Unit \d+|Phần \d+|Chuyên đề \d+)\s*[:\-–]\s*/i, '').trim() || chapName;

    const cardsHtml = sets.map(set => {
      const bd = getSetPointBreakdown(set.id);
      const { mcCount, tfCount, saCount, totalCount } = bd;
      const theme = set.theme || (set.isFull ? "red" : "blue");

      const defaultIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
      const iconContent = (set.icon && typeof set.icon === 'string' && set.icon.trim().startsWith('<svg'))
        ? set.icon
        : defaultIcon;

      let lessonName = "";
      if (set.isFull) {
        lessonName = "Tổng hợp toàn chương";
      } else {
        const num = parseInt(set.index, 10);
        lessonName = isNaN(num) ? ("Chuyên đề " + set.index) : ("Bài " + String(num).padStart(2, '0'));
      }

      // Build action buttons - only enable formats that have questions
      const mcBtn = mcCount > 0
        ? `<button class="btn-h-action primary" onclick="startQuiz('${set.id}', 'mc')" title="Luyện thi Trắc nghiệm 4 lựa chọn (${mcCount} câu)">
             <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
             <span>Trắc nghiệm (${mcCount})</span>
           </button>`
        : `<button class="btn-h-action disabled" disabled title="Chưa có câu hỏi Trắc nghiệm">
             <span>Trắc nghiệm (0)</span>
           </button>`;

      const tfBtn = tfCount > 0
        ? `<button class="btn-h-action secondary" onclick="startQuiz('${set.id}', 'tf')" title="Luyện thi Đúng / Sai (${tfCount} câu)">
             <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
             <span>Đúng sai (${tfCount})</span>
           </button>`
        : `<button class="btn-h-action disabled" disabled title="Chưa có câu hỏi Đúng / Sai">
             <span>Đúng sai (0)</span>
           </button>`;

      const saBtn = saCount > 0
        ? `<button class="btn-h-action tertiary" onclick="startQuiz('${set.id}', 'sa')" title="Luyện thi Trả lời ngắn (${saCount} câu)">
             <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
             <span>Trả lời ngắn (${saCount})</span>
           </button>`
        : `<button class="btn-h-action disabled" disabled title="Chưa có câu hỏi Trả lời ngắn">
             <span>Trả lời ngắn (0)</span>
           </button>`;

      return `
        <div class="h-topic-card ${set.isFull ? "featured" : ""}" data-topic-id="${set.id}">
          <!-- 1. Icon bộ đề -->
          <div class="h-card-left">
            <div class="h-topic-icon ${theme}">
              ${iconContent}
            </div>
          </div>

          <!-- 2. Thông tin chính: Bài, Tên bộ đề, Số câu hỏi -->
          <div class="h-card-center">
            <div class="h-card-breadcrumbs">
              <span class="h-badge-lesson">${lessonName}</span>
              <span class="h-dot-separator">•</span>
              <span class="h-badge-chapter">${chapBadge}</span>
              ${set.isFull ? '<span class="h-badge-hot">ĐỀ TỔNG HỢP</span>' : ''}
            </div>

            <h3 class="h-card-title">${set.title}</h3>

            <div class="h-card-question-count">
              <span class="h-count-main">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                <strong>${totalCount}</strong> câu hỏi có sẵn
              </span>
            </div>
          </div>

          <!-- 3. Nút hành động luyện tập -->
          <div class="h-card-actions">
            ${mcBtn}
            ${tfBtn}
            ${saBtn}
          </div>
        </div>
      `;
    }).join("");

    chaptersHtml += `
      <div class="chapter-group-block" data-chapter-index="${chapterIndex}">
        <div class="chapter-banner">
          <div class="chapter-banner-left">
            <span class="chapter-badge-tag">${chapBadge}</span>
            <h3 class="chapter-banner-title">${cleanChapTitle}</h3>
          </div>
          <span class="chapter-banner-count">${sets.length} bộ đề ôn tập</span>
        </div>
        <div class="h-topic-cards-list">
          ${cardsHtml}
        </div>
      </div>
    `;

    chapterIndex++;
  });

  setsGridContainer.innerHTML = filterBarHtml + chaptersHtml;
  renderMathIfAvailable(setsGridContainer);
}

/* Lọc hiển thị theo chương */
function filterChapter(chapIdx, btnEl) {
  if (btnEl) {
    document.querySelectorAll('.chapter-chip').forEach(c => c.classList.remove('active'));
    btnEl.classList.add('active');
  }

  const blocks = document.querySelectorAll('.chapter-group-block');
  blocks.forEach(b => {
    if (chapIdx === 'all' || b.getAttribute('data-chapter-index') === chapIdx.toString()) {
      b.style.display = 'block';
    } else {
      b.style.display = 'none';
    }
  });
}
window.filterChapter = filterChapter;

/* Helper tạo câu hỏi chuẩn hóa có gắn điểm từng câu */
function buildMcQuestionObj(item, maxPoints, setPoints) {
  const opts = item[1];
  const correctIdx = item[2];
  const order = shuffle(opts.map((_, i) => i));
  return {
    type: 'mc',
    q: item[0],
    options: order.map(i => opts[i]),
    correct: order.indexOf(correctIdx),
    explain: item[3],
    topic: item[4],
    diagram: item[5] || null,
    maxPoints: maxPoints,
    setPoints: setPoints
  };
}

function buildTfQuestionObj(item, maxPoints, setPoints) {
  const items = Array.isArray(item[1]) ? item[1] : null;
  const singleCorrect = typeof item[1] === 'boolean' ? item[1] : (item[1] === 1 || item[1] === 'Đúng' || item[1] === 'true');
  return {
    type: 'tf',
    q: item[0],
    items: items,
    singleCorrect: singleCorrect,
    explain: item[2] || '',
    topic: item[3],
    diagram: item[4] || null,
    maxPoints: maxPoints,
    setPoints: setPoints
  };
}

function buildSaQuestionObj(item, maxPoints, setPoints) {
  return {
    type: 'sa',
    q: item[0],
    answers: item[1],
    explain: item[2],
    topic: item[3],
    diagram: item[4] || null,
    maxPoints: maxPoints,
    setPoints: setPoints
  };
}

/* Start Quiz Session (full: Trọn bộ 10đ, mc: Trắc nghiệm, tf: Đúng sai, sa/fb: Trả lời ngắn) */
function startQuiz(setId, mode) {
  currentSetId = setId;
  currentMode = (mode === "fb") ? "sa" : mode;
  currentIndex = 0;
  currentScore = 0;
  currentEarnedPoints = 0;
  currentMaxPoints = 10.0;
  partEarnedPoints = { mc: 0, tf: 0, sa: 0 };
  partMaxPoints = { mc: 0, tf: 0, sa: 0 };
  hasAnswered = false;
  wrongAnswersList = [];

  const bd = getSetPointBreakdown(setId);
  const topicSets = window.TOPIC_SETS || [];
  const currentSetMeta = topicSets.find(s => s.id?.toString() === setId?.toString());
  const shouldShuffle = (setId === "all" || currentSetMeta?.isFull);

  if (currentMode === "full") {
    const rawMc = getQuestionsForTopic("mc", setId);
    const rawTf = getQuestionsForTopic("tf", setId);
    const rawSa = getQuestionsForTopic("sa", setId);

    const listMc = (shouldShuffle ? shuffle(rawMc) : [...rawMc]).map(it => buildMcQuestionObj(it, bd.mcPerQ, bd.mcPerQ));
    const listTf = (shouldShuffle ? shuffle(rawTf) : [...rawTf]).map(it => buildTfQuestionObj(it, bd.tfPerQ, bd.tfPerQ));
    const listSa = (shouldShuffle ? shuffle(rawSa) : [...rawSa]).map(it => buildSaQuestionObj(it, bd.saPerQ, bd.saPerQ));

    activeQuestions = [...listMc, ...listTf, ...listSa];
    partMaxPoints = { mc: bd.mcTotal, tf: bd.tfTotal, sa: bd.saTotal };

    if (quizModeBadge) {
      quizModeBadge.textContent = "Trọn bộ • 10 điểm";
      quizModeBadge.className = "quiz-mode-pill badge-state mc";
    }
  } else if (currentMode === "mc") {
    const rawList = getQuestionsForTopic("mc", setId);
    const orderedList = shouldShuffle ? shuffle(rawList) : [...rawList];
    const perQ = orderedList.length > 0 ? (10.0 / orderedList.length) : 0;
    activeQuestions = orderedList.map(it => buildMcQuestionObj(it, perQ, bd.mcPerQ));
    partMaxPoints = { mc: 10.0, tf: 0, sa: 0 };

    if (quizModeBadge) {
      quizModeBadge.textContent = "Trắc nghiệm";
      quizModeBadge.className = "quiz-mode-pill badge-state mc";
    }
  } else if (currentMode === "tf") {
    const rawList = getQuestionsForTopic("tf", setId);
    const orderedList = shouldShuffle ? shuffle(rawList) : [...rawList];
    const perQ = orderedList.length > 0 ? (10.0 / orderedList.length) : 0;
    activeQuestions = orderedList.map(it => buildTfQuestionObj(it, perQ, bd.tfPerQ));
    partMaxPoints = { mc: 0, tf: 10.0, sa: 0 };

    if (quizModeBadge) {
      quizModeBadge.textContent = "Đúng sai";
      quizModeBadge.className = "quiz-mode-pill badge-state tf";
    }
  } else {
    const rawList = getQuestionsForTopic("sa", setId);
    const orderedList = shouldShuffle ? shuffle(rawList) : [...rawList];
    const perQ = orderedList.length > 0 ? (10.0 / orderedList.length) : 0;
    activeQuestions = orderedList.map(it => buildSaQuestionObj(it, perQ, bd.saPerQ));
    partMaxPoints = { mc: 0, tf: 0, sa: 10.0 };

    if (quizModeBadge) {
      quizModeBadge.textContent = "Trả lời ngắn";
      quizModeBadge.className = "quiz-mode-pill badge-state sa";
    }
  }

  if (dashboardView) dashboardView.classList.remove("active");
  if (quizView) quizView.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });

  renderQuizQuestion();
}
window.startQuiz = startQuiz;
window.checkAnswer = checkAnswer;
window.checkFillBlank = checkFillBlank;

/* Ôn lại riêng những câu vừa làm sai (cũng quy về thang 10 điểm) */
function retryWrongQuestions() {
  if (!wrongAnswersList || wrongAnswersList.length === 0) return;
  const perQ = 10.0 / wrongAnswersList.length;
  const toRetry = wrongAnswersList.map(item => {
    const qObj = item.questionObj;
    if (qObj.type === 'mc' && Array.isArray(qObj.options)) {
      const correctText = qObj.options[qObj.correct];
      const shuffledOpts = shuffle(qObj.options);
      return {
        ...qObj,
        options: shuffledOpts,
        correct: shuffledOpts.indexOf(correctText),
        maxPoints: perQ
      };
    }
    return { ...qObj, maxPoints: perQ };
  });
  activeQuestions = toRetry;
  currentIndex = 0;
  currentScore = 0;
  currentEarnedPoints = 0;
  currentMaxPoints = 10.0;
  partEarnedPoints = { mc: 0, tf: 0, sa: 0 };
  hasAnswered = false;
  wrongAnswersList = [];
  window.scrollTo({ top: 0, behavior: "smooth" });
  renderQuizQuestion();
}
window.retryWrongQuestions = retryWrongQuestions;

/* Tạo bảng phân tích lỗi sai & nhắc ôn tập sau khi hoàn thành đề */
function buildMistakeReviewHtml() {
  const history = getHistoricalMistakes();

  if (wrongAnswersList.length === 0) {
    // Nếu bài này đúng 100%, kiểm tra lịch sử xem trước đó có phần nào hay sai không để nhắc nhẹ
    const pastTopics = Object.entries(history.topics || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    if (pastTopics.length === 0) {
      return `
        <div class="mistake-review-panel perfect">
          <div class="mistake-banner-header">
            <span class="mistake-banner-icon">🎉</span>
            <div>
              <h3 class="mistake-banner-title">Tuyệt vời! Bạn không sai câu nào trong lượt làm đề này</h3>
              <p class="mistake-banner-sub">Bạn đã nắm rất chắc toàn bộ các ý lý thuyết và công thức của bộ đề này.</p>
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div class="mistake-review-panel perfect">
        <div class="mistake-banner-header">
          <span class="mistake-banner-icon">🎉</span>
          <div>
            <h3 class="mistake-banner-title">Hoàn hảo 100% ở lượt này!</h3>
            <p class="mistake-banner-sub">Lưu ý nhỏ từ lịch sử làm bài: Trước đây bạn từng nhầm ở các mục dưới đây, hãy tiếp tục duy trì phong độ nhé:</p>
          </div>
        </div>
        <div class="mistake-topics-chips">
          ${pastTopics.map(([kp, cnt]) => `
            <span class="mistake-topic-chip">
              <strong>${kp}</strong> <em>(Từng sai ${cnt} lần)</em>
            </span>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Nhóm các câu sai trong bài này theo mục kiến thức (knowledgePoint)
  const groupedByTopic = {};
  wrongAnswersList.forEach(item => {
    const kp = item.knowledgePoint;
    if (!groupedByTopic[kp]) groupedByTopic[kp] = [];
    groupedByTopic[kp].push(item);
  });

  const sortedTopics = Object.entries(groupedByTopic).sort((a, b) => b[1].length - a[1].length);
  const topWeakNames = sortedTopics.slice(0, 3).map(([kp]) => `<strong>${kp}</strong>`).join(', ');

  const topicsSummaryHtml = sortedTopics.map(([kp, list]) => {
    const totalHist = (history.topics && history.topics[kp]) ? history.topics[kp] : list.length;
    return `
      <div class="mistake-topic-row">
        <div class="mistake-topic-info">
          <span class="mistake-topic-dot"></span>
          <span class="mistake-topic-name">${kp}</span>
        </div>
        <div class="mistake-topic-badges">
          <span class="badge-wrong-now">Sai ${list.length} câu trong đề này</span>
          ${totalHist > list.length ? `<span class="badge-wrong-hist">Tổng cộng đã sai ${totalHist} lần</span>` : ''}
        </div>
      </div>
    `;
  }).join('');

  const detailCardsHtml = wrongAnswersList.map((item, idx) => {
    const cleanPrompt = item.q.replace(/___+/g, '<span class="blank-spot">[ ... ]</span>');
    return `
      <div class="mistake-detail-card">
        <div class="mistake-detail-top">
          <span class="mistake-q-num">Câu ${item.questionNumber}</span>
          <span class="mistake-q-kp">${item.knowledgePoint}</span>
        </div>
        <div class="mistake-q-prompt">${cleanPrompt}</div>
        <div class="mistake-compare-grid">
          <div class="mistake-ans-box wrong">
            <span class="ans-lbl">❌ Câu trả lời của bạn:</span>
            <div class="ans-val">${item.userAnswer}</div>
          </div>
          <div class="mistake-ans-box correct">
            <span class="ans-lbl">✅ Đáp án đúng cần nhớ:</span>
            <div class="ans-val">${item.correctAnswer}</div>
          </div>
        </div>
        ${item.explain ? `<div class="mistake-explain-note">📖 <strong>Ôn lại đề cương:</strong> ${item.explain}</div>` : ''}
      </div>
    `;
  }).join('');

  return `
    <div class="mistake-review-panel">
      <div class="mistake-banner-header">
        <span class="mistake-banner-icon">⚠️</span>
        <div>
          <h3 class="mistake-banner-title">Nhắc nhở ôn tập: Những điểm bạn hay sai trong đề này</h3>
          <p class="mistake-banner-sub">
            Hệ thống phát hiện bạn đang nhầm lẫn ở phần ${topWeakNames}. 
            Hãy đọc kĩ lại các mục này trong đề cương và bấm nút <strong>"Ôn lại ngay ${wrongAnswersList.length} câu vừa sai"</strong> bên dưới để khắc phục triệt để!
          </p>
        </div>
      </div>

      <div class="mistake-section-block">
        <h4 class="mistake-section-heading">📌 Các phần kiến thức cần ôn kĩ lại (${sortedTopics.length} mục):</h4>
        <div class="mistake-topics-list">
          ${topicsSummaryHtml}
        </div>
      </div>

      <div class="mistake-section-block">
        <h4 class="mistake-section-heading">📝 Chi tiết ${wrongAnswersList.length} câu làm sai & kiến thức cần ghi nhớ:</h4>
        <div class="mistake-details-list">
          ${detailCardsHtml}
        </div>
      </div>
    </div>
  `;
}

/* Tracker Header */
function updateProgress() {
  const total = activeQuestions.length;
  if (total === 0) {
    if (progressCountEl) progressCountEl.textContent = "0/0";
    if (progressBarEl) progressBarEl.style.width = "0%";
    if (scoreCountEl) scoreCountEl.textContent = "Điểm: 0.0 / 10";
    return;
  }
  const answeredCount = Math.min(total, hasAnswered ? currentIndex + 1 : currentIndex);
  if (progressCountEl) progressCountEl.textContent = currentIndex < total ? `Câu ${currentIndex + 1} / ${total}` : "Hoàn thành";
  if (scoreCountEl) scoreCountEl.textContent = `Điểm: ${formatPoints(currentEarnedPoints)} / ${formatPoints(currentMaxPoints)}`;
  const pct = total > 0 ? (answeredCount / total) * 100 : 0;
  if (progressBarEl) progressBarEl.style.width = `${pct}%`;
}

/* Save Result to Supabase */
async function recordQuizResultToSupabase(score, total, pct) {
  const client = window.getSupabaseClient ? window.getSupabaseClient() : null;
  if (!client) return;

  try {
    const record = {
      subject_id: window.CURRENT_SUBJECT_ID || 'vatli',
      topic_id: (currentSetId || 'all').toString(),
      mode: currentMode,
      score: score,
      total: total,
      percentage: pct,
      student_name: 'Học sinh KEdu'
    };

    const { data, error } = await client.from('quiz_results').insert([record]);
    if (error) {
      console.warn('Lỗi lưu điểm lên Supabase:', error.message);
    } else {
      console.log('✅ Đã lưu kết quả bài thi thành công lên Supabase:', record);
      const noteEl = document.getElementById('supabaseSaveNotice');
      if (noteEl) {
        noteEl.innerHTML = '🟢 Kết quả bài thi đã được đồng bộ trực tiếp lên cơ sở dữ liệu Supabase.';
      }
    }
  } catch (err) {
    console.warn('Lỗi kết nối Supabase khi lưu điểm:', err);
  }
}

/* Render Question View */
function renderQuizQuestion() {
  updateProgress();

  if (!quizBox) return;

  if (activeQuestions.length === 0) {
    quizBox.innerHTML = `
      <div class="result-board">
        <div class="result-status-badge">Thông báo</div>
        <div class="result-number">0.0 / 10</div>
        <p class="result-verdict">Chưa tìm thấy câu hỏi phù hợp cho bộ đề này.</p>
        <button class="btn-primary-action" onclick="if(backToMenuBtn) backToMenuBtn.click()">Trở về danh sách bộ đề</button>
      </div>`;
    return;
  }

  // Finished Review Screen
  if (currentIndex >= activeQuestions.length) {
    const total = activeQuestions.length;
    const finalTenScore = Math.min(10.0, Math.round(currentEarnedPoints * 100) / 100);
    const pct = Math.round((finalTenScore / 10.0) * 100);

    // Lưu tiến độ điểm của bộ đề vào localStorage
    const ratiosToSave = {};
    if (partMaxPoints.mc > 0) ratiosToSave.mc = Math.min(1, partEarnedPoints.mc / partMaxPoints.mc);
    if (partMaxPoints.tf > 0) ratiosToSave.tf = Math.min(1, partEarnedPoints.tf / partMaxPoints.tf);
    if (partMaxPoints.sa > 0) ratiosToSave.sa = Math.min(1, partEarnedPoints.sa / partMaxPoints.sa);
    saveSetScoreProgress(currentSetId, currentMode, ratiosToSave);

    const bd = getSetPointBreakdown(currentSetId);
    const accScore = getSetAccumulatedScore(currentSetId);

    let verdict = "Xuất sắc! Bạn đã nắm vững lý thuyết và các dạng bài tập trọng tâm.";
    if (finalTenScore < 5.0) {
      verdict = "Điểm dưới trung bình (< 5.0đ). Bạn hãy xem kĩ bảng phân tích lỗi sai bên dưới để ôn lại các phần còn nhầm lẫn.";
    } else if (finalTenScore < 8.0) {
      verdict = "Kết quả khá tốt! Hãy rà soát lại các mục kiến thức bị sai bên dưới để đạt điểm 9 - 10.";
    }

    const topicSets = window.TOPIC_SETS || [];
    const currentSetObj = topicSets.find(s => s.id.toString() === currentSetId.toString()) || topicSets[0] || { title: "Chuyên đề" };

    // Record result to Supabase
    recordQuizResultToSupabase(currentScore, total, pct);

    const mistakeReviewHtml = buildMistakeReviewHtml();

    // Bảng chi tiết phân bổ 10 điểm / bộ
    let setBreakdownBoardHtml = '';
    if (bd.totalCount > 0) {
      const mcEarnedInSet = currentMode === 'full'
        ? partEarnedPoints.mc
        : (accScore ? accScore.mcPts : 0);
      const tfEarnedInSet = currentMode === 'full'
        ? partEarnedPoints.tf
        : (accScore ? accScore.tfPts : 0);
      const saEarnedInSet = currentMode === 'full'
        ? partEarnedPoints.sa
        : (accScore ? accScore.saPts : 0);
      const totalSetScore = currentMode === 'full'
        ? finalTenScore
        : (accScore ? accScore.totalPts : finalTenScore);

      setBreakdownBoardHtml = `
        <div class="set-score-breakdown-box">
          <div class="set-score-box-header">
            <span>⚖️ Bảng điểm chi tiết theo cơ cấu <strong>10.0 điểm / bộ</strong></span>
            <span class="set-score-total-badge">Tổng điểm bộ đề: <strong>${formatPoints(totalSetScore, true)} / 10.00 điểm</strong></span>
          </div>
          <div class="set-score-parts-grid">
            ${bd.mcCount > 0 ? `
              <div class="set-score-part-card ${currentMode === 'mc' || currentMode === 'full' ? 'active-part' : ''}">
                <div class="part-card-title">Phần I • Trắc nghiệm (${bd.mcCount} câu)</div>
                <div class="part-card-score">${formatPoints(mcEarnedInSet, true)} <span>/ ${formatPoints(bd.mcTotal, true)} đ</span></div>
                <div class="part-card-sub">Mỗi câu đúng: <strong>${formatPoints(bd.mcPerQ)} điểm</strong></div>
              </div>
            ` : ''}
            ${bd.tfCount > 0 ? `
              <div class="set-score-part-card ${currentMode === 'tf' || currentMode === 'full' ? 'active-part' : ''}">
                <div class="part-card-title">Phần II • Đúng / Sai (${bd.tfCount} câu)</div>
                <div class="part-card-score">${formatPoints(tfEarnedInSet, true)} <span>/ ${formatPoints(bd.tfTotal, true)} đ</span></div>
                <div class="part-card-sub">Tối đa <strong>${formatPoints(bd.tfPerQ)}đ/câu</strong> (1 ý: 10%, 2 ý: 25%, 3 ý: 50%, 4 ý: 100%)</div>
              </div>
            ` : ''}
            ${bd.saCount > 0 ? `
              <div class="set-score-part-card ${currentMode === 'sa' || currentMode === 'full' ? 'active-part' : ''}">
                <div class="part-card-title">Phần III • Trả lời ngắn (${bd.saCount} câu)</div>
                <div class="part-card-score">${formatPoints(saEarnedInSet, true)} <span>/ ${formatPoints(bd.saTotal, true)} đ</span></div>
                <div class="part-card-sub">Mỗi câu đúng: <strong>${formatPoints(bd.saPerQ)} điểm</strong></div>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    const activeFormatsCount = (bd.mcCount > 0 ? 1 : 0) + (bd.tfCount > 0 ? 1 : 0) + (bd.saCount > 0 ? 1 : 0);

    quizBox.innerHTML = `
      <div class="result-board">
        <div class="result-status-badge">${currentSetObj.title}</div>
        <div class="result-number">${formatPoints(finalTenScore, true)} <span style="font-size:0.52em; font-weight:700; opacity:0.75;">/ 10 điểm</span></div>
        <p class="result-verdict">Đạt <strong>${formatPoints(finalTenScore, true)} / 10.00 điểm</strong> (Tỷ lệ chính xác <strong>${pct}%</strong>). ${verdict}</p>

        <div class="metrics-table">
          <div class="metric-box">
            <div class="metric-box-val" style="color:var(--dol-red);">${formatPoints(finalTenScore, true)}đ</div>
            <div class="metric-box-lbl">Điểm thang 10</div>
          </div>
          <div class="metric-box">
            <div class="metric-box-val" style="color:var(--dol-green);">${currentScore} / ${total}</div>
            <div class="metric-box-lbl">Số câu đúng trọn vẹn</div>
          </div>
          <div class="metric-box">
            <div class="metric-box-val" style="color:#EA580C;">${wrongAnswersList.length}</div>
            <div class="metric-box-lbl">Số câu cần ôn lại</div>
          </div>
        </div>

        ${setBreakdownBoardHtml}

        <div id="supabaseSaveNotice" style="font-size:12.5px; color:var(--dol-green); font-weight:600; margin:14px 0;"></div>

        <div class="footer-actions" style="justify-content:center; margin-bottom: 24px;">
          ${wrongAnswersList.length > 0 ? `
            <button class="btn-primary-action" style="background: linear-gradient(135deg, #EA580C 0%, #D42525 100%);" onclick="retryWrongQuestions()">
              🔥 Ôn lại ngay ${wrongAnswersList.length} câu vừa sai
            </button>
          ` : ''}
          ${currentMode !== 'full' && activeFormatsCount > 1 ? `
            <button class="btn-primary-action" style="background: linear-gradient(135deg, #0F2657 0%, #1E40AF 100%);" onclick="startQuiz('${currentSetId}', 'full')">
              🎯 Làm trọn bộ (${bd.totalCount} câu • 10đ)
            </button>
          ` : ''}
          <button class="btn-primary-action" onclick="startQuiz('${currentSetId}', '${currentMode}')">
            Làm lại bài này
          </button>
          ${currentMode !== 'mc' && bd.mcCount > 0 ? `
            <button class="btn-secondary-action" onclick="startQuiz('${currentSetId}', 'mc')">
              Phần Trắc nghiệm (${bd.mcCount} câu • ${formatPoints(bd.mcTotal)}đ)
            </button>
          ` : ''}
          ${currentMode !== 'tf' && bd.tfCount > 0 ? `
            <button class="btn-secondary-action" onclick="startQuiz('${currentSetId}', 'tf')">
              Phần Đúng sai (${bd.tfCount} câu • ${formatPoints(bd.tfTotal)}đ)
            </button>
          ` : ''}
          ${currentMode !== 'sa' && bd.saCount > 0 ? `
            <button class="btn-secondary-action" onclick="startQuiz('${currentSetId}', 'sa')">
              Phần Trả lời ngắn (${bd.saCount} câu • ${formatPoints(bd.saTotal)}đ)
            </button>
          ` : ''}
          <button class="btn-secondary-action" onclick="if(backToMenuBtn) backToMenuBtn.click()">
            Trở về danh sách bộ đề
          </button>
        </div>

        ${mistakeReviewHtml}
      </div>`;
    renderMathIfAvailable(quizBox);
    return;
  }

  const q = activeQuestions[currentIndex];
  const qType = q.type || currentMode;
  const qMaxPts = q.maxPoints || (10.0 / activeQuestions.length);
  hasAnswered = false;

  const topicSets = window.TOPIC_SETS || [];
  const currentSetObj = topicSets.find(s => s.id === q.topic || s.id?.toString() === q.topic?.toString()) || { title: "Ôn tập" };
  const diagrams = window.DIAGRAMS || {};
  const diagramHtml = q.diagram && diagrams[q.diagram] ? diagrams[q.diagram] : "";

  if (currentMode === "full" && quizModeBadge) {
    const partLabel = qType === "mc" ? "Phần I: Trắc nghiệm" : (qType === "tf" ? "Phần II: Đúng / Sai" : "Phần III: Trả lời ngắn");
    quizModeBadge.textContent = `Trọn bộ 10đ • ${partLabel}`;
    quizModeBadge.className = `quiz-mode-pill badge-state ${qType}`;
  }

  if (qType === "mc") {
    // 1. DẠNG TRẮC NGHIỆM 4 LỰA CHỌN / ĐIỀN KHUYẾT (PHẦN I)
    const mcPromptDisplay = q.q.includes("___")
      ? q.q.replace(/___+/g, '<span class="blank-spot" id="mcBlankSpot">___</span>')
      : q.q;
    const modeLabel = q.q.includes("___") ? "Phần I: Trắc nghiệm điền khuyết" : "Phần I: Trắc nghiệm 4 lựa chọn";

    quizBox.innerHTML = `
      <div class="question-pane">
        <div class="q-meta-row">
          <span class="q-topic-tag">${currentSetObj.title} • ${modeLabel}</span>
          <div class="q-meta-right">
            <span class="q-point-pill">🎯 Điểm câu này: <strong>+${formatPoints(qMaxPts)} đ</strong></span>
            <span class="keyboard-hint">Phím 1-4</span>
          </div>
        </div>

        ${diagramHtml}

        <h2 class="question-prompt">${mcPromptDisplay}</h2>

        <div class="options-stack" id="optionsStack">
          ${q.options.map((opt, i) => `
            <button class="option-row" data-idx="${i}" onclick="checkAnswer(${i}, this)">
              <span class="key-index">${String.fromCharCode(65 + i)}</span>
              <span class="option-content">${opt}</span>
            </button>
          `).join("")}
        </div>

        <div id="feedbackContainer"></div>
        <div class="footer-actions" id="actionsRow" style="display:none;"></div>
      </div>
    `;
  } else if (qType === "tf") {
    // 2. DẠNG TRẮC NGHIỆM ĐÚNG / SAI (PHẦN II)
    userTfChoices = {};
    if (q.items && q.items.length > 0) {
      const letters = ["a", "b", "c", "d"];
      quizBox.innerHTML = `
        <div class="question-pane">
          <div class="q-meta-row">
            <span class="q-topic-tag">${currentSetObj.title} • Phần II: Trắc nghiệm Đúng / Sai</span>
            <div class="q-meta-right">
              <span class="q-point-pill tf">🎯 Tối đa: <strong>+${formatPoints(qMaxPts)} đ</strong> (1 ý: 10% • 2 ý: 25% • 3 ý: 50% • 4 ý: 100%)</span>
            </div>
          </div>

          ${diagramHtml}

          <h2 class="question-prompt">${q.q}</h2>

          <div class="tf-box">
            ${q.items.map((it, idx) => `
              <div class="tf-item-row" data-sub-idx="${idx}">
                <span class="tf-item-text"><strong>${letters[idx] || (idx + 1)})</strong> ${typeof it === 'object' ? it.text : it}</span>
                <div class="tf-item-controls">
                  <button type="button" class="btn-tf-choice" data-choice="true" onclick="selectTfChoice(${idx}, true, this)">Đúng</button>
                  <button type="button" class="btn-tf-choice" data-choice="false" onclick="selectTfChoice(${idx}, false, this)">Sai</button>
                </div>
              </div>
            `).join("")}
            <button type="button" class="btn-tf-submit" onclick="submitTfAnswer()">
              <span>Kiểm tra kết quả</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </button>
          </div>

          <div id="feedbackContainer"></div>
          <div class="footer-actions" id="actionsRow" style="display:none;"></div>
        </div>
      `;
    } else {
      // Single True / False prompt
      quizBox.innerHTML = `
        <div class="question-pane">
          <div class="q-meta-row">
            <span class="q-topic-tag">${currentSetObj.title} • Phần II: Trắc nghiệm Đúng / Sai</span>
            <div class="q-meta-right">
              <span class="q-point-pill tf">🎯 Điểm câu này: <strong>+${formatPoints(qMaxPts)} đ</strong></span>
            </div>
          </div>

          ${diagramHtml}

          <h2 class="question-prompt">${q.q}</h2>

          <div class="options-stack" style="grid-template-columns: 1fr 1fr; gap: 16px;">
            <button class="option-row" onclick="handleSingleTf(true, this)">
              <span class="key-index" style="color:#059669; font-weight:800;">Đ</span>
              <span class="option-content"><strong>ĐÚNG</strong></span>
            </button>
            <button class="option-row" onclick="handleSingleTf(false, this)">
              <span class="key-index" style="color:var(--dol-red); font-weight:800;">S</span>
              <span class="option-content"><strong>SAI</strong></span>
            </button>
          </div>

          <div id="feedbackContainer"></div>
          <div class="footer-actions" id="actionsRow" style="display:none;"></div>
        </div>
      `;
    }
  } else {
    // 3. DẠNG TRẮC NGHIỆM TRẢ LỜI NGẮN (PHẦN III)
    const promptDisplay = q.q.includes("___") 
      ? q.q.replace(/___+/g, '<span class="blank-spot">___</span>')
      : q.q;

    quizBox.innerHTML = `
      <div class="question-pane">
        <div class="q-meta-row">
          <span class="q-topic-tag">${currentSetObj.title} • Phần III: Trả lời ngắn</span>
          <div class="q-meta-right">
            <span class="q-point-pill sa">🎯 Điểm câu này: <strong>+${formatPoints(qMaxPts)} đ</strong></span>
            <span class="keyboard-hint">Nhấn Enter để nộp</span>
          </div>
        </div>

        ${diagramHtml}

        <h2 class="question-prompt">${promptDisplay}</h2>

        <div class="fb-input-wrapper">
          <input type="text" class="fb-text-field" id="blankInput" placeholder="Nhập câu trả lời ngắn (số hoặc từ khóa)..." autocomplete="off" autofocus>
          <div class="fb-actions-bar">
            <button class="btn-primary-action" id="submitBlankBtn" onclick="checkFillBlank(false)">
              <span>Kiểm tra</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </button>
            <button class="btn-secondary-action" id="showAnswerBtn" onclick="checkFillBlank(true)">
              <span>Xem đáp án</span>
            </button>
          </div>
        </div>

        <div id="feedbackContainer"></div>
        <div class="footer-actions" id="actionsRow" style="display:none;"></div>
      </div>
    `;

    const input = document.getElementById("blankInput");
    if (input) {
      input.focus();
      input.onkeydown = (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
          checkFillBlank(false);
        }
      };
    }
  }
  renderMathIfAvailable(quizBox);
}

/* MCQ Answer Verification */
function checkAnswer(selectedIdx, btnEl) {

  if (hasAnswered) return;
  hasAnswered = true;

  const q = activeQuestions[currentIndex];
  const qMaxPts = q.maxPoints || (10.0 / activeQuestions.length);
  const isCorrect = (selectedIdx === q.correct);
  const earnedPts = isCorrect ? qMaxPts : 0;

  if (isCorrect) {
    currentScore++;
    currentEarnedPoints += earnedPts;
    partEarnedPoints.mc += earnedPts;
  } else {
    recordMistake({
      questionNumber: currentIndex + 1,
      q: q.q,
      userAnswer: `${String.fromCharCode(65 + selectedIdx)}. ${q.options[selectedIdx]}`,
      correctAnswer: `${String.fromCharCode(65 + q.correct)}. ${q.options[q.correct]}`,
      explain: q.explain,
      knowledgePoint: detectKnowledgePoint(q.q, q.topic),
      questionObj: q
    });
  }

  const blankEl = document.getElementById("mcBlankSpot");
  if (blankEl) {
    blankEl.innerHTML = q.options[q.correct];
    blankEl.style.color = "var(--dol-green)";
    blankEl.style.borderBottomColor = "var(--dol-green)";
    blankEl.style.borderBottomStyle = "solid";
  }

  const allBtns = document.querySelectorAll(".option-row");
  allBtns.forEach((b, idx) => {
    b.disabled = true;
    if (idx === q.correct) b.classList.add("correct", "is-correct");
    if (idx === selectedIdx && !isCorrect) b.classList.add("wrong", "is-wrong");
  });

  const message = isCorrect
    ? `<strong>Chính xác!</strong> ${q.explain}`
    : `<strong>Chưa chính xác!</strong> Đáp án đúng là <strong>${String.fromCharCode(65 + q.correct)}. ${q.options[q.correct]}</strong>.<br>${q.explain}`;

  showFeedback(isCorrect, message, earnedPts, qMaxPts);
}

/* Fill-in-the-Blank Answer Verification */
function checkFillBlank(revealOnly) {
  if (hasAnswered) return;

  const input = document.getElementById("blankInput");
  if (!input) return;

  const rawTyped = input.value.trim();
  const val = normalizeVietnamese(rawTyped);
  const q = activeQuestions[currentIndex];
  const qMaxPts = q.maxPoints || (10.0 / activeQuestions.length);

  if (!val && !revealOnly) {
    input.focus();
    input.style.borderColor = "var(--dol-red)";
    return;
  }

  hasAnswered = true;
  input.disabled = true;
  const submitBtn = document.getElementById("submitBlankBtn");
  const showBtn = document.getElementById("showAnswerBtn");
  if (submitBtn) submitBtn.disabled = true;
  if (showBtn) showBtn.disabled = true;

  const isMatch = !revealOnly && q.answers.some(ans => isShortAnswerMatch(rawTyped, ans));
  const earnedPts = isMatch ? qMaxPts : 0;

  if (isMatch) {
    currentScore++;
    currentEarnedPoints += earnedPts;
    partEarnedPoints.sa += earnedPts;
  } else {
    recordMistake({
      questionNumber: currentIndex + 1,
      q: q.q,
      userAnswer: revealOnly ? "(Bấm xem đáp án)" : (rawTyped || "(Bỏ trống)"),
      correctAnswer: q.answers.join(" hoặc "),
      explain: q.explain,
      knowledgePoint: detectKnowledgePoint(q.q, q.topic),
      questionObj: q
    });
  }

  input.classList.add(isMatch ? "correct" : "wrong", isMatch ? "is-correct" : "is-wrong");

  const acceptedList = q.answers.map(a => `"<strong>${a}</strong>"`).join(" hoặc ");
  const message = isMatch
    ? `<strong>Chính xác!</strong> ${q.explain}`
    : `<strong>${revealOnly ? "Đáp án chính xác:" : "Chưa chính xác!"}</strong> Từ cần điền là: ${acceptedList}.<br>${q.explain}`;

  showFeedback(isMatch, message, earnedPts, qMaxPts);
}

/* Inline Feedback */
function showFeedback(isCorrect, messageHtml, earnedPts = 0, maxPts = 0) {
  const fbContainer = document.getElementById("feedbackContainer");
  const actRow = document.getElementById("actionsRow");
  if (!fbContainer || !actRow) return;

  const ptsBadge = maxPts > 0
    ? `<span class="feedback-pts-pill ${earnedPts > 0 ? 'earned' : 'zero'}">+${formatPoints(earnedPts)} / ${formatPoints(maxPts)} điểm</span>`
    : '';

  const statusText = isCorrect
    ? "● Chính xác"
    : (earnedPts > 0 ? "● Đúng một phần" : "● Chưa chính xác");

  fbContainer.innerHTML = `
    <div class="feedback-callout ${isCorrect ? "correct" : "wrong"}">
      <div class="feedback-status" style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
        <span>${statusText}</span>
        ${ptsBadge}
      </div>
      <div class="feedback-detail">${messageHtml}</div>
    </div>
  `;

  actRow.style.display = "flex";
  const isLast = (currentIndex + 1 >= activeQuestions.length);
  actRow.innerHTML = `
    <button class="btn-primary-action" id="nextQuestionBtn">
      <span>${isLast ? "Xem kết quả & Điểm số" : "Câu tiếp theo"}</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
    </button>
  `;

  const nextBtn = document.getElementById("nextQuestionBtn");
  if (nextBtn) {
    nextBtn.focus();
    nextBtn.onclick = () => {
      currentIndex++;
      renderQuizQuestion();
    };
  }

  renderMathIfAvailable(fbContainer);
  updateProgress();
}

/* Render KaTeX math expressions if KaTeX auto-render is loaded */
function renderMathIfAvailable(container) {
  const target = container || quizBox || document.body;
  if (window.renderMathInElement && target) {
    try {
      window.renderMathInElement(target, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
          { left: "\\(", right: "\\)", display: false },
          { left: "\\[", right: "\\]", display: true }
        ],
        throwOnError: false
      });
    } catch (e) {
      // ignore math render errors
    }
  }
}

/* So khớp đáp án Trả lời ngắn chuẩn cho cả Số âm / Số thập phân (Toán, Lí, Hóa) và Văn bản */
function isShortAnswerMatch(userTyped, acceptedAns) {
  const uRaw = String(userTyped || "").trim();
  const aRaw = String(acceptedAns || "").trim();
  if (!uRaw || !aRaw) return false;

  // Chuẩn hóa dấu trừ Unicode (–, −) thành '-'
  const uNumStr = uRaw.replace(/[–−]/g, "-").replace(/\s+/g, "").replace(",", ".");
  const aNumStr = aRaw.replace(/[–−]/g, "-").replace(/\s+/g, "").replace(",", ".");

  const numRegex = /^-?\d+(\.\d+)?$/;
  if (numRegex.test(uNumStr) && numRegex.test(aNumStr)) {
    return Math.abs(parseFloat(uNumStr) - parseFloat(aNumStr)) < 1e-9;
  }

  // Nếu một trong hai là số âm mà bên kia không có dấu trừ thì không khớp
  if ((uNumStr.startsWith("-") && !aNumStr.startsWith("-")) || (!uNumStr.startsWith("-") && aNumStr.startsWith("-"))) {
    return false;
  }

  if (uNumStr.toLowerCase() === aNumStr.toLowerCase()) return true;
  return normalizeVietnamese(uRaw) === normalizeVietnamese(aRaw);
}

/* String Normalization */
function normalizeVietnamese(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,/#!$%^&*;:{}=\-_'~()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/* Array Shuffle */
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* TV Mode removed */
localStorage.removeItem("bp_tv_mode");
document.body.classList.remove("tv-mode");

/* ========================================================
   SUPABASE LIVE DATA SYNC
   Fetch real questions & topics from Supabase if configured
   ======================================================== */
async function syncFromSupabase() {
  const client = window.getSupabaseClient ? window.getSupabaseClient() : null;
  const statusPill = document.getElementById("supabaseStatusPill");

  if (!client) {
    if (statusPill) {
      statusPill.innerHTML = `<span class="sb-dot-warning"></span> Supabase: Hãy điền key trong supabase-config.js`;
      statusPill.title = "Mở file supabase-config.js để điền Supabase Project URL & Anon Key của bạn.";
    }
    return;
  }

  try {
    const subjectId = window.CURRENT_SUBJECT_ID || 'vatli';

    // 1. Fetch Topics
    const { data: dbTopics, error: tErr } = await client
      .from('topics')
      .select('*')
      .eq('subject_id', subjectId)
      .order('order_index', { ascending: true });

    // 2. Fetch Questions
    const { data: dbQuestions, error: qErr } = await client
      .from('questions')
      .select('*')
      .eq('subject_id', subjectId)
      .order('order_index', { ascending: true });

    if (!tErr && dbTopics && dbTopics.length > 0 && (!window.TOPIC_SETS || window.TOPIC_SETS.length === 0 || (dbQuestions && dbQuestions.length > 0))) {
      const existingMap = new Map((window.TOPIC_SETS || []).map(s => [s.id.toString(), s]));
      window.TOPIC_SETS = dbTopics.map(t => {
        const localTopic = existingMap.get(t.id.toString());
        return {
          id: isNaN(parseInt(t.id, 10)) ? t.id : parseInt(t.id, 10),
          index: t.index_code,
          title: t.title,
          desc: t.description,
          chapter: t.chapter || localTopic?.chapter || getSubjectChapterName(subjectId),
          theme: t.theme || 'blue',
          icon: t.icon_svg,
          isFull: !!t.is_full
        };
      });
    }

    if (!qErr) {
      if (dbQuestions && dbQuestions.length > 0) {
        const mcList = [];
        const tfList = [];
        const saList = [];

        dbQuestions.forEach(q => {
          const tId = isNaN(parseInt(q.topic_id, 10)) ? q.topic_id : parseInt(q.topic_id, 10);
          if (q.type === 'mc') {
            mcList.push([
              q.question_text,
              q.options,
              q.correct_index,
              q.explanation,
              tId,
              q.diagram || null
            ]);
          } else if (q.type === 'tf') {
            tfList.push([
              q.question_text,
              q.items || q.options || q.accepted_answers,
              q.explanation,
              tId,
              q.diagram || null
            ]);
          } else {
            saList.push([
              q.question_text,
              q.accepted_answers || q.options,
              q.explanation,
              tId,
              q.diagram || null
            ]);
          }
        });

        window.ALL_MC = mcList;
        window.ALL_TF = tfList;
        window.ALL_SA = saList;
        window.ALL_FB = saList;

        isLoadedFromSupabase = true;
        if (statusPill) {
          statusPill.innerHTML = `<span class="sb-dot-success"></span> Supabase Live: ${dbQuestions.length} câu hỏi thật`;
          statusPill.classList.add("connected");
        }

        console.log(`✅ Đã tải ${dbQuestions.length} câu hỏi thật thành công từ Supabase!`);
        renderDashboard();
      } else if (dbQuestions && dbQuestions.length === 0) {
        if (statusPill) {
          statusPill.innerHTML = `<span class="sb-dot-success"></span> Supabase Live: 0 câu hỏi`;
          statusPill.classList.add("connected");
        }
        renderDashboard();
      }
    }
  } catch (err) {
    console.warn('Lỗi khi tải dữ liệu từ Supabase:', err);
    if (statusPill) {
      statusPill.innerHTML = `<span class="sb-dot-warning"></span> Supabase: ${err.message}`;
    }
  }
}

// Global Initialization
function initApp() {
  dashboardView = document.getElementById("dashboardView");
  quizView = document.getElementById("quizView");
  setsGridContainer = document.getElementById("setsGridContainer");
  totalMCLabel = document.getElementById("totalMCLabel");
  totalTFLabel = document.getElementById("totalTFLabel");
  totalSALabel = document.getElementById("totalSALabel");
  totalFBLabel = document.getElementById("totalFBLabel");
  backToMenuBtn = document.getElementById("backToMenuBtn");
  quizModeBadge = document.getElementById("quizModeBadge");
  progressCountEl = document.getElementById("progressCount");
  progressBarEl = document.getElementById("progressBar");
  scoreCountEl = document.getElementById("scoreCount");
  quizBox = document.getElementById("quizBox");

  if (backToMenuBtn) {
    backToMenuBtn.onclick = () => {
      if (quizView) quizView.classList.remove("active");
      if (dashboardView) dashboardView.classList.add("active");
      renderDashboard();
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
  }
  localStorage.removeItem("bp_tv_mode");
  document.body.classList.remove("tv-mode");

  // Initial dashboard render
  renderDashboard();

  // Trigger Supabase Live Sync in background
  syncFromSupabase();

  // URL query check: e.g. ?topic=all&mode=mc
  const urlParams = new URLSearchParams(window.location.search);
  const qTopic = urlParams.get("topic");
  const qMode = urlParams.get("mode");
  if (qTopic && qMode) {
    startQuiz(qTopic, qMode);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

/* Keyboard Navigation */
document.addEventListener("keydown", (e) => {
  if (!quizView || !quizView.classList.contains("active")) return;

  // Move to next question on Enter or Space after answering
  if (hasAnswered) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const nextBtn = document.getElementById("nextQuestionBtn");
      if (nextBtn) nextBtn.click();
    }
    return;
  }

  // MCQ keyboard selection: 1-4 or A-D
  const activeQ = activeQuestions[currentIndex];
  const activeType = activeQ ? (activeQ.type || currentMode) : currentMode;
  if (activeType === "mc" && !hasAnswered) {
    const key = e.key.toUpperCase();
    let optIndex = -1;
    if (["1", "2", "3", "4"].includes(key)) optIndex = parseInt(key, 10) - 1;
    else if (["A", "B", "C", "D"].includes(key)) optIndex = key.charCodeAt(0) - 65;

    if (optIndex >= 0) {
      const opts = document.querySelectorAll(".option-row");
      if (opts[optIndex]) {
        e.preventDefault();
        opts[optIndex].click();
      }
    }
  }
});


let userTfChoices = {};

function selectTfChoice(subIdx, choice, btnEl) {
  userTfChoices[subIdx] = choice;
  const row = btnEl.closest('.tf-item-row');
  row.querySelectorAll('.btn-tf-choice').forEach(b => {
    b.classList.remove('selected-true', 'selected-false');
  });
  btnEl.classList.add(choice ? 'selected-true' : 'selected-false');
}
window.selectTfChoice = selectTfChoice;

function handleSingleTf(choice, btnEl) {
  if (hasAnswered) return;
  hasAnswered = true;
  const q = activeQuestions[currentIndex];
  const qMaxPts = q.maxPoints || (10.0 / activeQuestions.length);
  const isCorrect = (choice === q.singleCorrect);
  const earnedPts = isCorrect ? qMaxPts : 0;

  if (isCorrect) {
    currentScore++;
    currentEarnedPoints += earnedPts;
    partEarnedPoints.tf += earnedPts;
  } else {
    recordMistake({
      questionNumber: currentIndex + 1,
      q: q.q,
      userAnswer: choice ? "ĐÚNG" : "SAI",
      correctAnswer: q.singleCorrect ? "ĐÚNG" : "SAI",
      explain: q.explain,
      knowledgePoint: detectKnowledgePoint(q.q, q.topic),
      questionObj: q
    });
  }

  const allBtns = document.querySelectorAll(".option-row");
  allBtns.forEach(b => b.disabled = true);
  if (btnEl) btnEl.classList.add(isCorrect ? "correct" : "wrong", isCorrect ? "is-correct" : "is-wrong");

  const message = isCorrect
    ? `<strong>Chính xác!</strong> Câu trả lời là: <strong>${q.singleCorrect ? "ĐÚNG" : "SAI"}</strong>.<br>${q.explain}`
    : `<strong>Chưa chính xác!</strong> Đáp án đúng là: <strong>${q.singleCorrect ? "ĐÚNG" : "SAI"}</strong>.<br>${q.explain}`;

  showFeedback(isCorrect, message, earnedPts, qMaxPts);
}
window.handleSingleTf = handleSingleTf;

function submitTfAnswer() {
  if (hasAnswered) return;
  const q = activeQuestions[currentIndex];
  const qMaxPts = q.maxPoints || (10.0 / activeQuestions.length);

  if (!q.items || q.items.length === 0) return;

  const answeredCount = Object.keys(userTfChoices).length;
  if (answeredCount < q.items.length) {
    alert("Vui lòng chọn Đúng hoặc Sai cho tất cả " + q.items.length + " mệnh đề trước khi kiểm tra!");
    return;
  }

  hasAnswered = true;
  let correctCount = 0;
  const wrongSubItems = [];
  const letters = ["a", "b", "c", "d"];

  q.items.forEach((it, idx) => {
    const correctVal = typeof it === 'object' ? it.isCorrect : false;
    const userVal = userTfChoices[idx];
    const subText = typeof it === 'object' ? it.text : it;
    const row = document.querySelector(`.tf-item-row[data-sub-idx="${idx}"]`);
    if (row) {
      row.querySelectorAll('.btn-tf-choice').forEach(b => b.disabled = true);
      const chosenBtn = row.querySelector(`.btn-tf-choice[data-choice="${userVal}"]`);
      if (userVal === correctVal) {
        chosenBtn?.classList.add('correct-highlight');
        correctCount++;
      } else {
        chosenBtn?.classList.add('wrong-highlight');
        const correctBtn = row.querySelector(`.btn-tf-choice[data-choice="${correctVal}"]`);
        correctBtn?.classList.add('correct-highlight');
        wrongSubItems.push({
          letter: letters[idx] || (idx + 1),
          text: subText,
          user: userVal ? "Đúng" : "Sai",
          correct: correctVal ? "Đúng" : "Sai"
        });
      }
    }
  });

  const submitBtn = document.querySelector('.btn-tf-submit');
  if (submitBtn) submitBtn.disabled = true;

  const tfRatio = calculateTfRatio(correctCount, q.items.length);
  const earnedPts = qMaxPts * tfRatio;
  currentEarnedPoints += earnedPts;
  partEarnedPoints.tf += earnedPts;

  const isFullCorrect = (correctCount === q.items.length);
  if (isFullCorrect) {
    currentScore++;
  } else {
    recordMistake({
      questionNumber: currentIndex + 1,
      q: q.q,
      userAnswer: wrongSubItems.map(w => `Ý ${w.letter}) chọn ${w.user}`).join("; "),
      correctAnswer: wrongSubItems.map(w => `Ý ${w.letter}) phải là ${w.correct} (${w.text})`).join("<br>"),
      explain: q.explain,
      knowledgePoint: detectKnowledgePoint(q.q, q.topic),
      questionObj: q
    });
  }

  const message = `<strong>${isFullCorrect ? "Xuất sắc!" : "Kết quả:"}</strong> Bạn trả lời đúng <strong>${correctCount} / ${q.items.length}</strong> mệnh đề — đạt <strong>+${formatPoints(earnedPts)} / ${formatPoints(qMaxPts)} điểm</strong>.<br>${q.explain}`;

  showFeedback(isFullCorrect, message, earnedPts, qMaxPts);
}
window.submitTfAnswer = submitTfAnswer;
