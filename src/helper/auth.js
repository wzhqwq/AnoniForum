const crypto = require('crypto');
const DB = require('./db');
const strEnc = require('./sdu_rsa');
const log = require('./logger').log;
const salt = require('../secrets.js').salt;
const randomStr = require('randomstring');

exports.check = function (jwt) {
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
    if (crypto.createHmac('sha256', salt).update(parts[0]).digest('base64') == parts[1])
      res(data);
    else
      rej('jwt验证失败');
  });
};

exports.auth = function (sdu_id, passwd) {
  return new Promise((res, rej) => {
    (new DB())
      .select('users', `sdu_id=${sdu_id}`)
      .query(true)
      .then(user => {
        if (!user) {
          let req = require('request');
          let url = 'https://pass.sdu.edu.cn/cas/login?service=https%3A%2F%2Fservice.sdu.edu.cn%2Ftp_up%2Fview%3Fm%3Dup#act=portal/viewhome';
          
          req(url, {
            method: 'GET',
            headers: {
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
              'Accept-Language': 'zh-CN,zh;q=0.9',
              'Cache-Control': 'max-age=0',
              'Connection': 'keep-alive',
              'Host': 'pass.sdu.edu.cn',
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36',
              'Accept-Encoding': 'gzip, deflate, br',
              'Sec-Fetch-Dest': 'document',
              'Sec-Fetch-Mode': 'navigate',
              'Sec-Fetch-Site': 'cross-site',
              'Sec-Fetch-User': '?1',
              'Upgrade-Insecure-Requests': '1',
            }
          }, (err, resp) => {
            if (err) {
              log('User controler: error when accessing sdu auth: ', err);
              rej('登录出现问题，请联系王子涵');
              return;
            }
            if (resp.statusCode == 200) {
              req(url, {
                method: 'POST',
                form: {
                  rsa: strEnc('2020' + sdu_id + passwd, '1', '2', '3'),
                  ul: sdu_id.length + 4,
                  pl: passwd.length,
                  lt: '',
                  execution: 'e1s1',
                  _eventId: 'submit'
                },
                headers: {
                  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                  'Accept-Language': 'zh-CN,zh;q=0.9',
                  'Cache-Control': 'max-age=0',
                  'Connection': 'keep-alive',
                  'Host': 'pass.sdu.edu.cn',
                  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36',    
                  'Accept-Encoding': 'gzip, deflate',
                  'Upgrade-Insecure-Requests': '1',
                  'Origin': 'https://pass.sdu.edu.cn',
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'Referer': url,
                  'Cookie': resp.headers['set-cookie'].map(coo => coo.split(';')[0]).reverse().join('; '),
                }
              }, (err, resp) => {
                if (err) {
                  log('User controler: error when accessing sdu auth: ', err);
                  rej('登录出现问题，请联系王子涵');
                  return;
                }
                if (resp.statusCode == 200)
                  rej('学号不存在或密码错误！');
                else if (resp.statusCode == 302) {
                  let loc = resp.headers['location'];
                  if (!loc.match(/ticket=.*$/))
                    rej('学号不存在或密码错误！');
                  else {
                    let user;
                    DB.insert('users', user = { sdu_id: sdu_id, passwd: passwd, token_secret: randomStr.generate(), nick_name: '_unset_' })
                      .then(result => {
                        res({ jwt: genJwt(result.lastID), user: user });            
                      })
                      .catch(e => {
                        rej('数据库出错: ' + e.message);
                      });
                  }
                }
                else {
                  rej('发送请求时出现了问题');
                  log('User server: unexpected code from second fetch:', resp.statusCode);
                }
              });
            }
            else {
              rej('发送请求时出现了问题');
              log('User server: unexpected code from first fetch:', resp.statusCode);
            }
          });
        }
        else {
          if (crypto.createHmac('sha256', salt).update(user.passwd).digest('hex') != passwd)
            rej('密码错误');
          else {
            /*if (user.last_remote != address)
              DB.update('users', { last_remote: address }, `u_id=${user.u_id}`);*/
            res({ jwt: genJwt(user.u_id), user: user });
          }
        }
      })
      .catch(e => {
        rej('bad request: database error: ' + e.message);
      });
  });
};

function genJwt(u_id, nick_name = '_unset_') {
  var data = { u_id: u_id, nick_name: nick_name };
  var dataString = Buffer.from(JSON.stringify(data), 'utf-8').toString('base64');
  return dataString + '.' + crypto.createHmac('sha256', salt).update(dataString).digest('base64');
}

exports.setName = function (jwt, name) {
  return exports.check(jwt)
    .then(user => {
      if (user.nick_name != '_unset_')
        return jwt;
      else
        return genJwt(user.u_id, name);
    });
}

exports.checkBefore = function (req, res, next) {
  if (req.path == '/user/login' || req.path == '/user/signup') {
    next();
    return;
  }
  var jwt = req.body.jwt;
  if (!jwt || jwt.length == 0) {
    res.status(403).json({ code: 'LOGIN', note: '' });
    return;
  }
  exports.check(jwt)
    .then(user => {
      req.user_current = user;
      next();
    })
    .catch(e => {
      res.status(403).json({ code: 'MALJWT', note: e });
    });
};