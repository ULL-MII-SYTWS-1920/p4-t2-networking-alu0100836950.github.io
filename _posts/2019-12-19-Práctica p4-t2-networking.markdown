---
layout: post
title:  "Práctica p4-t2-networking"
date:   2019-12-19 17:23:59 +0000
categories: update jekyll
---

# NETWORKING WITH SOCKETS


## Listening for Socket Connections

El **objetivo** de esta seccion es aprender cómo crear servicios basados ​​en sockets utilizando *Node.js*. Con esto conseguiremos entender como se realiza el patrón *cliente/servidor*.

### Binding a Server to a TCP Port


Las conexiones de socket TCP constan de dos *endpoints*. Un de ellos se une a un puerto numerado mientras que el otro se conecta a un puerto.

*Si usamos la telefonía como ejemplo vemos como un telefono que dispone de una numeracion fija, por un tiempo, recibe una llamada de otro teléfono y a partir de esa conexion se transmiten los datos, en ese caso la información que se transmite es el sonido.*

En Node.js, las operaciones de enlace y conexión son proporcionadas por el módulo de red.

Así se vería el enlace a un puerto TCP:

{% highlight javascript  %}
 
'use strict';
const net = require('net'), 
server = net.createServer(connection => {
  //use the connection object for data transfer.
});
server.listen(60300);
 
{% endhighlight %}


El método `net.createServer()` toma una función de devolución de llamada y devuelve un objeto **Servidor**. 

Node.js invocará la función de devolución de llamada cada vez que se conecte otro *endpoint*.

Para tener un poco má claro este concepto nos fijaremos en la sioguiente imagen:

<img src="/img/connection.png" alt="Esquema de conexion">

La figura muestra el Node.js cuyo servidor enlaza un puerto TCP. Los clientes, que pueden ser o no procesos de Node.js, pueden conectarse a ese puerto enlazado.

Nuestro programa de servidor todavía no hace nada con la conexión, nuestro paso siguiente es añadir que pueda enviar información útil al cliente.

### Writing Data to a Socket

Para esta sección haremos uso de algunas utilidades afrontados en capitulos anteriores como el control de archivos pero con algunas modificaciones.

{% highlight javascript  %}

'use strict';

const fs = require('fs');
const net = require('net');
const filename = process.argv[2];

if(!filename){
    throw Error('Error: No filename specified');
}

net.createServer(connection => {
    //reporting
    console.log('Subscriber connected');
    connection.write(`Now watching "${filename}" for changes...\n`);

    //watcher setup
    const watcher = fs.watch(filename,() => connection.write(`File changed: ${new Date()}\n`));

    //Cleanup
    connection.on('close', () =>{
        console.log('Subscriber disconnected');
        watcher.close();
    });
}).listen(60300, () => console.log('Listening for subscribers...'));

{% endhighlight %}

Vamos a ver que hace nuestra callback de `net.createServer()`:

- Informa que la conexión ha sido establecida
- Comienza a escuchar los cambios del archivo, guardando el objeto *watch* devuelto. Esta *callback* envía cambios de información al cliente usando `connection.write()`.
- Escucha el evento de cierre para informar a los subscristores que se ha deconectado de la conexión y parar la observación del fichero con `watcher.close()`.

Finalmente, observar que se llama al metodo `server.listen()`. Node.js invoca a esta funcion después de que se enlace correctamente el puerto 60300 y este listo para recibirn conecciones.


### Connecting to a TCP Socket Server with Netcat

Vamos a seguir los siguiente pasos para comprobar que el programa que hemos creado funciona correctamente.

Para ejecutar y probar el programa *net-watcher.js* vamos a utilizar tres sesiones de terminal: 

- una para el servicio 
- otra para el cliente 
- otra para activar los cambios en el archivo observado

En su primer terminal, usamos el comando `watch` para hacer un touch del archivo de destino enw intervalos de un segundo:

```
$ watch -n 1 touch target.txt

```
Una vez ejecutado abrimos una segunda terminal:

```
node net-watcher.js target.txt

```

Este programa crea un servicio de escucha en el puerto TCP 60300. Para conectarlo, usaremos **netcat**, un programa de utilidad de socket. 


Abrimos una tercera terminal y usamos el comando `nc` de la siguiente manera:

```
nc localhost 60300

```

<img src="/img/watch.png" alt="Terminales">

Al salir de la sesion con `control + C`nos saldra el mensaje de desconexion, *Subscriber disconnected*.

La siguiente figura describe la configuración que acabamos de crear.


<img src="/img/figura_process.png" alt="Esquema de proceso">


Si abrimos terminales adicionales y nos conectamos al puerto **60300** con **nc**, todos recibirán actualizaciones cuando cambie el archivo de destino.


Los **sockets TCP** son útiles para comunicarse entre computadoras en red, pero si necesitamos procesos en la misma computadora para comunicarse, los **sockets Unix** ofrecen una alternativa más eficiente.


### Listening on Unix Sockets

Para ver el funcionamiento de los socket de Unix vamos a modicficar el archivo *net-watcher.js* para poder usar este tipo de canal de comunicación, en concreto cambiaremos lo siguiente:

```
.listen('/tmp/watcher.sock', () => console.log('Listening for subscribers...'));

```

Para conectar un cliente, podemos usar **nc** como antes, pero esta vez especificando el indicador *-U* para usar el archivo de socket.

<img src="/img/server.png" alt="Servidor de archivo"> 

<img src="/img/client.png" alt="Cliente">


Los sockets Unix pueden ser más rápidos que los sockets TCP porque no requieren invocar hardware de red sin embargo estan confinados a la máquina.

## Implementing a Messaging Protocol

Hasta ahora nuestros programas de ejemplo han enviado mensajes de texto sin formato. En esta sección diseñaremos e implementaremos un protocolo mejor.

Un *protocolo* es un conjunto de reglas que permiten que dos o más entidades de un sistema de comunicación se comuniquen entre ellas para transmitir información.

El objetivo de esta parte será implementar *endpoints* de cliente y servidor que utilicen nuestro nuevo protocolo basado en **JSON**.

### Serializing Messages with JSON
Para desarrollar el protoclo tenemos que tener en cuenta que cada mensaje es un objeto serializado JSON, que es un hash de pares clave-valor. 

Esto seria un ejemplo de objeto JSON con dos pares clave-valor:

*{"key":"value","anotherKey":"anotherValue"}*

El archivo *net-watcher* que hemos creado envia dos tipos de mensajes que debemos transformar en **JSON**:

- Cuando se establece la conexión por primera vez, el cliente recibe la cadena:
  *Ahora viendo "target.txt" para ver los cambios ...*

- Cada vez que cambia el archivo de destino, el cliente recibe una cadena como esta:    *Archivo modificado: vie 18 dic 2015 05:44:00 GMT-0500 (EST).*

Para codificar el *primer mensaje* lo haremos de la siguiente forma:

*{"type":"watching","file":"target.txt"}*

* Type: Tipo de mensaje(observación)
* File: Archivo que se esta observando

Para codificar el *segundo mensaje* lo haremos de la siguiente forma:

*{"type":"changed","timestamp":1358175733785}*

* Type: indica que el archivo ha cambiado 
* Timestamp: número de milisegundos pasados desde la medianoche del 1 de enero de 1970. Este dato es facil de usar en **Javascript**, ya que puedes utilizar la función `Date.now()` para obtner la hora actual.

*Tener en cuenta que no hay saltos de línea en nuestros mensajes **JSON**. Nuestro protocolo usará nuevas líneas solo para separar los mensajes. Nos referiremos a este protocolo como JSON delimitado por líneas (LDJ).*


### Switching to JSON Messages


