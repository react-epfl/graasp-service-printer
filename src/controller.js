import Logger from './utils/logger';
import { convertSpaceToFile, fetchTag } from './service';

const getStatus = (req, res) => {
  Logger.debug('getting status');
  res.status(200).send();
};

const getVersion = (req, res, next) => {
  Logger.debug('getting version');
  try {
    const tag = fetchTag();
    res.status(200).send(tag);
  } catch (err) {
    Logger.error(err);
    res.status(500).send(`${err.name}: ${err.message}.`);
    next(err);
  }
};

const getPrint = async (req, res, next) => {
  Logger.debug('getting print');
  try {
    const { id } = req.params;
    const { query } = req;
    const file = await convertSpaceToFile(id, query);
    if (file) {
      // return in pdf format by default
      const { format = 'pdf' } = query;

      res.status(200).attachment(`${id}.${format}`).end(file, 'binary');
    }
  } catch (err) {
    Logger.error(err);
    res.status(500).send(`${err.name}: ${err.message}.`);
    next(err);
  }
};

export {
  getStatus,
  getVersion,
  getPrint,
};
