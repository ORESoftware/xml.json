

# Oresoftare / XML.js

## <i> Stream XML and parse to JavaScript objects </i>

#### Read from a file, or use a readable stream.


```javascript

import {XMLParser} from '@oresoftware/xml.js'

fs.createReadStream(file).pipe(new XMLParser()).once('result', function(result){
     // your XML is now a JS object
});

```

### Now if you want to stream chunks of JS objects

```javascript

fs.createReadStream(file).pipe(new XMLParser({key: 'foobar'})).on('jschunk', function(c){
     // represents a Node instance in your data
});

```

### Just pass in a file path:

The library will create a read stream for you.

```javascript

new XMLParser({file}).once('result', function(c){
     // c represents a Node instance in your data
});

```

