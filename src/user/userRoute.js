const router = require('express').Router();

var routers = {
  router: router,
  signUp: router.route('/signup'),
  logIn: router.route('/login'),
  getSalt: router.route('/getsalt'),
  getBulletin: router.route('/getbulletin'),
  getTop: router.route('/gettop')
};

module.exports = routers;