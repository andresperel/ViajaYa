const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'ViajaYa',
    password: 'agustofachero',
    port: 5432
});

module.exports = pool;