import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE || '5242880');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) cb(null, true);
  else cb(new Error(`File type ${file.mimetype} is not allowed`));
};

export const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE } });
export const uploadSingle = upload.single('file');
export const uploadMultiple = upload.array('files', 5);
