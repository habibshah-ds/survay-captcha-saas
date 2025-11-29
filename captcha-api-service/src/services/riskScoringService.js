// src/services/riskScoringService.js
"use strict";

/**
 * Risk scoring for CAPTCHA completions.
 *
 * Returns a score from 0 to 100.
 * Higher = higher bot suspicion.
 *
 * Human-friendly design:
 * - DOES NOT block real humans for survey answers.
 * - Only flags extremely fast solves or missing POW.
 * - Survey answers are ALWAYS accepted.
 */

module.exports = {
  score,
};

/**
 * Inputs:
 * - clientId
 * - ip
 * - userAgent
 * - solveTimeMs
 * - surveyAnswer
 */
async function score({ clientId, ip, userAgent, solveTimeMs, surveyAnswer }) {
  let risk = 0;

  /* -----------------------------------------------
     1. Solve-time heuristics
     ----------------------------------------------- */

  if (!solveTimeMs || solveTimeMs < 150) {
    // instant solve = bot-like
    risk += 35;
  } else if (solveTimeMs < 350) {
    risk += 15;
  } else if (solveTimeMs > 15000) {
    // slow = automation or stuck, but mild
    risk += 5;
  }

  /* -----------------------------------------------
     2. User-Agent heuristics
     ----------------------------------------------- */

  if (!userAgent || userAgent.length < 10) {
    risk += 15;
  }

  const ua = (userAgent || "").toLowerCase();

  if (ua.includes("headless")) risk += 30;
  if (ua.includes("bot") || ua.includes("spider") || ua.includes("crawler")) {
    risk += 40;
  }

  /* -----------------------------------------------
     3. IP heuristics (lightweight)
     ----------------------------------------------- */

  if (!ip || ip === "0.0.0.0") {
    risk += 10;
  }

  // Skip localhost checks (dev mode)
  if (ip === "127.0.0.1" || ip === "::1") {
    risk -= 20; // safe signal
  }

  /* -----------------------------------------------
     4. Survey heuristic (lightweight)
     ----------------------------------------------- */

  // If survey answer missing → bot sometimes forgets fields
  if (!surveyAnswer) {
    risk += 10;
  }

  /* -----------------------------------------------
     Final normalization
     ----------------------------------------------- */

  if (risk < 0) risk = 0;
  if (risk > 100) risk = 100;

  return risk;
}
