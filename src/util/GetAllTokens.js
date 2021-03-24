import path from 'path';
import fs from 'fs';
import util from 'util';

const readdir = util.promisify(fs.readdir);

export default async function getAllTokens() {
    let filenameArray = []

    try {
        let files = await readdir(path.resolve(__dirname, '..', '..', 'tokens'))
        files.map((filename) => {
            filenameArray.push(filename)
        })
    } catch (e) {
        console.log('Error getAllTokens() -> ', e)
    }

    return filenameArray;
}