import assert from 'power-assert';
import Bpm from '../src/bpm'

it('Bpm', () => {
  var b = new Bpm(120);
  assert(b.bpm === 120);
});