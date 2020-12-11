const crypto = require('crypto');
const db = require('./db');

exports.check = function (jwt, address) {
  return Promise((res, rej) => {
    var parts = jwt.split('.');
    if (parts.length != 2) {
      rej('bad jwt.');
      return;
    }
    var data;
    try {
      data = JSON.parse(Buffer.from(parts[0], 'base64').toString('utf-8'));
    }
    catch (e) {
      rej('bad jwt data: ' + e.message);
      return;
    }
    if (!data.id || typeof data.id != 'number') {
      rej('bad jwt data: illegal id');
      return;
    }
    db.select('users', `id=${data.id}`)
    .then(user => {
      if (!user)
        rej('bad request: id not found')
      else if (user.last_remote != address)
        rej('登录IP发生改变，需要重新登录');
      else if (crypto.createHmac('sha256', parts[0]).update(user.token_secret).digest('base64') == parts[1])
        res(user);
      else
        rej('bad jwt token: mismatch');
    })
    .catch(e => {
      rej('bad request: database error: ' + e.message);
    });
  });
};

exports.auth = function (sdu_id, passwd, address, salt) {
  return Promise((res, rej) => {
    db.select('users', `sdu_id=${sdu_id}`)
    .then(user => {
      if (!user)
        rej('学号未注册！');
      else if (crypto.createHmac('sha256', salt).update(user.passwd).digest('base64') != passwd)
        rej('密码错误');
      else {
        if (user.last_remote != address)
          db.update('users', {last_remote: address}, `id=${user.id}`);
        var data = {id: user.id};
        var dataString = Buffer.from(JSON.stringify(data), 'utf-8').toString('base64');
        var jwt = dataString + '.' + crypto.createHmac('sha256', user.token_secret).update(dataString).digest('base64');
        res({jwt: jwt, user: user});
      }
    })
    .catch(e => {
      rej('bad request: database error: ' + e.message);
    });
  });
};

exports.checkBefore = function (req, res, next) {
  var jwt = '' || req.cookies.jwt;
  exports.check(jwt, req.ip)
  .next(() => {
    next();
  })
  .catch(e => {
    if (req.method == 'GET')
      res.redirect('/login');
    else
      res.status(403).json({code: 'MALJWT', note: e});
  });
};