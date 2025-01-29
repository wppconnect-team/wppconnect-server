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
import { Request, Response } from 'express';

import { createCatalogLink } from '../util/functions';

export async function getProducts(req: Request, res: Response) {
  /**
   * #swagger.tags = ["Catalog & Bussiness"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.parameters["phone"] = {
      in: 'query',
      schema: '5521999999999',
     }
     #swagger.parameters["qnt"] = {
      in: 'query',
      schema: '10',
     }
   */
  const { phone, qnt } = req.query;
  if (!phone)
    res.status(401).send({
      message:
        'Please send the contact number you wish to return the products.',
    });

  try {
    const result = await req.client?.getProducts(
      phone as string,
      qnt as unknown as number
    );
    res.status(201).json({ status: 'success', response: result });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: 'Error on get products',
      error: error,
    });
  }
}

export async function getProductById(req: Request, res: Response) {
  /**
   * #swagger.tags = ["Catalog & Bussiness"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.parameters["phone"] = {
      in: 'query',
      schema: '5521999999999',
     }
     #swagger.parameters["id"] = {
      in: 'query',
      schema: '10',
     }
   */
  const { phone, id } = req.query;
  if (!phone || !id)
    res.status(401).send({
      message: 'Please send the contact number and productId.',
    });

  try {
    const result = await req.client.getProductById(
      phone as string,
      id as string
    );
    res.status(201).json({ status: 'success', response: result });
  } catch (error) {
    res
      .status(500)
      .json({ status: 'Error', message: 'Error on get product', error: error });
  }
}
export async function editProduct(req: Request, res: Response) {
  /**
   * #swagger.tags = ["Catalog & Bussiness"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
    #swagger.requestBody = {
        required: true,
        "@content": {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        options: { type: "object" },
                    }
                },
                examples: {
                    "Default": {
                        value: {
                          id: '<product_id>',
                          options: {
                            name: 'New name for product',
                          }
                        }
                    },
                }
            }
        }
    }
   */
  const { id, options } = req.body;
  if (!id || !options)
    res.status(401).send({
      message: 'productId or options was not informed',
    });

  try {
    const result = await req.client.editProduct(id, options);
    res.status(201).json({ status: 'success', response: result });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: 'Error on edit product.',
      error: error,
    });
  }
}

export async function delProducts(req: Request, res: Response) {
  /**
   * #swagger.tags = ["Catalog & Bussiness"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.requestBody = {
        required: true,
        "@content": {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                    }
                },
                examples: {
                    "Default": {
                        value: {
                          id: '<product_id>',
                        }
                    },
                }
            }
        }
    }
   */
  const { id } = req.body;
  if (!id)
    res.status(401).send({
      message: 'products Id was not informed',
    });

  try {
    const result = await req.client.delProducts(id);
    res.status(201).json({ status: 'success', response: result });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: 'Error on delete product.',
      error: error,
    });
  }
}

export async function changeProductImage(req: Request, res: Response) {
  /**
   * #swagger.tags = ["Catalog & Bussiness"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     
     #swagger.requestBody = {
        required: true,
        "@content": {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        base64: { type: "string" },
                    }
                },
                examples: {
                    "Default": {
                        value: {
                          id: '<product_id>',
                          base64: '<base64_string>'
                        }
                    },
                }
            }
        }
    }
   */
  const { id, base64 } = req.body;
  if (!id || !base64)
    res.status(401).send({
      message: 'productId and base64 was not informed',
    });

  try {
    const result = await req.client.changeProductImage(id, base64);
    res.status(201).json({ status: 'success', response: result });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: 'Error on change product image.',
      error: error,
    });
  }
}

export async function addProduct(req: Request, res: Response) {
  /**
   * #swagger.tags = ["Catalog & Bussiness"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.requestBody = {
        required: true,
        "@content": {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        image: { type: "string" },
                        description: { type: "string" },
                        price: { type: "string" },
                        url: { type: "string" },
                        retailerId: { type: "string" },
                        currency: { type: "string" },
                    }
                },
                examples: {
                    "Default": {
                        value: {
                          name: 'Product name',
                          image: '<base64_string>',
                          description: 'Description for your product',
                          price: '8890',
                          url: 'http://link_for_your_product.com',
                          retailerId: 'SKU001',
                          currency: 'BRL',
                        }
                    },
                }
            }
        }
    }
   */
  const {
    name,
    image,
    description,
    price,
    url,
    retailerId,
    currency = 'BRL',
  } = req.body;
  if (!name || !image || !price)
    res.status(401).send({
      message: 'name, price and image was not informed',
    });

  try {
    const result = await req.client.createProduct(
      name,
      image,
      description,
      price,
      false,
      url,
      retailerId,
      currency
    );
    res.status(201).json({ status: 'success', response: result });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: 'Error',
      message: 'Error on add product.',
      error: error,
    });
  }
}

export async function addProductImage(req: Request, res: Response) {
  /**
   * #swagger.tags = ["Catalog & Bussiness"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.requestBody = {
        required: true,
        "@content": {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        base64: { type: "string" },
                    }
                },
                examples: {
                    "Default": {
                        value: {
                          id: '<product_id>',
                          base64: '<base64_string>'
                        }
                    },
                }
            }
        }
    }
   */
  const { id, base64 } = req.body;
  if (!id || !base64)
    res.status(401).send({
      message: 'productId and base64 was not informed',
    });

  try {
    const result = await req.client.addProductImage(id, base64);
    res.status(201).json({ status: 'success', response: result });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: 'Error on add product image.',
      error: error,
    });
  }
}

export async function removeProductImage(req: Request, res: Response) {
  /**
   * #swagger.tags = ["Catalog & Bussiness"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.requestBody = {
        required: true,
        "@content": {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        index: { type: "number" },
                    }
                },
                examples: {
                    "Default": {
                        value: {
                          id: '<product_id>',
                          index: 1
                        }
                    },
                }
            }
        }
    }
   */
  const { id, index } = req.body;
  if (!id || !index)
    res.status(401).send({
      message: 'productId and index image was not informed',
    });

  try {
    const result = await req.client.removeProductImage(id, index);
    res.status(201).json({ status: 'success', response: result });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: 'Error on remove product image.',
      error: error,
    });
  }
}

export async function getCollections(req: Request, res: Response) {
  /**
   * #swagger.tags = ["Catalog & Bussiness"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.parameters["phone"] = {
      schema: '5521999999999'
     }
     #swagger.parameters["qnt"] = {
      schema: '10'
     }
     #swagger.parameters["max"] = {
      schema: '10'
     }
   */
  const { phone, qnt, max } = req.query;
  if (!phone)
    res.status(401).send({
      message: 'phone was not informed',
    });

  try {
    const result = await req.client.getCollections(
      phone as string,
      qnt as string,
      max as string
    );
    res.status(201).json({ status: 'success', response: result });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: 'Error on get collections.',
      error: error,
    });
  }
}

export async function createCollection(req: Request, res: Response) {
  /**
   * #swagger.tags = ["Catalog & Bussiness"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.requestBody = {
        required: true,
        "@content": {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        products: { type: "array" },
                    }
                },
                examples: {
                    "Default": {
                        value: {
                          name: 'Collection name',
                          products: ['<id_product1>', '<id_product2>'],
                        }
                    },
                }
            }
        }
    }
   */
  const { name, products } = req.body;
  if (!name || !products)
    res.status(401).send({
      message: 'name or products was not informed',
    });

  try {
    const result = await req.client.createCollection(name, products);
    res.status(201).json({ status: 'success', response: result });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: 'Error on create collection.',
      error: error,
    });
  }
}

export async function editCollection(req: Request, res: Response) {
  /**
   * #swagger.tags = ["Catalog & Bussiness"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.requestBody = {
        required: true,
        "@content": {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        products: { type: "array" },
                    }
                },
                examples: {
                    "Default": {
                        value: {
                          id: '<product_id>',
                          options: {
                            name: 'New name for collection',
                          }
                        }
                    },
                }
            }
        }
    }
   */
  const { id, options } = req.body;
  if (!id || !options)
    res.status(401).send({
      message: 'id or options was not informed',
    });

  try {
    const result = await req.client.editCollection(id, options);
    res.status(201).json({ status: 'success', response: result });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: 'Error on edit collection.',
      error: error,
    });
  }
}

export async function deleteCollection(req: Request, res: Response) {
  /**
   * #swagger.tags = ["Catalog & Bussiness"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.requestBody = {
        required: true,
        "@content": {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                    }
                },
                examples: {
                    "Default": {
                        value: {
                          id: '<product_id>',
                        }
                    },
                }
            }
        }
    }
   */
  const { id } = req.body;
  if (!id)
    res.status(401).send({
      message: 'id was not informed',
    });

  try {
    const result = await req.client.deleteCollection(id);
    res.status(201).json({ status: 'success', response: result });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: 'Error on delete collection.',
      error: error,
    });
  }
}

export async function setProductVisibility(req: Request, res: Response) {
  /**
   * #swagger.tags = ["Catalog & Bussiness"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.parameters["obj"] = {
      in: 'body',
      schema: {
        $id: '<id_product>',
        $value: false,
      }
     }
     #swagger.requestBody = {
        required: true,
        "@content": {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        value: { type: "boolean" },
                    }
                },
                examples: {
                    "Default": {
                        value: {
                          id: '<product_id>',
                          value: false,
                        }
                    },
                }
            }
        }
    }
   */
  const { id, value } = req.body;
  if (!id || !value)
    res.status(401).send({
      message: 'product id or value (false, true) was not informed',
    });

  try {
    const result = await req.client.setProductVisibility(id, value);
    res.status(201).json({ status: 'success', response: result });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: 'Error on set product visibility.',
      error: error,
    });
  }
}

export async function updateCartEnabled(req: Request, res: Response) {
  /**
   * #swagger.tags = ["Catalog & Bussiness"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
      #swagger.requestBody = {
        required: true,
        "@content": {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        enabled: { type: "boolean" },
                    }
                },
                examples: {
                    "Default": {
                        value: {
                          enabled: true,
                        }
                    },
                }
            }
        }
    }
   */
  const { enabled } = req.body;
  if (!enabled)
    res.status(401).send({
      message: 'enabled (false, true) was not informed',
    });

  try {
    const result = await req.client.updateCartEnabled(enabled);
    res.status(201).json({ status: 'success', response: result });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: 'Error on set enabled cart.',
      error: error,
    });
  }
}

export async function sendLinkCatalog(req: Request, res: Response) {
  /**
   * #swagger.tags = ["Messages"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
      #swagger.requestBody = {
        required: true,
        "@content": {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                      phones: { type: "array" },
                      message: { type: "string" }
                    }
                },
                examples: {
                    "Default": {
                        value: {
                          phones: ['<array_phone_id'],
                          message: 'Message',
                        }
                    },
                }
            }
        }
    }
   */
  const { phones, message } = req.body;
  if (!phones)
    res.status(401).send({
      message: 'phones was not informed',
    });
  const results = [];
  try {
    const session = await req.client.getWid();
    const catalogLink = createCatalogLink(session);
    for (const phone of phones) {
      const result = await req.client.sendText(
        phone,
        `${message} ${catalogLink}`,
        {
          buttons: [
            {
              url: catalogLink,
              text: 'Abrir catálogo',
            },
          ],
        }
      );
      (results as any).push({ phone, status: result.id });
    }
    res.status(200).json({ status: 'success', response: results });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: 'Error on set enabled cart.',
      error: error,
    });
  }
}
