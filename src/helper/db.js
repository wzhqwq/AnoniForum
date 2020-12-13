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
exports.whereWithKey = function (key, values) {
  var ret = '';
  var wheres = values.map(val => `${key} = '${val}'`);
  return wheres.join(' OR ');
}

var db = function () {
  this.sql = '';
}
db.prototype.query = function () {
  this.sql += ';';
  log('DataBase: query:', this.sql);
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
        connection.query(this.sql).then(data => {
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

db.prototype.select = function (table, where, limit) {
  this.sql += `SELECT * FROM ${table}` + (where ? ` WHERE ${where}` : '') + (limit ? ` LIMIT ${limit}` : '');
  return this;
};
db.prototype.insert = function (table, items) {
  this.sql = `INSERT INTO ${table} (${Object.keys(items).join(',')}) VALUES(${Object.values(items).map(item => mysql.escape(item)).join(',')})`;
  return this.query();
};
db.prototype.update = function (table, items, where) {
  var entries = [];
  for (item in items)
    entries.push(`${item}=${mysql.escape(items[item])}`);
  this.sql = `UPDATE ${table} SET ${entries.join(',')} WHERE ${where}`;
  return this.query();
};
db.prototype.append = function (db) {
  this.sql = `${this.asTable()} UNION ALL ${db.asTable()}`;
  return this;
}
db.prototype.appendSelect = function (table, where, limit) {
  this.sql = `${this.asTable()} UNION ALL `;
  return this.select(table, where, limit);
}
// table1 < table2
db.prototype.joinSelect = function (table1, table2, both) {
  this.sql = `SELECT * FROM ${table1} a STRAIGHT_JOIN ${table2} b ON a.${both} = b.${both}`;
  return this;
}
db.prototype.sort = function (key, order, where, limit) {
  this.sql = this.sql + ` ORDER BY ${key}` + (order ? ` ${order}` : '') + (where ? ` WHERE ${where}` : '') + (limit ? ` LIMIT ${limit}` : '');
  return this;
}
db.prototype.asTable = function () {
  return `(${this.sql})`;
}

exports.db = db;