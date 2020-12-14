const crypto = require('crypto');
const DB = require('./db');

exports.check = function (jwt, address) {
  return new Promise((res, rej) => {
    var parts = jwt.split('.');
    if (parts.length != 2) {
      rej('jwt格式错误');
      return;
    }
    var data;
    try {
      data = JSON.parse(Buffer.from(parts[0], 'base64').toString('utf-8'));
    }
    catch (e) {
      rej('jwt解析错误: ' + e.message);
      return;
    }
    if (!data.u_id || typeof data.u_id != 'number') {
      rej('用户id不合法');
      return;
    }
    (new DB())
    .select('users', `u_id=${data.u_id}`)
    .query(true)
    .then(user => {
      if (!user)
        rej('用户不存在')
      else if (user.last_remote != address)
        rej('登录IP发生改变');
      else if (crypto.createHmac('sha256', user.token_secret).update(parts[0]).digest('base64') == parts[1])
        res(user);
      else
        rej('jwt验证失败');
    })
    .catch(e => {
      rej('数据库出错: ' + e.message);
    });
  });
};

exports.auth = function (sdu_id, passwd, address, salt) {
  return new Promise((res, rej) => {
    (new DB())
    .select('users', `sdu_id=${sdu_id}`)
    .query(true)
    .then(user => {
      if (!user)
        rej('学号未注册！');
      else {
        if ((salt ? crypto.createHmac('sha256', salt).update(user.passwd).digest('hex') : user.passwd) != passwd)
          rej('密码错误');
        else {
          if (user.last_remote != address)
            DB.update('users', {last_remote: address}, `u_id=${user.u_id}`);
          var data = {u_id: user.u_id};
          var dataString = Buffer.from(JSON.stringify(data), 'utf-8').toString('base64');
          var jwt = dataString + '.' + crypto.createHmac('sha256', user.token_secret).update(dataString).digest('base64');
          res({jwt: jwt, user: user});
        }
      }
    })
    .catch(e => {
      rej('bad request: database error: ' + e.message);
    });
  });
};

exports.checkBefore = function (req, res, next) {
  if (req.path == '/user/login' || req.path == '/user/signup' || req.path == '/user/getsalt') {
    next();
    return;
  }
  var jwt = req.body.jwt;
  if (!jwt || jwt.length == 0) {
    res.status(403).json({code: 'LOGIN', note: ''});
    return;
  }
  exports.check(jwt, req.header('X-Real-IP'))
  .then(user => {
    req.user_current = user;
    next();
  })
  .catch(e => {
    res.status(403).json({code: 'MALJWT', note: e});
  });
};