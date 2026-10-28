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
// Keep the browser option merger protected in registry installations too.
// Package-manager overrides apply to the repository root, not its consumers.
import fs from 'fs';
import { createRequire, registerHooks } from 'module';
import path from 'path';
import { pathToFileURL } from 'url';

const patched = pathToFileURL(
  path.resolve(__dirname, '../../vendor/deepmerge/index.cjs')
).href;
const affected = new Set(['4.2.0', '4.2.1', '4.2.2', '4.3.0', '4.3.1']);
const versions = new Map();
const browserConsumer =
  /\/node_modules\/puppeteer-extra(?:-plugin(?:-[^/]+)?)?\//;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      specifier !== 'deepmerge' ||
      !context.parentURL ||
      !browserConsumer.test(context.parentURL)
    ) {
      return nextResolve(specifier, context);
    }
    const metadata = createRequire(context.parentURL).resolve(
      'deepmerge/package.json'
    );
    if (!versions.has(metadata)) {
      const manifest = JSON.parse(fs.readFileSync(metadata, 'utf8'));
      versions.set(
        metadata,
        manifest.name === 'deepmerge' && affected.has(manifest.version)
      );
    }
    if (versions.get(metadata)) {
      return { url: patched, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
