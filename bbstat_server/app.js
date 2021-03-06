var express = require('express');
// var cookieParser = require('cookie-parser');
// var querystring = require('querystring');
var https = require('https');
var http = require('http');
var fs = require('fs');
var path = require('path');

var dataModule = require('./data');
var imageModule = require('./image');

var app = express();
var port = 2334;
var options = {
    // key: fs.readFileSync(path.join(__dirname, 'keys', 'self-key.pem')),
    // cert: fs.readFileSync(path.join(__dirname, 'keys', 'self-cert.pem'))
    ca: fs.readFileSync(path.join(__dirname, 'keys', 'bbstat_nmkn_moe.ca-bundle')),
    key: fs.readFileSync(path.join(__dirname, 'keys', 'bbstat_nmkn_moe.key')),
    cert: fs.readFileSync(path.join(__dirname, 'keys', 'bbstat_nmkn_moe.crt'))
};

// serving images - express will search here first
//      if image file is already stored, serve the stored image
// To do: TTL
app.use(express.static(path.join(__dirname, 'public')));

// fall-through actions when image does not exist - request from mlb.com
app.get('/img/*', function(req, res) {
    // download and serve. Serve default when download fails
    key_mlbam = req.originalUrl.split('/').pop().slice(0,-4);
    imageModule.downloadAndSendImage(key_mlbam, res);

});

// main data api
app.get('/api', function(req, res) {
    // note here res_app is the Response object in express
    //      which is a http.ServerResponse obj
    // REF: https://expressjs.com/en/4x/api.html#res

    dataModule.getdata(req, res);
});


// http.createServer(app).listen(port, function() {
//     console.log("Listening on %s...", port);
// });

https.createServer(options, app).listen(port, function() {
    console.log("Listening on %s...", port);
});
