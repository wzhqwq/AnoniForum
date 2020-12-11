const fork = require('child_process').fork;
const log = require('./src/helper/logger').log;
const MAIN_WORKER_PATH = './worker.js';
const MGR_WORKER_PATH = './src/management/mgrControlers.js';
var mainWorker, managerWorker;

var reload = false;
var mainClosed = true;

startManagerWorker();
startMainWorker();

function startManagerWorker() {
  managerWorker = fork(MGR_WORKER_PATH);
  managerWorker.on('message', msg => {
    if (!reload && msg == 'reload') {
      reload = true;
      mainWorker.send('exit');
    }
    if (!mainClosed && msg == 'closeMain')
      mainWorker.send('exit');
    if (mainClosed && msg == 'startMain')
      startMainWorker();
  });
  managerWorker.on('exit', code => {
    log('Master: Manager server closed with code:', code);
    managerWorker = null;
    if (reload) {
      startMainWorker();
      startManagerWorker();
      reload = false;
    }
  });
}

function startMainWorker() {
  mainWorker = fork(MAIN_WORKER_PATH);
  mainClosed = false;
  mainWorker.on('exit', code => {
    log('Master: Main server closed with code:', code);
    mainClosed = true;
    mainWorker = null;
    if (reload)
      managerWorker.send('exit');
  });
}

