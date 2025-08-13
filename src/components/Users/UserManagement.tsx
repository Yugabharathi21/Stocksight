import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Users, 
  Edit3, 
  Trash2, 
  Mail,
  Calendar,
  Search,
  Filter,
  UserPlus,
  Crown
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

interface UserInvite {
  email: string;
  full_name: string;
  role: string;
  is_admin: boolean;
}

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [inviteForm, setInviteForm] = useState<UserInvite>({
    email: '',
    full_name: '',
    role: 'user',
    is_admin: false
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const inviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // First, invite the user via Supabase Auth
      const { error } = await supabase.auth.admin.inviteUserByEmail(
        inviteForm.email,
        {
          data: {
            full_name: inviteForm.full_name,
            role: inviteForm.role,
            is_admin: inviteForm.is_admin
          },
          redirectTo: `${window.location.origin}/auth/callback`
        }
      );

      if (error) throw error;

      // Reset form
      setInviteForm({
        email: '',
        full_name: '',
        role: 'user',
        is_admin: false
      });
      setShowInviteModal(false);

      // Refresh users list
      await fetchUsers();
      
      alert('User invitation sent successfully!');
    } catch (error) {
      console.error('Error inviting user:', error);
      alert('Failed to invite user. Please try again.');
    }
  };

  const updateUserRole = async (userId: string, newRole: string, isAdmin: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          role: newRole, 
          is_admin: isAdmin,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      await fetchUsers();
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role.');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete from auth.users (this will cascade to public.users)
      const { error } = await supabase.auth.admin.deleteUser(userId);

      if (error) throw error;

      await fetchUsers();
      alert('User deleted successfully.');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user.');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (role: string, isAdmin: boolean) => {
    if (isAdmin) return 'bg-red-100 text-red-800 border-red-200';
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'manager': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'staff': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const canManageUser = (targetUser: User) => {
    // Prevent users from managing themselves or higher privilege users
    if (targetUser.id === currentUser?.id) return false;
    if (!currentUser?.is_admin && targetUser.is_admin) return false;
    return currentUser?.is_admin || currentUser?.role === 'admin';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-[#556B2F] border-t-transparent rounded-full"></div>
          <p className="text-[#8F9779]">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#2F3E2F] mb-2">User Management</h2>
          <p className="text-[#8F9779]">Manage team members and their permissions</p>
        </div>
        {currentUser?.is_admin && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="bg-[#556B2F] text-white px-4 py-2 rounded-lg hover:bg-[#4A5A2A] transition-colors flex items-center space-x-2"
          >
            <UserPlus className="h-4 w-4" />
            <span>Invite User</span>
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-[#A3B18A]/20">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8F9779] h-4 w-4" />
            <input
              type="text"
              placeholder="Search users by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#A3B18A]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#556B2F] focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8F9779] h-4 w-4" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-[#A3B18A]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#556B2F] focus:border-transparent bg-white"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
              <option value="user">User</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-[#A3B18A]/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F5F5F0] border-b border-[#A3B18A]/20">
              <tr>
                <th className="text-left py-4 px-6 text-[#2F3E2F] font-semibold">User</th>
                <th className="text-left py-4 px-6 text-[#2F3E2F] font-semibold">Role</th>
                <th className="text-left py-4 px-6 text-[#2F3E2F] font-semibold">Status</th>
                <th className="text-left py-4 px-6 text-[#2F3E2F] font-semibold">Joined</th>
                <th className="text-right py-4 px-6 text-[#2F3E2F] font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#A3B18A]/10">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-[#F5F5F0]/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.full_name || user.email}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-[#556B2F] rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-[#2F3E2F]">
                          {user.full_name || 'No name set'}
                        </p>
                        <p className="text-sm text-[#8F9779] flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRoleBadgeColor(user.role, user.is_admin)}`}>
                        {user.is_admin ? (
                          <span className="flex items-center">
                            <Crown className="h-3 w-3 mr-1" />
                            Super Admin
                          </span>
                        ) : (
                          user.role.charAt(0).toUpperCase() + user.role.slice(1)
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 border border-green-200">
                      Active
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center text-sm text-[#8F9779]">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end space-x-2">
                      {canManageUser(user) && (
                        <>
                          <button
                            onClick={() => setEditingUser(user)}
                            className="p-2 text-[#556B2F] hover:bg-[#F5F5F0] rounded-lg transition-colors"
                            title="Edit user"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete user"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-[#A3B18A] mx-auto mb-4" />
            <p className="text-[#8F9779]">No users found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-[#2F3E2F]">Invite New User</h3>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-[#8F9779] hover:text-[#2F3E2F]"
                >
                  ×
                </button>
              </div>

              <form onSubmit={inviteUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#2F3E2F] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-[#A3B18A]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#556B2F]"
                    placeholder="user@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2F3E2F] mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteForm.full_name}
                    onChange={(e) => setInviteForm({ ...inviteForm, full_name: e.target.value })}
                    className="w-full px-3 py-2 border border-[#A3B18A]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#556B2F]"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2F3E2F] mb-1">
                    Role
                  </label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                    className="w-full px-3 py-2 border border-[#A3B18A]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#556B2F]"
                  >
                    <option value="user">User</option>
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isAdmin"
                    checked={inviteForm.is_admin}
                    onChange={(e) => setInviteForm({ ...inviteForm, is_admin: e.target.checked })}
                    className="rounded border-[#A3B18A]/30 text-[#556B2F] focus:ring-[#556B2F]"
                  />
                  <label htmlFor="isAdmin" className="text-sm text-[#2F3E2F]">
                    Grant super admin privileges
                  </label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 px-4 py-2 border border-[#A3B18A]/30 text-[#8F9779] rounded-lg hover:bg-[#F5F5F0] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-[#556B2F] text-white rounded-lg hover:bg-[#4A5A2A] transition-colors"
                  >
                    Send Invite
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-[#2F3E2F]">Edit User Role</h3>
                <button
                  onClick={() => setEditingUser(null)}
                  className="text-[#8F9779] hover:text-[#2F3E2F]"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-[#F5F5F0] rounded-lg">
                  <div className="w-10 h-10 bg-[#556B2F] rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-[#2F3E2F]">{editingUser.full_name}</p>
                    <p className="text-sm text-[#8F9779]">{editingUser.email}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2F3E2F] mb-1">
                    Role
                  </label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="w-full px-3 py-2 border border-[#A3B18A]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#556B2F]"
                  >
                    <option value="user">User</option>
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="editIsAdmin"
                    checked={editingUser.is_admin}
                    onChange={(e) => setEditingUser({ ...editingUser, is_admin: e.target.checked })}
                    className="rounded border-[#A3B18A]/30 text-[#556B2F] focus:ring-[#556B2F]"
                  />
                  <label htmlFor="editIsAdmin" className="text-sm text-[#2F3E2F]">
                    Super admin privileges
                  </label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setEditingUser(null)}
                    className="flex-1 px-4 py-2 border border-[#A3B18A]/30 text-[#8F9779] rounded-lg hover:bg-[#F5F5F0] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => updateUserRole(editingUser.id, editingUser.role, editingUser.is_admin)}
                    className="flex-1 px-4 py-2 bg-[#556B2F] text-white rounded-lg hover:bg-[#4A5A2A] transition-colors"
                  >
                    Update Role
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
