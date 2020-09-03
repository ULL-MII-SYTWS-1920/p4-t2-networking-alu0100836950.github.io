---
layout: post
title:  "Reto p4-t2-networking"
date:   2019-12-30 10:23:59 +0000
categories: update jekyll
---

### Reto para la práctica p4-t2-networking

## Escriba un servidor que permita un chat donde los clientes se conectan via telnet o netcat.

Node.js tiene un módulo en su biblioteca estándar que es muy útil. El módulo **Readline** hace lo siguiente: 

*Lee una línea de entrada desde el terminal.*

Esto se puede usar para hacerle una o dos preguntas al usuario, o para crear un mensaje en la parte inferior de la pantalla.

Para ver un ejemplo de como se va utilizar vamos a ver algo simple como los siguiente:

```
var readline = require('readline');
 
var rl = readline.createInterface(process.stdin, process.stdout);
 
rl.question("What is your name? ", function(answer) {
    console.log("Hello, " + answer );
    rl.close();
});

 ```

Incluimos el módulo, creamos la interfaz **Readline** con los flujos de entrada y salida estándar, luego le hacemos una pregunta única al usuario. 

La otra funcionalidad que proporciona **Readline** es la solicitud, que se puede personalizar a partir de su carácter **" > "** predeterminado y pausarse temporalmente para evitar la entrada. Para nuestro cliente de chat de Readline, esta será nuestra interfaz principal. 

Habrá una sola aparición `readline.question()` para pedirle al usuario un apodo, pero todo lo demás será `readline.prompt()`.


# Instalacion de paquetes y configuracion de nuestro package.json

Primeramente instalamos los paquetes necesarios para realizar el reto:

- socket.io
- socket.io-client
- ansi-color

Por lo que nuestro fichero de paquetes quedaría de la siguiente forma:

```
{
  "name": "p4-t2-networking",
  "version": "1.0.0",
  "description": "[![Build Status](https://travis-ci.org/ULL-MII-SYTWS-1920/p4-t2-networking-alu0100836950.github.io.svg?branch=master)](https://travis-ci.org/ULL-MII-SYTWS-1920/p4-t2-networking-alu0100836950.github.io)",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/ULL-MII-SYTWS-1920/p4-t2-networking-alu0100836950.git"
  },
  "author": "Alberto Martin Nuñez & Alexis Rodriguez Casañas",
  "license": "ISC",
  "bugs": {
    "url": "https://github.com/ULL-MII-SYTWS-1920/p4-t2-networking-alu0100836950/issues"
  },
  "homepage": "https://github.com/ULL-MII-SYTWS-1920/p4-t2-networking-alu0100836950#readme",
  "dependencies": {
    "ansi-color": "^0.2.1",
    "socket.io": "^2.3.0",
    "socket.io-client": "^2.3.0"
  }
}

```

# Comenzando con el servidor

Utilizaremos un socket simple haciendo uso de uno de los paquetes instalados *socket.io*.


{% highlight javascript  %}

var socketio = require('socket.io');

//listen on port 3636
var io = socketio.listen(3636);

io.sockets.on('connection', function(socket){

    //broadcast
    socket.on('send', function(data){
        io.sockets.emit('message', data);
    });
});

{% endhighlight %}

Cogeremos un mensaje que entre de un cliente y se lo pasaremos a todos los demas que esten conectados.

# El cliente: Includes y configuracion

Definiremos nuestras variables y algunas dependencias que vamos a utilizar.

{% highlight javascript  %}

var readline = require('readline');
var socketio = require('socket.io-client');
var util = require('util');
var color = require("ansi-color").set;

var nick;
var socket = socketio.connect('localhost', {port: 3636});
var rl = readline.createInterface(process.stdin, process.stdout);

{% endhighlight %}

Lo que se puede destacar del código anterior es que hemos creado un socket que se conecta a localhost a traves del puerto 3636 y hemos definido la conexion mediante nuestra interfaz de **Readline**.

# Pidiendo el nick que va a utilizar el usuario

Vamos a hacer uso de Readline de la siguiente manera:

{% highlight javascript  %}

rl.question("Please entar a nickname: ", function(name){
    nick = name;
    var msg = nick + " joined this chat";
    socket.emit('send', {type: 'notice', message: msg});
    rl.prompt(true);
});

{% endhighlight %}

Establecemos la variable *nick* que habiamos creado anteriormente en el valor que añade el usuario, enviamos un mensaje al servidor, que será transmitido a los otros clientes, que nuestro usuario se ha unido al chat, luego cambia la interfaz de **Readline** nuevamente al modo de solicitud. 

El valor **true** pasado a `prompt()` garantiza que el carácter de solicitud se muestre correctamente. (De lo contrario, el cursor puede moverse a la posición cero en la línea y no se mostrará el " > ").

Sin embargo, **Readline** tiene un problema con el método`prompt()` porque no funciona bien con `console.log()`, por lo que la salida debe pasarse a la siguiente función:

```
function console_out(msg) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    console.log(msg);
    rl.prompt(true);
}
```
*Funcion console_out()*

# El cliente: manejo de entrada


Vamos a contemplar dos tipos de entradas que un va a poder ingresar

- Chat
- Comandos

Para distinguirlo basta con saber que los comando van precedidos de barra oblicua. Para ello vamos a utilizar un controlador de eventos llamado **line** el cual se activa cada vez que se pulsa la tecla de intro. Esto lo podemos hacer de la siguiente manera:

{% highlight javascript  %}

rl.on('line', function(line){
    if(line[0] == "/" && line.length > 1){
        var cmd = line.match(/[a-z]+\b/)[0];
        var arg = line.substr(cmd.length+2, line.length);
        chat_command(cmd, arg);
    }else{

        //sen chat message
        socket.emit('send', {type: 'chat', message: line, nick: nick});
        rl.prompt(true);
    }
});

{% endhighlight %}

Si el primer carácter de la línea de entrada es una barra oblicua sabemos que es un comando y por tanto esto requerira una serie de pasos, si no es una barra solo enviamos un mensaje de chat y restablecemos el mensaje. 

El nombre del comando, **cmd** y el texto que le sigue **arg** se separan con una *expresión regular* que posteriormente se le pasan a una funcion, *chat_command()* para ser procesado.


{% highlight javascript  %}

function chat_command(cmd, arg){
    switch(cmd){

        case 'nick':
            var notice = nick + " changed their name to " + arg;
            nick = arg;
            socket.emit('send', {type: 'notice', message: notice});
            break;
        case 'msg':
            var to = arg.match(/[a-z]+\b/)[0];
            var message = arg.substr(to.length, arg.length);
            socket.emit('send', {type: 'tell', message: message, to: to, from: nick});
            break;
        case 'me':
            var emote = nick + " " + arg;
            socket.emit('send', {type: 'emote', message: emote});
            break;
        default:
            console_out("That is not a valid command.");
    }
}

{% endhighlight %}

De esta forma:

- Si el usuario que se conecta al chat escribiera `/nick "nombre"` la variable nick se cambiara por *"nombre"* y se envía un aviso al servidor.

- Si el usuario escribe `/msg "mensaje"`, se usa la misma expresión regular para separar el destinatario y el mensaje, luego se envía un objeto con el tipo de *tell* al servidor. Esto se mostrará un poco diferente a un mensaje normal y no debería ser visible para otros usuarios. Es cierto que nuestro servidor demasiado simple enviará ciegamente el mensaje a todos, pero el cliente ignorará las indicaciones que no están dirigidas al apodo correcto.

- Si se escribe `/me "mensaje"`, el apodo se antepone y luego se envía al servidor.


# El cliente: manejo de mensajes entrantes


Necesitamos una forma de recibir los mensajes, por ellos tenemos que conectarno al evento *message* y formatear los datos de salida. Para formatear los datos usaremos el paquete *ansi-color* que instalamos al principio.


{% highlight javascript  %}

socket.on('message', function(data){
    var leader;
    if(data.type == 'chat' && data.nick != nick){
        leader = color("<"+data.nick+"> ", "green");
        console_out(leader + data.message);
    }else if (data.type == "notice") {
        console_out(color(data.message, 'cyan'));
    }else if (data.type == "tell" && data.to == nick) {
        leader = color("["+data.from+"->"+data.to+"]", "red");
        console_out(leader + data.message);
    }else if (data.type == "emote") {
        console_out(color(data.message, "cyan"));
    }
});

{% endhighlight %}


Probamos nuestro chat con dos clientes y nos quedaría de la siguiente forma:

<img src="https://github.com/ULL-MII-SYTWS-1920/p4-t2-networking-alu0100836950.github.io/tree/master/img/chat.png" alt="Prueba de chat">