// Get dependencies
const nconf = require('nconf');

// create a rolling file logger based on date/time that fires process events
const logOpts = {
  errorEventName: 'error',
  logDirectory: './logs/', // NOTE: folder must exist and be writable...
  fileNamePattern: 'serverlog-<DATE>.log',
  dateFormat: 'YYYY.MM'
};
const log = require('simple-node-logger').createRollingFileLogger(logOpts);

const express = require('express');
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');

// Get our API routes
// const api = require('./server/routes/api');
const app = express();

nconf.argv();
nconf.env();
nconf.defaults({
  'http': {
    'port': 1337
  },
  'firebase': {
    'admin_key': 'firebase-key.json'
  },
  'base_redirect': 'http://www.mattmerr.com',
});

const admin = require("firebase-admin");
const serviceAccount = require(path.resolve(nconf.get('firebase:admin_key')));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://ng302-91572.firebaseio.com"
});

const linkRef = admin.database().ref('links');

// Parsers for POST data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

function logRequest(req) {
  var str = `${req.method} FROM ip=${req.ip} TO host="${req.hostname}" url="${req.originalUrl}"`;

  if (req.params) {
    str += ` params="${JSON.stringify(req.params)}"`;
  }

  log.info(str);
}

app.use((req, res, next) => {
  if (req.path === '/admin.html' || req.path === '/404.html')
    logRequest(req);
  next();
});

// Point static path to dist
app.use(express.static(path.join(__dirname, 'dist')));

app.use((req, res, next) => {
  logRequest(req);
  next();
});

app.get('/:link', function (req, res, next) {
  try {
    if (!req.params.link.match(/^[_a-z0-9]+$/i)) {
      res.redirect('./404.html');
      return;
    }

    linkRef.child(req.params.link.toLowerCase()).once('value').then(
      (snapshot) => {
        console.log(`back from firebase!`);
        if (snapshot.exists()) {
          res.redirect(snapshot.val());
        }
        else {
          res.redirect('./404.html');
        }
      });
  }
  catch (err) {
    log.error(`error processing request for link ""`);
    // Oh well lol
  }
});

// Catch all other routes and return the index file
app.get('*', (req, res) => {
  res.redirect(nconf.get('base_redirect'));
});

/**
 * Get port from environment and store in Express.
 */
const port = nconf.get('http:port');
app.set('port', port);

/**
 * Create HTTP server.
 */
const server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port, () => log.info(`server running on localhost:${port}`));
