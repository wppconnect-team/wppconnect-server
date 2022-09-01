const colors = require('colors/safe');
const fetch = require("node-fetch");

const wppResponse = async (client) => {
    await client.onMessage(async (message) => {
    console.log(colors.rainbow('========================================================================='))
        
        try {
            
            if(message.content == 'abracadabra') abracadabra(message.from.replace('@c.us',''))
            if(!message.selectedId) return

            const id = message.selectedId.split('-')
            console.log(colors.yellow.bold(id))

      
            const UserNumberSender = message.from.replace('@c.us','')
            console.log(colors.blue.bold(UserNumberSender))
            console.log(colors.red.bold(message.content))
    
            if(id[0] === 'reserve') await queroReservar(UserNumberSender, id[1])
            if(id[0] === 'stop')    await pararReceber(UserNumberSender, id[1])

        } catch (e) {
            console.log(colors.red.bold(`Error: enviar menssagem ao usuario: ${message.from} / ${message.content}`),e)
        }
        

    console.log(colors.rainbow('========================================================================='))
    });
}

/*=====================================================================*/
const queroReservar = async (number,id) => {

    const datas = JSON.stringify({
                                    phone   : number,
                                    message : "🎯que demais! dentro de alguns instantes uma pessoa agente de viagens fará contato com você. obrigado por viajar com o mala.",
                                    isGroup : false
                                })
   const schedule = `{
                       "status": "D"
                     }`

   const scheduleUp = await executeFetch(`schedule/${id}`,schedule,'POST',1).catch(e => false)

   if(scheduleUp.code !== 1 || !scheduleUp) erroMessage(number)
   if(scheduleUp.code !== 1 || !scheduleUp) return

    const res = await executeFetch('send-message',datas,'POST',0)
    console.log(colors.green.bold(res))
}

/*=====================================================================*/
const pararReceber = async (number) => {

    const datas = JSON.stringify({
                                    phone   : number,
                                    message : "ok, tiramos sua viagem de sua rotina de busca 🥹 conte sempre com o mala.",
                                    isGroup : false
                                })
   
    const schedule = `{
                       "status": "D"
                      }`

   const scheduleUp = await executeFetch(`schedule/${id}`,schedule,'POST',1).catch(e => false)

   if(scheduleUp.code !== 1 || !scheduleUp) erroMessage(number)
   if(scheduleUp.code !== 1 || !scheduleUp) return

   const res = await executeFetch('send-message',datas,'POST',0)
   console.log(colors.green.bold(res))
}

/*=====================================================================*/
const erroMessage = async (number) => {

    const datas = JSON.stringify({
                                    phone   : number,
                                    message : "ops, tivemos um imprevisto, nossos agentes de viagens já estão resolvendo 😉",
                                    isGroup : false
                                })
   const res = await executeFetch('send-message',datas,'POST',0)
   console.log(colors.green.bold(res))
}
/*=====================================================================*/
const abracadabra = async (number) => {
    const res = await executeFetch(`/schedule/lessmonth/${number}`,'','',1).catch(e => false)
    if(!res || res.content.length == 0) return
    
    const schedule = await res.content.reduce((prev,e) => {                                                        
        return prev+`{
                       "id": "${e.id}-activate",
                       "text": "ida ${e.data_ida} de ${e.cidade_origem} para ${e.cidade_destino}"
                      },`
    },'')

    const buttonsWpp = JSON.stringify(
        `{
            "phone": "${number}",
            "message": "Selecione suas viagens para reativar envio das cotações",
            "options": {
            "useTemplateButtons": "true",
            "buttons": [
                ${schedule}
            ],
            }
         }`
      )

      await executeFetch('send-buttons',buttonsWpp,'POST',0).catch()
}

/*=====================================================================*/
const executeFetch = async (param, datas = '',method = 'GET',destiny) =>{
  const url = [ 'http://localhost:21465/api/marleiro/',
                'https://api-tw3.omala.com.br/'
              ]
  const token = "$2b$10$7ywdVUXQzgFCNyPtl._nYeAXvFKP1Y1IqfTU0C.69ulkxP.ohNAni"
  const options = {
    method: method,
    headers: {
      'Content-type': 'application/json',
      'Authorization' : `Bearer ${token}`,
    },
  };

  if(method !== 'GET') options.body = datas;

  const req = await fetch(url[destiny]+param, options);
  const json = await req.json();
  return json;
}

module.exports = {
    wppResponse
}