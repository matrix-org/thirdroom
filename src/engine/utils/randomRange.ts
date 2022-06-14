export default function randomRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
