'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const util = require("util");
const EventEmitter = require("events");
const xml = `
  <store class="ag">
  <books>
  <zoo></zoo>
  </books>
  <foo>
    <x>
   </x>
</foo>
</store>
`;
class XMLParser {
    constructor(file) {
        this.filepath = '';
        this.rawInput = '';
        this.jsResult = {
            root: {
                n: 'root',
                v: null,
                f: {},
                p: null,
                c: {},
            }
        };
        this.withinField = false;
        this.emitter = new EventEmitter();
        if (!path.isAbsolute(file)) {
            throw new Error('xml file path must be absolute.');
        }
        this.reader = fs.createReadStream(file, 'utf8');
        const self = this;
        this.currentNode = this.jsResult.root;
        this.reader.once('end', function () {
            console.log('reading has ended.');
            console.log(self.inspectValue());
            self.emitter.emit('result', self.jsResult.root);
        });
        let dataCount = 0;
        this.reader.on('data', function (d) {
            dataCount++;
            console.log('data count:', dataCount);
            let index = 0;
            let prevChar = '';
            let nextNodeName = '';
            let recordingFields = false;
            let recordingNextNodeName = false;
            let recordingValue = false;
            let closingNode = false;
            let fieldName = '';
            let fieldValue = '';
            let fields = {};
            let nodeValue = '';
            for (let v of String(d)) {
                const isWhiteSpace = String(v).trim() === '';
                if (isWhiteSpace && recordingNextNodeName) {
                    recordingNextNodeName = false;
                    recordingFields = true;
                }
                if (isWhiteSpace && self.withinField === false) {
                    if (recordingValue) {
                        nodeValue += v;
                    }
                    continue;
                }
                if (v === '"' && prevChar !== '\\' && self.withinField === false) {
                    self.withinField = true;
                }
                else if (v === '"' && prevChar !== '\\' && self.withinField === true) {
                    self.withinField = false;
                    fields[fieldName.slice(0, fieldName.length - 1)] = String(fieldValue).slice(1);
                    fieldName = '';
                    fieldValue = '';
                }
                if (recordingFields && self.withinField === false) {
                    fieldName += v;
                }
                if (recordingFields && self.withinField === true) {
                    fieldValue += v;
                }
                if (prevChar === '<' && v === '/' && self.withinField === false) {
                    recordingValue = false;
                    self.currentNode.v = String(nodeValue.slice(1, nodeValue.length - 1)).trim();
                    nodeValue = '';
                }
                if (prevChar === '<' && v !== '/' && self.withinField === false) {
                    recordingValue = false;
                    self.currentNode.v = '';
                    nodeValue = '';
                    recordingNextNodeName = true;
                }
                if (v !== '>' && recordingNextNodeName) {
                    nextNodeName += v;
                }
                if (v === '>' && (recordingFields || recordingNextNodeName) && self.withinField === false) {
                    recordingNextNodeName = false;
                    recordingFields = false;
                    recordingValue = true;
                    let newNode = null, x = self.currentNode.c || self.currentNode;
                    newNode = self.getNewNode(nextNodeName);
                    newNode.f = fields;
                    x[nextNodeName] = newNode;
                    fields = {};
                    nextNodeName = '';
                    self.currentNode = newNode;
                    debugger;
                }
                if (closingNode === true && v === '>') {
                    closingNode = false;
                    let parent = self.currentNode.p;
                    delete self.currentNode.p;
                    if (self.currentNode.v) {
                        parent.c[self.currentNode.n] = self.currentNode.v;
                    }
                    self.currentNode = parent;
                }
                if (v === '/' && self.withinField === false && prevChar === '<') {
                    closingNode = true;
                }
                if (recordingValue) {
                    nodeValue += v;
                }
                index++;
                prevChar = v;
            }
        });
    }
    inspectValue() {
        return util.inspect(this.jsResult, { depth: 15, maxArrayLength: 50 });
    }
    toXML() {
        return '';
    }
    getNewArrayNode(name) {
        return {
            n: name,
            v: '',
            p: this.currentNode,
            f: {},
            c: {}
        };
    }
    getNewNode(name) {
        return {
            n: name,
            v: '',
            p: this.currentNode,
            f: {},
            c: {}
        };
    }
}
exports.XMLParser = XMLParser;
