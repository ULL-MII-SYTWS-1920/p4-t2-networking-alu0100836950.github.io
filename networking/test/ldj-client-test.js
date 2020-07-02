'use strict';

const assert = require('assert');
const chai_assert = require('chai').assert;

const EventEmitter = require('events').EventEmitter;
const LDJClient = require('../lib/ldj-client.js');


/**
 * Creamos nuestro describe en donde añadiremos las pruebas a realizar
 @function
 @name function
 */
describe('LDJClient', () => {
    let stream = null;
    let client = null;

    beforeEach(() => {
        stream = new EventEmitter();
        client = new LDJClient(stream);
    });


    it('should emit a message event from a single data event', done => {
        client.on('message', message => {
            assert.deepEqual(message, {foo: 'bar'});
            done();
        });
        stream.emit('data', '{"foo":"bar"}\n');

    });

    it('should emit a message event from split data events', done => {
        client.on('message', message => {
            assert.deepEqual(message, {foo: 'bar'});
            done();
        });
        stream.emit('data', '{"foo":');
        process.nextTick(() => stream.emit('data', '"bar"}\n'));
    });

    
    it('Le esta enviando un NULL', done =>{
        stream = null;
        chai_assert.Throw(() => {new LDJClient(stream)}, Error);
        done();
    });
});