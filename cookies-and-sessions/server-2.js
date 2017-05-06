var express = require('express');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');

var hostname = 'localhost';
var port = 3000;

var app = express();

app.use(morgan('dev'));
app.use(cookieParser('12345-67890-09876-54321')); //secret key

function auth (req, res, next)  {
  console.log(req.headers);

  if(!req.signedCookies.user) {
    var authHeader = req.headers.authorization;
    if(!authHeader) {
      var err = new Error('You are not authorized');
      err.status = 401;
      next(err);//raises error and only the function which takes error will be triggered
      return;
    }

    var auth = new Buffer(authHeader.split(' ')[1],
      'base64').toString().split(':');
    //split cz 1st part is basic and 2nd part is bsa64 encoded username and password which we need
    var user = auth[0];
    var pass = auth[1];
    if(user == 'admin' && pass == 'password') {//hard coded
      res.cookie('user', 'admin', {signed:true});//save cookie
      next();//authorized
    }else {
      var error = new Error('You are not authenticated');
      error.status = 401;
      next(error);
    }
  }
  else{
    if(req.signedCookies.user === 'admin')  {
      console.log(req.signedCookies);
      next();
    }
    else{
      var err = new Error('You are not authenticated');
      err.status = 401;
      next(err);
    }
  }
}

app.use(auth);//used by all the middleware


app.use(express.static(__dirname+'/public'));

app.use(function(err, req, res, next) {

  res.writeHead(err.status || 500, {
    'WWW-Authenticate': 'Basic',//reminding client that need to do basic auth
    'Content-Type': 'text/plain'
  });
  res.end(err.message);
});

app.listen(port, hostname, function()  {
  console.log('Server running at http://'+hostname+':'+port+'/');
});