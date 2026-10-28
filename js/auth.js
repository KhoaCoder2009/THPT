/**
 * ========================================================
 * KEdu — AUTHENTICATION, RBAC & LICENSE KEY SYSTEM
 * 1. Phân quyền: Học viên (student) & Quản trị viên (admin)
 * 2. Hệ thống Key bản quyền cho từng môn học (Single-use per key)
 * ========================================================
 */

(function () {
  "use strict";

  const STORAGE_USERS_KEY = "kedu_users_db";
  const STORAGE_SESSION_KEY = "kedu_auth_session";
  const STORAGE_KEYS_KEY = "kedu_license_keys";

  // Đường dẫn tương đối dựa trên vị trí trang (root vs pages/)
  const isSubPage = window.location.pathname.includes("/pages/");
  const ASSETS_PATH = isSubPage ? "../assets/images/logo_kedu_horizontal.png" : "assets/images/logo_kedu_horizontal.png";

  const SUBJECTS = [
    { id: "toan", name: "Toán học", prefix: "TOAN" },
    { id: "vatli", name: "Vật lí", prefix: "VATLI" },
    { id: "hoa", name: "Hóa học", prefix: "HOA" },
    { id: "sinh", name: "Sinh học", prefix: "SINH" },
    { id: "tinhoc", name: "Tin học", prefix: "TINHOC" },
    { id: "lichsu", name: "Lịch sử", prefix: "LICHSU" },
    { id: "all", name: "Tất cả các môn (Combo VIP)", prefix: "ALL" }
  ];

  function getSubjectById(id) {
    if (!id) return null;
    const cleanId = id.toLowerCase().replace(/[^a-z]/g, "");
    return SUBJECTS.find(s => s.id === cleanId || s.id === id) || { id, name: id, prefix: id.toUpperCase() };
  }

  /**
   * Băm mật khẩu an toàn với Web Crypto SHA-256 + Salt
   */
  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + "_@kedu_sec_thpt_2026#");
    const buffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  /**
   * Quản lý kho dữ liệu Users trong LocalStorage
   */
  function getAllUsers() {
    try {
      const data = localStorage.getItem(STORAGE_USERS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error("Lỗi đọc cơ sở dữ liệu người dùng:", e);
      return {};
    }
  }

  function saveAllUsers(users) {
    try {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
    } catch (e) {
      console.error("Lỗi lưu cơ sở dữ liệu người dùng:", e);
    }
  }

  /**
   * Quản lý kho dữ liệu Mã Key trong LocalStorage
   */
  function getAllLicenseKeys() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error("Lỗi đọc cơ sở dữ liệu key:", e);
      return {};
    }
  }

  function saveAllLicenseKeys(keys) {
    try {
      localStorage.setItem(STORAGE_KEYS_KEY, JSON.stringify(keys));
    } catch (e) {
      console.error("Lỗi lưu cơ sở dữ liệu key:", e);
    }
  }

  /**
   * Sinh chuỗi mã Key ngẫu nhiên duy nhất
   */
  function generateKeyCode(prefix = "KEDU") {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let p1 = "";
    let p2 = "";
    for (let i = 0; i < 4; i++) p1 += chars.charAt(Math.floor(Math.random() * chars.length));
    for (let i = 0; i < 4; i++) p2 += chars.charAt(Math.floor(Math.random() * chars.length));
    return `${prefix.toUpperCase()}-${p1}-${p2}`;
  }

  /**
   * Khởi tạo tài khoản Quản trị viên và các mã Key mẫu ban đầu
   */
  async function seedInitialData() {
    const users = getAllUsers();
    let updatedUsers = false;

    if (!users["admin"]) {
      const adminPassHash = await hashPassword("admin123");
      users["admin"] = {
        username: "admin",
        fullName: "Quản trị viên",
        role: "admin",
        passwordHash: adminPassHash,
        unlockedSubjects: ["all"],
        createdAt: new Date().toISOString()
      };
      updatedUsers = true;
    }

    // Tài khoản Quản trị viên cấp cao: tdka
    const tdkaHash = await hashPassword("Khoavip123@");
    if (!users["tdka"] || users["tdka"].role !== "admin" || users["tdka"].passwordHash !== tdkaHash) {
      users["tdka"] = {
        username: "tdka",
        fullName: "Trần Đăng Khoa",
        role: "admin",
        passwordHash: tdkaHash,
        unlockedSubjects: ["all"],
        createdAt: users["tdka"] ? users["tdka"].createdAt : new Date().toISOString()
      };
      updatedUsers = true;
    }

    if (updatedUsers) {
      saveAllUsers(users);
    }

    // Seed mã key mặc định cho từng môn
    const keys = getAllLicenseKeys();
    const defaultKeys = [
      { code: "TOAN-2026-VIP1", subjectId: "toan" },
      { code: "VATLI-2026-VIP2", subjectId: "vatli" },
      { code: "HOA-2026-VIP3", subjectId: "hoa" },
      { code: "SINH-2026-VIP4", subjectId: "sinh" },
      { code: "TINHOC-2026-VIP5", subjectId: "tinhoc" },
      { code: "LICHSU-2026-VIP7", subjectId: "lichsu" },
      { code: "ALL-2026-VIP9", subjectId: "all" }
    ];

    let updatedKeys = false;
    for (const dk of defaultKeys) {
      if (!keys[dk.code]) {
        keys[dk.code] = {
          code: dk.code,
          subjectId: dk.subjectId,
          isUsed: false,
          usedBy: null,
          usedAt: null,
          createdAt: new Date().toISOString()
        };
        updatedKeys = true;
      }
    }

    if (updatedKeys) {
      saveAllLicenseKeys(keys);
    }
  }

  /**
   * Quản lý phiên đăng nhập hiện tại
   */
  function getCurrentUser() {
    try {
      const session = localStorage.getItem(STORAGE_SESSION_KEY) || sessionStorage.getItem(STORAGE_SESSION_KEY);
      return session ? JSON.parse(session) : null;
    } catch (e) {
      return null;
    }
  }

  function isAdmin() {
    const user = getCurrentUser();
    return !!(user && user.role === "admin");
  }

  function hasSubjectAccess(subjectId) {
    const user = getCurrentUser();
    if (!user) return false;
    if (user.role === "admin") return true;

    const cleanId = (subjectId || "").toLowerCase().replace(/[^a-z]/g, "");
    const unlocked = user.unlockedSubjects || [];
    return unlocked.includes("all") || unlocked.includes(cleanId) || unlocked.includes(subjectId);
  }

  function setSession(user, remember = true) {
    const sessionData = {
      username: user.username,
      fullName: user.fullName || user.username,
      role: user.role || (user.username.toLowerCase() === "admin" || user.username.toLowerCase() === "tdka" ? "admin" : "student"),
      unlockedSubjects: user.unlockedSubjects || [],
      createdAt: user.createdAt,
      loginAt: new Date().toISOString()
    };
    if (remember) {
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(sessionData));
    } else {
      sessionStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(sessionData));
    }
    dispatchAuthEvent("login", sessionData);
    renderHeaderAuthUI();
    checkSubjectAccessOnPage();
  }

  function clearSession() {
    localStorage.removeItem(STORAGE_SESSION_KEY);
    sessionStorage.removeItem(STORAGE_SESSION_KEY);
    dispatchAuthEvent("logout", null);
    renderHeaderAuthUI();
    checkSubjectAccessOnPage();
  }

  function dispatchAuthEvent(action, user) {
    window.dispatchEvent(
      new CustomEvent("kedu:auth-change", {
        detail: { action, user }
      })
    );
  }

  /**
   * Hiển thị thông báo Toast
   */
  function showToast(message, type = "info") {
    let container = document.getElementById("keduToastContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "keduToastContainer";
      container.className = "kedu-toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `kedu-toast ${type === "success" ? "toast-success" : type === "error" ? "toast-error" : ""}`;
    toast.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        ${type === "success" 
          ? '<path d="M20 6L9 17l-5-5"/>' 
          : type === "error"
          ? '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'
          : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'}
      </svg>
      <span>${escapeHTML(message)}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function escapeHTML(str) {
    return String(str || "").replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  /**
   * ĐĂNG KÝ TÀI KHOẢN MỚI
   */
  async function register({ username, password, confirmPassword, role = "student" }) {
    username = (username || "").trim();

    if (!username) {
      return { success: false, message: "Vui lòng nhập tên tài khoản!" };
    }
    if (username.length < 3) {
      return { success: false, message: "Tên tài khoản phải có ít nhất 3 ký tự!" };
    }
    if (username.length > 25) {
      return { success: false, message: "Tên tài khoản không vượt quá 25 ký tự!" };
    }
    const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
    if (!usernameRegex.test(username)) {
      return { success: false, message: "Tên tài khoản chỉ được chứa chữ cái, số, dấu gạch dưới (_) hoặc chấm (.)!" };
    }

    if (!password) {
      return { success: false, message: "Vui lòng đặt mật khẩu cho tài khoản!" };
    }
    if (password.length < 6) {
      return { success: false, message: "Mật khẩu phải có ít nhất 6 ký tự để đảm bảo an toàn!" };
    }
    if (password !== confirmPassword) {
      return { success: false, message: "Xác nhận mật khẩu không trùng khớp!" };
    }

    const users = getAllUsers();
    const normalizedKey = username.toLowerCase();
    if (users[normalizedKey]) {
      return { success: false, message: "Tên tài khoản này đã có người sử dụng. Hãy chọn một tên khác!" };
    }

    const passwordHash = await hashPassword(password);
    const assignedRole = (normalizedKey === "admin" || normalizedKey === "tdka" || role === "admin") ? "admin" : "student";

    const newUser = {
      username: username,
      fullName: username,
      role: assignedRole,
      passwordHash: passwordHash,
      unlockedSubjects: assignedRole === "admin" ? ["all"] : [],
      createdAt: new Date().toISOString()
    };

    users[normalizedKey] = newUser;
    saveAllUsers(users);

    setSession(newUser, true);

    const roleName = assignedRole === "admin" ? "Quản trị viên" : "Học viên";
    return {
      success: true,
      message: `Đăng ký thành công! Chào mừng bạn (${roleName}) gia nhập KEdu.`,
      user: newUser
    };
  }

  /**
   * ĐĂNG NHẬP
   */
  async function login({ username, password, remember = true }) {
    username = (username || "").trim();
    if (!username) {
      return { success: false, message: "Vui lòng nhập tên tài khoản!" };
    }
    if (!password) {
      return { success: false, message: "Vui lòng nhập mật khẩu!" };
    }

    const users = getAllUsers();
    const normalizedKey = username.toLowerCase();
    const user = users[normalizedKey];

    if (!user) {
      return { success: false, message: "Tài khoản không tồn tại. Vui lòng kiểm tra lại hoặc Đăng ký mới!" };
    }

    const passwordHash = await hashPassword(password);
    if (user.passwordHash !== passwordHash) {
      return { success: false, message: "Mật khẩu không chính xác. Vui lòng thử lại!" };
    }

    if (!user.role || normalizedKey === "admin" || normalizedKey === "tdka") {
      user.role = (normalizedKey === "admin" || normalizedKey === "tdka") ? "admin" : (user.role || "student");
    }
    if (user.role === "admin" && (!user.unlockedSubjects || !user.unlockedSubjects.includes("all"))) {
      user.unlockedSubjects = ["all"];
    }
    users[normalizedKey] = user;
    saveAllUsers(users);

    setSession(user, remember);
    const roleTitle = user.role === "admin" ? "Quản trị viên" : "Học viên";
    return {
      success: true,
      message: `Đăng nhập thành công với vai trò ${roleTitle}!`,
      user: user
    };
  }

  /**
   * ĐỔI MẬT KHẨU
   */
  async function changePassword({ currentPassword, newPassword, confirmNewPassword }) {
    const current = getCurrentUser();
    if (!current) {
      return { success: false, message: "Bạn chưa đăng nhập!" };
    }

    if (!currentPassword) {
      return { success: false, message: "Vui lòng nhập mật khẩu hiện tại!" };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: "Mật khẩu mới phải có từ 6 ký tự trở lên!" };
    }
    if (newPassword !== confirmNewPassword) {
      return { success: false, message: "Xác nhận mật khẩu mới không trùng khớp!" };
    }

    const users = getAllUsers();
    const normalizedKey = current.username.toLowerCase();
    const user = users[normalizedKey];

    if (!user) {
      return { success: false, message: "Lỗi: Không tìm thấy tài khoản người dùng!" };
    }

    const currentHash = await hashPassword(currentPassword);
    if (user.passwordHash !== currentHash) {
      return { success: false, message: "Mật khẩu hiện tại không đúng!" };
    }

    user.passwordHash = await hashPassword(newPassword);
    saveAllUsers(users);

    return { success: true, message: "Đổi mật khẩu thành công!" };
  }

  /**
   * KÍCH HOẠT MÔN HỌC BẰNG MÃ KEY (MỖI KEY DÙNG CHO 1 TÀI KHOẢN)
   */
  async function activateLicenseKey(rawCode) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      openModal("login");
      return { success: false, message: "Vui lòng đăng nhập tài khoản để kích hoạt mã key!" };
    }

    const code = (rawCode || "").trim().toUpperCase();
    if (!code) {
      return { success: false, message: "Vui lòng nhập mã key!" };
    }

    const keys = getAllLicenseKeys();
    const keyData = keys[code];

    if (!keyData) {
      return { success: false, message: "Mã key không hợp lệ hoặc không tồn tại trong hệ thống!" };
    }

    if (keyData.isUsed) {
      return { 
        success: false, 
        message: `Mã key này đã được kích hoạt bởi tài khoản @${keyData.usedBy} vào ${new Date(keyData.usedAt).toLocaleString("vi-VN")}. Mỗi mã key chỉ sử dụng được cho 1 tài khoản duy nhất!` 
      };
    }

    const subj = getSubjectById(keyData.subjectId);
    const users = getAllUsers();
    const userObj = users[currentUser.username.toLowerCase()];

    if (!userObj) {
      return { success: false, message: "Lỗi phiên đăng nhập người dùng!" };
    }

    if (!userObj.unlockedSubjects) userObj.unlockedSubjects = [];

    // Kiểm tra xem tài khoản đã mở khóa môn này chưa
    if (userObj.unlockedSubjects.includes(keyData.subjectId) || (keyData.subjectId !== "all" && userObj.unlockedSubjects.includes("all"))) {
      return { success: false, message: `Tài khoản @${currentUser.username} đã được mở khóa môn ${subj.name} từ trước rồi!` };
    }

    // Gán mã key cho tài khoản và đánh dấu đã sử dụng
    keyData.isUsed = true;
    keyData.usedBy = currentUser.username;
    keyData.usedAt = new Date().toISOString();
    saveAllLicenseKeys(keys);

    userObj.unlockedSubjects.push(keyData.subjectId);
    saveAllUsers(users);

    setSession(userObj, true);

    // Gỡ màn hình khóa nếu đang xem môn học đó
    const lockOverlay = document.getElementById("subjectLockOverlay");
    if (lockOverlay) {
      lockOverlay.style.opacity = "0";
      setTimeout(() => lockOverlay.remove(), 250);
    }

    return { 
      success: true, 
      message: `Kích hoạt thành công! Đã mở khóa môn ${subj.name} cho tài khoản @${currentUser.username}.`,
      subject: subj 
    };
  }

  /**
   * KIỂM TRA QUYỀN TRUY CẬP MÔN HỌC TRÊN TRANG CON
   */
  function checkSubjectAccessOnPage() {
    if (!window.location.pathname.includes("/pages/")) return;

    const rawSubjId = window.CURRENT_SUBJECT_ID || "";
    if (!rawSubjId) return;

    const subj = getSubjectById(rawSubjId);
    if (!subj) return;

    const user = getCurrentUser();
    const hasAccess = hasSubjectAccess(rawSubjId);

    const existingGate = document.getElementById("subjectLockOverlay");
    if (hasAccess) {
      if (existingGate) existingGate.remove();
      return;
    }

    if (existingGate) return;

    // Hiển thị màn hình khóa
    const gateHTML = `
      <div class="subject-lock-overlay" id="subjectLockOverlay">
        <div class="subject-lock-box">
          <div class="subject-lock-icon-wrap">🔒</div>
          <h2 class="subject-lock-title">Môn ${escapeHTML(subj.name)} Đang Bị Khóa</h2>
          <p class="subject-lock-desc">
            ${user ? `Tài khoản <strong>@${escapeHTML(user.username)}</strong> chưa kích hoạt môn học này. Hãy nhập mã key bản quyền để mở khóa truy cập toàn bộ câu hỏi ôn luyện.` : `Vui lòng đăng nhập tài khoản và kích hoạt mã key để truy cập ngân hàng câu hỏi môn <strong>${escapeHTML(subj.name)}</strong>.`}
          </p>

          ${user ? `
            <div class="subject-lock-input-group">
              <input type="text" class="subject-lock-input" id="gateKeyInput" placeholder="Ví dụ: ${subj.prefix}-XXXX-XXXX" autocomplete="off">
              <button type="button" class="btn-lock-unlock" id="btnGateUnlock">Mở khóa ngay</button>
            </div>
            <div style="font-size: 12px; color: #94a3b8; margin-bottom: 12px;">* Mỗi mã key chỉ sử dụng được cho 1 tài khoản duy nhất.</div>
          ` : `
            <button type="button" class="btn-lock-unlock" id="btnGateLogin" style="width: 100%; margin-bottom: 14px;">Đăng nhập để mở khóa</button>
          `}

          <div class="subject-lock-footer">
            <a href="../index.html">← Quay lại Trang chủ</a>
          </div>
        </div>
      </div>
    `;

    const div = document.createElement("div");
    div.innerHTML = gateHTML;
    document.body.appendChild(div.firstElementChild);

    document.getElementById("btnGateLogin")?.addEventListener("click", () => openModal("login"));
    document.getElementById("btnGateUnlock")?.addEventListener("click", async () => {
      const input = document.getElementById("gateKeyInput");
      const code = input ? input.value : "";
      const res = await activateLicenseKey(code);
      if (res.success) {
        showToast(res.message, "success");
      } else {
        alert(res.message);
      }
    });

    document.getElementById("gateKeyInput")?.addEventListener("keydown", async (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        document.getElementById("btnGateUnlock")?.click();
      }
    });
  }

  /**
   * ========================================================
   * QUẢN TRỊ VIÊN: TẠO & QUẢN LÝ MÃ KEY (ADMIN KEY MANAGER)
   * ========================================================
   */
  function adminCreateLicenseKeys(subjectId, count = 1) {
    if (!isAdmin()) {
      showToast("Chỉ Quản trị viên mới có quyền tạo mã Key!", "error");
      return [];
    }

    const subj = getSubjectById(subjectId);
    const keys = getAllLicenseKeys();
    const createdList = [];

    for (let i = 0; i < count; i++) {
      let code = "";
      do {
        code = generateKeyCode(subj.prefix);
      } while (keys[code]);

      keys[code] = {
        code: code,
        subjectId: subj.id,
        isUsed: false,
        usedBy: null,
        usedAt: null,
        createdAt: new Date().toISOString()
      };
      createdList.push(code);
    }

    saveAllLicenseKeys(keys);
    showToast(`Đã tạo thành công ${count} mã key cho môn ${subj.name}!`, "success");
    renderAdminKeysTable();
    return createdList;
  }

  function adminDeleteLicenseKey(code) {
    if (!isAdmin()) {
      showToast("Chỉ Quản trị viên mới có quyền xóa mã Key!", "error");
      return false;
    }

    const keys = getAllLicenseKeys();
    if (!keys[code]) return false;

    delete keys[code];
    saveAllLicenseKeys(keys);
    showToast(`Đã xóa mã key ${code}!`, "info");
    renderAdminKeysTable();
    return true;
  }

  function setUserRole(targetUsername, newRole) {
    if (!isAdmin()) {
      showToast("Chỉ Quản trị viên mới có quyền thực hiện thao tác này!", "error");
      return false;
    }

    const currentUser = getCurrentUser();
    const normalizedKey = targetUsername.toLowerCase();
    if (currentUser.username.toLowerCase() === normalizedKey && newRole !== "admin") {
      showToast("Bạn không thể tự hạ quyền Admin của chính mình!", "error");
      return false;
    }

    const users = getAllUsers();
    if (!users[normalizedKey]) {
      showToast("Không tìm thấy tài khoản người dùng!", "error");
      return false;
    }

    users[normalizedKey].role = newRole;
    if (newRole === "admin") {
      if (!users[normalizedKey].unlockedSubjects) users[normalizedKey].unlockedSubjects = [];
      if (!users[normalizedKey].unlockedSubjects.includes("all")) users[normalizedKey].unlockedSubjects.push("all");
    }
    saveAllUsers(users);

    showToast(`Đã đổi vai trò @${targetUsername} thành ${newRole === "admin" ? "Quản trị viên" : "Học viên"}!`, "success");
    renderAdminUsersTable();
    return true;
  }

  async function adminResetPassword(targetUsername, newPassword) {
    if (!isAdmin()) {
      showToast("Chỉ Quản trị viên mới có quyền đặt lại mật khẩu!", "error");
      return false;
    }

    if (!newPassword || newPassword.length < 6) {
      showToast("Mật khẩu mới phải từ 6 ký tự trở lên!", "error");
      return false;
    }

    const users = getAllUsers();
    const normalizedKey = targetUsername.toLowerCase();
    if (!users[normalizedKey]) {
      showToast("Không tìm thấy người dùng!", "error");
      return false;
    }

    users[normalizedKey].passwordHash = await hashPassword(newPassword);
    saveAllUsers(users);

    showToast(`Đã đặt lại mật khẩu mới cho tài khoản @${targetUsername}!`, "success");
    return true;
  }

  function adminDeleteUser(targetUsername) {
    if (!isAdmin()) {
      showToast("Chỉ Quản trị viên mới có quyền xóa tài khoản!", "error");
      return false;
    }

    const currentUser = getCurrentUser();
    const normalizedKey = targetUsername.toLowerCase();
    if (currentUser.username.toLowerCase() === normalizedKey) {
      showToast("Bạn không thể tự xóa tài khoản của chính mình!", "error");
      return false;
    }

    const users = getAllUsers();
    if (!users[normalizedKey]) {
      showToast("Không tìm thấy tài khoản cần xóa!", "error");
      return false;
    }

    delete users[normalizedKey];
    saveAllUsers(users);

    showToast(`Đã xóa tài khoản @${targetUsername}!`, "info");
    renderAdminUsersTable();
    return true;
  }

  /**
   * INJECT CẤU TRÚC TẤT CẢ MODAL
   */
  function injectAuthModal() {
    if (document.getElementById("authModal")) return;

    const subjectsOptionsHTML = SUBJECTS.map(s => `<option value="${s.id}">${s.name} (${s.prefix})</option>`).join("");

    const modalHTML = `
      <!-- AUTH MODAL -->
      <div class="auth-modal-overlay" id="authModal" aria-hidden="true">
        <div class="auth-modal-card" role="dialog" aria-modal="true" aria-labelledby="authModalTitle">
          <button class="auth-modal-close" id="authModalCloseBtn" type="button" title="Đóng cửa sổ" aria-label="Đóng cửa sổ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>

          <div class="auth-modal-top">
            <div class="auth-modal-brand-badge">
              <img src="${ASSETS_PATH}" alt="KEdu Logo" class="auth-modal-logo">
            </div>
            <h3 class="auth-modal-title" id="authModalTitle">Chào mừng bạn đến với KEdu</h3>
          </div>

          <div class="auth-tabs-row" id="authTabsRow" role="tablist">
            <button class="auth-tab-btn active" id="tabBtnLogin" type="button" role="tab" aria-selected="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              <span>Đăng nhập</span>
            </button>
            <button class="auth-tab-btn" id="tabBtnRegister" type="button" role="tab" aria-selected="false">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
              <span>Đăng ký</span>
            </button>
          </div>

          <div class="auth-modal-body">
            <div class="auth-alert" id="authAlertBox" role="alert" aria-live="polite"></div>

            <!-- FORM ĐĂNG NHẬP -->
            <form id="formLogin" class="auth-form-pane active" novalidate>
              <div class="auth-field-group">
                <label class="auth-label" for="loginUsername">
                  <span>Tên tài khoản</span>
                </label>
                <div class="auth-input-wrapper">
                  <span class="auth-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </span>
                  <input type="text" id="loginUsername" class="auth-input" placeholder="Nhập tên tài khoản của bạn" autocomplete="username" spellcheck="false" required>
                </div>
              </div>

              <div class="auth-field-group">
                <label class="auth-label" for="loginPassword">
                  <span>Mật khẩu</span>
                </label>
                <div class="auth-input-wrapper">
                  <span class="auth-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </span>
                  <input type="password" id="loginPassword" class="auth-input" placeholder="Nhập mật khẩu" autocomplete="current-password" required>
                  <button type="button" class="auth-toggle-pwd" data-target="loginPassword" title="Ẩn/Hiện mật khẩu" aria-label="Ẩn/Hiện mật khẩu">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </div>
              </div>

              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; font-size: 13px;">
                <label style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; color: #475569; font-weight: 500; user-select: none;">
                  <input type="checkbox" id="loginRemember" checked style="accent-color: #dc2626; width: 16px; height: 16px; border-radius: 4px; cursor: pointer;">
                  <span>Ghi nhớ phiên đăng nhập</span>
                </label>
              </div>

              <button type="submit" class="btn-auth-submit" id="btnLoginSubmit">
                <span>Đăng nhập tài khoản</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>

              <div class="auth-form-footer">
                <span>Chưa có tài khoản?</span>
                <button type="button" class="auth-link" id="linkToRegister">Đăng ký tài khoản ngay</button>
              </div>
            </form>

            <!-- FORM ĐĂNG KÝ -->
            <form id="formRegister" class="auth-form-pane" novalidate>
              <div class="auth-field-group">
                <label class="auth-label" for="regUsername">
                  <span>Tên tài khoản <span class="auth-req">*</span></span>
                </label>
                <div class="auth-input-wrapper">
                  <span class="auth-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </span>
                  <input type="text" id="regUsername" class="auth-input" placeholder="Nhập tên tài khoản" autocomplete="username" spellcheck="false" required>
                </div>
              </div>

              <div class="auth-field-group">
                <label class="auth-label" for="regPassword">
                  <span>Mật khẩu <span class="auth-req">*</span></span>
                </label>
                <div class="auth-input-wrapper">
                  <span class="auth-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </span>
                  <input type="password" id="regPassword" class="auth-input" placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)" autocomplete="new-password" required>
                  <button type="button" class="auth-toggle-pwd" data-target="regPassword" title="Ẩn/Hiện mật khẩu" aria-label="Ẩn/Hiện mật khẩu">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </div>
                <!-- Dynamic Password Strength Meter -->
                <div class="auth-pwd-strength-wrap" id="regPwdStrengthWrap">
                  <div class="auth-pwd-strength-bars">
                    <span class="auth-pwd-bar" id="pwdBar1"></span>
                    <span class="auth-pwd-bar" id="pwdBar2"></span>
                    <span class="auth-pwd-bar" id="pwdBar3"></span>
                    <span class="auth-pwd-bar" id="pwdBar4"></span>
                  </div>
                  <div class="auth-pwd-strength-status">
                    <span class="auth-pwd-status-text" id="regPwdStatusText">Độ mạnh mật khẩu</span>
                    <span class="auth-pwd-hint-mini">Tối thiểu 6 ký tự</span>
                  </div>
                </div>
              </div>

              <div class="auth-field-group">
                <label class="auth-label" for="regConfirmPassword">
                  <span>Xác nhận mật khẩu <span class="auth-req">*</span></span>
                </label>
                <div class="auth-input-wrapper">
                  <span class="auth-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  <input type="password" id="regConfirmPassword" class="auth-input" placeholder="Nhập lại mật khẩu" autocomplete="new-password" required>
                  <button type="button" class="auth-toggle-pwd" data-target="regConfirmPassword" title="Ẩn/Hiện mật khẩu" aria-label="Ẩn/Hiện mật khẩu">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </div>
                <span class="auth-pwd-match-text" id="regPwdMatchNotice"></span>
              </div>

              <button type="submit" class="btn-auth-submit" id="btnRegisterSubmit">
                <span>Tạo tài khoản học viên</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>

              <div class="auth-form-footer">
                <span>Đã có tài khoản?</span>
                <button type="button" class="auth-link" id="linkToLogin">Đăng nhập</button>
              </div>
            </form>

            <!-- FORM ĐỔI MẬT KHẨU -->
            <form id="formChangePassword" class="auth-form-pane" novalidate>
              <div class="auth-field-group">
                <label class="auth-label" for="changeOldPassword">
                  <span>Mật khẩu hiện tại <span class="auth-req">*</span></span>
                </label>
                <div class="auth-input-wrapper">
                  <span class="auth-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </span>
                  <input type="password" id="changeOldPassword" class="auth-input" placeholder="Nhập mật khẩu hiện tại" autocomplete="current-password" required>
                </div>
              </div>

              <div class="auth-field-group">
                <label class="auth-label" for="changeNewPassword">
                  <span>Mật khẩu mới <span class="auth-req">*</span></span>
                </label>
                <div class="auth-input-wrapper">
                  <span class="auth-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </span>
                  <input type="password" id="changeNewPassword" class="auth-input" placeholder="Mật khẩu mới (ít nhất 6 ký tự)" autocomplete="new-password" required>
                </div>
              </div>

              <div class="auth-field-group">
                <label class="auth-label" for="changeConfirmNewPassword">
                  <span>Xác nhận mật khẩu mới <span class="auth-req">*</span></span>
                </label>
                <div class="auth-input-wrapper">
                  <span class="auth-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  <input type="password" id="changeConfirmNewPassword" class="auth-input" placeholder="Nhập lại mật khẩu mới" autocomplete="new-password" required>
                </div>
              </div>

              <button type="submit" class="btn-auth-submit" id="btnChangePasswordSubmit">
                <span>Cập nhật mật khẩu</span>
              </button>

              <div class="auth-form-footer">
                <button type="button" class="auth-link" id="linkCancelChangePwd">Quay lại</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- MODAL KÍCH HOẠT MÔN HỌC BẰNG KEY DÀNH CHO USER -->
      <div class="auth-modal-overlay" id="activateKeyModal" aria-hidden="true">
        <div class="auth-modal-card" role="dialog" aria-modal="true" style="max-width: 440px;">
          <button class="auth-modal-close" id="activateKeyModalCloseBtn" type="button" title="Đóng cửa sổ" aria-label="Đóng cửa sổ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>

          <div class="auth-modal-top">
            <div class="auth-modal-brand-badge" style="background: #fffbeb; border-color: #fde68a;">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.2"><path d="M21 2l-2 2m-1.5 1.5L14 9l-1.5-1.5L11 9l-1.5-1.5L8 9l-4.5 4.5a3 3 0 1 0 4.24 4.24L12 13.5l1.5 1.5 1.5-1.5 1.5 1.5 3.5-3.5a3 3 0 0 0-4.24-4.24z"/></svg>
            </div>
            <h3 class="auth-modal-title">Kích Hoạt Bản Quyền Môn Học</h3>
            <p class="auth-modal-subtitle">Nhập mã key bản quyền để mở khóa truy cập môn học trên tài khoản của bạn</p>
          </div>

          <div class="auth-modal-body">
            <form id="formActivateKey" novalidate>
              <div class="auth-field-group">
                <label class="auth-label" for="inputLicenseKey">
                  <span>Mã Key kích hoạt</span>
                </label>
                <div class="auth-input-wrapper">
                  <span class="auth-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-1.5 1.5L14 9l-1.5-1.5L11 9l-1.5-1.5L8 9l-4.5 4.5a3 3 0 1 0 4.24 4.24L12 13.5l1.5 1.5 1.5-1.5 1.5 1.5 3.5-3.5a3 3 0 0 0-4.24-4.24z"/></svg>
                  </span>
                  <input type="text" id="inputLicenseKey" class="auth-input" placeholder="Ví dụ: TOAN-XXXX-XXXX" style="font-family: monospace; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;" required>
                </div>
                <span class="auth-field-hint">Mỗi mã key chỉ kích hoạt được cho 01 tài khoản học viên duy nhất.</span>
              </div>

              <button type="submit" class="btn-auth-submit" id="btnSubmitActivateKey">
                <span>Kích hoạt môn học ngay</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </form>
          </div>
        </div>
      </div>

      <!-- ADMIN PANEL MODAL (NGƯỜI DÙNG & MÃ KEY) -->
      <div class="auth-modal-overlay" id="adminModal" aria-hidden="true">
        <div class="auth-modal-card admin-modal-card" role="dialog" aria-modal="true">
          <button class="auth-modal-close" id="adminModalCloseBtn" type="button" title="Đóng cửa sổ" aria-label="Đóng cửa sổ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>

          <div class="auth-modal-top" style="text-align: left; padding: 22px 24px; border-bottom: 1px solid #e2e8f0;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 44px; height: 44px; border-radius: 12px; background: #fffbeb; border: 1.5px solid #fde68a; display: flex; align-items: center; justify-content: center; color: #d97706; flex-shrink: 0; box-shadow: 0 2px 8px rgba(217, 119, 6, 0.15);">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>
              </div>
              <div>
                <h3 class="auth-modal-title" style="font-size: 19px; margin-bottom: 2px;">Bảng Quản Trị Hệ Thống (Admin Panel)</h3>
                <p class="auth-modal-subtitle">Phân quyền học viên & Quản lý phát hành Mã Key bản quyền theo môn</p>
              </div>
            </div>
          </div>

          <div class="auth-modal-body" style="padding: 18px 24px 24px;">
            <!-- Tabs -->
            <div class="admin-tab-nav">
              <button type="button" class="admin-tab-link active" id="tabAdminUsers">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <span>Quản lý Người dùng</span>
              </button>
              <button type="button" class="admin-tab-link" id="tabAdminKeys">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-1.5 1.5L14 9l-1.5-1.5L11 9l-1.5-1.5L8 9l-4.5 4.5a3 3 0 1 0 4.24 4.24L12 13.5l1.5 1.5 1.5-1.5 1.5 1.5 3.5-3.5a3 3 0 0 0-4.24-4.24z"/></svg>
                <span>Quản lý Mã Key</span>
              </button>
            </div>

            <!-- PANE 1: USERS -->
            <div id="paneAdminUsers">
              <div class="admin-stats-row">
                <div class="admin-stat-box">
                  <span class="admin-stat-num" id="statTotalUsers">0</span>
                  <span class="admin-stat-label">Tổng người dùng</span>
                </div>
                <div class="admin-stat-box">
                  <span class="admin-stat-num" id="statAdminUsers" style="color: #b45309;">0</span>
                  <span class="admin-stat-label">Quản trị viên</span>
                </div>
                <div class="admin-stat-box">
                  <span class="admin-stat-num" id="statStudentUsers" style="color: #2563eb;">0</span>
                  <span class="admin-stat-label">Học viên</span>
                </div>
              </div>

              <div class="admin-toolbar">
                <input type="text" class="admin-search-input" id="adminSearchInput" placeholder="🔍 Tìm kiếm theo tên tài khoản...">
                <button type="button" class="btn-admin-add" id="btnAdminCreateUser">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  <span>Tạo tài khoản mới</span>
                </button>
              </div>

              <div class="admin-table-wrap">
                <table class="admin-table">
                  <thead>
                    <tr>
                      <th>Tên tài khoản</th>
                      <th>Vai trò</th>
                      <th>Môn đã mở khóa</th>
                      <th style="text-align: right;">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody id="adminUsersTableBody"></tbody>
                </table>
              </div>
            </div>

            <!-- PANE 2: KEYS -->
            <div id="paneAdminKeys" style="display: none;">
              <!-- Key Gen Form -->
              <div class="admin-key-gen-bar">
                <div style="font-weight: 700; font-size: 13px; color: #1e293b;">Tạo mã Key mới:</div>
                <select id="selAdminKeySubject" class="admin-select">
                  ${subjectsOptionsHTML}
                </select>
                <select id="selAdminKeyCount" class="admin-select" style="width: 100px;">
                  <option value="1">1 Key</option>
                  <option value="3">3 Key</option>
                  <option value="5">5 Key</option>
                  <option value="10">10 Key</option>
                </select>
                <button type="button" class="btn-admin-add" id="btnAdminGenKeys" style="background: #d97706;">
                  <span>+ Tạo mã Key</span>
                </button>
              </div>

              <div class="admin-toolbar">
                <input type="text" class="admin-search-input" id="adminSearchKeyInput" placeholder="🔍 Tìm kiếm theo mã key hoặc tài khoản...">
              </div>

              <div class="admin-table-wrap">
                <table class="admin-table">
                  <thead>
                    <tr>
                      <th>Mã Key</th>
                      <th>Môn học</th>
                      <th>Trạng thái</th>
                      <th>Người kích hoạt</th>
                      <th style="text-align: right;">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody id="adminKeysTableBody"></tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const div = document.createElement("div");
    div.innerHTML = modalHTML;
    while (div.firstChild) {
      document.body.appendChild(div.firstChild);
    }

    bindModalEvents();
  }

  /**
   * BIND SỰ KIỆN CHO FORM VÀ MODAL
   */
  function bindModalEvents() {
    const modal = document.getElementById("authModal");
    const closeBtn = document.getElementById("authModalCloseBtn");
    const tabLogin = document.getElementById("tabBtnLogin");
    const tabRegister = document.getElementById("tabBtnRegister");
    const tabsRow = document.getElementById("authTabsRow");
    const titleEl = document.getElementById("authModalTitle");

    const formLogin = document.getElementById("formLogin");
    const formRegister = document.getElementById("formRegister");
    const formChangePassword = document.getElementById("formChangePassword");
    const alertBox = document.getElementById("authAlertBox");

    const linkToRegister = document.getElementById("linkToRegister");
    const linkToLogin = document.getElementById("linkToLogin");
    const linkCancelChangePwd = document.getElementById("linkCancelChangePwd");

    // Admin Modal elements
    const adminModal = document.getElementById("adminModal");
    const adminModalCloseBtn = document.getElementById("adminModalCloseBtn");
    const adminSearchInput = document.getElementById("adminSearchInput");
    const adminSearchKeyInput = document.getElementById("adminSearchKeyInput");
    const btnAdminCreateUser = document.getElementById("btnAdminCreateUser");
    const tabAdminUsers = document.getElementById("tabAdminUsers");
    const tabAdminKeys = document.getElementById("tabAdminKeys");
    const paneAdminUsers = document.getElementById("paneAdminUsers");
    const paneAdminKeys = document.getElementById("paneAdminKeys");
    const btnAdminGenKeys = document.getElementById("btnAdminGenKeys");

    // Activate Key Modal
    const activateKeyModal = document.getElementById("activateKeyModal");
    const activateKeyModalCloseBtn = document.getElementById("activateKeyModalCloseBtn");
    const formActivateKey = document.getElementById("formActivateKey");

    function showAlert(msg, type = "error") {
      alertBox.className = `auth-alert show ${type === "success" ? "alert-success" : "alert-error"}`;
      alertBox.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="flex-shrink:0;">
          ${type === "success" 
            ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>' 
            : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'}
        </svg>
        <span>${escapeHTML(msg)}</span>
      `;
    }

    function hideAlert() {
      alertBox.className = "auth-alert";
      alertBox.innerHTML = "";
    }

    function setBtnLoading(btn, isLoading, loadingText = "Đang xử lý...") {
      if (!btn) return;
      if (isLoading) {
        btn.dataset.originalHtml = btn.innerHTML;
        btn.disabled = true;
        btn.classList.add("is-loading");
        btn.innerHTML = `<span class="auth-btn-spinner" aria-hidden="true"></span><span>${escapeHTML(loadingText)}</span>`;
      } else {
        btn.disabled = false;
        btn.classList.remove("is-loading");
        if (btn.dataset.originalHtml) {
          btn.innerHTML = btn.dataset.originalHtml;
        }
      }
    }

    // Dynamic Password Strength & Match Checking
    const regPwdInput = document.getElementById("regPassword");
    const regConfirmPwdInput = document.getElementById("regConfirmPassword");
    const pwdBar1 = document.getElementById("pwdBar1");
    const pwdBar2 = document.getElementById("pwdBar2");
    const pwdBar3 = document.getElementById("pwdBar3");
    const pwdBar4 = document.getElementById("pwdBar4");
    const regPwdStatusText = document.getElementById("regPwdStatusText");
    const regPwdMatchNotice = document.getElementById("regPwdMatchNotice");

    function updatePwdStrength() {
      if (!regPwdInput) return;
      const val = regPwdInput.value || "";
      const bars = [pwdBar1, pwdBar2, pwdBar3, pwdBar4];
      if (!val) {
        bars.forEach(b => { if (b) b.className = "auth-pwd-bar"; });
        if (regPwdStatusText) {
          regPwdStatusText.textContent = "Độ mạnh mật khẩu";
          regPwdStatusText.style.color = "#64748b";
        }
        return;
      }

      let score = 0;
      if (val.length >= 6) score++;
      if (val.length >= 8) score++;
      if (/[0-9]/.test(val) && /[a-zA-Z]/.test(val)) score++;
      if (/[^a-zA-Z0-9]/.test(val) || (val.length >= 10 && /[A-Z]/.test(val))) score++;

      bars.forEach((b, idx) => {
        if (!b) return;
        b.className = "auth-pwd-bar";
        if (idx < score) {
          if (score === 1) b.classList.add("bar-weak");
          else if (score === 2) b.classList.add("bar-fair");
          else if (score === 3) b.classList.add("bar-good");
          else b.classList.add("bar-strong");
        }
      });

      if (regPwdStatusText) {
        if (score === 1) {
          regPwdStatusText.textContent = "Mật khẩu yếu";
          regPwdStatusText.style.color = "#ef4444";
        } else if (score === 2) {
          regPwdStatusText.textContent = "Mật khẩu trung bình";
          regPwdStatusText.style.color = "#f97316";
        } else if (score === 3) {
          regPwdStatusText.textContent = "Mật khẩu khá tốt";
          regPwdStatusText.style.color = "#eab308";
        } else {
          regPwdStatusText.textContent = "Mật khẩu rất mạnh & an toàn";
          regPwdStatusText.style.color = "#10b981";
        }
      }
    }

    function checkPwdMatch() {
      if (!regConfirmPwdInput || !regPwdMatchNotice) return;
      const p1 = regPwdInput ? regPwdInput.value : "";
      const p2 = regConfirmPwdInput.value;
      if (!p2) {
        regPwdMatchNotice.textContent = "";
        regPwdMatchNotice.className = "auth-pwd-match-text";
        return;
      }
      if (p1 === p2) {
        regPwdMatchNotice.textContent = "✓ Mật khẩu xác nhận khớp";
        regPwdMatchNotice.className = "auth-pwd-match-text match-ok";
      } else {
        regPwdMatchNotice.textContent = "✕ Mật khẩu xác nhận chưa khớp";
        regPwdMatchNotice.className = "auth-pwd-match-text match-error";
      }
    }

    regPwdInput?.addEventListener("input", () => {
      updatePwdStrength();
      checkPwdMatch();
    });
    regConfirmPwdInput?.addEventListener("input", checkPwdMatch);

    function switchTab(tab) {
      hideAlert();
      tabsRow.style.display = "grid";
      if (tab === "login") {
        tabLogin.classList.add("active");
        tabRegister.classList.remove("active");
        tabLogin.setAttribute("aria-selected", "true");
        tabRegister.setAttribute("aria-selected", "false");
        formLogin.classList.add("active");
        formRegister.classList.remove("active");
        formChangePassword.classList.remove("active");
        titleEl.textContent = "Đăng nhập tài khoản KEdu";
        setTimeout(() => document.getElementById("loginUsername")?.focus(), 100);
      } else if (tab === "register") {
        tabLogin.classList.remove("active");
        tabRegister.classList.add("active");
        tabLogin.setAttribute("aria-selected", "false");
        tabRegister.setAttribute("aria-selected", "true");
        formLogin.classList.remove("active");
        formRegister.classList.add("active");
        formChangePassword.classList.remove("active");
        titleEl.textContent = "Tạo tài khoản học viên mới";
        setTimeout(() => document.getElementById("regUsername")?.focus(), 100);
      } else if (tab === "changePassword") {
        tabsRow.style.display = "none";
        formLogin.classList.remove("active");
        formRegister.classList.remove("active");
        formChangePassword.classList.add("active");
        titleEl.textContent = "Đổi mật khẩu tài khoản";
        setTimeout(() => document.getElementById("changeOldPassword")?.focus(), 100);
      }
    }

    tabLogin.addEventListener("click", () => switchTab("login"));
    tabRegister.addEventListener("click", () => switchTab("register"));
    linkToRegister.addEventListener("click", () => switchTab("register"));
    linkToLogin.addEventListener("click", () => switchTab("login"));
    if (linkCancelChangePwd) {
      linkCancelChangePwd.addEventListener("click", () => closeModal());
    }

    // Toggle password eye button
    document.querySelectorAll(".auth-toggle-pwd").forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetId = btn.getAttribute("data-target");
        const input = document.getElementById(targetId);
        if (!input) return;
        if (input.type === "password") {
          input.type = "text";
          btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
        } else {
          input.type = "password";
          btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
        }
      });
    });

    closeBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    if (adminModalCloseBtn && adminModal) {
      adminModalCloseBtn.addEventListener("click", closeAdminPanel);
      adminModal.addEventListener("click", (e) => {
        if (e.target === adminModal) closeAdminPanel();
      });
    }

    if (activateKeyModalCloseBtn && activateKeyModal) {
      activateKeyModalCloseBtn.addEventListener("click", closeActivateKeyModal);
      activateKeyModal.addEventListener("click", (e) => {
        if (e.target === activateKeyModal) closeActivateKeyModal();
      });
    }

    // Switch Admin Tabs (Users vs Keys)
    tabAdminUsers?.addEventListener("click", () => {
      tabAdminUsers.classList.add("active");
      tabAdminKeys.classList.remove("active");
      paneAdminUsers.style.display = "block";
      paneAdminKeys.style.display = "none";
      renderAdminUsersTable();
    });

    tabAdminKeys?.addEventListener("click", () => {
      tabAdminKeys.classList.add("active");
      tabAdminUsers.classList.remove("active");
      paneAdminUsers.style.display = "none";
      paneAdminKeys.style.display = "block";
      renderAdminKeysTable();
    });

    // Admin Gen Keys
    btnAdminGenKeys?.addEventListener("click", () => {
      const selSubj = document.getElementById("selAdminKeySubject")?.value || "toan";
      const selCount = parseInt(document.getElementById("selAdminKeyCount")?.value || "1", 10);
      adminCreateLicenseKeys(selSubj, selCount);
    });

    adminSearchInput?.addEventListener("input", (e) => {
      renderAdminUsersTable(e.target.value);
    });

    adminSearchKeyInput?.addEventListener("input", (e) => {
      renderAdminKeysTable(e.target.value);
    });

    btnAdminCreateUser?.addEventListener("click", promptAdminCreateUser);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (modal.classList.contains("active")) closeModal();
        if (adminModal && adminModal.classList.contains("active")) closeAdminPanel();
        if (activateKeyModal && activateKeyModal.classList.contains("active")) closeActivateKeyModal();
      }
    });

    // Submit ĐĂNG NHẬP
    formLogin.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideAlert();
      const submitBtn = document.getElementById("btnLoginSubmit");
      setBtnLoading(submitBtn, true, "Đang đăng nhập...");

      const username = document.getElementById("loginUsername").value;
      const password = document.getElementById("loginPassword").value;
      const remember = document.getElementById("loginRemember").checked;

      const res = await login({ username, password, remember });
      setBtnLoading(submitBtn, false);

      if (!res.success) {
        showAlert(res.message, "error");
      } else {
        showAlert(res.message, "success");
        showToast(res.message, "success");
        setTimeout(() => closeModal(), 600);
      }
    });

    // Submit ĐĂNG KÝ
    formRegister.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideAlert();
      const submitBtn = document.getElementById("btnRegisterSubmit");
      setBtnLoading(submitBtn, true, "Đang tạo tài khoản...");

      const username = document.getElementById("regUsername").value;
      const password = document.getElementById("regPassword").value;
      const confirmPassword = document.getElementById("regConfirmPassword").value;

      const res = await register({ username, password, confirmPassword });
      setBtnLoading(submitBtn, false);

      if (!res.success) {
        showAlert(res.message, "error");
      } else {
        showAlert(res.message, "success");
        showToast(res.message, "success");
        setTimeout(() => closeModal(), 800);
      }
    });

    // Submit ĐỔI MẬT KHẨU
    formChangePassword.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideAlert();
      const submitBtn = document.getElementById("btnChangePasswordSubmit");
      setBtnLoading(submitBtn, true, "Đang cập nhật...");

      const currentPassword = document.getElementById("changeOldPassword").value;
      const newPassword = document.getElementById("changeNewPassword").value;
      const confirmNewPassword = document.getElementById("changeConfirmNewPassword").value;

      const res = await changePassword({ currentPassword, newPassword, confirmNewPassword });
      setBtnLoading(submitBtn, false);

      if (!res.success) {
        showAlert(res.message, "error");
      } else {
        showAlert(res.message, "success");
        showToast("Đổi mật khẩu thành công!", "success");
        setTimeout(() => closeModal(), 800);
      }
    });

    // Submit KÍCH HOẠT KEY
    formActivateKey?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById("btnSubmitActivateKey");
      setBtnLoading(submitBtn, true, "Đang kích hoạt...");

      const input = document.getElementById("inputLicenseKey");
      const code = input ? input.value : "";
      const res = await activateLicenseKey(code);
      setBtnLoading(submitBtn, false);

      if (!res.success) {
        alert(res.message);
      } else {
        showToast(res.message, "success");
        closeActivateKeyModal();
      }
    });
  }

  function openModal(tab = "login") {
    injectAuthModal();
    const modal = document.getElementById("authModal");
    if (!modal) return;
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");

    const tabLogin = document.getElementById("tabBtnLogin");
    const tabRegister = document.getElementById("tabBtnRegister");
    const tabsRow = document.getElementById("authTabsRow");
    const formLogin = document.getElementById("formLogin");
    const formRegister = document.getElementById("formRegister");
    const formChangePassword = document.getElementById("formChangePassword");
    const titleEl = document.getElementById("authModalTitle");
    const alertBox = document.getElementById("authAlertBox");

    alertBox.className = "auth-alert";
    alertBox.innerHTML = "";

    // Reset password strength bars
    const bars = [document.getElementById("pwdBar1"), document.getElementById("pwdBar2"), document.getElementById("pwdBar3"), document.getElementById("pwdBar4")];
    bars.forEach(b => { if (b) b.className = "auth-pwd-bar"; });
    const regPwdStatusText = document.getElementById("regPwdStatusText");
    if (regPwdStatusText) {
      regPwdStatusText.textContent = "Độ mạnh mật khẩu";
      regPwdStatusText.style.color = "#64748b";
    }
    const regPwdMatchNotice = document.getElementById("regPwdMatchNotice");
    if (regPwdMatchNotice) {
      regPwdMatchNotice.textContent = "";
      regPwdMatchNotice.className = "auth-pwd-match-text";
    }

    if (tab === "register") {
      tabsRow.style.display = "grid";
      tabLogin.classList.remove("active");
      tabRegister.classList.add("active");
      tabLogin.setAttribute("aria-selected", "false");
      tabRegister.setAttribute("aria-selected", "true");
      formLogin.classList.remove("active");
      formRegister.classList.add("active");
      formChangePassword.classList.remove("active");
      titleEl.textContent = "Tạo tài khoản học viên mới";
      setTimeout(() => document.getElementById("regUsername")?.focus(), 150);
    } else if (tab === "changePassword") {
      tabsRow.style.display = "none";
      formLogin.classList.remove("active");
      formRegister.classList.remove("active");
      formChangePassword.classList.add("active");
      titleEl.textContent = "Đổi mật khẩu tài khoản";
      setTimeout(() => document.getElementById("changeOldPassword")?.focus(), 150);
    } else {
      tabsRow.style.display = "grid";
      tabLogin.classList.add("active");
      tabRegister.classList.remove("active");
      tabLogin.setAttribute("aria-selected", "true");
      tabRegister.setAttribute("aria-selected", "false");
      formLogin.classList.add("active");
      formRegister.classList.remove("active");
      formChangePassword.classList.remove("active");
      titleEl.textContent = "Đăng nhập tài khoản KEdu";
      setTimeout(() => document.getElementById("loginUsername")?.focus(), 150);
    }
  }

  function closeModal() {
    const modal = document.getElementById("authModal");
    if (!modal) return;
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
  }

  function openActivateKeyModal() {
    injectAuthModal();
    const modal = document.getElementById("activateKeyModal");
    if (!modal) return;
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    const input = document.getElementById("inputLicenseKey");
    if (input) {
      input.value = "";
      setTimeout(() => input.focus(), 150);
    }
  }

  function closeActivateKeyModal() {
    const modal = document.getElementById("activateKeyModal");
    if (!modal) return;
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
  }

  /**
   * ADMIN PANEL MODAL CONTROLS
   */
  function openAdminPanel() {
    if (!isAdmin()) {
      showToast("Chỉ Quản trị viên mới có quyền mở Bảng quản trị!", "error");
      return;
    }
    injectAuthModal();
    const adminModal = document.getElementById("adminModal");
    if (!adminModal) return;

    renderAdminUsersTable();
    renderAdminKeysTable();
    adminModal.classList.add("active");
    adminModal.setAttribute("aria-hidden", "false");
  }

  function closeAdminPanel() {
    const adminModal = document.getElementById("adminModal");
    if (!adminModal) return;
    adminModal.classList.remove("active");
    adminModal.setAttribute("aria-hidden", "true");
  }

  function renderAdminUsersTable(keyword = "") {
    const tbody = document.getElementById("adminUsersTableBody");
    if (!tbody) return;

    const users = getAllUsers();
    const currentUser = getCurrentUser();
    const userKeys = Object.keys(users);

    let total = userKeys.length;
    let adminCount = 0;
    let studentCount = 0;

    userKeys.forEach((k) => {
      const u = users[k];
      if (u.role === "admin") adminCount++;
      else studentCount++;
    });

    const elTotal = document.getElementById("statTotalUsers");
    const elAdmin = document.getElementById("statAdminUsers");
    const elStudent = document.getElementById("statStudentUsers");
    if (elTotal) elTotal.textContent = total;
    if (elAdmin) elAdmin.textContent = adminCount;
    if (elStudent) elStudent.textContent = studentCount;

    const kw = (keyword || "").toLowerCase().trim();
    const filteredKeys = userKeys.filter((k) => {
      const u = users[k];
      return u.username.toLowerCase().includes(kw);
    });

    if (filteredKeys.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 24px; color: #94a3b8;">Không tìm thấy tài khoản nào phù hợp</td></tr>`;
      return;
    }

    tbody.innerHTML = filteredKeys
      .map((k) => {
        const u = users[k];
        const isMe = currentUser && currentUser.username.toLowerCase() === u.username.toLowerCase();
        const isAdminRole = u.role === "admin";
        const unlockedList = (u.unlockedSubjects && u.unlockedSubjects.length > 0)
          ? u.unlockedSubjects.map(s => {
              const sub = getSubjectById(s);
              return `<span style="font-size:10px; background:#eff6ff; color:#2563eb; padding:2px 5px; border-radius:4px; margin-right:4px;">${sub ? sub.name : s}</span>`;
            }).join("")
          : `<span style="font-size:11px; color:#94a3b8;">Chưa mở khóa môn nào</span>`;

        return `
          <tr>
            <td>
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-weight:700; color: #1e293b;">@${escapeHTML(u.username)}</span>
                ${isMe ? '<span style="font-size:10px; background:#eff6ff; color:#2563eb; padding:1px 5px; border-radius:4px; font-weight:700;">(Bạn)</span>' : ''}
              </div>
            </td>
            <td>
              <span class="user-role-badge ${isAdminRole ? 'role-admin' : 'role-student'}">
                ${isAdminRole ? '👑 Quản trị viên' : '🎓 Học viên'}
              </span>
            </td>
            <td>
              <div style="display:flex; flex-wrap:wrap; gap:3px;">
                ${isAdminRole ? '<span style="font-size:11px; color:#b45309; font-weight:700;">Toàn quyền (Tất cả môn)</span>' : unlockedList}
              </div>
            </td>
            <td style="text-align: right;">
              <div class="admin-table-actions" style="justify-content: flex-end;">
                <button type="button" class="btn-table-action btn-action-role" data-user="${escapeHTML(u.username)}" data-current-role="${u.role || 'student'}" ${isMe ? 'disabled style="opacity:0.4; cursor:not-allowed;" title="Không thể tự đổi quyền của chính mình"' : 'title="Đổi quyền"'}>
                  ${isAdminRole ? 'Hạ quyền' : 'Cấp Admin'}
                </button>
                <button type="button" class="btn-table-action btn-action-reset" data-user="${escapeHTML(u.username)}" title="Đặt lại mật khẩu">
                  Mật khẩu
                </button>
                ${!isMe ? `
                  <button type="button" class="btn-table-action btn-action-delete" data-user="${escapeHTML(u.username)}" title="Xóa tài khoản">
                    Xóa
                  </button>
                ` : ''}
              </div>
            </td>
          </tr>
        `;
      })
      .join("");

    tbody.querySelectorAll(".btn-action-role").forEach((btn) => {
      btn.addEventListener("click", () => {
        const uName = btn.getAttribute("data-user");
        const curRole = btn.getAttribute("data-current-role");
        const targetRole = curRole === "admin" ? "student" : "admin";
        const confirmMsg = targetRole === "admin" 
          ? `Bạn có chắc chắn muốn cấp quyền Quản trị viên (Admin) cho @${uName}?`
          : `Bạn có chắc muốn hạ quyền tài khoản @${uName} xuống Học viên?`;
        if (confirm(confirmMsg)) {
          setUserRole(uName, targetRole);
        }
      });
    });

    tbody.querySelectorAll(".btn-action-reset").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const uName = btn.getAttribute("data-user");
        const newPass = prompt(`Nhập mật khẩu mới cho tài khoản @${uName} (tối thiểu 6 ký tự):`);
        if (newPass !== null) {
          if (newPass.length < 6) {
            alert("Mật khẩu phải từ 6 ký tự trở lên!");
            return;
          }
          await adminResetPassword(uName, newPass);
        }
      });
    });

    tbody.querySelectorAll(".btn-action-delete").forEach((btn) => {
      btn.addEventListener("click", () => {
        const uName = btn.getAttribute("data-user");
        if (confirm(`CẢNH BÁO: Bạn có chắc chắn muốn xóa tài khoản @${uName}? Thao tác này không thể hoàn tác!`)) {
          adminDeleteUser(uName);
        }
      });
    });
  }

  function renderAdminKeysTable(keyword = "") {
    const tbody = document.getElementById("adminKeysTableBody");
    if (!tbody) return;

    const keys = getAllLicenseKeys();
    const keyCodes = Object.keys(keys).reverse(); // Mới nhất lên đầu
    const kw = (keyword || "").toLowerCase().trim();

    const filtered = keyCodes.filter(c => {
      const k = keys[c];
      return c.toLowerCase().includes(kw) || (k.usedBy && k.usedBy.toLowerCase().includes(kw)) || k.subjectId.toLowerCase().includes(kw);
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 24px; color: #94a3b8;">Chưa có mã key nào hoặc không tìm thấy kết quả phù hợp</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(c => {
      const k = keys[c];
      const subj = getSubjectById(k.subjectId);
      const isUsed = k.isUsed;

      return `
        <tr>
          <td>
            <span class="key-code-badge">${escapeHTML(k.code)}</span>
          </td>
          <td>
            <span style="font-weight: 600; color: #1e293b;">${escapeHTML(subj.name)}</span>
          </td>
          <td>
            <span class="key-status-pill ${isUsed ? 'key-status-used' : 'key-status-unused'}">
              ${isUsed ? '● Đã kích hoạt' : '● Chưa sử dụng'}
            </span>
          </td>
          <td>
            ${isUsed ? `
              <div style="font-size: 12px;">
                <strong style="color: #2563eb;">@${escapeHTML(k.usedBy)}</strong>
                <div style="color: #64748b; font-size: 11px;">${new Date(k.usedAt).toLocaleDateString("vi-VN")}</div>
              </div>
            ` : '<span style="color: #94a3b8; font-size: 12px;">—</span>'}
          </td>
          <td style="text-align: right;">
            <div class="admin-table-actions" style="justify-content: flex-end;">
              <button type="button" class="btn-table-action btn-action-role btn-copy-key" data-code="${escapeHTML(k.code)}" title="Sao chép mã Key">
                📋 Copy
              </button>
              <button type="button" class="btn-table-action btn-action-delete btn-del-key" data-code="${escapeHTML(k.code)}" title="Xóa mã Key">
                Xóa
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    tbody.querySelectorAll(".btn-copy-key").forEach(btn => {
      btn.addEventListener("click", () => {
        const code = btn.getAttribute("data-code");
        navigator.clipboard.writeText(code).then(() => {
          showToast(`Đã sao chép mã: ${code}`, "success");
        }).catch(() => {
          prompt("Mã key của bạn:", code);
        });
      });
    });

    tbody.querySelectorAll(".btn-del-key").forEach(btn => {
      btn.addEventListener("click", () => {
        const code = btn.getAttribute("data-code");
        if (confirm(`Bạn có chắc chắn muốn xóa mã key ${code}?`)) {
          adminDeleteLicenseKey(code);
        }
      });
    });
  }

  async function promptAdminCreateUser() {
    const username = prompt("Nhập tên tài khoản cần tạo:");
    if (!username || !username.trim()) return;
    const password = prompt("Nhập mật khẩu cho tài khoản (tối thiểu 6 ký tự):");
    if (!password || password.length < 6) {
      alert("Mật khẩu phải từ 6 ký tự trở lên!");
      return;
    }
    const roleChoice = confirm("Bấm OK để cấp quyền QUẢN TRỊ VIÊN (Admin)\nBấm Hủy (Cancel) để tạo tài khoản HỌC VIÊN.");
    const role = roleChoice ? "admin" : "student";

    const users = getAllUsers();
    const normalizedKey = username.trim().toLowerCase();
    if (users[normalizedKey]) {
      alert("Tên tài khoản này đã tồn tại!");
      return;
    }

    const passwordHash = await hashPassword(password);
    users[normalizedKey] = {
      username: username.trim(),
      fullName: username.trim(),
      role: role,
      passwordHash: passwordHash,
      unlockedSubjects: role === "admin" ? ["all"] : [],
      createdAt: new Date().toISOString()
    };
    saveAllUsers(users);

    showToast(`Đã tạo thành công tài khoản @${username.trim()} (${role === "admin" ? "Quản trị viên" : "Học viên"})!`, "success");
    renderAdminUsersTable();
  }

  /**
   * RENDER NÚT ĐĂNG NHẬP / THÔNG TIN TÀI KHOẢN TRÊN HEADER
   */
  function renderHeaderAuthUI() {
    let authSlot = document.getElementById("shAuthSlot");
    if (!authSlot) {
      const targetNav = document.querySelector(".sh-inner") || document.querySelector(".header-inner") || document.querySelector(".sh-nav");
      if (!targetNav) return;
      authSlot = document.createElement("div");
      authSlot.id = "shAuthSlot";
      authSlot.className = "sh-auth-container";
      targetNav.appendChild(authSlot);
    }

    const currentUser = getCurrentUser();

    if (!currentUser) {
      // Chưa đăng nhập: Hiện nút Đăng nhập & Đăng ký
      authSlot.innerHTML = `
        <button type="button" class="btn-auth btn-auth-login" id="btnNavLogin" title="Đăng nhập">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
          <span>Đăng nhập</span>
        </button>
        <button type="button" class="btn-auth btn-auth-register" id="btnNavRegister" title="Đăng ký tài khoản">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
          <span>Đăng ký</span>
        </button>
      `;

      document.getElementById("btnNavLogin")?.addEventListener("click", () => openModal("login"));
      document.getElementById("btnNavRegister")?.addEventListener("click", () => openModal("register"));
    } else {
      // Đã đăng nhập
      const userIsAdmin = currentUser.role === "admin";
      const initial = userIsAdmin ? "👑" : (currentUser.username).charAt(0).toUpperCase();
      const displayName = currentUser.username;

      authSlot.innerHTML = `
        <div class="user-menu-wrapper" id="userMenuWrapper">
          <button type="button" class="user-profile-btn" id="userProfileBtn" title="Tài khoản cá nhân: @${escapeHTML(currentUser.username)}" aria-expanded="false">
            <span class="user-avatar-badge ${userIsAdmin ? 'is-admin' : ''}">${initial}</span>
            <span class="user-display-name">${escapeHTML(displayName)}</span>
            <svg class="user-chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </button>

          <div class="user-dropdown-panel" id="userDropdownPanel">
            <div class="user-dropdown-header">
              <div class="user-dropdown-avatar-lg ${userIsAdmin ? 'is-admin' : ''}">${initial}</div>
              <div class="user-dropdown-meta">
                <div class="user-dropdown-username">@${escapeHTML(displayName)}</div>
                <span class="user-role-badge ${userIsAdmin ? 'role-admin' : 'role-student'}">
                  ${userIsAdmin ? '👑 Quản trị viên' : '🎓 Học viên'}
                </span>
              </div>
            </div>

            <ul class="user-dropdown-list">
              ${userIsAdmin ? `
                <li>
                  <button type="button" class="user-dropdown-item-btn item-admin" id="btnAdminOpenPanel">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    <span>Bảng Quản Trị & Tạo Key</span>
                  </button>
                </li>
              ` : ''}
              <li>
                <button type="button" class="user-dropdown-item-btn" id="btnUserOpenActivateKey">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-1.5 1.5L14 9l-1.5-1.5L11 9l-1.5-1.5L8 9l-4.5 4.5a3 3 0 1 0 4.24 4.24L12 13.5l1.5 1.5 1.5-1.5 1.5 1.5 3.5-3.5a3 3 0 0 0-4.24-4.24z"/></svg>
                  <span>Kích hoạt môn học (Nhập Key)</span>
                </button>
              </li>
              <li>
                <button type="button" class="user-dropdown-item-btn" id="btnUserChangePassword">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <span>Đổi mật khẩu</span>
                </button>
              </li>
              <li>
                <button type="button" class="user-dropdown-item-btn item-danger" id="btnUserLogout">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  <span>Đăng xuất</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      `;

      const profileBtn = document.getElementById("userProfileBtn");
      const dropdownPanel = document.getElementById("userDropdownPanel");

      profileBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = dropdownPanel.classList.contains("show");
        if (isOpen) {
          dropdownPanel.classList.remove("show");
          profileBtn.classList.remove("active");
          profileBtn.setAttribute("aria-expanded", "false");
        } else {
          dropdownPanel.classList.add("show");
          profileBtn.classList.add("active");
          profileBtn.setAttribute("aria-expanded", "true");
        }
      });

      document.addEventListener("click", (e) => {
        if (!authSlot.contains(e.target)) {
          dropdownPanel?.classList.remove("show");
          profileBtn?.classList.remove("active");
          profileBtn?.setAttribute("aria-expanded", "false");
        }
      });

      document.getElementById("btnAdminOpenPanel")?.addEventListener("click", () => {
        dropdownPanel.classList.remove("show");
        profileBtn.classList.remove("active");
        openAdminPanel();
      });

      document.getElementById("btnUserOpenActivateKey")?.addEventListener("click", () => {
        dropdownPanel.classList.remove("show");
        profileBtn.classList.remove("active");
        openActivateKeyModal();
      });

      document.getElementById("btnUserChangePassword")?.addEventListener("click", () => {
        dropdownPanel.classList.remove("show");
        profileBtn.classList.remove("active");
        openModal("changePassword");
      });

      document.getElementById("btnUserLogout")?.addEventListener("click", () => {
        dropdownPanel.classList.remove("show");
        clearSession();
        showToast("Đã đăng xuất tài khoản thành công!", "info");
      });
    }
  }

  // Khởi chạy khi DOM sẵn sàng
  async function init() {
    await seedInitialData();
    injectAuthModal();
    renderHeaderAuthUI();
    checkSubjectAccessOnPage();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Xuất API toàn cục
  window.KeduAuth = {
    getCurrentUser,
    isAdmin,
    hasSubjectAccess,
    register,
    login,
    logout: clearSession,
    changePassword,
    activateLicenseKey,
    openModal,
    closeModal,
    openActivateKeyModal,
    closeActivateKeyModal,
    openAdminPanel,
    closeAdminPanel,
    setUserRole,
    adminCreateLicenseKeys,
    adminDeleteLicenseKey,
    adminResetPassword,
    adminDeleteUser,
    showToast
  };
})();
