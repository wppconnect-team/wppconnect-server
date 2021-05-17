import path from 'path';
import fs from 'fs';
import util from 'util';
import Logger from "./logger"
import {tokenStore} from "@wppconnect-team/wppconnect";

const readdir = util.promisify(fs.readdir);

export default async function getAllTokens() {
    let myTokenStore = new tokenStore.FileTokenStore();
    try {
        return await myTokenStore.listTokens();
    } catch (e) {
        Logger.error(e);
    }
}