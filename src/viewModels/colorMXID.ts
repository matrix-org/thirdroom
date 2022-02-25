export function hashCode(str: string) {
  let hash = 0;
  let i;
  let chr;
  if (str.length === 0) {
    return hash;
  }
  for (i = 0; i < str.length; i += 1) {
    chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash);
}

export function colorMXID(userId: string) {
  const colorNumber = hashCode(userId) % 8;
  return `var(--usercolor${colorNumber})`;
}
