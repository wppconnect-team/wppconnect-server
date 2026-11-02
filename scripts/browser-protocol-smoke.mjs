/*
 * Copyright 2026 WPPConnect Team
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

import puppeteer from 'puppeteer';

const require = createRequire(import.meta.url);
const mapperRequire = createRequire(require.resolve('chromium-bidi'));
const { z } = mapperRequire('zod');

// A collection's size bound must reject input before parsing its elements.
// Older Zod versions accumulate element errors before applying this bound.
let elementReads = 0;
const oversized = Array.from({ length: 1000 }, () => ({ value: 123 }));
Object.defineProperty(oversized, 0, {
  get() {
    elementReads++;
    return { value: 123 };
  },
});
const schema = z.array(z.object({ value: z.string() })).max(1);
assert.equal(schema.safeParse([{ value: 'valid' }]).success, true);
const rejected = schema.safeParse(oversized);
assert.equal(rejected.success, false);
assert.equal(elementReads, 0);
assert.equal(rejected.error.issues.length, 1);
assert.equal(rejected.error.issues[0].code, 'too_big');
console.log('BiDi Zod bounded collection validation passed.');

for (const protocol of ['cdp', 'webDriverBiDi']) {
  const browser = await puppeteer.launch({
    protocol,
    executablePath:
      process.env.PUPPETEER_EXECUTABLE_PATH ||
      (await puppeteer.executablePath()),
    headless: true,
    args: ['--no-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 640, height: 480 });
    await page.goto('data:text/html,<title>Browser protocol smoke</title>');
    assert.equal(await page.title(), 'Browser protocol smoke');
    assert.deepEqual(
      await page.evaluate(() => ({ value: 2 + 2, width: innerWidth })),
      { value: 4, width: 640 }
    );
    console.log(`Chromium ${protocol} navigation and evaluation passed.`);
  } finally {
    await browser.close();
  }
}
