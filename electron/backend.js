// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
var fs = require('fs');
var robot = require('robotjs');
const { ipcRenderer } = require('electron')

var num_ports = ipcRenderer.sendSync('synchronous-message', ['get_ports']);

var bound_map = {};
var kb_state = "select_input";
var current_keyboard = "qwerty";

ipcRenderer.on('asynchronous-reply', (event, arg) => {
    console.log(arg) // prints "pong"
})

var keyboards = JSON.parse(fs.readFileSync('keyboards.json'));
var back_color = keyboards.options.back_color;
var fore_color = keyboards.options.fore_color;
var select_color = keyboards.options.select_color;

var pos = [0,0];
var key_state = [];

var keys = ["up", "down", "left", "right", "enter", "backspace"];

var div = document.getElementById("instructions");

function openPort(port) {
    console.log(`Opening port ${port}`);
    div.innerHTML = "";
    div.innerText = "Press any key on the MIDI keyboard to calibrate";
    ipcRenderer.sendSync('synchronous-message',['open_port',port]);
    kb_state = "calibrate";
}
console.log(num_ports);
for (var i=0;i<num_ports;i++) {
    
    var btn = document.createElement("button");
    let j=i;
    btn.addEventListener('click',()=>{
        openPort(j);
    });
    btn.innerText = ipcRenderer.sendSync('synchronous-message', ['get_port_name',j]);
    div.appendChild(btn);
}



var canvas = document.getElementById("keyboard_canvas");
var ctx = canvas.getContext("2d");
ctx.canvas.width  = window.innerWidth;
ctx.canvas.height = window.innerHeight;

window.requestAnimationFrame(function animate(){
    ctx.fillStyle = back_color;
    ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
    switch (kb_state) {
        case "calibrate":

        break;
        case "select_input":

        break;
        case "mapping":

        break;
        case "typing":
            draw_keyboard(ctx);
        break;
    }
    window.requestAnimationFrame(animate);
});

ipcRenderer.on('midi',(event, msg) => {
    if(kb_state == "calibrate") {
        if (key_state.length < 2) {
            key_state.push(msg[0]);
            div.innerText += `\n${key_state.length == 1 ? "Pressed" : "Released"} value found`;
            if (key_state.length != 1) {
                div.innerText += `\nCalibration complete`;
                div.innerText += `\nSelect the gesture for ${keys[0]}: `;
                kb_state = "mapping";
                if (fs.existsSync('input.json')) {
                    bound_map = JSON.parse(fs.readFileSync('input.json'));
                    canvas.style.display="block";
                    div.style.display="none";
                    kb_state = "typing";
                }
            }
            return;
        }
    }
    if (msg[0] == key_state[0]) {
        if (kb_state == "mapping") {
            console.log('Still Mapping');
            var size = Object.keys(bound_map).length;
            div.innerText += msg[1];
            bound_map[msg[1]] = keys[size];
            if (size+1 == keys.length) {
                canvas.style.display="block";
                div.style.display="none";
                kb_state = "typing";
                fs.writeFileSync('input.json',JSON.stringify(bound_map,null,4));
            } else {
                div.innerText += `\nSelect the gesture for ${keys[size+1]}: `;
            }
        }
        if (kb_state == "typing") {
            var key = bound_map[msg[1]];
            console.log(key);
            if (key != undefined) {
                switch (key) {
                    case "left":
                        pos[0]-=1;
                        pos[0] = (pos[0] + (keyboards[current_keyboard][0].length)) % (keyboards[current_keyboard][0].length);
                        break;
                    case "right":
                        pos[0]+=1;
                        pos[0] = (pos[0] + (keyboards[current_keyboard][0].length)) % (keyboards[current_keyboard][0].length);
                    break;
                    case "up":
                        pos[1]-=1;
                        pos[1] = (pos[1] + (keyboards[current_keyboard].length+1)) % (keyboards[current_keyboard].length+1);
                    break;
                    case "down":
                        pos[1]+=1;
                        pos[1] = (pos[1] + (keyboards[current_keyboard].length+1)) % (keyboards[current_keyboard].length+1);
                    break;
                    case "enter":
                        var kb = keyboards[current_keyboard];
                        if (pos[1] < kb.length) {
                            robot.typeString(kb[pos[1]][pos[0]]);
                        } else {
                            if (pos[1] = kb.length) {
                                var control = keyboards.control_bar[0][pos[0]].key;
                                console.log(keyboards.control_bar[0][pos[0]]);
                                switch (control) {
                                    case "control":
                                        robot.keyTap("control");
                                    break;
                                    case "windows":
                                        robot.keyTap("command");
                                    break;
                                    case "alt":
                                        robot.keyTap("alt");
                                    break;
                                    case "shift":
                                        if (current_keyboard == "qwerty") {
                                            current_keyboard = "qwerty_caps";
                                        } else {
                                            current_keyboard = "qwerty";
                                        }
                                    break;
                                    case "qwerty":
                                        if (current_keyboard == "qwerty_symbol") {
                                            current_keyboard = "qwerty";
                                        }
                                    break;
                                    case "symbol":
                                        current_keyboard = "qwerty_symbol";
                                    break;
                                    case "enter":
                                        robot.keyTap("enter");
                                    break;
                                    case "backspace":
                                        robot.keyTap("backspace");
                                    break;
                                    case "space":
                                        robot.keyTap(" ");
                                    break;
                                }
                            }
                        }
                    break;
                    case "backspace":
                        robot.keyTap("backspace");
                    break;
                }
            }
        }
    }
});

function draw_keyboard(ctx) {
    var kb = keyboards[current_keyboard];
    var control = keyboards.control_bar;
    ctx.fillStyle = select_color;
    ctx.fillRect(8+pos[0]*36,90+pos[1]*30,36,30);
    ctx.textAlign="center";
    ctx.textBaseline="middle";
    ctx.fillStyle = fore_color;
    ctx.font = "30px Consolas";
    for (var y=0;y<kb.length;y++) {
        for (var x=0;x<kb[y].length;x++) {
            ctx.fillText(kb[y][x],8+x*36+18,90+y*30+15);
        }
    }
    ctx.font = "10px Consolas";
    for (var x=0;x<control[0].length;x++) {
        ctx.fillText(control[0][x].short,8+x*36+18,90+y*30+15);
    }
    ctx.font = "30px Consolas";
}
