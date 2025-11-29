const { Pool } = require('pg');
const { logger } = require('../src/utils/logger');

async function waitForDatabase(maxAttempts = 30, delay = 1000) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 1000,
  });

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      
      logger.info('Database connection established');
      await pool.end();
      return;
    } catch (error) {
      logger.warn(`Database connection attempt ${attempt}/${maxAttempts} failed: ${error.message}`);
      
      if (attempt === maxAttempts) {
        logger.error('All database connection attempts failed');
        process.exit(1);
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Run if called directly
if (require.main === module) {
  waitForDatabase();
}

module.exports = waitForDatabase;
