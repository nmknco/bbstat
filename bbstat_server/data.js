var util = require("util");
var spawn = require('child_process').spawn;

function getdata(req, res) {

    var key_bbref = req.query.key_bbref;
    if (key_bbref == null) {
        res.end();
    } else {
        var process = spawn('python3', ['./getStat.py', key_bbref]);

        util.log('readingin')
        process.stdout.on('data',function(data){
            util.log(data);
            res.write(data);
            res.end();
        });
    }

    // res.write("Received: " + req.query.b);
    // res.end();

}

exports.getdata = getdata;