const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const cloudinary = require('cloudinary').v2;
const logger = require('./logger');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Local-dev fallback ───────────────────────────────────────────────────────
// When Cloudinary isn't really configured (offline / stubbed dev), write
// uploads to backend/uploads/ and serve them from /uploads instead of failing.
const STUBBED =
  !process.env.CLOUDINARY_CLOUD_NAME ||
  ['dummy', 'your_cloud_name', 'changeme'].includes(process.env.CLOUDINARY_CLOUD_NAME);

if (STUBBED) {
  logger.warn('Cloudinary not configured — using local filesystem for uploads (dev only)');

  const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads');
  const PUBLIC_BASE = (process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, '');

  const guessExt = (buffer) => {
    if (!buffer || buffer.length < 4) return 'bin';
    const b = buffer;
    if (b[0] === 0xff && b[1] === 0xd8) return 'jpg';
    if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'png';
    if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return 'gif';
    if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return 'pdf';
    if (b.slice(0, 4).toString('ascii') === 'RIFF' && b.slice(8, 12).toString('ascii') === 'WEBP') return 'webp';
    if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return 'webm';
    if (b.length > 12 && b.slice(4, 8).toString('ascii') === 'ftyp') return b.slice(8, 12).toString('ascii').startsWith('qt') ? 'mov' : 'mp4';
    return 'bin';
  };

  cloudinary.uploader.upload_stream = (options = {}, callback) => {
    // Mimic the Cloudinary write stream: caller does .end(buffer)
    return {
      end: (buffer) => {
        try {
          const folder = (options.folder || 'misc').replace(/[^a-zA-Z0-9/_-]/g, '');
          const dir = path.join(UPLOAD_ROOT, folder);
          fs.mkdirSync(dir, { recursive: true });
          const name = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}.${guessExt(buffer)}`;
          fs.writeFileSync(path.join(dir, name), buffer);
          const secure_url = `${PUBLIC_BASE}/uploads/${folder}/${name}`;
          callback(null, { secure_url, url: secure_url, public_id: `${folder}/${name}` });
        } catch (err) {
          callback(err);
        }
      },
    };
  };
}

// Personal uploads (ID documents, selfie video, parcel and delivery photos): stored as *authenticated*
// assets so there is no guessable public URL; API responses swap the reference for a signed link
// (see signMediaRefs). In stub/dev mode files are local and served from /uploads (dev only).
// Returns a reference string that signedUrl() and destroyMedia() understand.
const uploadPrivate = (buffer, folder, resourceType = 'image') =>
  new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream({ folder, resource_type: resourceType, type: 'authenticated' }, (err, result) => {
      if (err) return reject(err);
      // The format is kept (".jpg") because the expiring download link below needs it.
      resolve(STUBBED ? result.secure_url : `cld:${resourceType}:${result.public_id}${result.format ? `.${result.format}` : ''}`);
    }).end(buffer);
  });

// "cld:<resourceType>:<publicId>[.<format>]" → parts. Public ids never contain a dot (Cloudinary strips the
// extension); refs written before the format was stored have none.
const parseRef = (ref) => {
  const [, resourceType, ...rest] = ref.split(':');
  const m = rest.join(':').match(/^(.*?)(?:\.([a-z0-9]+))?$/i);
  return { resourceType, publicId: m[1], format: m[2] };
};

// Signed links expire, so a link copied out of the app (or left in a browser history) stops working.
const SIGNED_URL_TTL_SECONDS = 60 * 60;

// A temporary link to a private file: Cloudinary's download API with `expires_at` (plain signed delivery
// URLs never expire, and token-based expiry needs a paid plan). Served inline, so it works in <img>/<video>.
const signedUrl = (ref) => {
  if (!ref || !ref.startsWith('cld:')) return ref || null;
  const { resourceType, publicId, format } = parseRef(ref);
  return cloudinary.utils.private_download_url(publicId, format, {
    resource_type: resourceType, type: 'authenticated', expires_at: Math.floor(Date.now() / 1000) + SIGNED_URL_TTL_SECONDS,
  });
};

// Deep-copies an API payload, replacing every private media reference ("cld:…") with a signed URL.
const signMediaRefs = (value) => {
  if (typeof value === 'string') return value.startsWith('cld:') ? signedUrl(value) : value;
  if (Array.isArray(value)) return value.map(signMediaRefs);
  if (value && Object.getPrototypeOf(value) === Object.prototype) {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = signMediaRefs(v);
    return out;
  }
  return value; // Date, null, numbers…
};

// Permanently deletes an uploaded file. Accepts a private ref ("cld:…"), a legacy public Cloudinary URL
// or a local dev URL. Never throws: a missing file must not block an erasure/purge.
const destroyMedia = async (ref) => {
  if (!ref) return;
  try {
    if (ref.startsWith('cld:')) {
      if (STUBBED) return;
      const { resourceType, publicId } = parseRef(ref);
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, type: 'authenticated', invalidate: true });
      return;
    }
    const m = ref.match(/res\.cloudinary\.com\/[^/]+\/(image|video|raw)\/(upload|authenticated|private)\/(?:v\d+\/)?(.+?)(?:\.[a-z0-9]+)?$/i);
    if (m && !STUBBED) {
      await cloudinary.uploader.destroy(m[3], { resource_type: m[1], type: m[2], invalidate: true });
      return;
    }
    const local = ref.match(/\/uploads\/(.+)$/);
    if (local && STUBBED) {
      const file = path.join(__dirname, '..', '..', 'uploads', local[1]);
      if (file.startsWith(path.join(__dirname, '..', '..', 'uploads'))) fs.rmSync(file, { force: true });
    }
  } catch (err) {
    logger.warn('Could not delete media', { error: err.message });
  }
};

module.exports = cloudinary;
module.exports.STUBBED = STUBBED;
module.exports.uploadPrivate = uploadPrivate;
module.exports.signedUrl = signedUrl;
module.exports.SIGNED_URL_TTL_SECONDS = SIGNED_URL_TTL_SECONDS;
module.exports.signMediaRefs = signMediaRefs;
module.exports.destroyMedia = destroyMedia;
