const path = require('path');
const fs = require('fs');
const expect = require('chai').expect;

describe('compare schemas', () => {
  it('address', () => {
    const expected = fs.readFileSync(path.join(__dirname, 'expectedInterfaces/Address.d.ts')).toString().split('\n');
    const generated = fs.readFileSync(path.join(__dirname, 'generatedInterfaces/Address.d.ts')).toString().split('\n');

    expect(generated).to.deep.equal(expected);
  });
  it('customer', () => {
    const expected = fs.readFileSync(path.join(__dirname, 'expectedInterfaces/Customer.d.ts')).toString().split('\n');
    const generated = fs.readFileSync(path.join(__dirname, 'generatedInterfaces/Customer.d.ts')).toString().split('\n');

    expect(generated).to.deep.equal(expected);
  });
  it('name', () => {
    const expected = fs.readFileSync(path.join(__dirname, 'expectedInterfaces/Name.d.ts')).toString().split('\n');
    const generated = fs.readFileSync(path.join(__dirname, 'generatedInterfaces/Name.d.ts')).toString().split('\n');

    expect(generated).to.deep.equal(expected);
  });
  it('phone', () => {
    const expected = fs.readFileSync(path.join(__dirname, 'expectedInterfaces/Phone.d.ts')).toString().split('\n');
    const generated = fs.readFileSync(path.join(__dirname, 'generatedInterfaces/Phone.d.ts')).toString().split('\n');

    expect(generated).to.deep.equal(expected);
  });
});
