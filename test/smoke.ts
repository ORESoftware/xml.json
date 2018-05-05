import path = require('path');
import {XMLParser, symbols, XML} from "../dist";
import {Node} from "../dist";
import fs = require('fs');

const file = path.resolve(__dirname + '/assets/foo.xml');

// const p = new XMLParser({file, key: 'truck'});

const p = fs.createReadStream(file).pipe(new XMLParser({key: 'truck'}));

// const p = XML.parse(file);

// p.on('data', function (v) {
//   console.log('mucho data:', v);
// });
//
// p.once('result', function (v) {
//   console.log('here is the RESUTL:', v);
// });

p.on('jschunk', function (obj) {
  console.log('jschunk:', obj);
});

p.emitter.once('result', function (obj: Node) {
  //
  // console.log('a:');
  
  // console.log(obj.store.lck);
  // // console.log('books:');
  //
  // obj.store.books.zoo.forEach(function (v: any) {
  //   console.log('agage:', v);
  // });
  
  console.log('foop:', JSON.stringify(obj));
  
  // p.print();
  
});


