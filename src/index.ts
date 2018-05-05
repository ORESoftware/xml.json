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

export type EndValue = Node | string | boolean | number;

export interface Node {
  n: string,
  v: string | boolean | number | null,
  c: { [key: string]: Node | EndValue | Array<EndValue> },
  f: { [key: string]: string },
  p: Node
}

export class XMLParser {
  
  filepath = '';
  rawInput = '';
  jsResult = {
    root: <Node> {
      n: 'root',
      v: null,
      f: {},
      p: null as Node,
      c: {},
    }
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
          
          let newNode = null, x = self.currentNode.c || self.currentNode as any;
          
          // if (true || fields['list'] || fields['>list'] || !self.currentNode.c) {
          //   const a = x[nextNodeName] = x[nextNodeName] || [];
          //   newNode = {p: self.currentNode};
          //   a.push(newNode);
          // }
          // else {
          newNode = self.getNewNode(nextNodeName);
          newNode.f = fields;
          x[nextNodeName] = newNode;
          // }
          
          fields = {};
          
          nextNodeName = '';
          self.currentNode = newNode;
          // console.log('current node name is:', self.currentNode.n);
          debugger;
        }
        
        if (closingNode === true && v === '>') {
          // console.log('close node is now false');
          closingNode = false;
          let parent = self.currentNode.p;
          delete self.currentNode.p;
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
  
  inspectValue() {
    return util.inspect(this.jsResult, {depth: 15, maxArrayLength: 50});
  }
  
  toXML(): string {
    return '';
  }
  
  getNewArrayNode(name: string): Node {
    
    return {
      n: name,
      v: '',
      p: this.currentNode,
      f: {},
      c: {}
    }
  }
  
  getNewNode(name: string): Node {
    return {
      n: name,
      v: '',
      p: this.currentNode,
      f: {},
      c: {}
    }
  }
  
}
