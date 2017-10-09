var express = require('express');
// var cookieParser = require('cookie-parser');
// var querystring = require('querystring');
var https = require('https');
var http = require('http');
var fs = require('fs');

var datajs = require('./data')

var app = express();
var porthttps = 2334;
var options = {
    key: fs.readFileSync('keys/client-key.pem'),
    cert: fs.readFileSync('keys/client-cert.pem')
};



app.get('/', function(req, res) {
    // note here res_app is the Response object in express
    //      which is a http.ServerResponse obj
    // REF: https://expressjs.com/en/4x/api.html#res
    
    // res.write("123", function() { res.end(); });

    datajs.getdata(req, res);
});


https.createServer(options, app).listen(porthttps, function() {
    console.log("Listening on %s...", porthttps);
});
