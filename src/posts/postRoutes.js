const router = require('express').Router();

var route = {
  router: router,
  getBulletin: router.route('/getbulletin'),
  getEssentials: router.route('/getess')
};

module.exports = route;