var blessed = require('blessed');
var keyboards = require('./keyboards.json');
var keyboard = keyboards.dvorak;
var pos={x:1,y:1};
var screen = blessed.screen({
    smartCSR:true
});
screen.title = "Blessed!";
var box = [];
for (var x=0;x<3;x++) {
    box[x] = [];
    for (var y=0;y<3;y++) {
        box[x][y] = blessed.box({
            left: 4+(x)*8,
            top: 4+(Math.floor(y))*8,
            content:`${y*3+x}`
        });
        screen.append(box[x][y]);
    }
}
var midi = require('midi');


var input = new midi.input();

var port_num = input.getPortCount();
console.log(port_num);

var port_name = input.getPortName(0);
console.log(port_name);

input.on('message', function (dt, msg) {
    //36
    //37
    //38
    //39
    //40
    //41
    //144 = down
    //128 = up
    if (Number.parseInt(msg[0]) == 128) {
        return;
    }
    switch (Number.parseInt(msg[1])) {
        case 36:
            pos.x-=1;
            if (pos.x < 0) pos.x = 0;
        break;
        case 37:
            pos.y -=1;
            if (pos.y < 0) pos.y = 0;
        break;
        case 38:
            pos.x+=1;
            if (pos.x > keyboard[pos.y].length) pos.x = keyboard[pos.y].length-1;
        break;
        case 39:
            pos.y +=1;
            if (pos.y >= keyboard.length) pos.y = keyboard.length-1;
        break;

    }
});

input.openPort(0);

setInterval(() => {
    for (var x=0;x<3;x++) {
        for (var y=0;y<3;y++) {
            var nx = pos.x-1+x;
            var ny = pos.y-1+y;
            if (nx < 0 || nx >= keyboard[pos.y].length) {
                box[x][y].content = " ";
                continue;
            }
            if (ny < 0 || ny >= keyboard.length) {
                box[x][y].content = " ";
                continue;
            }
            box[x][y].content = keyboard[ny][nx];
        }
    }
    
    
    screen.render();

},16);