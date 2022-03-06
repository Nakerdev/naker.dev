---
title: Patrón Modelo-Vista-Presentador con vista pasiva.
date: '2018-10-05'
tags: ['Patterns']
draft: false
summary: El patrón MVP es utilizado para desarrollar interfaces de usuario.
---

## Patrón Modelo-Vista-Presentador con vista pasiva.

_El patrón MVP es utilizado para desarrollar interfaces de usuario._

Sus principales características son:

- La vista no conoce el modelo.
- El presentador es independiente de la tecnología de interfaz de usuario.

Su principal ventaja bajo mi punto de vista es que aislamos la logia de nuestra aplicación de la vista, esto **nos permite tener una cobertura de tests del cien por cien de nuestra lógica**. Nuestra vista no tendrá nada de lógica y las únicas responsabilidades que tendrá será la presentación de los datos al usuario y notificar al presentador cuando ocurra un evento de entrada, como por ejemplo, el click de un botón.

Nuestra vista a nivel de responsabilidades tiene que ser tal que así.

![alt text](./images/mvp-1.jpeg 'Gato sentado en un sillón')

También tenemos la posibilidad de poder utilizar diferentes tecnologías en nuestras vistas, al tener **totalmente desacoplada la vista de la lógica de la aplicación** tenemos total libertad de utilizar la tecnología que más nos convenga en cada momento. El único problema de esto es que **capamos la tecnología** ya que nos vemos obligados a implementarla de acuerdo a como funciona nuestro patrón.

### ¿Cómo funciona?

Este patrón implementa el patrón _observer_ para que la vista notifique al presentador de los eventos de entradas que ocurren en la aplicación. La vista expone funciones de suscripción que utiliza el presentador para pasarle los manejadores antes los posibles eventos de entrada. Esto puede sonar más complicado de lo que parece, veamos un ejemplo de código

```javascript
function presenter(view) {
  view.subscribeToClickEventRequested(clickEventRequestedHandler)

  function clickEventRequestedHandler() {
    // do anything
  }
}

function view() {
  let clickEventRequestedHandler = () => {}

  function subscribeToClickEventRequested(handler) {
    clickEventRequestedHandler = handler
  }

  let button = document.getElementById('button')
  button.addEventListener('click', subscribeToClickEventRequested)

  return {
    subscribeToClickEventRequested: subscribeToClickEventRequested,
  }
}
```

En el ejemplo anterior vemos que la vista expone un metodo de subscripcion llamado _subscribeToClickEventRequested_ el cual utilizará el presentador para suscribirse al evento de un botón en la vista. En el momento en el que se suscribe a la vista le pasa el manejador para ese evento, para este ejemplo es la función _clickEventRequestedHandler_. De esta manera cuando el usuario pulse sobre el botón va a ejecutar la lógica que se encuentra en el presentador.

La vista va a exponer una API tan amplia como acciones se puedan realizar en la interfaz.

Vamos a hacer un ejemplo de lo comentado anteriormente, supongamos que somo una empresa la cual tiene una página web y necesitamos guardar la información de contacto de una persona a través de un formulario para poder contactar con ella. Para este ejemplo voy a utilizar una [Api pública](https://jsonplaceholder.typicode.com/) que me expone un recurso para registrar a una persona.

¡Comencemos!

Empezaré por la lógica, donde únicamente tendremos dos casos de prueba:

- Se ha registrado correctamente a la persona.
- Hemos recibido un error del servidor a la hora de registrar a una person

Comenzando con nuestro ciclo de TDD, esta sería la primera prueba en roja que debemos pasar. El caso bueno

```javascript
//Faltan imports y configuración de mocks - codigo completo en https://github.com/Naker90/MVP-POC

let registerPersonRequestedHandler = () => {}

beforeEach(() => {
  view.subscribeToRegisterPersonRequested.mockImplementation((handler) => {
    registerPersonRequestedHandler = handler
  })
  presenter(view, client)
})

test('shows success message when register person successfully', () => {
  const person = {
    name: 'anyName',
    surname: 'anySurname',
    email: 'any@email.com',
    telephone: '666222444',
  }
  client.registerPerson.mockImplementation((request, successHandler) => {
    expect(request.name).toBe(person.name)
    expect(request.surname).toBe(person.surname)
    expect(request.email).toBe(person.email)
    expect(request.telephone).toBe(person.telephone)
    successHandler()
  })

  registerPersonRequestedHandler(person)

  expect(view.showSuccessMessage).toHaveBeenCalled()
})
```

El test es muy sencillo, he omitido la configuración de los mocks y las importaciones para no tener ruido.

Creamos un doble de prueba para la función de suscripción de la vista, de esta manera podremos simular el evento del usuario ejecutando la función _registerPersonRequestedHandler_.

He diseñado el test de tal forma que aparece un nuevo actor, el cliente. Esta dependencia será la encargada de hacer las peticiones AJAX.

el código para pasar este test sería el siguiente:

```javascript
function presenter(view, client) {
  view.subscribeToRegisterPersonRequested(registerPersonRequestedHandler)

  function registerPersonRequestedHandler(personData) {
    let request = {
      name: personData.name,
      surname: personData.surname,
      email: personData.email,
      telephone: personData.telephone,
    }
    client.registerPerson(request, successCallback)

    function successCallback() {
      view.showSuccessMessage()
    }
  }
}
```

El código de la vista y del cliente no tendrán más que las definiciones de las funciones que exponen, ya que de momento no necesitaremos implementarlas.

Como podemos ver, al tener la lógica extraída, testear resulta una tarea muy sencilla. El siguiente caso de prueba será la acción ante una respuesta errónea del servidor, lo voy a omitir ya que es muy similar al anterior.

Una vez hayamos terminado el ciclo de TDD con todos los casos tendríamos terminada la parte del presentador. El siguiente paso sería implementar la vista, simplemente interactuar con el HTML. La parte de la vista la podemos testear con test de integración, un primer posible test sería el siguient

```javascript
/Faltan importaciones, configuracion de mocks y funcion loadTemplate

describe("register person", function() {

    beforeEach(function (done) {
        loadTemplate("../../src/index.html", function (html) {
            document.body.innerHTML = html;
            presenter(view(), client);
            done();
        });
    });

    it("loads the markup", function () {
        expect(document.querySelector("h1")).not.toBeNull();
    });

    it("shows success message when register person", function () {
        let message = document.getElementById("message");
        let registerButton = document.getElementById("registerButton");
        client.registerPerson
            .mockImplementation((request, successHandler) => {
                successHandler();
            });

        registerButton.click();

        expect(message.style.color).toBe("green");
    });
}
```

Omitiré el segundo test ya que es muy similar al anterior, la implementación completa de la vista quedaría de la siguiente manera:

```javascript
function view() {
  let registerPersonRequestedHandler = () => {}

  let name, surname, email, telephone, registerButton, message

  function initialize() {
    name = document.getElementById('name')
    surname = document.getElementById('surname')
    email = document.getElementById('email')
    telephone = document.getElementById('telephone')
    registerButton = document.getElementById('registerButton')
    message = document.getElementById('message')

    registerButton.addEventListener('click', function () {
      registerPersonRequestedHandler({
        name: name.textContent,
        surname: surname.textContent,
        email: email.textContent,
        telephone: telephone.textContent,
      })
    })
  }

  function subscribeToRegisterPersonRequested(handler) {
    registerPersonRequestedHandler = handler
  }

  function showSuccessMessage() {
    message.innerHTML = 'Persona registrada con exito.'
    message.style.display = 'block'
    message.style.color = 'green'
  }

  function showErrorMessage() {
    message.innerHTML = 'Hubo un problema, intentelo de nuevo en unos minutos.'
    message.style.display = 'block'
    message.style.color = 'red'
  }

  initialize()

  return {
    subscribeToRegisterPersonRequested: subscribeToRegisterPersonRequested,
    showSuccessMessage: showSuccessMessage,
    showErrorMessage: showErrorMessage,
  }
}
```

El cliente es simplemente un objeto que contiene la llamada AJAX hacia la API correspondiente.

Una vez terminado lo unico que quedaria es inicializar el presentador pasándole las dependencias en el bundle de la vista.

El ejemplo completo lo puedes ver en [mi repositorio de GitHub](https://github.com/Naker90/MVP-POC)

Bajo mi punto de vista los aspectos negativos de este patrón son pocos:

**Complejidad adicional** — como es evidente aplicar el patrón añadirá complejidad a nuestro proyecto, no es una complejidad excesiva pero necesitaremos familiarizarnos con él.

**La experiencia marca la diferencia** — aplicar el patrón de una manera correcta sobre un contexto específico es una tarea que requiere experiencia.

**Capamos las tecnologías** — al utilizar alguna tecnología para nuestra interfaz de usuario nos vemos obligados a implementarla de acuerdo a como funciona nuestro patrón.

Nada más, cualquier feedback es bienvenido.

Un saludo.

Referencias:

https://www.imaginanet.com/blog/patron-mvp.html
