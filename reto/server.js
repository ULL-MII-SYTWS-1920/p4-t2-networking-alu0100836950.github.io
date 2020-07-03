var socketio = require('socket.io');
 

/**
 * Creamos una variable socket que esuchara por el puerto 3636
 * @var {socketio} io
 */
var io = socketio.listen(3636);


/**
 * Creamos la coneccion
 * @function
 * @name .on_connect
 * @param {string} connection
 * @param {function} function
 */
io.on('connection', function (socket) {
    console.log('Socket succesfully connected with id: '+socket.id);

    /**
     * Transmitimos el mensaje de un usuario conectado y lo enviaremos a todos los usuarios conectados
     * @function
     * @name .on_send
     * @param {string} send
     * @param {function} function
     */
    socket.on('send', function (data) {
        console.log(data.msg);
        io.sockets.emit('message', data);
    });
 
});


/**************************************************** */
