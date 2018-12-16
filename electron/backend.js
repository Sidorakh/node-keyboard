// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
var midi = require('midi');
var midi_input = new midi.input();

var num_ports = midi_input.getPortCount();

