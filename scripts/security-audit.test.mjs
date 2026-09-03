import assert from 'node:assert/strict';
import test from 'node:test';

import { getAuditReport, parseAuditRecords } from './security-audit.mjs';

test('parses JSON lines while ignoring diagnostic text', () => {
  assert.deepEqual(
    parseAuditRecords('diagnostic\n{"value":"one"}\n{"value":"two"}\n'),
    [{ value: 'one' }, { value: 'two' }]
  );
});

test('retries missing reports and returns the first complete report', async () => {
  let calls = 0;
  const waits = [];
  const report = await getAuditReport({
    runAudit: () => {
      calls += 1;
      return calls < 3
        ? { status: 1, stdout: '', stderr: '' }
        : { status: 0, stdout: '{"value":"complete"}\n', stderr: '' };
    },
    wait: async (milliseconds) => waits.push(milliseconds),
  });

  assert.equal(calls, 3);
  assert.deepEqual(waits, [2_000, 4_000]);
  assert.deepEqual(report, [{ value: 'complete' }]);
});

test('does not retry a non-zero audit result that contains advisories', async () => {
  let calls = 0;
  const report = await getAuditReport({
    runAudit: () => {
      calls += 1;
      return {
        status: 1,
        stdout: '{"value":"dependency","children":{"ID":42}}\n',
        stderr: '',
      };
    },
    wait: async () => assert.fail('must not wait'),
  });

  assert.equal(calls, 1);
  assert.equal(report[0].children.ID, 42);
});

test('fails after the bounded number of report-less attempts', async () => {
  let calls = 0;
  await assert.rejects(
    getAuditReport({
      attempts: 2,
      retryDelayMs: 0,
      runAudit: () => {
        calls += 1;
        return { status: 1, stdout: '', stderr: '' };
      },
      wait: async () => undefined,
    }),
    /after 2 attempts/
  );
  assert.equal(calls, 2);
});
