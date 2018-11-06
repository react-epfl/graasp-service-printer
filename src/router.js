import Express from 'express';
import {
  getStatus,
  getVersion,
  getPrint,
  postPrint,
} from './controller';

const { Router } = Express;
const router = Router();

router
  .get('/', getStatus)
  .get('/version', getVersion)
  .get('/:id', getPrint)
  .post('/:id', postPrint);

export default router;
