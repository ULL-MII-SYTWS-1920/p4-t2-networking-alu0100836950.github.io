const io = require('socket.io').listen(3636)




io.on('connection', client => {
    console.log('hola!')
})
