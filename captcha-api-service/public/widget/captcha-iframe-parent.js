// public/widget/captcha-iframe-parent.js
(function () {
  window.addEventListener("message", function (ev) {
    if (!ev.data) return;

    // Auto-resize iframe
    if (ev.data.captchaIframeHeight) {
      const iframes = document.querySelectorAll("[data-captcha-iframe]");
      iframes.forEach(f => {
        f.style.height = ev.data.captchaIframeHeight + "px";
      });
    }

    // Receive token
    if (ev.data.captchaToken) {
      window.dispatchEvent(new CustomEvent("CaptchaSolved", {
        detail: { token: ev.data.captchaToken }
      }));
    }
  });
})();
