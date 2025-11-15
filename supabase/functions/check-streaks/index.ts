import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend';
import { corsHeaders } from '../shared/cors.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL');
const PUBLIC_EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];

const isPublicDomain = (email: string) => {
  if (!email) return false;
  const domain = email.split('@')[1];
  return PUBLIC_EMAIL_DOMAINS.includes(domain);
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const caller = req.headers.get('x-supabase-caller');
  if (caller !== 'postgres') {
    return new Response(JSON.stringify({ error: 'Unauthorized: This function can only be called by the database.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 401,
    });
  }

  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
    const errorMsg = 'RESEND_API_KEY or RESEND_FROM_EMAIL is not configured in Edge Function secrets.';
    console.error(`Configuration Error: ${errorMsg}`);
    return new Response(JSON.stringify({ error: errorMsg }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  if (isPublicDomain(RESEND_FROM_EMAIL)) {
    console.warn(`[CRITICAL CONFIGURATION WARNING] The 'From' address ('${RESEND_FROM_EMAIL}') is from a public domain. Resend will likely block these emails. Please use a verified custom domain.`);
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const resend = new Resend(RESEND_API_KEY);

    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, username, email, current_streak, last_streak_updated, email_notifications_enabled')
      .gt('current_streak', 0)
      .eq('email_notifications_enabled', true);

    if (profileError) throw profileError;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const emailResults = [];
    const brokenStreakPromises = profiles.map(async (profile) => {
      if (!profile.last_streak_updated) return;
      
      const lastUpdated = new Date(profile.last_streak_updated);
      lastUpdated.setUTCHours(0, 0, 0, 0);

      const diffTime = today.getTime() - lastUpdated.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 1) {
        await supabaseAdmin
          .from('profiles')
          .update({ current_streak: 0 })
          .eq('id', profile.id);

        if (profile.email) {
          const emailPayload = {
            from: RESEND_FROM_EMAIL,
            to: profile.email,
            subject: 'Your Productivity Streak on DoEase has been Reset',
            html: `
              <p>Hi ${profile.username},</p>
              <p>It looks like you missed a day, and your productivity streak of ${profile.current_streak} days has been reset. Don't worry, you can start a new one today!</p>
              <p>Complete any task to begin a new streak.</p>
              <p>Best,</p>
              <p>The DoEase Team</p>
            `,
          };

          console.log(`Attempting to send streak break email. From: ${RESEND_FROM_EMAIL}, To: ${profile.email}`);

          try {
            const { data, error } = await resend.emails.send(emailPayload);

            if (error) {
              console.error(`Resend API Error (Streak Break): To=${profile.email}, From=${RESEND_FROM_EMAIL}. Error: ${JSON.stringify(error, null, 2)}`);
              emailResults.push({ success: false, email: profile.email, error });
            } else {
              console.log(`Streak break email sent successfully to ${profile.email}. ID: ${data?.id}`);
              emailResults.push({ success: true, email: profile.email, data });
            }
          } catch (networkError) {
            console.error(`Network Error (Streak Break): ${networkError.message}`);
            emailResults.push({ success: false, email: profile.email, error: networkError.message });
          }
        }
      }
    });

    await Promise.all(brokenStreakPromises);
    
    const successfulEmails = emailResults.filter(r => r.success).length;
    const failedEmails = emailResults.length - successfulEmails;

    return new Response(JSON.stringify({ 
        message: `Streak check completed. Sent: ${successfulEmails}. Failed: ${failedEmails}.`,
        results: emailResults 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('General error in check-streaks function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
