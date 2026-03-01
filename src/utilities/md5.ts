const LEFT_ROTATE_AMOUNTS = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14,
  20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11,
  16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
]

const TABLE_T = Array.from({ length: 64 }, (_, index) =>
  Math.floor(Math.abs(Math.sin(index + 1)) * 0x100000000) >>> 0,
)

const leftRotate = (value: number, bits: number) => ((value << bits) | (value >>> (32 - bits))) >>> 0

const toHexLE = (value: number) => {
  let result = ''
  for (let i = 0; i < 4; i++) {
    const byte = (value >>> (i * 8)) & 0xff
    result += byte.toString(16).padStart(2, '0')
  }
  return result
}

const utf8Bytes = (input: string) => {
  const encoded = encodeURIComponent(input)
  const bytes: number[] = []

  for (let i = 0; i < encoded.length; i++) {
    const char = encoded[i]
    if (char === '%') {
      bytes.push(parseInt(encoded.slice(i + 1, i + 3), 16))
      i += 2
    } else {
      bytes.push(char.charCodeAt(0))
    }
  }

  return bytes
}

export const md5 = (input: string) => {
  const inputBytes = utf8Bytes(input)
  const bitLength = inputBytes.length * 8

  const withOneLen = inputBytes.length + 1
  const zeroPadLen = (56 - (withOneLen % 64) + 64) % 64
  const totalLength = withOneLen + zeroPadLen + 8

  const message = new Uint8Array(totalLength)
  message.set(inputBytes, 0)
  message[inputBytes.length] = 0x80

  const dataView = new DataView(message.buffer)
  dataView.setUint32(totalLength - 8, bitLength >>> 0, true)
  dataView.setUint32(totalLength - 4, Math.floor(bitLength / 0x100000000), true)

  let a0 = 0x67452301
  let b0 = 0xefcdab89
  let c0 = 0x98badcfe
  let d0 = 0x10325476

  for (let chunkOffset = 0; chunkOffset < totalLength; chunkOffset += 64) {
    let a = a0
    let b = b0
    let c = c0
    let d = d0

    for (let i = 0; i < 64; i++) {
      let f = 0
      let g = 0

      if (i < 16) {
        f = (b & c) | (~b & d)
        g = i
      } else if (i < 32) {
        f = (d & b) | (~d & c)
        g = (5 * i + 1) % 16
      } else if (i < 48) {
        f = b ^ c ^ d
        g = (3 * i + 5) % 16
      } else {
        f = c ^ (b | ~d)
        g = (7 * i) % 16
      }

      const word = dataView.getUint32(chunkOffset + g * 4, true)
      const tempD = d
      d = c
      c = b

      const sum = (a + f + TABLE_T[i] + word) >>> 0
      b = (b + leftRotate(sum, LEFT_ROTATE_AMOUNTS[i])) >>> 0
      a = tempD
    }

    a0 = (a0 + a) >>> 0
    b0 = (b0 + b) >>> 0
    c0 = (c0 + c) >>> 0
    d0 = (d0 + d) >>> 0
  }

  return `${toHexLE(a0)}${toHexLE(b0)}${toHexLE(c0)}${toHexLE(d0)}`
}

