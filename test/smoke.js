"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const dist_1 = require("../dist");
const file = path.resolve(__dirname + '/assets/foo.xml');
const p = new dist_1.XMLParser(file);
p.emitter.once('result', function (obj) {
    console.log('zoo:');
    console.log(obj.c.store);
    console.log('a:');
    console.log(obj.c.store);
});
