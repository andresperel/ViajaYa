const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
if (!url || !key || url.includes('your-project.supabase.co') || key.startsWith('your-supabase-')) {
  throw new Error('Supabase no está configurado. Revisá backend/.env (SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY o SUPABASE_KEY).');
}

const supabase = createClient(
  url,
  key,
  { auth: { persistSession: false, autoRefreshToken: false } }
);
module.exports = supabase;
