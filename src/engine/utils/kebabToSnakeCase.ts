export default function kebabToSnakeCase(str: string): string {
  return str.replace(/-/g, "_");
}
