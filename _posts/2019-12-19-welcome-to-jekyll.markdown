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
