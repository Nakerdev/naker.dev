---
title: El esquema de datos MySQL aplicado a las inyecciones SQL.
date: '2019-03-09'
tags: ['SQL', 'Hacking']
draft: false
summary: vez hemos conseguido extraer información del gestor de bases de datos (DBMS), el siguiente paso consiste en extraer información de las tablas de la base de datos (BD). Para esto es necesario conocer cómo el DBMS que estemos atacando almacena el esquema y lo pone a disposición del usuario.
---

## El esquema de datos MySQL aplicado a las inyecciones SQL.

Para las pruebas realizadas a lo largo del artículo he utilizado Damn Vulnerable Web Application [Damn Vulnerable Web Application](http://www.dvwa.co.uk/) una aplicación web hecha con PHP/MySQL que nos pone a nuestra disposición diferentes entornos vulnerables para practicar.

He de decir que las pruebas están hechas sobre un sistema que no tiene ninguna medida de seguridad implantada, directamente se concatena la entrada con la consulta que se lanza a la base de datos.

Vamos al lío.

Una vez hemos conseguido extraer información del gestor de bases de datos (DBMS), el siguiente paso consiste en extraer información de las tablas de la base de datos (BD). Para esto es necesario conocer cómo el DBMS que estemos atacando almacena el esquema y lo pone a disposición del usuario. Cada DBMS lo hace de una forma distinta pero la manera de proceder es análoga para todos los casos. En este caso vamos a utilizar MySQL para las pruebas.

### ¿Que es un esquema y que tipo de información podemos encontrar en él?

Un esquema es la representación de la estructura de una BD, sus tablas, sus campos en cada tabla y las relaciones entre cada campo y cada tabla.

Preguntandole al esquema podemos saber cuántas bases de datos (BBDD) hay en el DBMS junto con las tablas y campos que tienen cada

### ¿Como saber a qué DBMS nos estamos enfrentando?

Como comentamos anteriormente cada DBMS almacena el esquema de datos y lo pone a disposición del usuario de maneras distintas por lo que es muy importante saber con qué DBMS estamos trabajando para saber cómo preguntar por los datos.

Si podemos leer la salida del DBMS directamente la manera más sencilla de saberlo es preguntando por la versión, pero esto no funciona en todos los casos.

En el libro de “Hacking a aplicaciones web: Sql Injection” de Enrique Rando y Chema Alonso exponen una manera de hacerlo que me pareció muy divertida. La técnica es muy simple y se basa en inyectar expresiones propias de cada dialecto y comprobando cómo se comporta la aplicación.

**Escenario:** nos encontramos frente a una aplicación vulnerable a SQLi donde podemos preguntar por un usuario en base a su identificador numérico.

![alt text](./images/1-sqli.png)

En caso de introducir un identificador de usuario que no existe la aplicación no devuelve nada.

![alt text](./images/2-sqli.png)

Bien, sabiendo esto podemos determinar que si inyectamos una condición booleana después de un identificador válido de usuario, si la condición es verdadera nos devolverá el usuario pero si es falsa no devolverá nada.

Consulta:

```sql
1’ AND 1 = 1;#
```

![alt text](./images/3-sqli.png)

Consulta:

```sql
1’ AND 1 = 2;#
```

![alt text](./images/4-sqli.png)

Ahora podemos usar expresiones del dialecto SQL para determinar el tipo de DBMS al que nos estamos enfrentando. Podemos usar los operadores y funciones de concatenación de cadenas.

La siguiente tabla la he extraído directamente del libro “Hacking a aplicaciones web: Sql Injection” ya que representa muy bien lo que quiero explicar.

![alt text](./images/15-sqli.png)

Por lo que:

- Si soporta el operador ‘+’ para la concatenación de cadenas, es SQL Server.
- Si soporta el operador ‘||’, pero no la función ‘concat’, es PostgreSQL
- Si el operador ‘||’ no concatena, pero sí lo hace “concat”, es MySQL
- Si tanto ‘||’ como ‘concat’ sirven para concatenar, es ORACLE
- Si aplicamos esto, sabiendo que estamos usando un MySQL en nuestras pruebas. Si utilizamos el operador ‘||’ para concatenar cadenas no nos devolverá resultado ya que habrá retornado 0 la consulta. Sin embargo si usamos la función ‘concat’ deberemos de obtener el usuario admin.

Consulta:

```sql
1’ AND ‘a’||’b’ LIKE ‘ab’;#
```

![alt text](./images/5-sqli.png)

Consulta:

```sql
1’ AND concat(‘a’, ‘b’) LIKE ‘ab’;#
```

![alt text](./images/6-sqli.png)

### Extrayendo información de INFORMATION_SCHEMA, el esquema de MySQL.

INFORMATION_SCHEMA es el esquema de donde vamos a extraer la información que nos interesa. En realidad es una base de datos como tal que contiene vistas con permisos de solo lectura. La manera de realizar consultas es análoga a la forma en que lo hacemos con una BD normal.

_SCHEMATA_

La primera vista del esquema que nos interesa es _INFORMATION_SCHEMA.SCHEMATA_ donde podremos extraer de ella las diferentes BBDD que existan.

Esta vista contiene 5 columnas diferentes pero a nosotros solo nos interesa una: schema_name la cual va a contener el nombre de las BBDD.

Más información acerca de las diferentes columnas: [Documentación de MySQL](https://dev.mysql.com/doc/refman/8.0/en/schemata-table.html)

Consulta:

```sql
-1’
UNION SELECT schema_name, null
FROM INFORMATION_SCHEMA.SCHEMATA;#
```

![alt text](./images/7-SQLI.png)

_TABLES._

El siguiente paso una vez sabemos las BBDD es conocer las tablas que estas BBDD contienen, a nosotros nos interesa la BD dvwa. Esta información se encuentra en la vista _INFORMATION_SCHEMA.TABLES_ que está compuesta por muchas columnas de las cuales a nosotros solo nos interesan dos:

table_schema la cual relaciona la tabla con la BD a la que pertenece.
table_name la cual contiene el nombre de la tabla.
Mas informacion de las diferentes columnas: [Documentación de MySQL](https://dev.mysql.com/doc/refman/8.0/en/tables-table.html)

Por lo cual si quisiéramos obtener todas las tablas de una BD inyectamos la siguiente consulta:

```sql
-1’
UNION SELECT table_name, null
FROM INFORMATION_SCHEMA.TABLES
WHERE table_schema LIKE ‘dvwa’;#
```

![alt text](./images/9-sqli.png)

_COLUMNS._

Ya tenemos el nombre de las tablas, ahora nos queda saber qué columnas existen en estas tablas. Para ello consultamos la tabla _INFORMATION_SCHEMA.COLUMNS_ donde tenemos las siguientes columnas:

- table_schema: la base de datos relacionada con la tabla que contiene la columna.
- table_name: la tabla relacionada con la columna
- column_name: el nombre de la columna
- column_type: el tipo de la columna. También nos da información acerca de la precisión o el tamaño máximo permitido.

Más información acerca de las diferentes columnas: [Documentación de MySQL](https://dev.mysql.com/doc/refman/8.0/en/columns-table.html)

Por lo tanto, para obtener las diferentes columnas de la tabla users debemos inyectar la siguiente consulta:

```sql
-1’
UNION SELECT column_name, column_type
FROM INFORMATION_SCHEMA.COLUMNS
WHERE table_schema LIKE ‘dvwa’ AND table_name LIKE ‘users’;#
```

![alt text](./images/10-sqli.png)

Pues ya sabemos la tabla y sus columnas, una vez aquí ya podemos consultar, añadir, eliminar o modificar registros según los permisos que tenga el usuario con el que se realizan las consultas.

Consulta:

```sql
-1’
UNION SELECT user, password
FROM dvwa.users;#
```

![alt text](./images/11-sqli.png)

Fuentes.

- Libro “Hacking de aplicaciones web: SQL Injection” de Enrique Rando y Chema Alonso.
- [https://manuales.guebs.com/mysql-5.0/information-schema.html#information-schema-tables](https://manuales.guebs.com/mysql-5.0/information-schema.html#information-schema-tables)
- [https://www.lucidchart.com/pages/es/que-es-un-esquema-de-base-de-datos](https://www.lucidchart.com/pages/es/que-es-un-esquema-de-base-de-datos)
- [https://dev.mysql.com/doc/refman/8.0/en/information-schema.html](https://dev.mysql.com/doc/refman/8.0/en/information-schema.html)
- [https://dba.stackexchange.com/questions/25667/deny-access-to-information-schema-in-sql-server](https://dba.stackexchange.com/questions/25667/deny-access-to-information-schema-in-sql-server)
