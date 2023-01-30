export function toBinaryString(value: number): string {
  return `0b${(value >>> 0).toString(2)}`;
}
