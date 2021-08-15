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

app.get('/users/:userid/subscriptions', (request, response) => {
  let subscriptions = loadJSONData('./data/user/subscriptions.json');
  return response.send(subscriptions);
})

app.get('/user-entities/:entityid', (request, response) => {
  let entities = loadJSONData('./data/user-entity/entities.json');
  console.error("######### " + request.params.entityid);
  let index = entities.findIndex(entity => entity.id === request.params.entityid);

  console.error('#########: ' + entities[index]);
   response.send(entities[index]);
})

























app.post('/products', (request, response) => {
  let products = loadJSONData(productsFullPath);
  let uniqueProductId = uuid.v4();
    let product = {
      "id": uniqueProductId,
      "name": request.body.name,
      "planningItAppId": request.body.planningItAppId,
      "program": request.body.program,
      "integrationStatus": request.body.integrationStatus,
    }
	products.push(product);
  fs.writeFileSync(productsFullPath, JSON.stringify(products));
  response.send();
});

app.put('/products/:productId', (request, response) => {
  let products = loadJSONData(productsFullPath);
  
  let product2update = products.findIndex(product => product.id == request.params.productId);

  if ('name' in request.body ) {
    products[product2update].name = request.body.name;
  }
  if ('planningItAppId' in request.body) {
    products[product2update].planningItAppId = request.body.planningItAppId;
  }
  if ('program' in request.body) {
    products[product2update].program = request.body.program;
  }
  
  if ('integrationStatus' in request.body) {
    products[product2update].integrationStatus = request.body.integrationStatus;
  }
  
  fs.writeFileSync(productsFullPath, JSON.stringify(products));
  response.send();
})
/*******************************************************************************
 *	Endpoints for integration resources
 ******************************************************************************/
app.get('/integrationResources', (request, response) => {
  return loadDataFromFile(integrationResourcesFullPath, response);
})

app.put('/integrationResources/:integrationResourceId', (request, response) => {
  let integrationResources = loadJSONData(integrationResourcesFullPath);
  
  let ir2update = integrationResources.findIndex(ir => ir.id == request.params.integrationResourceId);

  if ('status' in request.body && request.body.status != integrationResources[ir2update].status) {
    // check if prequisites are met for the activation of an integration resource
    if (request.body.status == 'active' &&
        (integrationResources[ir2update].privacy_grade == null || 
        typeof integrationResources[ir2update].owners == undefined ||
        integrationResources[ir2update].owners.length == 0)) {
          response.statusCode = 409;
          response.send('{"instance" : "Mock Backend", ' +
                        '"detail" : "This integration resource can not be activated.", ' +
                        '"type" : "CONFLICT", ' +
                        '"title" : "Conflict", ' +
                        '"issues": [], ' +
                        '"status" : "409"}');
          return;
        }
    integrationResources[ir2update].status = request.body.status;
  }

  if ('privacy_grade' in request.body && request.body.privacy_grade != integrationResources[ir2update].privacy_grade) {
    integrationResources[ir2update].privacy_grade = request.body.privacy_grade;
    // deactivate integration resource in case prerequisites are not fulfilled anymore
    if (request.body.privacy_grade == null) {
      integrationResources[ir2update].status = 'inactive';
    }
  }
  
  fs.writeFileSync(integrationResourcesFullPath, JSON.stringify(integrationResources));

  response.send();
})

/*******************************************************************************
 *	Endpoints for subscriptions
 ******************************************************************************/
app.get('/subscriptions', (request, response) => {
  return loadDataFromFile(subscriptionsFullPath, response);
})

app.delete('/subscriptions/:subscriptionId', (request, response) => {
  let subscriptions = loadJSONData(subscriptionsFullPath);
  let subscriptionId = request.params.subscriptionId;

  let deletedSubscription = deleteSubscription(subscriptionId);

  return response.send(deletedSubscription);
})

app.delete('/subscriptions', (request, response) => {
  let subscriptions = loadJSONData(subscriptionsFullPath);
  
  subscriptionsToDelete = request.body;
  
  let deletedSubscriptions = []
  for (sub of subscriptionsToDelete) {
	deletedSubscriptions.push(deleteSubscription(sub.id));
  }

  return response.send(deletedSubscriptions);
})

app.post('/subscriptions', (request, response) => {
  let subscriptions = loadJSONData(subscriptionsFullPath);

  let nextId = Math.max.apply(Math, subscriptions.map(function(o) { return o.id; })) + 1;

  for(var i=0; i<request.body.length; i++) {
    let subscription = {
      "userId": nextId,
      "clientId": request.body[i].integrationResourceId,
      "clientRoleId": request.body[i].integrationResourceRoleId,
      "clientRoleName": request.body[i].integrationResourceRoleName,
      "systemId": request.body[i].systemId
    }
    subscriptions.push(subscription);

    nextId++;
  }
  fs.writeFileSync(subscriptionsFullPath, JSON.stringify(subscriptions));
  response.status(201);
  return response.send();
})

/*******************************************************************************
 *	Endpoints for third party systems
 ******************************************************************************/
app.get('/systems', (request, response) => {
  return loadDataFromFile(thirdPartySystemsFullPath, response);
});

app.delete("/systems/:systemId", (request, response) => {
  let systems = loadJSONData(thirdPartySystemsFullPath);
  let updatedSystems;
  let systemToDelete = request.params.systemId;

  updatedSystems = systems.filter(system => system.id != systemToDelete);

  fs.writeFileSync(thirdPartySystemsFullPath, JSON.stringify(updatedSystems));

  response.send();
});

app.post('/systems', (request, response) => {
	let systems = loadJSONData(thirdPartySystemsFullPath);
	
	let nextId = Math.max.apply(Math, systems.map(function(o) {return o.id})) +1;
	
	for(var i=0; i<request.body.length; i++) {
    let system = {
      "id": nextId,
      "name": request.body[i].name,
      "type": request.body[i].type,
      "planningItAppId": request.body[i].planningItAppId,
      "wholesalerOrganizations": request.body[i].wholesalerOrganizations,
	  "additionalInformation": request.body[i].additionalInformation
    }
	systems.push(system);
	
	nextId++;
}

  fs.writeFileSync(thirdPartySystemsFullPath, JSON.stringify(systems));

  response.send();
});

app.put('/systems/:systemId', (request, response) => {
  let systems = loadJSONData(thirdPartySystemsFullPath);
  
  let system2update = systems.findIndex(system => system.id == request.params.systemId);

  if ('type' in request.body ) {
    systems[system2update].type = request.body.type;
  }
  if ('provider' in request.body) {
    systems[system2update].provider = request.body.provider;
  }
  if ('planningItAppId' in request.body) {
    systems[system2update].planningItAppId = request.body.planningItAppId;
  }
  if ('wholesalerOrganizations' in request.body) {
    systems[system2update].wholesalerOrganizations = request.body.wholesalerOrganizations;
  }
  
  fs.writeFileSync(thirdPartySystemsFullPath, JSON.stringify(systems));

  response.send();
})

/*******************************************************************************
 *	Endpoints for partners
 ******************************************************************************/
app.get('/partners', (request, response) => {
  return loadDataFromFile(partnersFullPath, response);
})

/*******************************************************************************
 *	Partner systems
 ******************************************************************************/
app.get('/users/:partnerId/systems', (request, response) => {
  const partnersSystems = loadJSONData(partnersSystemsFullPath);
  const index = partnersSystems.findIndex(partner => partner.id == request.params.partnerId);

  response.header("Content-Type", "application/json");
  return response.send((index < 0 )? partnersSystems[0].systems : partnersSystems[index].systems);  // default: always return something
})

/*******************************************************************************
 *	Partner roles
 ******************************************************************************/
app.get('/partners/:partnerId/roles', (request, response) => {
  const partnersRoles = loadJSONData(partnersRolesFullPath);
  const index = partnersRoles.findIndex(partner => partner.id == request.params.partnerId);

  response.header("Content-Type", "application/json");
  return response.send((index < 0 )? partnersRoles[0].roles : partnersRoles[index].roles);  // default: always return something
})

/*******************************************************************************
 *	Token endpoint
 ******************************************************************************/
app.get('/token', (request, response) => {
  return loadDataFromFile(tokenFullPath, response);
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

deleteSubscription = function(subscriptionId) {
  let subscriptions = loadJSONData(subscriptionsFullPath);
  
  let subscriptionToDelete = subscriptions.find(sub => sub.id === +subscriptionId)
  let index = subscriptions.indexOf(subscriptionToDelete);
	
  if (index > -1) {
    subscriptions.splice(index, 1);
	fs.writeFileSync(subscriptionsFullPath, JSON.stringify(subscriptions));
  }
  
  return subscriptionToDelete;
}
