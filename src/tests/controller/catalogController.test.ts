/*
 * Copyright 2021 WPPConnect Team
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
import type { Request, Response } from 'express';

import { setProductVisibility } from '../../controller/catalogController';
import { getClient } from '../../core/provider/useProvider';

jest.mock('../../core/provider/useProvider', () => ({ getClient: jest.fn() }));

describe('catalog visibility controller', () => {
  const response = () => {
    const res = {
      status: jest.fn(),
      json: jest.fn(),
      send: jest.fn(),
    } as unknown as Response;
    (res.status as jest.Mock).mockReturnValue(res);
    return res;
  };

  it('accepts false to make an archived product visible again', async () => {
    const setVisibility = jest.fn().mockResolvedValue({ id: 'product-1' });
    (getClient as jest.Mock).mockReturnValue({
      setProductVisibility: setVisibility,
    });
    const req = { body: { id: 'product-1', value: false } } as Request;
    const res = response();

    await setProductVisibility(req, res);

    expect(setVisibility).toHaveBeenCalledWith('product-1', false);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).not.toHaveBeenCalled();
  });

  it('stops before the provider when visibility is missing', async () => {
    const provider = { setProductVisibility: jest.fn() };
    (getClient as jest.Mock).mockReturnValue(provider);
    const req = { body: { id: 'product-1' } } as Request;
    const res = response();

    await setProductVisibility(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(provider.setProductVisibility).not.toHaveBeenCalled();
  });
});
