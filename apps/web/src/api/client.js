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
 * Asks the server to render the resume and returns the PDF and its filename.
 * @returns {Promise<{ blob: Blob, filename: string }>}
 */
export async function renderPdf(profile, settings) {
  let response;
  try {
    response = await fetch('/api/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, settings }),
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Could not reach the server.');
  }
  if (!response.ok) throw await toApiError(response);
  return {
    blob: await response.blob(),
    filename: filenameFrom(response.headers.get('Content-Disposition')) ?? 'Resume.pdf',
  };
}

function filenameFrom(header) {
  if (!header) return null;
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utf8) return decodeURIComponent(utf8[1]);
  return /filename="([^"]+)"/i.exec(header)?.[1] ?? null;
}
