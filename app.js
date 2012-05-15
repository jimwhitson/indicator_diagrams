/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes');
var myroute = require('./routes/transform');
var app = module.exports = express.createServer();
var RedisStore = require('connect-redis')(express);
var gzippo = require('gzippo');

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: "foobar", store: new RedisStore}));
  app.use(express.csrf());
  app.use(app.router);
  app.use(gzippo.staticGzip(__dirname + '/static'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes
var table = 'diagrams';
var redis = require('redis');
var rdb = redis.createClient();
app.get('/retrieve/:name/', function(req, res, next) {
    rdb.lindex(table+"_"+req.params.name, 0, function(e, d) {
      if(d) {
        res.send(d);
      } else {
        res.send("Not found.", 404);
      }
      });
});

app.post('/store/:name/', function(req, res, next) {
    rdb.sadd(table, req.params.name, redis.print);
    rdb.lpush(table+"_"+req.params.name, req.body.objects_data, function(e, d) {
      if(d) {
        res.end('Success');
      } else {
        res.end('Failure'); 
      }
    });
});
app.post('/transform/select_one/:uid/', myroute.transform);
app.get('/', routes.index);

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
