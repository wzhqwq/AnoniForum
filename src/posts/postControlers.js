const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);

server.listen(20717, 'localhost', () => {
  console.log('Post server is running.');
});

module.exports = new (function () {
  this.close = function () {
    server.close();
  };
});