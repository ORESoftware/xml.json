#!/usr/bin/env node
'use strict';

import {XMLParser} from "./index";

process.stdin.resume().pipe(new XMLParser()).once('result', function (v) {
  console.log(JSON.stringify(v));
});
