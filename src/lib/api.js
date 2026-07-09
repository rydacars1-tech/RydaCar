const API_BASE_URL = (() => {
  const configured = import.meta.env.VITE_API_BASE_URL;
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "/api/v1";
  }

  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/v1`;
  }

  return "/api/v1";
})();

async function parseApiResponse(response) {
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok || !payload?.success) {
    const message = payload?.message || `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export function getApiUrl(path) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function requestJson(path, options = {}) {
  const headers = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(getApiUrl(path), {
    ...options,
    headers
  });

  return parseApiResponse(response);
}

export async function publicGet(path) {
  return requestJson(path, { method: "GET" });
}

export async function publicPost(path, body) {
  return requestJson(path, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export { API_BASE_URL };
