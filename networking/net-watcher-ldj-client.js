'use strict';
const netClient = require('net').connect({port: 60300});
const ldjClient = require('./lib/ldj-client.js').connect(netClient);

ldjClient.on('message',message => {

        console.log('mensaje:', message.type)
        if(message.type === 'watching'){
            console.log(`Now watching : ${message.file}`);
        }else if(message.type === 'changed'){
            console.log(`File changed: ${new Date(message.timestamp)}`);
        }else if(message.type === 'error'){
            console.log('No es un fichero JSON');
        }else{
            throw Error(`Unrecognized message type: ${message.type}`);
        }

});