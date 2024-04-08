var express = require('express');
var router = express.Router();

router.get('/users', function(req, res, next) {
  res.render('index.hbs', { title: 'Example' });
});



/* GET home page. */

module.exports = router;
