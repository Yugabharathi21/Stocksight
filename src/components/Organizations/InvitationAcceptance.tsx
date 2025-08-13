import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Building2, 
  CheckCircle, 
  XCircle, 
  Mail,
  Users,
  Clock
} from 'lucide-react';

interface InvitationDetails {
  id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    avatar_url: string | null;
  };
  invited_by_user: {
    email: string;
    full_name: string | null;
  };
}

const InvitationAcceptance: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, signIn } = useAuth();
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Login form for non-authenticated users
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    if (token) {
      fetchInvitationDetails();
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchInvitationDetails = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('organization_invitations')
        .select(`
          id,
          email,
          role,
          created_at,
          expires_at,
          organization_id,
          invited_by,
          organizations (
            id,
            name,
            slug,
            description,
            avatar_url
          ),
          users!organization_invitations_invited_by_fkey (
            email,
            full_name
          )
        `)
        .eq('invitation_token', token)
        .is('accepted_at', null)
        .is('declined_at', null)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        setError('Invitation not found or has already been processed');
        return;
      }

      // Check if invitation has expired
      if (new Date(data.expires_at) < new Date()) {
        setError('This invitation has expired');
        return;
      }

      const invitationDetails: InvitationDetails = {
        id: data.id,
        email: data.email,
        role: data.role,
        created_at: data.created_at,
        expires_at: data.expires_at,
        organization: Array.isArray(data.organizations) ? data.organizations[0] : data.organizations,
        invited_by_user: Array.isArray(data.users) ? data.users[0] : data.users
      };

      setInvitation(invitationDetails);
      setLoginForm({ ...loginForm, email: data.email });

    } catch (error) {
      console.error('Error fetching invitation:', error);
      setError('Failed to load invitation details');
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async () => {
    if (!token || !user) return;

    try {
      setAccepting(true);
      
      const { data: accepted, error } = await supabase.rpc('accept_organization_invitation', {
        invitation_token: token
      });

      if (error) throw error;

      if (accepted) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/organizations');
        }, 2000);
      } else {
        setError('Failed to accept invitation. Please check if the invitation is still valid.');
      }

    } catch (error) {
      console.error('Error accepting invitation:', error);
      setError('Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn(loginForm.email, loginForm.password);
      // After successful login, user will be available and we can accept invitation
    } catch {
      setError('Login failed. Please check your credentials.');
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-[#556B2F] border-t-transparent rounded-full"></div>
          <p className="text-[#8F9779]">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-800 mb-2">Invitation Error</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-[#556B2F] text-white px-6 py-2 rounded-lg hover:bg-[#4A5A2A] transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-xl shadow-sm border border-green-200 p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-green-800 mb-2">Welcome to {invitation?.organization.name}!</h2>
            <p className="text-green-600 mb-6">You have successfully joined the organization. Redirecting...</p>
            <div className="animate-spin w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-xl shadow-sm border border-[#A3B18A]/20 p-8 text-center">
            <Mail className="h-16 w-16 text-[#A3B18A] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[#2F3E2F] mb-2">Invitation Not Found</h2>
            <p className="text-[#8F9779] mb-6">This invitation link may be invalid or has already been used.</p>
            <button
              onClick={() => navigate('/')}
              className="bg-[#556B2F] text-white px-6 py-2 rounded-lg hover:bg-[#4A5A2A] transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-xl shadow-lg border border-[#A3B18A]/20 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#556B2F] to-[#4A5A2A] text-white p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Organization Invitation</h1>
                <p className="text-white/80">Join your team on Stocksight</p>
              </div>
            </div>
          </div>

          {/* Invitation Details */}
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#F5F5F0] rounded-xl flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-8 w-8 text-[#556B2F]" />
              </div>
              <h2 className="text-xl font-bold text-[#2F3E2F] mb-2">
                {invitation.organization.name}
              </h2>
              {invitation.organization.description && (
                <p className="text-[#8F9779] text-sm mb-3">{invitation.organization.description}</p>
              )}
              <div className="flex items-center justify-center space-x-2 text-sm text-[#8F9779]">
                <Users className="h-4 w-4" />
                <span>@{invitation.organization.slug}</span>
              </div>
            </div>

            <div className="bg-[#F5F5F0] rounded-lg p-4 mb-6">
              <h3 className="font-medium text-[#2F3E2F] mb-3">Invitation Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#8F9779]">Invited by:</span>
                  <span className="text-[#2F3E2F]">
                    {invitation.invited_by_user.full_name || invitation.invited_by_user.email}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8F9779]">Role:</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRoleBadgeColor(invitation.role)}`}>
                    {invitation.role}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8F9779]">Expires:</span>
                  <span className="text-[#2F3E2F] flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {new Date(invitation.expires_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {user ? (
              user.email === invitation.email ? (
                // User is logged in and email matches
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-green-800 font-medium">Ready to join!</span>
                    </div>
                    <p className="text-green-700 text-sm mt-1">
                      You're logged in as {user.email}
                    </p>
                  </div>
                  <button
                    onClick={acceptInvitation}
                    disabled={accepting}
                    className="w-full bg-[#556B2F] text-white py-3 rounded-lg hover:bg-[#4A5A2A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {accepting ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                        <span>Joining...</span>
                      </>
                    ) : (
                      <>
                        <Building2 className="h-4 w-4" />
                        <span>Accept Invitation</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                // User is logged in but email doesn't match
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <XCircle className="h-5 w-5 text-yellow-600" />
                      <span className="text-yellow-800 font-medium">Email mismatch</span>
                    </div>
                    <p className="text-yellow-700 text-sm mt-1">
                      You're logged in as {user.email}, but this invitation is for {invitation.email}
                    </p>
                  </div>
                  <button
                    onClick={() => {/* Implement logout */}}
                    className="w-full border border-[#A3B18A] text-[#8F9779] py-2 rounded-lg hover:bg-[#F5F5F0] transition-colors"
                  >
                    Sign out and use correct account
                  </button>
                </div>
              )
            ) : (
              // User is not logged in
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <span className="text-blue-800 font-medium">Sign in required</span>
                  </div>
                  <p className="text-blue-700 text-sm mt-1">
                    Please sign in to accept this invitation
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-3">
                  <div>
                    <input
                      type="email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      placeholder="Email address"
                      className="w-full px-3 py-2 border border-[#A3B18A]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#556B2F]"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      placeholder="Password"
                      className="w-full px-3 py-2 border border-[#A3B18A]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#556B2F]"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[#556B2F] text-white py-2 rounded-lg hover:bg-[#4A5A2A] transition-colors"
                  >
                    Sign In & Accept Invitation
                  </button>
                </form>

                <div className="text-center">
                  <p className="text-sm text-[#8F9779]">
                    Don't have an account?{' '}
                    <button
                      onClick={() => navigate('/signup')}
                      className="text-[#556B2F] hover:underline"
                    >
                      Sign up
                    </button>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvitationAcceptance;
