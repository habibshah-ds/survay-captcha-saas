// public/widget/captcha-adjustable.js
(function () {
  const API = window.CAPTCHA_API_BASE || "";
  const SITE_KEY = window.CAPTCHA_SITE_KEY || "";

  let challengeId = null;
  let altchaParams = null;
  let survey = null;
  let startTime = null;

  // Inject widget UI
  function injectUI() {
    const box = document.querySelector("[data-captcha-adjustable]");
    if (!box) return console.error("No container found for adjustable captcha.");

    box.innerHTML = `
      <div class="adj-wrapper">
        <div id="adj-body">
          <div class="adj-loader">Loading…</div>
        </div>
        <div id="adj-error"></div>
      </div>
    `;

    loadChallenge();
    observeResize(box);
  }

  // Resize observer for responsive behavior
  function observeResize(container) {
    const ro = new ResizeObserver(entries => {
      for (let entry of entries) {
        const width = entry.contentRect.width;
        adjustLayout(width);
      }
    });
    ro.observe(container);
  }

  function adjustLayout(width) {
    const root = document.querySelector(".adj-wrapper");
    if (!root) return;

    if (width < 280) root.classList.add("tiny");
    else root.classList.remove("tiny");

    if (width < 200) root.classList.add("micro");
    else root.classList.remove("micro");
  }

  // API helper
  async function api(method, path, body) {
    const res = await fetch(API + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + SITE_KEY
      },
      body: JSON.stringify(body || {})
    });
    return res.json();
  }

  // Load challenge
  async function loadChallenge() {
    const body = document.getElementById("adj-body");
    body.innerHTML = `<div class="adj-loader">Loading CAPTCHA…</div>`;

    const res = await api("POST", "/captcha/create", { difficulty: "easy" });

    if (!res.success) {
      showError("Failed to load CAPTCHA: " + res.error);
      return;
    }

    challengeId = res.challenge_id;
    altchaParams = res.widget.altcha;
    survey = res.widget.survey;

    renderSurvey(body);
    renderPow(body);
    renderSubmit(body);

    startTime = performance.now();
  }

  // Render survey
  function renderSurvey(body) {
    const s = document.createElement("div");
    s.className = "adj-survey";

    s.innerHTML = `<div class="adj-question">${survey.question_text}</div>`;

    if (survey.question_type === "multiple_choice") {
      const grid = document.createElement("div");
      grid.className = "adj-options-grid";

      survey.options.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "adj-option";
        btn.innerText = opt;

        btn.onclick = () => {
          grid.querySelectorAll(".adj-option").forEach(x => x.classList.remove("selected"));
          btn.classList.add("selected");
          grid.dataset.answer = opt;
        };

        grid.appendChild(btn);
      });

      s.appendChild(grid);
    }

    body.innerHTML = "";
    body.appendChild(s);
  }

  // PoW
  function renderPow(body) {
    const pow = document.createElement("div");
    pow.className = "adj-pow";

    pow.innerHTML = `<span id="adj-pow-status">Solving…</span>`;
    body.appendChild(pow);

    const worker = new Worker("/widget/pow-worker.js");
    worker.postMessage({ action: "solve", params: altchaParams });

    worker.onmessage = (ev) => {
      if (ev.data?.solution) {
        const status = document.getElementById("adj-pow-status");
        status.innerText = "✓ Verified";
        status.classList.add("ok");
        status.dataset.solution = JSON.stringify(ev.data.solution);
      }
    };
  }

  // Submit
  async function submitCaptcha() {
    const grid = document.querySelector(".adj-options-grid");
    const answer = grid.dataset.answer;

    if (!answer) {
      showError("Please select an answer.");
      return;
    }

    const pow = document.getElementById("adj-pow-status");
    if (!pow.dataset.solution) {
      showError("Still solving background puzzle…");
      return;
    }

    const solveTime = Math.floor(performance.now() - startTime);

    const res = await api("POST", "/captcha/complete", {
      challenge_id: challengeId,
      altcha_solution: JSON.parse(pow.dataset.solution),
      survey_answer: { value: answer },
      solve_time_ms: solveTime
    });

    if (!res.success) {
      showError("Verification failed: " + res.error);
      return;
    }

    window.dispatchEvent(new CustomEvent("CaptchaSolved", {
      detail: { token: res.token }
    }));

    document.getElementById("adj-body").innerHTML =
      `<div class="adj-success">✓ Verified</div>`;
  }

  function renderSubmit(body) {
    const btn = document.createElement("button");
    btn.className = "adj-submit";
    btn.innerText = "Verify Human";

    btn.onclick = submitCaptcha;

    body.appendChild(btn);
  }

  function showError(msg) {
    const e = document.getElementById("adj-error");
    e.innerText = msg;
    e.style.display = "block";
  }

  // Start widget
  window.addEventListener("DOMContentLoaded", injectUI);
})();
