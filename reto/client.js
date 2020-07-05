var readline = require('readline'),
socketio = require('socket.io-client'),
util = require('util'),
color = require("ansi-color").set;
 
 
var nick;
var socket = socketio.connect('http://localhost:3636', { reconnect: 3636 });
var rl = readline.createInterface(process.stdin, process.stdout);
//console.log(socket);

/**
 * @function
 * @name console_out
 * @param {string} msg 
 * @description Creamos esta funcion porque Readline no funciona bien con el metodo prompt y se le pasa la salida a esta funcion.
 */
function console_out(msg) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    console.log(msg);
    rl.prompt(true);
}

/**
 * @function
 * @name chat_command
 * @description Analizamos la entrada de los usuarios si es un comando
 * especial
 * @param {string} cmd Comando
 * @param {string} arg Argumento del comando
 */
function chat_command(cmd, arg) {
    switch (cmd) {
 
        case 'nick':
            var notice = nick + " changed their name to " + arg;
            nick = arg;
            socket.emit('send', { type: 'notice', message: notice });
            break;
 
        case 'msg':
            var to = arg.match(/[a-z]+\b/)[0];
            var message = arg.substr(to.length, arg.length);
            socket.emit('send', { type: 'tell', message: message, to: to, from: nick });
            break;
 
        case 'me':
            var emote = nick + " " + arg;
            socket.emit('send', { type: 'emote', message: emote });
            break;
 
        default:
            console_out("That is not a valid command.");
 
    }
}

/**
 * @function
 * @name question
 * @description Pedimos al usuario un nickname, creamos un mensaje de respuesta y lo enviamos
 * a los demás usuarios conectados a traves de nuestro socket.emit
 * @param {string} text
 * @param {function} function 
 */
rl.question("Please enter a nickname: ", function(name) {
    nick = name;
    var msg = nick + " has joined the chat";
    socket.emit('send', { type: 'notice', message: msg });
    rl.prompt(true);
});


/**
 * @function
 * @name on_line
 * @description Leemos la entrada del cliente conectado
 * @param {string} line
 * @param {function} function
 */
rl.on('line', function (line) {
    if (line[0] == "/" && line.length > 1) {
        var cmd = line.match(/[a-z]+\b/)[0];
        var arg = line.substr(cmd.length+2, line.length);
        chat_command(cmd, arg);
 
    } else {
        // send chat message
        socket.emit('send', { type: 'chat', message: line, nick: nick });
        rl.prompt(true);
    }
});

/**
 * @function
 * @description Con esta funcion formateamos la salida del mensaje dependiendo de que tipo sea
 * @param {string} message Obtenemos el mensaje
 * @param {function} function Leemos el dato
 */

socket.on('message', function (data) {
    console.log(data.type);
    var leader;
    if (data.type == 'chat' && data.nick != nick) {
        leader = color("<"+data.nick+"> ", "green");
        console_out(leader + data.message);
    }
    else if (data.type == "notice") {
        
        console_out(color(data.message, 'cyan'));
    }
    else if (data.type == "tell" && data.to == nick) {
        leader = color("["+data.from+"->"+data.to+"]", "red");
        console_out(leader + data.message);
    }
    else if (data.type == "emote") {
        console_out(color(data.message, "cyan"));
    }
});