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

import { Request, Response } from 'express';

import { queryBoolean } from '../../middleware/queryBoolean';

function parse(query: unknown) {
  const req = Object.create({
    get query() {
      return query;
    },
  }) as Request;
  const next = jest.fn();
  queryBoolean(req, {} as Response, next);
  expect(next).toHaveBeenCalledTimes(1);
  expect(next).toHaveBeenCalledWith();
  expect(req.query).toBe(req.query);
  return req.query;
}

describe('queryBoolean', () => {
  it('converts nested objects and arrays without modifying the input', () => {
    const nested = Object.assign(Object.create(null), { enabled: 'false' });
    const input = Object.assign(Object.create(null), {
      flags: ['true', 'false', 'TRUE', '0', ''],
      nested,
      absent: null,
    });
    expect(parse(input)).toEqual({
      flags: [true, false, 'TRUE', '0', ''],
      nested: { enabled: false },
      absent: null,
    });
    expect(input.flags[0]).toBe('true');
    expect(nested.enabled).toBe('false');
  });

  it('treats object method and prototype names as ordinary keys', () => {
    const input = JSON.parse(
      '{"hasOwnProperty":"false","constructor":"true","__proto__":{"polluted":"true"}}'
    );
    const result = parse(input);
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    expect(Object.prototype.hasOwnProperty.call(result, '__proto__')).toBe(
      true
    );
    expect(result).toEqual(
      JSON.parse(
        '{"hasOwnProperty":false,"constructor":true,"__proto__":{"polluted":true}}'
      )
    );
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});
