
import path = require('path');
import {XMLParser} from "../dist";
import {Node} from "../dist";

const file = path.resolve(__dirname + '/assets/foo.xml');
const p = new XMLParser(file);

p.emitter.once('result', function(obj: Node){

  console.log('zoo:');
  console.log(obj.c.store);
  console.log('a:');
  console.log(obj.c.store);
  
});
