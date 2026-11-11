require('dotenv').config();

const { Pool, types } = require('pg');

types.setTypeParser(1114, (value) => value.replace(' ', 'T'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
