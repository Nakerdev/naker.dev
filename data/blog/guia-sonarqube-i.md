---
title: 'SonarQube: Una Guía completa desde la instalación hasta el análisis de código (I)'
date: '2023-11-25'
tags: ['.NET', 'CI', 'WEB', 'LINUX']
draft: false
summary: El primer articulo de una serie de SonarQube que va desde la instalación y configuración hasta el análisis de código de un proyecto en .NET.
images: ['/static/images/sonarqube-guia-i/sonarqube-guia-1-twitter-card.png']
---

![Query param](/static/images/sonarqube-guia-i/sonarqube-guia-1-twitter-card.png)

## Tabla de contenidos

1. [Introducción](#introduccion)
1. [Cómo funciona SonarQube](#como-funciona-sonarqube)
1. [Configurando el contenedor con Docker](#config-docker)
1. [Instalando y levantado el servicio de SonarQube ](#instalando-sonarqube)  
   3.1 [Instalando Java](#java)
   3.2 [Creación de un nuevo usuario](#creacion-usuario)
   3.3 [Descarga e instalación de SonarQube](#decarga-sonarqube)
   3.4 [Descarga del escáner](#descarga-escaner)
1. [Acceso a la interfaz web](#acceso-web)

<a name="introduccion"/>
## Introducción

En el desarrollo de software, es crucial establecer normas de equipo para garantizar la calidad y la seguridad del proyecto. Esto es más fácil en equipos pequeños con baja rotación, pero suele volverse complicado en equipos más grandes, lo cual es común. En estos casos, asegurarse de que se cumplan las normas del equipo puede ser una tarea tediosa, a menudo responsabilidad de los miembros más experimentados que están familiarizados con los estándares establecidos.

Generalmente se usan metodologías de trabajo como las _pull requests_ para que no entre código sin revisar en el proyecto o reuniones de _code review_ periódicas donde se revisa el código. Ambas opciones requieren de una inversión de tiempo por parte de uno o varios miembros del equipo.

El _pair programming_ también es una metodología de trabajo muy buena que ayuda a que el proyecto sea simétrico y el conocimiento se comparta. Desgraciadamente, muy pocos equipos trabajan en pareja como norma.
Para ayudarnos a mantener la calidad y la seguridad de nuestro proyecto a raya existe SonarQube. SonarQube es una herramienta que controla la calidad y la seguridad del código que escribimos a medida que el proyecto va creciendo y evolucionando, para ello usa herramientas de análisis estático de código. Las herramientas de análisis estático son simplemente analizadores de código que comprueba que se cumplan ciertas reglas. Reglas que se pueden configurar y personalizar en función de los estándares definidos en el equipo.

Automatizar el proceso de revisión de código, por lo menos aquel que es más trivial como por ejemplo el formato de los ficheros, las convenciones de nombres, el tamaño máximo de métodos públicos por clase, los errores de seguridad más comunes, etc. Nos ahorra mucho tiempo en la semana y nos garantiza que nuestro proyecto crezca de una forma sana.

**SonarQube es perfecto para incluirlo como un paso más dentro de nuestro pipeline de CI.**

<a name="como-funciona-sonarqube"/>
## Cómo funciona SonarQube

SonarQube se compone de: un servidor, una base de datos, una interfaz web y un escáner.

El servidor expone una interfaz web donde se configuran las reglas del escáner y se visualizan las ejecuciones pasadas de SonarQube. En él veremos gráficos y métricas. El servidor usa ElasticSearch como sistema de persistencia.

El escáner es el encargado de analizar el código de la solución en base a las reglas que están configuradas en el servidor. Este proceso genera un reporte que se guarda en la base de datos y se visualiza en el cliente web de SonarQube. Este mismo reporte sirve como histórico para poder visualizar como fluctúa la calidad y la seguridad del código durante el tiempo.

Existen varios tipos de escáneres, en función del tipo de proyecto con el que estemos trabajando. En la página oficial de SonarQube podemos ver todos los escáneres disponibles:

[https://docs.sonarsource.com/SonarQube/9.9/analyzing-source-code/overview/]

En nuestro caso usaremos el escáner de .NET.

En el reporte generado por el escáner de SonarQube podremos ver las distintas incidencias que hay en el proyecto.

<a name="config-docker"/>
## Configurando el contenedor con Docker

Vamos a usar un contenedor de Docker para ejemplificar como instalar y configurar SonarQube para analizar nuestro proyecto en .NET.

Para empezar, crearemos un _docker-compose.yml_ para levantar el contenedor y configurar una red, de esta forma podremos acceder al panel web desde nuestro entorno local apuntando a la dirección IP del contenedor.

Usaremos una imagen Ubuntu sin nada previamente instalado.

```
version: '2.3'
services:
  sonarqube:
    image: ubuntu:latest
    tty: true
    ports:
      - 9000:9000
    networks:
      nakernet:
        ipv4_address: 192.168.1.2

networks:
  nakernet:
    driver: bridge
    ipam:
      config:
        - subnet: 192.168.1.0/24
```

Nota: La configuración de la red puede cambiar dependiendo de máquina local.
Nota 2: El puerto 9000 es el por defecto de SonarQube, si lo cambias en la configuración deberás cambiar el puerto en el _docker-compose.yml_

Para levantar el contenedor debemos usar una nueva instancia de consola ya que una vez ejecutemos el contenedor esa instancia de la consola quedará bloqueada hasta que paremos el contenedor de nuevo.

Comando para levantar el contenedor: _docker-compose up_

![Query param](/static/images/sonarqube-guia-i/docker-compose-up.PNG)

Una vez levantado podemos comprobar en otra consola que el contenedor está ejecutándose correctamente.

Comando para listar los procesos que están ejecutándose: _docker-compose ps_

![Query param](/static/images/sonarqube-guia-i/docker-compose-ps.PNG)

Una vez configurada la máquina sobre la que vamos a trabajar el siguiente paso es conectarnos a ella.

**Importante: A partir de este punto, hasta finalizar la instalación no eliminar el contenedor (docker-compose down) porque perderemos el estado de la máquina.**

El comando para conectarnos al contenedor es el siguiente: _docker compose exec \{service_name\} bash_

Importante, hay que recalcar que **hay que pasarle el nombre del servicio no el nombre del contenedor.** El nombre del servicio lo hemos definido en el _docker-compose.yml_

![Query param](/static/images/sonarqube-guia-i/docker-compose-exec-bash.PNG)

<a name="instalando-sonarqube"/>
## Instalando y levantado el servicio de SonarQube

<a name="java"/>
### Instalando Java

SonarQube se ejecuta sobre la máquina virtual de Java por lo que para poder levantar el servicio debemos instalar el Runtime de Java en la máquina.

Lo primero de todo es actualizar el directorio de paquetes de la máquina. Lo haremos con el comando _apt-get update_

![Query param](/static/images/sonarqube-guia-i/apt-get-update.PNG)

Una vez actualizado el repositorio de paquetes podemos instalar Java. Lo podemos hacer con el siguiente comando: _apt-get install openjdk-17-jdk_

Este comando puede tardar varios segundos en terminar. Una vez haya terminado podemos verificar la versión de Java instalada con el comando _java –version_

![Query param](/static/images/sonarqube-guia-i/java-version.PNG)

<a name="creacion-usuario"/>
### Creación de un nuevo usuario

SonarQube usa un ElasticSearch como base de datos, ElasticSearch está diseñado para ejecutarse sobre un entorno seguro y una de las medidas de seguridad que implementan es que no puedes ejecutar ElasticSearch como usuario root.

Si no fijamos, cuando nos conectamos al contenedor por defecto entramos como usuario root (puedes verificar esto ejecutado el comando _whoami_).

Por estos motivos, lo primero que debemos hacer es crear un usuario nuevo para poder ejecutar SonarQube correctamente.
Crearemos el usuario sonarqube, podemos hacerlo usando los siguientes comandos:

_Useradd sonarqube_
_Passwd sonarqube_

![Query param](/static/images/sonarqube-guia-i/useradd.PNG)

En pasos posteriores necesitaremos ejecutar comandos con permisos de administración con este usuario, para hacerlo necesitamos incluir el nuevo usuario dentro del grupo sudo del sistema. Podemos hacerlo con el siguiente comando: _usermod -G sudo sonarqube_

Adicionalmente también necesitamos instalar el comando sudo para poder ejecutar comando con permisos de administración desde otros usuarios. Para instalarlo podemos ejecutar _apt-get install sudo_

A partir de este punto vamos a continuar con el usuario SonarQube. Nos cambiamos de usuario con el comando _su sonarqube_

![Query param](/static/images/sonarqube-guia-i/su-sonarqube.PNG)

<a name="decarga-sonarqube"/>
### Descarga e instalación de SonarQube

Para instalar SonarQube, como usuario _sonarqube_ en nuestro sistema nos desplazaremos hasta _/opt_. Aquí alojaremos nuestro SonarQube.

Para obtener la URL de descarga podemos ir a la página oficial de SonarQube ([https://www.sonarsource.com/products/SonarQube/downloads/]), en la parte de descargas veremos la URL para descargar la versión de comunidad.

Para descargar SonarQube necesitaremos varios comandos que no están instalados en la máquina. El primero de ellos es _wget_, pasamos a instalarlo: _sudo apt-get install wget_

![Query param](/static/images/sonarqube-guia-i/apt-get-install-wget.PNG)

Una vez tenemos el comando para descargar en nuestro sistema pasamos a descargar SonarQube: _sudo wget https://binaries.sonarsource.com/Distribution/sonarqube/sonarqube-10.3.0.82913.zip_

![Query param](/static/images/sonarqube-guia-i/sudo-wget.PNG)

Una vez descargado el archivo comprimido pasamos a descomprimirlo, para poder hacerlo debemos instalar la herramienta unzip: _sudo apt-get install unzip_

Una vez instalado procedemos a descomprimirlo: _sudo unzip sonarqube-10.3.0.82913.zip_

Como hemos descomprimido el archivo usando el comando _sudo_ por defecto se asigna al usuario _root_ como el propietario del directorio.

![Query param](/static/images/sonarqube-guia-i/la-la.PNG)

Como comentamos anteriormente SonarQube debemos ejecutarlo bajo el control de otro usuario que no sea _root_, por ese motivo creamos anteriormente el usuario _sonarqube_ por lo que vamos a cambiar el propietario de la carpeta de SonarQube al usuario _sonarqube_. Podemos hacerlo con el siguiente comando: _sudo chown -R sonarqube:sonarqube sonarqube-10.3.0.82912_

![Query param](/static/images/sonarqube-guia-i/chown.PNG)

En este punto hemos instalado en nuestra máquina el servidor de SonarQube. El siguiente paso es instalar el escáner, pero antes vamos a echar un vistazo a la estructura de directorios de SonarQube.

![Query param](/static/images/sonarqube-guia-i/ls-la-sonarqube.PNG)

#### /data

En el directorio de instalación, la carpeta _/data_ es la que almacena la información en caso de tener una base de datos configurada. Por defecto no hay ninguna y en nuestro caso particular tampoco hemos configurado ninguna.

#### /extensions

En el directorio _/extensions_ se encuentra los plugins. Para instalar los plugins simplemente hay que descargar el binario del plugin, alojarlo en este directorio y reiniciar el servidor de SonarQube.

Otra forma de instalar plugins es usando el Marketplace del cliente web (http://127.0.0.1:9000/admin/marketplace).

[https://docs.sonarsource.com/sonarqube/9.6/setup-and-upgrade/install-a-plugin/]

#### /conf

Aquí se encuentra el fichero de configuración del servidor de SonarQube (_sonar.properties_) . En él podemos configurar opciones de rendimiento, configuración de la BD si se quiere usar, puerto del cliente web, etc.

#### /bin

En el directorio _/bin_ encontraremos los binarios del servidor. Dentro del directorio de la plataforma concreta (Linux, Windows o MacOS) encontraremos el ejecutable para arrancar el servidor de SonarQube.

<a name="descarga-escaner"/>
### Descarga del escáner

En nuestro caso estaremos jugando con un proyecto de .NET por lo que descargaremos el escáner para esta tecnología. Aquí puede encontrar todos los escáneres que existen para SonarQube: [https://docs.sonarsource.com/sonarqube/9.9/analyzing-source-code/overview/]

Descargamos el escáner, descomprimimos el archivo, modificamos los permisos de la carpeta y la movemos dentro del directorio de instalación de SonarQube.

Una vez hecho todo el proceso tendremos el escáner dentro del directorio de instalación de SonarQube. Veremos la carpeta del escáner y algunos archivos de configuración de este.

![Query param](/static/images/sonarqube-guia-i/ls-la-scanner.PNG)

El siguiente paso es modificar el archivo de configuración de nuestro escáner para que sepa dónde está configurado nuestro servidor de SonarQube y que credenciales tiene que usar para poder conectarse a él. El archivo de configuración del escáner es _SonarQube.Analysis.xml_ y simplemente debemos de descomentar la sección _SonarQubeAnalysisProperties_.

En mi caso he instalado _vim_ para poder editar los archivos en la máquina.

![Query param](/static/images/sonarqube-guia-i/sonar-escaner-config.PNG)

<a name="acceso-web"/>
## Acceso a la interfaz web

Llegados a este punto podemos acceder a la interfaz web de SonarQube desde nuestro navegador local accediendo a la URL [http://127.0.0.1:9000]

![Query param](/static/images/sonarqube-guia-i/iweb.PNG)

En los siguientes artículos empezaremos a escanear proyectos con SonarQube y a configurar reglas.

Gracias por leer.
