// Supabase Edge Function: send-password-reset-confirmation
// Sends email notification when password is successfully reset

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface ResetData {
    email: string;
    name?: string;
}

serve(async (req) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response(null, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
        });
    }

    try {
        const resetData: ResetData = await req.json();

        const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: "Objexa Automation <noreply@contact.objexaautomation.tech>",
                to: [resetData.email],
                subject: "🔐 Password Reset Successful - Objexa Automation",
                html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a0f; color: #fff; }
              .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .logo { font-size: 28px; font-weight: bold; background: linear-gradient(135deg, #8b5cf6, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
              .card { background: linear-gradient(145deg, #1a1a2e, #16213e); border-radius: 16px; padding: 30px; border: 1px solid rgba(139, 92, 246, 0.3); }
              .icon { width: 80px; height: 80px; background: rgba(16, 185, 129, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 40px; }
              .title { font-size: 24px; margin-bottom: 20px; text-align: center; }
              .content { color: #d1d5db; line-height: 1.7; }
              .warning { background: rgba(251, 191, 36, 0.15); border: 1px solid rgba(251, 191, 36, 0.4); border-radius: 8px; padding: 16px; margin: 20px 0; }
              .warning-text { color: #fbbf24; font-size: 14px; }
              .cta { display: inline-block; background: linear-gradient(135deg, #8b5cf6, #06b6d4); color: #fff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">Objexa Automation</div>
              </div>
              <div class="card">
                <div class="icon">🔐</div>
                <h1 class="title">Password Changed</h1>
                <div class="content">
                  <p>Hi${resetData.name ? ` ${resetData.name}` : ''},</p>
                  <p>Your password for your Objexa Automation account has been successfully reset.</p>
                  
                  <div class="warning">
                    <p class="warning-text">⚠️ If you did not make this change, please contact our support team immediately and secure your account.</p>
                  </div>
                  
                  <p>You can now log in with your new password.</p>
                  
                  <center>
                    <a href="https://objexaautomation.tech/auth.html" class="cta">Go to Login</a>
                  </center>
                </div>
              </div>
              <div class="footer">
                <p>© 2026 Objexa Automation. All rights reserved.</p>
                <p>This is an automated security notification.</p>
              </div>
            </div>
          </body>
          </html>
        `,
            }),
        });

        if (!emailResponse.ok) {
            const errorData = await emailResponse.json();
            throw new Error(JSON.stringify(errorData));
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        });
    } catch (error) {
        console.error("Error sending email:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        });
    }
});
