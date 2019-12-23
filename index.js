'use strict';

const argv = require('yargs')
.usage('Usage: $0 <command> [options]')
.option('orion', {
    alias: 'o',
    describe: "ORION base URL",
    demandOption: true
  })
.option('service', {
    alias: 's',
    describe: "Fiware Service",
    default: ""
  })
.option('servicepath', {
    alias: 'p',
    describe: "Fiware Service Path",
    default: ""
  })
.option('entity', {
    alias: 'e',
    describe: "Entity Id to delete, .* otherwise",
    default: '.*'
  })
.option('type', {
    alias: 't',
    describe: "The type of entities to delete",
    demandOption: true
  })
.option('query', {
    alias: 'q',
    describe: "The query to select the entities to delete",
    default: ''
})
.option('drytest', {
    alias: 'd',
    type: 'boolean',
    describe: "Show the delete operation but don't execute it",
    default: false
  }).help('h')
.alias('h', 'help')
.epilog('copyright 2019')
.argv;

const axios = require('axios');

garbageCollector(argv);

async function garbageCollector(argv) {
    var entities= await selectEntities(argv.orion, argv.service, argv.servicepath, argv.entity, argv.type, argv.query);
    if (entities!=null) {
        if (argv.drytest) {
            showEntities(entities);
        } else {
            var ok=await garbage(argv.orion, argv.service, argv.servicepath,entities);
            if (ok) {
                console.log("Entities deleted");
            }
        }
    }
}

function showEntities(entities) {
    entities.forEach(entity => {
        console.log(entity.type +" "+entity.id);
    });
}

async function garbage(orion, service, servicePath, entities) {
    var query={
        "actionType": "delete",
        "entities": []
    };
    entities.forEach(entity => {
        var elt={
            "id" : entity.id,
            "type": entity.type
        };
        query.entities.push(elt);
    });
    console.log(JSON.stringify(query));
    var request={
        method: 'POST',
        url: orion+"/v2/op/update",
        data: JSON.stringify(query),
        headers: {
            'Content-Type': 'application/json'
        },
        json: true
    };
    if (service!="") request.headers["Fiware-Service"]=service;
    if (servicePath!="") request.headers["Fiware-ServicePath"]=servicePath;
    try {
        var response =await axios.request(request);
        //console.log(new Date().toISOString()+ " Orion response for "+sensor.id+" : "+response.status);
        //console.log(response.data);
        return true;
    } catch(error) {
        console.log(error);
        return false;
    };
}


async function selectEntities(orion, service, servicePath, entity, type, query) {
    // console.log("DEBUG :"+argv.orion+"/v2/entities?options=upsert");
    var orionQuery= "";
    if (entity.search(/\*/)>-1) {
        orionQuery+="idPattern="+encodeURI(entity);
    } else {
        orionQuery+="id="+encodeURI(entity);
    }
    if (type.search(/\*/)>-1) {
        orionQuery+="&typePattern="+encodeURI(type);
    } else {
        orionQuery+="&type="+encodeURI(type);
    }
    if (query!='') orionQuery+="&q="+encodeURI(query);
    console.log("query :  "+orionQuery);
    var request={
        method: 'GET',
        url: orion+"/v2/entities?"+orionQuery,
        headers: {},
        json: true
    };
    if (service!="") request.headers["Fiware-Service"]=service;
    if (servicePath!="") request.headers["Fiware-ServicePath"]=servicePath;

    try {
        var response =await axios.request(request);
        //console.log(new Date().toISOString()+ " Orion response for "+sensor.id+" : "+response.status);
        //console.log(response);
        return response.data;
    } catch(error) {
        console.log(error);
        return null;
    };
}