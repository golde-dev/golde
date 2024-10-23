const decoder = new TextDecoder();

export function decode(value: BufferSource): string {
  return decoder.decode(value);
}

const encoder = new TextEncoder();

export function encode(value: string): Uint8Array {
  return encoder.encode(value);
}
