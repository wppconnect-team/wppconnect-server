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

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  GroupCipher,
  GroupSessionBuilder,
  SenderKeyDistributionMessage,
  SenderKeyName,
  SenderKeyRecord,
} = require('@wppconnect/whaileys/WASignalGroup');

class MemorySenderKeyStore {
  records = new Map();

  async loadSenderKey(name) {
    return new SenderKeyRecord(this.records.get(name.toString()));
  }

  async storeSenderKey(name, record) {
    this.records.set(name.toString(), record.serialize());
  }
}

const senderStore = new MemorySenderKeyStore();
const receiverStore = new MemorySenderKeyStore();
const address = {
  id: '5511999999999',
  deviceId: 0,
  toString() {
    return `${this.id}.${this.deviceId}`;
  },
};
const name = new SenderKeyName('120363000000000000@g.us', address);
const senderBuilder = new GroupSessionBuilder(senderStore);
const receiverBuilder = new GroupSessionBuilder(receiverStore);
const distribution = await senderBuilder.create(name);

await receiverBuilder.process(
  name,
  new SenderKeyDistributionMessage(
    null,
    null,
    null,
    null,
    distribution.serialize()
  )
);

const plaintext = Buffer.from('wppconnect provider crypto smoke');
const ciphertext = await new GroupCipher(senderStore, name).encrypt(plaintext);
const decrypted = await new GroupCipher(receiverStore, name).decrypt(
  ciphertext
);

if (!Buffer.from(decrypted).equals(plaintext)) {
  throw new Error('Whaileys group message did not round-trip');
}

console.log(
  `Whaileys group crypto round-trip passed (${ciphertext.length} encrypted bytes).`
);
