var path = require('path');
var http = require('http');
var fs = require('fs');

var downloadAndSendImage = function(key_mlbam, res) {
    // try request headshot image from mlb.com
    //      if successful, store it in a loca lfile and serve
    //      if unsuccessful, clean local file and serve a default image
    console.log("Requesting image from mlb.com for " + key_mlbam);

    var imgDir = path.join(__dirname, 'public', 'img');
    var defaultImg = path.join(imgDir, 'bb.png');
    var dest = path.join(imgDir, key_mlbam + '.jpg');
    var file = fs.createWriteStream(dest);

    var headshot_url = 'http://mlb.mlb.com/mlb/images/players/head_shot/';
    headshot_url += key_mlbam + '.jpg';

    var request = http.get(headshot_url, function(response) {
        // note if file does not exists on mlb.com a response
        //      will be received with error code 404
        if (response.statusCode === 200) {
            response.pipe(file);
            file.on('finish', function() { // async
                file.close(function() {
                    res.sendFile(dest);
                });
            });
        } else {
            // need to unlike the file
            fs.unlink(dest, function(errUL) {
                // delete file async and send default img
                if(errUL) console.log(errUL);
                res.sendFile(defaultImg);
            });
            
        }
    }).on('error', function(err) {
        // download unsuccessful
        console.log(err);
        console.log("Fail to download head shot for " 
            + key_mlbam + ", serving default...");
        fs.unlink(dest, function(errUL) {
            // delete file async and send default img
            if(errUL) console.log(errUL);
            res.sendFile(defaultImg);
        });
        
    });
};

exports.downloadAndSendImage = downloadAndSendImage;