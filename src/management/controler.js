const express = require('express');
const app = express();
const BASE = '/forrrmastrr';

app.listen(20715, "localhost", () => {
	console.log("Manager server is running.");
});

app.get(BASE + '/reload', (req, res) => {
  res.send('Ok, server start to reboot...');
  console.log("Manager: Server rebooting...");
  process.send('reload');
});

module.exports = class Manager {

}