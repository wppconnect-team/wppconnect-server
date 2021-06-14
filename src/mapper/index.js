import mapper from 'json-mapper-json';

export async function convert(data) {
  try {
    const { default: mappConf } = await import(`./${data.event}.json`);
    if (!mappConf) return data;
    return await mapper(data, mappConf);
  } catch (e) {
    return data;
  }
}
