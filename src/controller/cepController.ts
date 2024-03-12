import axios from 'axios';
import { Request, Response } from 'express';
import * as fs from 'fs';

export async function getPostalCode(req: Request, res: Response) {
  const result = await axios.get(
    `https://geocoder.ca/${req.params.code}?json=1`
  );
  console.log(result.data);
  const info = {
    cep: result.data.postal,
    localidade: result.data.standard.city,
    uf: result.data.standard.prov,
    lat: result.data.latt,
    lon: result.data.longt,
  };
  res.send(info);
}

export async function getCep(req: Request, res: Response) {
  if (fs.existsSync(req.params.cep.replace('-', '') + '.json')) {
    fs.readFile(req.params.cep.replace('-', '') + '.json', (err, data: any) => {
      const info = JSON.parse(data);
      res.send(info);
    });
  } else {
    axios
      .get(`https://cep.awesomeapi.com.br/json/${req.params.cep}`, {
        timeout: 5000,
      })
      .then((axiosReq) => {
        const result = axiosReq.data;

        const info = {
          cep: result.cep,
          logradouro: result.address,
          bairro: result.district,
          localidade: result.city,
          uf: result.state,
          ibge: result.city_ibge,
          ddd: result.ddd,
          lat: result.lat,
          lon: result.lng,
        };

        const data = JSON.stringify(info);
        fs.writeFileSync(req.params.cep.replace('-', '') + '.json', data);
        res.send(info);
      })
      .catch(() => {
        res.sendStatus(404);
      });
  }
}
