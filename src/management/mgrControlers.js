const express = require('express');
const http = require('http');
const mysql = require('mysql');
const mysqlAdmin = require('../../third-party/node-mysql-admin');
const route = require('./mgrRoutes');
const mgrPath = require('../mgrPath.js');

const app = express();
const adminApp = express();
const server = http.createServer(app);

server.listen(20715, "localhost", () => {
	console.log("Manager server is running.");
});

// POST部分
// -----服务器管理
// 会改成POST的
route.reloadAllServer.get((req, res) => {
  res.send('Ok, servers start to reboot...');
  console.log("Manager: reboot-all-servers signal emerged.");
  process.send('reload');
});
route.closeMainServer.get((req, res) => {
  res.send('Ok, main server start to close...');
  console.log("Manager: close-main-server signal emerged.");
  process.send("closeMain");
});
route.startMainServer.get((req, res) => {
  res.send('Ok, main server is starting...');
  console.log("Manager: start-main-server signal emerged.");
  process.send("startMain");
});

// mysql编辑器配置
mysqlAdmin(route.mysqlAdmin, app);

// 路由部分
app.use(mgrPath, route.router);

// mysql部分

// 通信部分
process.on('message', msg => {
  if (msg == 'exit') {
    // do some work
    server.close();
    console.log('ManagerWorker: Manager server closed.');
    process.exit(0);
  }
})