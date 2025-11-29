/**
 * public/widget/pow-worker.js
 *
 * ALTCHA-compatible Proof-of-Work solver.
 * Fully ES5. No dependencies. Runs in Web Worker.
 *
 * The main widget sends:
 *   { challenge: "abcdef12345", difficulty: 4 }
 *
 * The worker returns:
 *   { solution: "<nonce>" }
 */

self.onmessage = function (e) {
  var data = e.data || {};

  // If ALTCHA disabled (local/dev), return dummy quick result
  if (!data || !data.challenge || !data.difficulty) {
    return self.postMessage({ solution: "dummy-altcha" });
  }

  var challenge = data.challenge;
  var diff = data.difficulty;

  // Required prefix of zeros in hex hash
  var targetPrefix = "";
  for (var i = 0; i < diff; i++) targetPrefix += "0";

  // Local SHA-256 implementation (browser-native)
  function sha256(str) {
    var encoder = new TextEncoder();
    var data = encoder.encode(str);

    return crypto.subtle.digest("SHA-256", data).then(function (buf) {
      var arr = Array.prototype.slice.call(new Uint8Array(buf), 0);
      return arr.map(function (b) {
        return ("00" + b.toString(16)).slice(-2);
      }).join("");
    });
  }

  // Brute force nonce
  var nonce = 0;
  var attempts = 0;

  function tryNonce() {
    var attemptStr = challenge + ":" + nonce;

    sha256(attemptStr).then(function (hash) {
      attempts++;

      if (hash.substring(0, targetPrefix.length) === targetPrefix) {
        // ✓ Found a valid solution
        return self.postMessage({
          solution: String(nonce),
          attempts: attempts,
          hash: hash
        });
      }

      nonce++;

      // Prevent blocking the thread too long; schedule next try
      if (nonce % 1000 === 0) {
        setTimeout(tryNonce, 1);
      } else {
        tryNonce();
      }
    }).catch(function () {
      // Crypto error → fallback
      return self.postMessage({ solution: "fallback-worker" });
    });
  }

  tryNonce();
};

