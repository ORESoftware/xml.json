'use strict';

import * as readline from 'readline';
import {Readable} from "stream";
import fs = require('fs');
import * as path from "path";
import * as util from "util";
import EventEmitter = require('events');

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

export const symbols = {
  fields: Symbol('@xml.js.fields'),
  name: Symbol('@xml.js.name'),
  value: Symbol('@xml.js.value'),
  parent: Symbol('@xml.js.parent'),
  toString: Symbol('@xml.js.toString')
};

export type EndValue = Node | string | boolean | number;

export class Node {
  
  [key: string]: any;
  
  constructor(parent: Node, name: string) {
    
    this[symbols.fields] = {} as  { [key: string]: string };
    this[symbols.parent] = parent;
    this[symbols.name] = name;
    
  }
  
  [symbols.toString](): string {
    const v = Object.assign({}, this);
    delete v[symbols.fields];
    delete v[symbols.parent];
    delete v[symbols.name];
    return util.inspect(v);
  };
  
  toString(): string {
    return this[symbols.toString]();
  }
  
  valueOf(): string {
    return this[symbols.toString]();
  }
  
}

export class XMLParser {
  
  filepath = '';
  rawInput = '';
  jsResult = {
    root: new Node(null, 'root')
  };
  
  withinField = false;
  parentNode: Node;
  currentNode: Node;
  reader: Readable;
  emitter = new EventEmitter();
  
  constructor(file: string) {
    
    if (!path.isAbsolute(file)) {
      throw new Error('xml file path must be absolute.')
    }
    
    this.reader = fs.createReadStream(file, 'utf8');
    this.currentNode = this.jsResult.root;
    const self = this;
    
    this.reader.once('end', function () {
      console.log('reading has ended.');
      // console.log(self.inspectValue());
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
      let fields = {} as { [key: string]: string };
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
          // self.currentNode = String(nodeValue.slice(1, nodeValue.length - 1)).trim();
          self.currentNode[symbols.value] = String(nodeValue.slice(1, nodeValue.length - 1)).trim();
          nodeValue = '';
        }
        
        if (prevChar === '<' && v !== '/' && self.withinField === false) {
          recordingValue = false;
          self.currentNode[symbols.value] = '';
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
          
          let newNode = self.getNewNode(self.currentNode, nextNodeName);
          newNode[symbols.fields] = fields;
          self.currentNode[nextNodeName] = newNode;
          
          // const a = self.currentNode.c[nextNodeName] = self.currentNode.c[nextNodeName] || [];
          // newNode = {p: self.currentNode, c: {}, n: nextNodeName, v:[]};
          // a.push(newNode);
          
          fields = {};
          
          nextNodeName = '';
          self.currentNode = newNode;
          // console.log('current node name is:', self.currentNode.n);
          debugger;
        }
        
        if (closingNode === true && v === '>') {
          // console.log('close node is now false');
          closingNode = false;
          let parent = self.currentNode[symbols.parent];
          delete self.currentNode[symbols.parent];
          
          if (self.currentNode[symbols.value] &&
            Object.keys(self.currentNode[symbols.fields]).length < 1 &&
            Object.keys(self.currentNode).length < 4) {
            parent[self.currentNode[symbols.name]] = self.currentNode[symbols.value];
          }
          self.currentNode = parent;
        }
        
        if (v === '/' && self.withinField === false && prevChar === '<') {
          // console.log('close node is now true');
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
  
  print() {
    this.internalPrint(this.jsResult.root);
  }
  
  internalPrint(v: Node) {
    const self = this;
    Object.keys(v).forEach(function (k) {
      console.log(v[k]);
      self.internalPrint(v[k]);
    });
  }
  
  inspectValue() {
    return util.inspect(this.jsResult, {depth: 15, maxArrayLength: 50});
  }
  
  toXML(): string {
    return '';
  }
  
  getNewNode(parent: Node, name: string): Node {
    return new Node(parent, name);
  }
  
}
