/**
 * Idempotent Demo Account Seeder for HEALTH PLUS
 *
 * When SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are configured in server env,
 * creates or verifies the 3 pre-configured demonstration users via the Supabase
 * Admin Auth REST API without duplicating existing records.
 *
 * Usage:
 *   node scripts/seed-demo-users.mjs
 */

const DEMO_USERS = [
  {
    email: 'demo@healthplus.app',
    password: process.env.HEALTHPLUS_DEMO_WELLNESS_PASSWORD || 'Demo@12345',
    fullName: 'Meera Nair (General Wellness Demo)',
    demoCategory: 'general_wellness',
  },
  {
    email: 'fitness@healthplus.app',
    password: process.env.HEALTHPLUS_DEMO_FITNESS_PASSWORD || 'Fitness@123',
    fullName: 'Rohan Verma (Fitness & Strength Demo)',
    demoCategory: 'fitness_goal',
  },
  {
    email: 'diet@healthplus.app',
    password: process.env.HEALTHPLUS_DEMO_DIET_PASSWORD || 'Diet@12345',
    fullName: 'Diya Kulkarni (Dietary Restrictions Demo)',
    demoCategory: 'dietary_restrictions',
  },
];

async function findSupabaseUserByEmail(baseUrl, serviceKey, email) {
  const res = await fetch(
    `${baseUrl}/auth/v1/admin/users?page=1&per_page=50`,
    {
      method: 'GET',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    }
  );
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Supabase list users failed (${res.status}): ${body}`);
  }
  const json = await res.json();
  const users = Array.isArray(json.users) ? json.users : [];
  return users.find((u) => (u.email || '').toLowerCase() === email.toLowerCase()) || null;
}

async function seedSupabaseDemoUsers() {
  const rawUrl = process.env.SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const baseUrl = rawUrl.replace(/\/$/, '');

  if (
    !baseUrl ||
    !serviceKey ||
    baseUrl.includes('your-project') ||
    serviceKey.includes('your-service-role')
  ) {
    console.log(
      '[seed-demo-users] Supabase server credentials (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are not configured. Skipping remote Supabase Auth provisioning; local/API salted demo credentials remain active in api/auth/credentials.js.'
    );
    return { status: 'skipped_missing_env', seeded: [] };
  }

  const results = [];
  for (const demo of DEMO_USERS) {
    const existing = await findSupabaseUserByEmail(baseUrl, serviceKey, demo.email);
    const metadata = {
      full_name: demo.fullName,
      is_demo_account: true,
      demo_category: demo.demoCategory,
    };

    if (existing) {
      const updateRes = await fetch(`${baseUrl}/auth/v1/admin/users/${existing.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          password: demo.password,
          email_confirm: true,
          user_metadata: metadata,
        }),
      });
      if (!updateRes.ok) {
        const body = await updateRes.text().catch(() => '');
        throw new Error(`Failed updating demo user ${demo.email}: ${body}`);
      }
      results.push({ email: demo.email, action: 'verified_updated', id: existing.id });
    } else {
      const createRes = await fetch(`${baseUrl}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          email: demo.email,
          password: demo.password,
          email_confirm: true,
          user_metadata: metadata,
        }),
      });
      if (!createRes.ok) {
        const body = await createRes.text().catch(() => '');
        throw new Error(`Failed creating demo user ${demo.email}: ${body}`);
      }
      const created = await createRes.json();
      results.push({ email: demo.email, action: 'created', id: created.id });
    }
  }

  console.log('[seed-demo-users] Idempotent Supabase demo seeding complete:', results);
  return { status: 'seeded_supabase', seeded: results };
}

seedSupabaseDemoUsers().catch((err) => {
  console.error('[seed-demo-users] Error:', err.message || err);
  process.exit(1);
});
