
import path = require('path');
import {XMLParser} from "../dist";
import {Node} from "../dist";

const file = path.resolve(__dirname + '/assets/foo.xml');
const p = new XMLParser(file);

p.emitter.once('result', function(obj: Node){
  //
  // console.log('a:');
  // console.log(obj.store.a);
  // console.log('books:');
  // console.log(obj.store.books.viewString());
  
  // p.print();
  
});


