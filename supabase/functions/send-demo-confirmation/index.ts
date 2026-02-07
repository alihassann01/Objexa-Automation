// Supabase Edge Function: send-demo-confirmation
// Deploy this to Supabase Functions

// To deploy:
// 1. Install Supabase CLI: npm install -g supabase
// 2. Login: supabase login
// 3. Link project: supabase link --project-ref vtlblicmwoaohjgbjpix
// 4. Create function: supabase functions new send-demo-confirmation
// 5. Replace the code in supabase/functions/send-demo-confirmation/index.ts with this
// 6. Set secret: supabase secrets set RESEND_API_KEY=your_resend_api_key
// 7. Deploy: supabase functions deploy send-demo-confirmation

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface BookingData {
    name: string;
    email: string;
    phone: string;
    practice_name: string;
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
        const bookingData: BookingData = await req.json();

        // Send email via Resend
        const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: "Objexa Automation <noreply@contact.objexaautomation.tech>",
                to: [bookingData.email],
                subject: "🎉 Your Demo is Confirmed - Objexa Automation",
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
              .title { font-size: 24px; margin-bottom: 20px; }
              .details { background: rgba(139, 92, 246, 0.1); border-radius: 8px; padding: 20px; margin: 20px 0; }
              .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
              .label { color: #a0a0a0; }
              .value { color: #fff; font-weight: 500; }
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
                <h1 class="title">🎉 Demo Confirmed!</h1>
                <p>Hi ${bookingData.name},</p>
                <p>Thank you for booking a demo with Objexa Automation! We're excited to show you how our AI-powered solutions can transform your dental practice.</p>
                
                <div class="details">
                  <div class="detail-row">
                    <span class="label">Name:</span>
                    <span class="value">${bookingData.name}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Practice:</span>
                    <span class="value">${bookingData.practice_name}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Email:</span>
                    <span class="value">${bookingData.email}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Phone:</span>
                    <span class="value">${bookingData.phone}</span>
                  </div>
                </div>
                
                <p>Our team will contact you within 24 hours to schedule your personalized demo session.</p>
                
                <a href="https://objexaautomation.tech" class="cta">Visit Our Website</a>
              </div>
              <div class="footer">
                <p>© 2026 Objexa Automation. All rights reserved.</p>
                <p>If you didn't request this demo, please ignore this email.</p>
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
