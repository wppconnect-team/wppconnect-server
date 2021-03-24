export let clientsArray = [];
export let sessions = [];

export const getSession = (session) => {
    return session.split(":")[0]
}