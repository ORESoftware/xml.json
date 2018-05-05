"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const dist_1 = require("../dist");
const file = path.resolve(__dirname + '/assets/foo.xml');
const p = new dist_1.XMLParser({ file, key: 'truck' });
p.on('jschunk', function (obj) {
    console.log('jschunk:', obj);
});
p.emitter.once('result', function (obj) {
    console.log('foop:', JSON.stringify(obj));
});
