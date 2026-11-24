/**
 * PulseChain Enterprise Authentication & RBAC Middleware
 * Bridges Supabase Auth + Postgres User Profiles with fallback JWT compatibility
 */

const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('./supabaseClient');

const JWT_SECRET = process.env.JWT_SECRET || 'pulsechain_prod_secret_2026';

// Role normalization dictionary for seamless interoperability
const ROLE_ALIASES = {
  REGIONAL_HEAD: 'REGIONAL_HEAD',
  REGIONAL_ADMIN: 'REGIONAL_HEAD',
  ADMIN: 'REGIONAL_HEAD',
  HOSPITAL_MANAGER: 'HOSPITAL_MANAGER',
  INVENTORY_MANAGER: 'HOSPITAL_MANAGER',
  SHOPKEEPER: 'SHOPKEEPER',
  STOCK_COUNTER: 'SHOPKEEPER',
  SUPPLIER: 'SUPPLIER',
};

/**
 * Validates Supabase Bearer token or legacy JWT token
 * Populates req.user with tenant scope (role, hospital_id, supplier_id, city, regional_heads / shopkeepers details)
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Missing Bearer authentication token in Authorization header.',
    });
  }

  const token = authHeader.split(' ')[1].trim();

  // 1. Try Supabase Auth verification
  if (supabaseAdmin) {
    try {
      const { data: authData, error: authErr } = await supabaseAdmin.auth.getUser(token);
      if (!authErr && authData && authData.user) {
        const user = authData.user;

        // Fetch tenant scope profile from public.user_profiles
        let profile = null;
        try {
          const { data: profData } = await supabaseAdmin
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          profile = profData;
        } catch (e) {}

        const rawRole = profile?.role || user.user_metadata?.role || 'SHOPKEEPER';
        const normalizedRole = ROLE_ALIASES[rawRole] || rawRole;

        // Fetch role specific details
        let regHead = null;
        let shopkeeper = null;
        if (normalizedRole === 'REGIONAL_HEAD') {
          try {
            const { data: rhData } = await supabaseAdmin
              .from('regional_heads')
              .select('*')
              .eq('user_id', user.id)
              .single();
            regHead = rhData;
          } catch (e) {}
        } else if (normalizedRole === 'SHOPKEEPER') {
          try {
            const { data: skData } = await supabaseAdmin
              .from('shopkeepers')
              .select('*')
              .eq('user_id', user.id)
              .single();
            shopkeeper = skData;
          } catch (e) {}
        }

        req.user = {
          id: user.id,
          email: user.email,
          full_name: profile?.full_name || user.user_metadata?.full_name || user.email,
          name: profile?.full_name || user.user_metadata?.full_name || user.email,
          role: normalizedRole,
          legacyRole: rawRole,
          hospital_id: profile?.hospital_id || user.user_metadata?.hospital_id || null,
          hospitalId: profile?.hospital_id || user.user_metadata?.hospital_id || null,
          supplier_id: profile?.supplier_id || user.user_metadata?.supplier_id || null,
          supplierId: profile?.supplier_id || user.user_metadata?.supplier_id || null,
          city: profile?.city || user.user_metadata?.city || null,
          region_name: regHead?.region_name || user.user_metadata?.region_name || 'MP_CENTRAL_WEST',
          assigned_cities: regHead?.assigned_cities || ['BHOPAL', 'INDORE', 'JABALPUR'],
          warehouse_bay: shopkeeper?.warehouse_bay || user.user_metadata?.warehouse_bay || 'COLD_CHAIN_BAY_1',
          can_approve_dispatch: shopkeeper?.can_approve_dispatch ?? true,
          can_approve_receipt: shopkeeper?.can_approve_receipt ?? true,
          authSource: 'SUPABASE',
        };

        return next();
      }
    } catch (err) {}
  }

  // 2. Fallback: Local JWT verification (For demo / offline / test compatibility)
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const rawRole = decoded.role || 'SHOPKEEPER';
    const normalizedRole = ROLE_ALIASES[rawRole] || rawRole;

    req.user = {
      id: decoded.id || 'demo-user-id',
      email: decoded.email,
      name: decoded.name || decoded.fullName || decoded.full_name || decoded.email,
      full_name: decoded.fullName || decoded.full_name || decoded.name || decoded.email,
      role: normalizedRole,
      legacyRole: rawRole,
      hospital_id: decoded.hospitalId || decoded.hospital_id || null,
      hospitalId: decoded.hospitalId || decoded.hospital_id || null,
      supplier_id: decoded.supplierId || decoded.supplier_id || null,
      supplierId: decoded.supplierId || decoded.supplier_id || null,
      city: decoded.city || null,
      region_name: decoded.region_name || decoded.region || 'MP_CENTRAL_WEST',
      assigned_cities: decoded.assigned_cities || ['BHOPAL', 'INDORE', 'JABALPUR'],
      warehouse_bay: decoded.warehouse_bay || decoded.warehouseBay || 'COLD_CHAIN_BAY_1',
      can_approve_dispatch: decoded.can_approve_dispatch ?? true,
      can_approve_receipt: decoded.can_approve_receipt ?? true,
      authSource: 'LOCAL_JWT',
    };

    return next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token. Please sign in again.',
      error: err.message,
    });
  }
}

/**
 * Role-Based Access Control Middleware
 * Supports multiple allowed roles and always permits REGIONAL_HEAD / REGIONAL_ADMIN
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required prior to RBAC evaluation.',
      });
    }

    const userRole = req.user.role;
    const legacyRole = req.user.legacyRole;

    // REGIONAL_HEAD / REGIONAL_ADMIN possesses superuser permissions across all scopes
    if (userRole === 'REGIONAL_HEAD' || userRole === 'REGIONAL_ADMIN' || legacyRole === 'REGIONAL_ADMIN') {
      return next();
    }

    // Expand allowed roles to support aliases (e.g. SHOPKEEPER or STOCK_COUNTER)
    const expandedAllowed = new Set();
    for (const role of allowedRoles) {
      expandedAllowed.add(role);
      expandedAllowed.add(ROLE_ALIASES[role] || role);
      // Map reverse aliases
      for (const [alias, canonical] of Object.entries(ROLE_ALIASES)) {
        if (canonical === role) expandedAllowed.add(alias);
      }
    }

    if (expandedAllowed.has(userRole) || (legacyRole && expandedAllowed.has(legacyRole))) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Forbidden: User with role '${userRole}' lacks permission for this endpoint. Required: [${allowedRoles.join(', ')}]`,
    });
  };
}

module.exports = {
  requireAuth,
  requireRole,
  ROLE_ALIASES,
};
