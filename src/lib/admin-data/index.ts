export type AdminRole =
  | "owner"
  | "admin"
  | "knowledge_manager"
  | "approver"
  | "analyst"
  | "viewer";

export type AdminCapability =
  | "manageSources"
  | "manageConnectors"
  | "manageUsers"
  | "managePlaybooks"
  | "approveGuidance"
  | "runReplay"
  | "reviewSessions"
  | "viewAnalytics"
  | "manageSettings"
  | "viewAuditLog";

export type AdminResource =
  | "overview"
  | "users"
  | "sources"
  | "uploads"
  | "connectors"
  | "playbooks"
  | "approvals"
  | "testing-replay"
  | "knowledge-gaps"
  | "analytics"
  | "sessions"
  | "settings"
  | "audit-log";

export type AdminRecord = Record<string, unknown>;

export type AdminContext =
  | {
      state: "ready";
      role: AdminRole;
      capabilities: Record<AdminCapability, boolean>;
      apiBaseUrl: string;
      missingConfig: [];
    }
  | {
      state: "not_configured";
      role: null;
      capabilities: Record<AdminCapability, false>;
      apiBaseUrl: null;
      missingConfig: string[];
    };

export type AdminDataResult<T> =
  | {
      state: "not_configured";
      message: string;
      missingConfig: string[];
    }
  | {
      state: "unauthorized";
      message: string;
    }
  | {
      state: "error";
      message: string;
    }
  | {
      state: "empty";
      message: string;
    }
  | {
      state: "ready";
      data: T;
    };

const capabilityDefaults: Record<AdminCapability, false> = {
  manageSources: false,
  manageConnectors: false,
  manageUsers: false,
  managePlaybooks: false,
  approveGuidance: false,
  runReplay: false,
  reviewSessions: false,
  viewAnalytics: false,
  manageSettings: false,
  viewAuditLog: false,
};

const capabilitiesByRole: Record<AdminRole, AdminCapability[]> = {
  owner: [
    "manageSources",
    "manageConnectors",
    "manageUsers",
    "managePlaybooks",
    "approveGuidance",
    "runReplay",
    "reviewSessions",
    "viewAnalytics",
    "manageSettings",
    "viewAuditLog",
  ],
  admin: [
    "manageSources",
    "manageConnectors",
    "manageUsers",
    "managePlaybooks",
    "approveGuidance",
    "runReplay",
    "reviewSessions",
    "viewAnalytics",
    "manageSettings",
    "viewAuditLog",
  ],
  knowledge_manager: [
    "manageSources",
    "manageConnectors",
    "managePlaybooks",
    "runReplay",
    "reviewSessions",
    "viewAnalytics",
  ],
  approver: ["approveGuidance", "runReplay", "reviewSessions", "viewAnalytics"],
  analyst: ["runReplay", "reviewSessions", "viewAnalytics", "viewAuditLog"],
  viewer: ["reviewSessions", "viewAnalytics"],
};

const resourcePaths: Record<AdminResource, string> = {
  overview: "overview",
  users: "users",
  sources: "sources",
  uploads: "uploads",
  connectors: "connectors",
  playbooks: "playbooks",
  approvals: "approvals",
  "testing-replay": "testing-replay",
  "knowledge-gaps": "knowledge-gaps",
  analytics: "analytics",
  sessions: "sessions",
  settings: "settings",
  "audit-log": "audit-log",
};

function capabilitiesFor(role: AdminRole): Record<AdminCapability, boolean> {
  const allowed = new Set(capabilitiesByRole[role]);

  return Object.fromEntries(
    Object.keys(capabilityDefaults).map((capability) => [
      capability,
      allowed.has(capability as AdminCapability),
    ])
  ) as Record<AdminCapability, boolean>;
}

function parseRole(value: string | undefined): AdminRole {
  const normalized = value?.trim();
  const validRoles: AdminRole[] = [
    "owner",
    "admin",
    "knowledge_manager",
    "approver",
    "analyst",
    "viewer",
  ];

  if (validRoles.includes(normalized as AdminRole)) {
    return normalized as AdminRole;
  }

  return "viewer";
}

export async function getAdminContext(): Promise<AdminContext> {
  const apiBaseUrl = process.env.RADAR_ADMIN_API_BASE_URL?.trim();
  const apiToken = process.env.RADAR_ADMIN_API_TOKEN?.trim();
  const missingConfig = [
    !apiBaseUrl ? "RADAR_ADMIN_API_BASE_URL" : null,
    !apiToken ? "RADAR_ADMIN_API_TOKEN" : null,
  ].filter(Boolean) as string[];

  if (missingConfig.length > 0 || !apiBaseUrl) {
    return {
      state: "not_configured",
      role: null,
      capabilities: capabilityDefaults,
      apiBaseUrl: null,
      missingConfig,
    };
  }

  const role = parseRole(process.env.RADAR_ADMIN_ROLE);

  return {
    state: "ready",
    role,
    capabilities: capabilitiesFor(role),
    apiBaseUrl,
    missingConfig: [],
  };
}

export function can(
  context: AdminContext,
  capability: AdminCapability
): boolean {
  return context.capabilities[capability] === true;
}

export async function getAdminCollection(
  resource: AdminResource,
  context?: AdminContext
): Promise<AdminDataResult<AdminRecord[]>> {
  const adminContext = context ?? (await getAdminContext());

  if (adminContext.state === "not_configured") {
    return {
      state: "not_configured",
      message: "Connect the admin API and auth token before this data can load.",
      missingConfig: adminContext.missingConfig,
    };
  }

  return requestAdminApi<AdminRecord[]>(
    adminContext,
    resourcePaths[resource],
    "collection"
  );
}

export async function getAdminRecord(
  resource: "sources" | "playbooks" | "sessions",
  id: string,
  context?: AdminContext,
  childPath?: string
): Promise<AdminDataResult<AdminRecord>> {
  const adminContext = context ?? (await getAdminContext());

  if (adminContext.state === "not_configured") {
    return {
      state: "not_configured",
      message: "Connect the admin API and auth token before this record can load.",
      missingConfig: adminContext.missingConfig,
    };
  }

  const path = [resourcePaths[resource], encodeURIComponent(id), childPath]
    .filter(Boolean)
    .join("/");

  return requestAdminApi<AdminRecord>(adminContext, path, "record");
}

async function requestAdminApi<T>(
  context: Extract<AdminContext, { state: "ready" }>,
  path: string,
  expected: "collection" | "record"
): Promise<AdminDataResult<T>> {
  try {
    const url = toAdminUrl(context.apiBaseUrl, path);
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${process.env.RADAR_ADMIN_API_TOKEN}`,
      },
    });

    if (response.status === 401 || response.status === 403) {
      return {
        state: "unauthorized",
        message:
          "The current admin credentials do not allow this Knowledge Studio view.",
      };
    }

    if (response.status === 404) {
      return {
        state: "empty",
        message:
          expected === "collection"
            ? "No records were returned for this view."
            : "This record was not found.",
      };
    }

    if (!response.ok) {
      return {
        state: "error",
        message: `The admin API returned ${response.status}.`,
      };
    }

    const payload = (await response.json()) as unknown;
    const data = normalizePayload<T>(payload, expected);

    if (isEmptyData(data, expected)) {
      return {
        state: "empty",
        message:
          expected === "collection"
            ? "No records were returned for this view."
            : "This record was not found.",
      };
    }

    return {
      state: "ready",
      data,
    };
  } catch {
    return {
      state: "error",
      message: "The admin API could not be reached from the server.",
    };
  }
}

function normalizePayload<T>(payload: unknown, expected: "collection" | "record"): T {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    (expected === "record" || Array.isArray((payload as { data?: unknown }).data))
  ) {
    return (payload as { data: T }).data;
  }

  if (
    payload &&
    typeof payload === "object" &&
    "items" in payload &&
    Array.isArray((payload as { items?: unknown }).items)
  ) {
    return (payload as { items: T }).items;
  }

  return payload as T;
}

function isEmptyData(data: unknown, expected: "collection" | "record"): boolean {
  if (expected === "collection") {
    return !Array.isArray(data) || data.length === 0;
  }

  return !data || typeof data !== "object" || Array.isArray(data);
}

function toAdminUrl(baseUrl: string, path: string): string {
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;

  return new URL(path, base).toString();
}
