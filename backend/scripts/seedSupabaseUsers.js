/**
 * PulseChain v3.2.0 — Supabase Demo Tenant Seeder & Live SAP UserSet Synchronizer
 * Creates demo tenants with predefined passwords, roles, and enterprise tenant scopes,
 * then registers each tenant live in SAP S/4HANA ZPULSE_USERS (UserSet).
 * 
 * Default Demo Password: Pulse@2026
 */

const { supabaseAdmin, isSupabaseConfigured, SUPABASE_URL } = require('../supabaseClient');
const sapAdapter = require('../sapAdapter');

const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD || 'Pulse@2026';

const DEMO_TENANTS = [
  // 1. Regional Head
  {
    email: 'regional.head@pulsechain.org',
    full_name: 'Dr. Rajesh Verma',
    role: 'REGIONAL_HEAD',
    hospital_id: null,
    supplier_id: null,
    city: 'ALL',
    region_name: 'MP_CENTRAL_WEST',
    warehouse_bay: null,
  },
  {
    email: 'kavya.0111cd231058@technocratsgrou.com',
    full_name: "Team Techy's",
    role: 'REGIONAL_HEAD',
    hospital_id: null,
    supplier_id: null,
    city: 'ALL',
    region_name: 'MP_CENTRAL_WEST',
    warehouse_bay: null,
  },

  // 2. H004 Bhopal Hub (Manager & Shopkeeper)
  {
    email: 'manager.h004@pulsechain.org',
    full_name: 'Dr. Kavya Rajoria',
    role: 'HOSPITAL_MANAGER',
    hospital_id: 'H004',
    supplier_id: null,
    city: 'BHOPAL',
    region_name: 'MP_CENTRAL_WEST',
    warehouse_bay: null,
  },
  {
    email: 'kavyarajoria9691@gmail.com',
    full_name: 'Dr. Kavya Rajoria',
    role: 'HOSPITAL_MANAGER',
    hospital_id: 'H004',
    supplier_id: null,
    city: 'BHOPAL',
    region_name: 'MP_CENTRAL_WEST',
    warehouse_bay: null,
  },
  {
    email: 'shopkeeper.h004@pulsechain.org',
    full_name: 'Sejal Tiwari',
    role: 'SHOPKEEPER',
    hospital_id: 'H004',
    supplier_id: null,
    city: 'BHOPAL',
    region_name: 'MP_CENTRAL_WEST',
    warehouse_bay: 'COLD_CHAIN_BAY_1',
  },
  {
    email: 'tiwarisejal80@gmail.com',
    full_name: 'Sejal Tiwari',
    role: 'SHOPKEEPER',
    hospital_id: 'H004',
    supplier_id: null,
    city: 'BHOPAL',
    region_name: 'MP_CENTRAL_WEST',
    warehouse_bay: 'COLD_CHAIN_BAY_1',
  },

  // 3. H005 Bhopal Surplus Hub
  {
    email: 'manager.h005@pulsechain.org',
    full_name: 'Manager Hub H005',
    role: 'HOSPITAL_MANAGER',
    hospital_id: 'H005',
    supplier_id: null,
    city: 'BHOPAL',
    region_name: 'MP_CENTRAL_WEST',
    warehouse_bay: null,
  },
  {
    email: 'kavyarajoriakr@gmail.com',
    full_name: 'Manager Hub H005',
    role: 'HOSPITAL_MANAGER',
    hospital_id: 'H005',
    supplier_id: null,
    city: 'BHOPAL',
    region_name: 'MP_CENTRAL_WEST',
    warehouse_bay: null,
  },
  {
    email: 'kavyarajoriakr@gmal.com',
    full_name: 'Manager Hub H005',
    role: 'HOSPITAL_MANAGER',
    hospital_id: 'H005',
    supplier_id: null,
    city: 'BHOPAL',
    region_name: 'MP_CENTRAL_WEST',
    warehouse_bay: null,
  },
  {
    email: 'shopkeeper.h005@pulsechain.org',
    full_name: 'Shopkeeper H005 Hub',
    role: 'SHOPKEEPER',
    hospital_id: 'H005',
    supplier_id: null,
    city: 'BHOPAL',
    region_name: 'MP_CENTRAL_WEST',
    warehouse_bay: 'MAIN_DISPATCH_DOCK_2',
  },

  // 4. H006 Indore Super Specialty Hub
  {
    email: 'manager.h006@pulsechain.org',
    full_name: 'Manager Hub H006',
    role: 'HOSPITAL_MANAGER',
    hospital_id: 'H006',
    supplier_id: null,
    city: 'INDORE',
    region_name: 'MP_CENTRAL_WEST',
    warehouse_bay: null,
  },
  {
    email: 'shopkeeper.h006@pulsechain.org',
    full_name: 'Shopkeeper H006 Indore',
    role: 'SHOPKEEPER',
    hospital_id: 'H006',
    supplier_id: null,
    city: 'INDORE',
    region_name: 'MP_CENTRAL_WEST',
    warehouse_bay: 'INDORE_COLD_BAY_3',
  },

  // 5. Suppliers
  {
    email: 'v1001@medisupply.in',
    full_name: 'Saumay Dubey (BioPharm / MediSupply)',
    role: 'SUPPLIER',
    hospital_id: null,
    supplier_id: 'V1001',
    city: 'BHOPAL',
    region_name: 'MP_CENTRAL_WEST',
    warehouse_bay: null,
  },
  {
    email: 'soumaydubey073@gmail.com',
    full_name: 'Saumay Dubey (MediSupply)',
    role: 'SUPPLIER',
    hospital_id: null,
    supplier_id: 'V1001',
    city: 'BHOPAL',
    region_name: 'MP_CENTRAL_WEST',
    warehouse_bay: null,
  },
  {
    email: 'v1002@biocare.in',
    full_name: 'BioCare Logistics India',
    role: 'SUPPLIER',
    hospital_id: null,
    supplier_id: 'V1002',
    city: 'INDORE',
    region_name: 'MP_CENTRAL_WEST',
    warehouse_bay: null,
  },
  {
    email: '0111cd23058@technocratsgroup.edu.in',
    full_name: 'BioCare Logistics India',
    role: 'SUPPLIER',
    hospital_id: null,
    supplier_id: 'V1002',
    city: 'INDORE',
    region_name: 'MP_CENTRAL_WEST',
    warehouse_bay: null,
  },
  {
    email: 'v1003@fastmed.in',
    full_name: 'FastMed Cold-Chain Express',
    role: 'SUPPLIER',
    hospital_id: null,
    supplier_id: 'V1003',
    city: 'JABALPUR',
    region_name: 'MP_CENTRAL_WEST',
    warehouse_bay: null,
  },
];

async function seedUsers() {
  console.log('===============================================================');
  console.log('🏥 PulseChain — Supabase Tenant Seeding & SAP UserSet Dual-Sync');
  console.log(`📡 Supabase Endpoint : ${SUPABASE_URL}`);
  console.log(`🔐 Default Password  : ${DEMO_PASSWORD}`);
  console.log('===============================================================\n');

  if (!isSupabaseConfigured || !supabaseAdmin) {
    console.error('❌ Error: Supabase is not configured. Check SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }

  let createdCount = 0;
  let existingCount = 0;
  let sapSyncedCount = 0;
  let failedCount = 0;

  for (const tenant of DEMO_TENANTS) {
    try {
      // 1. Attempt creating user in Supabase auth.users
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: tenant.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: tenant.full_name,
          role: tenant.role,
          hospital_id: tenant.hospital_id,
          supplier_id: tenant.supplier_id,
          city: tenant.city,
          region_name: tenant.region_name,
          warehouse_bay: tenant.warehouse_bay,
        },
      });

      let userId = null;

      if (error) {
        if (error.message.includes('already registered') || error.status === 422) {
          existingCount++;
          console.log(`ℹ️ [EXISTS] ${tenant.email} (${tenant.role})`);

          // Fetch existing user ID
          const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
          const existingUser = listData?.users?.find((u) => u.email === tenant.email);
          if (existingUser) {
            userId = existingUser.id;
            // Update password & metadata to ensure current sync
            await supabaseAdmin.auth.admin.updateUserById(userId, {
              password: DEMO_PASSWORD,
              user_metadata: {
                full_name: tenant.full_name,
                role: tenant.role,
                hospital_id: tenant.hospital_id,
                supplier_id: tenant.supplier_id,
                city: tenant.city,
                region_name: tenant.region_name,
                warehouse_bay: tenant.warehouse_bay,
              },
            });
          }
        } else {
          failedCount++;
          console.error(`❌ [FAILED] ${tenant.email}: ${error.message}`);
          continue;
        }
      } else {
        createdCount++;
        userId = data.user.id;
        console.log(`✅ [CREATED] ${tenant.email} (${tenant.role}) -> UID: ${userId}`);
      }

      // 2. Direct upsert into public.user_profiles
      if (userId) {
        try {
          await supabaseAdmin
            .from('user_profiles')
            .upsert({
              id: userId,
              email: tenant.email,
              full_name: tenant.full_name,
              role: tenant.role,
              hospital_id: tenant.hospital_id,
              supplier_id: tenant.supplier_id,
              city: tenant.city,
              sap_synced: false,
            }, { onConflict: 'id' });

          // Auto-provision role-specific tables
          if (tenant.role === 'REGIONAL_HEAD') {
            await supabaseAdmin
              .from('regional_heads')
              .upsert({
                user_id: userId,
                region_name: tenant.region_name || 'MP_CENTRAL_WEST',
                assigned_cities: ['BHOPAL', 'INDORE', 'JABALPUR'],
                escalation_email: tenant.email,
              }, { onConflict: 'user_id' });
          } else if (tenant.role === 'SHOPKEEPER' || tenant.role === 'VERIFICATION_OFFICER') {
            await supabaseAdmin
              .from('shopkeepers')
              .upsert({
                user_id: userId,
                hospital_id: tenant.hospital_id || 'H004',
                city: tenant.city || 'BHOPAL',
                warehouse_bay: tenant.warehouse_bay || 'COLD_CHAIN_BAY_1',
                can_approve_dispatch: true,
                can_approve_receipt: true,
              }, { onConflict: 'user_id' });
          }
        } catch (e) {
          // Table might not exist yet
        }

        // 3. Register user live in SAP S/4HANA UserSet
        try {
          const sapRes = await sapAdapter.registerUserInSap({
            id: userId,
            email: tenant.email,
            full_name: tenant.full_name,
            role: tenant.role,
            hospital_id: tenant.hospital_id,
            supplier_id: tenant.supplier_id,
            city: tenant.city,
            region_name: tenant.region_name,
            warehouse_bay: tenant.warehouse_bay,
            can_approve_dispatch: true,
            can_approve_receipt: true,
          });

          if (sapRes.success) {
            sapSyncedCount++;
            try {
              await supabaseAdmin
                .from('user_profiles')
                .update({ sap_synced: true })
                .eq('id', userId);
            } catch (e) {}
            console.log(`   └─ [SAP S/4HANA SYNCED] UserSet registered (Live: ${sapRes.isLive ? 'YES' : 'CACHE'})`);
          }
        } catch (sapErr) {
          console.warn(`   └─ [SAP SYNC NOTE] ${sapErr.message}`);
        }
      }
    } catch (err) {
      failedCount++;
      console.error(`❌ [EXCEPTION] ${tenant.email}: ${err.message}`);
    }
  }

  console.log('\n===============================================================');
  console.log(`📊 Seeding Complete: ${createdCount} Created, ${existingCount} Existing/Updated, ${sapSyncedCount} SAP Synced, ${failedCount} Failed`);
  console.log('===============================================================');
}

if (require.main === module) {
  seedUsers()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { seedUsers, DEMO_TENANTS };
