var jwt = require('jsonwebtoken');

var tokenCheck = function (req, res, next) {
  'use strict';
  var token = req.body.token || req.query.token || req.headers.authorization;
  if (token) {
    jwt.verify(token, req.app.locals.secret, function (err, decoded) {
      if (err) {
        res.status(403).json({
          error: err
        });
      }
      else
        next();
    });
  }
  else
    res.status(400).json({
      error: 'no token given.'
    });
};

module.exports = tokenCheck;

