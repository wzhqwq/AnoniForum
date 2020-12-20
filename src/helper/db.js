const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');
const passwd = require('../secrets').sqlPass;
const log = require('./logger').log;

var database;
var db = function () {
  this.sql = '';
}
db.connect = function () {
  return sqlite.open({
    filename: __dirname + `/../../data/sqlite/main.db`,
    driver: sqlite3.cached.Database
  })
  .then(base => {
    database = base;
    log('Database connected');
  });
}

var disconnecting = false;

db.disconnect = function () {
  disconnecting = true;
  return database.close();
};
db.whereWithKey = function (key, values) {
  var wheres = values.map(val => `${key} = '${val}'`);
  return wheres.join(' OR ');
}

db.prototype.query = function (single) {
  if (disconnecting) {
    rej('Server is closing');
    return;
  }
  this.sql += ';';
  log('DataBase: query:', this.sql);
  return new Promise((res, rej) => {
    database[single ? "get" : "all"](this.sql)
      .then(data => {
        log('Query success.');
        res(data);
      })
      .catch(err => {
        log('Query failed:', err.message);
        rej(err);
      });
  });
};
function exec(sql) {
  if (disconnecting) {
    rej('Server is closing');
    return;
  }
  log('DataBase: execute:', sql);
  return new Promise((res, rej) => {
    database.run(sql)
      .then(data => {
        log('Execute success.');
        res(data);
      })
      .catch(err => {
        log('Execute failed:', err.message);
        rej(err);
      });
  });
}

db.insert = function (table, items) {
  return exec(`INSERT INTO ${table} (${Object.keys(items).join(',')}) VALUES(${Object.values(items).map(item => `'${item}'`).join(',')});`);
};
db.update = function (table, items, where) {
  var entries = [];
  for (item in items)
    entries.push(`${item}='${items[item]}'`);
  return exec(`UPDATE ${table} SET ${entries.join(',')} WHERE ${where};`);
};
db.delete = function (table, where) {
  return exec(`DELETE FROM ${table} WHERE ${where};`)
}
db.create = function (table, items) {
  return exec(`CREATE TABLE IF NOT EXISTS ${table} (\n${
    items
      .map(item =>
        `${item.name} ${item.type}` + (item.isPrimary ? ' PRIMARY KEY' : '') + (item.autoInc ? ' AUTOINCREMENT' : '')
      ).join(',\n')
  }\n);`);
}
db.exec = exec;

db.prototype.select = function (table, where, limit) {
  this.sql = `SELECT * FROM ${table}` + (where ? ` WHERE ${where}` : '') + (limit ? ` LIMIT ${limit}` : '');
  return this;
};
db.prototype.append = function (db) {
  this.sql = `${this.sql} UNION ALL ${db.sql}`;
  return this;
}
db.prototype.appendSelect = function (table, where, limit) {
  this.sql = `${this.sql} UNION ALL `;
  return this.select(table, where, limit);
}
// table1为驱动表，table2为数据表
db.prototype.joinSelect = function (table1, table2, both) {
  this.sql = `SELECT tb.* FROM ${table1} AS ta JOIN ${table2} AS tb ON ta.${both} = tb.${both}`;
  return this;
}
// where注意需要添加前导t.
db.prototype.sort = function (key, decrease, where, limit) {
  if (where || limit)
    this.sql = `SELECT * FROM ${this.asTable()} AS t ORDER BY ${key}` + (decrease ? ' DESC' : '') + (where ? ` WHERE ${where}` : '') + (limit ? ` LIMIT ${limit}` : '');
  else
    this.sql = `${this.sql} ORDER BY ${key}` + (decrease ? ' DESC' : '');
  return this;
}
db.prototype.asTable = function () {
  return `(${this.sql})`;
}

db.INT = 'INTEGER';
db.TEXT = 'TEXT';
db.SALT = 'CHAR(32)';
db.SHA = 'CHAR(64)';
db.SHORT = 'VARCHAR(50)';

module.exports = db;