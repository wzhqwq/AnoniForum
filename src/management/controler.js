const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);
const BASE = '/forrrmastrr';

server.listen(20715, "localhost", () => {
	console.log("Manager server is running.");
});

// 会改成POST的
app.get(BASE + '/reloadAllServer', (req, res) => {
  res.send('Ok, servers start to reboot...');
  console.log("Manager: reboot-all-servers signal emerged.");
  process.send('reload');
});
app.get(BASE + '/closeMainServer', (req, res) => {
  res.send('Ok, main server start to close...');
  console.log("Manager: close-main-server signal emerged.");
  process.send("closeMain");
});
app.get(BASE + '/startMainServer', (req, res) => {
  res.send('Ok, main server is starting...');
  console.log("Manager: start-main-server signal emerged.");
  process.send("startMain");
});

process.on('message', msg => {
  if (msg == 'exit') {
    // do some work
    server.close();
    console.log('ManagerWorker: Manager server closed.');
    process.exit(0);
  }
})