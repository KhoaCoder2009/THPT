/* ========================================================
   KEdu • MODULAR QUIZ ENGINE WITH SUPABASE INTEGRATION
   Live Data Fetching, Question Parsing, Scoring & Quiz Results Storage
   ======================================================== */

let currentSetId = null;
let currentMode = "mc"; // "mc" or "fb"
let activeQuestions = [];
let currentIndex = 0;
let currentScore = 0;
let hasAnswered = false;
let isLoadedFromSupabase = false;

// DOM Hooks
let dashboardView, quizView, setsGridContainer, totalMCLabel, totalTFLabel, totalSALabel, totalFBLabel;
let backToMenuBtn, quizModeBadge, progressCountEl, progressBarEl, scoreCountEl, quizBox;
let supabaseStatusPill;

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
  if (setObj && setObj.isFull) return raw;
  
  return raw.filter(item => {
    // For MC: [q, opts, correct, explain, topicId, diagram] -> item[4] is topicId
    // For TF/SA: [q, items/answers, explain, topicId, diagram] -> item[3] is topicId
    const val = (normalizedMode === "mc")
      ? item[4]
      : (item[3] !== undefined && typeof item[3] !== 'object' ? item[3] : item[item.length - 1]);
    return val === num || val === topicId || val?.toString() === topicId?.toString();
  });
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
      const mcCount = getQuestionsForTopic("mc", set.id).length;
      const tfCount = getQuestionsForTopic("tf", set.id).length;
      const saCount = getQuestionsForTopic("sa", set.id).length;
      const totalCount = mcCount + tfCount + saCount;
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

      const descHtml = set.desc ? `<p class="h-card-desc">${set.desc}</p>` : '';

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

          <!-- 2. Thông tin chính: Bài, Tên bộ đề, Mô tả, Số câu hỏi -->
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

          <!-- 3. Nút hành động luyện tập 3 dạng thức chuẩn GDPT -->
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

/* Start Quiz Session (mc: Trắc nghiệm, tf: Đúng sai, sa/fb: Trả lời ngắn) */
function startQuiz(setId, mode) {
  currentSetId = setId;
  currentMode = (mode === "fb") ? "sa" : mode;
  currentIndex = 0;
  currentScore = 0;
  hasAnswered = false;

  const rawList = getQuestionsForTopic(currentMode, setId);
  const topicSets = window.TOPIC_SETS || [];
  const currentSetMeta = topicSets.find(s => s.id?.toString() === setId?.toString());
  const orderedList = (setId === "all" || currentSetMeta?.isFull) ? shuffle(rawList) : [...rawList];

  if (currentMode === "mc") {
    activeQuestions = orderedList.map(item => {
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
        diagram: item[5] || null
      };
    });
    if (quizModeBadge) {
      quizModeBadge.textContent = "Trắc nghiệm";
      quizModeBadge.className = "quiz-mode-pill badge-state mc";
    }
  } else if (currentMode === "tf") {
    // Dạng Đúng / Sai (Phần II)
    activeQuestions = orderedList.map(item => {
      // Structure: [questionText, itemsArray: [{text: "...", isCorrect: true/false}], explain, topic, diagram]
      const items = Array.isArray(item[1]) ? item[1] : null;
      const singleCorrect = typeof item[1] === 'boolean' ? item[1] : (item[1] === 1 || item[1] === 'Đúng' || item[1] === 'true');
      return {
        type: 'tf',
        q: item[0],
        items: items,
        singleCorrect: singleCorrect,
        explain: item[2] || '',
        topic: item[3],
        diagram: item[4] || null
      };
    });
    if (quizModeBadge) {
      quizModeBadge.textContent = "Đúng sai";
      quizModeBadge.className = "quiz-mode-pill badge-state tf";
    }
  } else {
    // Dạng Trả lời ngắn (Phần III)
    activeQuestions = shuffle(rawList).map(item => ({
      type: 'sa',
      q: item[0],
      answers: item[1],
      explain: item[2],
      topic: item[3],
      diagram: item[4] || null
    }));
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

/* Tracker Header */
function updateProgress() {
  const total = activeQuestions.length;
  if (total === 0) {
    if (progressCountEl) progressCountEl.textContent = "0/0";
    if (progressBarEl) progressBarEl.style.width = "0%";
    if (scoreCountEl) scoreCountEl.textContent = "Điểm: 0";
    return;
  }
  const answeredCount = Math.min(total, hasAnswered ? currentIndex + 1 : currentIndex);
  if (progressCountEl) progressCountEl.textContent = currentIndex < total ? `Câu ${currentIndex + 1} / ${total}` : "Hoàn thành";
  if (scoreCountEl) scoreCountEl.textContent = `Điểm: ${currentScore} / ${answeredCount}`;
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
        <div class="result-number">0</div>
        <p class="result-verdict">Chưa tìm thấy câu hỏi phù hợp cho bộ đề này.</p>
        <button class="btn-primary-action" onclick="if(backToMenuBtn) backToMenuBtn.click()">Trở về danh sách bộ đề</button>
      </div>`;
    return;
  }

  // Finished Review Screen
  if (currentIndex >= activeQuestions.length) {
    const total = activeQuestions.length;
    const pct = Math.round((currentScore / total) * 100);
    let verdict = "Xuất sắc! Bạn đã nắm vững lý thuyết và các dạng bài tập trọng tâm.";
    if (pct < 50) {
      verdict = "Bạn nên mở lại tài liệu tóm tắt lý thuyết để củng cố các khái niệm và công thức cơ bản.";
    } else if (pct < 80) {
      verdict = "Kết quả khá tốt! Rà soát lại các câu sai để hoàn thiện điểm số tuyệt đối.";
    }

    const topicSets = window.TOPIC_SETS || [];
    const currentSetObj = topicSets.find(s => s.id.toString() === currentSetId.toString()) || topicSets[0] || { title: "Chuyên đề" };

    // Record result to Supabase
    recordQuizResultToSupabase(currentScore, total, pct);

    quizBox.innerHTML = `
      <div class="result-board">
        <div class="result-status-badge">${currentSetObj.title}</div>
        <div class="result-number">${currentScore} / ${total}</div>
        <p class="result-verdict">Đạt tỷ lệ chính xác <strong>${pct}%</strong>. ${verdict}</p>

        <div class="metrics-table">
          <div class="metric-box">
            <div class="metric-box-val">${total}</div>
            <div class="metric-box-lbl">Tổng câu hỏi</div>
          </div>
          <div class="metric-box">
            <div class="metric-box-val" style="color:var(--dol-green);">${currentScore}</div>
            <div class="metric-box-lbl">Số câu đúng</div>
          </div>
          <div class="metric-box">
            <div class="metric-box-val" style="color:var(--dol-red);">${total - currentScore}</div>
            <div class="metric-box-lbl">Số câu sai</div>
          </div>
        </div>

        <div id="supabaseSaveNotice" style="font-size:12.5px; color:var(--dol-green); font-weight:600; margin:14px 0;"></div>

        <div class="footer-actions" style="justify-content:center;">
          <button class="btn-primary-action" onclick="startQuiz('${currentSetId}', '${currentMode}')">
            Làm lại bộ đề này
          </button>
          ${currentMode !== 'mc' && getQuestionsForTopic('mc', currentSetId).length > 0 ? `
            <button class="btn-secondary-action" onclick="startQuiz('${currentSetId}', 'mc')">
              Làm dạng Trắc nghiệm (${getQuestionsForTopic('mc', currentSetId).length} câu)
            </button>
          ` : ''}
          ${currentMode !== 'tf' && getQuestionsForTopic('tf', currentSetId).length > 0 ? `
            <button class="btn-secondary-action" onclick="startQuiz('${currentSetId}', 'tf')">
              Làm dạng Đúng sai (${getQuestionsForTopic('tf', currentSetId).length} câu)
            </button>
          ` : ''}
          ${currentMode !== 'sa' && getQuestionsForTopic('sa', currentSetId).length > 0 ? `
            <button class="btn-secondary-action" onclick="startQuiz('${currentSetId}', 'sa')">
              Làm dạng Trả lời ngắn (${getQuestionsForTopic('sa', currentSetId).length} câu)
            </button>
          ` : ''}
          <button class="btn-secondary-action" onclick="if(backToMenuBtn) backToMenuBtn.click()">
            Trở về danh sách bộ đề
          </button>
        </div>
      </div>`;
    return;
  }

  const q = activeQuestions[currentIndex];
  hasAnswered = false;

  const topicSets = window.TOPIC_SETS || [];
  const currentSetObj = topicSets.find(s => s.id === q.topic || s.id?.toString() === q.topic?.toString()) || { title: "Ôn tập" };
  const diagrams = window.DIAGRAMS || {};
  const diagramHtml = q.diagram && diagrams[q.diagram] ? diagrams[q.diagram] : "";

  if (currentMode === "mc") {
    // 1. DẠNG TRẮC NGHIỆM 4 LỰA CHỌN / ĐIỀN KHUYẾT (PHẦN I)
    const mcPromptDisplay = q.q.includes("___")
      ? q.q.replace(/___+/g, '<span class="blank-spot" id="mcBlankSpot">___</span>')
      : q.q;
    const modeLabel = q.q.includes("___") ? "Trắc nghiệm điền khuyết" : "Trắc nghiệm 4 lựa chọn";

    quizBox.innerHTML = `
      <div class="question-pane">
        <div class="q-meta-row">
          <span class="q-topic-tag">${currentSetObj.title} • ${modeLabel}</span>
          <span class="keyboard-hint">Nhấn phím 1, 2, 3, 4 để chọn nhanh</span>
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
  } else if (currentMode === "tf") {
    // 2. DẠNG TRẮC NGHIỆM ĐÚNG / SAI (PHẦN II)
    userTfChoices = {};
    if (q.items && q.items.length > 0) {
      const letters = ["a", "b", "c", "d"];
      quizBox.innerHTML = `
        <div class="question-pane">
          <div class="q-meta-row">
            <span class="q-topic-tag">${currentSetObj.title} • Trắc nghiệm Đúng / Sai</span>
            <span class="keyboard-hint">Chọn Đúng hoặc Sai cho từng mệnh đề</span>
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
            <span class="q-topic-tag">${currentSetObj.title} • Trắc nghiệm Đúng / Sai</span>
            <span class="keyboard-hint">Chọn Đúng hoặc Sai</span>
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
          <span class="q-topic-tag">${currentSetObj.title} • Trả lời ngắn</span>
          <span class="keyboard-hint">Gõ câu trả lời ngắn và nhấn Enter</span>
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
}

/* MCQ Answer Verification */
function checkAnswer(selectedIdx, btnEl) {

  if (hasAnswered) return;
  hasAnswered = true;

  const q = activeQuestions[currentIndex];
  const isCorrect = (selectedIdx === q.correct);

  if (isCorrect) currentScore++;

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

  showFeedback(isCorrect, message);
}

/* Fill-in-the-Blank Answer Verification */
function checkFillBlank(revealOnly) {
  if (hasAnswered) return;

  const input = document.getElementById("blankInput");
  if (!input) return;

  const val = normalizeVietnamese(input.value.trim());
  const q = activeQuestions[currentIndex];

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

  const isMatch = !revealOnly && q.answers.some(ans => normalizeVietnamese(ans) === val);
  if (isMatch) currentScore++;

  input.classList.add(isMatch ? "correct" : "wrong", isMatch ? "is-correct" : "is-wrong");

  const acceptedList = q.answers.map(a => `"<strong>${a}</strong>"`).join(" hoặc ");
  const message = isMatch
    ? `<strong>Chính xác!</strong> ${q.explain}`
    : `<strong>${revealOnly ? "Đáp án chính xác:" : "Chưa chính xác!"}</strong> Từ cần điền là: ${acceptedList}.<br>${q.explain}`;

  showFeedback(isMatch, message);
}

/* Inline Feedback */
function showFeedback(isCorrect, messageHtml) {
  const fbContainer = document.getElementById("feedbackContainer");
  const actRow = document.getElementById("actionsRow");
  if (!fbContainer || !actRow) return;

  fbContainer.innerHTML = `
    <div class="feedback-callout ${isCorrect ? "correct" : "wrong"}">
      <div class="feedback-status">
        ${isCorrect ? "● Chính xác" : "● Chưa chính xác"}
      </div>
      <div class="feedback-detail">${messageHtml}</div>
    </div>
  `;

  actRow.style.display = "flex";
  const isLast = (currentIndex + 1 >= activeQuestions.length);
  actRow.innerHTML = `
    <button class="btn-primary-action" id="nextQuestionBtn">
      <span>${isLast ? "Xem kết quả bài làm" : "Câu tiếp theo"}</span>
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

  updateProgress();
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

/* TV Presentation Mode */
function setTvMode(enable) {
  if (enable) {
    document.body.classList.add("tv-mode");
    localStorage.setItem("bp_tv_mode", "true");
    const tvText = document.getElementById("tvToggleText");
    if (tvText) tvText.textContent = "Tắt TV Mode";
  } else {
    document.body.classList.remove("tv-mode");
    localStorage.setItem("bp_tv_mode", "false");
    const tvText = document.getElementById("tvToggleText");
    if (tvText) tvText.textContent = "Chế độ TV";
  }
}

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
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
  }

  // Restore TV mode preference
  if (localStorage.getItem("bp_tv_mode") === "true") {
    setTvMode(true);
  }

  const tvBtn = document.getElementById("tvToggleBtn");
  if (tvBtn) {
    tvBtn.onclick = () => {
      const isTv = document.body.classList.contains("tv-mode");
      setTvMode(!isTv);
    };
  }

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
  if (currentMode === "mc" && !hasAnswered) {
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
  const isCorrect = (choice === q.singleCorrect);

  if (isCorrect) currentScore++;

  const allBtns = document.querySelectorAll(".option-row");
  allBtns.forEach(b => b.disabled = true);
  if (btnEl) btnEl.classList.add(isCorrect ? "correct" : "wrong", isCorrect ? "is-correct" : "is-wrong");

  const message = isCorrect
    ? `<strong>Chính xác!</strong> Câu trả lời là: <strong>${q.singleCorrect ? "ĐÚNG" : "SAI"}</strong>.<br>${q.explain}`
    : `<strong>Chưa chính xác!</strong> Đáp án đúng là: <strong>${q.singleCorrect ? "ĐÚNG" : "SAI"}</strong>.<br>${q.explain}`;

  showFeedback(isCorrect, message);
}
window.handleSingleTf = handleSingleTf;

function submitTfAnswer() {
  if (hasAnswered) return;
  const q = activeQuestions[currentIndex];

  if (!q.items || q.items.length === 0) return;

  const answeredCount = Object.keys(userTfChoices).length;
  if (answeredCount < q.items.length) {
    alert("Vui lòng chọn Đúng hoặc Sai cho tất cả " + q.items.length + " mệnh đề trước khi kiểm tra!");
    return;
  }

  hasAnswered = true;
  let correctCount = 0;

  q.items.forEach((it, idx) => {
    const correctVal = typeof it === 'object' ? it.isCorrect : false;
    const userVal = userTfChoices[idx];
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
      }
    }
  });

  const submitBtn = document.querySelector('.btn-tf-submit');
  if (submitBtn) submitBtn.disabled = true;

  const isFullCorrect = (correctCount === q.items.length);
  if (isFullCorrect) currentScore++;

  const message = `<strong>${isFullCorrect ? "Xuất sắc!" : "Kết quả:"}</strong> Bạn đã trả lời đúng <strong>${correctCount} / ${q.items.length}</strong> mệnh đề.<br>${q.explain}`;

  showFeedback(isFullCorrect, message);
}
window.submitTfAnswer = submitTfAnswer;
