const SUPABASE_ACCESS_TOKEN = 'sbp_364a65850220470eebd1bdca4ae1203048a701d4';
const PROJECT_REF = 'waiuaxzyknubvquahhti';

async function createAdminUser() {
    // Step 1: Create user via Management API
    const createUserResponse = await fetch(
        `https://api.supabase.com/v1/projects/${PROJECT_REF}/auth/users`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'sreejith.businessinfluencer@gmail.com',
                password: 'Sreejith@6282',
                email_confirm: true,
                user_metadata: {},
                app_metadata: {}
            })
        }
    );

    if (!createUserResponse.ok) {
        const error = await createUserResponse.text();
        console.error('Failed to create user:', error);
        throw new Error(`Failed to create user: ${error}`);
    }

    const userData = await createUserResponse.json();
    console.log('User created:', userData.id);

    // Step 2: Update profile to set admin role
    const SUPABASE_URL = 'https://waiuaxzyknubvquahhti.supabase.co';
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_SERVICE_KEY) {
        console.log('⚠️  User created but could not set admin role automatically.');
        console.log('Please run this SQL in your Supabase SQL Editor:');
        console.log(`
INSERT INTO public.user_roles (user_id, role)
VALUES ('${userData.id}', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Note: Profile creation happens via trigger, but if you need to manually create it:
INSERT INTO public.profiles (user_id, full_name, created_at, updated_at)
VALUES ('${userData.id}', 'Admin User', NOW(), NOW())
ON CONFLICT (user_id) DO NOTHING;
    `);
        return;
    }

    const updateRoleResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/user_roles`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json',
                'apikey': SUPABASE_SERVICE_KEY,
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify({
                user_id: userData.id,
                role: 'admin'
            })
        }
    );

    if (updateRoleResponse.ok) {
        console.log('✅ Admin user created successfully!');
    } else {
        const error = await updateRoleResponse.text();
        console.error('Failed to set admin role:', error);
    }
}

createAdminUser().catch(console.error);
