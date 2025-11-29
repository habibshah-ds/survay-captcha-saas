// Jest setup file
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://captcha_user:captcha_pass@localhost:5432/captcha_test_db';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.ALTCHA_SECRET = 'test-secret-for-jest';
