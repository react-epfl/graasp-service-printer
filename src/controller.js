import ObjectId from 'bson-objectid';
import Aws from 'aws-sdk';
import Logger from './utils/logger';
import {
  convertSpaceToFile,
  fetchTag,
  fetchCommit,
} from './service';
import {
  SUPPORTED_FORMATS,
  GRAASP_FILES_HOST,
  S3_BUCKET,
  S3_HOST,
} from './config';

const PENDING = 'pending';

const getStatus = (req, res) => {
  Logger.debug('getting status');
  res.status(200).send();
};

const getVersion = (req, res, next) => {
  Logger.debug('getting version');
  try {
    const tag = fetchTag();
    const commit = fetchCommit();
    res.status(200).send({ tag, commit });
  } catch (err) {
    Logger.error(err);
    res.status(500).send(`${err.name}: ${err.message}.`);
    next(err);
  }
};

const createPrint = async (id, body, headers, fileId) => {
  try {
    const file = await convertSpaceToFile(id, body, headers);
    if (file) {
      const s3 = new Aws.S3();
      const params = { Bucket: S3_BUCKET, Key: fileId, Body: file };
      await s3.upload((params), (err, data) => {
        if (err) {
          Logger.error(`error uploading ${fileId}`, err);
        } else {
          Logger.info(data);
        }
      });
    }
  } catch (err) {
    Logger.error('error creating print', err);
  }
};

const postPrint = async (req, res, next) => {
  Logger.debug('getting print');
  try {
    const { id } = req.params;

    // validate id
    if (!id || !ObjectId.isValid(id)) {
      return res.status(422).send('error: invalid space id');
    }
    const { body, headers } = req;
    // validate format is supported
    if (body && body.format) {
      if (!SUPPORTED_FORMATS.includes(body.format)) {
        return res.status(422).send('error: invalid format');
      }
    }
    // if request looks good, send location to front end
    // create id
    const { format = 'pdf' } = body;
    const fileId = `${ObjectId().str}.${format}`;

    // create print but do not wait for it
    createPrint(id, body, headers, fileId);

    // return 202 with location
    return res.status(202).json({
      redirect: true,
      location: `${GRAASP_FILES_HOST}/queue/${fileId}`,
    });
  } catch (err) {
    Logger.error(err);
    res.status(500).send(`${err.name}: ${err.message}.`);
    return next(err);
  }
};

const getPrint = async (req, res) => {
  Logger.info('getting print');
  try {
    const { id } = req.params;

    // validate id
    if (!id || !ObjectId.isValid(id.split('.')[0])) {
      return res.status(422).send('error: invalid space id');
    }
    const params = {
      Bucket: S3_BUCKET,
      Key: id,
    };
    const s3 = new Aws.S3();
    let available = false;
    const getObject = () => new Promise((resolve) => {
      s3.headObject(params, (err) => {
        if (!err) {
          available = true;
        }
        resolve();
      });
    });
    await getObject();

    if (available) {
      return res.redirect(303, `${S3_HOST}/${id}`);
    }
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(JSON.stringify({ status: PENDING }));
  } catch (err) {
    Logger.error(err);
    return res.status(500).send(`${err.name}: ${err.message}.`);
  }
};

export {
  getStatus,
  getVersion,
  getPrint,
  postPrint,
};
