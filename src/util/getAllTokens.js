import Logger from "./logger"
import {tokenStore} from "@wppconnect-team/wppconnect";

export default async function getAllTokens() {
    let myTokenStore = new tokenStore.FileTokenStore();
    try {
        return await myTokenStore.listTokens();
    } catch (e) {
        Logger.error(e);
    }
}