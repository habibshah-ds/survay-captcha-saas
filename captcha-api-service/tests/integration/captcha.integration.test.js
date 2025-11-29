// tests/integration/captcha.integration.test.js
'use strict';

const request = require('supertest');
const app = require('../../src/app'); // your express app entry
const db = require('../../src/config/database');
const Client = require('../../src/models/Client');
const cryptoUtil = require('../../src/utils/crypto');
const altcha = require('../../src/services/altchaService');
const { randomBase62 } = cryptoUtil;

jest.setTimeout(20000);

describe('captcha flow integration', () => {
  let server;
  let testClient;
  const rawApiKey = 'test-api-key-abcdef123456';

  beforeAll(async () => {
    // Start server if app returns an express instance
    server = app.listen ? app.listen(0) : null;

    // create a client row in DB for testing
    const sk = 'test_site_key_' + randomBase62(6);
    // compute hash using utils
    const apiKeyHash = cryptoUtil.computeApiKeyHash(rawApiKey);
    // insert client directly
    const q = `INSERT INTO clients (name, site_key, api_key_hash, api_key_last_rotated, plan, monthly_limit, created_at)
               VALUES ($1,$2,$3,NOW(),'test',1000,NOW()) RETURNING *`;
    const res = await db.query(q, ['test-client', sk, apiKeyHash]);
    testClient = res.rows[0];
  });

  afterAll(async () => {
    if (server && server.close) server.close();
    // cleanup test client
    if (testClient && testClient.id) {
      await db.query('DELETE FROM clients WHERE id = $1', [testClient.id]);
    }
    await db.end && db.end();
  });

  test('challenge -> complete -> verify-token -> replay block', async () => {
    // 1) request challenge
    const challengeResp = await request(app)
      .post('/api/v1/captcha/challenge')
      .send({ site_key: testClient.site_key, difficulty: 1 })
      .expect(200);

    expect(challengeResp.body).toHaveProperty('challenge_id');
    const widget = challengeResp.body.widget_data;
    expect(widget).toHaveProperty('altcha');
    const challenge = widget.altcha.challenge;
    const difficulty = widget.altcha.difficulty;
    const sessionId = challengeResp.body.challenge_id;

    // 2) brute-force a suffix that satisfies difficulty small (1)
    const crypto = require('crypto');
    let suffixFound = null;
    for (let i = 0; i < 200000; i++) {
      const s = 'sfx' + i;
      const h = crypto.createHash('sha256').update(`${challenge}::${s}`, 'utf8').digest('hex');
      if (h.startsWith('0'.repeat(difficulty))) {
        suffixFound = s;
        break;
      }
    }
    expect(suffixFound).not.toBeNull();

    // 3) complete with a valid survey answer (the widget returned question)
    const question = widget.question;
    // depending on question type, choose an answer
    let surveyAnswer;
    if (question.type === 'multiple_choice' || question.type === 'image_choice') {
      if (Array.isArray(question.options) && question.options.length) {
        surveyAnswer = question.options[0].id || question.options[0].value || String(question.options[0]);
      } else {
        surveyAnswer = 'option-1';
      }
    } else if (question.type === 'rating') {
      surveyAnswer = question.rating_min || 1;
    } else {
      surveyAnswer = 'test answer';
    }

    const completeResp = await request(app)
      .post('/api/v1/captcha/complete')
      .send({
        session_id: sessionId,
        site_key: testClient.site_key,
        altcha_solution: { suffix: suffixFound },
        survey_answer: surveyAnswer,
        timings: { started_at: new Date().toISOString(), answered_at: new Date(Date.now() + 1000).toISOString() }
      })
      .expect(200);

    expect(completeResp.body).toHaveProperty('token');
    const token = completeResp.body.token;

    // 4) verify token server-to-server
    const verifyResp = await request(app)
      .post('/api/v1/captcha/verify-token')
      .set('X-API-Key', rawApiKey)
      .send({ token })
      .expect(200);

    expect(verifyResp.body).toHaveProperty('verified', true);

    // 5) replay attempt must fail
    await request(app)
      .post('/api/v1/captcha/verify-token')
      .set('X-API-Key', rawApiKey)
      .send({ token })
      .expect(409);
  });
});
