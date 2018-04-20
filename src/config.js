import Dotenv from 'dotenv';

Dotenv.config();

export const {
  NAME = 'Graasp Printer',
  PORT = 9696,
  GRAASP_HOST = 'https://graasp.eu',
  LOGGING_LEVEL = 'info',
  TMP_PATH = 'tmp',
} = process.env;
