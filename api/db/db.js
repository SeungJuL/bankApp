const { Pool } = require('pg')

const pool = new Pool({
    user: 'postgres', 
    host: 'localhost',
    database: process.env.PSQL_DATABASE_NAME,
    password: process.env.PSQL_DATABASE_PASSWORD, 
    port: 5432,
});

module.exports = pool