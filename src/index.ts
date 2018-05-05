'use strict';

import * as readline from 'readline';
import {Readable, Transform} from "stream";
import fs = require('fs');
import * as path from "path";
import * as util from "util";
import EventEmitter = require('events');

/////////////////////////////////////////////////////////////////////////////////

// export const symbols = {
//   fields: Symbol('@xml.js.fields'),
//   name: Symbol('@xml.js.name'),
//   value: Symbol('@xml.js.value'),
//   parent: Symbol('@xml.js.parent'),
//   toString: Symbol('@xml.js.toString')
// };

export namespace symbols {
  export const toString = Symbol('@xml.js.toString');
  export const fields = Symbol('@xml.js.fields');
  export const name = Symbol('@xml.js.name');
  export const value = Symbol('@xml.js.value');
  export const parent = Symbol('@xml.js.parent');
}

export interface Fields {
  [key: string]: string
}

export type EndValue = Node | string | boolean | number;

export class Node {
  
  [key: string]: any;
  
  [symbols.value]: any;
  [symbols.fields]: Fields;
  [symbols.parent]: Node;
  [symbols.name]: string;
  
  constructor(parent: Node, name: string) {
    
    // get / set with the define prop
    
    Object.defineProperty(this, symbols.value, {
      value: name,
      writable: true,
      enumerable: false,
      configurable: true
    });
    
    Object.defineProperty(this, symbols.fields, {
      value: {},
      writable: true,
      enumerable: false,
      configurable: true,
    });
    
    Object.defineProperty(this, symbols.parent, {
      value: parent,
      writable: true,
      enumerable: false,
      configurable: true
    });
    
    Object.defineProperty(this, symbols.name, {
      value: name,
      writable: true,
      enumerable: false,
      configurable: true
    });
    
  }
  
  viewString() {
    delete this[symbols.fields];
    delete this[symbols.parent];
    delete this[symbols.name];
    delete this[symbols.value];
    return this;
  }
  
  toJSON() {
    
    if (this[symbols.value]) {
      return this[symbols.value];
    }
    
    const v = {} as any;
    const self = this;
    
    Object.keys(this).forEach(function (k) {
      
      let x = self[k];
      
      if (x instanceof Map) {
        x = Array.from(x).map((v => v[1]));
      }
      
      v[k] = x;
    });
    
    return v;
    // return this[symbols.value] || this;
  }
  
}

export const getFields = function (v: Node): Fields {
  return v[symbols.fields];
};

export const getValue = function (v: Node): any {
  return v[symbols.value];
};

export interface XMLParserOpts {
  file?: string,
  readable?: Readable,
  stream?: Readable,
  key?: string,
  target?: string  // JS or JSON
}

export interface MapWithFirst extends Map<Node, Node> {
  first: Node;
}

export class XML {
  
  static parse(v: string | Readable): Transform {
    if (typeof v === 'string') {
      return XML.parseFromFile(v);
    }
    
    if (v instanceof Readable) {
      return XML.parseFromStream(v);
    }
  }
  
  static parseFromFile(v: string): Transform {
    return new XMLParser({file: v});
  }
  
  static parseFromStream(r: Readable) {
    return new XMLParser({stream: r});
  }
  
}

export class XMLParser extends Transform {
  
  filepath = '';
  rawInput = '';
  jsResult = {
    root: new Node(null, 'root')
  };
  
  file = '';
  withinField = false;
  currentNode: Node;
  reader: Readable;
  emitter = new EventEmitter();
  key = '';
  
  constructor(opts: XMLParserOpts) {
    
    super();
    
    const file = this.file = opts.file || '';
    this.key = opts.key || '';
    
    if (!path.isAbsolute(file)) {
      throw new Error('xml file path must be absolute.')
    }
    
    // this.reader could be user passed or just `this` itself
    
    this.reader = fs.createReadStream(file, 'utf8');
    this.currentNode = this.jsResult.root;
    const self = this;
    
    this.reader.once('end', function () {
      console.log('reading has ended.');
      setImmediate(function () {
        // console.log('inspection:',self.inspectValue());
        self.emitter.emit('result', self.jsResult.root);
        self.emit('result', self.jsResult.root);
      });
      
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
          
          const x = self.currentNode[nextNodeName];
          
          // console.log('xxx:', x);
          
          if (x instanceof Map) {
            x.set(newNode, newNode);
          }
          else if (x) {
            let m = new Map() as MapWithFirst;
            m.first = x;
            m.set(x, x);
            m.set(newNode, newNode);
            self.currentNode[nextNodeName] = m;
          }
          else {
            self.currentNode[nextNodeName] = newNode
          }
          
          // if (Array.isArray(x)) {
          //   x.push(newNode);
          // }
          // else if (x) {
          //   self.currentNode[nextNodeName] = [x, newNode];
          // }
          // else {
          //   self.currentNode[nextNodeName] = newNode;
          // }
          
          // console.log('newNode parent:', newNode[symbols.parent][symbols.name]);
          
          // const a = self.currentNode.c[nextNodeName] = self.currentNode.c[nextNodeName] || [];
          // newNode = {p: self.currentNode, c: {}, n: nextNodeName, v:[]};
          // a.push(newNode);
          
          fields = {};
          
          nextNodeName = '';
          self.currentNode = newNode;
          console.log('new current node name is:', self.currentNode[symbols.name]);
          debugger;
        }
        
        if (closingNode === true && v === '>') {
          // console.log('close node is now false');
          closingNode = false;
          let parent = self.currentNode[symbols.parent];
          delete self.currentNode[symbols.parent];
          
          if (self.currentNode[symbols.value] &&
            Object.keys(self.currentNode[symbols.fields]).length < 1 &&
            Object.keys(self.currentNode).length < 1) {
            // self.currentNode = self.currentNode[symbols.value]
            
            let z = parent[self.currentNode[symbols.name]];
            if (z instanceof Map) {
              z.set(z.first, z.first[symbols.value] || z.first);
              z.set(self.currentNode, self.currentNode[symbols.value] || self.currentNode);
            }
            // parent[self.currentNode[symbols.name]] = self.currentNode[symbols.value];
          }
          
          if (self.key === self.currentNode[symbols.name]) {
            self.emit('jschunk', self.currentNode);
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
    return this.internalPrint(this.jsResult.root);
  }
  
  internalPrint(v: Node) {
    const self = this;
    const keys = Object.keys(v);
    console.log('the keys:', keys);
    
    Object.keys(v).forEach(function (k) {
      console.log('the key:', k);
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
