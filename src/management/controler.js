const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);
const BASE = '/forrrmastrr';

server.listen(20715, "localhost", () => {
	console.log("Manager server is running.");
});

app.get(BASE + '/reload', (req, res) => {
  res.send('Ok, server start to reboot...');
  console.log("Manager: reboot signal emerged.");
  process.send('reload');
});

process.on('message', msg => {
  if (msg == 'exit') {
    // do some work
    server.close();
    console.log('ManagerWorker: Manager server closed.');
    process.exit(0);
  }
})