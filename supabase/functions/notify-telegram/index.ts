// Supabase Edge Function, called by a database trigger for every new chat message.
//  - customer message -> Telegram alert + browser push to the admin's devices
//  - admin reply      -> browser push to the customer's device (generic text, no message content)
// Secrets: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, WEBHOOK_SECRET, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
// Deploy with "Verify JWT" turned OFF; the WEBHOOK_SECRET header is the protection.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import webpush from "npm:web-push@3.6.7";

const SITE = "https://www.massagekl.com";

function safeSiteUrl(value: string | null): string {
  try {
    const u = new URL(value ?? "");
    if (u.protocol === "https:" && (u.hostname === "massagekl.com" || u.hostname.endsWith(".massagekl.com"))) {
      return u.toString();
    }
  } catch { /* fall through */ }
  return SITE + "/";
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (req.headers.get("x-webhook-secret") !== Deno.env.get("WEBHOOK_SECRET")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = await req.json().catch(() => null);
  const record = payload?.record;
  if (payload?.type !== "INSERT" || !record) return new Response("ignored", { status: 200 });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data: conv } = await supabase
    .from("conversations")
    .select("contact, customer_id")
    .eq("id", record.conversation_id)
    .maybeSingle();

  const fromCustomer = record.sender === "customer";
  const preview = record.body ? String(record.body).slice(0, 900) : "";
  const results: Promise<boolean>[] = [];

  if (fromCustomer) {
    const lines = ["New private message", "", preview || "[Photo attached]"];
    if (preview && record.image_path) lines.push("[Photo attached]");
    if (conv?.contact) lines.push("", `Contact: ${conv.contact}`);
    lines.push("", `Reply: ${SITE}/admin-chat.html?c=${record.conversation_id}`);
    results.push(
      fetch(`https://api.telegram.org/bot${Deno.env.get("TELEGRAM_BOT_TOKEN")}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: Deno.env.get("TELEGRAM_CHAT_ID"),
          text: lines.join("\n"),
          disable_web_page_preview: true,
        }),
      }).then((r) => r.ok).catch(() => false),
    );
  }

  // ----- browser push -----
  const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY");
  if (vapidPublic && vapidPrivate) {
    webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@massagekl.com", vapidPublic, vapidPrivate);

    let userIds: string[] = [];
    if (fromCustomer) {
      const { data: admins } = await supabase.from("admins").select("user_id");
      userIds = (admins ?? []).map((a: { user_id: string }) => a.user_id);
    } else if (conv?.customer_id) {
      userIds = [conv.customer_id];
    }

    if (userIds.length) {
      const { data: subs } = await supabase
        .from("push_subscriptions")
        .select("endpoint, user_id, subscription, page_url")
        .in("user_id", userIds);

      for (const s of subs ?? []) {
        const body = JSON.stringify(
          fromCustomer
            ? {
              title: "New private message",
              body: (preview || "[Photo]").slice(0, 100),
              url: `${SITE}/admin-chat.html?c=${record.conversation_id}`,
              tag: `conv-${record.conversation_id}`,
            }
            : {
              title: "You have a new reply",
              body: "Tap to open your private chat.",
              url: safeSiteUrl(s.page_url),
              tag: "chat-reply",
            },
        );
        results.push(
          webpush.sendNotification(s.subscription, body, { TTL: 86400, urgency: "high" })
            .then(() => true)
            .catch(async (err: { statusCode?: number }) => {
              if (err?.statusCode === 404 || err?.statusCode === 410) {
                await supabase.from("push_subscriptions").delete().eq("endpoint", s.endpoint).eq("user_id", s.user_id);
              }
              return false;
            }),
        );
      }
    }
  }

  const ok = (await Promise.all(results)).some(Boolean) || results.length === 0;
  return new Response(ok ? "done" : "delivery error", { status: ok ? 200 : 502 });
});
