/*
 * Copyright 2021 WPPConnect Team
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Whatsapp } from '@wppconnect-team/wppconnect';
import { EventEmitter } from 'events';

export const chromiumArgs = [
  '--disable-web-security', // Desabilita a segurança da web
  '--no-sandbox', // Desabilita o sandbox
  '--aggressive-cache-discard', // Descarta agressivamente o cache
  '--disable-cache', // Desabilita o cache
  '--disable-application-cache', // Desabilita o cache de aplicativos
  '--disable-offline-load-stale-cache', // Desabilita o carregamento de cache desatualizado offline
  '--disk-cache-size=0', // Define o tamanho do cache em disco como 0
  '--disable-background-networking', // Desabilita as atividades de rede em segundo plano
  '--disable-default-apps', // Desabilita os aplicativos padrão
  '--disable-extensions', // Desabilita as extensões
  '--disable-sync', // Desabilita a sincronização
  '--disable-translate', // Desabilita a tradução
  '--hide-scrollbars', // Esconde as barras de rolagem
  '--metrics-recording-only', // Grava apenas métricas
  '--mute-audio', // Silencia o áudio
  '--no-first-run', // Não faz a primeira execução
  '--safebrowsing-disable-auto-update', // Desabilita a atualização automática do Safe Browsing
  '--ignore-certificate-errors', // Ignora erros de certificado
  '--ignore-ssl-errors', // Ignora erros SSL
  '--ignore-certificate-errors-spki-list' // Ignora erros de certificado na lista SPKI
];
// eslint-disable-next-line prefer-const
export let clientsArray: Whatsapp[] = [];
export const sessions = [];
export const eventEmitter = new EventEmitter();

export function deleteSessionOnArray(session: string): void {
  const newArray = clientsArray;
  delete clientsArray[session];
  clientsArray = newArray;
}
