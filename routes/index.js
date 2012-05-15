exports.index = function(req, res){
  var redis = require('redis');
  var rdb = redis.createClient();
  rdb.smembers('diagrams', function(e,d) {
      res.render('index', { title: 'Diagrams', files: d, token: req.session._csrf});
    });
};
