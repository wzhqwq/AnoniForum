const userCtrl = require('./src/user/controler');
const postsCtrl = require('./src/posts/controler');
const manageCtrl = require('./src/management/controler');

process.on('SIGHUP', () => {
  console.log('Worker: Server close.');
  process.exit(0);
})