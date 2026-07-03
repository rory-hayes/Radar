import { NextResponse } from "next/server";

import { buildWorkspaceExportPayload } from "@/lib/data-lifecycle/workspace-export";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { membershipCan } from "@/lib/workspaces/permissions";
import { getActiveWorkspaceForCurrentUser } from "@/lib/workspaces/server";

export async function GET() {
  const membership = await getActiveWorkspaceForCurrentUser();

  if (!membership) {
    return NextResponse.json({ error: "Create or join a workspace before continuing." }, { status: 401 });
  }

  if (!membershipCan(membership, "workspace:manage")) {
    return NextResponse.json({ error: "Only workspace admins can export workspace data." }, { status: 403 });
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured for this environment." }, { status: 503 });
  }

  const payload = await buildWorkspaceExportPayload(supabase, membership.workspace);
  const body = JSON.stringify(payload, null, 2);

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${workspaceExportFileName(membership.workspace.slug, payload.exportedAt)}"`,
      "Cache-Control": "no-store",
    },
  });
}

function workspaceExportFileName(slug: string, exportedAt: string) {
  return `radar-workspace-export-${slug}-${exportedAt.slice(0, 10)}.json`;
}
