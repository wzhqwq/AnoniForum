const mysql = require('promise-mysql');
const passwd = require('../secrets').sqlPass;
const log = require('./logger').log;

var pool;
mysql.createPool({
  host: 'localhost',
  port: '3306',
  password: passwd,
  user: 'root'
}).then(p => {
  pool = p;
  log('DataBase: connected.');
}).catch(e => {
  log('DataBase: connection failed:', e.message);
});

var disconnecting = false;
var connectedCount = 0;
var countZeroHandler = null;

exports.disconnect = function () {
  return new Promise(res => {
    disconnecting = true;
    if (connectedCount == 0)
      res();
    else
      countZeroHandler = function () {
        res();
      };
  });
};

exports.query = function (sql) {
  log('DataBase: query:', sql);
  return new Promise((res, rej) => {
    if (disconnecting) {
      rej(new Error("Server is closing"));
      return;
    }
    pool.getConnection()
    .then(connection => {
      connectedCount++;
      log('connections now:', connectedCount);
      connection.query('use anoni_base;').then(() => {
        connection.query(sql).then(data => {
          pool.pool.releaseConnection(connection);
          connectedCount--;
          log('connections now:', connectedCount);
          res(data);
          if (connectedCount == 0 && countZeroHandler)
          countZeroHandler();
        })
        .catch(err => {
          log('query failed:', err.message);
          pool.pool.releaseConnection(connection);
          connectedCount--;
          log('connections now:', connectedCount);
          rej(err);
          if (connectedCount == 0 && countZeroHandler)
          countZeroHandler();
        });
      });
    });
  })
};

exports.select = function (table, where) {
  return exports.query(`SELECT * FROM ${table}` + (where ? ` WHERE ${where};` : ';'));
};
exports.insert = function (table, items) {
  return exports.query(`INSERT INTO ${table} (${Object.keys(items).join(',')}) VALUES(${Object.values(items).map(item => mysql.escape(item)).join(',')});`);
};
exports.update = function (table, items, where) {
  var entries = [];
  for (item in items)
    entries.push(`${item}=${mysql.escape(items[item])}`);
  return exports.query(`UPDATE ${table} SET ${entries.join(',')}` + (where ? ` WHERE ${where};` : ';'));
};