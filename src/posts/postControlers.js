const express = require('express');
const http = require('http');
const log = require('../helper/logger').log;
const db = require('../helper/db');

const app = express();
const server = http.createServer(app);

server.listen(20717, 'localhost', () => {
  log('Post server is running.');
});

app.use(require('../helper/auth').checkBefore);

exports.close = function () {
  return new Promise(res => {
    db.disconnect().then(() => {
      server.close();
      res();
    });
  })
};
