require('dotenv').config();
const pool = require('./src/config/database');

async function test() {
  const cols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'subscribers' ORDER BY ordinal_position");
  console.log('subscribers columns:', cols.rows.map(c => c.column_name).join(', '));
  process.exit(0);
}
test().catch(e => { console.error(e.message); process.exit(1); });
