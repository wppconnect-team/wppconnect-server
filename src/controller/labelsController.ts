/*
 * Copyright 2022 WPPConnect Team
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

import { Response } from 'express';
import { Request } from '../types/request-types';

export async function addNewLabel(req: Request, res: Response) {
  const { name, options } = req.body;
  if (!name)
    return res.status(401).send({
      message: 'Name was not informed',
    });

  try {
    const result = await req.client?.addNewLabel(name, options);
    res.status(201).json({ status: 'success', response: result });
  } catch (error) {
    res.status(500).json({ status: 'Error', message: 'Erro ao adicionar etiqueta.' });
  }
}

export async function addOrRemoveLabels(req: Request, res: Response) {
  const { chatIds, options } = req.body;
  if (!chatIds || !options)
    return res.status(401).send({
      message: 'chatIds or options was not informed',
    });

  try {
    const result = await req.client?.addOrRemoveLabels(chatIds, options);
    res.status(201).json({ status: 'success', response: result });
  } catch (error) {
    res.status(500).json({ status: 'Error', message: 'Erro ao adicionar/deletar etiqueta.' });
  }
}

export async function getAllLabels(req: Request, res: Response) {
  try {
    const result = await req.client?.getAllLabels();
    res.status(201).json({ status: 'success', response: result });
  } catch (error) {
    res.status(500).json({ status: 'Error', message: 'Erro ao buscar etiquetas.' });
  }
}

export async function deleteAllLabels(req: Request, res: Response) {
  try {
    const result = await req.client?.deleteAllLabels();
    res.status(201).json({ status: 'success', response: result });
  } catch (error) {
    res.status(500).json({ status: 'Error', message: 'Erro ao deletar todas as etiquetas.' });
  }
}

export async function deleteLabel(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const result = await req.client?.deleteLabel(id);
    res.status(201).json({ status: 'success', response: result });
  } catch (error) {
    res.status(500).json({ status: 'Error', message: 'Erro ao deletar etiqueta.' });
  }
}
