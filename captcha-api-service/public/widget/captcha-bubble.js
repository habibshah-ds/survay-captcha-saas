// public/widget/captcha-bubble.js
(function () {
  const API_BASE = window.CAPTCHA_API_BASE || "";
  const SITE_KEY = window.CAPTCHA_SITE_KEY || "";

  let challengeId = null;
  let altchaParams = null;
  let survey = null;
  let startTime = null;

  // Inject Bubble HTML
  function injectUI() {
    const bubble = document.createElement("div");
    bubble.id = "captcha-bubble";

    bubble.innerHTML = `
      <div id="captcha-bubble-button">🤖</div>

      <div id="captcha-bubble-panel">
        <div id="bubble-body">
          <div class="bubble-loader">Loading…</div>
        </div>

        <div id="bubble-error"></div>
      </div>
    `;

    document.body.appendChild(bubble);

    // Toggle panel
    document.getElementById("captcha-bubble-button").onclick = togglePanel;
  }

  function togglePanel() {
    const panel = document.getElementById("captcha-bubble-panel");
    panel.classList.toggle("open");

    if (panel.classList.contains("open")) {
      loadChallenge();
    }
  }

  function showError(msg) {
    const el = document.getElementById("bubble-error");
    el.innerText = msg;
    el.style.display = "block";
  }

  // Helper API
  async function api(method, path, body) {
    const res = await fetch(API_BASE + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + SITE_KEY
      },
      body: JSON.stringify(body || {})
    });
    return res.json();
  }

  // -------------------------------
  // Load new CAPTCHA challenge
  // -------------------------------
  async function loadChallenge() {
    const bodyEl = document.getElementById("bubble-body");
    bodyEl.innerHTML = `<div class="bubble-loader">Loading CAPTCHA…</div>`;

    const res = await api("POST", "/captcha/create", { difficulty: "easy" });

    if (!res.success) {
      showError("Failed to load CAPTCHA");
      return;
    }

    challengeId = res.challenge_id;
    altchaParams = res.widget.altcha;
    survey = res.widget.survey;

    renderSurvey(bodyEl);
    renderPow(bodyEl);
    renderSubmit(bodyEl);

    startTime = performance.now();
  }

  // -------------------------------
  // Render survey section
  // -------------------------------
  function renderSurvey(bodyEl) {
    const s = document.createElement("div");
    s.className = "bubble-survey";

    const q = document.createElement("div");
    q.className = "bubble-question";
    q.innerText = survey.question_text;

    s.appendChild(q);

    if (survey.question_type === "multiple_choice") {
      survey.options.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "bubble-option";
        btn.innerText = opt;

        btn.onclick = () => {
          s.querySelectorAll(".bubble-option").forEach(b => b.classList.remove("selected"));
          btn.classList.add("selected");
          s.dataset.answer = opt;
        };

        s.appendChild(btn);
      });
    }

    bodyEl.innerHTML = "";
    bodyEl.appendChild(s);
  }

  // -------------------------------
  // Render ALTCHA PoW
  // -------------------------------
  function renderPow(bodyEl) {
    const pow = document.createElement("div");
    pow.className = "bubble-pow";
    pow.innerHTML = `<span id="bubble-pow-status">Solving…</span>`;

    bodyEl.appendChild(pow);

    const worker = new Worker("/widget/pow-worker.js");
    worker.postMessage({ action: "solve", params: altchaParams });

    worker.onmessage = (ev) => {
      if (ev.data?.solution) {
        const s = document.getElementById("bubble-pow-status");
        s.innerText = "✓ Verified";
        s.classList.add("ok");
        s.dataset.solution = JSON.stringify(ev.data.solution);
      }
    };
  }

  // -------------------------------
  // Submit CAPTCHA
  // -------------------------------
  async function submitCaptcha() {
    const surveyDiv = document.querySelector(".bubble-survey");
    const answer = surveyDiv.dataset.answer;
