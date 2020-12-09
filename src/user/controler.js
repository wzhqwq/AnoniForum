const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);

server.listen(20716, 'localhost', () => {
  console.log('User server is running.');
});

module.exports = new (function () {
  this.close = function () {
    server.close();
  };
});