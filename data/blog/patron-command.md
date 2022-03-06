---
title: Patrón Command
date: '2018-08-05'
tags: ['Patterns']
draft: false
summary: La idea principal de este patrón es; “Encapsular una petición como un objeto, de modo que puedan parametrizarse otros objetos con distintas peticiones o colas de peticiones y proporcionar soporte para realizar operaciones que puedan deshacerse”.
---

## Patrón Command

La idea principal de este patrón es:

_“Encapsular una petición como un objeto, de modo que puedan parametrizarse otros objetos con distintas peticiones o colas de peticiones y proporcionar soporte para realizar operaciones que puedan deshacerse”._

Dicho con mis palabras sería encapsular la petición de una acción en un objeto que solo contenga los datos necesarios para la acción y separarla de la implementación. De esta forma se nos quedarían dos capas.

Una sería la orden que podría ser un simple DTO, pero por experiencia también podemos delegarle algunas responsabilidades como validar datos de entrada o formatear datos de una forma específica para el dominio.

Por otro lado tendríamos el manejador de la orden que tendría la implementación de la orden, luego en la explicación práctica entraremos más en detalles.

Para la explicación práctica imaginemos la funcionalidad ‘guardar un comentario’ de una foto en una red social.

Los actores son:

**La orden**: es la petición de la acción encapsulada en un objeto, a nivel de código será un DTO con los setters privados. En él podríamos hacer validaciones a los campos con los que va a trabajar el manejador de la orden, como por ejemplo comprobar si el comentario de la foto no está vacío. Esto lo podemos hacer estableciendo el constructor como privado y creando un método estático que nos retorna la instancia del objeto después de hacer las validaciones.

Si imaginamos la orden para la funcionalidad de guardar un comentario podría ser a

```csharp
public class SaveCommentaryCommnad
{
  public int UserId { get; private set; }
  public int PictureId { get; private set; }
  public string Commentary { get; private set; }

  public static SaveCommentaryCommnad Build(
    int userId,
    int pictureId,
    string commentary)
  {
    if(IsCommentaryEmptyOrNull(commentary)){
      throw new CommentaryCanNotBeEmptyOrNullException();
    }

    return new SaveCommentaryCommnad(
      userId: userId,
      pictureId: pictureId,
      commentary: commentary);
  }

  private SaveCommentaryCommnad(
    int userId,
    int pictureId,
    string commentary)
  {
    UserId = userId;
    PictureId = pictureId;
    Commentary = commentary;
  }

  private static bool IsCommentaryEmptyOrNull(string commentary)
  {
    return string.IsNullOrWhiteSpace(commentary);
  }
}
```

Es una capa superior al manejador de la orden, en este ejemplo si el comentario que se intenta guardar para la foto es un vacío lanza una excepción con el error. Excepción que luego trataremos en una capa superior, por ejemplo, un controlador asociado a una petición POST.

**El manejador de la orden**: es la capa más interna del patrón donde está la funcionalidad principal. El objeto que representa esta capa debería de tener una única responsabilidad, siguiendo con el ejemplo anterior si este manejador guarda un comentario única y exclusivamente debería de realizar esa tarea. Las dependencias que tuviera el manejador como por ejemplo los repositorios para acceder a nuestro sistema de persisitencia se los debemos inyectar por parámetro para que lo utilice cumpliendo con los principios [SOLID](https://www.genbeta.com/desarrollo/solid-cinco-principios-basicos-de-diseno-de-clases).

De esta forma dependemos de abstracciones y no de implementaciones, si en un futuro queremos cambiar de sistema de persistencia simplemente tendríamos que implementar un nuevo repositorio cumpliendo la interfaz que ya tenemos y reemplazarla en el manejador.

Todos los manejadores que tengamos deberían de mostrar la misma API, estos sólo deberían de tener un único método público que deberían de llamarse todos igual por simetría, ejemplo: ‘Execute’, ‘Invoke’, ‘Do’. Esto es algo que debería de quedar reflejado en un estándar para el equipo de desarrollo.

Así quedaría a nivel de código el manejador de la orden para el ejemplo de la funcionalidad anterior:

```csharp
public class SaveCommentaryHandler
{
 private readonly UserRepository userRepository;
 private readonly CommentaryRepository commentaryRepository;

 public SaveCommentaryHandler(
   UserRepository userRepository,
   CommentaryRepository commentaryRepository)
 {
   this.userRepository = userRepository;
   this.commentaryRepository = commentaryRepository;
 }

 public void Execute(SaveCommentaryCommnad command)
 {
   var user = userRepository.getBy(userId: command.userId);
   var commentary = new Comentary(
     userId: command.userId,
     userNick: user.nick,
     pictureId: command.pictureId,
     commentary: command.commentary
   );
   commentaryRepository.save(commnetary);
 }
}
```

Como podemos ver en el código he imaginado que para guardar el comentario nos es necesario conocer datos que no nos llegan con la orden, para este ejemplo el nick del usuario. Para recuperarlo utilizamos un repositorio que tiene la responsabilidad de preguntar a nuestro sistema de persistencia por un usuario con un determinado identificador. Como vemos la implementación de esta responsabilidad está extraída en un objeto que utiliza nuestro manejador como dependencia ya que el solamente debe guardar el comentario.

En el caso de que nuestro manejador tuviera que realizar tareas secundarias como por ejemplo enviar emails podemos despachar eventos de negocio que realicen estas tareas, de forma sincrona o asincrona utilizando alguna cola como podria ser RabbitMQ. Podemos imaginar que necesitamos enviar un email en nuestro ejemplo, nuestro manejador de la orden una vez terminara de hacer su función despachará un evento que podría ser _‘CommentaryAddedToPicture’_ el cual se encargaría de realizar esas tareas secundarias.

**El invocador**: el último actor de nuestro patrón es el invocador, será el objeto que reciba una petición, monte la orden y se lo pase al manejador de la orden. Si imaginamos que estamos en un backend web este actor podría ser un controlador asociado a una ruta POST.

En la petición de este controlador nos llegaría la información recogida del FrontEnd con todo lo necesario para montar la orden.

Para que el invocador no conozca el manejador que está asociado a una orden se puede utilizar un ‘Command bus’. Técnica al que tengo pensado dedicarle un post más adelante.

Para el ejemplo actual no simulare estar utilIzando un bus de comando y haré que el invocador conozca al manejador que tiene que ejecutar.

En código un controlador quedaría de esta manera:

```csharp
public class SaveCommentaryController : Controller
{
    private SaveCommentaryHandler saveCommentaryHandler;

    public SaveCommentaryController(
      SaveCommentaryHandler saveCommentaryHandler)
    {
      saveCommentaryHandler = saveCommentaryHandler;
    }

    public ActionResult Do(SaveCommentaryRequest request)
    {
      try{
        var command = SaveCommentaryCommand.Build(
          userId: request.userId,
          pictureId: request.pictureId,
          commentary: request.commentary);
        saveCommentaryHandler.Execute(command: command);
        return Json(new { status = 200, message = request.pictureId });
      }
      catch (CommentaryCanNotBeEmptyOrNullException exception)
      {
        return Json(new { status = 400, error = "El comentario no puede estar vacío." });
      }
      catch (Exception exception)
      {
        return Json(new {status = 400, error = "Excepción no controlada." });
      }
    }
}
```

Eso de retornar un Json como respuesta del controlador es una basura, se debería de retornar respuestas que interprete el navegador con un 200 en el caso bueno y un 400 para los errores. Pero me sirve para salir del paso.

Personalmente pienso que este patrón no añade mucha complejidad a nuestras implementaciones y nos aporta ventajas de mucho valor como son:

**Reutilización del código.**

El código anterior se podría reutilizar para diferentes puntos de entrada a nuestro dominio, por ejemplo, si tuviéramos una aplicaciones web y una API para dar servicio a una APP ambos puntos de entrada utilizarían la misma orden.

**Fácilmente Testable.**

Nuestros manejadores solo tienen una única responsabilidad y gracias a la inversión de dependencias es sencillo hacer dobles de prueba de esas dependencias para testear nuestro código.

Por otra parte si no añadimos responsabilidades a la orden será un simple DTO. Si se la añadimos como en el ejemplo no es muy complicado testear esas validaciones.

**Código fácilmente ampliable.**

Como vimos en el ejemplo práctico esto es muy sencillo si despachamos eventos en nuestros manejadores.

**Bajo acoplamiento y código limpio.**

Al cumplir con los principios SOLID nuestro código queda muy limpio, legible y desacoplado.

Hasta aquí el post, cualquier feedback es bienvenido. un saludo.

Fuentes:

- [https://medium.com/all-you-need-is-clean-code/https-medium-com-all-you-need-is-clean-code-patron-command-fde0e5243cd9](https://medium.com/all-you-need-is-clean-code/https-medium-com-all-you-need-is-clean-code-patron-command-fde0e5243cd9)
- [https://danielggarcia.wordpress.com/2014/04/28/patrones-de-comportamiento-ii-patron-command/](https://danielggarcia.wordpress.com/2014/04/28/patrones-de-comportamiento-ii-patron-command/)
