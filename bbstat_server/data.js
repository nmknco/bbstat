var spawn = require('child_process').spawn;
var path = require('path');

var getdata = function(req, res) {

    var key_bbref = req.query.key_bbref;
    if (key_bbref === null) {
        res.end();
    } else {
        // To do: move database handling from py back to the 
        //      node module here
        // The py file path below is NOT relative to the current
        //      script, must use the path module
        var dir = path.join(__dirname, 'getStat.py');
        var process = spawn('python3', [dir, key_bbref]);

        console.log('readingin');
        process.stdout.on('data',function(data){
            console.log(data);
            res.write(data);
            res.end();
        });
    }

    // res.write("Received: " + req.query.b);
    // res.end();

};

exports.getdata = getdata;