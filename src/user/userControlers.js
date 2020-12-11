const express = require('express');
const http = require('http');
const db = require('../helper/db');
const auth = require('../helper/auth').auth;
const route = require('./userRoute');
const salt1 = require('../secrets').salt;
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);

server.listen(20716, 'localhost', () => {
  console.log('User server is running.');
});

exports.close = function () {
  server.close();
};

// Route
// POST
var salts = {};
route.logIn.post((req, res) => {
  if (!salts[req.ip]) {
    res.status(400).json({jwt: '', err: '请先获取盐'});
    return;
  }
  var password = req.query.password || '';
  var sdu_id = req.query.sduid || 'a';

  if (password.length != 32 || password.match(/[^0-9a-f]/g) ||
  sdu_id.match(/[^\d]/g) || sdu_id.length != 12 || !sdu_id.match(/2020[02]{2,2}3[\d]{5,5}/)) {
    res.status(400).json({jwt: '', err: '格式错误'});
    return;
  }
  sdu_id = sdu_id.splice(0, 4);

  auth(sdu_id, password, req.ip, salts[req.ip].salt)
  .then(({jwt}) => {
    res.json({jwt: jwt, err: ''});
  })
  .catch(err => {
    res.json({jwt: '', err: err});
  });
});

route.signUp.post((req, res) => {
  var password = req.query.password || '';
  var sdu_id = req.query.sduid || 'a';

  if (password.length != 32 || password.match(/[^0-9a-f]/g) ||
  sdu_id.match(/[^\d]/g) || sdu_id.length != 12 || !sdu_id.match(/2020[02]{2,2}3[\d]{5,5}/)) {
    res.status(400).json({jwt: '', err: '格式错误'});
    return;
  }
  sdu_id = sdu_id.splice(0, 4);

  db.select('users', `sdu_id=${sdu_id}`)
  .then(user => {
    if (user)
      res.json({jwt: '', err: '学号已被注册！'});
    else {
      db.insert('users', {sdu_id: sdu_id, passwd: password, last_remote: req.ip, token_secret: crypto.randomBytes(32)})
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
  salts[ip] = {salt: crypto.randomBytes(32), date: new Date()};
  res.json({salt1: salt1, salt2: salts[ip].salt});
});

app.use('/user', route.router);

// db = password ^ salt1
// login = password ^ salt2
// db ^ salt2 = login ^ salt1