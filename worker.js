const userCtrl = require('./src/user/userControlers');
const postsCtrl = require('./src/posts/postControlers');
const log = require('./src/helper/logger').log;

process.on('message', msg => {
  if (msg == 'exit') {
    // do some work
    userCtrl.close().then(
      () => postsCtrl.close()
    ).then(() => {
      log('MainWorker: Main server closed.');
      process.exit(0);
    });
  }
});