const mysql = require('promise-mysql');
const passwd = require('../secrets').sqlPass;

const pool = mysql.createPool({
  host: 'localhost',
  port: '3306',
  password: passwd,
  user: 'root'
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
}

exports.query = function (sql) {
  console.log('query:', sql);
  return new Promise((res, rej) => {
    if (disconnecting) {
      rej(new Error("Server is closing"));
      return;
    }
    pool.getConnection()
    .then(connection => {
      connectedCount++;
      connection.query(sql).then(data => {
        connection.releaseConnection(connection);
        connectedCount--;
        res(data);
        if (connectedCount == 0 && countZeroHandler)
        countZeroHandler();
      })
      .catch(err => {
        connection.releaseConnection(connection);
        connectedCount--;
        rej(err);
        if (connectedCount == 0 && countZeroHandler)
        countZeroHandler();
      });
    })
  })
};

exports.select = function (table, where) {
  return exports.query(`SELECT * FROM ${table}` + (where ? `WHERE ${where};` : ';'));
};
exports.insert = function (table, items) {
  var names = [], values = [];
  for (item in items)
    if (!(items[item] instanceof Object)) {
      names.push(item);
      values.push(mysql.escape(items[item]));
    }
  return exports.query(`INSERT INTO ${table} (${names.join(',')}) VALUES(${values.join(',')});`);
};
exports.update = function (table, items, where) {
  var entries = [];
  for (item in items)
    if (!(items[item] instanceof Object))
      entries.push(`${item}=${mysql.escape(items[item])}`);
  return exports.query(`UPDATE ${table} SET ${entries.join(',')}` + (where ? `WHERE ${where};` : ';'));
};