'use strict';
const EventEmitter = require('events').EventEmitter;

/**
 * Extendemos de la clase EventEmitter para crear nuestra clase client
 * @class
 * @extends EventEmitter
 */
class LDJClient extends EventEmitter{
    /**
     * @constructor
     * @param {buffer} stream
     */
    constructor(stream){
        super();
        let buffer ='';
        stream.on('data', data => {
            buffer += data;
            let boundary = buffer.indexOf('\n');
            while(boundary !== -1){
                const input = buffer.substring(0, boundary);
                buffer = buffer.substring(boundary + 1);
                this.emit('message', JSON.parse(input));
                boundary = buffer.indexOf('\n');
            }
        });
    }


    static connect(stream){
        return new LDJClient(stream);
    }
}

module.exports = LDJClient;