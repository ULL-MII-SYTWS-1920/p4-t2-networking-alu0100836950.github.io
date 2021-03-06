'use strict';
const server = require('net').createServer(connection => {
    console.log('Subscriber connected.');

    //two message chunks together make a whole message
    const firstChunk = '{"type":"changed","timesta';
    const secondChunk = 'mp":1450694370094}\n';
    const thirdChunk = "type changed timestamp 1451450694370094\n";
    const testChunk = '{"type":"changed","timestamp":1451450694370094}\n';
    const caseChunk = '{"type":"changed","timestamp":1451450694370094}';

    const otherChunk = '{"type":"changed","timestamp":1451450694370094}';

    //send the first chung immediately
    //connection.write(firstChunk);

    //after a short delay, send the other chunk
    /*const timer = setTimeout(() => {
        connection.write(secondChunk);
        connection.end();
    }, 100);
    */
    
    //añadido nuevo
    connection.write(caseChunk);
    connection.end();

    
    
    //clear timer when the connection ends
    /*connection.on('end', () => {
        clearTimeout(timer);
        console.log('Subscriber disconnected.');
    });*/

});

server.listen(60300, function(){
    console.log('Test server listening for subscribers...');
});
