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

