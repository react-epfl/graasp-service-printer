import Express from 'express';
import Compression from 'compression';
import Morgan from 'morgan';
import BodyParser from 'body-parser';
import Cors from 'cors';
import Http from 'http';
import Logger, { stream } from './utils/logger';
import Router from './router';
import {
  NAME,
  PORT,
} from './config';

// note: load order matters
// start bootstrap process
Logger.info(`starting server: ${NAME}`);

// create application server
const app = Express();
// must come first!
app.use(Compression());

// set port
app.set('port', PORT);

// override express logger
app.use(Morgan('common', { stream }));

// include body parser
app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: false }));

const corsOptions = { credentials: true };

// cors for all requests
app.use(Cors(corsOptions));

// enable pre-flight for all routes
app.options('*', Cors(corsOptions));

// routes
app.use(Router);

// launch the server
const server = Http.createServer(app);
server.listen(app.get('port'), () => {
  if (process.send) {
    process.send('online');
  } else {
    Logger.info(`server listening on port ${app.get('port')}.`);
  }
});
