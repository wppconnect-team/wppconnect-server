export function env(key: string, defaultValue = null) {
  return process.env[key] || defaultValue;
}
