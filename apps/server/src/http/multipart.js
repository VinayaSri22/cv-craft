import Busboy from 'busboy';
import { HttpError } from './errors.js';

const MAX_BYTES = 5 * 1024 * 1024;

/** Reads the first file from a multipart request. Fields are collected too. */
export function readSingleFile(req) {
  return new Promise((resolve, reject) => {
    const type = req.headers['content-type'] ?? '';
    if (!type.includes('multipart/form-data')) {
      reject(new HttpError(415, 'UNSUPPORTED_MEDIA', 'Upload the photo as a file.'));
      return;
    }

    let settled = false;
    const fail = (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    const busboy = Busboy({
      headers: req.headers,
      limits: { files: 1, fileSize: MAX_BYTES, fields: 8, fieldSize: 1024 },
    });
    const chunks = [];
    const fields = {};
    let fileSeen = false;
    let tooBig = false;

    busboy.on('field', (name, value) => {
      fields[name] = value;
    });
    busboy.on('file', (_name, file) => {
      fileSeen = true;
      file.on('data', (chunk) => chunks.push(chunk));
      file.on('limit', () => {
        tooBig = true;
        file.resume();
      });
    });
    busboy.on('error', fail);
    busboy.on('finish', () => {
      if (settled) return;
      settled = true;
      if (tooBig) {
        reject(new HttpError(413, 'PAYLOAD_TOO_LARGE', 'The photo must be 5 MB or smaller.'));
        return;
      }
      if (!fileSeen) {
        reject(new HttpError(422, 'VALIDATION_FAILED', 'Choose an image file.'));
        return;
      }
      resolve({ bytes: Buffer.concat(chunks), fields });
    });
    req.pipe(busboy);
  });
}
