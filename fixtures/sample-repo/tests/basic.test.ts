import { greet } from '../src/index';

if (greet('capsule') !== 'hello capsule') {
  throw new Error('unexpected greeting');
}
