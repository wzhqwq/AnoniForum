const express = require('express');
const http = require('http');
// const mysqlAdmin = require('../../third-party/node-mysql-admin');
const route = require('./mgrRoutes');
const mgrPath = require('../secrets.js').mgrPath;
const log = require('../helper/logger').log;
const DB = require('../helper/db');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);

DB.connect()
.then(() => {
  server.listen(20715, "localhost", () => {
    log("Manager server is running.");
  });
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// POST部分
// -----服务器管理
// 会改成POST的
route.reloadAllServer.get((req, res) => {
  res.send('Ok, servers start to reboot...');
  log("Manager: reboot-all-servers signal emerged.");
  process.send('reload');
});
route.closeMainServer.get((req, res) => {
  res.send('Ok, main server start to close...');
  log("Manager: close-main-server signal emerged.");
  process.send("closeMain");
});
route.startMainServer.get((req, res) => {
  res.send('Ok, main server is starting...');
  log("Manager: start-main-server signal emerged.");
  process.send("startMain");
});

// mysql编辑器配置
// mysqlAdmin(route.mysqlAdmin, app);

// 路由部分
app.use(mgrPath, route.router);
app.use(require('../helper/auth').checkBefore);

// mysql部分

// 通信部分
process.on('message', msg => {
  if (msg == 'exit') {
    // do some work
    DB.disconnect().then(() => {
      server.close();
      log('ManagerWorker: Manager server closed.');
      process.exit(0);
    });
  }
})