export async function addNewLabel(req, res) {
  const { name, options } = req.body;
  if (!name)
    return res.status(401).send({
      message: 'Name was not informed',
    });

  try {
    const result = await req.client.addNewLabel(name, options);
    res.status(201).json({ status: 'success', response: result });
  } catch (error) {
    res.status(500).json({ status: 'Error', message: 'Erro ao adicionar etiqueta.' });
  }
}

export async function addOrRemoveLabels(req, res) {
  const { chatIds, options } = req.body;
  if (!chatIds || !options)
    return res.status(401).send({
      message: 'chatIds or options was not informed',
    });

  try {
    const result = await req.client.addOrRemoveLabels(chatIds, options);
    res.status(201).json({ status: 'success', response: result });
  } catch (error) {
    res.status(500).json({ status: 'Error', message: 'Erro ao adicionar/deletar etiqueta.' });
  }
}

export async function getAllLabels(req, res) {
  try {
    const result = await req.client.getAllLabels();
    res.status(201).json({ status: 'success', response: result });
  } catch (error) {
    res.status(500).json({ status: 'Error', message: 'Erro ao buscar etiquetas.' });
  }
}

export async function deleteAllLabels(req, res) {
  try {
    const result = await req.client.deleteAllLabels();
    res.status(201).json({ status: 'success', response: result });
  } catch (error) {
    res.status(500).json({ status: 'Error', message: 'Erro ao deletar todas as etiquetas.' });
  }
}

export async function deleteLabel(req, res) {
  const { id } = req.paramns;
  try {
    const result = await req.client.deleteLabel(id);
    res.status(201).json({ status: 'success', response: result });
  } catch (error) {
    res.status(500).json({ status: 'Error', message: 'Erro ao deletar etiqueta.' });
  }
}
