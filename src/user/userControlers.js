const express = require('express');
const http = require('http');
const db = require('../helper/db');
const DB = db.db;
const auth = require('../helper/auth').auth;
const check = require('../helper/auth').checkBefore;
const route = require('./userRoute');
const salt1 = require('../secrets').salt;
const log = require('../helper/logger').log;
const bodyParser = require('body-parser');
const randomStr = require('randomstring');

const app = express();
const server = http.createServer(app);

server.listen(20716, 'localhost', () => {
  log('User server is running.');
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(check);

exports.close = function () {
  return new Promise(res => {
    db.disconnect().then(() => {
      server.close();
      res();
    });
  })
};

// Route
// POST
var salts = {};
route.logIn.post((req, res) => {
  if (!salts[req.ip]) {
    res.json({jwt: '', err: '页面失效了，请刷新再试！'});
    return;
  }
  var password = req.body.password || '';
  var sdu_id = req.body.sduid || 'a';

  if (password.length != 64 || password.match(/[^0-9a-f]/g) ||
  sdu_id.match(/[^\d]/g) || sdu_id.length != 12 || !sdu_id.match(/2020[02]{2,2}3[\d]{5,5}/)) {
    res.status(400).json({jwt: '', err: '格式错误'});
    return;
  }
  sdu_id = sdu_id.replace(/^2020/, '');

  auth(sdu_id, password, req.ip, salts[req.ip].salt)
  .then(({jwt}) => {
    res.json({jwt: jwt, err: ''});
  })
  .catch(err => {
    res.json({jwt: '', err: err});
  });
});

route.signUp.post((req, res) => {
  var password = req.body.password || '';
  var sdu_id = req.body.sduid || 'a';

  if (password.length != 64 || password.match(/[^0-9a-f]/g) ||
  sdu_id.match(/[^\d]/g) || sdu_id.length != 12 || !sdu_id.match(/2020[02]{2,2}3[\d]{5,5}/)) {
    res.status(400).json({jwt: '', err: '格式错误'});
    return;
  }
  sdu_id = sdu_id.replace(/^2020/, '');

  (new DB())
  .select('users', `sdu_id=${sdu_id}`)
  .query()
  .then(user => {
    if (user.length != 0)
      res.json({jwt: '', err: '学号已被注册！'});
    else {
      (new DB())
      .insert('users', {sdu_id: sdu_id, passwd: password, last_remote: req.ip, token_secret: randomStr.generate()})
      .then(() => {
        auth(sdu_id, password, req.ip)
        .then(({jwt}) => {
          res.json({jwt: jwt, err: ''});
        })
        .catch(err => {
          res.status(500).json({jwt: '', err: err});
        });
      })
      .catch(e => {
        res.status(500).json({jwt: '', err: '数据库出错: ' + e.message});
      });
    }
  })
  .catch(e => {
    res.status(500).json({jwt: '', err: '数据库出错: ' + e.message});
  });
});

// GET

route.getSalt.get((req, res) => {
  var ip = req.ip;
  salts[ip] = {salt: randomStr.generate(), date: new Date()};
  res.json({salt1: salt1, salt2: salts[ip].salt});
});

route.getTop.post((req, res) => {
  (new DB())
  .select('scores')
  .sort('score', 'DESC', null, 10)
  .query()
  .then(data => {
    res.json(data);
  })
  .catch(err => {
    res.status(500).json({code: 'DBERR', err: '数据库出错: ' + err.message});
  });
});

app.use('/user', route.router);