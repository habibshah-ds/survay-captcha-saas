# 🛡️ CAPTCHA API Service - Production Ready

**Version 2.0.0** - Enterprise-grade CAPTCHA-as-a-Service platform optimized for **5-15 million verifications/month**.

## 🎯 Key Features

### Core Functionality
- ✅ **Survey-First CAPTCHA**: Human verification through contextual questions
- ✅ **ALTCHA Integration**: Proof-of-work challenge for bot detection
- ✅ **Combined Risk Scoring**: 40% ALTCHA + 30% Timing + 30% Survey
- ✅ **Background Processing**: BullMQ for async computation (zero blocking)
- ✅ **Multi-Tenant SaaS**: Complete client isolation and management

### Production Optimizations
- ⚡ **High Performance**: Sub-100ms response time (95th percentile)
- 📊 **Horizontal Scaling**: Stateless design, Redis-backed
- 🔒 **Enterprise Security**: Rate limiting, API key auth, input validation
- 📈 **15-Day Free Trial**: Automatic trial management with grace periods
- 💰 **Usage-Based Limits**: Soft/hard limits with 429 responses
- 🚀 **Zero-Downtime Deploys**: Health checks + graceful shutdown

## 🏗️ Architecture

```
Client Request
      │
      ▼
┌─────────────────┐
│  Load Balancer  │ (Nginx/Caddy)
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│   Express API (×N)  │ ← Horizontally scaled
└────┬────────────┬───┘
     │            │
     ▼            ▼
┌─────────┐  ┌──────────┐
│ Postgres│  │  Redis   │ ← Shared state
└─────────┘  └────┬─────┘
                  │
                  ▼
            ┌──────────┐
            │  BullMQ  │ ← Background workers
            │  Worker  │
            └──────────┘
```

## 📦 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL 15+
- Redis 7+

### Installation

```bash
# 1. Clone repository
git clone https://github.com/your-org/captcha-api-service.git
cd captcha-api-service

# 2. Configure environment
cp .env.example .env

# CRITICAL: Generate secure ALTCHA secret
openssl rand -hex 32

# Edit .env and set:
# - ALTCHA_SECRET (64-char hex from above)
# - DB_PASSWORD (strong password)
# - CORS_ORIGINS (your domains)

# 3. Start services
docker compose up -d --build

# 4. Run migrations
docker compose exec app npm run migrate
bash scripts/run-migrations.sh

# 5. Verify health
curl http://localhost:3000/api/v1/health

# 6. Generate API key
docker compose exec -T postgres psql -U captcha_user -d captcha_db << EOF
INSERT INTO clients (api_key, name, email, plan_type, monthly_limit)
VALUES (
  '$(openssl rand -hex 32)',
  'Production Client',
  'admin@yourcompany.com',
  'basic',
  10000
)
RETURNING api_key, name, plan_type;
EOF
```

## 🔑 API Reference

### Base URL
```
Production: https://api.yourcaptcha.com/api/v1
Development: http://localhost:3000/api/v1
```

### Authentication
All endpoints (except `/health`) require API key in header:
```
X-API-Key: your_64_character_hexadecimal_api_key_here
```

---

### 1. Health Check
```http
GET /api/v1/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-25T10:00:00.000Z",
  "version": "2.0.0",
  "uptime": 86400,
  "dependencies": {
    "database": "connected",
    "redis": "connected",
    "queue": "connected"
  }
}
```

---

### 2. Generate Survey Challenge (Recommended)
```http
POST /api/v1/survey-challenge
Content-Type: application/json
X-API-Key: your_api_key

{
  "difficulty": "medium"  // easy, medium, hard
}
```

**Response (201 Created):**
```json
{
  "session_id": "uuid-here",
  "survey": {
    "question_text": "What is 15 + 27?",
    "question_type": "multiple_choice",
    "options": ["40", "41", "42", "43"],
    "difficulty": "medium"
  },
  "altcha_widget": {
    "algorithm": "SHA-256",
    "challenge": "hash_string",
    "salt": "random_salt",
    "maxNumber": 10000000
  },
  "expires_at": "2025-11-25T10:05:00.000Z",
  "difficulty": "medium",
  "usage": {
    "current": 150,
    "limit": 10000,
    "remaining": 9850
  }
}
```

---

### 3. Verify Complete Challenge
```http
POST /api/v1/verify-complete
Content-Type: application/json
X-API-Key: your_api_key

{
  "session_id": "uuid-from-challenge",
  "survey_answer": "42",
  "timing_data": {
    "answer_time_ms": 3500,
    "interaction_pattern": [
      {"type": "focus", "timestamp": 0},
      {"type": "keydown", "timestamp": 1200},
      {"type": "keydown", "timestamp": 1350}
    ]
  },
  "altcha_solution": {
    "algorithm": "SHA-256",
    "challenge": "hash",
    "salt": "salt",
    "signature": "signature",
    "number": 12345
  }
}
```

**Response (200 OK):**
```json
{
  "verified": true,
  "risk_score": 0.23,
  "confidence": "high",
  "next_action": "proceed",
  "breakdown": {
    "survey_correct": true,
    "altcha_valid": true,
    "timing_natural": true
  }
}
```

**Next Actions:**
- `proceed`: User verified, allow access
- `retry`: Uncertain, show challenge again
- `block`: Bot detected, deny access

---

### 4. Legacy ALTCHA-Only Endpoints

For backward compatibility:

```http
POST /api/v1/challenge      # Generate ALTCHA only
POST /api/v1/verify         # Verify ALTCHA only
```

## 📊 Plan Types & Limits

| Plan | Monthly Limit | Rate Limit | Difficulty Levels | Cost |
|------|--------------|------------|-------------------|------|
| **Trial** | 1,000 | 100/min | Easy, Medium | Free (15 days) |
| **Free** | 1,000 | 100/min | Easy, Medium | $0/month |
| **Basic** | 10,000 | 500/min | All | $29/month |
| **Premium** | 100,000 | 2,000/min | All | $199/month |
| **Enterprise** | 1,000,000+ | 10,000/min | All | Custom |

## 🔒 Security Features

### API Key Security
- 64-character hexadecimal format
- Stored as plain text (for lookup performance)
- Transmitted only in `X-API-Key` header (never query params)
- Masked in logs (first 8 + last 8 chars shown)

### Rate Limiting
- Redis-backed sliding window
- Per-client limits based on plan
- Automatic 429 responses with `Retry-After` header
- Fallback to memory store if Redis unavailable

### Input Validation
- Joi schemas for all endpoints
- 10KB request size limit
- SQL injection prevention (parameterized queries)
- XSS protection via Helmet

### Brute Force Protection
- Max 5 verification attempts per session
- Progressive delays between attempts
- Automatic session expiration after timeout

## 🚀 Deployment

### Docker (Recommended)

```bash
# Production build
docker compose -f docker-compose.prod.yml up -d --build

# View logs
docker compose logs -f app

# Scale API instances
docker compose up -d --scale app=3
```

### Cloud Platforms

#### Fly.io
```bash
fly launch
fly secrets set ALTCHA_SECRET=$(openssl rand -hex 32)
fly secrets set DATABASE_URL=postgres://...
fly deploy
```

#### Railway
```bash
railway login
railway init
railway up
```

#### DigitalOcean App Platform
```yaml
# app.yaml
services:
  - name: captcha-api
    dockerfile_path: Dockerfile
    envs:
      - key: DATABASE_URL
        scope: RUN_TIME
        value: ${db.DATABASE_URL}
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | `production` | Environment mode |
| `PORT` | No | `3000` | API port |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `REDIS_URL` | Yes | - | Redis connection string |
| `ALTCHA_SECRET` | Yes | - | 64-char hex secret |
| `LOG_LEVEL` | No | `info` | Winston log level |
| `TRIAL_PERIOD_DAYS` | No | `15` | Trial duration |
| `CORS_ORIGINS` | No | `*` | Allowed CORS origins |

## 📈 Performance Tuning

### Database Optimization
```sql
-- Add indexes for hot queries
CREATE INDEX idx_sessions_client_recent 
ON captcha_sessions(client_id, created_at DESC) 
WHERE status = 'verified';

-- Periodic cleanup
DELETE FROM captcha_sessions 
WHERE expires_at < NOW() - INTERVAL '7 days';
```

### Redis Configuration
```bash
# redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
save ""
appendonly yes
```

### Connection Pooling
```env
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT=30000
REDIS_CONNECT_TIMEOUT=10000
```

## 🧪 Testing

```bash
# Run all tests
npm test

# With coverage
npm run test:coverage

# Integration tests only
npm run test:integration

# Watch mode (development)
npm run test:watch
```

## 📊 Monitoring

### Health Check Endpoint
```bash
# Production health check
curl -f http://localhost:3000/api/v1/health || exit 1
```

### Queue Monitoring
```bash
# Real-time queue stats
npm run queue:monitor

# Clean old jobs
npm run queue:clean
```

### Logging
Logs are written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Errors only
- Console (development only)

## 🐛 Troubleshooting

### Issue: "Redis unavailable"
**Solution:** Check Redis connection:
```bash
docker compose exec redis redis-cli ping
```

### Issue: "Database connection failed"
**Solution:** Verify PostgreSQL:
```bash
docker compose exec postgres pg_isready
docker compose logs postgres
```

### Issue: "Rate limit exceeded immediately"
**Solution:** Clear rate limits:
```bash
docker compose exec redis redis-cli KEYS "rate_limit:*" | xargs redis-cli DEL
```

### Issue: "Worker not processing jobs"
**Solution:** Restart worker:
```bash
docker compose restart worker
docker compose logs -f worker
```

## 🤝 Integration Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

const captcha = await axios.post('http://localhost:3000/api/v1/survey-challenge', {
  difficulty: 'medium'
}, {
  headers: { 'X-API-Key': 'your_api_key' }
});

// Show survey to user, collect answer + ALTCHA solution

const result = await axios.post('http://localhost:3000/api/v1/verify-complete', {
  session_id: captcha.data.session_id,
  survey_answer: userAnswer,
  timing_data: timingData,
  altcha_solution: altchaSolution
}, {
  headers: { 'X-API-Key': 'your_api_key' }
});

if (result.data.verified && result.data.next_action === 'proceed') {
  // Allow access
}
```

### Python
```python
import requests

API_KEY = 'your_api_key'
BASE_URL = 'http://localhost:3000/api/v1'

# Generate challenge
response = requests.post(
    f'{BASE_URL}/survey-challenge',
    headers={'X-API-Key': API_KEY},
    json={'difficulty': 'medium'}
)
challenge = response.json()

# Verify
verify_response = requests.post(
    f'{BASE_URL}/verify-complete',
    headers={'X-API-Key': API_KEY},
    json={
        'session_id': challenge['session_id'],
        'survey_answer': '42',
        'timing_data': timing_data,
        'altcha_solution': solution
    }
)
result = verify_response.json()
```

## 📞 Support

- **Documentation**: https://docs.yourcaptcha.com
- **Issues**: https://github.com/your-org/captcha-api-service/issues
- **Email**: support@yourcaptcha.com
- **Discord**: https://discord.gg/yourcaptcha

## 📄 License

MIT License - See LICENSE file for details

---

**Built with ❤️ for a safer web**
