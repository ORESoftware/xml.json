import path = require('path');
import {XMLParser, symbols} from "../dist";
import {Node} from "../dist";

const file = path.resolve(__dirname + '/assets/foo.xml');
const p = new XMLParser(file);

p.emitter.once('result', function (obj: Node) {
  //
  // console.log('a:');
  
  console.log(obj.store.lck);
  // console.log('books:');
  
  obj.store.books.zoo.forEach(function (v: any) {
    console.log('agage:', v);
  });
  
  console.log('foop:', JSON.stringify(obj));
  
  // p.print();
  
});


