import crypto from 'node:crypto';

const WebCrypto = crypto.webcrypto;
function makeRNG(constructor) {
  let pool;
  let cursor = 0;
  return () => {
    if (!pool || cursor === pool.length) {
      pool = new constructor(65536 / (constructor.BYTES_PER_ELEMENT * 8));
      cursor = 0;
      WebCrypto.getRandomValues(pool);
    }
    return pool[cursor++];
  };
}
function makeBitRNG(rng, bits) {
  let pool = 0;
  let cursor = bits;
  return () => {
    if (cursor === bits) {
      pool = rng();
      cursor = 0;
    }
    return pool & 1 << cursor++ ? 1 : 0;
  };
}
const RNG = {
  get1: makeBitRNG(makeRNG(Uint8Array), 8),
  get8: makeRNG(Uint8Array),
  get16: makeRNG(Uint16Array),
  get32: makeRNG(Uint32Array),
  get64: makeRNG(BigUint64Array)
};
const DEC2HEX = Array.from({
  length: 256
}, (_, idx) => idx.toString(16).padStart(2, "0"));
const get = () => {
  let id = "";
  for (let i = 0; i < 4; i++) {
    const uint32 = RNG.get32();
    id += DEC2HEX[uint32 >>> 24 & 255];
    id += DEC2HEX[uint32 >>> 16 & 255];
    id += DEC2HEX[uint32 >>> 8 & 255];
    id += DEC2HEX[uint32 & 255];
  }
  return id;
};
const get$1 = get;

export { get$1 as g };
//# sourceMappingURL=get-6158dfbd.mjs.map
