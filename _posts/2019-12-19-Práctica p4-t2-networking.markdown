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

Nuestra tarea es usar `JSON.stringify()` para codificar objetos de mensaje y enviarlos a través de `connection.write()`. `JSON.stringify()` toma un objeto JavaScript y devuelve una cadena que contiene una representación serializada de ese objeto en forma JSON.

Para ello modificaremos el archivo *net-watcher.js* cambiando la linea de `connection.write`en donde pondremos lo siguiente:

```
connection.write(JSON.stringify({type: 'watching', file: filename}) + '\n');

```

Lo siguiente es cambiar la llamada a `connection.write()` en el *watcher* por lo siguiente:

```
const watcher = fs.watch(filename, () => connection.write( JSON.stringify({type: 'changed', timestamp: Date.now()}) + '\n'));

```

Probamos las modificaciones para ver los resultados transformados en JSON.

```
✔ ~/Documents/Master Informatica/STW-SERVER/p4-t2-networking [master|✔] 
12:16 $ node networking/net-watcher-json-service.js target.txt 
Listening for subscribers...
Subscriber connected
```

```
✔ ~/Documents/Master Informatica/STW-SERVER/p4-t2-networking [master|✚ 5…6] 
12:15 $ nc localhost 60300
{"type":"watching","file":"target.txt"}
{"type":"changed","timestamp":1577363691686}

```

Ahora pasaremos a escribir un programa cliente que procese estos mensajes.


## Creating Socket Client Connections

Escribiremos un programa cliente en **Node.js** para recibir mensajes JSON de nuestro programa *net-watcher-json-service*.

Crearemos un nuevo fichero que lo llamaremos *net-watcher-json-client.js*

```
'use strict';
const net = require('net');
const client = net.connect({port: 60300}); client.on('data', data => {
const message = JSON.parse(data); if (message.type === 'watching') {
console.log(`Now watching: ${message.file}`); } else if (message.type === 'changed') {
const date = new Date(message.timestamp);
console.log(`File changed: ${date}`); } else {
console.log(`Unrecognized message type: ${message.type}`); }
});

```
El objeto del cliente es un Socket. Cada vez que ocurre un evento de datos, nuestra función de devolución de llamada toma el objeto de búfer entrante, analiza el mensaje JSON y luego registra un mensaje apropiado en la consola.

Probamos los ficheros:

```
~/Documents/Master Informatica/STW-SERVER/p4-t2-networking [master|✚ 2…1] 
13:11 $ node networking/net-watcher-json-service.js target.txt 
Listening for subscribers...
Subscriber connected


~/Documents/Master Informatica/STW-SERVER/p4-t2-networking [master|✚ 2…1] 
13:11 $ node networking/net-watcher-json-client.js 
Now watching: target.txt
File changed: Thu Dec 26 2019 13:11:26 GMT+0000 (hora estándar de Europa occidental)

```

Todo funciona correctamente, sin embargo, este programa solo escucha eventos de datos, no eventos finales o eventos de error y esto debemos corregirlo. Ademas exidte un error que analizaremos a continuación.

### Testing Network Application Functionality

Las pruebas funcionales nos aseguran que nuestro código hace lo que esperamos que haga. En esta sección, desarrollaremos una prueba para nuestro *servidor de archivos* y programas *cliente*. Crearemos un servidor simulado que se ajuste a nuestro protocolo LDJ mientras exponemos fallos en el cliente.
Después de escribir la prueba, arreglaremos el código del cliente para que no halla ningún fallo.

Pero primeramente vamos a entender un problema importante.

### Understanding the Message-Boundary Problem

Cuando se desarrolla programas en red en **Node.js**, mayoritariemente se comunican pasando mensajes. En el mejor de los casos llegará un mensaje de una vez, pero a veces los mensajes llegarán en pedazos, divididos en eventos de datos distintos.

*El protocolo **LDJ** que hemos desarrollamos anteriormente separa los mensajes con carácteres de nueva línea. Cada carácter de nueva línea es el límite entre dos mensajes.* 

Es decir que en nuestro caso los límites del evento de datos coinciden exactamente con los límites del mensaje, ya que cada vez que ocurre un cambio se codifica y se envía un mensaje a la conexión.

¿Qué ocurriría si nuestro mensaje a la conexión se dividiera en dos eventos de datos como se muestra en la siguiente figura?

<img src="/img/message.png" alt="Division del mensaje">


### Implementing a Test Service

Escribir aplicaciones robustas de Node.js significa manejar problemas de red como:

- entradas divididas
- conexiones rotas 
- datos incorrectos 

En esta seccion implementaremos un servicio de prueba que divide un mensaje en varios fragmentos.


{% highlight javascript  %}
 
'use strict';
const server = require('net').createServer(connection => {
    console.log('Subscriber cpnnected.');

    //two message chunks together make a whole message
    const firstChunk = '{"type":"changed","timesta';
    const secondChunk = 'mp":1450694370094}\n';

    //send the first chung immediately
    connection.write(firstChunk);

    //after a short delay, send the other chunk
    const timer = setTimeout(() => {
        connection.write(secondChunk);
        connection.end();
    }, 100);

    //clear timer when the connection ends
    connection.on('end', () => {
        clearTimeout(timer);
        console.log('Subscriber disconnected.');
    });

});

server.listen(60300, function(){
    console.log('Test server listening for subscribers...');
});

{% endhighlight %}

En este caso, a diferencia de nuestro primer "observador de archivos", solo enviamos el primer fragmento predeterminado de inmediato. Creamos un delay con `setTimeout()` y enviamos el segundo fragmento. Por ultimo cada vez que se cierra una conexion usamos `clearTimeout()`para evitar la programacion de la *callback*.

*La cancelación de la devolución de llamada es necesaria porque una vez que se cierra una conexión, cualquier llamada a `connection.write()` activará eventos de error.*

```
~/Documents/Master Informatica/STW-SERVER/p4-t2-networking [master|✚ 2…2] 
10:47 $ node networking/net-watcher-json-client.js 
undefined:1
{"type":"changed","timesta
                          

SyntaxError: Unexpected end of JSON input
    at JSON.parse (<anonymous>)
    at Socket.<anonymous> (/Users/albertomartin/Documents/Master Informatica/STW-SERVER/p4-t2-networking/networking/net-watcher-json-client.js:7:26)
    at Socket.emit (events.js:210:5)
    at addChunk (_stream_readable.js:308:12)
    at readableAddChunk (_stream_readable.js:289:11)
    at Socket.Readable.push (_stream_readable.js:223:10)
    at TCP.onStreamRead (internal/stream_base_commons.js:182:23)
```

El token de error inesperado nos dice que el mensaje JSON no era completo. Nuestro cliente intentó enviar medio mensaje a `JSON.parse ()`, que espera solo cadenas JSON completas y formateadas correctamente como entrada.

En este punto, hemos simulado con éxito el caso de un mensaje dividido proveniente del servidor. Ahora arreglemos al cliente para que trabaje con él.

## Extending Core Classes in Custom Modules

Nuestro programa cliente tiene dos trabajos que hacer:

- Una es almacenar los datos entrantes en los mensajes 
- El otro es manejar cada mensaje cuando llega

En lugar de agrupar estos dos trabajos en un solo programa Node.js, lo correcto es convertir al menos uno de ellos en un **módulo Node.js**. Crearemos un módulo que maneje la parte de almacenamiento intermedio de entrada para que el programa principal pueda obtener mensajes completos.


### Extending EventEmitter

Para aliviar el programa del cliente del peligro de dividir los mensajes JSON, implementaremos un módulo de cliente de almacenamiento en un búfer.

#### Inheritance in Node

Primero veremos como funciona la herencia en node:


{% highlight javascript  %}

const EventEmitter = require('events').EventEmitter;
class LDJClient extends EventEmitter{
    constructor(stream){
        super();
    }
}

{% endhighlight %}

Siempre que se implemente una clase que extienda de otra clase, debe comenzar llamando a `super()`, con los argumentos del constructor. **Stream** es un objeto que emite eventos de datos como una conexion Socket.

La jerarquía de clases ay estarñia constituida, pero no hemos implementado nada para emitir eventos de mensajes. Veamos esto a continuación.

#### Buffering Data Events

Usaremos el parámetro de flujo(stream) en el LDJClient para recuperar y almacenar la entrada.

El siguiente codigo agrega fragmentos de datos entrantes a una cadena de búfer en ejecución y escanea en busca de finales de línea (que deberían ser límites de mensajes JSON).


{% highlight javascript  %}

const EventEmitter = require('events').EventEmitter;
class LDJClient extends EventEmitter{
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
}

{% endhighlight %}

Comenzamos llamando a `super()`, como antes, y luego configuramos una variable de cadena llamada *buffer* para capturar los datos entrantes.A continuación, usamos `stream.on()` para manejar eventos de datos.

Agregamos datos en bruto al final del búfer y luego buscamos mensajes completos desde el frente. Cada cadena de mensaje se envía a través de `JSON.parse()` y finalmente es emitida por LDJClient como un evento de mensaje a través de `this.emit()`.

A continuación, debemos colocar esta clase en un módulo Node.js para que nuestro cliente ascendente pueda usarla.

#### Exporting Functionality in a Module

Para exportar el modulo que hemos creado añadiremos una carpeta que se llame **lib** y dentro de ella creamos un fichero *ldj-client.js* el en donde su contenido será el siguiente:

{% highlight javascript  %}
'use strict';
const EventEmitter = require('events').EventEmitter;
class LDJClient extends EventEmitter{
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

{% endhighlight %}

Es el mismo contenido que ya habiamos creado pero con algunas líneas necesarias añadidas como el `exports(), use strict`, etc.

*El método connect () es simplemente una conveniencia para los consumidores de la biblioteca para que no tengan que usar el nuevo operador para crear una instancia de LDJClient*

En este caso, con el metodo `exports()` estamos exportando la clase LDJClient. El código para usar el módulo LDJ se verá así:


{% highlight javascript  %}

const LDJClient = require('./lib/ldj-client.js'); const client = new LDJClient(networkStream);

{% endhighlight %}

O usando el metodo `connect()`:

{% highlight javascript  %}

const client = require('./lib/ldj-client.js').connect(networkStream);

{% endhighlight %}

Ya tenemos nuestro modulo creado ahora aumentemos el cliente de observación de red para usar el módulo.

### Importing a Custom Node.js Module

Modifiquemos el cliente para usar el modulo que hemos creado, para ello crearemos un nuevo fichero que se llamará *net-watcher-ldj-client.js*.

Modifiquemos el cliente para usarlo en lugar de leer directamente de la secuencia TCP.

{% highlight javascript  %}

'use strict';
const netClient = require('net').connect({port: 60300});
const ldjClient = require('./lib/ldj-client.js').connect(netClient);

ldjClient.on('message',message => {
    if(message.type === 'watching'){
        console.log(`Now watching : ${message.file}`);
    }else if(message.type === 'changed'){
        console.log(`File changed: ${new Date(message.timestamp)}`);
    }else{
        throw Error(`Unrecognized message type: ${message.type}`);
    }
});

{% endhighlight %}

Para comprobar que todo funciona correctamente vamos a ejecutar la prueba *test-json-service.js*.

```
 ~/Documents/Master Informatica/STW-SERVER/p4-t2-networking [master|✔] 
12:12 $ node networking/test-json-service.js 
Test server listening for subscribers...
Subscriber connected.
Subscriber disconnected.
|
```

Y en otra terminal ejecutamos nuestro fichero *net-watcher-ldj-client.js*

```
~/Documents/Master Informatica/STW-SERVER/p4-t2-networking [master|✚ 1…1] 
14:24 $ node networking/net-watcher-ldj-client.js 
File changed: Mon Dec 21 2015 10:39:30 GMT+0000 (hora estándar de Europa occidental)

```

Todo funciona correctamente.


## Developing Unit Tests with Mocha

Mocha es un marco de prueba multiparadigma para Node.js. 
Para usar Mocha, primero lo instalaremos con `npm` y posteriormente crearemos una prueba unitaria para la clase *LDJClient* .
Finalmente usaremos npm para ejecutar el conjunto de pruebas.

Una vez que hayamos instalado mocha en nuestro *packaje.json* tendremos una nueva dependencia.


En **Node.js** hay algunos tipos diferentes de dependencias: 

- Dependencias de desarrollo 
- Dependencias de tiempo de ejecución 

Ambas son instaladas cuando se ejecuta `npm install` sin argumentos adicionales. 


### Control de versiones semántico

El control de versiones semántico es una convención fuerte en la comunidad Node.js, que
definitivamente debe seguir al configurar los números de versión en sus paquetes.

Un **número de versión** consta de tres partes unidas por puntos: 

- La versión principal,
- La versión menor 
- El parche.

Para cumplir con la convención de versiones semánticas, cuando realice un cambio en
el código se tiene que incrementar la parte correcta del número de versión:

- Si el cambio del código no introduce o elimina ninguna funcionalidad (como
una corrección de errores),se incrementa la versión del parche.

- Si el código introduce funcionalidad pero no elimina o altera las
funcionalidades, se incrementa la versión menor y se reinicia el parche.

- Si el código de alguna manera rompe la funcionalidad existente, se incrementa la
versión principal y se restablece las versiones menores y parche.


### Escribiendo pruebas unitarias con Mocha


Una vez que hemos instalado Mocha desarrollaremos una prueba unitaria.

Crearemos un subdirectorio llamado *test* para guardar el código relacionado con las pruebas, ya que Mocha buscará las pruebas en ese directorio.

Tambien crearmeos un archivo en el directorio llamado *ldj-client-test.js*, que nos quedará de la siguiente forma: 

{% highlight javascript %}
'use strict';

const assert = require('assert');
const EventEmitter = require('events').EventEmitter;
const LDJCLient = require('../lib/ldj-client');

describe('LDJClient', () => {
    let stream = null;
    let client = null;

    beforeEach(() => {
        stream = new EventEmitter();
        client = new LDJCLient(stream);
    });

    it('should emit a message event from a single data event', done => {
        client.on('message', message => {
            assert.deepEqual(message, {foo: 'bar'});
            done();
        });
        stream.emit('data', '{"foo":"bar"} |n');
    });
});
{% endhighlight %}


### Ejecutando test de mocha con npm


Una vez que hemos creado la prueba vamos a ejecutarla. Para ello tenemos que modificar nuestro package.json y añadir lo siguiente:

```
"scripts":{
    "tests": "mocha"
},

```

Ahora solo tenemos que escribir en la consola `mpn test`.

IMAGEN TEST_PASSING

### Añadiendo más test asíncronos

Ahora modificaremos nuestro archivo de pruebas y le añadiremos lo siguiente:

{% highlight javascript %}


    it('should emit a message event from split data events', done => {
        client.on('message', message => {
            assert.deepEqual(message, {foo: 'bar'});
            done();
        });
        stream.emit('data', '{"foo":');
        process.nextTick(() => stream.emit('data', '"bar"}\n'));
    });

{%  endhighlight %}

En esta ocasion el mensaje que se emite se divide en dos. Haciendo uso del metodo `process.nextTick()` podemos enviar la otra parte del mensaje justo despues de que realizar el `emit`


## Añadiento nuevos test

Creamos una prueba para comprobar que el constructor de nuesto LDJClient detecta si se le pasa un valor NULL. 

{% highlight javascript %}

    it('Le esta enviando un NULL', done =>{
        stream = null;
        chai_assert.Throw(() => {new LDJClient(stream)}, Error);
        done();
    });

{% endhighlight %}

Posteriormente modificamos el codigo para que pase la prueba y comprobamos que el test se realiza satisfactoriamente

IMAGEN DE PASS


## Robustez

- ¿Qué sucede si los datos entrantes no son una cadena formateada correctamente en JSON?

El codigo espera que el mensaje ya este formateado en JSON, por tanto, da un error de sintaxis.

- Modificar para enviar un tipo de dato diferente de JSON. ¿Qué ocurriria?

Modificamos la clase LDJClient y encerramos el `JSON.parse` en un *exception* para que en caso de que el mensaje no este en formato JSON
cree un mensaje en formato JSON que manipulamos para indicar que el mensaje no esta en formato JSON con un mensaje en la consola. 

- ¿Qué ocurre si el mensaje JSON llega sin el caracter de nueva línea?

Al no encontrar el caracter de nueva linea `\n` se da por hecho que no hay ningun mensaje.

