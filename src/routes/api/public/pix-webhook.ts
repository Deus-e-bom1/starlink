import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

// The gateway's postback is unsigned, so we never trust its body:
// we only take the transaction id and re-read the real status from the gateway API.
export const Route = createFileRoute("/api/public/pix-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => null);
        const parsed = z.object({ id: z.string().min(1).max(200) }).safeParse(body);
        if (!parsed.success) return new Response("bad request", { status: 400 });
        const { syncOrderFromGateway } = await import("@/lib/pix.server");
        await syncOrderFromGateway(parsed.data.id).catch((e) => console.error("webhook sync", e));
        return new Response("ok");
      },
    },
  },
});
