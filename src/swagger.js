const swaggerAutogen = require('swagger-autogen')({ openapi: '3.0.0' });

const outputFile = './src/swagger.json';
const endpointsFiles = ['./src/routes/index.ts'];

const doc = {
  openapi: '3.0.0',
  info: {
    title: 'WPPConnect API REST',
    version: '2.0.0',
    description: 'Documentation generated through Swagger to be able to test the functions via REST API of WPP Connect',
  },
  servers: [
    {
      url: 'http://localhost:21465/',
    },
  ],
  components: {
    securitySchemes: {
      httpBearer: {
        type: 'http',
        scheme: 'bearer',
      },
    },
  },
  security: [
    {
      httpBearer: [],
    },
  ],
  tags: [
    {
      name: 'Auth',
      description: 'Methods for authentication',
    },
    {
      name: 'Chat',
      description: 'Chat Methods',
    },
    {
      name: 'Send Message',
    },
    {
      name: 'Profile',
      description: 'Profile Methods',
    },
    {
      name: 'Status Stories',
      description: 'Status Stories Methods',
    },
    {
      name: 'Labels',
      description: 'Labels Methods',
    },
    {
      name: 'Contact',
      description: 'Contact Methods',
    },
    {
      name: 'Group',
    },
    {
      name: 'Phone Status',
    },
    {
      name: 'Blocklist',
    },
    {
      name: 'System',
    },
    {
      name: 'Catalog & Products',
    },
  ],
};

swaggerAutogen(outputFile, endpointsFiles, doc);
