// public/widget/captcha-widget.js
(function () {
  // ------------------------------------------------------
  // Config
  // ------------------------------------------------------
  const API_BASE = window.CAPTCHA_API_BASE || '';
  const SITE_KEY = window.CAPTCHA_SITE_KEY || '';

  let challengeId = null;
  let altchaParams = null;
  let survey = null;
  let powSolution = null;
  let startTime = null;

  // DOM helper
  const $ = (id) => document.getElementById(id);

  // ------------------------------------------------------
  // API helper
  // ------------------------------------------------------
  async function api(method, path, body) {
    const res = await fetch(API_BASE + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + SITE_KEY
      },
      body: JSON.stringify(body || {})
    });

    let json;
    try {
      json = await res.json();
    } catch (e) {
      return { success: false, error: "Invalid server response" };
    }
    return json;
  }

  // ------------------------------------------------------
  // Challenge Loader
  // ------------------------------------------------------
  async function loadChallenge() {
    clearUI();
    $("captcha-box").classList.add("loading");

    const result = await api("POST", "/captcha/create", { difficulty: "easy" });

    if (!result.success) {
      showError("Failed to load CAPTCHA: " + (result.error || "Unknown error"));
      $("captcha-box").classList.remove("loading");
      return;
    }

    challengeId = result.challenge_id;
    altchaParams = result.widget.altcha;
    survey = result.widget.survey;

    renderSurvey();
    startPow();

    startTime = performance.now();
    $("captcha-box").classList.remove("loading");
  }

  // ------------------------------------------------------
  // UI Reset
  // ------------------------------------------------------
  function clearUI() {
    $("survey-container").innerHTML = "";
    $("pow-status").innerText = "Preparing…";
    $("pow-status").classList.remove("ok");
    $("pow-status").dataset.solution = "";
    $("captcha-error").style.display = "none";
  }

  // ------------------------------------------------------
  // Survey Renderer
  // ------------------------------------------------------
  function renderSurvey() {
    const container = $("survey-container");
    container.innerHTML = "";
    container.dataset.answer = "";

    const q = document.createElement("div");
    q.className = "captcha-question";
    q.innerText = survey.question_text;
    container.appendChild(q);

    // Multiple choice
    if (survey.question_type === "multiple_choice" && Array.isArray(survey.options)) {
      const wrap = document.createElement("div");
      wrap.className = "captcha-options";
      survey.options.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "captcha-option";
        btn.innerText = opt;

        btn.onclick = () => {
          container.dataset.answer = opt;
          document.querySelectorAll(".captcha-option").forEach(x => x.classList.remove("selected"));
          btn.classList.add("selected");
        };

        wrap.appendChild(btn);
      });
      container.appendChild(wrap);
    }

    // Rating scale
    if (survey.question_type === "scale") {
      const wrap = document.createElement("div");
      wrap.className = "captcha-scale";

      for (let i = survey.scale_min; i <= survey.scale_max; i++) {
        const btn = document.createElement("button");
        btn.className = "captcha-option";
        btn.innerText = i;

        btn.onclick = () => {
          container.dataset.answer = i;
          document.querySelectorAll(".captcha-option").forEach(x => x.classList.remove("selected"));
          btn.classList.add("selected");
        };

        wrap.appendChild(btn);
      }
      container.appendChild(wrap);
    }
  }

  // ------------------------------------------------------
  // Proof-of-Work (ALTCHA) Worker
  // ------------------------------------------------------
  function startPow() {
    $("pow-status").innerText = "Working…";

    const worker = new Worker("/widget/pow-worker.js");
    worker.postMessage({ action: "solve", params: altchaParams });

    worker.onmessage = (event) => {
      if (event.data?.solution) {
        powSolution = event.data.solution;
        $("pow-status").innerText = "✓ Verified";
        $("pow-status").classList.add("ok");
        $("pow-status").dataset.solution = JSON.stringify(powSolution);
      }

      if (event.data?.error) {
        $("pow-status").innerText = "Proof-of-work error";
      }
    };
  }

  // ------------------------------------------------------
  // Submission
  // ------------------------------------------------------
  async function submitCaptcha() {
    const answer = $("survey-container").dataset.answer;

    if (!answer) {
      showError("Please select an answer.");
      return;
    }
    if (!powSolution) {
      showError("Proof-of-work not finished yet.");
      return;
    }

    const solveTimeMs = Math.floor(performance.now() - startTime);

    const result = await api("POST", "/captcha/complete", {
      challenge_id: challengeId,
      altcha_solution: powSolution,
      survey_answer: { value: answer },
      solve_time_ms: solveTimeMs
    });

    if (!result.success) {
      showError("Verification failed: " + (result.error || "Unknown"));
      return;
    }

    // Fire event for site
    window.dispatchEvent(new CustomEvent("CaptchaSolved", {
      detail: { token: result.token }
    }));

    $("captcha-box").innerHTML = `<div class="captcha-success">✓ Verified</div>`;
  }

  // ------------------------------------------------------
  // Error Box
  // ------------------------------------------------------
  function showError(msg) {
    const box = $("captcha-error");
    box.innerText = msg;
    box.style.display = "block";
  }

  // ------------------------------------------------------
  // Bind
  // ------------------------------------------------------
  window.reloadCaptcha = loadChallenge;

  window.addEventListener("DOMContentLoaded", () => {
    $("captcha-submit").onclick = submitCaptcha;
    loadChallenge();
  });

})();
