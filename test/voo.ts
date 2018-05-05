

const s = Symbol('foo');

const v = {
  [s] : 'bar'
};

console.log(v);

delete v[s];

console.log(v);
