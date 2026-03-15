/**
 * check-env.js
 * Pre-build validation to ensure required environment variables are present.
 */
const requiredEnv = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SITE_URL',
];

const missing = requiredEnv.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error('\x1b[31m%s\x1b[0m', 'CRITICAL ERROR: Missing required environment variables:');
  missing.forEach((m) => console.error(`- ${m}`));
  console.error('\nPlease set these variables in your deployment environment or .env.local file.');
  process.exit(1);
}

console.log('\x1b[32m%s\x1b[0m', '✅ Environment validation passed.');
process.exit(0);
