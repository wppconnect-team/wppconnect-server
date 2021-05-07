import api from "axios";
import Logger from "./logger"
export function contactToArray(number, isGroup) {
    let localArr = [];
    if (Array.isArray(number)) {
        for (const contact of number) {
            if (contact !== "")
                if (isGroup)
                    localArr.push(`${contact}@g.us`);
                else
                    localArr.push(`${contact}@c.us`);
        }
    } else {
        let arrContacts = number.split(/\s*[,;]\s*/g);
        for (const contact of arrContacts) {
            if (contact !== "")
                if (isGroup)
                    localArr.push(`${contact}@g.us`);
                else
                    localArr.push(`${contact}@c.us`);
        }
    }

    return localArr;
}

export function groupToArray(group) {
    let localArr = [];
    if (Array.isArray(group)) {
        for (const contact of group) {
            if (contact !== "")
                localArr.push(`${contact}@g.us`);
        }
    } else {
        let arrContacts = group.split(/\s*[,;]\s*/g);
        for (const contact of arrContacts) {
            if (contact !== "")
                localArr.push(`${contact}@g.us`);
        }
    }

    return localArr;
}

export function groupNameToArray(group) {
    let localArr = [];
    if (Array.isArray(group)) {
        for (const contact of group) {
            if (contact !== "")
                localArr.push(`${contact}`);
        }
    } else {
        let arrContacts = group.split(/\s*[,;]\s*/g);
        for (const contact of arrContacts) {
            if (contact !== "")
                localArr.push(`${contact}`);
        }
    }

    return localArr;
}

export function callWebHook(client, event, data) {
    if (client.webhook)
        try {
            api.post(client.webhook, Object.assign({event: event}, data))
                .catch((e) => {
                    Logger.error(e);
                });
        } catch (e) {
            Logger.error(e);
        }
}

export async function startAllSessions(port, secretkey) {
    try {
        await api.post(`http://localhost:${port}/api/${secretkey}/start-all`)
    } catch (e) {
        Logger.error(e);
    }

}