const express = require('express');
const http = require('http');
const db = require('../helper/db');
const auth = require('../helper/auth').auth;
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
    res.status(400).json({jwt: '', err: '请先获取盐'});
    return;
  }
  var password = req.param('password') || '';
  var sdu_id = req.param('sduid') || 'a';

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
  var password = req.param('password') || '';
  var sdu_id = req.param('sduid') || 'a';

  if (password.length != 64 || password.match(/[^0-9a-f]/g) ||
  sdu_id.match(/[^\d]/g) || sdu_id.length != 12 || !sdu_id.match(/2020[02]{2,2}3[\d]{5,5}/)) {
    res.status(400).json({jwt: '', err: '格式错误'});
    return;
  }
  sdu_id = sdu_id.replace(/^2020/, '');

  db.select('users', `sdu_id=${sdu_id}`)
  .then(user => {
    if (user.length != 0)
      res.json({jwt: '', err: '学号已被注册！'});
    else {
      db.insert('users', {sdu_id: sdu_id, passwd: password, last_remote: `'${req.ip}'`, token_secret: randomStr.generate()})
      .then(() => {
        auth(sdu_id, password, req.ip, salts[req.ip].salt)
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

route.getSalt.get((req, res) => {
  var ip = req.ip;
  salts[ip] = {salt: randomStr.generate(), date: new Date()};
  res.json({salt1: salt1, salt2: salts[ip].salt});
});

app.use('/user', route.router);