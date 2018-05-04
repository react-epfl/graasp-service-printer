import ObjectId from 'bson-objectid';
import Logger from './utils/logger';
import { convertSpaceToFile, fetchTag } from './service';
import { SUPPORTED_FORMATS } from './config';

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

    // validate id
    if (!id || !ObjectId.isValid(id)) {
      return res.status(422).send('error: invalid space id');
    }

    const { query, headers } = req;

    // validate format is supported
    if (query && query.format) {
      if (!SUPPORTED_FORMATS.includes(query.format)) {
        return res.status(422).send('error: invalid format');
      }
    }

    const file = await convertSpaceToFile(id, query, headers);
    if (file) {
      // return in pdf format by default
      const { format = 'pdf' } = query;

      return res.status(200).attachment(`${id}.${format}`).end(file, 'binary');
    }

    return res.status(500).send('error: space could not be printed');
  } catch (err) {
    Logger.error(err);
    res.status(500).send(`${err.name}: ${err.message}.`);
    return next(err);
  }
};

export {
  getStatus,
  getVersion,
  getPrint,
};
