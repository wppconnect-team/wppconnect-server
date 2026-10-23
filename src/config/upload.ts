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
import { randomBytes } from 'crypto';
import multer from 'multer';
import path from 'path';

export const UPLOAD_DIRECTORY = path.resolve(process.cwd(), 'uploads');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIRECTORY);
  },
  filename: function (req, file, cb) {
    // Original names are display metadata, never part of a filesystem path.
    const originalExtension = path.extname(path.basename(file.originalname));
    const extension = /^\.[A-Za-z0-9]{1,10}$/.test(originalExtension)
      ? originalExtension
      : '';
    const filename = `wppConnect-${randomBytes(16).toString(
      'hex'
    )}${extension}`;
    cb(null, filename);
  },
});

const uploads = multer({ storage: storage });
export default uploads;
