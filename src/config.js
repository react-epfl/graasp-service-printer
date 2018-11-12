
const {
  PORT = 9696,
  GRAASP_HOST = 'https://graasp.eu',
  LOGGING_LEVEL = 'info',
  TMP_PATH = 'tmp',
  GRAASP_FILES_HOST = 'http://localhost:3000',
  S3_BUCKET = null,
  S3_HOST = null,
} = process.env;

export {
  S3_BUCKET,
  S3_HOST,
  PORT,
  GRAASP_HOST,
  LOGGING_LEVEL,
  TMP_PATH,
  GRAASP_FILES_HOST,
};

export const SUPPORTED_FORMATS = ['pdf', 'png', 'epub'];
