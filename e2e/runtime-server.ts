/*
 * Test-only server entrypoint used by runtime-matrix.ts.
 * It keeps production config untouched while preventing local persisted
 * sessions from auto-starting during repeatable smoke runs.
 */
import os from 'os';
import path from 'path';

import config from '../src/config';
import { initServer } from '../src';

const dataDir =
  process.env.MATRIX_NODE_DATA_DIR ||
  path.join(os.tmpdir(), `wpp-node-matrix-${Date.now()}`);

initServer({
  ...config,
  startAllSession: false,
  customUserDataDir: `${dataDir}${path.sep}`,
  log: {
    ...config.log,
    level: process.env.MATRIX_NODE_LOG_LEVEL || 'info',
  },
  createOptions: {
    ...config.createOptions,
    logQR: false,
    disableWelcome: true,
    updatesLog: false,
  },
} as any);
