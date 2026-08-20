// Edge function: sends moderation email (via DB webhook) and handles approve/reject links.
// Deploy: supabase functions deploy moderate-review
// Secrets: supabase secrets set RESEND_API_KEY=re_xxx OWNER_EMAIL=you@example.com

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const OWNER_EMAIL = Deno.env.get("OWNER_EMAIL")!;
const FUNC_BASE = `${Deno.env.get("SUPABASE_URL")}/functions/v1/moderate-review`;

function mailLink(action: string, reviewId: string, token: string) {
  return `${FUNC_BASE}?action=${action}&id=${reviewId}&token=${token}`;
}

async function sendModerationEmail(reviewId: string) {
  const { data: review } = await supabase
    .from("reviews")
    .select("name, rating, description, admin_token")
    .eq("id", reviewId)
    .single();

  if (!review) {
    console.error("review not found, id:", reviewId);
    return null;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Reviews <onboarding@resend.dev>",
      to: [OWNER_EMAIL],
      subject: `New review from ${review.name} (${review.rating}/5)`,
      html: `
        <p><strong>${review.name}</strong> rated you <strong>${review.rating}/5</strong></p>
        <p>${review.description.replace(/\n/g, "<br>")}</p>
        <p><a href="${mailLink("approve", reviewId, review.admin_token)}">Approve and publish</a></p>
        <p><a href="${mailLink("reject", reviewId, review.admin_token)}">Reject</a></p>
      `,
    }),
  });

  const resBody = await res.text();
  const result = {
    status: res.status,
    ok: res.ok,
    body: resBody,
  };
  console.log("resend result:", JSON.stringify(result));
  return result;
}

serve(async (req) => {
  const url = new URL(req.url);

  if (url.searchParams.has("action")) {
    const action = url.searchParams.get("action");
    const id = url.searchParams.get("id");
    const token = url.searchParams.get("token");
    if (!id || !token) return new Response("missing params", { status: 400 });

    const { data: review } = await supabase
      .from("reviews")
      .select("id, admin_token")
      .eq("id", id)
      .single();
    if (!review || review.admin_token !== token) {
      return new Response("invalid token", { status: 403 });
    }

    const status = action === "approve" ? "approved" : "rejected";
    await supabase.from("reviews").update({ status }).eq("id", id);
    return new Response(
      `Review ${status === "approved" ? "approved and published" : "rejected"}. You can close this tab.`,
      { headers: { "Content-Type": "text/plain" } },
    );
  }

  const payload = await req.json();
  console.log("webhook payload:", JSON.stringify(payload).substring(0, 200));
  if (payload.type === "INSERT" && payload.table === "reviews") {
    const emailResult = await sendModerationEmail(payload.record.id);
    // Return the email result so the caller can see it
    if (emailResult) {
      return new Response(
        JSON.stringify({ emailSent: emailResult.ok, status: emailResult.status, body: emailResult.body }),
        { headers: { "Content-Type": "application/json" } }
      );
    }
  }

  return new Response("ok");
});