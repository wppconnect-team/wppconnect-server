/*
 * Copyright 2023 WPPConnect Team
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

import { CommentClient } from '../types/CommentClient';

export async function getComments(req: Request, res: Response) {
  /**
   * #swagger.tags = ["Community"]
   * #swagger.security = [{"bearerAuth": []}]
   * #swagger.description = 'Read locally synchronized replies to an announcement. Does not mark them read.'
   */
  const messageId = req.params.messageId;
  if (typeof messageId !== 'string' || !messageId.trim()) {
    return res
      .status(400)
      .json({ status: 'error', message: 'messageId is required' });
  }
  const client = req.client as typeof req.client & CommentClient;
  if (typeof client.getComments !== 'function') {
    return res.status(501).json({
      status: 'error',
      message: 'Community comments are unavailable in this WPPConnect build',
    });
  }
  try {
    const response = await client.getComments(messageId);
    return res.status(200).json({ status: 'success', response });
  } catch (_error) {
    req.logger.error('Failed to read community announcement comments');
    return res.status(500).json({
      status: 'error',
      message: 'Error reading community announcement comments',
    });
  }
}

export async function sendCommentMessage(req: Request, res: Response) {
  /**
   * #swagger.tags = ["Community"]
   * #swagger.security = [{"bearerAuth": []}]
   * #swagger.autoBody = false
   * #swagger.description = 'Send an announcement comment. Never automatically retry a 502: delivery may already have happened.'
   * #swagger.requestBody = {
   *   required: true,
   *   content: { "application/json": { schema: { type: "object", required: ["text"], properties: {text: {type: "string"}} } } }
   * }
   */
  const messageId = req.params.messageId;
  const text = req.body?.text;
  if (
    typeof messageId !== 'string' ||
    !messageId.trim() ||
    typeof text !== 'string' ||
    !text.trim()
  ) {
    return res.status(400).json({
      status: 'error',
      message: 'messageId and nonempty text are required',
    });
  }
  const client = req.client as typeof req.client & CommentClient;
  if (typeof client.sendCommentMessage !== 'function') {
    return res.status(501).json({
      status: 'error',
      message: 'Community comments are unavailable in this WPPConnect build',
    });
  }
  try {
    const response = await client.sendCommentMessage(messageId, text);
    if (response?.messageSendResult === 'OK') {
      return res.status(201).json({ status: 'success', response });
    }
    return res.status(502).json({
      status: 'error',
      message:
        'Comment send was not confirmed; check the announcement before retrying',
      retrySafe: false,
      response,
    });
  } catch (_error) {
    req.logger.error('Community comment send was not confirmed');
    return res.status(502).json({
      status: 'error',
      message:
        'Comment send was not confirmed; check the announcement before retrying',
      retrySafe: false,
    });
  }
}
