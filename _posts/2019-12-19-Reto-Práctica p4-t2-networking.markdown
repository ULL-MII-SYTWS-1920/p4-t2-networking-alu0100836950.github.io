---
layout: post
title:  "Reto p4-t2-networking"
date:   2019-12-30 10:23:59 +0000
categories: update jekyll
---

### Reto para la práctica p4-t2-networking

## Escriba un servidor que permita un chat donde los clientes se conectan via telnet o netcat.

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

Utilizaremos un socket simple haciendo uso uno de los paquetes instalados *socket.io*


