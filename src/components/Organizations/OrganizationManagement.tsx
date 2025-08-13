import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Building2, 
  Plus, 
  Users, 
  Settings, 
  Crown, 
  Shield, 
  Eye,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  Copy,
  Send
} from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avatar_url: string | null;
  website_url: string | null;
  is_verified: boolean;
  plan: string;
  max_members: number;
  created_at: string;
  member_count?: number;
  user_role?: string;
}

interface OrganizationMember {
  id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  user: {
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface OrganizationInvitation {
  id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
  invitation_token: string;
  invited_by_user: {
    email: string;
    full_name: string | null;
  };
}

const OrganizationManagement: React.FC = () => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'invitations' | 'settings'>('overview');
  
  // Modal states
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  // Form states
  const [newOrg, setNewOrg] = useState({
    name: '',
    slug: '',
    description: ''
  });
  
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'member'
  });

  useEffect(() => {
    fetchOrganizations();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedOrg) {
      fetchOrgDetails();
    }
  }, [selectedOrg]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      
      // Get organizations where user is a member
      const { data: orgMemberships, error } = await supabase
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
        .eq('user_id', user?.id)
        .eq('status', 'active');

      if (error) throw error;

      // Transform data and add member counts
      const orgsWithDetails = await Promise.all(
        (orgMemberships || []).map(async (membership: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          const org = Array.isArray(membership.organizations) ? membership.organizations[0] : membership.organizations;
          
          // Get member count
          const { count } = await supabase
            .from('organization_memberships')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', org.id)
            .eq('status', 'active');

          return {
            ...org,
            member_count: count || 0,
            user_role: membership.role
          };
        })
      );

      setOrganizations(orgsWithDetails);
      
      // Select first org if none selected
      if (!selectedOrg && orgsWithDetails.length > 0) {
        setSelectedOrg(orgsWithDetails[0]);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrgDetails = async () => {
    if (!selectedOrg) return;

    try {
      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('organization_memberships')
        .select(`
          id,
          user_id,
          role,
          status,
          joined_at,
          users!inner (
            email,
            full_name,
            avatar_url
          )
        `)
        .eq('organization_id', selectedOrg.id)
        .eq('status', 'active')
        .order('joined_at', { ascending: true });

      if (membersError) throw membersError;

      setMembers(membersData?.map((m: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
        id: m.id,
        user_id: m.user_id,
        role: m.role,
        status: m.status,
        joined_at: m.joined_at,
        user: Array.isArray(m.users) ? m.users[0] : m.users
      })) || []);

      // Fetch invitations
      const { data: invitationsData, error: invitationsError } = await supabase
        .from('organization_invitations')
        .select(`
          id,
          email,
          role,
          created_at,
          expires_at,
          invitation_token,
          invited_by,
          users!organization_invitations_invited_by_fkey (
            email,
            full_name
          )
        `)
        .eq('organization_id', selectedOrg.id)
        .is('accepted_at', null)
        .is('declined_at', null)
        .order('created_at', { ascending: false });

      if (invitationsError) throw invitationsError;

      setInvitations(invitationsData?.map((inv: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
        id: inv.id,
        email: inv.email,
        role: inv.role,
        created_at: inv.created_at,
        expires_at: inv.expires_at,
        invitation_token: inv.invitation_token,
        invited_by_user: Array.isArray(inv.users) ? inv.users[0] : inv.users
      })) || []);

    } catch (error) {
      console.error('Error fetching org details:', error);
    }
  };

  const createOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.rpc('create_organization_with_owner', {
        org_name: newOrg.name,
        org_slug: newOrg.slug,
        org_description: newOrg.description || null
      });

      if (error) throw error;

      setNewOrg({ name: '', slug: '', description: '' });
      setShowCreateOrg(false);
      await fetchOrganizations();
      
      alert('Organization created successfully!');
    } catch (error) {
      console.error('Error creating organization:', error);
      alert('Failed to create organization. Please try again.');
    }
  };

  const inviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;

    try {
      const { data: token, error } = await supabase.rpc('invite_user_to_organization', {
        org_id: selectedOrg.id,
        user_email: inviteForm.email,
        user_role: inviteForm.role
      });

      if (error) throw error;

      // Send email via your email service
      const inviteLink = `${window.location.origin}/invite/${token}`;
      
      // Call your email service (you can integrate with your existing n8n webhook)
      try {
        await fetch('/api/send-invite-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: inviteForm.email,
            organizationName: selectedOrg.name,
            inviterName: user?.full_name || user?.email,
            role: inviteForm.role,
            inviteLink
          })
        });
      } catch (emailError) {
        console.warn('Email sending failed:', emailError);
      }

      setInviteForm({ email: '', role: 'member' });
      setShowInviteModal(false);
      await fetchOrgDetails();
      
      alert(`Invitation sent to ${inviteForm.email}!`);
    } catch (error) {
      console.error('Error inviting user:', error);
      alert('Failed to send invitation. Please try again.');
    }
  };

  const updateMemberRole = async (memberId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('organization_memberships')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', memberId);

      if (error) throw error;

      await fetchOrgDetails();
      alert('Member role updated successfully!');
    } catch (error) {
      console.error('Error updating member role:', error);
      alert('Failed to update member role.');
    }
  };

  const removeMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      const { error } = await supabase
        .from('organization_memberships')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      await fetchOrgDetails();
      alert('Member removed successfully!');
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member.');
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('organization_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      await fetchOrgDetails();
      alert('Invitation cancelled!');
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      alert('Failed to cancel invitation.');
    }
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(link);
    alert('Invite link copied to clipboard!');
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'member': return 'bg-green-100 text-green-800 border-green-200';
      case 'viewer': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-3 w-3" />;
      case 'admin': return <Shield className="h-3 w-3" />;
      case 'member': return <Users className="h-3 w-3" />;
      case 'viewer': return <Eye className="h-3 w-3" />;
      default: return <Users className="h-3 w-3" />;
    }
  };

  const canManageMembers = (userRole: string) => {
    return ['owner', 'admin'].includes(userRole);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-[#556B2F] border-t-transparent rounded-full"></div>
          <p className="text-[#8F9779]">Loading organizations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#2F3E2F] mb-2">Organizations</h2>
          <p className="text-[#8F9779]">Manage your organizations and team members</p>
        </div>
        <button
          onClick={() => setShowCreateOrg(true)}
          className="bg-[#556B2F] text-white px-4 py-2 rounded-lg hover:bg-[#4A5A2A] transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Organization</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Organization Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-[#A3B18A]/20 p-4">
            <h3 className="font-semibold text-[#2F3E2F] mb-4">Your Organizations</h3>
            <div className="space-y-2">
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => setSelectedOrg(org)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedOrg?.id === org.id 
                      ? 'bg-[#F5F5F0] border border-[#556B2F]' 
                      : 'hover:bg-[#F5F5F0]/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#556B2F] rounded-lg flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#2F3E2F] truncate">{org.name}</p>
                      <div className="flex items-center space-x-2 text-xs text-[#8F9779]">
                        <span className={`px-1.5 py-0.5 rounded-full border text-xs ${getRoleBadgeColor(org.user_role || '')}`}>
                          {org.user_role}
                        </span>
                        <span>{org.member_count} members</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {selectedOrg ? (
            <div className="space-y-6">
              {/* Organization Header */}
              <div className="bg-white rounded-xl shadow-sm border border-[#A3B18A]/20 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-[#556B2F] rounded-xl flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-xl font-bold text-[#2F3E2F]">{selectedOrg.name}</h3>
                        {selectedOrg.is_verified && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                      <p className="text-[#8F9779]">@{selectedOrg.slug}</p>
                      {selectedOrg.description && (
                        <p className="text-sm text-[#8F9779] mt-1">{selectedOrg.description}</p>
                      )}
                    </div>
                  </div>
                  {canManageMembers(selectedOrg.user_role || '') && (
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="bg-[#556B2F] text-white px-4 py-2 rounded-lg hover:bg-[#4A5A2A] transition-colors flex items-center space-x-2"
                    >
                      <Mail className="h-4 w-4" />
                      <span>Invite Members</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="bg-white rounded-xl shadow-sm border border-[#A3B18A]/20">
                <div className="border-b border-[#A3B18A]/20">
                  <nav className="flex space-x-8 px-6">
                    {[
                      { id: 'overview', label: 'Overview', icon: Building2 },
                      { id: 'members', label: 'Members', icon: Users },
                      { id: 'invitations', label: 'Invitations', icon: Mail },
                      { id: 'settings', label: 'Settings', icon: Settings }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as 'overview' | 'members' | 'invitations' | 'settings')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                          activeTab === tab.id
                            ? 'border-[#556B2F] text-[#556B2F]'
                            : 'border-transparent text-[#8F9779] hover:text-[#2F3E2F] hover:border-[#A3B18A]'
                        }`}
                      >
                        <tab.icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </nav>
                </div>

                <div className="p-6">
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-[#F5F5F0] p-4 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Users className="h-5 w-5 text-[#556B2F]" />
                            <span className="font-medium text-[#2F3E2F]">Members</span>
                          </div>
                          <p className="text-2xl font-bold text-[#2F3E2F] mt-2">{selectedOrg.member_count}</p>
                          <p className="text-sm text-[#8F9779]">of {selectedOrg.max_members} max</p>
                        </div>
                        <div className="bg-[#F5F5F0] p-4 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Mail className="h-5 w-5 text-[#556B2F]" />
                            <span className="font-medium text-[#2F3E2F]">Pending Invites</span>
                          </div>
                          <p className="text-2xl font-bold text-[#2F3E2F] mt-2">{invitations.length}</p>
                          <p className="text-sm text-[#8F9779]">awaiting response</p>
                        </div>
                        <div className="bg-[#F5F5F0] p-4 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-5 w-5 text-[#556B2F]" />
                            <span className="font-medium text-[#2F3E2F]">Created</span>
                          </div>
                          <p className="text-lg font-semibold text-[#2F3E2F] mt-2">
                            {new Date(selectedOrg.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-[#8F9779]">
                            {Math.floor((Date.now() - new Date(selectedOrg.created_at).getTime()) / (1000 * 60 * 60 * 24))} days ago
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Members Tab */}
                  {activeTab === 'members' && (
                    <div className="space-y-4">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-[#F5F5F0] border-b border-[#A3B18A]/20">
                            <tr>
                              <th className="text-left py-3 px-4 text-[#2F3E2F] font-semibold">Member</th>
                              <th className="text-left py-3 px-4 text-[#2F3E2F] font-semibold">Role</th>
                              <th className="text-left py-3 px-4 text-[#2F3E2F] font-semibold">Joined</th>
                              {canManageMembers(selectedOrg.user_role || '') && (
                                <th className="text-right py-3 px-4 text-[#2F3E2F] font-semibold">Actions</th>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#A3B18A]/10">
                            {members.map((member) => (
                              <tr key={member.id} className="hover:bg-[#F5F5F0]/50">
                                <td className="py-3 px-4">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-[#556B2F] rounded-full flex items-center justify-center">
                                      <Users className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-[#2F3E2F]">
                                        {member.user.full_name || 'No name'}
                                      </p>
                                      <p className="text-sm text-[#8F9779]">{member.user.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full border ${getRoleBadgeColor(member.role)}`}>
                                    {getRoleIcon(member.role)}
                                    <span>{member.role}</span>
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-sm text-[#8F9779]">
                                  {new Date(member.joined_at).toLocaleDateString()}
                                </td>
                                {canManageMembers(selectedOrg.user_role || '') && member.user_id !== user?.id && (
                                  <td className="py-3 px-4 text-right">
                                    <div className="flex items-center justify-end space-x-2">
                                      <select
                                        value={member.role}
                                        onChange={(e) => updateMemberRole(member.id, e.target.value)}
                                        className="text-xs border border-[#A3B18A]/30 rounded px-2 py-1"
                                      >
                                        <option value="viewer">Viewer</option>
                                        <option value="member">Member</option>
                                        <option value="admin">Admin</option>
                                        {selectedOrg.user_role === 'owner' && (
                                          <option value="owner">Owner</option>
                                        )}
                                      </select>
                                      <button
                                        onClick={() => removeMember(member.id)}
                                        className="text-red-600 hover:text-red-800 text-xs"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Invitations Tab */}
                  {activeTab === 'invitations' && (
                    <div className="space-y-4">
                      {invitations.length === 0 ? (
                        <div className="text-center py-8">
                          <Mail className="h-12 w-12 text-[#A3B18A] mx-auto mb-4" />
                          <p className="text-[#8F9779]">No pending invitations</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {invitations.map((invitation) => (
                            <div key={invitation.id} className="border border-[#A3B18A]/20 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-[#8F9779] rounded-full flex items-center justify-center">
                                    <Mail className="h-4 w-4 text-white" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-[#2F3E2F]">{invitation.email}</p>
                                    <div className="flex items-center space-x-2 text-sm text-[#8F9779]">
                                      <span>Invited as</span>
                                      <span className={`px-2 py-0.5 rounded-full border text-xs ${getRoleBadgeColor(invitation.role)}`}>
                                        {invitation.role}
                                      </span>
                                      <span>by {invitation.invited_by_user.full_name || invitation.invited_by_user.email}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-[#8F9779]">
                                    Expires {new Date(invitation.expires_at).toLocaleDateString()}
                                  </span>
                                  <button
                                    onClick={() => copyInviteLink(invitation.invitation_token)}
                                    className="p-1 text-[#556B2F] hover:bg-[#F5F5F0] rounded"
                                    title="Copy invite link"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </button>
                                  {canManageMembers(selectedOrg.user_role || '') && (
                                    <button
                                      onClick={() => cancelInvitation(invitation.id)}
                                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                                      title="Cancel invitation"
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Settings Tab */}
                  {activeTab === 'settings' && (
                    <div className="space-y-6">
                      <div className="bg-[#F5F5F0] p-4 rounded-lg">
                        <h4 className="font-medium text-[#2F3E2F] mb-2">Organization Settings</h4>
                        <p className="text-sm text-[#8F9779]">Settings panel coming soon...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-[#A3B18A]/20 p-12 text-center">
              <Building2 className="h-16 w-16 text-[#A3B18A] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#2F3E2F] mb-2">No Organization Selected</h3>
              <p className="text-[#8F9779] mb-6">Select an organization from the sidebar or create a new one</p>
              <button
                onClick={() => setShowCreateOrg(true)}
                className="bg-[#556B2F] text-white px-6 py-2 rounded-lg hover:bg-[#4A5A2A] transition-colors"
              >
                Create Organization
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Organization Modal */}
      {showCreateOrg && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-[#2F3E2F]">Create Organization</h3>
                <button
                  onClick={() => setShowCreateOrg(false)}
                  className="text-[#8F9779] hover:text-[#2F3E2F]"
                >
                  ×
                </button>
              </div>

              <form onSubmit={createOrganization} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#2F3E2F] mb-1">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newOrg.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setNewOrg({ 
                        ...newOrg, 
                        name,
                        slug: generateSlug(name)
                      });
                    }}
                    className="w-full px-3 py-2 border border-[#A3B18A]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#556B2F]"
                    placeholder="Acme Corporation"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2F3E2F] mb-1">
                    URL Slug
                  </label>
                  <div className="flex items-center">
                    <span className="text-sm text-[#8F9779] mr-2">stocksight.com/</span>
                    <input
                      type="text"
                      required
                      value={newOrg.slug}
                      onChange={(e) => setNewOrg({ ...newOrg, slug: generateSlug(e.target.value) })}
                      className="flex-1 px-3 py-2 border border-[#A3B18A]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#556B2F]"
                      placeholder="acme-corp"
                    />
                  </div>
                  <p className="text-xs text-[#8F9779] mt-1">Used for your organization's URL</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2F3E2F] mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newOrg.description}
                    onChange={(e) => setNewOrg({ ...newOrg, description: e.target.value })}
                    className="w-full px-3 py-2 border border-[#A3B18A]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#556B2F]"
                    rows={3}
                    placeholder="Brief description of your organization..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateOrg(false)}
                    className="flex-1 px-4 py-2 border border-[#A3B18A]/30 text-[#8F9779] rounded-lg hover:bg-[#F5F5F0] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-[#556B2F] text-white rounded-lg hover:bg-[#4A5A2A] transition-colors"
                  >
                    Create Organization
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteModal && selectedOrg && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-[#2F3E2F]">Invite to {selectedOrg.name}</h3>
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
                    placeholder="colleague@example.com"
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
                    <option value="viewer">Viewer - Read-only access</option>
                    <option value="member">Member - Can manage products and view reports</option>
                    <option value="admin">Admin - Can manage members and settings</option>
                    {selectedOrg.user_role === 'owner' && (
                      <option value="owner">Owner - Full access including billing</option>
                    )}
                  </select>
                </div>

                <div className="bg-[#F5F5F0] p-3 rounded-lg">
                  <p className="text-sm text-[#2F3E2F] font-medium mb-1">What happens next?</p>
                  <ul className="text-xs text-[#8F9779] space-y-1">
                    <li>• An invitation email will be sent</li>
                    <li>• They'll receive a secure link to join</li>
                    <li>• Invitation expires in 7 days</li>
                  </ul>
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
                    className="flex-1 px-4 py-2 bg-[#556B2F] text-white rounded-lg hover:bg-[#4A5A2A] transition-colors flex items-center justify-center space-x-2"
                  >
                    <Send className="h-4 w-4" />
                    <span>Send Invite</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationManagement;
