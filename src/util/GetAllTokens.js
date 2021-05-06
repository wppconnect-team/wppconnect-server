import path from 'path';
import fs from 'fs';
import util from 'util';
import Logger from "./logger"

const readdir = util.promisify(fs.readdir);

export default async function getAllTokens() {
    try {
        const __dirname = path.resolve(path.dirname(''));
        return await readdir(path.resolve(__dirname, 'tokens'))
    } catch (e) {
        Logger.error(e)
    }
}