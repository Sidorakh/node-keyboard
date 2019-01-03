const midi = require('midi');
const fs = require('fs');
const robot = require('robotjs');
const rl = require('readline-sync');
var key_state = [];
var input = new midi.input();
var bound = {};
var bound_keys = false;

var port_num = input.getPortCount();
console.log(port_num);

for (var i=0;i<port_num;i++) {
    console.log(`${i+1}. ${input.getPortName(i)}`);
}

port = rl.questionInt('Which device do you want to use? ')-1;


if (fs.existsSync('input.json')) {
    bound = JSON.parse(fs.readFileSync('input.json'));
    bound_keys = true;
}

input.on('message', function (dt, msg) {
    if (key_state.length < 2) {
        key_state.push(msg[0]);
        console.log(`${(key_state.length == 1) ? 'Press' : 'Release' } value found`)
        if (key_state.length == 1) {
            console.log('Now to bind keys. Press a key on the MIDI keyboard to begin binding. ');
        }
        return;
    }
    if (bound_keys == false) {
        if (msg[0] != key_state[0]) return;
        var key = rl.question(`What key should this be mapped to? (type END to stop binding): `);
        if (key.toLowerCase() == "end") {
            bound_keys = true;
            fs.writeFileSync('input.json',JSON.stringify(bound,null,4));
            return;
        }
        bound[msg[1]] = key.toLowerCase();
        return;
    }
    if (msg[0] == key_state[0]) {
        if (bound[msg[1]] != undefined) 
            robot.typeString(bound[msg[1]]);
    }
    console.log(`Key ${msg[1]} ${msg[0] == key_state[0] ? 'pressed' : 'released'}`);

});

input.openPort(port);

console.log('Press any key on the MIDI keyboard once to begin mapping');