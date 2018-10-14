const { parseMoment } = require('../../util/data');

test('parsing moment for undefined returns null', () => {
  const output = parseMoment(undefined);
  expect(output).toBeNull();
});

test('parsing moment for null returns null', () => {
  const output = parseMoment(null);
  expect(output).toBeNull();
});

test('parsing moment for invalid string returns null', () => {
  const output = parseMoment('this is not a date');
  expect(output).toBeNull();
});

test('parsing moment for iso string returns moment object', () => {
  const output = parseMoment('2018-10-01T00:00:00.000Z');
  expect(output).toBeTruthy();
  output.utc(); // Otherwise it returns values in local time
  expect(output.month()).toEqual(9); // Month values are 0-11
});
