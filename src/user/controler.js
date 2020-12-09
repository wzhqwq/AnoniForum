const express = require('express');
const app = express();

app.listen(20716, 'localhost', () => {
  console.log('User server is running.');
});

module.exports = class UserMgr {

}