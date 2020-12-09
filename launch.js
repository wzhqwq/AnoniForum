const fork = require('child_process').fork;
const MAIN_WORKER_PATH = './worker.js';
const MGR_WORKER_PATH = './src/management/controler.js';
var mainWorker = fork(MAIN_WORKER_PATH),
  managerWorker = fork(MGR_WORKER_PATH);

var reload = false;
managerWorker.on('message', msg => {
  if (msg == 'reload') {
    reload = true;
    mainWorker.send('exit');
  }
});

mainWorker.on('exit', code => {
  console.log('Master: Main server closed with code:', code);
  if (reload)
    managerWorker.send('exit');
});
managerWorker.on('exit', code => {
  console.log('Master: Manager server closed with code:', code);
  if (reload) {
    reload = false;
    managerWorker = fork(MGR_WORKER_PATH);
    mainWorker = fork(MAIN_WORKER_PATH);
  }
})