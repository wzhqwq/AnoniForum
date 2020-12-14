const express = require('express');
const http = require('http');
const DB = require('../helper/db');
const auth = require('../helper/auth').auth;
const check = require('../helper/auth').checkBefore;
const route = require('./userRoute');
const salt1 = require('../secrets').salt;
const log = require('../helper/logger').log;
const bodyParser = require('body-parser');
const randomStr = require('randomstring');

const app = express();
const server = http.createServer(app);

DB.connect()
.then(() => {
  server.listen(20716, 'localhost', () => {
    log('User server is running.');
  });
  /*DB.create('users', [
    {name: 'u_id', isPrimary: true, autoInc: true, type: DB.INT},
    {name: 'sdu_id', type: DB.INT},
    {name: 'passwd', type: DB.SHA},
    {name: 'last_remote', type: DB.SHORT},
    {name: 'token_secret', type: DB.SALT}
  ]);
  DB.create('scores', [
    {name: 'u_id', type: DB.INT},
    {name: 'score', type: DB.INT}
  ]);*/
})
.catch(err => {
  log('User server: open database failed:', err);
});


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(check);

exports.close = function () {
  return new Promise(res => {
    DB.disconnect().finally(() => {
      server.close();
      res();
    });
  })
};

// Route
// POST
var salts = {};
route.logIn.post((req, res) => {
  if (!salts[req.header('X-Real-IP')]) {
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

  auth(sdu_id, password, req.header('X-Real-IP'), salts[req.header('X-Real-IP')].salt)
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
    if (user)
      res.json({jwt: '', err: '学号已被注册！'});
    else {
      DB.insert('users', {sdu_id: sdu_id, passwd: password, last_remote: req.header('X-Real-IP'), token_secret: randomStr.generate()})
      .then(() => {
        auth(sdu_id, password, req.header('X-Real-IP'))
        .then(({jwt, user}) =>
          DB.insert('scores', {u_id: user.u_id, score: 0})
          .then(() => {
            res.json({jwt: jwt, err: ''});
          })
        )
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
  var ip = req.header('X-Real-IP');
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