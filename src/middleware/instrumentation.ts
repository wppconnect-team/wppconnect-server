import { collectDefaultMetrics, Registry } from 'prom-client';

const register = new Registry();
register.setDefaultLabels({
  app: 'wppconnect-server',
});
collectDefaultMetrics({ register });

export const prometheusRegister = register;
