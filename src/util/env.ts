import * as dotenv from 'dotenv';

dotenv.config({ override: true });
export function env(key: string, defaultValue: any = null) {
  return process.env[key] || defaultValue;
}
