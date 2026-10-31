export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function toApiError(response) {
  const body = await response.json().catch(() => null);
  const error = body?.error;
  if (error) return new ApiError(response.status, error.code, error.message, error.details);
  if (response.status === 502 || response.status === 504) {
    return new ApiError(response.status, 'SERVER_UNREACHABLE', 'The server is not running.');
  }
  return new ApiError(response.status, 'HTTP_ERROR', `Request failed (${response.status}).`);
}

/**
 * @param {string} path
 * @param {{ method?: string, body?: object }} [options]
 */
export async function api(path, { method = 'GET', body } = {}) {
  let response;
  try {
    response = await fetch(path, {
      method,
      credentials: 'include',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Could not reach the server.');
  }
  if (!response.ok) throw await toApiError(response);
  const type = response.headers.get('content-type') ?? '';
  if (type.includes('application/pdf')) {
    return {
      blob: await response.blob(),
      filename: filenameFrom(response.headers.get('Content-Disposition')) ?? 'Resume.pdf',
    };
  }
  return response.json();
}

function filenameFrom(header) {
  if (!header) return null;
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utf8) return decodeURIComponent(utf8[1]);
  return /filename="([^"]+)"/i.exec(header)?.[1] ?? null;
}
