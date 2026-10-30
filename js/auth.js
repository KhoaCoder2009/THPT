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
  const AUTH_BADGE_LOGO_PATH = isSubPage ? "../assets/images/logo_kedu_square.png" : "assets/images/logo_kedu_square.png";

  // Biểu tượng SVG chuyên biệt theo UI/UX Pro Max (thay thế emoji thô sơ)
  const SUBJECT_ICONS = {
    toan: `<svg class="subj-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 8h10"/><path d="M7 12h4"/><path d="M7 16h10"/></svg>`,
    vatli: `<svg class="subj-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    hoa: `<svg class="subj-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 3h6"/><path d="M10 9l-6 11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2L14 9"/><path d="M10 9V3"/><path d="M14 9V3"/></svg>`,
    sinh: `<svg class="subj-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12c2.5-4 6.5-6 10-6s7.5 2 10 6c-2.5 4-6.5 6-10 6s-7.5-2-10-6z"/><circle cx="12" cy="12" r="3"/></svg>`,
    tinhoc: `<svg class="subj-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
    lichsu: `<svg class="subj-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" y1="22" x2="20" y2="22"/><line x1="4" y1="2" x2="20" y2="2"/><path d="M6 18v-8"/><path d="M10 18V6"/><path d="M14 18V6"/><path d="M18 18v-8"/></svg>`,
    all: `<svg class="subj-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>`
  };

  function getSubjectIconSvg(subjectId) {
    if (!subjectId) return SUBJECT_ICONS.all;
    const cleanId = subjectId.toLowerCase().replace(/[^a-z]/g, "");
    return SUBJECT_ICONS[cleanId] || SUBJECT_ICONS[subjectId] || SUBJECT_ICONS.all;
  }

  const SUBJECTS = [
    { id: "toan", name: "Toán học 12", prefix: "TOAN", icon: "", page: "toan-hoc.html" },
    { id: "vatli", name: "Vật lí 12", prefix: "VATLI", icon: "", page: "vat-li.html" },
    { id: "hoa", name: "Hóa học 12", prefix: "HOA", icon: "", page: "hoa-hoc.html" },
    { id: "sinh", name: "Sinh học 12", prefix: "SINH", icon: "", page: "sinh-hoc.html" },
    { id: "tinhoc", name: "Tin học 12", prefix: "TINHOC", icon: "", page: "tin-hoc.html" },
    { id: "lichsu", name: "Lịch sử 12", prefix: "LICHSU", icon: "", page: "lich-su.html" },
    { id: "all", name: "Tất cả các môn (Combo VIP)", prefix: "ALL", icon: "", page: "../index.html" }
  ];

  let switchAdminTabFn = null;

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
    /**
   * Chuẩn hóa cấu trúc Key (Tương thích 100% dữ liệu cũ và hỗ trợ hạn mức đa tài khoản)
   */
  function normalizeKey(k) {
    if (!k || typeof k !== "object") return null;
    const maxActivations = Math.max(1, parseInt(k.maxActivations || k.maxUses || 1, 10));

    let usedByList = [];
    if (Array.isArray(k.usedBy)) {
      usedByList = k.usedBy.filter(Boolean);
    } else if (typeof k.usedBy === "string" && k.usedBy.trim()) {
      usedByList = [k.usedBy.trim()];
    }

    let activations = Array.isArray(k.activations) ? k.activations : [];
    if (activations.length === 0 && usedByList.length > 0) {
      activations = usedByList.map(u => ({
        username: u,
        activatedAt: k.usedAt || k.createdAt || new Date().toISOString()
      }));
    }

    const usedCount = Math.max(usedByList.length, activations.length);
    const isUsed = usedCount >= maxActivations;

    return {
      code: k.code,
      subjectId: k.subjectId,
      maxActivations: maxActivations,
      usedCount: usedCount,
      usedBy: usedByList,
      activations: activations,
      isUsed: isUsed,
      usedAt: k.usedAt || (activations.length > 0 ? activations[activations.length - 1].activatedAt : null),
      createdAt: k.createdAt || new Date().toISOString()
    };
  }

  function getAllLicenseKeys() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS_KEY);
      if (!data) return {};
      const parsed = JSON.parse(data);
      const normalized = {};
      for (const code in parsed) {
        if (Object.prototype.hasOwnProperty.call(parsed, code)) {
          normalized[code] = normalizeKey(parsed[code]);
        }
      }
      return normalized;
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
      { code: "TOAN-2026-VIP1", subjectId: "toan", maxActivations: 5 },
      { code: "VATLI-2026-VIP2", subjectId: "vatli", maxActivations: 5 },
      { code: "HOA-2026-VIP3", subjectId: "hoa", maxActivations: 5 },
      { code: "SINH-2026-VIP4", subjectId: "sinh", maxActivations: 5 },
      { code: "TINHOC-2026-VIP5", subjectId: "tinhoc", maxActivations: 5 },
      { code: "LICHSU-2026-VIP7", subjectId: "lichsu", maxActivations: 5 },
      { code: "ALL-2026-VIP9", subjectId: "all", maxActivations: 10 }
    ];

    let updatedKeys = false;
    for (const dk of defaultKeys) {
      if (!keys[dk.code]) {
        keys[dk.code] = {
          code: dk.code,
          subjectId: dk.subjectId,
          maxActivations: dk.maxActivations || 1,
          usedCount: 0,
          usedBy: [],
          activations: [],
          isUsed: false,
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
      email: user.email || null,
      avatar: user.avatar || user.picture || null,
      authProvider: user.authProvider || "local",
      googleId: user.googleId || null,
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
    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function" && typeof CustomEvent !== "undefined") {
      try {
        window.dispatchEvent(
          new CustomEvent("kedu:auth-change", {
            detail: { action, user }
          })
        );
        window.dispatchEvent(
          new CustomEvent("kedu-auth-change", {
            detail: { action, user }
          })
        );
      } catch (_) {}
    }
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
    const rawKey = keys[code];

    if (!rawKey) {
      return { success: false, message: "Mã key không hợp lệ hoặc không tồn tại trong hệ thống!" };
    }

    const keyData = normalizeKey(rawKey);

    // Kiểm tra xem chính tài khoản này đã kích hoạt key này chưa
    const alreadyActivatedThisKey = keyData.usedBy.some(
      u => u.toLowerCase() === currentUser.username.toLowerCase()
    );
    if (alreadyActivatedThisKey) {
      return { 
        success: false, 
        message: `Tài khoản @${currentUser.username} đã kích hoạt mã key này trước đó rồi!` 
      };
    }

    // Kiểm tra hạn mức tối đa tài khoản
    if (keyData.usedCount >= keyData.maxActivations) {
      const usersPreview = keyData.usedBy.slice(0, 3).map(u => `@${u}`).join(", ");
      const moreCount = keyData.usedBy.length > 3 ? ` và ${keyData.usedBy.length - 3} tài khoản khác` : "";
      return { 
        success: false, 
        message: `Mã key này đã đạt giới hạn tối đa (${keyData.maxActivations}/${keyData.maxActivations} tài khoản: ${usersPreview}${moreCount}). Không thể kích hoạt thêm!` 
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
      const subjName = subj ? subj.name : (keyData.subjectId === "all" ? "Tất cả các môn" : keyData.subjectId);
      return { success: false, message: `Tài khoản @${currentUser.username} đã được mở khóa môn ${subjName} từ trước rồi!` };
    }

    // Thêm người dùng vào danh sách kích hoạt của key
    const nowIso = new Date().toISOString();
    keyData.usedBy.push(currentUser.username);
    keyData.activations.push({
      username: currentUser.username,
      activatedAt: nowIso
    });
    keyData.usedCount = keyData.usedBy.length;
    keyData.isUsed = keyData.usedCount >= keyData.maxActivations;
    keyData.usedAt = nowIso;

    keys[code] = keyData;
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

    const subjName = subj ? subj.name : (keyData.subjectId === "all" ? "Tất cả các môn" : keyData.subjectId);
    const remainingSlots = keyData.maxActivations - keyData.usedCount;
    const remainingNotice = keyData.maxActivations > 1 
      ? ` (Key còn ${remainingSlots}/${keyData.maxActivations} lượt cho tài khoản khác)` 
      : "";

    return { 
      success: true, 
      message: `Kích hoạt thành công! Đã mở khóa môn ${subjName} cho tài khoản @${currentUser.username}.${remainingNotice}`,
      subject: subj 
    };
  }

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
          <div class="subject-lock-icon-wrap">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
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
  function adminCreateLicenseKeys(subjectId, count = 1, maxActivations = 1) {
    if (!isAdmin()) {
      showToast("Chỉ Quản trị viên mới có quyền tạo mã Key!", "error");
      return [];
    }

    const quota = Math.max(1, parseInt(maxActivations, 10) || 1);
    const numKeys = Math.max(1, parseInt(count, 10) || 1);
    const subj = getSubjectById(subjectId);
    const keys = getAllLicenseKeys();
    const createdList = [];

    for (let i = 0; i < numKeys; i++) {
      let code = "";
      do {
        code = generateKeyCode(subj.prefix);
      } while (keys[code]);

      keys[code] = {
        code: code,
        subjectId: subj.id,
        maxActivations: quota,
        usedCount: 0,
        usedBy: [],
        activations: [],
        isUsed: false,
        usedAt: null,
        createdAt: new Date().toISOString()
      };
      createdList.push(code);
    }

    saveAllLicenseKeys(keys);
    const quotaLabel = quota === 1 ? "1 tài khoản/key" : `${quota} tài khoản/key`;
    showToast(`Đã tạo thành công ${numKeys} mã key (${quotaLabel}) cho môn ${subj.name}!`, "success");
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
    renderAdminSummaryMetrics();
    return true;
  }

  function adminSetUserSubjects(targetUsername, subjectIdsArray) {
    if (!isAdmin()) {
      showToast("Chỉ Quản trị viên mới có quyền phân quyền môn học!", "error");
      return false;
    }
    const users = getAllUsers();
    const normalizedKey = targetUsername.toLowerCase();
    if (!users[normalizedKey]) {
      showToast("Không tìm thấy tài khoản người dùng!", "error");
      return false;
    }
    users[normalizedKey].unlockedSubjects = Array.isArray(subjectIdsArray) ? subjectIdsArray : [];
    saveAllUsers(users);
    showToast(`Đã cập nhật danh sách môn học cho @${targetUsername}!`, "success");
    renderAdminUsersTable();
    renderAdminSummaryMetrics();
    return true;
  }

  function adminCopyUnusedKeys(subjectId = null) {
    const keys = getAllLicenseKeys();
    const availableList = Object.keys(keys)
      .filter(code => {
        const k = keys[code];
        if (k.usedCount >= k.maxActivations) return false;
        if (subjectId && subjectId !== "all" && k.subjectId !== subjectId) return false;
        return true;
      });

    if (availableList.length === 0) {
      showToast("Không có mã key nào còn lượt kích hoạt để sao chép!", "info");
      return;
    }

    const textToCopy = availableList.join("\n");
    if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        showToast(`Đã sao chép ${availableList.length} mã Key còn lượt kích hoạt!`, "success");
      }).catch(() => {
        prompt("Danh sách mã Key còn lượt:", textToCopy);
      });
    } else {
      prompt("Danh sách mã Key còn lượt:", textToCopy);
    }
  }

  function adminExportKeys(format = "txt") {
    const keys = getAllLicenseKeys();
    const keyCodes = Object.keys(keys);
    if (keyCodes.length === 0) {
      showToast("Chưa có mã key nào trong hệ thống!", "info");
      return;
    }

    let content = "";
    let mimeType = "text/plain";
    let fileName = `kedu_license_keys_${new Date().toISOString().slice(0, 10)}.txt`;

    if (format === "csv") {
      mimeType = "text/csv;charset=utf-8;";
      fileName = `kedu_license_keys_${new Date().toISOString().slice(0, 10)}.csv`;
      content = "Mã Key,Môn học,Hạn mức TK,Đã dùng,Còn lại,Trạng thái,Tài khoản đã kích hoạt,Ngày tạo\n" +
        keyCodes.map(code => {
          const k = keys[code];
          const subj = getSubjectById(k.subjectId);
          const subjName = subj ? subj.name : (k.subjectId === "all" ? "Tất cả môn" : k.subjectId);
          const status = k.usedCount >= k.maxActivations ? "Hết lượt" : (k.usedCount > 0 ? "Đang dùng" : "Chưa dùng");
          const remaining = Math.max(0, k.maxActivations - k.usedCount);
          const usersList = (k.usedBy || []).join("; ");
          return `"${k.code}","${subjName}",${k.maxActivations},${k.usedCount},${remaining},"${status}","${usersList}","${k.createdAt || ''}"`;
        }).join("\n");
    } else {
      content = "=== DANH SÁCH MÃ KEY BẢN QUYỀN KEDU ===\n" +
        "Thời gian xuất: " + new Date().toLocaleString("vi-VN") + "\n\n" +
        keyCodes.map(code => {
          const k = keys[code];
          const subj = getSubjectById(k.subjectId);
          const subjName = subj ? subj.name : (k.subjectId === "all" ? "Tất cả môn" : k.subjectId);
          const status = k.usedCount >= k.maxActivations 
            ? `[HẾT LƯỢT ${k.usedCount}/${k.maxActivations}]` 
            : (k.usedCount > 0 ? `[ĐANG DÙNG ${k.usedCount}/${k.maxActivations}]` : `[CHƯA DÙNG - Hạn mức ${k.maxActivations} TK]`);
          const usersList = (k.usedBy && k.usedBy.length > 0) ? ` | Đã kích hoạt: ${k.usedBy.map(u => '@' + u).join(', ')}` : "";
          return `${k.code} | Môn: ${subjName} | ${status}${usersList}`;
        }).join("\n");
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Đã xuất file ${fileName} thành công!`, "success");
  }

  function adminExportDataBackup() {
    const backupData = {
      version: "2.5",
      system: "KEdu Education THPT",
      exportedAt: new Date().toISOString(),
      users: getAllUsers(),
      keys: getAllLicenseKeys()
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kedu_system_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Đã tải xuống file sao lưu hệ thống JSON!", "success");
  }

  function adminImportDataBackup(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (!data.users || typeof data.users !== "object") {
        showToast("File sao lưu không hợp lệ (thiếu danh sách người dùng)!", "error");
        return false;
      }
      saveAllUsers(data.users);
      if (data.keys && typeof data.keys === "object") {
        saveAllLicenseKeys(data.keys);
      }
      showToast("Khôi phục dữ liệu từ bản sao lưu thành công!", "success");
      renderAdminSummaryMetrics();
      renderAdminUsersTable();
      renderAdminKeysTable();
      return true;
    } catch (err) {
      showToast("Lỗi giải mã file sao lưu JSON: " + err.message, "error");
      return false;
    }
  }

  let activeConfirmCallback = null;

  function showAdminConfirmDialog({ title, message, confirmText = "Xác nhận", danger = true, onConfirm }) {
    const overlay = document.getElementById("adminDialogConfirm");
    if (!overlay) {
      if (confirm(message)) {
        if (typeof onConfirm === "function") onConfirm();
      }
      return;
    }
    const titleEl = document.getElementById("adminConfirmTitle");
    const msgEl = document.getElementById("adminConfirmMsg");
    const btnConfirm = document.getElementById("adminConfirmSubmitBtn");

    if (titleEl) titleEl.textContent = title || "Xác nhận thao tác";
    if (msgEl) msgEl.innerHTML = message;
    if (btnConfirm) {
      btnConfirm.textContent = confirmText;
      btnConfirm.className = danger ? "btn-admin-primary" : "btn-admin-secondary";
    }

    activeConfirmCallback = onConfirm;
    overlay.classList.add("active");
  }

  function closeAdminConfirmDialog() {
    const overlay = document.getElementById("adminDialogConfirm");
    if (overlay) overlay.classList.remove("active");
    activeConfirmCallback = null;
  }

  /**
   * INJECT CẤU TRÚC TẤT CẢ MODAL (ĐĂNG NHẬP, ĐĂNG KÝ, ĐỔI MẬT KHẨU, KÍCH HOẠT KEY, ADMIN)
   */
  function injectAuthModal() {
    if (document.getElementById("loginModal")) return;

    const subjectsOptionsHTML = SUBJECTS.map(s => `<option value="${s.id}">${s.name} (${s.prefix})</option>`).join("");

    const modalHTML = `
      <!-- 1. MODAL ĐĂNG NHẬP RIÊNG BIỆT -->
      <div class="auth-modal-overlay" id="loginModal" aria-hidden="true">
        <div class="auth-modal-card" role="dialog" aria-modal="true" aria-labelledby="loginModalTitle">
          <button class="auth-modal-close" id="loginModalCloseBtn" type="button" title="Đóng cửa sổ" aria-label="Đóng cửa sổ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>

          <div class="auth-modal-top">
            <div class="auth-modal-brand-badge">
              <img src="${AUTH_BADGE_LOGO_PATH}" alt="KEdu Logo" class="auth-modal-logo">
            </div>
            <h3 class="auth-modal-title" id="loginModalTitle">Đăng Nhập Tài Khoản</h3>
            <p class="auth-modal-subtitle">Truy cập ngân hàng ôn luyện và làm bài thi THPT 2026</p>
          </div>

          <div class="auth-modal-body">
            <div class="auth-alert" id="loginAlertBox" role="alert" aria-live="polite"></div>

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
                <span>Đăng nhập ngay</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>

              <div class="auth-form-footer">
                <span>Chưa có tài khoản?</span>
                <button type="button" class="auth-link" id="linkToRegister">Đăng ký tài khoản ngay →</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- 2. MODAL ĐĂNG KÝ RIÊNG BIỆT -->
      <div class="auth-modal-overlay" id="registerModal" aria-hidden="true">
        <div class="auth-modal-card" role="dialog" aria-modal="true" aria-labelledby="registerModalTitle">
          <button class="auth-modal-close" id="registerModalCloseBtn" type="button" title="Đóng cửa sổ" aria-label="Đóng cửa sổ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>

          <div class="auth-modal-top">
            <div class="auth-modal-brand-badge">
              <img src="${AUTH_BADGE_LOGO_PATH}" alt="KEdu Logo" class="auth-modal-logo">
            </div>
            <h3 class="auth-modal-title" id="registerModalTitle">Tạo Tài Khoản Học Viên</h3>
            <p class="auth-modal-subtitle">Khởi tạo tài khoản ôn luyện và làm bài thi THPT 2026 miễn phí</p>
          </div>

          <div class="auth-modal-body">
            <div class="auth-alert" id="registerAlertBox" role="alert" aria-live="polite"></div>

            <form id="formRegister" class="auth-form-pane active" novalidate>
              <div class="auth-field-group">
                <label class="auth-label" for="regUsername">
                  <span>Tên tài khoản <span class="auth-req">*</span></span>
                </label>
                <div class="auth-input-wrapper">
                  <span class="auth-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </span>
                  <input type="text" id="regUsername" class="auth-input" placeholder="Nhập tên tài khoản (viết liền không dấu)" autocomplete="username" spellcheck="false" required>
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
                  <input type="password" id="regConfirmPassword" class="auth-input" placeholder="Nhập lại chính xác mật khẩu" autocomplete="new-password" required>
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
                <button type="button" class="auth-link" id="linkToLogin">← Đã có tài khoản? Đăng nhập ngay</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- 3. MODAL ĐỔI MẬT KHẨU RIÊNG BIỆT -->
      <div class="auth-modal-overlay" id="changePasswordModal" aria-hidden="true">
        <div class="auth-modal-card" role="dialog" aria-modal="true" aria-labelledby="changePasswordModalTitle">
          <button class="auth-modal-close" id="changePasswordModalCloseBtn" type="button" title="Đóng cửa sổ" aria-label="Đóng cửa sổ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>

          <div class="auth-modal-top">
            <div class="auth-modal-brand-badge" style="background: #eff6ff; border-color: #bfdbfe;">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <h3 class="auth-modal-title" id="changePasswordModalTitle">Đổi Mật Khẩu Tài Khoản</h3>
            <p class="auth-modal-subtitle">Bảo mật tài khoản bằng cách cập nhật mật khẩu mới</p>
          </div>

          <div class="auth-modal-body">
            <div class="auth-alert" id="changePasswordAlertBox" role="alert" aria-live="polite"></div>

            <form id="formChangePassword" class="auth-form-pane active" novalidate>
              <div class="auth-field-group">
                <label class="auth-label" for="changeOldPassword">
                  <span>Mật khẩu hiện tại <span class="auth-req">*</span></span>
                </label>
                <div class="auth-input-wrapper">
                  <span class="auth-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </span>
                  <input type="password" id="changeOldPassword" class="auth-input" placeholder="Nhập mật khẩu hiện tại" autocomplete="current-password" required>
                  <button type="button" class="auth-toggle-pwd" data-target="changeOldPassword" title="Ẩn/Hiện mật khẩu" aria-label="Ẩn/Hiện mật khẩu">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
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
                  <button type="button" class="auth-toggle-pwd" data-target="changeNewPassword" title="Ẩn/Hiện mật khẩu" aria-label="Ẩn/Hiện mật khẩu">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
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
                  <button type="button" class="auth-toggle-pwd" data-target="changeConfirmNewPassword" title="Ẩn/Hiện mật khẩu" aria-label="Ẩn/Hiện mật khẩu">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </div>
              </div>

              <button type="submit" class="btn-auth-submit" id="btnChangePasswordSubmit">
                <span>Cập nhật mật khẩu</span>
              </button>

              <div class="auth-form-footer">
                <button type="button" class="auth-link" id="linkCancelChangePwd">Quay lại / Đóng cửa sổ</button>
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

      <!-- MODERN ADMIN COMMAND CENTER (BẢNG QUẢN TRỊ CAO CẤP) -->
      <div class="auth-modal-overlay" id="adminModal" aria-hidden="true">
        <div class="auth-modal-card admin-modal-card" role="dialog" aria-modal="true" aria-labelledby="adminHeaderTitle">
          <!-- HEADER -->
          <div class="admin-modal-header">
            <div class="admin-header-brand">
              <div class="admin-header-crown">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>
                </svg>
              </div>
              <div class="admin-header-titles">
                <h2 id="adminHeaderTitle">
                  <span>Bảng Quản Trị Hệ Thống</span>
                  <span class="admin-header-badge">Admin Center</span>
                </h2>
                <p class="admin-header-desc">Quản lý người dùng, bản quyền ôn luyện & ngân hàng đề thi THPT 2026</p>
              </div>
            </div>

            <div class="admin-header-actions">
              <a href="${isSubPage ? 'quan-ly-de.html' : 'pages/quan-ly-de.html'}" class="btn-admin-header-link" title="Xem & chỉnh sửa đáp án câu hỏi">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                <span>Quản lý Đề & Đáp án</span>
              </a>
              <a href="${isSubPage ? 'admin.html' : 'pages/admin.html'}" class="btn-admin-header-link" title="Mở giao diện quản trị toàn màn hình">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                <span>Toàn màn hình</span>
              </a>
              <button class="btn-admin-close" id="adminModalCloseBtn" type="button" title="Đóng bảng quản trị" aria-label="Đóng">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>

          <!-- BODY -->
          <div class="admin-modal-body">
            <!-- 4-METRIC STATS GRID -->
            <div class="admin-metrics-grid">
              <div class="admin-metric-card">
                <div class="admin-metric-info">
                  <div class="admin-metric-label">Tổng người dùng</div>
                  <div class="admin-metric-num" id="statTotalUsers">0</div>
                  <div class="admin-metric-meta">
                    <span style="color:#d97706; font-weight:700;"><span id="statAdminUsers">0</span> Admin</span> • 
                    <span style="color:#2563eb; font-weight:700;"><span id="statStudentUsers">0</span> Học viên</span>
                  </div>
                </div>
                <div class="admin-metric-icon blue">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
              </div>

              <div class="admin-metric-card">
                <div class="admin-metric-info">
                  <div class="admin-metric-label">Mã Bản quyền (Key)</div>
                  <div class="admin-metric-num" id="statTotalKeys">0</div>
                  <div class="admin-metric-meta">
                    <span style="color:#16a34a; font-weight:700;"><span id="statUnusedKeys">0</span> Sẵn sàng</span> • 
                    <span style="color:#64748b;"><span id="statUsedKeys">0</span> Đã dùng</span>
                  </div>
                </div>
                <div class="admin-metric-icon amber">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-1.5 1.5L14 9l-1.5-1.5L11 9l-1.5-1.5L8 9l-4.5 4.5a3 3 0 1 0 4.24 4.24L12 13.5l1.5 1.5 1.5-1.5 1.5 1.5 3.5-3.5a3 3 0 0 0-4.24-4.24z"/></svg>
                </div>
              </div>

              <div class="admin-metric-card">
                <div class="admin-metric-info">
                  <div class="admin-metric-label">Môn học phủ sóng</div>
                  <div class="admin-metric-num"><span id="statTotalSubjects">6</span> Môn</div>
                  <div class="admin-metric-meta">
                    <span style="color:#16a34a; font-weight:700;" id="statSubjectsMeta">Toán (1 đề - 22 câu) • 5 môn đang cập nhật</span>
                  </div>
                </div>
                <div class="admin-metric-icon green">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                </div>
              </div>

              <div class="admin-metric-card">
                <div class="admin-metric-info">
                  <div class="admin-metric-label">Tỷ lệ kích hoạt Key</div>
                  <div class="admin-metric-num" id="statKeyUsageRate">0%</div>
                  <div class="admin-metric-meta">
                    <span style="color:#2563eb; font-weight:700;">Hệ thống bảo mật SHA-256</span>
                  </div>
                </div>
                <div class="admin-metric-icon purple">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
              </div>
            </div>

            <!-- TABS NAV -->
            <div class="admin-tabs-bar">
              <button type="button" class="admin-tab-btn active" id="tabAdminUsers">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <span>Quản lý Người dùng</span>
                <span class="admin-tab-badge" id="adminBadgeUsersCount">0</span>
              </button>
              <button type="button" class="admin-tab-btn" id="tabAdminKeys">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-1.5 1.5L14 9l-1.5-1.5L11 9l-1.5-1.5L8 9l-4.5 4.5a3 3 0 1 0 4.24 4.24L12 13.5l1.5 1.5 1.5-1.5 1.5 1.5 3.5-3.5a3 3 0 0 0-4.24-4.24z"/></svg>
                <span>Quản lý Mã Bản quyền</span>
                <span class="admin-tab-badge" id="adminBadgeKeysCount">0</span>
              </button>
              <button type="button" class="admin-tab-btn" id="tabAdminSubjects">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                <span>Kho đề & Môn học</span>
                <span class="admin-tab-badge">6</span>
              </button>
              <button type="button" class="admin-tab-btn" id="tabAdminBackup">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span>Sao lưu & Dữ liệu</span>
              </button>
            </div>

            <!-- PANE 1: USERS -->
            <div id="paneAdminUsers">
              <div class="admin-toolbar-row">
                <div class="admin-filter-group">
                  <button type="button" class="admin-filter-pill active" id="filterUserRoleAll" data-role="all">Tất cả</button>
                  <button type="button" class="admin-filter-pill" id="filterUserRoleAdmin" data-role="admin">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>
                    <span>Quản trị viên</span>
                  </button>
                  <button type="button" class="admin-filter-pill" id="filterUserRoleStudent" data-role="student">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                    <span>Học viên</span>
                  </button>
                </div>
                <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                  <div class="admin-search-wrap">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input type="text" class="admin-search-input" id="adminSearchInput" placeholder="Tìm tài khoản theo tên...">
                  </div>
                  <button type="button" class="btn-admin-primary" id="btnAdminCreateUser">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    <span>Thêm tài khoản</span>
                  </button>
                </div>
              </div>

              <div class="admin-table-container">
                <div class="admin-table-scroll">
                  <table class="admin-data-table">
                    <thead>
                      <tr>
                        <th>Người dùng</th>
                        <th>Vai trò</th>
                        <th>Môn học mở khóa</th>
                        <th style="text-align: right;">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody id="adminUsersTableBody"></tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- PANE 2: KEYS -->
            <div id="paneAdminKeys" style="display: none;">
              <!-- Key Gen Card -->
              <div class="admin-key-gen-card">
                <div class="admin-key-gen-controls">
                  <span style="font-weight: 700; font-size: 13px; color: #0f2657;">Tạo mã Key mới:</span>
                  <select id="selAdminKeySubject" class="admin-select">
                    ${subjectsOptionsHTML}
                  </select>
                  <select id="selAdminKeyCount" class="admin-select" style="width: 105px;" title="Số lượng mã key cần tạo">
                    <option value="1">1 Key</option>
                    <option value="3">3 Key</option>
                    <option value="5" selected>5 Key</option>
                    <option value="10">10 Key</option>
                    <option value="20">20 Key</option>
                  </select>
                  <select id="selAdminKeyQuota" class="admin-select" style="min-width: 150px;" title="Số lượng tài khoản có thể kích hoạt cho mỗi key">
                    <option value="1" selected>👤 1 tài khoản / key</option>
                    <option value="2">👥 2 tài khoản / key</option>
                    <option value="3">👥 3 tài khoản / key</option>
                    <option value="5">👥 5 tài khoản / key</option>
                    <option value="10">🏫 10 tài khoản / key</option>
                    <option value="30">🏫 30 tài khoản (Lớp)</option>
                    <option value="50">🏫 50 tài khoản (Khối)</option>
                    <option value="100">🎓 100 tài khoản</option>
                  </select>
                  <button type="button" class="btn-admin-primary" id="btnAdminGenKeys" style="background: linear-gradient(135deg, #d97706, #b45309);">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14M5 12h14"/></svg>
                    <span>Tạo Key</span>
                  </button>
                </div>

                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  <button type="button" class="btn-admin-secondary" id="btnAdminCopyUnusedKeys" title="Sao chép toàn bộ danh sách key chưa sử dụng">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    <span>Copy key chưa dùng</span>
                  </button>
                  <button type="button" class="btn-admin-secondary" id="btnAdminExportKeysTxt" title="Xuất file danh sách Key">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    <span>Xuất TXT</span>
                  </button>
                </div>
              </div>

              <!-- Filter Row -->
              <div class="admin-toolbar-row">
                <div class="admin-filter-group">
                  <button type="button" class="admin-filter-pill active" id="filterKeyStatusAll" data-status="all">Tất cả Key</button>
                  <button type="button" class="admin-filter-pill" id="filterKeyStatusUnused" data-status="unused"><span style="color:#10b981; font-weight:bold; margin-right:4px;">●</span>Chưa sử dụng</button>
                  <button type="button" class="admin-filter-pill" id="filterKeyStatusUsed" data-status="used"><span style="color:#94a3b8; font-weight:bold; margin-right:4px;">●</span>Đã kích hoạt</button>
                  <select id="selAdminKeyFilterSubject" class="admin-select" style="font-size: 12px; padding: 4px 8px;">
                    <option value="all">-- Lọc theo tất cả môn --</option>
                    ${SUBJECTS.map(s => `<option value="${s.id}">${s.name}</option>`).join("")}
                  </select>
                </div>
                <div class="admin-search-wrap">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input type="text" class="admin-search-input" id="adminSearchKeyInput" placeholder="Tìm theo mã key hoặc @user...">
                </div>
              </div>

              <div class="admin-table-container">
                <div class="admin-table-scroll">
                  <table class="admin-data-table">
                    <thead>
                      <tr>
                        <th>Mã Key Bản quyền</th>
                        <th>Môn học</th>
                        <th>Trạng thái</th>
                        <th>Hạn mức tài khoản</th>
                        <th>Tài khoản đã kích hoạt</th>
                        <th style="text-align: right;">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody id="adminKeysTableBody"></tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- PANE 3: SUBJECTS -->
            <div id="paneAdminSubjects" style="display: none;">
              <div style="margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between;">
                <div>
                  <h3 style="font-size: 15px; font-weight: 800; color: #0f2657; margin: 0 0 3px 0;">Tổng quan 6 Môn thi tốt nghiệp THPT</h3>
                  <p style="font-size: 12px; color: #64748b; margin: 0;">Kiểm tra tiến độ soạn câu hỏi và tạo nhanh mã Key kích hoạt cho từng môn</p>
                </div>
              </div>
              <div class="admin-subjects-grid" id="adminSubjectsGridContainer"></div>
            </div>

            <!-- PANE 4: BACKUP & DATA -->
            <div id="paneAdminBackup" style="display: none;">
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
                <div class="admin-metric-card" style="flex-direction: column; gap: 12px;">
                  <div>
                    <h4 style="font-size: 15px; font-weight: 800; color: #0f2657; margin: 0 0 6px 0;">Sao lưu Dữ liệu Hệ thống (Backup JSON)</h4>
                    <p style="font-size: 12px; color: #64748b; margin: 0; line-height: 1.5;">Tải xuống tệp JSON chứa toàn bộ tài khoản người dùng, phân quyền và kho mã key bản quyền để lưu trữ an toàn.</p>
                  </div>
                  <button type="button" class="btn-admin-primary" id="btnAdminExportBackup">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    <span>Tải file sao lưu JSON</span>
                  </button>
                </div>

                <div class="admin-metric-card" style="flex-direction: column; gap: 12px;">
                  <div>
                    <h4 style="font-size: 15px; font-weight: 800; color: #0f2657; margin: 0 0 6px 0;">Khôi phục Dữ liệu (Restore JSON)</h4>
                    <p style="font-size: 12px; color: #64748b; margin: 0; line-height: 1.5;">Chọn tệp JSON sao lưu trước đó để nạp lại dữ liệu người dùng và mã key vào trình duyệt này.</p>
                  </div>
                  <input type="file" id="fileAdminBackupInput" accept=".json" style="display: none;">
                  <button type="button" class="btn-admin-secondary" id="btnAdminImportBackup">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <span>Chọn tệp JSON khôi phục</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- IN-APP SUB-MODAL: TẠO TÀI KHOẢN MỚI -->
      <div class="admin-dialog-overlay" id="adminDialogCreateUser">
        <div class="admin-dialog-card">
          <div class="admin-dialog-head">
            <h3 class="admin-dialog-title">Thêm tài khoản người dùng mới</h3>
            <button type="button" class="btn-admin-close" id="btnCloseCreateUserModal" style="color:#64748b; width:28px; height:28px;" title="Đóng">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <form id="formAdminCreateUser">
            <div class="admin-dialog-body">
              <div class="admin-form-group">
                <label class="admin-form-label" for="adminNewUserUsername">Tên tài khoản (Username) *</label>
                <input type="text" class="admin-form-input" id="adminNewUserUsername" placeholder="ví dụ: hocsinh12a, thaykhoa..." required autocomplete="off">
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label" for="adminNewUserPassword">Mật khẩu ban đầu (tối thiểu 6 ký tự) *</label>
                <input type="password" class="admin-form-input" id="adminNewUserPassword" placeholder="Nhập mật khẩu..." required minlength="6">
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label" for="adminNewUserRole">Vai trò tài khoản *</label>
                <select class="admin-form-input" id="adminNewUserRole">
                  <option value="student">Học viên (Chỉ mở các môn được cấp)</option>
                  <option value="admin">Quản trị viên (Toàn quyền hệ thống & tất cả môn)</option>
                </select>
              </div>
              <div class="admin-form-group" id="adminNewUserSubjectsGroup">
                <label class="admin-form-label">Môn học mở khóa ngay (Học viên):</label>
                <div class="admin-subjects-checkboxes" id="adminNewUserSubjectsList"></div>
              </div>
            </div>
            <div class="admin-dialog-footer">
              <button type="button" class="btn-admin-secondary" id="btnCancelCreateUserModal">Hủy bỏ</button>
              <button type="submit" class="btn-admin-primary">Tạo tài khoản</button>
            </div>
          </form>
        </div>
      </div>

      <!-- IN-APP SUB-MODAL: ĐẶT LẠI MẬT KHẨU -->
      <div class="admin-dialog-overlay" id="adminDialogResetPass">
        <div class="admin-dialog-card">
          <div class="admin-dialog-head">
            <h3 class="admin-dialog-title">Đặt lại mật khẩu cho <span id="adminResetPassTargetUser" style="color:#d42525;"></span></h3>
            <button type="button" class="btn-admin-close" id="btnCloseResetPassModal" style="color:#64748b; width:28px; height:28px;" title="Đóng">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <form id="formAdminResetPass">
            <div class="admin-dialog-body">
              <div class="admin-form-group">
                <label class="admin-form-label" for="adminResetPassNewPassword">Mật khẩu mới (tối thiểu 6 ký tự) *</label>
                <input type="password" class="admin-form-input" id="adminResetPassNewPassword" placeholder="Nhập mật khẩu mới..." required minlength="6">
              </div>
              <p style="font-size:12px; color:#64748b; margin:0;">Mật khẩu mới sẽ có hiệu lực ngay lập tức. Người dùng có thể đăng nhập bằng mật khẩu này.</p>
            </div>
            <div class="admin-dialog-footer">
              <button type="button" class="btn-admin-secondary" id="btnCancelResetPassModal">Hủy bỏ</button>
              <button type="submit" class="btn-admin-primary">Cập nhật mật khẩu</button>
            </div>
          </form>
        </div>
      </div>

      <!-- IN-APP SUB-MODAL: PHÂN QUYỀN MÔN HỌC -->
      <div class="admin-dialog-overlay" id="adminDialogUserSubjects">
        <div class="admin-dialog-card">
          <div class="admin-dialog-head">
            <h3 class="admin-dialog-title">Phân quyền môn học: <span id="adminUserSubjectsTargetUser" style="color:#2563eb;"></span></h3>
            <button type="button" class="btn-admin-close" id="btnCloseUserSubjectsModal" style="color:#64748b; width:28px; height:28px;" title="Đóng">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <form id="formAdminUserSubjects">
            <div class="admin-dialog-body">
              <p style="font-size:12px; color:#64748b; margin:0 0 12px 0;">Chọn các môn học mà học viên này được phép vào làm bài thi ôn luyện:</p>
              <div class="admin-subjects-checkboxes" id="adminUserSubjectsCheckboxes"></div>
              <div style="margin-top: 10px; display: flex; gap: 8px;">
                <button type="button" class="btn-table-action btn-action-role" id="btnSelectAllUserSubjects">Chọn tất cả</button>
                <button type="button" class="btn-table-action btn-action-reset" id="btnUnselectAllUserSubjects">Bỏ chọn hết</button>
              </div>
            </div>
            <div class="admin-dialog-footer">
              <button type="button" class="btn-admin-secondary" id="btnCancelUserSubjectsModal">Hủy bỏ</button>
              <button type="submit" class="btn-admin-primary">Lưu phân quyền</button>
            </div>
          </form>
        </div>
      </div>

      <!-- IN-APP SUB-MODAL: HỘP THOẠI XÁC NHẬN (CONFIRM) -->
      <div class="admin-dialog-overlay" id="adminDialogConfirm">
        <div class="admin-dialog-card" style="max-width: 420px;">
          <div class="admin-dialog-head">
            <h3 class="admin-dialog-title" id="adminConfirmTitle">Xác nhận thao tác</h3>
            <button type="button" class="btn-admin-close" id="btnCloseConfirmModal" style="color:#64748b; width:28px; height:28px;" title="Đóng">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="admin-dialog-body">
            <p id="adminConfirmMsg" style="font-size: 13.5px; color: #334155; margin: 0; line-height: 1.5;"></p>
          </div>
          <div class="admin-dialog-footer">
            <button type="button" class="btn-admin-secondary" id="btnCancelConfirmModal">Hủy</button>
            <button type="button" class="btn-admin-primary" id="adminConfirmSubmitBtn">Xác nhận</button>
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
    const loginModal = document.getElementById("loginModal");
    const loginModalCloseBtn = document.getElementById("loginModalCloseBtn");
    const registerModal = document.getElementById("registerModal");
    const registerModalCloseBtn = document.getElementById("registerModalCloseBtn");
    const changePasswordModal = document.getElementById("changePasswordModal");
    const changePasswordModalCloseBtn = document.getElementById("changePasswordModalCloseBtn");

    const formLogin = document.getElementById("formLogin");
    const formRegister = document.getElementById("formRegister");
    const formChangePassword = document.getElementById("formChangePassword");

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

    function showAlert(msg, type = "error", targetBoxId = null) {
      let alertBox = null;
      if (targetBoxId) {
        alertBox = document.getElementById(targetBoxId);
      }
      if (!alertBox) {
        if (registerModal?.classList.contains("active")) {
          alertBox = document.getElementById("registerAlertBox");
        } else if (changePasswordModal?.classList.contains("active")) {
          alertBox = document.getElementById("changePasswordAlertBox");
        } else {
          alertBox = document.getElementById("loginAlertBox");
        }
      }
      if (!alertBox) return;

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
      ["loginAlertBox", "registerAlertBox", "changePasswordAlertBox"].forEach(id => {
        const box = document.getElementById(id);
        if (box) {
          box.className = "auth-alert";
          box.innerHTML = "";
        }
      });
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

    linkToRegister?.addEventListener("click", () => openRegisterModal());
    linkToLogin?.addEventListener("click", () => openLoginModal());
    if (linkCancelChangePwd) {
      linkCancelChangePwd.addEventListener("click", () => closeAllAuthModals());
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

    loginModalCloseBtn?.addEventListener("click", closeAllAuthModals);
    registerModalCloseBtn?.addEventListener("click", closeAllAuthModals);
    changePasswordModalCloseBtn?.addEventListener("click", closeAllAuthModals);

    loginModal?.addEventListener("click", (e) => {
      if (e.target === loginModal) closeAllAuthModals();
    });
    registerModal?.addEventListener("click", (e) => {
      if (e.target === registerModal) closeAllAuthModals();
    });
    changePasswordModal?.addEventListener("click", (e) => {
      if (e.target === changePasswordModal) closeAllAuthModals();
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

    // Admin Tabs Switcher (4 Tabs: Users, Keys, Subjects, Backup)
    const tabAdminSubjects = document.getElementById("tabAdminSubjects");
    const tabAdminBackup = document.getElementById("tabAdminBackup");
    const paneAdminSubjects = document.getElementById("paneAdminSubjects");
    const paneAdminBackup = document.getElementById("paneAdminBackup");

    function switchAdminTab(targetTab) {
      const allTabs = [tabAdminUsers, tabAdminKeys, tabAdminSubjects, tabAdminBackup];
      const allPanes = [paneAdminUsers, paneAdminKeys, paneAdminSubjects, paneAdminBackup];

      allTabs.forEach(t => t?.classList.remove("active"));
      allPanes.forEach(p => { if (p) p.style.display = "none"; });

      if (targetTab === "users") {
        tabAdminUsers?.classList.add("active");
        if (paneAdminUsers) paneAdminUsers.style.display = "block";
        renderAdminUsersTable();
      } else if (targetTab === "keys") {
        tabAdminKeys?.classList.add("active");
        if (paneAdminKeys) paneAdminKeys.style.display = "block";
        renderAdminKeysTable();
        const selSubject = document.getElementById("selAdminKeySubject");
        if (selSubject) {
          setTimeout(() => selSubject.focus(), 80);
        }
      } else if (targetTab === "subjects") {
        tabAdminSubjects?.classList.add("active");
        if (paneAdminSubjects) paneAdminSubjects.style.display = "block";
        renderAdminSubjectsGrid();
      } else if (targetTab === "backup") {
        tabAdminBackup?.classList.add("active");
        if (paneAdminBackup) paneAdminBackup.style.display = "block";
      }
    }

    switchAdminTabFn = switchAdminTab;

    tabAdminUsers?.addEventListener("click", () => switchAdminTab("users"));
    tabAdminKeys?.addEventListener("click", () => switchAdminTab("keys"));
    tabAdminSubjects?.addEventListener("click", () => switchAdminTab("subjects"));
    tabAdminBackup?.addEventListener("click", () => switchAdminTab("backup"));

    // User Role Filter Pills
    let currentUserRoleFilter = "all";
    document.querySelectorAll(".admin-filter-pill[data-role]").forEach(pill => {
      pill.addEventListener("click", () => {
        document.querySelectorAll(".admin-filter-pill[data-role]").forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        currentUserRoleFilter = pill.getAttribute("data-role");
        renderAdminUsersTable(adminSearchInput?.value || "", currentUserRoleFilter);
      });
    });

    // Key Status Filter Pills
    let currentKeyStatusFilter = "all";
    document.querySelectorAll(".admin-filter-pill[data-status]").forEach(pill => {
      pill.addEventListener("click", () => {
        document.querySelectorAll(".admin-filter-pill[data-status]").forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        currentKeyStatusFilter = pill.getAttribute("data-status");
        const selSubj = document.getElementById("selAdminKeyFilterSubject")?.value || "all";
        renderAdminKeysTable(adminSearchKeyInput?.value || "", currentKeyStatusFilter, selSubj);
      });
    });

    document.getElementById("selAdminKeyFilterSubject")?.addEventListener("change", (e) => {
      renderAdminKeysTable(adminSearchKeyInput?.value || "", currentKeyStatusFilter, e.target.value);
    });

    // Admin Gen Keys
    btnAdminGenKeys?.addEventListener("click", () => {
      const selSubj = document.getElementById("selAdminKeySubject")?.value || "toan";
      const selCount = parseInt(document.getElementById("selAdminKeyCount")?.value || "1", 10);
      const selQuota = parseInt(document.getElementById("selAdminKeyQuota")?.value || "1", 10);
      adminCreateLicenseKeys(selSubj, selCount, selQuota);
      renderAdminSummaryMetrics();
      renderAdminKeysTable(adminSearchKeyInput?.value || "", currentKeyStatusFilter, document.getElementById("selAdminKeyFilterSubject")?.value || "all");
    });
    // Copy Unused Keys
    document.getElementById("btnAdminCopyUnusedKeys")?.addEventListener("click", () => {
      const selSubj = document.getElementById("selAdminKeyFilterSubject")?.value || "all";
      adminCopyUnusedKeys(selSubj);
    });

    // Export Keys TXT
    document.getElementById("btnAdminExportKeysTxt")?.addEventListener("click", () => {
      adminExportKeys("txt");
    });

    // Backup & Restore
    document.getElementById("btnAdminExportBackup")?.addEventListener("click", adminExportDataBackup);
    const fileBackupInput = document.getElementById("fileAdminBackupInput");
    document.getElementById("btnAdminImportBackup")?.addEventListener("click", () => {
      fileBackupInput?.click();
    });
    fileBackupInput?.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        adminImportDataBackup(evt.target.result);
      };
      reader.readAsText(file);
      e.target.value = "";
    });

    // Live Search
    adminSearchInput?.addEventListener("input", (e) => {
      renderAdminUsersTable(e.target.value, currentUserRoleFilter);
    });

    adminSearchKeyInput?.addEventListener("input", (e) => {
      const selSubj = document.getElementById("selAdminKeyFilterSubject")?.value || "all";
      renderAdminKeysTable(e.target.value, currentKeyStatusFilter, selSubj);
    });

    // In-App Create User Dialog
    btnAdminCreateUser?.addEventListener("click", openAdminCreateUserDialog);
    document.getElementById("btnCloseCreateUserModal")?.addEventListener("click", closeAdminCreateUserDialog);
    document.getElementById("btnCancelCreateUserModal")?.addEventListener("click", closeAdminCreateUserDialog);

    document.getElementById("formAdminCreateUser")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const uVal = document.getElementById("adminNewUserUsername")?.value.trim();
      const pVal = document.getElementById("adminNewUserPassword")?.value;
      const rVal = document.getElementById("adminNewUserRole")?.value || "student";

      if (!uVal) {
        showToast("Vui lòng nhập tên tài khoản!", "error");
        return;
      }
      if (!pVal || pVal.length < 6) {
        showToast("Mật khẩu phải từ 6 ký tự trở lên!", "error");
        return;
      }

      const users = getAllUsers();
      const normKey = uVal.toLowerCase();
      if (users[normKey]) {
        showToast("Tên tài khoản này đã tồn tại!", "error");
        return;
      }

      // Collect checked subjects
      const checkedBoxes = document.querySelectorAll("input[name='newUserSubject']:checked");
      let selectedSubjects = Array.from(checkedBoxes).map(cb => cb.value);
      if (rVal === "admin") {
        selectedSubjects = ["all"];
      }

      const passwordHash = await hashPassword(pVal);
      users[normKey] = {
        username: uVal,
        fullName: uVal,
        role: rVal,
        passwordHash: passwordHash,
        unlockedSubjects: selectedSubjects,
        createdAt: new Date().toISOString()
      };
      saveAllUsers(users);

      showToast(`Đã tạo thành công tài khoản @${uVal} (${rVal === "admin" ? "Quản trị viên" : "Học viên"})!`, "success");
      closeAdminCreateUserDialog();
      renderAdminSummaryMetrics();
      renderAdminUsersTable(adminSearchInput?.value || "", currentUserRoleFilter);
    });

    // In-App Reset Password Dialog
    document.getElementById("btnCloseResetPassModal")?.addEventListener("click", closeAdminResetPassDialog);
    document.getElementById("btnCancelResetPassModal")?.addEventListener("click", closeAdminResetPassDialog);
    document.getElementById("formAdminResetPass")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const targetUser = document.getElementById("adminDialogResetPass")?.getAttribute("data-target-user");
      const newPassword = document.getElementById("adminResetPassNewPassword")?.value;
      if (!targetUser) return;
      if (!newPassword || newPassword.length < 6) {
        showToast("Mật khẩu mới phải từ 6 ký tự trở lên!", "error");
        return;
      }
      const ok = await adminResetPassword(targetUser, newPassword);
      if (ok) closeAdminResetPassDialog();
    });

    // In-App User Subjects Dialog
    document.getElementById("btnCloseUserSubjectsModal")?.addEventListener("click", closeAdminUserSubjectsDialog);
    document.getElementById("btnCancelUserSubjectsModal")?.addEventListener("click", closeAdminUserSubjectsDialog);
    document.getElementById("btnSelectAllUserSubjects")?.addEventListener("click", () => {
      document.querySelectorAll("input[name='manageUserSubject']").forEach(cb => cb.checked = true);
    });
    document.getElementById("btnUnselectAllUserSubjects")?.addEventListener("click", () => {
      document.querySelectorAll("input[name='manageUserSubject']").forEach(cb => cb.checked = false);
    });
    document.getElementById("formAdminUserSubjects")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const targetUser = document.getElementById("adminDialogUserSubjects")?.getAttribute("data-target-user");
      if (!targetUser) return;
      const checkedBoxes = document.querySelectorAll("input[name='manageUserSubject']:checked");
      const selectedSubjects = Array.from(checkedBoxes).map(cb => cb.value);
      adminSetUserSubjects(targetUser, selectedSubjects);
      closeAdminUserSubjectsDialog();
    });

    // In-App Confirm Dialog
    document.getElementById("btnCloseConfirmModal")?.addEventListener("click", closeAdminConfirmDialog);
    document.getElementById("btnCancelConfirmModal")?.addEventListener("click", closeAdminConfirmDialog);
    document.getElementById("adminConfirmSubmitBtn")?.addEventListener("click", () => {
      if (typeof activeConfirmCallback === "function") {
        activeConfirmCallback();
      }
      closeAdminConfirmDialog();
    });

    // Close in-app sub-dialogs when clicking backdrop
    document.querySelectorAll(".admin-dialog-overlay").forEach(overlay => {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          overlay.classList.remove("active");
          if (overlay.id === "adminDialogConfirm") {
            activeConfirmCallback = null;
          }
        }
      });
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const activeSubDialog = document.querySelector(".admin-dialog-overlay.active");
        if (activeSubDialog) {
          activeSubDialog.classList.remove("active");
          activeConfirmCallback = null;
          return;
        }
        closeAllAuthModals();
        if (adminModal && adminModal.classList.contains("active")) closeAdminPanel();
        if (activateKeyModal && activateKeyModal.classList.contains("active")) closeActivateKeyModal();
      }
    });

    // Submit ĐĂNG NHẬP
    formLogin?.addEventListener("submit", async (e) => {
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
        showAlert(res.message, "error", "loginAlertBox");
      } else {
        showAlert(res.message, "success", "loginAlertBox");
        showToast(res.message, "success");
        setTimeout(() => closeAllAuthModals(), 600);
      }
    });

    // Submit ĐĂNG KÝ
    formRegister?.addEventListener("submit", async (e) => {
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
        showAlert(res.message, "error", "registerAlertBox");
      } else {
        showAlert(res.message, "success", "registerAlertBox");
        showToast(res.message, "success");
        setTimeout(() => closeAllAuthModals(), 800);
      }
    });

    // Submit ĐỔI MẬT KHẨU
    formChangePassword?.addEventListener("submit", async (e) => {
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
        showAlert(res.message, "error", "changePasswordAlertBox");
      } else {
        showAlert(res.message, "success", "changePasswordAlertBox");
        showToast("Đổi mật khẩu thành công!", "success");
        setTimeout(() => closeAllAuthModals(), 800);
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

  function closeAllAuthModals() {
    ["loginModal", "registerModal", "changePasswordModal"].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.classList.remove("active");
        el.setAttribute("aria-hidden", "true");
      }
    });
    const authModal = document.getElementById("authModal");
    if (authModal) {
      authModal.classList.remove("active");
      authModal.setAttribute("aria-hidden", "true");
    }
  }

  function closeModal() {
    closeAllAuthModals();
  }

  function openLoginModal() {
    injectAuthModal();
    closeAllAuthModals();
    const modal = document.getElementById("loginModal");
    if (!modal) return;
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    const alertBox = document.getElementById("loginAlertBox");
    if (alertBox) {
      alertBox.className = "auth-alert";
      alertBox.innerHTML = "";
    }
    setTimeout(() => document.getElementById("loginUsername")?.focus(), 150);
  }

  function openRegisterModal() {
    injectAuthModal();
    closeAllAuthModals();
    const modal = document.getElementById("registerModal");
    if (!modal) return;
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    const alertBox = document.getElementById("registerAlertBox");
    if (alertBox) {
      alertBox.className = "auth-alert";
      alertBox.innerHTML = "";
    }

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
    setTimeout(() => document.getElementById("regUsername")?.focus(), 150);
  }

  function openChangePasswordModal() {
    injectAuthModal();
    closeAllAuthModals();
    const modal = document.getElementById("changePasswordModal");
    if (!modal) return;
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    const alertBox = document.getElementById("changePasswordAlertBox");
    if (alertBox) {
      alertBox.className = "auth-alert";
      alertBox.innerHTML = "";
    }
    setTimeout(() => document.getElementById("changeOldPassword")?.focus(), 150);
  }

  function openModal(tab = "login") {
    if (tab === "register") {
      openRegisterModal();
    } else if (tab === "changePassword") {
      openChangePasswordModal();
    } else {
      openLoginModal();
    }
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
   * ADMIN PANEL MODAL CONTROLS & RENDERING
   */
  function openAdminPanel(targetTab = "users") {
    if (!isAdmin()) {
      showToast("Vui lòng đăng nhập tài khoản Quản trị viên (@admin hoặc @tdka) để mở Bảng quản trị!", "info");
      openLoginModal();
      return;
    }

    // Nếu đang ở trang chuyên dụng admin.html, chuyển tab trực tiếp trên trang
    const onPageTab = document.getElementById("dashTab" + (targetTab.charAt(0).toUpperCase() + targetTab.slice(1)));
    if (onPageTab) {
      onPageTab.click();
      onPageTab.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }

    injectAuthModal();
    const adminModal = document.getElementById("adminModal");
    if (!adminModal) return;

    renderAdminSummaryMetrics();
    renderAdminUsersTable();
    renderAdminKeysTable();
    renderAdminSubjectsGrid();
    adminModal.classList.add("active");
    adminModal.setAttribute("aria-hidden", "false");

    if (typeof switchAdminTabFn === "function") {
      switchAdminTabFn(targetTab);
    }
  }

  function closeAdminPanel() {
    const adminModal = document.getElementById("adminModal");
    if (!adminModal) return;
    adminModal.classList.remove("active");
    adminModal.setAttribute("aria-hidden", "true");
  }

  function renderAdminSummaryMetrics() {
    const users = getAllUsers();
    const keys = getAllLicenseKeys();
    const userKeys = Object.keys(users);
    const keyCodes = Object.keys(keys);

    let totalUsers = userKeys.length;
    let adminCount = 0;
    let studentCount = 0;
    userKeys.forEach(k => {
      if (users[k].role === "admin") adminCount++;
      else studentCount++;
    });

    let totalKeys = keyCodes.length;
    let fullyUsedKeys = 0;
    let totalSlots = 0;
    let usedSlots = 0;
    keyCodes.forEach(c => {
      const k = keys[c];
      totalSlots += k.maxActivations;
      usedSlots += k.usedCount;
      if (k.usedCount >= k.maxActivations) fullyUsedKeys++;
    });
    let unusedKeys = totalKeys - fullyUsedKeys;
    let usagePercent = totalSlots > 0 ? Math.round((usedSlots / totalSlots) * 100) : 0;

    const elTotalUsers = document.getElementById("statTotalUsers");
    const elAdminUsers = document.getElementById("statAdminUsers");
    const elStudentUsers = document.getElementById("statStudentUsers");
    const elBadgeUsersCount = document.getElementById("adminBadgeUsersCount");
    if (elTotalUsers) elTotalUsers.textContent = totalUsers;
    if (elAdminUsers) elAdminUsers.textContent = adminCount;
    if (elStudentUsers) elStudentUsers.textContent = studentCount;
    if (elBadgeUsersCount) elBadgeUsersCount.textContent = totalUsers;

    const elTotalKeys = document.getElementById("statTotalKeys");
    const elUnusedKeys = document.getElementById("statUnusedKeys");
    const elUsedKeys = document.getElementById("statUsedKeys");
    const elKeyUsageRate = document.getElementById("statKeyUsageRate");
    const elBadgeKeysCount = document.getElementById("adminBadgeKeysCount");
    if (elTotalKeys) elTotalKeys.textContent = totalKeys;
    if (elUnusedKeys) elUnusedKeys.textContent = unusedKeys;
    if (elUsedKeys) elUsedKeys.textContent = usedKeys;
    if (elKeyUsageRate) elKeyUsageRate.textContent = `${usagePercent}%`;
    if (elBadgeKeysCount) elBadgeKeysCount.textContent = totalKeys;

    const activeSubjects = SUBJECTS.filter(s => s.id !== "all");
    const elTotalSubjects = document.getElementById("statTotalSubjects");
    if (elTotalSubjects) elTotalSubjects.textContent = activeSubjects.length;

    const elSubjectsMeta = document.getElementById("statSubjectsMeta");
    if (elSubjectsMeta) {
      let populated = [];
      activeSubjects.forEach(s => {
        let qCount = 0;
        let tCount = 0;
        if (window.KeduQuestionManager && typeof window.KeduQuestionManager.getQuestions === "function") {
          qCount = window.KeduQuestionManager.getQuestions({ subjectId: s.id }).length;
          tCount = window.KeduQuestionManager.getTopics(s.id).length;
        } else if (window.KEDU_DATABASE_DATA) {
          qCount = (window.KEDU_DATABASE_DATA.questions || []).filter(q => q.subject_id === s.id).length;
          tCount = (window.KEDU_DATABASE_DATA.topics || []).filter(t => t.subject_id === s.id).length;
        }
        if (qCount > 0) {
          populated.push(`${s.name.replace(" 12", "")} (${tCount} đề - ${qCount} câu)`);
        }
      });
      if (populated.length > 0) {
        const remaining = activeSubjects.length - populated.length;
        const remainingStr = remaining > 0 ? ` • ${remaining} môn đang cập nhật` : "";
        elSubjectsMeta.textContent = populated.join(" • ") + remainingStr;
      } else {
        elSubjectsMeta.textContent = "Chưa có đề nào trong hệ thống";
      }
    }
  }

  function openAdminCreateUserDialog() {
    const overlay = document.getElementById("adminDialogCreateUser");
    if (!overlay) return;
    const uInput = document.getElementById("adminNewUserUsername");
    const pInput = document.getElementById("adminNewUserPassword");
    const rSelect = document.getElementById("adminNewUserRole");
    if (uInput) uInput.value = "";
    if (pInput) pInput.value = "";
    if (rSelect) rSelect.value = "student";

    const chkContainer = document.getElementById("adminNewUserSubjectsList");
    if (chkContainer) {
      chkContainer.innerHTML = SUBJECTS.map(s => `
        <label class="admin-checkbox-label">
          <input type="checkbox" name="newUserSubject" value="${s.id}">
          <span>${s.name}</span>
        </label>
      `).join("");
    }
    overlay.classList.add("active");
    setTimeout(() => uInput?.focus(), 100);
  }

  function closeAdminCreateUserDialog() {
    const overlay = document.getElementById("adminDialogCreateUser");
    if (overlay) overlay.classList.remove("active");
  }

  function openAdminResetPassDialog(targetUsername) {
    const overlay = document.getElementById("adminDialogResetPass");
    if (!overlay) return;
    const userLabel = document.getElementById("adminResetPassTargetUser");
    const pInput = document.getElementById("adminResetPassNewPassword");
    if (userLabel) userLabel.textContent = `@${targetUsername}`;
    if (pInput) pInput.value = "";
    overlay.setAttribute("data-target-user", targetUsername);
    overlay.classList.add("active");
    setTimeout(() => pInput?.focus(), 100);
  }

  function closeAdminResetPassDialog() {
    const overlay = document.getElementById("adminDialogResetPass");
    if (overlay) overlay.classList.remove("active");
  }

  function openAdminUserSubjectsDialog(targetUsername) {
    const overlay = document.getElementById("adminDialogUserSubjects");
    if (!overlay) return;
    const users = getAllUsers();
    const u = users[targetUsername.toLowerCase()];
    if (!u) return;

    const userLabel = document.getElementById("adminUserSubjectsTargetUser");
    if (userLabel) userLabel.textContent = `@${targetUsername}`;
    overlay.setAttribute("data-target-user", targetUsername);

    const container = document.getElementById("adminUserSubjectsCheckboxes");
    if (container) {
      const unlocked = u.unlockedSubjects || [];
      const hasAll = unlocked.includes("all") || u.role === "admin";
      container.innerHTML = SUBJECTS.map(s => {
        const isChecked = hasAll || unlocked.includes(s.id);
        return `
          <label class="admin-checkbox-label">
            <input type="checkbox" name="manageUserSubject" value="${s.id}" ${isChecked ? 'checked' : ''} ${u.role === "admin" ? 'disabled' : ''}>
            <span>${s.name}</span>
          </label>
        `;
      }).join("");
    }
    overlay.classList.add("active");
  }

  function closeAdminUserSubjectsDialog() {
    const overlay = document.getElementById("adminDialogUserSubjects");
    if (overlay) overlay.classList.remove("active");
  }

  function renderAdminUsersTable(keyword = "", roleFilter = "all") {
    const tbody = document.getElementById("adminUsersTableBody");
    if (!tbody) return;

    const users = getAllUsers();
    const currentUser = getCurrentUser();
    let userKeys = Object.keys(users);

    const kw = (keyword || "").toLowerCase().trim();
    if (kw) {
      userKeys = userKeys.filter(k => users[k].username.toLowerCase().includes(kw));
    }

    if (roleFilter && roleFilter !== "all") {
      userKeys = userKeys.filter(k => users[k].role === roleFilter);
    }

    if (userKeys.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 32px; color: #94a3b8; font-weight: 500;">Không tìm thấy tài khoản người dùng nào phù hợp</td></tr>`;
      return;
    }

    tbody.innerHTML = userKeys.map(k => {
      const u = users[k];
      const isMe = currentUser && currentUser.username.toLowerCase() === u.username.toLowerCase();
      const isAdminRole = u.role === "admin";
      const initial = escapeHTML((u.username || "U").charAt(0).toUpperCase());
      const hasPhoto = !!u.avatar;
      const avatarHTML = hasPhoto
        ? `<img src="${escapeHTML(u.avatar)}" alt="${escapeHTML(u.username)}" class="user-avatar-photo" onerror="this.parentElement.innerHTML='${initial}';">`
        : (isAdminRole 
            ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>`
            : initial);

      const unlockedChips = (u.unlockedSubjects && u.unlockedSubjects.length > 0)
        ? u.unlockedSubjects.map(s => {
            const sub = getSubjectById(s);
            return `<span class="admin-subject-chip">${sub ? sub.name : s}</span>`;
          }).join(" ")
        : `<span style="font-size:11px; color:#94a3b8;">Chưa mở khóa môn nào</span>`;

      return `
        <tr>
          <td>
            <div class="admin-user-cell">
              <div class="admin-user-avatar ${hasPhoto ? 'has-photo' : ''} ${isAdminRole ? 'is-admin' : ''}">
                ${avatarHTML}
              </div>
              <div>
                <div style="display:flex; align-items:center; gap:4px; flex-wrap:wrap;">
                  <strong style="color: #0f2657;">@${escapeHTML(u.username)}</strong>
                  ${isMe ? '<span style="font-size:10px; background:#eff6ff; color:#2563eb; padding:1px 5px; border-radius:4px; font-weight:700;">(Bạn)</span>' : ''}
                </div>
                ${u.email ? `<div style="font-size:11px; color:#64748b; margin-top:1px;">${escapeHTML(u.email)}</div>` : ''}
              </div>
            </div>
          </td>
          <td>
            <span class="user-role-badge ${isAdminRole ? 'role-admin' : 'role-student'}">
              ${isAdminRole
                ? `<svg class="role-badge-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg><span>Quản trị viên</span>`
                : `<svg class="role-badge-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg><span>Học viên</span>`}
            </span>
          </td>
          <td>
            <div style="display:flex; flex-wrap:wrap; gap:4px;">
              ${isAdminRole ? '<span style="font-size:11px; color:#b45309; font-weight:700;">Toàn quyền (Tất cả 6 môn THPT)</span>' : unlockedChips}
            </div>
          </td>
          <td style="text-align: right;">
            <div class="admin-action-btn-group">
              <button type="button" class="btn-row-action role btn-action-role" data-user="${escapeHTML(u.username)}" data-current-role="${u.role || 'student'}" ${isMe ? 'disabled style="opacity:0.4; cursor:not-allowed;" title="Không thể tự đổi quyền của chính mình"' : 'title="Đổi quyền Admin / Học viên"'}>
                ${isAdminRole ? 'Hạ quyền' : 'Cấp Admin'}
              </button>
              ${!isAdminRole ? `
                <button type="button" class="btn-row-action subjects btn-action-subjects" data-user="${escapeHTML(u.username)}" title="Cấp quyền môn học trực tiếp">
                  Phân quyền môn
                </button>
              ` : ''}
              <button type="button" class="btn-row-action reset btn-action-reset" data-user="${escapeHTML(u.username)}" title="Đặt lại mật khẩu">
                Đổi MK
              </button>
              ${!isMe ? `
                <button type="button" class="btn-row-action danger btn-action-delete" data-user="${escapeHTML(u.username)}" title="Xóa tài khoản này">
                  Xóa
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join("");

    tbody.querySelectorAll(".btn-action-role").forEach(btn => {
      btn.addEventListener("click", () => {
        const uName = btn.getAttribute("data-user");
        const curRole = btn.getAttribute("data-current-role");
        const targetRole = curRole === "admin" ? "student" : "admin";
        showAdminConfirmDialog({
          title: "Đổi vai trò người dùng",
          message: targetRole === "admin" 
            ? `Bạn có chắc chắn muốn cấp quyền <strong>Quản trị viên (Admin)</strong> cho <strong>@${escapeHTML(uName)}</strong>? Tài khoản này sẽ có toàn quyền can thiệp hệ thống.`
            : `Bạn có chắc muốn hạ quyền tài khoản <strong>@${escapeHTML(uName)}</strong> xuống <strong>Học viên</strong>?`,
          confirmText: targetRole === "admin" ? "Cấp Admin" : "Hạ quyền",
          danger: targetRole !== "admin",
          onConfirm: () => setUserRole(uName, targetRole)
        });
      });
    });

    tbody.querySelectorAll(".btn-action-subjects").forEach(btn => {
      btn.addEventListener("click", () => {
        const uName = btn.getAttribute("data-user");
        openAdminUserSubjectsDialog(uName);
      });
    });

    tbody.querySelectorAll(".btn-action-reset").forEach(btn => {
      btn.addEventListener("click", () => {
        const uName = btn.getAttribute("data-user");
        openAdminResetPassDialog(uName);
      });
    });

    tbody.querySelectorAll(".btn-action-delete").forEach(btn => {
      btn.addEventListener("click", () => {
        const uName = btn.getAttribute("data-user");
        showAdminConfirmDialog({
          title: "Xóa tài khoản người dùng",
          message: `CẢNH BÁO: Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản <strong>@${escapeHTML(uName)}</strong>?<br><span style="color:#dc2626; font-size:12px;">Hành động này không thể hoàn tác!</span>`,
          confirmText: "Xóa vĩnh viễn",
          danger: true,
          onConfirm: () => adminDeleteUser(uName)
        });
      });
    });
  }

  function renderAdminKeysTable(keyword = "", statusFilter = "all", subjectFilter = "all") {
    const tbody = document.getElementById("adminKeysTableBody");
    if (!tbody) return;

    const keys = getAllLicenseKeys();
    let keyCodes = Object.keys(keys).reverse(); // Mới nhất lên đầu
    const kw = (keyword || "").toLowerCase().trim();

    if (kw) {
      keyCodes = keyCodes.filter(c => {
        const k = keys[c];
        const matchUsers = (k.usedBy || []).some(u => u.toLowerCase().includes(kw));
        return c.toLowerCase().includes(kw) || matchUsers || k.subjectId.toLowerCase().includes(kw);
      });
    }

    if (statusFilter === "unused") {
      keyCodes = keyCodes.filter(c => keys[c].usedCount === 0);
    } else if (statusFilter === "used") {
      keyCodes = keyCodes.filter(c => keys[c].usedCount >= keys[c].maxActivations);
    }

    if (subjectFilter && subjectFilter !== "all") {
      keyCodes = keyCodes.filter(c => keys[c].subjectId === subjectFilter);
    }

    if (keyCodes.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 32px; color: #94a3b8; font-weight: 500;">Chưa có mã key nào hoặc không tìm thấy kết quả phù hợp</td></tr>`;
      return;
    }

    tbody.innerHTML = keyCodes.map(c => {
      const k = keys[c];
      const subj = getSubjectById(k.subjectId);
      const subjName = subj ? subj.name : (k.subjectId === "all" ? "Tất cả môn" : k.subjectId);
      const pct = Math.min(100, Math.round((k.usedCount / k.maxActivations) * 100));
      const barColor = k.usedCount >= k.maxActivations ? "#64748b" : (k.usedCount > 0 ? "#2563eb" : "#10b981");

      let statusBadge = "";
      if (k.usedCount === 0) {
        statusBadge = `<span class="key-status-pill key-status-unused">● Chưa dùng</span>`;
      } else if (k.usedCount < k.maxActivations) {
        statusBadge = `<span class="key-status-pill" style="background:#eff6ff; color:#2563eb; border:1px solid #bfdbfe;">● Đang dùng (${k.usedCount}/${k.maxActivations})</span>`;
      } else {
        statusBadge = `<span class="key-status-pill key-status-used">● Hết lượt (${k.usedCount}/${k.maxActivations})</span>`;
      }

      let accountsHTML = "";
      if (k.usedBy && k.usedBy.length > 0) {
        accountsHTML = `
          <div style="display:flex; flex-wrap:wrap; gap:4px; max-width:200px;">
            ${k.usedBy.map(u => `
              <span style="display:inline-flex; align-items:center; background:#f8fafc; border:1px solid #e2e8f0; border-radius:4px; padding:1px 6px; font-size:11px; font-weight:600; color:#1e293b;">
                @${escapeHTML(u)}
              </span>
            `).join("")}
          </div>
        `;
      } else {
        accountsHTML = `<span style="color: #94a3b8; font-size: 12px;">—</span>`;
      }

      return `
        <tr>
          <td>
            <div style="display:flex; align-items:center; gap:6px;">
              <span class="admin-key-badge">${escapeHTML(k.code)}</span>
              <button type="button" class="btn-copy-chip btn-copy-key-icon" data-code="${escapeHTML(k.code)}" title="Sao chép mã Key">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </button>
            </div>
          </td>
          <td>
            <span style="font-weight: 700; color: #0f2657;">${escapeHTML(subjName)}</span>
          </td>
          <td>
            ${statusBadge}
          </td>
          <td>
            <div style="min-width: 100px;">
              <div style="display:flex; justify-content:space-between; font-size:11px; font-weight:700; margin-bottom:2px;">
                <span style="color:${barColor};">${k.usedCount}/${k.maxActivations} TK</span>
                <span style="color:#94a3b8; font-weight:500;">${pct}%</span>
              </div>
              <div style="width:100%; height:5px; background:#e2e8f0; border-radius:999px; overflow:hidden;">
                <div style="width:${pct}%; height:100%; background:${barColor}; border-radius:999px;"></div>
              </div>
            </div>
          </td>
          <td>
            ${accountsHTML}
          </td>
          <td style="text-align: right;">
            <div class="admin-action-btn-group">
              <button type="button" class="btn-row-action role btn-copy-key" data-code="${escapeHTML(k.code)}" title="Sao chép mã Key">
                Copy
              </button>
              <button type="button" class="btn-row-action danger btn-del-key" data-code="${escapeHTML(k.code)}" title="Xóa mã Key">
                Xóa
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    const handleCopy = (code) => {
      navigator.clipboard.writeText(code).then(() => {
        showToast(`Đã sao chép mã Key: ${code}`, "success");
      }).catch(() => {
        prompt("Mã key:", code);
      });
    };

    tbody.querySelectorAll(".btn-copy-key").forEach(btn => {
      btn.addEventListener("click", () => handleCopy(btn.getAttribute("data-code")));
    });

    tbody.querySelectorAll(".btn-copy-key-icon").forEach(btn => {
      btn.addEventListener("click", () => handleCopy(btn.getAttribute("data-code")));
    });

    tbody.querySelectorAll(".btn-del-key").forEach(btn => {
      btn.addEventListener("click", () => {
        const code = btn.getAttribute("data-code");
        showAdminConfirmDialog({
          title: "Xóa mã Key",
          message: `Bạn có chắc chắn muốn xóa mã key <strong>${code}</strong> khỏi hệ thống?`,
          confirmText: "Xóa Key",
          danger: true,
          onConfirm: () => {
            adminDeleteLicenseKey(code);
            renderAdminSummaryMetrics();
          }
        });
      });
    });
  }

  function renderAdminSubjectsGrid() {
    const container = document.getElementById("adminSubjectsGridContainer");
    if (!container) return;

    container.innerHTML = SUBJECTS.filter(s => s.id !== "all").map(s => {
      let qCount = 0;
      let tCount = 0;
      if (window.KeduQuestionManager && typeof window.KeduQuestionManager.getQuestions === "function") {
        qCount = window.KeduQuestionManager.getQuestions({ subjectId: s.id }).length;
        tCount = window.KeduQuestionManager.getTopics(s.id).length;
      } else if (window.KEDU_DATABASE_DATA) {
        qCount = (window.KEDU_DATABASE_DATA.questions || []).filter(q => q.subject_id === s.id).length;
        tCount = (window.KEDU_DATABASE_DATA.topics || []).filter(t => t.subject_id === s.id).length;
      }
      const isPopulated = qCount > 0;
      const metaText = isPopulated ? `${tCount} đề • ${qCount} câu hỏi thật` : 'Chưa cập nhật đề';
      return `
        <div class="admin-subject-card">
          <div class="admin-subject-card-head">
            <div>
              <h4 class="admin-subject-card-title">
                <span class="adm-subj-icon-wrap">${getSubjectIconSvg(s.id)}</span>
                <span>${s.name}</span>
              </h4>
              <div class="admin-subject-card-meta">${metaText}</div>
            </div>
            <span class="key-status-pill ${isPopulated ? 'key-status-unused' : 'key-status-used'}">
              ${isPopulated ? '● Đã có đề' : '● Đang soạn đề'}
            </span>
          </div>
          <div class="admin-subject-card-foot">
            <a href="${isSubPage ? s.page : 'pages/' + s.page}" class="btn-table-action btn-action-role" style="text-decoration:none;">
              Xem trang ↗
            </a>
            <button type="button" class="btn-table-action btn-action-reset btn-quick-gen-keys" data-subject="${s.id}">
              + Tạo 5 Key
            </button>
          </div>
        </div>
      `;
    }).join("");

    container.querySelectorAll(".btn-quick-gen-keys").forEach(btn => {
      btn.addEventListener("click", () => {
        const subId = btn.getAttribute("data-subject");
        adminCreateLicenseKeys(subId, 5);
        renderAdminSummaryMetrics();
        renderAdminKeysTable();
      });
    });
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
    const isUserAdmin = currentUser && currentUser.role === "admin";

    // Phân quyền hiển thị các liên kết quản trị đề & đáp án trên thanh điều hướng
    if (isUserAdmin) {
      document.body.classList.add("is-admin-session");
      document.querySelectorAll(".admin-only-nav, [data-admin-only='true'], a[href*='quan-ly-de']").forEach(el => {
        el.style.setProperty("display", "inline-flex", "important");
      });
    } else {
      document.body.classList.remove("is-admin-session");
      document.querySelectorAll(".admin-only-nav, [data-admin-only='true'], a[href*='quan-ly-de']").forEach(el => {
        el.style.setProperty("display", "none", "important");
      });
    }

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

      document.getElementById("btnNavLogin")?.addEventListener("click", () => openLoginModal());
      document.getElementById("btnNavRegister")?.addEventListener("click", () => openRegisterModal());
    } else {
      // Đã đăng nhập
      const userIsAdmin = currentUser.role === "admin";
      const displayName = currentUser.username;

      // Icon Avatar chuẩn SVG theo UI/UX Design System (loại bỏ emoji thô sơ)
      const adminCrownSvgSmall = `
        <svg class="avatar-crown-svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>
        </svg>
      `;

      const adminCrownSvgLarge = `
        <svg class="avatar-crown-svg-lg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>
        </svg>
      `;

      const studentInitial = escapeHTML((currentUser.username || "U").charAt(0).toUpperCase());
      const hasPhoto = !!currentUser.avatar;

      const avatarContentSmall = hasPhoto
        ? `<img src="${escapeHTML(currentUser.avatar)}" alt="${escapeHTML(displayName)}" class="user-avatar-photo" onerror="this.style.display='none';">`
        : (userIsAdmin ? adminCrownSvgSmall : `<span>${studentInitial}</span>`);

      const avatarContentLarge = hasPhoto
        ? `<img src="${escapeHTML(currentUser.avatar)}" alt="${escapeHTML(displayName)}" class="user-avatar-photo-lg" onerror="this.style.display='none';">`
        : (userIsAdmin ? adminCrownSvgLarge : `<span>${studentInitial}</span>`);

      const emailHTML = currentUser.email ? `<div class="user-dropdown-email" title="${escapeHTML(currentUser.email)}">${escapeHTML(currentUser.email)}</div>` : "";

      // Role Badge chuẩn SVG
      const roleBadgeHTML = userIsAdmin
        ? `<span class="user-role-badge role-admin">
            <svg class="role-badge-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>
            <span>Quản trị viên</span>
          </span>`
        : `<span class="user-role-badge role-student">
            <svg class="role-badge-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
            <span>Học viên</span>
          </span>`;

      authSlot.innerHTML = `
        <div class="user-menu-wrapper" id="userMenuWrapper">
          <button type="button" class="user-profile-btn" id="userProfileBtn" title="Tài khoản cá nhân: @${escapeHTML(currentUser.username)}" aria-expanded="false">
            <span class="user-avatar-badge ${hasPhoto ? 'has-photo' : ''} ${userIsAdmin ? 'is-admin' : ''}">${avatarContentSmall}</span>
            <span class="user-display-name">${escapeHTML(displayName)}</span>
            <svg class="user-chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </button>

          <div class="user-dropdown-panel" id="userDropdownPanel">
            <div class="user-dropdown-header">
              <div class="user-dropdown-avatar-lg ${hasPhoto ? 'has-photo' : ''} ${userIsAdmin ? 'is-admin' : ''}">${avatarContentLarge}</div>
              <div class="user-dropdown-meta">
                <div class="user-dropdown-username">@${escapeHTML(displayName)}</div>
                ${emailHTML}
                <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-top:3px;">
                  ${roleBadgeHTML}
                </div>
              </div>
            </div>

            <ul class="user-dropdown-list">
              ${userIsAdmin ? `
                <li>
                  <button type="button" class="user-dropdown-item-btn item-admin" id="btnAdminOpenPanel" title="Mở Bảng quản trị hệ thống">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    <span>Bảng Quản Trị</span>
                  </button>
                </li>
                <li>
                  <button type="button" class="user-dropdown-item-btn item-admin" id="btnAdminOpenKeys" title="Mở công cụ Tạo Key bản quyền">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="7.5" cy="15.5" r="4.5"/><path d="m21 3-9.5 9.5"/><path d="m15.5 7.5 3 3"/><path d="M14 3h7v7"/></svg>
                    <span>Tạo Key</span>
                  </button>
                </li>
                <li>
                  <a href="${isSubPage ? 'quan-ly-de.html' : 'pages/quan-ly-de.html'}" class="user-dropdown-item-btn item-admin" id="btnAdminOpenExamManager" title="Quản lý ngân hàng đề thi & đáp án chuẩn" style="text-decoration:none;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10M6 10h10M6 14h6"/></svg>
                    <span>Quản Lý Đề & Đáp Án</span>
                  </a>
                </li>
              ` : ''}
              ${!userIsAdmin ? `
                <li>
                  <button type="button" class="user-dropdown-item-btn" id="btnUserOpenQuizHistory" title="Xem lịch sử các lần làm bài thi của bạn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span>Lịch sử làm bài</span>
                  </button>
                </li>
                <li>
                  <button type="button" class="user-dropdown-item-btn" id="btnUserOpenActivateKey" title="Kích hoạt mã môn học">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-1.5 1.5L14 9l-1.5-1.5L11 9l-1.5-1.5L8 9l-4.5 4.5a3 3 0 1 0 4.24 4.24L12 13.5l1.5 1.5 1.5-1.5 1.5 1.5 3.5-3.5a3 3 0 0 0-4.24-4.24z"/></svg>
                    <span>Kích hoạt môn học</span>
                  </button>
                </li>
              ` : ''}
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
        openAdminPanel("users");
      });

      document.getElementById("btnAdminOpenKeys")?.addEventListener("click", () => {
        dropdownPanel.classList.remove("show");
        profileBtn.classList.remove("active");
        openAdminPanel("keys");
      });

      document.getElementById("btnUserOpenQuizHistory")?.addEventListener("click", () => {
        dropdownPanel.classList.remove("show");
        profileBtn.classList.remove("active");
        if (window.KeduQuizHistory) {
          window.KeduQuizHistory.openModal();
        } else if (window.openQuizHistoryModal) {
          window.openQuizHistoryModal();
        }
      });

      document.getElementById("btnUserOpenActivateKey")?.addEventListener("click", () => {
        dropdownPanel.classList.remove("show");
        profileBtn.classList.remove("active");
        openActivateKeyModal();
      });

      document.getElementById("btnUserChangePassword")?.addEventListener("click", () => {
        dropdownPanel.classList.remove("show");
        profileBtn.classList.remove("active");
        openChangePasswordModal();
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
    normalizeKey,
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
    openLoginModal,
    openRegisterModal,
    openChangePasswordModal,
    closeAllAuthModals,
    openActivateKeyModal,
    closeActivateKeyModal,
    openAdminPanel,
    closeAdminPanel,
    getAllUsers,
    getAllLicenseKeys,
    SUBJECTS,
    getSubjectById,
    getSubjectIconSvg,
    setUserRole,
    adminSetUserSubjects,
    adminCreateLicenseKeys,
    adminDeleteLicenseKey,
    adminCopyUnusedKeys,
    adminExportKeys,
    adminExportDataBackup,
    adminImportDataBackup,
    adminResetPassword,
    adminDeleteUser,
    showToast
  };
})();
