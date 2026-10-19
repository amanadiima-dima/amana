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

// Sensitive uploads (ID documents, biometric video): stored as *authenticated* assets so there is no
// public URL; reviewers get short-lived signed links. In stub/dev mode files are local and served from
// /uploads (dev only). Returns a reference string that signedUrl() understands.
const uploadPrivate = (buffer, folder, resourceType = 'image') =>
  new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream({ folder, resource_type: resourceType, type: 'authenticated' }, (err, result) => {
      if (err) return reject(err);
      resolve(STUBBED ? result.secure_url : `cld:${resourceType}:${result.public_id}`);
    }).end(buffer);
  });

const signedUrl = (ref) => {
  if (!ref || !ref.startsWith('cld:')) return ref || null;
  const [, resourceType, ...rest] = ref.split(':');
  return cloudinary.url(rest.join(':'), { type: 'authenticated', resource_type: resourceType, sign_url: true, secure: true });
};

module.exports = cloudinary;
module.exports.STUBBED = STUBBED;
module.exports.uploadPrivate = uploadPrivate;
module.exports.signedUrl = signedUrl;
