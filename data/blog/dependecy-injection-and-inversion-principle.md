---
title: Inyección de dependencias + Principio de inversión de dependencias.
date: '2019-05-02'
tags: ['SOLID']
draft: false
summary: En este artículo quiero hablar de la letra ‘D’ de SOLID, que se conoce como el principio de inversión de dependencias o dependency inversion principle en inglés y cómo en combinación con la inyección de dependencias podemos pasar de un código altamente acoplado y con poca facilidad de testear a un código desacoplado y altamente testable.
---

## Inyección de dependencias + Principio de inversión de dependencias.

Cuando empezamos a preocuparnos por la arquitectura o la [testabilidad](https://www.globetesting.com/glosario/testabilidad/) de nuestras aplicaciones es obligatorio conocer los principios SOLID.

En este artículo quiero hablar de la letra ‘D’ de SOLID, que se conoce como el **principio de inversión de dependencias** o **dependency inversion principle** en inglés y cómo en combinación con la inyección de dependencias podemos pasar de un código altamente acoplado y con poca facilidad de testear a un código desacoplado y altamente testable.

Bajo mi punto de vista este es el principio SOLID que más valor aporta desde que lo conocemos por primera vez hasta que lo ponemos en práctica, ya que es muy sencillo de aprender e interiorizar.

El principio dice lo siguiente:

_Debemos depender de abstracciones y no de dependencias concretas._

Cuando leemos esto por primera vez puede que nos quedemos igual que al principio, por lo menos fue la sensación que yo tuve. Por esta razón a continuación vamos a ver porque es un problema depender directamente de implementaciones concretas y que beneficios nos aporta depender de abstracciones.

### El problema.

Para explicar el principio de inversión de dependencias vamos a imaginar que hemos implementado una característica en nuestro sistema para registrar a un usuario y la implementación de la clase que tiene la responsabilidad de dicho registro quedó así.

Todos los ejemplos expuestos en este artículo están escritos en C# pero el lenguaje de programación es completamente agnóstico en este caso.

```csharp
public class UserSignUpUseCase
{
   private readonly MySqlUserRepository userRepository;

   public  UserSignUpUseCase()
   {
       userRepository = new MySqlUserRepository();
   }

   public User Execute(UserSignUpRequest request)
   {
       var user = new User(
           email: request.Email,
           password: request.Password
       );
       return userRepository.Save(user);
   }
}
```

Como podemos ver es una implementación super solida y segura (nótese la ironía), pero para nuestro propósito es más que suficiente.

A primera vista podríamos decir que esta todo correcto, tenemos una clase llamada _UserSignUpUseCase_ que instancia en su constructor un repositorio de usuario implementado en MySql llamado _MySqlUserRepository_. Tiene un único método público que se encarga de crear al usuario y guardarlo en nuestro de sistema de persistencia.

Actualmente el diagrama de dependencias entre clases es el siguiente:

![Diagrama clases acopladas](./images/dip-1.png)

La flecha continua indica una dependencia directa entre clases.

Pues bien, aquí tenemos un grave error. Cuando hablamos antes de **depender de implementaciones concretas** nos estamos refiriendo a esto mismo, estamos instanciando nuestro repositorio MySql de usuarios en el constructor de nuestra clase.

Los dos grandes problemas que esto nos trae son los siguientes:

**Un cambio de sistema de persistencia implica un cambio muy costoso.**

Si en un futuro no queremos seguir persistiendo nuestros usuarios en una base de datos MySql y queremos cambiar a una base de datos no relacional como MongoDB estamos jodidos. Estamos jodidos porque deberemos de implementar el repositorio de usuario en MongoDB (el supuesto _MongoUserRepository_) siguiendo la firma del repositorio de MySql que usa actualmente la clase _UserSignUpUseCase_, de lo contrario vamos a tener que estar cambiando todas las partes del código donde queramos dar el cambio.

Como adición a esto, vamos a tener que ir reemplazando el repositorio antiguo por el nuevo en todos los archivos donde el antiguo se utilice, imagina tener que hacer esto con más de cien usos del repositorio de usuarios.

**No podemos crear test unitarios de la clase _UserSignUpUseCase_**

Esto es un problema bastante grande que nos surge por el acoplamiento que tenemos entre las clases.

Los test unitarios deberían de ser la base la cobertura de test en nuestro sistema, pero a esta clase no le podemos crear su test unitario. Sencillamente porque estamos instanciando directamente el repositorio de verdad en el constructor quedándonos sin la posibilidad de crear un doble de prueba del repositorio para falsear sus respuestas.

### La solución.

Bueno pues la solución al problema se divide en dos acciones, la primera es como dice el principio depender de una abstracción y no de una implementación concreta, y la segunda la inyección de dependencias.

La inyección de dependencias consiste simplemente en pasar las dependencias de la clase (el repositorio de usuarios) como parámetro en el constructor y no hacer la instancia dentro de él.

Es tan sencillo como suena, la clase quedaría de la siguiente forma:

```csharp
private readonly MySqlUserRepository userRepository;

public  UserSignUpUseCase(MySqlUserRepository userRepository)
{
   this.userRepository = userRepository;
}
```

¡Hey, ya podemos testear!

Cierto, al **inyectar la dependencia** podemos crear nuestros test unitarios sobre la clase _UserSignUpUseCase_ ya que tenemos la posibilidad de pasarle el doble de prueba del repositorio por el constructor en el momento en el que lo instanciamos.

El uso de la clase quedaría de la siguiente forma:

```csharp
public static class Factory
{
   public static UserSignUpUseCase UserSignUpUseCase()
   {
       var userRepository = new MySqlUserRepository();
       return new UserSignUpUseCase(userRepository);
   }
}
```

Como pueden ver hemos aplicado el patrón factoría para crear la instancia de la clase, esto es otra buena práctica.

Pero bueno todo esto está muy bien, ya podemos testear, pero aun seguimos con el primero problema. Cambiar de sistema de persistencia es una tarea costosa.

Bien, aquí entra en juego el principio de inversión de dependencias donde ya hemos visto que estamos dependiendo de una implementación concreta (nuestro _MySqlUserRepository_)

y lo que necesitamos es depender de una [abstracción](https://es.wikipedia.org/wiki/Abstracci%C3%B3n_%28inform%C3%A1tica%29), pero, ¿que es una abstracción?

Segun nuestra buena amiga wikipedia, una abstracción se refiere al énfasis en el “¿qué hace?” más que en el “¿cómo lo hace?”. Es decir, no nos interesa **la implementación concreta**, no nos interesa la clase _MySqlUserRepository_ porque **es la clase que sabe como se hacen las cosas**.

Nos interesa depender de algo que nos diga qué tenemos que hacer si queremos guardar a un usuario pero no nos diga cómo lo hacemos, aquí entran en juego **las interfaces**.

Una interfaz no es más que un contrato que establecemos entre la clase que utiliza la interfaz y la que la implementa, obligando a ambas partes a cumplir una firma y no poder corromperla.

Por lo que una vez creada nuestra nuestra interfaz y adaptando ambas partes para que la usen el código luce así.

Nuestra interfaz:

```csharp
public interface UserRepository
{
  User Save(User user);
}
```

Nuestro repositorio MySql:

```csharp
public class MySqlUserRepository : UserRepository
{
   public User Save(User user)
   {
       //implementation
       return null;
   }
}
```

Nuestra clase _UserSignUpUseCase_:

```csharp
private readonly UserRepository userRepository;

public  UserSignUpUseCase(UserRepository userRepository){
   this.userRepository = userRepository;
}
```

Con este simple paso, hemos empezado a depender de una abstracción.

Vemos el diagrama de dependencias en este momento:

![Diagrama clases no acompladas](./images/dip-2.png)

La dependencia directa ahora es con la interfaz que representa nuestro contrato y no con la implementación concreta. Por lo que podríamos tener N implementaciones de repositorios de usuario y cambiarlas en la factoría de la clase UserSignUpCase sin ningún coste y sin romper nada.

![Diagrama clases no acompladas](./images/dip-3.png)

Con estos simples pasos hemos pasado de un código altamente acoplado y con poca testablidad a un código fácil de cambiar y complementamente testable.

Si te ha gustado el articulo o tienes alguna recomendación que te gustaría compartir conmigo puedes encontrarme en twitter, el feedback siempre es bienvenido.

Gracias por leer, un saludo.

Referencias:

- Libro Clean Architecture de Robert C. Martin.
- [Principio de inversión de dependencias, CodelyTv](https://codely.tv/blog/screencasts/solid-principio-inversion-dependencias/)
- [Wikipedia](https://es.wikipedia.org/wiki/Abstracci%C3%B3n_%28inform%C3%A1tica%29)
- [https://www.globetesting.com/glosario/testabilidad/ ](https://www.globetesting.com/glosario/testabilidad/)
