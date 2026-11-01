/**
 * KEDU GLOBAL PAGE & NETWORK LOADER
 * Hệ thống loading toàn diện với Logo trung tâm & Vòng xoay quỹ đạo
 * Tự động kích hoạt khi:
 * 1. Mạng không ổn định / Mất kết nối internet (offline)
 * 2. Chuyển hướng sang một trang khác trong hệ thống
 */

(function () {
  "use strict";

  // Tránh khởi tạo lặp lại nếu script được nạp nhiều lần
  if (window.KeduLoader) return;

  const isSubPage =
    window.location.pathname.includes("/pages/") ||
    window.location.pathname.includes("\\pages\\") ||
    window.location.href.includes("/pages/");
  const logoSrc = isSubPage ? "../assets/images/logo_kedu_square.png" : "assets/images/logo_kedu_square.png";

  let loaderEl = null;
  let badgeTextEl = null;
  let titleEl = null;
  let descEl = null;
  let retryBtnEl = null;
  let isNavigating = false;
  let hideTimeout = null;

  function injectLoaderDOM() {
    if (document.getElementById("keduPageLoader")) {
      loaderEl = document.getElementById("keduPageLoader");
      badgeTextEl = document.getElementById("keduLoaderBadgeText");
      titleEl = document.getElementById("keduLoaderTitle");
      descEl = document.getElementById("keduLoaderDesc");
      retryBtnEl = document.getElementById("keduLoaderRetryBtn");
      return;
    }

    const html = `
      <div id="keduPageLoader" class="kedu-page-loader" aria-live="assertive" aria-busy="true">
        <div class="kedu-loader-card">
          <div class="kedu-loader-orbit-wrap">
            <!-- Center Circular Logo Badge -->
            <div class="kedu-loader-logo-badge">
              <img src="${logoSrc}" alt="Logo KEdu" class="kedu-loader-logo-img">
            </div>

            <!-- Rotating Orbit Rings (SVG) -->
            <svg class="kedu-loader-svg" viewBox="0 0 120 120" aria-hidden="true">
              <defs>
                <linearGradient id="keduRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#dc2626" />
                  <stop offset="60%" stop-color="#ef4444" />
                  <stop offset="100%" stop-color="#f87171" stop-opacity="0.1" />
                </linearGradient>
                <linearGradient id="keduWarnGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#d97706" />
                  <stop offset="60%" stop-color="#f59e0b" />
                  <stop offset="100%" stop-color="#fbbf24" stop-opacity="0.1" />
                </linearGradient>
                <linearGradient id="keduSuccessGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#059669" />
                  <stop offset="60%" stop-color="#10b981" />
                  <stop offset="100%" stop-color="#34d399" stop-opacity="0.1" />
                </linearGradient>
              </defs>
              <circle class="kedu-ring-track" cx="60" cy="60" r="50" fill="none" stroke-width="3" />
              <circle class="kedu-ring-spinner" cx="60" cy="60" r="50" fill="none" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="190 120" />
              <circle class="kedu-ring-counter" cx="60" cy="60" r="56" fill="none" stroke-width="1.5" stroke-dasharray="12 24" />
            </svg>
          </div>

          <div class="kedu-loader-info">
            <div class="kedu-loader-status-badge" id="keduLoaderBadge">
              <span class="kedu-loader-dot"></span>
              <span id="keduLoaderBadgeText">Đang chuyển trang</span>
            </div>
            <h4 class="kedu-loader-title" id="keduLoaderTitle">Đang chuẩn bị dữ liệu...</h4>
            <p class="kedu-loader-desc" id="keduLoaderDesc">Vui lòng chờ trong giây lát</p>
            <button type="button" class="kedu-loader-retry-btn" id="keduLoaderRetryBtn" style="display:none;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
              <span>Thử kết nối lại ngay</span>
            </button>
          </div>
        </div>
      </div>
    `;

    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container.firstElementChild);

    loaderEl = document.getElementById("keduPageLoader");
    badgeTextEl = document.getElementById("keduLoaderBadgeText");
    titleEl = document.getElementById("keduLoaderTitle");
    descEl = document.getElementById("keduLoaderDesc");
    retryBtnEl = document.getElementById("keduLoaderRetryBtn");

    retryBtnEl?.addEventListener("click", () => {
      window.KeduLoader.checkConnection();
    });
  }

  const KeduLoader = {
    /**
     * Hiển thị loading chuyển trang
     */
    showTransition: function (title = "Đang chuyển trang...", desc = "Vui lòng chờ trong giây lát") {
      injectLoaderDOM();
      if (!loaderEl) return;

      if (hideTimeout) clearTimeout(hideTimeout);
      isNavigating = true;

      loaderEl.classList.remove("is-offline", "is-recovered");
      loaderEl.classList.add("is-active");

      if (badgeTextEl) badgeTextEl.textContent = "Đang chuyển trang";
      if (titleEl) titleEl.textContent = title;
      if (descEl) descEl.textContent = desc;
      if (retryBtnEl) retryBtnEl.style.display = "none";
    },

    /**
     * Hiển thị cảnh báo mạng không ổn định / mất kết nối
     */
    showNetworkError: function (
      title = "Kết nối mạng không ổn định",
      desc = "Không thể kết nối đến máy chủ Internet. Vui lòng kiểm tra đường truyền Wi-Fi hoặc 4G."
    ) {
      injectLoaderDOM();
      if (!loaderEl) return;

      if (hideTimeout) clearTimeout(hideTimeout);

      loaderEl.classList.remove("is-recovered");
      loaderEl.classList.add("is-active", "is-offline");

      if (badgeTextEl) badgeTextEl.textContent = "Mạng không ổn định";
      if (titleEl) titleEl.textContent = title;
      if (descEl) descEl.textContent = desc;
      if (retryBtnEl) retryBtnEl.style.display = "inline-flex";
    },

    /**
     * Thông báo kết nối đã được khôi phục thành công
     */
    showNetworkRecovered: function () {
      injectLoaderDOM();
      if (!loaderEl || !loaderEl.classList.contains("is-active")) return;

      loaderEl.classList.remove("is-offline");
      loaderEl.classList.add("is-recovered");

      if (badgeTextEl) badgeTextEl.textContent = "Đã kết nối lại";
      if (titleEl) titleEl.textContent = "Kết nối đã được khôi phục!";
      if (descEl) descEl.textContent = "Hệ thống đang đồng bộ lại dữ liệu...";
      if (retryBtnEl) retryBtnEl.style.display = "none";

      hideTimeout = setTimeout(() => {
        KeduLoader.hide(200);
      }, 750);
    },

    /**
     * Kiểm tra trạng thái mạng thực tế
     */
    checkConnection: async function () {
      injectLoaderDOM();
      if (badgeTextEl) badgeTextEl.textContent = "Đang kiểm tra...";
      if (titleEl) titleEl.textContent = "Đang kiểm tra đường truyền...";
      if (retryBtnEl) retryBtnEl.disabled = true;

      let isSuccess = false;
      try {
        if (typeof navigator !== "undefined" && navigator.onLine) {
          // Thử ping nhẹ với favicon hoặc domain
          const pingUrl = (isSubPage ? "../assets/images/favicon.png" : "assets/images/favicon.png") + "?t=" + Date.now();
          const response = await fetch(pingUrl, { method: "HEAD", cache: "no-store" });
          if (response.ok || response.type === "opaque") {
            isSuccess = true;
          }
        }
      } catch (err) {
        // Fallback: nếu navigator.onLine báo true và chạy qua file://
        if (typeof navigator !== "undefined" && navigator.onLine && window.location.protocol === "file:") {
          isSuccess = true;
        }
      }

      if (isSuccess) {
        if (retryBtnEl) retryBtnEl.disabled = false;
        KeduLoader.showNetworkRecovered();
        return true;
      }

      // Vẫn không có mạng
      setTimeout(() => {
        if (retryBtnEl) retryBtnEl.disabled = false;
        KeduLoader.showNetworkError(
          "Vẫn chưa có kết nối Internet",
          "Hệ thống chưa nhận được phản hồi từ mạng. Vui lòng kiểm tra lại thiết bị hoặc bộ định tuyến."
        );
        const card = loaderEl?.querySelector(".kedu-loader-card");
        if (card) {
          card.style.animation = "none";
          void card.offsetWidth;
          card.style.animation = "keduCardShake 0.4s ease";
        }
      }, 500);
      return false;
    },

    /**
     * Ẩn loading mượt mà
     */
    hide: function (delay = 200) {
      if (!loaderEl) return;
      isNavigating = false;
      if (hideTimeout) clearTimeout(hideTimeout);

      hideTimeout = setTimeout(() => {
        loaderEl.classList.remove("is-active", "is-offline", "is-recovered");
      }, delay);
    }
  };

  window.KeduLoader = KeduLoader;

  // Tự động inject DOM ngay khi trang sẵn sàng
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectLoaderDOM);
  } else {
    injectLoaderDOM();
  }

  // Lắng nghe sự kiện chuyển trang từ các liên kết nội bộ <a>
  document.addEventListener("click", function (e) {
    const link = e.target.closest("a");
    if (!link) return;

    const href = link.getAttribute("href");
    if (!href) return;

    // Bỏ qua các liên kết neo nội bộ (#), javascript:, mailto:, tel:, mở tab mới hoặc tải file
    if (
      href.startsWith("#") ||
      href.startsWith("javascript:") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      link.target === "_blank" ||
      link.hasAttribute("download")
    ) {
      return;
    }

    // Bỏ qua nếu người dùng bấm kèm phím bổ trợ (Ctrl/Cmd/Shift/Alt) để mở tab mới
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

    try {
      const url = new URL(link.href, window.location.href);

      // Chỉ áp dụng cho liên kết nội bộ cùng domain / cùng giao thức
      const isSameOrigin =
        url.origin === window.location.origin ||
        (url.protocol === "file:" && window.location.protocol === "file:");

      if (isSameOrigin) {
        // Nếu cùng trang và chỉ đổi hash thì bỏ qua
        if (url.pathname === window.location.pathname && url.search === window.location.search) {
          return;
        }

        e.preventDefault();

        // Tùy biến thông điệp thân thiện theo đích đến
        let title = "Đang chuyển trang...";
        let desc = "Vui lòng chờ trong giây lát";
        const targetPath = url.pathname.toLowerCase();

        if (targetPath.includes("toan-hoc")) {
          title = "Đang mở môn Toán học...";
          desc = "Tải dữ liệu đề thi và công thức toán";
        } else if (targetPath.includes("vat-li")) {
          title = "Đang mở môn Vật lí...";
          desc = "Tải câu hỏi và đề thi Vật lí";
        } else if (targetPath.includes("hoa-hoc")) {
          title = "Đang mở môn Hóa học...";
          desc = "Tải đề thi và phương trình Hóa học";
        } else if (targetPath.includes("sinh-hoc")) {
          title = "Đang mở môn Sinh học...";
          desc = "Tải bộ câu hỏi trắc nghiệm Sinh học";
        } else if (targetPath.includes("tin-hoc")) {
          title = "Đang mở môn Tin học...";
          desc = "Tải đề thi kiến thức Tin học";
        } else if (targetPath.includes("lich-su")) {
          title = "Đang mở môn Lịch sử...";
          desc = "Tải tư liệu và câu hỏi ôn tập Lịch sử";
        } else if (targetPath.includes("admin")) {
          title = "Đang vào Bảng Quản Trị...";
          desc = "Khởi tạo bảng điều khiển quản trị";
        } else if (targetPath.includes("quan-ly-de")) {
          title = "Đang vào Quản Lý Đề...";
          desc = "Đồng bộ ngân hàng đề thi";
        } else if (targetPath.endsWith("index.html") || targetPath === "/" || targetPath.endsWith("/thpt/")) {
          title = "Đang về Trang Chủ...";
          desc = "Tải danh mục môn học ôn luyện";
        }

        KeduLoader.showTransition(title, desc);

        // Chuyển trang sau độ trễ 180ms để hiệu ứng xuất hiện mượt mà
        setTimeout(() => {
          window.location.href = link.href;
        }, 180);
      }
    } catch (err) {
      // Nếu lỗi URL thì cho trình duyệt chạy mặc định
    }
  });

  // Khi tải xong trang hoặc khôi phục từ bfcache
  window.addEventListener("pageshow", function () {
    KeduLoader.hide(220);
  });

  // Khi người dùng làm mới hoặc rời trang
  window.addEventListener("beforeunload", function () {
    if (!isNavigating) {
      KeduLoader.showTransition("Đang tải dữ liệu...", "Đang kết nối đến hệ thống máy chủ");
    }
  });

  // Bắt sự kiện mạng mất kết nối (Offline)
  window.addEventListener("offline", function () {
    KeduLoader.showNetworkError();
  });

  // Bắt sự kiện mạng có trở lại (Online)
  window.addEventListener("online", function () {
    KeduLoader.showNetworkRecovered();
  });

  // Tùy chỉnh: Lắng nghe sự kiện mất mạng từ các tác vụ fetch trong app
  window.addEventListener("kedu:network-error", function (e) {
    const detail = e.detail || {};
    KeduLoader.showNetworkError(detail.title, detail.desc);
  });

  // Kiểm tra ngay khi khởi động: nếu thiết bị đang offline
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    KeduLoader.showNetworkError();
  }
})();
