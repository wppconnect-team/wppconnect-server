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
import { performance } from 'perf_hooks';

import {
  contactToArray,
  groupNameToArray,
  groupToArray,
} from '../../util/functions';

it('splits contact and group separators without changing outer whitespace', () => {
  expect(contactToArray('5511999999999; 267000387@lid')).toEqual([
    '5511999999999@c.us',
    '267000387@lid',
  ]);
  expect(groupToArray('123; 456@g.us,789')).toEqual([
    '123@g.us',
    '456@g.us',
    '789@g.us',
  ]);
  expect(groupNameToArray('  first ; second  ')).toEqual([
    '  first',
    'second  ',
  ]);
  expect(groupNameToArray(['  first ', 'second  '])).toEqual([
    '  first ',
    'second  ',
  ]);
});

it.each([contactToArray, groupToArray, groupNameToArray])(
  'bounds processing of long whitespace without a separator',
  (convert) => {
    const input = ' '.repeat(64000) + '123';
    const started = performance.now();
    expect(convert(input)).toHaveLength(1);
    expect(performance.now() - started).toBeLessThan(1000);
  }
);
