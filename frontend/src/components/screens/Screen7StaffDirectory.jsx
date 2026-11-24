import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import CopyButton from '../common/CopyButton';
import {
  Users,
  Shield,
  Building2,
  Truck,
  MapPin,
  CheckCircle2,
  RefreshCw,
  Search,
  KeyRound,
  Database,
} from 'lucide-react';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000') + '/api';

export default function Screen7StaffDirectory() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedCity, setSelectedCity] = useState('ALL');

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/regional/users`);
      if (res.data?.success) {
        setStaff(res.data.users || res.data.data || []);
      }
    } catch (err) {
      console.warn('Failed to fetch regional staff:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const filteredStaff = useMemo(() => {
    let list = [...staff];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (u) =>
          u.fullName?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.userId?.toLowerCase().includes(q) ||
          u.hospitalId?.toLowerCase().includes(q) ||
          u.supplierId?.toLowerCase().includes(q)
      );
    }

    if (selectedRole !== 'ALL') {
      list = list.filter((u) => u.role === selectedRole);
    }

    if (selectedCity !== 'ALL') {
      list = list.filter((u) => u.city?.toUpperCase() === selectedCity);
    }

    return list;
  }, [staff, searchQuery, selectedRole, selectedCity]);

  const roleBadge = (role) => {
    if (role === 'REGIONAL_HEAD' || role === 'REGIONAL_ADMIN') {
      return 'bg-volt text-volt-text font-bold';
    }
    if (role === 'HOSPITAL_MANAGER' || role === 'INVENTORY_MANAGER') {
      return 'bg-abyss-elevated text-abyss-text border border-sand-border font-bold';
    }
    if (role === 'SHOPKEEPER' || role === 'STOCK_COUNTER') {
      return 'bg-abyss-elevated text-volt border border-sand-border font-bold';
    }
    return 'bg-sand-base text-sand-text border border-sand-border font-semibold';
  };

  return (
    <div className="space-y-5 text-abyss-text font-sans">
      {/* Top Bento Header */}
      <div className="rounded-xl bg-abyss-card border border-sand-border p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 rounded-xl bg-abyss-elevated border border-sand-border text-volt">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl sm:text-2xl font-black text-abyss-text tracking-tight">
                  Regional Staff & Enterprise Directory
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-volt text-volt-text">
                  SAP UserSet Live
                </span>
              </div>
              <p className="text-xs text-abyss-muted font-mono mt-0.5">
                Centralized directory of Regional Directors, Facility Managers, Warehouse Shopkeepers, and Qualified Vendors.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchStaff}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-abyss-elevated border border-sand-border text-abyss-text hover:border-volt transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-volt ${loading ? 'animate-spin' : ''}`} />
            <span>Sync UserSet</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl bg-abyss-card border border-sand-border flex flex-wrap items-center justify-between gap-3 shadow-sm font-mono text-xs">
        <div className="flex items-center space-x-3 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-abyss-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, email, facility ID, or vendor ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-abyss-elevated border border-sand-border text-abyss-text placeholder-abyss-muted focus:outline-none focus:ring-1 focus:ring-volt"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-abyss-elevated border border-sand-border text-abyss-text focus:outline-none focus:ring-1 focus:ring-volt"
          >
            <option value="ALL">All Roles</option>
            <option value="REGIONAL_HEAD">Regional Head</option>
            <option value="HOSPITAL_MANAGER">Hospital Manager</option>
            <option value="SHOPKEEPER">Shopkeeper</option>
            <option value="SUPPLIER">Supplier</option>
          </select>

          {/* City Filter */}
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-abyss-elevated border border-sand-border text-abyss-text focus:outline-none focus:ring-1 focus:ring-volt"
          >
            <option value="ALL">All Municipalities</option>
            <option value="BHOPAL">Bhopal</option>
            <option value="INDORE">Indore</option>
            <option value="JABALPUR">Jabalpur</option>
          </select>
        </div>
      </div>

      {/* Responsive Staff Table */}
      <div className="rounded-xl bg-abyss-card border border-sand-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-sand-border bg-abyss-elevated text-[11px] text-abyss-muted uppercase tracking-wider">
                <th className="py-3 px-4">User ID</th>
                <th className="py-3 px-4">Full Name & Email</th>
                <th className="py-3 px-4">System Role</th>
                <th className="py-3 px-4">Facility / Hub</th>
                <th className="py-3 px-4">Municipality</th>
                <th className="py-3 px-4">Warehouse Bay</th>
                <th className="py-3 px-4 text-center">Authorization</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-sand-border">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-abyss-muted">
                    {loading ? 'Querying SAP Gateway UserSet...' : 'No matching staff members found.'}
                  </td>
                </tr>
              ) : (
                filteredStaff.map((u, i) => (
                  <tr key={u.userId || i} className="hover:bg-abyss-elevated/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-volt">{u.userId}</span>
                        <CopyButton text={u.userId} label="User ID" />
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-sans font-bold text-abyss-text">{u.fullName}</div>
                      <div className="text-[11px] text-abyss-muted">{u.email}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${roleBadge(u.role)}`}>
                        {u.role}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {u.hospitalId ? (
                        <div className="flex items-center space-x-1">
                          <Building2 className="w-3.5 h-3.5 text-volt" />
                          <span>{u.hospitalId}</span>
                        </div>
                      ) : u.supplierId ? (
                        <div className="flex items-center space-x-1">
                          <Truck className="w-3.5 h-3.5 text-volt" />
                          <span>{u.supplierId}</span>
                        </div>
                      ) : (
                        <span className="text-abyss-muted">Regional HQ</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-abyss-muted" />
                        <span>{u.city || 'ALL'}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-abyss-muted">
                      {u.warehouseBay || '—'}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {u.canApprove ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-volt text-volt-text">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Sign-Off Active</span>
                        </span>
                      ) : (
                        <span className="text-abyss-muted text-[10px]">Read-Only</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-abyss-elevated border-t border-sand-border text-xs font-mono text-abyss-muted flex items-center justify-between">
          <span>Active Staff Records: <strong className="text-abyss-text">{filteredStaff.length}</strong></span>
          <span className="text-[11px]">Synchronized via SAP Gateway ZPLUSE_SRV</span>
        </div>
      </div>
    </div>
  );
}
