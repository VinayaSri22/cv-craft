export class HttpError extends Error {
  /**
   * @param {number} status
   * @param {string} code
   * @param {string} message
   * @param {{ path: string, message: string }[]} [details]
   */
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const STATUS_BY_CODE = { PDF_BUSY: 503, PDF_TIMEOUT: 503, PDF_UNAVAILABLE: 503 };

/** Every error leaves the API in one shape: { error: { code, message, details? } }. */
export function errorHandler(logger = console) {
  // Express identifies error middleware by its four-argument signature.
  return (error, _req, res, _next) => {
    if (error.type === 'entity.too.large') {
      error = new HttpError(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large.');
    } else if (error.type === 'entity.parse.failed') {
      error = new HttpError(400, 'INVALID_JSON', 'Request body is not valid JSON.');
    }

    const status = error.status ?? STATUS_BY_CODE[error.code] ?? 500;
    if (status >= 500) logger.error(error.cause ?? error);

    res.status(status).json({
      error: {
        code: status === 500 ? 'INTERNAL_ERROR' : (error.code ?? 'ERROR'),
        message: status === 500 ? 'Something went wrong.' : error.message,
        ...(error.details ? { details: error.details } : {}),
      },
    });
  };
}
