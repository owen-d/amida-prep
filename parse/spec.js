'use strict';

const expect = require('chai').expect;
const parse = require('./parser');
const fs = require('fs');
const join = require('path').join;
const input = fs.readFileSync(join(__dirname, 'sample.txt')).toString();
const correct = require('./sampleOutput.json');

describe('parser', () => {
  it('should match expected', () => {
    expect(correct).to.eql(parse(input));
  });
});
