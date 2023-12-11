export function env(key: string, defaultValue: any = null) {
  return process.env[key] || defaultValue;
}
