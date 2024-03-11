import axios from 'axios';
import { Request, Response } from 'express';
import * as fs from 'fs';
import * as correios from 'node-cep-correios';

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
      .get(
        'https://www.cepaberto.com/api/v3/cep?cep=' +
          req.params.cep.replace('-', ''),
        {
          timeout: 5000,
          headers: {
            Authorization: 'Token token=a30562962004d94271044de19730a8be',
          },
        }
      )
      .then((axiosReq) => {
        const result = axiosReq.data;

        const info = {
          cep: result.cep,
          logradouro: result.logradouro,
          bairro: result.bairro,
          localidade: result.cidade.nome,
          uf: result.estado.sigla,
          ibge: result.cidade.ibge,
          ddd: result.cidade.ddd,
          lat: result.latitude,
          lon: result.longitude,
        };

        const data = JSON.stringify(info);
        fs.writeFileSync(req.params.cep.replace('-', '') + '.json', data);
        res.send(info);
      })
      .catch(() => {
        correios.consultaCEP({ cep: req.params.cep }).then((resultCorreio) => {
          const info = {
            cep: resultCorreio.cep,
            logradouro: resultCorreio.address,
            bairro: resultCorreio.district,
            localidade: resultCorreio.city,
            uf: resultCorreio.state,
            ibge: resultCorreio.city_ibge,
            ddd: resultCorreio.ddd,
            lat: resultCorreio.lat,
            lon: resultCorreio.lng,
          };
          const data = JSON.stringify(info);
          fs.writeFileSync(req.params.cep.replace('-', '') + '.json', data);
          res.send(info);
        });
      });
  }
}
