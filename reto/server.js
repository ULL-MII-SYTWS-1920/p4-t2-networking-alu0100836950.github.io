var socketio = require('socket.io');

//listen on port 3636
var io = socketio.listen(3636);

io.sockets.on('connection', function(socket){

    //broadcast
    socket.on('send', function(data){
        io.sockets.emit('message', data);
    });
});