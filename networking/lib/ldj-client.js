'use strict';
const EventEmitter = require('events').EventEmitter;
const devnull = require('dev-null');

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

        if (!(stream))
            throw new Error('null initialized error!')
        super();
        let buffer ='';
        stream.on('data', data => {
            buffer += data;
            let boundary = buffer.indexOf('\n');
            while(boundary !== -1){
                const input = buffer.substring(0, boundary);
                buffer = buffer.substring(boundary + 1);
                
                try {
                    let msg = JSON.parse(input)
                    this.emit('message', msg);
                    
                } catch(e) {
                    let msg = JSON.parse('{"type":"error","timestamp":0}\n');
                    this.emit('message', msg);
                }

                boundary = buffer.indexOf('\n');
            }
        });

        stream.on('end', () => {
            console.log(buffer += '\n')
            this.emit('message', JSON.parse(buffer))
        })
    }


    static connect(stream){
        return new LDJClient(stream);
    }
}

module.exports = LDJClient;