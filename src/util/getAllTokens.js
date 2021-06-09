import {tokenStore} from "@wppconnect-team/wppconnect";

export default async function getAllTokens(req) {
    let myTokenStore = new tokenStore.FileTokenStore();
    try {
        return await myTokenStore.listTokens();
    } catch (e) {
        req.logger.error(e);
    }
}