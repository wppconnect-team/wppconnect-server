import _ from "lodash";
import {contactToArray, groupNameToArray, groupToArray} from "../util/functions";

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
        return res.status(401).send({message: "Informe o Codigo de Convite"});

    try {
        await req.client.joinGroup(inviteCode);

        returnSucess(res, session, inviteCode, "Você entrou no grupo com sucesso");
    } catch (error) {
        returnError(res, session, error, "Você não entrou no grupo.");
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

        const grouped = _.groupBy(infoGroup, grupo => grupo.id);
        return res.status(200).json({
            status: "Success",
            message: "Grupo criado com sucesso",
            group: name,
            groupInfo: grouped
        });
    } catch (e) {
        Logger.error(e);
        return res.status(400).json("Erro ao criar grupo");
    }
}

export async function leaveGroup(req, res) {
    const {groupId} = req.body;

    try {
        for (const grupo of groupToArray(groupId)) {
            await req.client.leaveGroup(`${grupo}@g.us`);
        }

        return res.status(200).json({status: "Success", messages: "Você saiu do grupo com sucesso", group: groupId});
    } catch (e) {
        Logger.error(e);
        return res.status(400).json("Erro ao sair do(s) grupo(s)");
    }
}

export async function getGroupMembers(req, res) {
    const {groupId} = req.body;

    try {
        let groupInfo = [];
        let response = {};
        for (const grupo of groupToArray(groupId)) {
            response = await req.client.getGroupMembers(`${grupo}@g.us`);

            for (const contato of response) {
                groupInfo.push({
                    id: grupo,
                    participants: {
                        phone: contato.id.user,
                        name: contato.name ? contato.name : "",
                        pushname: contato.isBusiness ? contato.verifiedName : contato.pushname,
                        isBusiness: contato.isBusiness
                    }
                });
            }
        }

        const grouped = _.groupBy(groupInfo, grupo => grupo.id);
        return res.status(200).json({"groupInfo": grouped});
    } catch (e) {
        Logger.error(e);
        return res.status(400).json("Erro ao recuperar participantes do(s) grupo(s)");
    }

}

export async function addParticipant(req, res) {
    const {groupId, phone} = req.body;

    let response = {};
    let arrayGrupos = [];

    try {
        for (const grupo of groupToArray(groupId)) {
            response = await req.client.addParticipant(`${grupo}@g.us`, contactToArray(phone));
            arrayGrupos.push(response);
        }

        return res.status(200).json({
            status: "Success",
            message: "Participante(s) adicionado(s) com sucesso",
            participants: phone,
            groups: arrayGrupos
        });
    } catch (e) {
        Logger.error(e);
        return res.status(400).json("Erro ao adicionar participante(s)");
    }
}

export async function removeParticipant(req, res) {
    const {groupId, phone} = req.body;

    let response = {};
    let arrayGrupos = [];

    try {
        for (const grupo of groupToArray(groupId)) {
            response = await req.client.removeParticipant(`${grupo}@g.us`, contactToArray(phone));
            arrayGrupos.push(response);
        }

        return res.status(200).json({
            status: "Success",
            message: "Participante(s) removido(s) com sucesso",
            participants: phone,
            groups: arrayGrupos
        });
    } catch (e) {
        Logger.error(e);
        return res.status(400).json("Erro ao remover participante(s)");
    }
}

export async function promoteParticipant(req, res) {
    const {groupId, phone} = req.body;

    let response = {};
    let arrayGrupos = [];

    try {
        for (const grupo of groupToArray(groupId)) {
            response = await req.client.promoteParticipant(`${grupo}@g.us`, contactToArray(phone));
            arrayGrupos.push(grupo);
        }

        return res.status(200).json({
            status: "Success",
            message: "Participante(s) promovidos(s) com sucesso",
            participants: phone,
            groups: arrayGrupos
        });
    } catch (e) {
        Logger.error(e);
        return res.status(400).json("Erro ao promover participante(s)");
    }
}

export async function demoteParticipant(req, res) {
    const {groupId, phone} = req.body;

    let response = {};
    let arrayGrupos = [];

    try {
        for (const grupo of groupToArray(groupId)) {
            response = await req.client.demoteParticipant(`${grupo}@g.us`, contactToArray(phone));
            arrayGrupos.push(grupo);
        }

        return res.status(200).json({
            status: "Success",
            message: "Admin do(s) participante(s) revogado(s) com sucesso",
            participants: phone,
            groups: arrayGrupos
        });
    } catch (e) {
        Logger.error(e);
        return res.status(400).json("Erro ao revogar admin do(s) participante(s)");
    }
}

export async function getGroupAdmins(req, res) {
    const {groupId} = req.body;

    let response = {};
    let arrayGrupos = [];

    try {
        for (const grupo of groupToArray(groupId)) {
            response = await req.client.getGroupAdmins(`${grupo}@g.us`);

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
        return res.status(400).json("Erro ao recuperar o(s) admin(s) do(s) grupo(s)");
    }
}

export async function getGroupInviteLink(req, res) {
    const {groupId} = req.body;

    let response = {};
    let arrayGrupos = [];

    try {
        for (const grupo of groupToArray(groupId)) {
            response = await req.client.getGroupInviteLink(`${grupo}@g.us`);

            arrayGrupos.push({
                id: grupo,
                link: response
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
        return res.status(400).json("Erro ao recuperar o(s) link(s) do(s) grupo(s)");
    }
}