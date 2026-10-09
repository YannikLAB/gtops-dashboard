type CourseraTokenResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
};

type SafeCourseraError = {
  status?: number;
  statusText?: string;
  message: string;
  responsePreview?: string;
};

export class CourseraApiError extends Error {
  details: SafeCourseraError;

  constructor(details: SafeCourseraError) {
    super(details.message);
    this.name = "CourseraApiError";
    this.details = details;
  }
}

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new CourseraApiError({
      message: `Missing required environment variable: ${name}`,
    });
  }

  return value;
}

function getCourseraConfig() {
  return {
    clientId: getRequiredEnv("COURSERA_CLIENT_ID"),
    clientSecret: getRequiredEnv("COURSERA_CLIENT_SECRET"),
    orgId: getRequiredEnv("COURSERA_ORG_ID"),
    authMode: process.env.COURSERA_AUTH_MODE ?? "basic",
    tokenUrl:
      process.env.COURSERA_TOKEN_URL ??
      "https://accounts.coursera.org/oauth2/v1/token",
    apiBaseUrl: process.env.COURSERA_API_BASE_URL ?? "https://api.coursera.org/api",
    reportPath: process.env.COURSERA_REPORT_PATH,
  };
}

async function safeResponsePreview(response: Response) {
  const text = await response.text();
  return text.slice(0, 700);
}

function getBasicAuthHeader() {
  const config = getCourseraConfig();

  return `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString(
    "base64",
  )}`;
}

export async function getCourseraAccessToken() {
  const config = getCourseraConfig();
  const basicAuth = getBasicAuthHeader();

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new CourseraApiError({
      status: response.status,
      statusText: response.statusText,
      message: "Coursera token request failed.",
      responsePreview: await safeResponsePreview(response),
    });
  }

  const json = (await response.json()) as CourseraTokenResponse;

  if (!json.access_token) {
    throw new CourseraApiError({
      message: "Coursera token response did not include access_token.",
      responsePreview: JSON.stringify(json).slice(0, 700),
    });
  }

  return json;
}

export function getConfiguredReportInfo() {
  const config = getCourseraConfig();

  return {
    orgId: config.orgId,
    apiBaseUrl: config.apiBaseUrl,
    reportPath: config.reportPath ?? null,
    configured: Boolean(config.reportPath),
  };
}

export async function fetchConfiguredCourseraReport() {
  const config = getCourseraConfig();

  if (!config.reportPath) {
    throw new CourseraApiError({
      message:
        "Missing COURSERA_REPORT_PATH. Add a documented Coursera Business report endpoint path before fetching reports.",
    });
  }

  const url = new URL(config.reportPath, `${config.apiBaseUrl}/`);

  if (!url.searchParams.has("orgId") && !url.searchParams.has("businessId")) {
    url.searchParams.set("orgId", config.orgId);
  }

  const headers: HeadersInit = {
    Accept: "application/json",
  };

  if (config.authMode === "oauth-client-credentials") {
    const token = await getCourseraAccessToken();
    headers.Authorization = `Bearer ${token.access_token}`;
  } else if (config.authMode === "basic") {
    headers.Authorization = getBasicAuthHeader();
  } else {
    throw new CourseraApiError({
      message:
        "Unsupported COURSERA_AUTH_MODE. Use 'basic' or 'oauth-client-credentials'.",
    });
  }

  const response = await fetch(url, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new CourseraApiError({
      status: response.status,
      statusText: response.statusText,
      message: "Coursera report request failed.",
      responsePreview: await safeResponsePreview(response),
    });
  }

  const json: unknown = await response.json();

  return {
    url: url.toString().replace(config.orgId, "[org-id]"),
    data: json,
  };
}

export function summarizeUnknownJson(value: unknown) {
  if (Array.isArray(value)) {
    return {
      type: "array",
      length: value.length,
      firstItemKeys:
        value[0] && typeof value[0] === "object" ? Object.keys(value[0]) : [],
    };
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return {
      type: "object",
      keys: Object.keys(record),
      elementCount: Array.isArray(record.elements) ? record.elements.length : null,
      pagingKeys:
        record.paging && typeof record.paging === "object"
          ? Object.keys(record.paging)
          : [],
    };
  }

  return { type: typeof value };
}
