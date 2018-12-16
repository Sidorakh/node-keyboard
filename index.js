var midi = require('midi');
var fs = require('fs');

var input = new midi.input();

var port_num = input.getPortCount();
console.log(port_num);

var port_name = input.getPortName(0);
console.log(port_name);

input.on('message', function (dt, msg) {
    console.log(msg);
    fs.appendFileSync('log.txt', JSON.stringify(msg));
});

input.openPort(0);
