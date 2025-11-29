(function () {

  const API_BASE = SC_DATA.apiBase;
  const SITE_KEY = SC_DATA.siteKey;

  const box = document.getElementById("sc-inner");
  const loader = document.getElementById("sc-loading");

  let challengeId = null;
  let altchaParams = null;
  let survey = null;
  let startTime = null;

  function showLoading() { loader.style.display = "block"; }
  function hideLoading() { loader.style.display = "none"; }

  async function api(path, body) {
    const res = await fetch(API_BASE + path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + SITE_KEY
      },
      body: JSON.stringify(body)
    });
    return res.json();
  }

  async function loadChallenge() {
    showLoading();
    box.innerHTML = "";

    const result = await api("/captcha/create", { difficulty: "easy" });

    hideLoading();

    if (!result.success) {
      box.innerHTML = "<div>Failed to load CAPTCHA.</div>";
      return;
    }

    challengeId = result.challenge_id;
    altchaParams = result.widget.altcha;
    survey = result.widget.survey;

    renderSurvey();
    solvePow();
    startTime = performance.now();
  }

  function renderSurvey() {
    const html = `
      <div class="sc-question">${survey.question_text}</div>
      <div id="sc-options"></div>
      <button id="sc-submit" style="margin-top:10px;">Verify</button>
    `;

    box.innerHTML = html;

    const options = document.getElementById("sc-options");
    survey.options.forEach(o => {
      const btn = document.createElement("div");
      btn.className = "sc-option";
      btn.innerText = o;
      btn.onclick = () => {
        document.querySelectorAll(".sc-option").forEach(x => x.classList.remove("selected"));
        btn.classList.add("selected");
        options.dataset.answer = o;
      };
      options.appendChild(btn);
    });

    document.getElementById("sc-submit").onclick = submitCaptcha;
  }

  function solvePow() {
    const worker = new Worker(API_BASE + "/widget/pow-worker.js");

    worker.postMessage({ action: "solve", params: altchaParams });

    worker.onmessage = (ev) => {
      if (ev.data.solution) {
        box.dataset.solution = JSON.stringify(ev.data.solution);
      }
    };
  }

  async function submitCaptcha() {
    const answer = document.getElementById("sc-options").dataset.answer;
    const sol = box.dataset.solution;

    if (!answer) {
      alert("Select an answer.");
      return;
    }
    if (!sol) {
      alert("Still solving… please wait.");
      return;
    }

    const solveTime = Math.floor(performance.now() - startTime);

    const result = await api("/captcha/complete", {
      challenge_id: challengeId,
      altcha_solution: JSON.parse(sol),
      survey_answer: { value: answer },
      solve_time_ms: solveTime
    });

    if (!result.success) {
      alert("Verification failed");
      return;
    }

    box.innerHTML = `<div class="sc-success">✓ Verified</div>`;
  }

  // Start
  document.addEventListener("DOMContentLoaded", loadChallenge);

})();
