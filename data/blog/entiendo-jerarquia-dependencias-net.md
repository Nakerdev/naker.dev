---
title: ¿Por qué tengo que usar BindingRedirect? Entendiendo la jerarquía de dependencias en .NET
date: '2023-08-09'
tags: ['.NET', 'WEB']
draft: false
summary: Entendiendo la jerarquía de dependecias en .NET y por qué en algunos casos debemos usar BindingRedirect en nuestros proyectos. 
images: ['/static/images/jerarquia-dependencias-net/binding-redirect-twitter-card.png']
---

## Tabla de contenidos
1. [Introducción](#introduccion)
2. [Las desgracias siempre en producción... Gracias GAC.](#gracias-gac)
3. [La raíz del problema, la jerarquía de dependencias](#jerarquia)
4. [Solución del problema](#solucion)
    1. [El BindingRedirect](#binding)
    2. [Igualar versiones de dependencias](#igualar)
5. [Conclusión](#conclusion)

<a name="introduccion"/>
## Introducción.

Si trabajas con .NET probablemente habrás visto este error antes, o por lo menos uno parecido con el *Nuget* de turno:

```bash
System.IO.FileLoadException: "Could not load file or assembly "System.Runtime.CompilerServices.Unsafe, Version=4.0.4.1, Culture=neutral, PublicKeyToken=b03f5f7f11d50a3a" or one of it's dependences. The found Assembly's manifest definition does not match the Assembly reference. (Exception from HRESULT: 0x80131040)"
```

Si no sabemos a qué se debe el error, nuestra primera acción es buscar en San Google y con una alta probabilidad encontraremos una entrada de StackOverflow de alguien con el mismo problema que nosotros. La solución... Un *BindingRedirect*:

```cs
<dependentAssembly>  
    <assemblyIdentity name="System.Runtime.CompilerServices.Unsafe" publicKeyToken="b03f5f7f11d50a3a" culture="neutral" />  
    <bindingRedirect oldVersion="0.0.0.0-4.0.4.1" newVersion="4.0.4.1" />  
</dependentAssembly>  
```

Si eres de los que hace *Copy & Paste Driven Development* probablemente el *BindingRedirect* anterior solucione el problema, pero no es magia.

La intención de este artículo es entender por qué tenemos que incluir esa configuración en nuestra aplicación, cual es la raíz del problema y que otras alternativas tenemos para solucionarlo.

<a name="gracias-gac"/>
## Las desgracias siempre en producción... Gracias GAC.

Un log de error en producción, el motivo, una excepción *System.IO.FileLoadException* que me dice que no puede cargar una versión especifica de un *Nuget*. En cuanto me dispongo a reproducir el error en mi entorno local ¡sorpresa! funciona correctamente, pero ¿por qué?

El (GAC)[https://learn.microsoft.com/es-es/dotnet/framework/app-domains/gac] (caché global de ensamblados) es una memora caché donde se almacenan las diferentes dependencias que comparten las aplicaciones que usas en tu equipo (únicamente las aplicaciones que corren sobre la [CLR](https://es.wikipedia.org/wiki/Common_Language_Runtime)). Cuando una aplicación necesita usar una librería en tiempo de ejecución la intentará cargar en primer lugar de su directorio *bin/*, en caso de no encontrarla, irá al GAC. Si la encuentra seguirá el hilo de ejecución con normalidad. En nuestro entorno local, a no ser que lo hayamos quitado manualmente, tendremos habilitada la caché global de ensamblados y muchos errores por fallos de carga de versiones de librerías no podremos reproducirlos.

Lo normal es que el entorno de producción no disponga del GAC y que, si la dependencia que intenta cargar nuestra aplicación no se encuentra en el directorio *bin/*, la aplicación falle ya que no tiene otro lugar a donde ir a buscar la DLL.

Para evitar que estos errores lleguen a producción la mejor opción es tener entornos de PRE o UAT que sean réplicas del entorno de producción y que tampoco tengan el GAC habilitado. Realizando pruebas automáticas o manuales sobre la aplicación en esos entornos nos ayudará a que el error no llegue al usuario final.

<a name="jerarquia"/>
## La raíz del problema, la jerarquía de dependencias

Tenemos el siguiente escenario: Una aplicación web que depende de una librería, por ejemplo, de la librería *ServiceStack*.

![Query param](/static/images/jerarquia-dependencias-net/1.png)

El momento en el que compilamos el proyecto, el compilador generará la carpeta *bin/* de la aplicación en la cual se encontrará el ejecutable de nuestra aplicación web y la DLL de nuestra dependencia *ServiceStack@6.0.10*. Hasta aquí todo bien, pero debemos saber que ServiceStack también depende de muchas otras dependencias por lo que en nuestra carpeta *bin/* no solo contendrá las dependencias directas de nuestra aplicación sino también todas aquellas dependencias de nuestras dependencias. La foto quedaría más bien así:

![Query param](/static/images/jerarquia-dependencias-net/2.png)

El árbol de dependencias sería tan grande como dependencias tuvieran nuestras dependencias directas.

¡Ahora! Qué pasaría si nuestra aplicación necesita depender directamente de *System.Runtime.CompilerService.Unsafe*. Si nos fijamos en la imagen anterior, esa dependecia, es a su vez una subdependencia de *ServiceStack*. La foto quedaría así:

![Query param](/static/images/jerarquia-dependencias-net/3.png)

Aquí debemos empezar a diferencias los diferentes niveles, las depenecias directas de nuestra aplicación quedaría en el primer nivel de la jerarquía y las dependencias de nuestras dependencias quedarían en un segundo nivel de la jerarquía. Aquí empiezan los problemas...

Si nos fijamos en la foto anterior *System.Runtime.CompilerService.Unsafe* no solo está en diferentes niveles de jerarquía de dependencias sino que además está en versiones distintas. La aplicación depende de la versión 4.2.0 mientras que *ServiceStack@6.0.10* depende de la versión 4.0.1:

* WebApp -> **System.Runtime.CompilerService.Unsafe@4.2.0**
* WebApp -> ServiceStack@6.0.10 -> **System.Runtime.CompilerService.Unsafe@4.0.1***

¿El compilador nos deja que lleguemos a este escenario? Pues sí...

Debemos saber que nunca podremos tener en el *bin/* de nuestra aplicación la misma DLL pero con versiones diferentes, es decir, nunca tendremos dos versiones de la DLL *System.Runtime.CompilerService.Unsafe@4.2.0* en el directorio de nuestra aplicación web.

El compilador priorizará los niveles de jerarquía y si encuentra la misma dependecia en diferentes niveles (como ocurre con *System.Runtime.CompilerService.Unsafe*) priorizará la versión de la dependecia del primer nivel, aquella que usa la aplicación directamente. Con esto ya nos podemos hacer una idea de porque salta la excepción *System.IO.FileLoadException* en tiempo de ejecución. El *bin/* de nuestra aplicación contendrá la DLL de *System.Runtime.CompilerService.Unsafe@4.0.2* pero cuando nuestra aplicación cargue la DLL de *ServiceStack* y esta, a su vez, cargue la DLL de *System.Runtime.CompilerService.Unsafe@4.0.2* no la encontrará ya que la versión que está buscando no existe.

<a name="solucion"/>
## Solución del problema

Existen dos formas de solucionar este problema:

<a name="binding"/>
## El BindingRedirect

Incluyendo la siguiente configuración a nuestra aplicación el problema se resuelve:

```cs
<dependentAssembly>  
    <assemblyIdentity name="System.Runtime.CompilerServices.Unsafe" publicKeyToken="b03f5f7f11d50a3a" culture="neutral" />  
    <bindingRedirect oldVersion="0.0.0.0-4.2.0.0" newVersion="4.2.0.0" />  
</dependentAssembly>  
```

Lo que estamos haciendo exactamente con la configuración anterior es decirle a la aplicación que siempre que necesite cargar la DLL de *System.Runtime.CompilerServices.Unsafe* use la versión 4.2.0, que es aquella que sabemos que estará en el directorio de nuestra aplicación. Siempre que la aplicación, en tiempo de ejecución trate de cargar cualquier versión de la dependecia que se encuentre entre la versión 0.0.0 y la versión 4.2.0 cargará la 4.2.0. En resumidas cuentas, cuando *ServiceStack* pida la versión 4.0.2 de la DLL la aplicación cargará la 4.2.0 por defecto.

**Esta solución tiene un claro inconveniente y es la retrocompatibilidad de las versiones.** Debemos extremas las precauciones cuando usemos *BindingRedirect* y estar muy seguros de que las versiones de la DLL que nuestra aplicación está solicitando en tiempo de ejecución son compatibles con la versión de la DLL que nosotros estamos cargando a la fuerza.

<a name="igualar"/>
## Igualar versiones de dependencias

Igualar las versiones de las dependencias sería la mejor solución para evitar el *BindingRedirect*, bajar la versión de *System.Runtime.CompilerServices.Unsafe* de primer nivel a la versión del segundo nivel solucionará el problema (de la 4.2.0 a la 4.0.1) y evitará que metamos configuración en la aplicación ya que en tiempo de ejecución todo el código solicitará la misma versión de la librería. 

<a name="conclusion"/>
## Conclusión

Aunque igualar las versiones de dependencias es la mejor solución no siempre es posible, por la gran cantidad de dependencias que tenemos o por los tantos niveles de jerarquía. Hay veces que no nos queda otra que lidiar con el *BindingRedirect* pero esta vez siendo conscientes del por qué lo usamos y cómo lo estamos usando.

Gracias por leer.