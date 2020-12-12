const router = require('express').Router();

var route = {
  router: router,
  getEssentials: router.route('/getess')
};

module.exports = route;