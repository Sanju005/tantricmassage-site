// Supabase Edge Function: sends a Telegram alert when a customer sends a private message.
// Secrets (Dashboard -> Edge Functions -> Secrets): TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, WEBHOOK_SECRET
// Deploy with "Verify JWT" turned OFF; the WEBHOOK_SECRET header is the protection.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SITE = "https://www.massagekl.com";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (req.headers.get("x-webhook-secret") !== Deno.env.get("WEBHOOK_SECRET")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = await req.json().catch(() => null);
  const record = payload?.record;
  if (payload?.type !== "INSERT" || !record || record.sender !== "customer") {
    return new Response("ignored", { status: 200 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data: conv } = await supabase
    .from("conversations")
    .select("contact")
    .eq("id", record.conversation_id)
    .maybeSingle();

  const text = [
    "New private message",
    "",
    String(record.body).slice(0, 900),
    conv?.contact ? `\nContact: ${conv.contact}` : "",
    "",
    `Reply: ${SITE}/admin-chat.html?c=${record.conversation_id}`,
  ].join("\n");

  const res = await fetch(
    `https://api.telegram.org/bot${Deno.env.get("TELEGRAM_BOT_TOKEN")}/sendMessage`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: Deno.env.get("TELEGRAM_CHAT_ID"),
        text,
        disable_web_page_preview: true,
      }),
    },
  );
  return new Response(res.ok ? "sent" : "telegram error", { status: res.ok ? 200 : 502 });
});
