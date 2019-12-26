'use strict';

// módulos necesarios
const fs = require('fs');
const net = require('net');
const filename = process.argv[2];

// comprobamos que el archivo se pas epor argumento sino
// creamos un error personalizado
if(!filename){
    throw Error('Error: No filename specified');
}

net.createServer(connection => {
    //reporting
    console.log('Subscriber connected');
    connection.write(`Now watching "${filename}" for changes...\n`);

    //watcher setup
    const watcher = fs.watch(filename,() => connection.write(`File changed: ${new Date()}\n`));

    //Cleanup
    connection.on('close', () =>{
        console.log('Subscriber disconnected');
        watcher.close();
    });
}).listen('/tmp/watcher.sock', () => console.log('Listening fro subscribers...'));


