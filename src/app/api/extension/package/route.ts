import { NextResponse } from "next/server";

import { requireApiAuth } from "@/lib/auth/api";
import {
  buildExtensionPackage,
  extensionPackageFileName,
} from "@/lib/extension/package";
import { ApiError } from "@/lib/sessions/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireApiAuth();
    const body = await buildExtensionPackage();

    return new Response(body, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${extensionPackageFileName}"`,
        "Content-Length": String(body.length),
        "Content-Type": "application/zip",
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: error.status },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "extension_package_failed",
          message: "Radar could not prepare the extension download.",
        },
      },
      { status: 500 },
    );
  }
}
