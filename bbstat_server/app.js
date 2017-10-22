var express = require('express');
// var cookieParser = require('cookie-parser');
// var querystring = require('querystring');
var https = require('https');
var http = require('http');
// var fs = require('fs');
var path = require('path');

var dataModule = require('./data');
var imageModule = require('./image');

var app = express();
var port = 2334;
// var options = {
//     key: fs.readFileSync('keys/client-key.pem'),
//     cert: fs.readFileSync('keys/client-cert.pem')
// };
var publicDir = path.join(__dirname, 'public');

// serving images
app.use(express.static(publicDir));
// fall-through actions when image does not exist
app.get('/img/*', function(req, res) {
    // download and serve. Serve default when download fails
    key_mlbam = req.originalUrl.split('/').pop().slice(0,-4);
    imageModule.downloadAndSendImage(key_mlbam, res);

});

// data api
app.get('/', function(req, res) {
    // note here res_app is the Response object in express
    //      which is a http.ServerResponse obj
    // REF: https://expressjs.com/en/4x/api.html#res

    dataModule.getdata(req, res);
});


http.createServer(app).listen(port, function() {
    console.log("Listening on %s...", port);
});

// https.createServer(options, app).listen(porthttps, function() {
//     console.log("Listening on %s...", porthttps);
// });
