export function isProduction() {
  return typeof process === 'object' && process.env.NODE_ENV === 'production';
}
