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

export interface Node {
  name: string,
  value: any,
  children: { [key: string]: Node },
  fields: { [key: string]: string },
  parent: Node
}

export class XMLParser {
  
  filepath = '';
  rawInput = '';
  jsResult = {
    root: <Node> {
      name: 'root',
      value: null,
      fields: {},
      parent: null as Node,
      children: {},
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
    
    let prevChar = '';
    let nextNodeName = '';
    let recordingFields = false;
    let recordingNextNodeName = false;
    let recordingValue = false;
    let closingNode = false;
    let fieldName = '';
    let fieldValue = '';
    let nodeValue = '';
    
    this.reader.on('data', function (d) {
      
      let index = 0;
      
      for (let v of String(d)) {
        
        const isWhiteSpace = String(v).trim() === '';
        
        // if (isWhiteSpace && recordingNextNodeName) {
        //   recordingNextNodeName = false;
        //   recordingFields = true;
        // }
        
        if (isWhiteSpace && self.withinField === false) {
          if (recordingValue) {
            nodeValue += v;
          }
          continue;
        }
        
        if (v === '"' && prevChar !== '\\' && self.withinField === false) {
          self.withinField = true;
        }
        
        if (v === '"' && prevChar !== '\\' && self.withinField === false) {
          self.withinField = true;
        }
        
        if (prevChar === '<' && v === '/' && self.withinField === false) {
          recordingValue = false;
          self.currentNode.value = String(nodeValue.slice(1, nodeValue.length - 1)).trim();
          nodeValue = '';
        }
        
        if (prevChar === '<' && v !== '/' && self.withinField === false) {
          recordingValue = false;
          self.currentNode.value = String(nodeValue.slice(1, nodeValue.length - 1)).trim();
          nodeValue = '';
          recordingNextNodeName = true;
        }
        
        if (v !== '>' && recordingNextNodeName) {
          nextNodeName += v;
        }
        
        if (v === '>' && recordingNextNodeName) {
          recordingNextNodeName = false;
          recordingValue = true;
          const n = self.getNewNode(nextNodeName);
          self.currentNode.children[nextNodeName] = n;
          nextNodeName = '';
          self.currentNode = n;
          console.log('current node name is:', self.currentNode.name);
          debugger;
        }
        
        if (closingNode === true && v === '>') {
          console.log('close node is now false');
          closingNode = false;
          let parent = self.currentNode.parent;
          delete self.currentNode.parent;
          self.currentNode = parent;
        }
        
        if (v === '/' && self.withinField === false && prevChar === '<') {
          console.log('close node is now true');
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
    return util.inspect(this.jsResult, {depth: 15});
  }
  
  getNewNode(name: string): Node {
    return {
      name,
      value: '',
      parent: this.currentNode,
      children: {},
      fields: {}
    }
  }
  
}
