const express = require('express')
const fs = require('fs');
const cors = require('cors')
const bodyParser = require("body-parser");
const uuid = require("uuid");

const app = express()
const PORT = 9999;
const HOST = '0.0.0.0';

const integrationResourcesBasePath = './data/integration_resources';
const integrationResourcesFullPath = integrationResourcesBasePath + '/integration-resources.json';
const subscriptionsBasePath = './data/subscriptions';
const subscriptionsFullPath = subscriptionsBasePath + '/subscriptions.json';
const thirdPartySystemsBasePath = './data/third_party_systems';
const thirdPartySystemsFullPath = thirdPartySystemsBasePath + '/third_party_systems.json';
const partnersBasePath = './data/partners';
const partnersFullPath = partnersBasePath + '/partners.json';
const productsBasePath = './data/products';
const productsFullPath = productsBasePath + '/products.json';
const partnersSystemsFullPath = partnersBasePath + '/partner-systems.json';
const partnersRolesFullPath = partnersBasePath + '/partner-roles.json';
const tokenBasePath = './data/token';
const tokenFullPath = tokenBasePath + '/token.json';

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// app.post('/', (request, response) => {
//   response.send('Hello from Express!')
// })

/*******************************************************************************
 *	Endpoints for products
 ******************************************************************************/
app.post('/login', (request, response) => {
  let loginData = loadJSONData('./data/user/login.json');
  return response.send(loginData);
})

app.post('/login/register', (request, response) => {
  
  return response.send(request.body);
})

app.get('/users/:userid/subscriptions', (request, response) => {
  let subscriptions = loadJSONData('./data/user/subscriptions.json');
  return response.send(subscriptions);
})

app.get('/user-entities/:entityid', (request, response) => {
  let entities = loadJSONData('./data/user-entity/entities.json');
  let index = entities.findIndex(entity => entity.id === request.params.entityid);

   response.send(entities[index]);
})


/*******************************************************************************
 *	Helper functions
 ******************************************************************************/

loadJSONData = function(path) {
  let rawdata = fs.readFileSync(path);
  return JSON.parse(rawdata);
}

loadDataFromFile = function(path, response) {
  let jsonData = loadJSONData(path);

  response.header("Content-Type", "application/json");
  return response.send(jsonData);
}

app.listen(PORT, HOST, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`Running on http://${HOST}:${PORT}`)
})

