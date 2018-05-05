/// <reference types="node" />
import { Readable } from "stream";
import EventEmitter = require('events');
export declare type EndValue = Node | string | boolean | number;
export interface Node {
    n?: string;
    v: string | boolean | number | null;
    c: {
        [key: string]: Node | EndValue | Array<EndValue>;
    };
    f: {
        [key: string]: string;
    };
    p: Node;
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
    toXML(): string;
    getNewArrayNode(name: string): Node;
    getNewNode(name: string): Node;
}
