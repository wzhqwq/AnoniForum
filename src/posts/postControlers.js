const express = require('express');
const http = require('http');
const log = require('../helper/logger').log;
const db = require('../helper/db');
const DB = db.db;
const bodyParser = require('body-parser');
const route = require('./postRoutes');

const app = express();
const server = http.createServer(app);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

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

route.getEssentials.get((req, res) => {
  var ret = {};
  (new DB())
  .select('issues', 'essential = 1')
  .append(
    (new DB).select('issues', 'essential = 0')
    .sort('issue_id', 'DESC', null, 15)
  )
  .query()
  .then(data => {
    ret.issues = data;
    return (new DB())
    .select('articles', 'essetial = 1', 20)
    .query()
  })
  .then(data => {
    ret.articles = data;
    res.json(ret);
  })
  .catch(err => {
    res.status(500).json({code: 'DBERR', err: '数据库出错: ' + err.message});
  });
});