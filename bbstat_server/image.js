var path = require('path');
var http = require('http');
var fs = require('fs');

var downloadAndSendImage = function(key_mlbam, res) {
    // download headshot image from mlb.com and serve it
    //      if unsuccessful, serve a default image
    var headshot_url = 'http://mlb.mlb.com/mlb/images/players/head_shot/';
    headshot_url += key_mlbam + '.jpg';
    var defaultImg = 'bb.png';
    var imgDir = path.join(__dirname, 'public', 'img');
    var dest = path.join(imgDir, key_mlbam + 'jpg');
    var file = fs.createWriteStream(dest);

    var request = http.get(headshot_url, function(response) {
        response.pipe(file);
        file.on('finish', function() {
            file.close(res.sendFile(dest)); // async
        });
    }).on('error', function(err) {
        // download unsuccessful
        console.log("Fail to download head shot for " 
            + key_mlbam + ", serving default...");
        fs.unlink(dest, function(err) {
            if(err) throw err;
        }); // delete file async
        // send a default image
        res.sendFile(path.join(imgDir, defaultImg));
    });
};

exports.downloadAndSendImage = downloadAndSendImage;