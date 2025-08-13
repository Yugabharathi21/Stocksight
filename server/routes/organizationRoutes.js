import express from 'express';
import { supabase } from '../lib/supabaseAdmin.js';

const router = express.Router();

// Send organization invitation email
router.post('/send-invite-email', async (req, res) => {
  try {
    const { to, organizationName, inviterName, role, inviteLink } = req.body;

    const emailData = {
      to: to,
      subject: `You're invited to join ${organizationName} on Stocksight`,
      template: 'organization_invite',
      data: {
        organizationName,
        inviterName,
        role,
        inviteLink,
        logoUrl: `${process.env.FRONTEND_URL}/logo.png`,
        supportEmail: process.env.ADMIN_EMAIL || 'support@stocksight.com'
      }
    };

    // Send via n8n webhook if enabled
    if (process.env.USE_N8N_WEBHOOK === 'true' && process.env.N8N_WEBHOOK_URL) {
      const webhookResponse = await fetch(process.env.N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'organization_invite',
          ...emailData
        })
      });

      if (!webhookResponse.ok) {
        throw new Error('Webhook request failed');
      }

      const result = await webhookResponse.json();
      console.log('✅ Organization invite email sent via n8n:', result);
    } else {
      console.log('📧 Email would be sent:', emailData);
    }

    res.json({ 
      success: true, 
      message: 'Invitation email sent successfully' 
    });

  } catch (error) {
    console.error('❌ Failed to send invitation email:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send invitation email' 
    });
  }
});

// Get organization invitation details (for email templates)
router.get('/invitation/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const { data, error } = await supabase
      .from('organization_invitations')
      .select(`
        id,
        email,
        role,
        created_at,
        expires_at,
        organizations (
          id,
          name,
          slug,
          description
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

    if (error || !data) {
      return res.status(404).json({ 
        success: false, 
        error: 'Invitation not found' 
      });
    }

    // Check if expired
    if (new Date(data.expires_at) < new Date()) {
      return res.status(410).json({ 
        success: false, 
        error: 'Invitation has expired' 
      });
    }

    res.json({
      success: true,
      invitation: data
    });

  } catch (error) {
    console.error('❌ Failed to get invitation details:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get invitation details' 
    });
  }
});

export default router;
