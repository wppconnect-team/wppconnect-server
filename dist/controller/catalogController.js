"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.addProduct = addProduct;exports.addProductImage = addProductImage;exports.changeProductImage = changeProductImage;exports.createCollection = createCollection;exports.delProducts = delProducts;exports.deleteCollection = deleteCollection;exports.editCollection = editCollection;exports.editProduct = editProduct;exports.getCollections = getCollections;exports.getProductById = getProductById;exports.getProducts = getProducts;exports.removeProductImage = removeProductImage;exports.sendLinkCatalog = sendLinkCatalog;exports.setProductVisibility = setProductVisibility;exports.updateCartEnabled = updateCartEnabled;
















var _functions = require("../util/functions"); /*
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
 */async function getProducts(req, res) {/**
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
   */const { phone, qnt } = req.query;if (!phone) return res.status(401).send({ message: 'Please send the contact number you wish to return the products.' });try {const result = await req.client?.getProducts(phone, qnt
    );
    res.status(201).json({ status: 'success', response: result });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: 'Error on get products',
      error: error
    });
  }
}

async function getProductById(req, res) {
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
  return res.status(401).send({
    message: 'Please send the contact number and productId.'
  });

  try {
    const result = await req.client.getProductById(
      phone,
      id
    );
    res.status(201).json({ status: 'success', response: result });
  } catch (error) {
    res.
    status(500).
    json({ status: 'Error', message: 'Error on get product', error: error });
  }
}
async function editProduct(req, res) {
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
  return res.status(401).send({
    message: 'productId or options was not informed'
  });

  try {
    const result = await req.client.editProduct(id, options);
    res.status(201).json({ status: 'success', response: result });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: 'Error on edit product.',
      error: error
    });
  }
}

async function delProducts(req, res) {
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
  return res.status(401).send({
    message: 'products Id was not informed'
  });

  try {
    const result = await req.client.delProducts(id);
    res.status(201).json({ status: 'success', response: result });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: 'Error on delete product.',
      error: error
    });
  }
}

async function changeProductImage(req, res) {
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
  return res.status(401).send({
    message: 'productId and base64 was not informed'
  });

  try {
    const result = await req.client.changeProductImage(id, base64);
    res.status(201).json({ status: 'success', response: result });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: 'Error on change product image.',
      error: error
    });
  }
}

async function addProduct(req, res) {
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
    currency = 'BRL'
  } = req.body;
  if (!name || !image || !price)
  return res.status(401).send({
    message: 'name, price and image was not informed'
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
      error: error
    });
  }
}

async function addProductImage(req, res) {
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
  return res.status(401).send({
    message: 'productId and base64 was not informed'
  });

  try {
    const result = await req.client.addProductImage(id, base64);
    res.status(201).json({ status: 'success', response: result });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: 'Error on add product image.',
      error: error
    });
  }
}

async function removeProductImage(req, res) {
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
  return res.status(401).send({
    message: 'productId and index image was not informed'
  });

  try {
    const result = await req.client.removeProductImage(id, index);
    res.status(201).json({ status: 'success', response: result });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: 'Error on remove product image.',
      error: error
    });
  }
}

async function getCollections(req, res) {
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
  return res.status(401).send({
    message: 'phone was not informed'
  });

  try {
    const result = await req.client.getCollections(
      phone,
      qnt,
      max
    );
    res.status(201).json({ status: 'success', response: result });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: 'Error on get collections.',
      error: error
    });
  }
}

async function createCollection(req, res) {
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
  return res.status(401).send({
    message: 'name or products was not informed'
  });

  try {
    const result = await req.client.createCollection(name, products);
    res.status(201).json({ status: 'success', response: result });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: 'Error on create collection.',
      error: error
    });
  }
}

async function editCollection(req, res) {
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
  return res.status(401).send({
    message: 'id or options was not informed'
  });

  try {
    const result = await req.client.editCollection(id, options);
    res.status(201).json({ status: 'success', response: result });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: 'Error on edit collection.',
      error: error
    });
  }
}

async function deleteCollection(req, res) {
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
  return res.status(401).send({
    message: 'id was not informed'
  });

  try {
    const result = await req.client.deleteCollection(id);
    res.status(201).json({ status: 'success', response: result });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: 'Error on delete collection.',
      error: error
    });
  }
}

async function setProductVisibility(req, res) {
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
  return res.status(401).send({
    message: 'product id or value (false, true) was not informed'
  });

  try {
    const result = await req.client.setProductVisibility(id, value);
    res.status(201).json({ status: 'success', response: result });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: 'Error on set product visibility.',
      error: error
    });
  }
}

async function updateCartEnabled(req, res) {
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
  return res.status(401).send({
    message: 'enabled (false, true) was not informed'
  });

  try {
    const result = await req.client.updateCartEnabled(enabled);
    res.status(201).json({ status: 'success', response: result });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: 'Error on set enabled cart.',
      error: error
    });
  }
}

async function sendLinkCatalog(req, res) {
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
  return res.status(401).send({
    message: 'phones was not informed'
  });
  const results = [];
  try {
    const session = await req.client.getWid();
    const catalogLink = (0, _functions.createCatalogLink)(session);
    for (const phone of phones) {
      const result = await req.client.sendText(
        phone,
        `${message} ${catalogLink}`,
        {
          useTemplateButtons: true,
          buttons: [
          {
            url: catalogLink,
            text: 'Abrir catálogo'
          }]

        }
      );
      results.push({ phone, status: result.id });
    }
    return res.status(200).json({ status: 'success', response: results });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: 'Error on set enabled cart.',
      error: error
    });
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfZnVuY3Rpb25zIiwicmVxdWlyZSIsImdldFByb2R1Y3RzIiwicmVxIiwicmVzIiwicGhvbmUiLCJxbnQiLCJxdWVyeSIsInN0YXR1cyIsInNlbmQiLCJtZXNzYWdlIiwicmVzdWx0IiwiY2xpZW50IiwianNvbiIsInJlc3BvbnNlIiwiZXJyb3IiLCJnZXRQcm9kdWN0QnlJZCIsImlkIiwiZWRpdFByb2R1Y3QiLCJvcHRpb25zIiwiYm9keSIsImRlbFByb2R1Y3RzIiwiY2hhbmdlUHJvZHVjdEltYWdlIiwiYmFzZTY0IiwiYWRkUHJvZHVjdCIsIm5hbWUiLCJpbWFnZSIsImRlc2NyaXB0aW9uIiwicHJpY2UiLCJ1cmwiLCJyZXRhaWxlcklkIiwiY3VycmVuY3kiLCJjcmVhdGVQcm9kdWN0IiwiY29uc29sZSIsImxvZyIsImFkZFByb2R1Y3RJbWFnZSIsInJlbW92ZVByb2R1Y3RJbWFnZSIsImluZGV4IiwiZ2V0Q29sbGVjdGlvbnMiLCJtYXgiLCJjcmVhdGVDb2xsZWN0aW9uIiwicHJvZHVjdHMiLCJlZGl0Q29sbGVjdGlvbiIsImRlbGV0ZUNvbGxlY3Rpb24iLCJzZXRQcm9kdWN0VmlzaWJpbGl0eSIsInZhbHVlIiwidXBkYXRlQ2FydEVuYWJsZWQiLCJlbmFibGVkIiwic2VuZExpbmtDYXRhbG9nIiwicGhvbmVzIiwicmVzdWx0cyIsInNlc3Npb24iLCJnZXRXaWQiLCJjYXRhbG9nTGluayIsImNyZWF0ZUNhdGFsb2dMaW5rIiwic2VuZFRleHQiLCJ1c2VUZW1wbGF0ZUJ1dHRvbnMiLCJidXR0b25zIiwidGV4dCIsInB1c2giXSwic291cmNlcyI6WyIuLi8uLi9zcmMvY29udHJvbGxlci9jYXRhbG9nQ29udHJvbGxlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKlxyXG4gKiBDb3B5cmlnaHQgMjAyMSBXUFBDb25uZWN0IFRlYW1cclxuICpcclxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcclxuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxyXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcclxuICpcclxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxyXG4gKlxyXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXHJcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcclxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXHJcbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcclxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXHJcbiAqL1xyXG5pbXBvcnQgeyBSZXF1ZXN0LCBSZXNwb25zZSB9IGZyb20gJ2V4cHJlc3MnO1xyXG5cclxuaW1wb3J0IHsgY3JlYXRlQ2F0YWxvZ0xpbmsgfSBmcm9tICcuLi91dGlsL2Z1bmN0aW9ucyc7XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0UHJvZHVjdHMocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICogI3N3YWdnZXIudGFncyA9IFtcIkNhdGFsb2cgJiBCdXNzaW5lc3NcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJwaG9uZVwiXSA9IHtcclxuICAgICAgaW46ICdxdWVyeScsXHJcbiAgICAgIHNjaGVtYTogJzU1MjE5OTk5OTk5OTknLFxyXG4gICAgIH1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wicW50XCJdID0ge1xyXG4gICAgICBpbjogJ3F1ZXJ5JyxcclxuICAgICAgc2NoZW1hOiAnMTAnLFxyXG4gICAgIH1cclxuICAgKi9cclxuICBjb25zdCB7IHBob25lLCBxbnQgfSA9IHJlcS5xdWVyeTtcclxuICBpZiAoIXBob25lKVxyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAxKS5zZW5kKHtcclxuICAgICAgbWVzc2FnZTpcclxuICAgICAgICAnUGxlYXNlIHNlbmQgdGhlIGNvbnRhY3QgbnVtYmVyIHlvdSB3aXNoIHRvIHJldHVybiB0aGUgcHJvZHVjdHMuJyxcclxuICAgIH0pO1xyXG5cclxuICB0cnkge1xyXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVxLmNsaWVudD8uZ2V0UHJvZHVjdHMoXHJcbiAgICAgIHBob25lIGFzIHN0cmluZyxcclxuICAgICAgcW50IGFzIHVua25vd24gYXMgbnVtYmVyXHJcbiAgICApO1xyXG4gICAgcmVzLnN0YXR1cygyMDEpLmpzb24oeyBzdGF0dXM6ICdzdWNjZXNzJywgcmVzcG9uc2U6IHJlc3VsdCB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdGF0dXM6ICdFcnJvcicsXHJcbiAgICAgIG1lc3NhZ2U6ICdFcnJvciBvbiBnZXQgcHJvZHVjdHMnLFxyXG4gICAgICBlcnJvcjogZXJyb3IsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRQcm9kdWN0QnlJZChyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgKiAjc3dhZ2dlci50YWdzID0gW1wiQ2F0YWxvZyAmIEJ1c3NpbmVzc1wiXVxyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInBob25lXCJdID0ge1xyXG4gICAgICBpbjogJ3F1ZXJ5JyxcclxuICAgICAgc2NoZW1hOiAnNTUyMTk5OTk5OTk5OScsXHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJpZFwiXSA9IHtcclxuICAgICAgaW46ICdxdWVyeScsXHJcbiAgICAgIHNjaGVtYTogJzEwJyxcclxuICAgICB9XHJcbiAgICovXHJcbiAgY29uc3QgeyBwaG9uZSwgaWQgfSA9IHJlcS5xdWVyeTtcclxuICBpZiAoIXBob25lIHx8ICFpZClcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDQwMSkuc2VuZCh7XHJcbiAgICAgIG1lc3NhZ2U6ICdQbGVhc2Ugc2VuZCB0aGUgY29udGFjdCBudW1iZXIgYW5kIHByb2R1Y3RJZC4nLFxyXG4gICAgfSk7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByZXEuY2xpZW50LmdldFByb2R1Y3RCeUlkKFxyXG4gICAgICBwaG9uZSBhcyBzdHJpbmcsXHJcbiAgICAgIGlkIGFzIHN0cmluZ1xyXG4gICAgKTtcclxuICAgIHJlcy5zdGF0dXMoMjAxKS5qc29uKHsgc3RhdHVzOiAnc3VjY2VzcycsIHJlc3BvbnNlOiByZXN1bHQgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIHJlc1xyXG4gICAgICAuc3RhdHVzKDUwMClcclxuICAgICAgLmpzb24oeyBzdGF0dXM6ICdFcnJvcicsIG1lc3NhZ2U6ICdFcnJvciBvbiBnZXQgcHJvZHVjdCcsIGVycm9yOiBlcnJvciB9KTtcclxuICB9XHJcbn1cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGVkaXRQcm9kdWN0KHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAqICNzd2FnZ2VyLnRhZ3MgPSBbXCJDYXRhbG9nICYgQnVzc2luZXNzXCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgICNzd2FnZ2VyLnJlcXVlc3RCb2R5ID0ge1xyXG4gICAgICAgIHJlcXVpcmVkOiB0cnVlLFxyXG4gICAgICAgIFwiQGNvbnRlbnRcIjoge1xyXG4gICAgICAgICAgICBcImFwcGxpY2F0aW9uL2pzb25cIjoge1xyXG4gICAgICAgICAgICAgICAgc2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiB7IHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9uczogeyB0eXBlOiBcIm9iamVjdFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGV4YW1wbGVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJEZWZhdWx0XCI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogJzxwcm9kdWN0X2lkPicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ05ldyBuYW1lIGZvciBwcm9kdWN0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgaWQsIG9wdGlvbnMgfSA9IHJlcS5ib2R5O1xyXG4gIGlmICghaWQgfHwgIW9wdGlvbnMpXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDEpLnNlbmQoe1xyXG4gICAgICBtZXNzYWdlOiAncHJvZHVjdElkIG9yIG9wdGlvbnMgd2FzIG5vdCBpbmZvcm1lZCcsXHJcbiAgICB9KTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlcS5jbGllbnQuZWRpdFByb2R1Y3QoaWQsIG9wdGlvbnMpO1xyXG4gICAgcmVzLnN0YXR1cygyMDEpLmpzb24oeyBzdGF0dXM6ICdzdWNjZXNzJywgcmVzcG9uc2U6IHJlc3VsdCB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdGF0dXM6ICdFcnJvcicsXHJcbiAgICAgIG1lc3NhZ2U6ICdFcnJvciBvbiBlZGl0IHByb2R1Y3QuJyxcclxuICAgICAgZXJyb3I6IGVycm9yLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGVsUHJvZHVjdHMocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICogI3N3YWdnZXIudGFncyA9IFtcIkNhdGFsb2cgJiBCdXNzaW5lc3NcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnJlcXVlc3RCb2R5ID0ge1xyXG4gICAgICAgIHJlcXVpcmVkOiB0cnVlLFxyXG4gICAgICAgIFwiQGNvbnRlbnRcIjoge1xyXG4gICAgICAgICAgICBcImFwcGxpY2F0aW9uL2pzb25cIjoge1xyXG4gICAgICAgICAgICAgICAgc2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiB7IHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgZXhhbXBsZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICBcIkRlZmF1bHRcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiAnPHByb2R1Y3RfaWQ+JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICovXHJcbiAgY29uc3QgeyBpZCB9ID0gcmVxLmJvZHk7XHJcbiAgaWYgKCFpZClcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDQwMSkuc2VuZCh7XHJcbiAgICAgIG1lc3NhZ2U6ICdwcm9kdWN0cyBJZCB3YXMgbm90IGluZm9ybWVkJyxcclxuICAgIH0pO1xyXG5cclxuICB0cnkge1xyXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVxLmNsaWVudC5kZWxQcm9kdWN0cyhpZCk7XHJcbiAgICByZXMuc3RhdHVzKDIwMSkuanNvbih7IHN0YXR1czogJ3N1Y2Nlc3MnLCByZXNwb25zZTogcmVzdWx0IH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN0YXR1czogJ0Vycm9yJyxcclxuICAgICAgbWVzc2FnZTogJ0Vycm9yIG9uIGRlbGV0ZSBwcm9kdWN0LicsXHJcbiAgICAgIGVycm9yOiBlcnJvcixcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNoYW5nZVByb2R1Y3RJbWFnZShyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgKiAjc3dhZ2dlci50YWdzID0gW1wiQ2F0YWxvZyAmIEJ1c3NpbmVzc1wiXVxyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICAgXHJcbiAgICAgI3N3YWdnZXIucmVxdWVzdEJvZHkgPSB7XHJcbiAgICAgICAgcmVxdWlyZWQ6IHRydWUsXHJcbiAgICAgICAgXCJAY29udGVudFwiOiB7XHJcbiAgICAgICAgICAgIFwiYXBwbGljYXRpb24vanNvblwiOiB7XHJcbiAgICAgICAgICAgICAgICBzY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHsgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBiYXNlNjQ6IHsgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBleGFtcGxlczoge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiRGVmYXVsdFwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6ICc8cHJvZHVjdF9pZD4nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGJhc2U2NDogJzxiYXNlNjRfc3RyaW5nPidcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICovXHJcbiAgY29uc3QgeyBpZCwgYmFzZTY0IH0gPSByZXEuYm9keTtcclxuICBpZiAoIWlkIHx8ICFiYXNlNjQpXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDEpLnNlbmQoe1xyXG4gICAgICBtZXNzYWdlOiAncHJvZHVjdElkIGFuZCBiYXNlNjQgd2FzIG5vdCBpbmZvcm1lZCcsXHJcbiAgICB9KTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlcS5jbGllbnQuY2hhbmdlUHJvZHVjdEltYWdlKGlkLCBiYXNlNjQpO1xyXG4gICAgcmVzLnN0YXR1cygyMDEpLmpzb24oeyBzdGF0dXM6ICdzdWNjZXNzJywgcmVzcG9uc2U6IHJlc3VsdCB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdGF0dXM6ICdFcnJvcicsXHJcbiAgICAgIG1lc3NhZ2U6ICdFcnJvciBvbiBjaGFuZ2UgcHJvZHVjdCBpbWFnZS4nLFxyXG4gICAgICBlcnJvcjogZXJyb3IsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhZGRQcm9kdWN0KHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAqICNzd2FnZ2VyLnRhZ3MgPSBbXCJDYXRhbG9nICYgQnVzc2luZXNzXCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgICAjc3dhZ2dlci5yZXF1ZXN0Qm9keSA9IHtcclxuICAgICAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgICAgICBcIkBjb250ZW50XCI6IHtcclxuICAgICAgICAgICAgXCJhcHBsaWNhdGlvbi9qc29uXCI6IHtcclxuICAgICAgICAgICAgICAgIHNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB7IHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW1hZ2U6IHsgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogeyB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByaWNlOiB7IHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiB7IHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0YWlsZXJJZDogeyB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbmN5OiB7IHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgZXhhbXBsZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICBcIkRlZmF1bHRcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6ICdQcm9kdWN0IG5hbWUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGltYWdlOiAnPGJhc2U2NF9zdHJpbmc+JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0Rlc2NyaXB0aW9uIGZvciB5b3VyIHByb2R1Y3QnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHByaWNlOiAnODg5MCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiAnaHR0cDovL2xpbmtfZm9yX3lvdXJfcHJvZHVjdC5jb20nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldGFpbGVySWQ6ICdTS1UwMDEnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbmN5OiAnQlJMJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICovXHJcbiAgY29uc3Qge1xyXG4gICAgbmFtZSxcclxuICAgIGltYWdlLFxyXG4gICAgZGVzY3JpcHRpb24sXHJcbiAgICBwcmljZSxcclxuICAgIHVybCxcclxuICAgIHJldGFpbGVySWQsXHJcbiAgICBjdXJyZW5jeSA9ICdCUkwnLFxyXG4gIH0gPSByZXEuYm9keTtcclxuICBpZiAoIW5hbWUgfHwgIWltYWdlIHx8ICFwcmljZSlcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDQwMSkuc2VuZCh7XHJcbiAgICAgIG1lc3NhZ2U6ICduYW1lLCBwcmljZSBhbmQgaW1hZ2Ugd2FzIG5vdCBpbmZvcm1lZCcsXHJcbiAgICB9KTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlcS5jbGllbnQuY3JlYXRlUHJvZHVjdChcclxuICAgICAgbmFtZSxcclxuICAgICAgaW1hZ2UsXHJcbiAgICAgIGRlc2NyaXB0aW9uLFxyXG4gICAgICBwcmljZSxcclxuICAgICAgZmFsc2UsXHJcbiAgICAgIHVybCxcclxuICAgICAgcmV0YWlsZXJJZCxcclxuICAgICAgY3VycmVuY3lcclxuICAgICk7XHJcbiAgICByZXMuc3RhdHVzKDIwMSkuanNvbih7IHN0YXR1czogJ3N1Y2Nlc3MnLCByZXNwb25zZTogcmVzdWx0IH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmxvZyhlcnJvcik7XHJcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN0YXR1czogJ0Vycm9yJyxcclxuICAgICAgbWVzc2FnZTogJ0Vycm9yIG9uIGFkZCBwcm9kdWN0LicsXHJcbiAgICAgIGVycm9yOiBlcnJvcixcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGFkZFByb2R1Y3RJbWFnZShyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgKiAjc3dhZ2dlci50YWdzID0gW1wiQ2F0YWxvZyAmIEJ1c3NpbmVzc1wiXVxyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICAgI3N3YWdnZXIucmVxdWVzdEJvZHkgPSB7XHJcbiAgICAgICAgcmVxdWlyZWQ6IHRydWUsXHJcbiAgICAgICAgXCJAY29udGVudFwiOiB7XHJcbiAgICAgICAgICAgIFwiYXBwbGljYXRpb24vanNvblwiOiB7XHJcbiAgICAgICAgICAgICAgICBzY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHsgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBiYXNlNjQ6IHsgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBleGFtcGxlczoge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiRGVmYXVsdFwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6ICc8cHJvZHVjdF9pZD4nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGJhc2U2NDogJzxiYXNlNjRfc3RyaW5nPidcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICovXHJcbiAgY29uc3QgeyBpZCwgYmFzZTY0IH0gPSByZXEuYm9keTtcclxuICBpZiAoIWlkIHx8ICFiYXNlNjQpXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDEpLnNlbmQoe1xyXG4gICAgICBtZXNzYWdlOiAncHJvZHVjdElkIGFuZCBiYXNlNjQgd2FzIG5vdCBpbmZvcm1lZCcsXHJcbiAgICB9KTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlcS5jbGllbnQuYWRkUHJvZHVjdEltYWdlKGlkLCBiYXNlNjQpO1xyXG4gICAgcmVzLnN0YXR1cygyMDEpLmpzb24oeyBzdGF0dXM6ICdzdWNjZXNzJywgcmVzcG9uc2U6IHJlc3VsdCB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdGF0dXM6ICdFcnJvcicsXHJcbiAgICAgIG1lc3NhZ2U6ICdFcnJvciBvbiBhZGQgcHJvZHVjdCBpbWFnZS4nLFxyXG4gICAgICBlcnJvcjogZXJyb3IsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW1vdmVQcm9kdWN0SW1hZ2UocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICogI3N3YWdnZXIudGFncyA9IFtcIkNhdGFsb2cgJiBCdXNzaW5lc3NcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnJlcXVlc3RCb2R5ID0ge1xyXG4gICAgICAgIHJlcXVpcmVkOiB0cnVlLFxyXG4gICAgICAgIFwiQGNvbnRlbnRcIjoge1xyXG4gICAgICAgICAgICBcImFwcGxpY2F0aW9uL2pzb25cIjoge1xyXG4gICAgICAgICAgICAgICAgc2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiB7IHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXg6IHsgdHlwZTogXCJudW1iZXJcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBleGFtcGxlczoge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiRGVmYXVsdFwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6ICc8cHJvZHVjdF9pZD4nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4OiAxXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgaWQsIGluZGV4IH0gPSByZXEuYm9keTtcclxuICBpZiAoIWlkIHx8ICFpbmRleClcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDQwMSkuc2VuZCh7XHJcbiAgICAgIG1lc3NhZ2U6ICdwcm9kdWN0SWQgYW5kIGluZGV4IGltYWdlIHdhcyBub3QgaW5mb3JtZWQnLFxyXG4gICAgfSk7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByZXEuY2xpZW50LnJlbW92ZVByb2R1Y3RJbWFnZShpZCwgaW5kZXgpO1xyXG4gICAgcmVzLnN0YXR1cygyMDEpLmpzb24oeyBzdGF0dXM6ICdzdWNjZXNzJywgcmVzcG9uc2U6IHJlc3VsdCB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdGF0dXM6ICdFcnJvcicsXHJcbiAgICAgIG1lc3NhZ2U6ICdFcnJvciBvbiByZW1vdmUgcHJvZHVjdCBpbWFnZS4nLFxyXG4gICAgICBlcnJvcjogZXJyb3IsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRDb2xsZWN0aW9ucyhyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgKiAjc3dhZ2dlci50YWdzID0gW1wiQ2F0YWxvZyAmIEJ1c3NpbmVzc1wiXVxyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInBob25lXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICc1NTIxOTk5OTk5OTk5J1xyXG4gICAgIH1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wicW50XCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICcxMCdcclxuICAgICB9XHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcIm1heFwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnMTAnXHJcbiAgICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgcGhvbmUsIHFudCwgbWF4IH0gPSByZXEucXVlcnk7XHJcbiAgaWYgKCFwaG9uZSlcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDQwMSkuc2VuZCh7XHJcbiAgICAgIG1lc3NhZ2U6ICdwaG9uZSB3YXMgbm90IGluZm9ybWVkJyxcclxuICAgIH0pO1xyXG5cclxuICB0cnkge1xyXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVxLmNsaWVudC5nZXRDb2xsZWN0aW9ucyhcclxuICAgICAgcGhvbmUgYXMgc3RyaW5nLFxyXG4gICAgICBxbnQgYXMgc3RyaW5nLFxyXG4gICAgICBtYXggYXMgc3RyaW5nXHJcbiAgICApO1xyXG4gICAgcmVzLnN0YXR1cygyMDEpLmpzb24oeyBzdGF0dXM6ICdzdWNjZXNzJywgcmVzcG9uc2U6IHJlc3VsdCB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdGF0dXM6ICdFcnJvcicsXHJcbiAgICAgIG1lc3NhZ2U6ICdFcnJvciBvbiBnZXQgY29sbGVjdGlvbnMuJyxcclxuICAgICAgZXJyb3I6IGVycm9yLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY3JlYXRlQ29sbGVjdGlvbihyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgKiAjc3dhZ2dlci50YWdzID0gW1wiQ2F0YWxvZyAmIEJ1c3NpbmVzc1wiXVxyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICAgI3N3YWdnZXIucmVxdWVzdEJvZHkgPSB7XHJcbiAgICAgICAgcmVxdWlyZWQ6IHRydWUsXHJcbiAgICAgICAgXCJAY29udGVudFwiOiB7XHJcbiAgICAgICAgICAgIFwiYXBwbGljYXRpb24vanNvblwiOiB7XHJcbiAgICAgICAgICAgICAgICBzY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogeyB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2R1Y3RzOiB7IHR5cGU6IFwiYXJyYXlcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBleGFtcGxlczoge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiRGVmYXVsdFwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ0NvbGxlY3Rpb24gbmFtZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZHVjdHM6IFsnPGlkX3Byb2R1Y3QxPicsICc8aWRfcHJvZHVjdDI+J10sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgbmFtZSwgcHJvZHVjdHMgfSA9IHJlcS5ib2R5O1xyXG4gIGlmICghbmFtZSB8fCAhcHJvZHVjdHMpXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDEpLnNlbmQoe1xyXG4gICAgICBtZXNzYWdlOiAnbmFtZSBvciBwcm9kdWN0cyB3YXMgbm90IGluZm9ybWVkJyxcclxuICAgIH0pO1xyXG5cclxuICB0cnkge1xyXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVxLmNsaWVudC5jcmVhdGVDb2xsZWN0aW9uKG5hbWUsIHByb2R1Y3RzKTtcclxuICAgIHJlcy5zdGF0dXMoMjAxKS5qc29uKHsgc3RhdHVzOiAnc3VjY2VzcycsIHJlc3BvbnNlOiByZXN1bHQgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiAnRXJyb3InLFxyXG4gICAgICBtZXNzYWdlOiAnRXJyb3Igb24gY3JlYXRlIGNvbGxlY3Rpb24uJyxcclxuICAgICAgZXJyb3I6IGVycm9yLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZWRpdENvbGxlY3Rpb24ocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICogI3N3YWdnZXIudGFncyA9IFtcIkNhdGFsb2cgJiBCdXNzaW5lc3NcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnJlcXVlc3RCb2R5ID0ge1xyXG4gICAgICAgIHJlcXVpcmVkOiB0cnVlLFxyXG4gICAgICAgIFwiQGNvbnRlbnRcIjoge1xyXG4gICAgICAgICAgICBcImFwcGxpY2F0aW9uL2pzb25cIjoge1xyXG4gICAgICAgICAgICAgICAgc2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiB7IHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvZHVjdHM6IHsgdHlwZTogXCJhcnJheVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGV4YW1wbGVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJEZWZhdWx0XCI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogJzxwcm9kdWN0X2lkPicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ05ldyBuYW1lIGZvciBjb2xsZWN0aW9uJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgaWQsIG9wdGlvbnMgfSA9IHJlcS5ib2R5O1xyXG4gIGlmICghaWQgfHwgIW9wdGlvbnMpXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDEpLnNlbmQoe1xyXG4gICAgICBtZXNzYWdlOiAnaWQgb3Igb3B0aW9ucyB3YXMgbm90IGluZm9ybWVkJyxcclxuICAgIH0pO1xyXG5cclxuICB0cnkge1xyXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVxLmNsaWVudC5lZGl0Q29sbGVjdGlvbihpZCwgb3B0aW9ucyk7XHJcbiAgICByZXMuc3RhdHVzKDIwMSkuanNvbih7IHN0YXR1czogJ3N1Y2Nlc3MnLCByZXNwb25zZTogcmVzdWx0IH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN0YXR1czogJ0Vycm9yJyxcclxuICAgICAgbWVzc2FnZTogJ0Vycm9yIG9uIGVkaXQgY29sbGVjdGlvbi4nLFxyXG4gICAgICBlcnJvcjogZXJyb3IsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkZWxldGVDb2xsZWN0aW9uKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAqICNzd2FnZ2VyLnRhZ3MgPSBbXCJDYXRhbG9nICYgQnVzc2luZXNzXCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgICAjc3dhZ2dlci5yZXF1ZXN0Qm9keSA9IHtcclxuICAgICAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgICAgICBcIkBjb250ZW50XCI6IHtcclxuICAgICAgICAgICAgXCJhcHBsaWNhdGlvbi9qc29uXCI6IHtcclxuICAgICAgICAgICAgICAgIHNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogeyB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGV4YW1wbGVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJEZWZhdWx0XCI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogJzxwcm9kdWN0X2lkPicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgaWQgfSA9IHJlcS5ib2R5O1xyXG4gIGlmICghaWQpXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDEpLnNlbmQoe1xyXG4gICAgICBtZXNzYWdlOiAnaWQgd2FzIG5vdCBpbmZvcm1lZCcsXHJcbiAgICB9KTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlcS5jbGllbnQuZGVsZXRlQ29sbGVjdGlvbihpZCk7XHJcbiAgICByZXMuc3RhdHVzKDIwMSkuanNvbih7IHN0YXR1czogJ3N1Y2Nlc3MnLCByZXNwb25zZTogcmVzdWx0IH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN0YXR1czogJ0Vycm9yJyxcclxuICAgICAgbWVzc2FnZTogJ0Vycm9yIG9uIGRlbGV0ZSBjb2xsZWN0aW9uLicsXHJcbiAgICAgIGVycm9yOiBlcnJvcixcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNldFByb2R1Y3RWaXNpYmlsaXR5KHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAqICNzd2FnZ2VyLnRhZ3MgPSBbXCJDYXRhbG9nICYgQnVzc2luZXNzXCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wib2JqXCJdID0ge1xyXG4gICAgICBpbjogJ2JvZHknLFxyXG4gICAgICBzY2hlbWE6IHtcclxuICAgICAgICAkaWQ6ICc8aWRfcHJvZHVjdD4nLFxyXG4gICAgICAgICR2YWx1ZTogZmFsc2UsXHJcbiAgICAgIH1cclxuICAgICB9XHJcbiAgICAgI3N3YWdnZXIucmVxdWVzdEJvZHkgPSB7XHJcbiAgICAgICAgcmVxdWlyZWQ6IHRydWUsXHJcbiAgICAgICAgXCJAY29udGVudFwiOiB7XHJcbiAgICAgICAgICAgIFwiYXBwbGljYXRpb24vanNvblwiOiB7XHJcbiAgICAgICAgICAgICAgICBzY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHsgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogeyB0eXBlOiBcImJvb2xlYW5cIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBleGFtcGxlczoge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiRGVmYXVsdFwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6ICc8cHJvZHVjdF9pZD4nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICovXHJcbiAgY29uc3QgeyBpZCwgdmFsdWUgfSA9IHJlcS5ib2R5O1xyXG4gIGlmICghaWQgfHwgIXZhbHVlKVxyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAxKS5zZW5kKHtcclxuICAgICAgbWVzc2FnZTogJ3Byb2R1Y3QgaWQgb3IgdmFsdWUgKGZhbHNlLCB0cnVlKSB3YXMgbm90IGluZm9ybWVkJyxcclxuICAgIH0pO1xyXG5cclxuICB0cnkge1xyXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVxLmNsaWVudC5zZXRQcm9kdWN0VmlzaWJpbGl0eShpZCwgdmFsdWUpO1xyXG4gICAgcmVzLnN0YXR1cygyMDEpLmpzb24oeyBzdGF0dXM6ICdzdWNjZXNzJywgcmVzcG9uc2U6IHJlc3VsdCB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdGF0dXM6ICdFcnJvcicsXHJcbiAgICAgIG1lc3NhZ2U6ICdFcnJvciBvbiBzZXQgcHJvZHVjdCB2aXNpYmlsaXR5LicsXHJcbiAgICAgIGVycm9yOiBlcnJvcixcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHVwZGF0ZUNhcnRFbmFibGVkKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAqICNzd2FnZ2VyLnRhZ3MgPSBbXCJDYXRhbG9nICYgQnVzc2luZXNzXCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgICAgI3N3YWdnZXIucmVxdWVzdEJvZHkgPSB7XHJcbiAgICAgICAgcmVxdWlyZWQ6IHRydWUsXHJcbiAgICAgICAgXCJAY29udGVudFwiOiB7XHJcbiAgICAgICAgICAgIFwiYXBwbGljYXRpb24vanNvblwiOiB7XHJcbiAgICAgICAgICAgICAgICBzY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogeyB0eXBlOiBcImJvb2xlYW5cIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBleGFtcGxlczoge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiRGVmYXVsdFwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICovXHJcbiAgY29uc3QgeyBlbmFibGVkIH0gPSByZXEuYm9keTtcclxuICBpZiAoIWVuYWJsZWQpXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDEpLnNlbmQoe1xyXG4gICAgICBtZXNzYWdlOiAnZW5hYmxlZCAoZmFsc2UsIHRydWUpIHdhcyBub3QgaW5mb3JtZWQnLFxyXG4gICAgfSk7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByZXEuY2xpZW50LnVwZGF0ZUNhcnRFbmFibGVkKGVuYWJsZWQpO1xyXG4gICAgcmVzLnN0YXR1cygyMDEpLmpzb24oeyBzdGF0dXM6ICdzdWNjZXNzJywgcmVzcG9uc2U6IHJlc3VsdCB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdGF0dXM6ICdFcnJvcicsXHJcbiAgICAgIG1lc3NhZ2U6ICdFcnJvciBvbiBzZXQgZW5hYmxlZCBjYXJ0LicsXHJcbiAgICAgIGVycm9yOiBlcnJvcixcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNlbmRMaW5rQ2F0YWxvZyhyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgKiAjc3dhZ2dlci50YWdzID0gW1wiTWVzc2FnZXNcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAgICAjc3dhZ2dlci5yZXF1ZXN0Qm9keSA9IHtcclxuICAgICAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgICAgICBcIkBjb250ZW50XCI6IHtcclxuICAgICAgICAgICAgXCJhcHBsaWNhdGlvbi9qc29uXCI6IHtcclxuICAgICAgICAgICAgICAgIHNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgcGhvbmVzOiB7IHR5cGU6IFwiYXJyYXlcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogeyB0eXBlOiBcInN0cmluZ1wiIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgZXhhbXBsZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICBcIkRlZmF1bHRcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHBob25lczogWyc8YXJyYXlfcGhvbmVfaWQnXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnTWVzc2FnZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgcGhvbmVzLCBtZXNzYWdlIH0gPSByZXEuYm9keTtcclxuICBpZiAoIXBob25lcylcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDQwMSkuc2VuZCh7XHJcbiAgICAgIG1lc3NhZ2U6ICdwaG9uZXMgd2FzIG5vdCBpbmZvcm1lZCcsXHJcbiAgICB9KTtcclxuICBjb25zdCByZXN1bHRzID0gW107XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHNlc3Npb24gPSBhd2FpdCByZXEuY2xpZW50LmdldFdpZCgpO1xyXG4gICAgY29uc3QgY2F0YWxvZ0xpbmsgPSBjcmVhdGVDYXRhbG9nTGluayhzZXNzaW9uKTtcclxuICAgIGZvciAoY29uc3QgcGhvbmUgb2YgcGhvbmVzKSB7XHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlcS5jbGllbnQuc2VuZFRleHQoXHJcbiAgICAgICAgcGhvbmUsXHJcbiAgICAgICAgYCR7bWVzc2FnZX0gJHtjYXRhbG9nTGlua31gLFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIHVzZVRlbXBsYXRlQnV0dG9uczogdHJ1ZSxcclxuICAgICAgICAgIGJ1dHRvbnM6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHVybDogY2F0YWxvZ0xpbmssXHJcbiAgICAgICAgICAgICAgdGV4dDogJ0FicmlyIGNhdMOhbG9nbycsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgIH1cclxuICAgICAgKTtcclxuICAgICAgKHJlc3VsdHMgYXMgYW55KS5wdXNoKHsgcGhvbmUsIHN0YXR1czogcmVzdWx0LmlkIH0pO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHsgc3RhdHVzOiAnc3VjY2VzcycsIHJlc3BvbnNlOiByZXN1bHRzIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN0YXR1czogJ0Vycm9yJyxcclxuICAgICAgbWVzc2FnZTogJ0Vycm9yIG9uIHNldCBlbmFibGVkIGNhcnQuJyxcclxuICAgICAgZXJyb3I6IGVycm9yLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpQkEsSUFBQUEsVUFBQSxHQUFBQyxPQUFBLHNCQUFzRCxDQWpCdEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBS08sZUFBZUMsV0FBV0EsQ0FBQ0MsR0FBWSxFQUFFQyxHQUFhLEVBQUUsQ0FDN0Q7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQ0UsTUFBTSxFQUFFQyxLQUFLLEVBQUVDLEdBQUcsQ0FBQyxDQUFDLEdBQUdILEdBQUcsQ0FBQ0ksS0FBSyxDQUNoQyxJQUFJLENBQUNGLEtBQUssRUFDUixPQUFPRCxHQUFHLENBQUNJLE1BQU0sQ0FBQyxHQUFHLENBQUMs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