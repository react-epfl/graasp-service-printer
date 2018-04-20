import Express from 'express';
import { getStatus, getVersion, getPrint } from './controller';

const { Router } = Express;
const router = Router();

router
  .get('/', getStatus)
  .get('/version', getVersion)
  .get('/:id', getPrint);

export default router;
