import path from 'path';
import fs from 'fs';
import util from 'util';

const readdir = util.promisify(fs.readdir);

export default async function getAllTokens() {
    try {
        return await readdir(path.resolve(__dirname, '..', '..', 'tokens'))
    } catch (e) {
        console.log('Error getAllTokens() -> ', e)
    }
}