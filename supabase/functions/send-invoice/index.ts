// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: any) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    // Verify user via native Supabase Auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error('Invalid JWT: Access denied')

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) throw new Error("RESEND_API_KEY is missing");

    const reqBody = await req.json();
    const { to, subject, message, pdfBase64, pdfName, fromName } = reqBody;

    if (!to || !subject || !pdfBase64) {
      throw new Error("Missing required fields: to, subject, pdfBase64");
    }

    // Default to a verified domain if configured, otherwise use the Resend testing email
    const from_email = Deno.env.get('RESEND_FROM_EMAIL') || `onboarding@resend.dev`;
    const from_display = fromName || 'DMGE Invoicing';

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: `${from_display} <${from_email}>`,
        to: [to],
        subject: subject,
        text: message || 'Please find your invoice attached.',
        attachments: [
          {
            filename: pdfName || 'invoice.pdf',
            content: pdfBase64.split(',').pop(), // Remove data:application/pdf;base64, prefix if present
          }
        ]
      })
    });

    const body = await resendRes.json();

    if (!resendRes.ok) {
      console.error("[Resend Error]", body);
      return new Response(JSON.stringify({ error: body.message || 'Failed to send email' }), {
        status: resendRes.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, id: body.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error("[send-invoice] error", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
