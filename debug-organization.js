const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create admin client for debugging
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Create regular client (what the UI uses)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugOrganizations() {
  console.log('🔍 DEBUGGING ORGANIZATION SYSTEM');
  console.log('==================================\n');

  try {
    // Check if tables exist and have data
    console.log('1. Checking organizations table...');
    const { data: orgs, error: orgsError } = await supabaseAdmin
      .from('organizations')
      .select('*');
    
    if (orgsError) {
      console.error('❌ Error fetching organizations:', orgsError);
    } else {
      console.log(`✅ Found ${orgs?.length || 0} organizations:`);
      orgs?.forEach(org => {
        console.log(`   - ${org.name} (${org.slug}) - ID: ${org.id}`);
      });
    }

    console.log('\n2. Checking organization_memberships table...');
    const { data: memberships, error: membershipsError } = await supabaseAdmin
      .from('organization_memberships')
      .select('*');
    
    if (membershipsError) {
      console.error('❌ Error fetching memberships:', membershipsError);
    } else {
      console.log(`✅ Found ${memberships?.length || 0} memberships:`);
      memberships?.forEach(membership => {
        console.log(`   - User: ${membership.user_id} -> Org: ${membership.organization_id} (${membership.role})`);
      });
    }

    console.log('\n3. Checking users table...');
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name');
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
    } else {
      console.log(`✅ Found ${users?.length || 0} users:`);
      users?.forEach(user => {
        console.log(`   - ${user.email} (${user.full_name || 'No name'}) - ID: ${user.id}`);
      });
    }

    console.log('\n4. Testing organization fetch query (as used by UI)...');
    // This simulates what the UI does but using admin privileges
    const { data: orgMemberships, error: fetchError } = await supabaseAdmin
      .from('organization_memberships')
      .select(`
        organization_id,
        role,
        status,
        organizations (
          id,
          name,
          slug,
          description,
          avatar_url,
          website_url,
          is_verified,
          plan,
          max_members,
          created_at
        )
      `)
      .eq('status', 'active');

    if (fetchError) {
      console.error('❌ Error with organization fetch query:', fetchError);
    } else {
      console.log(`✅ Organization fetch query returned ${orgMemberships?.length || 0} results:`);
      orgMemberships?.forEach(membership => {
        const org = Array.isArray(membership.organizations) 
          ? membership.organizations[0] 
          : membership.organizations;
        console.log(`   - ${org?.name || 'Unknown'} (Role: ${membership.role})`);
      });
    }

    console.log('\n5. Checking database functions...');
    const { data: functions, error: functionsError } = await supabaseAdmin
      .rpc('create_organization_with_owner', {
        org_name: 'Test Org ' + Date.now(),
        org_slug: 'test-org-' + Date.now(),
        org_description: 'Test organization for debugging'
      });

    if (functionsError) {
      console.error('❌ Error testing create_organization_with_owner function:', functionsError);
    } else {
      console.log('✅ create_organization_with_owner function works');
      console.log('   Function returned:', functions);
    }

    console.log('\n==================================');
    console.log('🎯 DIAGNOSIS COMPLETE');

  } catch (error) {
    console.error('💥 Unexpected error during diagnosis:', error);
  }
}

// Run the debug
debugOrganizations().then(() => {
  console.log('\n🔚 Debug complete');
  process.exit(0);
}).catch(error => {
  console.error('💥 Debug failed:', error);
  process.exit(1);
});
