import _ from "lodash";
import {contactToArray, groupNameToArray, groupToArray} from "../util/functions";
import Logger from "../util/logger";

function returnError(res, session, error, message) {
    Logger.error(error);
    res.status(400).json({
        response: {
            message: message,
            session: session,
            log: error
        },
    });
}

function returnSucess(res, session, phone, message) {
    res.status(201).json({
        response: {
            message: message,
            contact: phone,
            session: session
        },
    });
}

export async function joinGroupByCode(req, res) {
    const session = req.session;
    const {inviteCode} = req.body;

    if (!inviteCode)
        return res.status(401).send({message: "Invitation Code is required"});

    try {
        await req.client.joinGroup(inviteCode);

        returnSucess(res, session, inviteCode, "The informed contact(s) entered the group successfully");
    } catch (error) {
        returnError(res, session, error, "The informed contact(s) did not join the group successfully");
    }
}

export async function createGroup(req, res) {
    const {participants, name} = req.body;

    let response = {};
    let infoGroup = [];

    try {
        for (const grupo of groupNameToArray(name)) {
            response = await req.client.createGroup(grupo, contactToArray(participants));

            infoGroup.push({
                name: grupo,
                id: response.gid.user,
                participants: response.participants.map((user) => {
                    return {user: Object.keys(user)[0]};
                })
            });
        }

        return res.status(200).json({
            status: "Success",
            message: "Group(s) created successfully",
            group: name,
            groupInfo: infoGroup
        });
    } catch (e) {
        Logger.error(e);
        return res.status(400).json("Error creating group(s)");
    }
}

export async function leaveGroup(req, res) {
    const {groupId} = req.body;

    try {
        for (const grupo of groupToArray(groupId)) {
            await req.client.leaveGroup(grupo);
        }

        return res.status(200).json({status: "Success", messages: "Você saiu do grupo com sucesso", group: groupId});
    } catch (e) {
        Logger.error(e);
        return res.status(400).json("Erro ao sair do(s) grupo(s)");
    }
}

export async function getGroupMembers(req, res) {
    const {groupId} = req.params;

    try {
        let response = {};
        for (const grupo of groupToArray(groupId)) {
            response = await req.client.getGroupMembers(grupo);

        }
        return res.status(200).json({status: "Success", response: response});
    } catch (e) {
        Logger.error(e);
        return res.status(400).json("Error on get group members");
    }

}

export async function addParticipant(req, res) {
    const {groupId, phone} = req.body;

    let response = {};
    let arrayGrupos = [];

    try {
        for (const grupo of groupToArray(groupId)) {
            response = await req.client.addParticipant(grupo, contactToArray(phone));
            arrayGrupos.push(response);
        }

        return res.status(200).json({
            status: "Success",
            message: "Participant(s) added successfully",
            participants: phone,
            groups: arrayGrupos
        });
    } catch (e) {
        Logger.error(e);
        return res.status(400).json("Error adding participant(s)");
    }
}

export async function removeParticipant(req, res) {
    const {groupId, phone} = req.body;

    let response = {};
    let arrayGrupos = [];

    try {
        for (const grupo of groupToArray(groupId)) {
            response = await req.client.removeParticipant(grupo, contactToArray(phone));
            arrayGrupos.push(response);
        }

        return res.status(200).json({
            status: "Success",
            message: "Participant(s) removed successfully",
            participants: phone,
            groups: arrayGrupos
        });
    } catch (e) {
        Logger.error(e);
        return res.status(400).json("Error removing participant(s)");
    }
}

export async function promoteParticipant(req, res) {
    const {groupId, phone} = req.body;

    let response = {};
    let arrayGrupos = [];

    try {
        for (const grupo of groupToArray(groupId)) {
            response = await req.client.promoteParticipant(grupo, contactToArray(phone));
            arrayGrupos.push(grupo);
        }

        return res.status(200).json({
            status: "Success",
            message: "Successful promoted participant(s)",
            participants: phone,
            groups: arrayGrupos
        });
    } catch (e) {
        Logger.error(e);
        return res.status(400).json("Error promoting participant(s)");
    }
}

export async function demoteParticipant(req, res) {
    const {groupId, phone} = req.body;

    let response = {};
    let arrayGrupos = [];

    try {
        for (const grupo of groupToArray(groupId)) {
            response = await req.client.demoteParticipant(grupo, contactToArray(phone));
            arrayGrupos.push(grupo);
        }

        return res.status(200).json({
            status: "Success",
            message: "Admin of participant(s) revoked successfully",
            participants: phone,
            groups: arrayGrupos
        });
    } catch (e) {
        Logger.error(e);
        return res.status(400).json("Error revoking participant's admin(s)");
    }
}

export async function getGroupAdmins(req, res) {
    const {groupId} = req.params;

    let response = {};
    let arrayGrupos = [];

    try {
        for (const grupo of groupToArray(groupId)) {
            response = await req.client.getGroupAdmins(grupo);

            arrayGrupos.push({
                id: grupo,
                admin: response.user,
            });
        }

        const grouped = _.groupBy(arrayGrupos, grupo => grupo.id);
        return res.status(200).json({
            status: "Success",
            participants: grouped,
            groups: arrayGrupos
        });
    } catch (e) {
        Logger.error(e);
        return res.status(400).json("Error retrieving group admin(s)");
    }
}

export async function getGroupInviteLink(req, res) {
    const {groupId} = req.params;

    let response = {};

    try {
        for (const grupo of groupToArray(groupId)) {
            response = await req.client.getGroupInviteLink(grupo);
        }

        return res.status(200).json({
            status: "Success",
            response: response
        });
    } catch (e) {
        Logger.error(e);
        return res.status(400).json("Error on get group invite link");
    }
}

export async function getAllBroadcastList(req, res) {
    try {

        let response = await req.client.getAllBroadcastList();
        return res.status(200).json({status: "success", response: response});
    } catch (e) {
        Logger.error(e);
        return res.status(400).json("Error on get all broad cast list");
    }
}

export async function getGroupInfoFromInviteLink(req, res) {
    try {
        const {invitecode} = req.body;
        let response = await req.client.getGroupInfoFromInviteLink(invitecode);
        return res.status(200).json({status: "success", response: response});
    } catch (e) {
        Logger.error(e);
        return res.status(400).json("Error on get group info from invite link");
    }
}

export async function getGroupMembersIds(req, res) {
    const {groupId} = req.params;
    let response = {};
    try {

        for (const grupo of groupToArray(groupId)) {
            response = await req.client.getGroupMembersIds(grupo);
        }
        return res.status(200).json({status: "success", response: response});

    } catch (e) {
        Logger.error(e);
        return res.status(400).json("Error on get group members ids");
    }
}

export async function setGroupDescription(req, res) {
    const {groupId, description} = req.body;

    let response = {};

    try {
        for (const grupo of groupToArray(groupId)) {
            response = await req.client.setGroupDescription(grupo, description);
        }

        return res.status(200).json({status: "success", response: response});
    } catch (e) {
        Logger.error(e);
        return res.status(400).json("Error on set group description");
    }
}

export async function setGroupProperty(req, res) {
    const {groupId, property, value = true} = req.body;

    let response = {};

    try {
        for (const grupo of groupToArray(groupId)) {
            response = await req.client.setGroupProperty(grupo, property, value);
        }

        return res.status(200).json({status: "success", response: response});
    } catch (e) {
        Logger.error(e);
        return res.status(400).json("Error on set group property");
    }
}

export async function setGroupSubject(req, res) {
    const {groupId, title} = req.body;

    let response = {};

    try {
        for (const grupo of groupToArray(groupId)) {
            response = await req.client.setGroupSubject(grupo, title);
        }

        return res.status(200).json({status: "success", response: response});
    } catch (e) {
        Logger.error(e);
        return res.status(400).json("Error on set group subject");
    }
}

export async function setMessagesAdminsOnly(req, res) {
    const {groupId, value = true} = req.body;

    let response = {};

    try {
        for (const grupo of groupToArray(groupId)) {
            response = await req.client.setMessagesAdminsOnly(grupo, value);
        }

        return res.status(200).json({status: "success", response: response});
    } catch (e) {
        Logger.error(e);
        return res.status(400).json("Error on set messages admins only");
    }
}