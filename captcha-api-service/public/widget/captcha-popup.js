// public/widget/captcha-popup.js
(function () {
  const API_BASE = window.CAPTCHA_API_BASE || "";
  const SITE_KEY = window.CAPTCHA_SITE_KEY || "";

  let popupEl = null;
  let challengeId = null;
  let altchaParams = null;
  let survey = null;
  let startTime = null;

  // Helper
  function api(method, path, body) {
    return fetch(API_BASE + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + SITE_KEY
      },
      body: JSON.stringify(body || {})
    }).then(r => r.json());
  }

  function buildPopup() {
    if (popupEl) return popupEl;

    popupEl = document.createElement("div");
    popupEl.id = "captcha-popup";

    popupEl.innerHTML = `
      <div class="captcha-popup-backdrop"></div>
      <div class="captcha-popup-content">
        <div id="captcha-popup-body">
          <div class="loader">Loading CAPTCHA…</div>
        </div>
        <div id="captcha-popup-error"></div>
      </div>
    `;

    document.body.appendChild(popupEl);

    popupEl.querySelector(".captcha-popup-backdrop").onclick = closePopup;

    return popupEl;
  }

  function openPopup() {
    const el = buildPopup();
    el.classList.add("visible");
    loadChallenge();
  }

  function closePopup() {
    if (popupEl) popupEl.classList.remove("visible");
  }

  function showError(msg) {
    const e = popupEl.querySelector("#captcha-popup-error");
    e.innerText = msg;
    e.style.display = "block";
  }

  // ------------------------------
  // Load Challenge
  // ------------------------------
  async function loadChallenge() {
    const bodyEl = popupEl.querySelector("#captcha-popup-body");
    bodyEl.innerHTML = `<div class="loader">Loading…</div>`;

    const res = await api("POST", "/captcha/create", { difficulty: "easy" });

    if (!res.success) {
      showError("Failed to load CAPTCHA: " + (res.error || "Unknown"));
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

  // ------------------------------
  // Render Survey
  // ------------------------------
  function renderSurvey(bodyEl) {
    const surveyDiv = document.createElement("div");
    surveyDiv.className = "popup-survey";

    const q = document.createElement("div");
    q.className = "popup-question";
    q.innerText = survey.question_text;
    surveyDiv.appendChild(q);

    if (survey.question_type === "multiple_choice") {
      survey.options.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "popup-option";
        btn.innerText = opt;

        btn.onclick = () => {
          surveyDiv.querySelectorAll(".popup-option").forEach(x => x.classList.remove("selected"));
          btn.classList.add("selected");
          surveyDiv.dataset.answer = opt;
        };

        surveyDiv.appendChild(btn);
      });
    }

    bodyEl.innerHTML = "";
    bodyEl.appendChild(surveyDiv);
  }

  // ------------------------------
  // Render ALTCHA POW
  // ------------------------------
  function renderPow(bodyEl) {
    const powEl = document.createElement("div");
    powEl.className = "popup-pow";
    powEl.innerHTML = `<span id="popup-pow-status">Solving…</span>`;

    bodyEl.appendChild(powEl);

    const worker = new Worker("/widget/pow-worker.js");
    worker.postMessage({ action: "solve", params: altchaParams });

    worker.onmessage = (ev) => {
      if (ev.data?.solution) {
        const s = document.getElementById("popup-pow-status");
        s.innerText = "✓ Verified";
        s.classList.add("ok");
        s.dataset.solution = JSON.stringify(ev.data.solution);
      }
    };
  }

  // ------------------------------
  // Render Submit Button
  // ------------------------------
  function renderSubmit(bodyEl) {
    const btn = document.createElement("button");
    btn.className = "popup-submit";
    btn.innerText = "Verify Human";

    btn.onclick = submitCaptcha;

    bodyEl.appendChild(btn);
  }

  // ------------------------------
  // Submit CAPTCHA
  // ------------------------------
  async function submitCaptcha() {
    const surveyDiv = popupEl.querySelector(".popup-survey");
    const answer = surveyDiv.dataset.answer;

    if (!answer) {
      showError("Please select an answer.");
      return;
    }

    const powStatus = document.getElementById("popup-pow-status");
    if (!powStatus.dataset.solution) {
      showError("Please wait, proof-of-work still running.");
      return;
    }

    const solveTime = Math.floor(performance.now() - startTime);

    const res = await api("POST", "/captcha/complete", {
      challenge_id: challengeId,
      altcha_solution: JSON.parse(powStatus.dataset.solution),
      survey_answer: { value: answer },
      solve_time_ms: solveTime
    });

    if (!res.success) {
      showError("Verification failed: " + (res.error || "Unknown"));
      return;
    }

    // Emit token event
    window.dispatchEvent(new CustomEvent("CaptchaSolved", {
      detail: { token: res.token }
    }));

    // Show success
    popupEl.querySelector("#captcha-popup-body").innerHTML =
      `<div class="popup-success">✓ Successfully Verified</div>`;

    setTimeout(closePopup, 900);
  }

  // ------------------------------
  // Public Global Function
  // ------------------------------
  window.openCaptchaPopup = openPopup;

})();
