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

const getEmailContent = (taskName: string, username: string, type: 'start' | 'end') => {
  if (type === 'end') {
    return {
      subject: `✅ Reminder: Task "${taskName}" is ending soon!`,
      html: `<p>Hi ${username},</p><p>Just a friendly reminder that your task, <strong>"${taskName}"</strong>, is scheduled to end shortly. Time to wrap things up!</p><p>Keep up the great work!</p>`,
    };
  }
  return {
    subject: `⏰ Reminder: Task "${taskName}" is starting soon!`,
    html: `<p>Hi ${username},</p><p>Just a friendly reminder that your task, <strong>"${taskName}"</strong>, is scheduled to begin shortly.</p><p>You got this!</p>`,
  };
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

    const { data: tasksToNotify, error: rpcError } = await supabaseAdmin.rpc('get_tasks_to_notify');
    if (rpcError) throw rpcError;

    if (!tasksToNotify || tasksToNotify.length === 0) {
      return new Response(JSON.stringify({ message: "No tasks to notify." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const emailResults = [];
    for (const task of tasksToNotify) {
      if (task.email && task.username) {
        const { subject, html } = getEmailContent(task.name, task.username, task.notification_type);

        const emailPayload = {
            from: RESEND_FROM_EMAIL,
            to: task.email,
            subject: subject,
            html: html,
        };
        
        console.log(`Attempting to send ${task.notification_type} email. From: ${RESEND_FROM_EMAIL}, To: ${task.email}`);

        try {
            const { data, error } = await resend.emails.send(emailPayload);
            if (error) {
                console.error(`Resend API Error (Task Reminder): To=${task.email}, From=${RESEND_FROM_EMAIL}. Error: ${JSON.stringify(error, null, 2)}`);
                emailResults.push({ success: false, email: task.email, error });
            } else {
                console.log(`Email sent successfully to ${task.email}. ID: ${data?.id}`);
                emailResults.push({ success: true, email: task.email, data });
            }
        } catch (networkError) {
            console.error(`Network Error (Task Reminder): ${networkError.message}`);
            emailResults.push({ success: false, email: task.email, error: networkError.message });
        }
      }
    }

    const successfulEmails = emailResults.filter(r => r.success).length;
    const failedEmails = emailResults.length - successfulEmails;

    return new Response(JSON.stringify({ 
        message: `Task reminder check complete. Sent: ${successfulEmails}. Failed: ${failedEmails}.`,
        results: emailResults 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('General error in send-task-reminders function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
