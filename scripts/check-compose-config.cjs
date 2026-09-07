const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'wppconnect-compose-'));
const values = {
  WPP_SERVER_TAG: '2.10.18',
  PORT: '24552',
  HOST: 'https://server.example.test',
  SECRET_KEY: 'compose-test-key',
  WEBHOOK_URL: 'https://hooks.example.test/events',
  TOKEN_STORE_TYPE: 'redis',
  CUSTOM_USER_DATA_DIR: './userDataDir/',
  MAX_LISTENERS: '27',
  MANAGER_ENABLED: 'false',
  MANAGER_DIST: '/opt/manager',
  MONGODB_DATABASE: 'test-db',
  MONGODB_COLLECTION: 'test-sessions',
  MONGODB_USER: 'test-user',
  MONGODB_PASSWORD: 'test-password',
  MONGODB_HOST: 'mongo.example.test',
  MONGO_URL_REMOTE: 'mongodb://mongo.example.test:27018/test-db',
  MONGODB_PORT: '27018',
  REDIS_HOST: 'redis.example.test',
  REDIS_PORT: '6399',
  REDIS_PASSWORD: 'redis-test-password',
  REDIS_DB: '2',
  REDIS_PREFIX: 'test-prefix',
};
const environment = { ...process.env };
for (const name of Object.keys(values)) delete environment[name];
function render(contents) {
  const file = path.join(directory, '.env');
  fs.writeFileSync(file, contents);
  return JSON.parse(
    execFileSync(
      'docker',
      [
        'compose',
        '-f',
        path.join(root, 'docker-compose.yml'),
        '--env-file',
        file,
        'config',
        '--format',
        'json',
      ],
      { cwd: root, env: environment, encoding: 'utf8' }
    )
  ).services.wppconnect;
}
try {
  const configured = render(
    Object.entries(values)
      .map(([key, value]) => key + '=' + value)
      .join('\n')
  );
  for (const [name, value] of Object.entries(values)) {
    if (name === 'WPP_SERVER_TAG')
      assert.equal(configured.image, 'wppconnect/wppconnect-server:' + value);
    else
      assert.equal(
        String(configured.environment[name]),
        value,
        name + ' must reach the container'
      );
  }
  assert.equal(String(configured.ports[0].published), '24552');
  assert.equal(configured.ports[0].target, 24552);
  const defaults = render('');
  assert.equal(String(defaults.environment.PORT), '21465');
  assert.equal(String(defaults.environment.MANAGER_ENABLED), 'true');
  assert.equal(defaults.image, 'wppconnect/wppconnect-server:latest');
  console.log(
    'Compose defaults, port mapping and all documented variables passed'
  );
} finally {
  if (path.dirname(directory) !== path.resolve(os.tmpdir()))
    throw new Error('Unexpected test directory');
  fs.rmSync(directory, { recursive: true, force: true });
}
