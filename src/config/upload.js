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
import path from 'path';
import multer from 'multer';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const __dirname = path.resolve(path.dirname(''));
    cb(null, path.resolve(__dirname, 'uploads'));
  },
  filename: function (req, file, cb) {
    let filename = `wppConnect-${Date.now()}-${file.originalname}`;
    cb(null, filename);
  },
});

const uploads = multer({ storage: storage });
export default uploads;
