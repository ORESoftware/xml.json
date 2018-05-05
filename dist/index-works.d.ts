/// <reference types="node" />
import { Readable } from "stream";
import EventEmitter = require('events');
export interface Node {
    name: string;
    value: any;
    children: {
        [key: string]: Node;
    };
    fields: {
        [key: string]: string;
    };
    parent: Node;
}
export declare class XMLParser {
    filepath: string;
    rawInput: string;
    jsResult: {
        root: Node;
    };
    withinField: boolean;
    parentNode: Node;
    currentNode: Node;
    reader: Readable;
    emitter: EventEmitter;
    constructor(file: string);
    inspectValue(): string;
    getNewNode(name: string): Node;
}
