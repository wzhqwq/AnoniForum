const express = require('express');
const app = express();

app.listen(20717, 'localhost', () => {
  console.log('Post server is running.');
});

module.exports = class PostMgr {

}