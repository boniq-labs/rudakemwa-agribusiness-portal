import multer from 'multer';

const ALLOWED_AUDIO_TYPES = [
  'audio/webm',
  'audio/webm;codecs=opus',
  'audio/ogg',
  'audio/ogg;codecs=opus',
  'audio/mp3',
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
];

const MAX_VOICE_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const storage = multer.memoryStorage();

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_AUDIO_TYPES.includes(file.mimetype)) cb(null, true);
  else cb(new Error(`Audio type ${file.mimetype} is not allowed`));
};

export const voiceUpload = multer({ storage, fileFilter, limits: { fileSize: MAX_VOICE_FILE_SIZE } });
export const uploadVoiceRecording = voiceUpload.single('audio');