---
title: Tests parametrizables — Ejemplo en TypeScript.
date: '2020-07-30'
tags: ['Testing', 'Refactoring']
draft: false
summary: Intentamos escribir código limpio y simple para que sea etendible y fácil de mantener pero es común no tratar el código de nuestros tests de la misma forma, cuando en realidad, son igual de importantes que el código de la funcionalidad que prueban. Parametrizar un tests nos ayudará a simplificar un conjunto de tests grande donde hemos encontrado un patrón que se repite.
---

# Tests parametrizables — Ejemplo en TypeScript.

El ejemplo propuesto en este artículo se ha escrito en TypeScript con la librería de testing Jest. No obstante, los concepto son extrapolables a cualquier leguaje/librería de tests.

Intentamos escribir código limpio y simple para que sea etendible y fácil de mantener pero es común no tratar el código de nuestros tests de la misma forma, cuando en realidad, son igual de importantes que el código de la funcionalidad que prueban.

Parametrizar un tests nos ayudará a simplificar un conjunto de tests grande donde hemos encontrado un patrón que se repite. Para ser más ilustrativos veamos la siguiente historia de usuario:

```
Como usuario de la plataforma X, necesito poder registrarme indicando mi nombre, número de telélefono, email y contraseña.

Pruebas de aceptación:

- Los datos nombre, número de teléfono, email y contraseña son obligatorios, en caso de no indicarse en el formulario de registro se debe mostrar un error.
```

Dada la historia de usuario anterior llegará un momento donde necesitaremos crear esas validaciones para los datos del formulario. Un posible primer test podría ser el siguiente:

```javascript
test('name is required', () => {
  const request = new UserSigningUpRequest({
    name: '',
    phoneNumber: '123121212',
    email: 'antonio@email.com',
    password: 'miPassSuperSegura;)',
  })

  const result = validator.validate(request)

  expect(result).toMatchObject({ isValid: false })
  expect(result).toMatchObject({ error: [{ fieldId: 'name', errorCode: 'required' }] })
})
```

En el test estamos testando de manera unitaria un artefacto que validará un objeto que representa la petición de registro del usuario. En el caso de que enconstrase algún error de validación nos devolvería una lista de errores, compuesta por el identificador del campo y el identificador del error. Si volvemos a la historia de usuario veremos que no solo el campo del nombre es obligatorio, todos los demás también lo son. Nuestro de set de tests tendría esta pinta:

```javascript
test('name is required', () => {
  /**/
})
test('phone number is required', () => {
  /**/
})
test('email is required', () => {
  /**/
})
test('password is required', () => {
  /**/
})
```

Si somos un poco observadores encontraremos rápidamente un patrón que se repite en todos los tests. La preparación, ejecución y las aserciones de los tests son idéntenticas menos por los campos que se están probando. Llegados a este punto podemos plantearnos refactorizar nuestros tests y crear un único test que se ejecute tantas veces como validaciones haya.

Veamos las partes del test que podemos parametrizar. Para ello marcaré con la palabra _PARAM_ los puntos donde encontramos diferencias en los tests:

```javascript
test(PARAM, () => {
  const request = PARAM

  const result = validator.validate(request)

  expect(result).toMatchObject({ isValid: false })
  expect(result).toMatchObject({ error: [{ fieldId: PARAM, errorCode: PARAM }] })
})
```

Encontramos 4 parámetros que nos harán falta:

- **La descripción del test:** Testaremos diferentes casos por cada ejecución de nuestro test por lo que es muy importante indentificar qué estamos probando en cada momento.
- **La construcción de la petición de registro:** Para testar los diferentes casos necesitaremos instanciar el objeto que representa la petición de registro del usuario en un estado diferente por cada test, para ello nos apoyaremos en una función constructora con parámetros opcionales para nuestro objecto:

```javascript
interface IBuildUserSigningUpRequestFuncParams {
  name?: string;
  phoneNumber?: string;
  email?: string;
  password?: string;
}

function buildUserSigningUpRequest({
  name = 'Antonio',
  phoneNumber = '123121212',
  email = 'antonio@email.com',
  password = 'miPassSuperSegura',
}: IBuildUserSigningUpRequestFuncParams) {
  return new UserSigningUpRequest({
    name: name,
    phoneNumber: phoneNumber,
    email: email,
    password: password,
  })
}
```

- **El identificador de campo esperado:** Cada campo del formulario tendrá un idententificador único asociado.
- **El identificador del código de error esperado:** Cada error de validación que podamos tener tendrá un idententificador único asociado.

Una vez identificados los puntos que cambian en cada test podemos crear una lista de casos de prueba. Será una lista de objetos donde cada objeto tendrá una propiedad que configurará cada unos de los parámetros de nuestro test. Veamos un ejemplo:

```javascript
class FieldValidationTestCase {
    readonly description: string;
    readonly buildUserSigningUpRequestFunc: () => UserSigningUpRequest;
    readonly expectedFieldId: string;
    readonly expectedErrorCode: string;

    constructor(
        description: string,
        buildUserSigningUpRequestFunc: () => UserSigningUpRequest,
        expectedFieldId: string,
        expectedErrorCode: string) {

        this.description = description;
        this.buildUserSigningUpRequestFunc = buildUserSigningUpRequestFunc;
        this.expectedFieldId = expectedFieldId;
        this.expectedErrorCode = expectedErrorCode;
    }
};

const fieldsValidationsTestsCases: FieldValidationTestCase[] = [
    new FieldValidationTestCase(
        "name is required",
        () => buildUserSigningUpRequest({name: ""}),
        "name",
        "required"
    ),
    new FieldValidationTestCase(
        "phoneNumber is required",
        () => buildUserSigningUpRequest({phoneNumber: ""}),
        "phoneNumber",
        "required"
    )
    //.....
];
```

Una vez creado todos los casos de prueba duplicaremos uno de los test que ya tengamos hecho y lo ejecutaremos con cada uno de los casos de test de nuestra lista:

```javascript
fieldsValidationsTestsCases.forEach(testCase, () => {
  test(testCase.description, () => {
    const request = testCase.buildUserSigningUpRequestFunc()

    const result = validator.validate(request)

    expect(result).toMatchObject({ isValid: false })
    expect(result).toMatchObject({
      error: [{ fieldId: testCase.expectedFieldId, errorCode: expectedErrorCode }],
    })
  })
})
```

Llegados a este punto todos los demás tests sobrán y debemos borrarlos. Hemos pasado de tener N tests por cada validación a tener una lista de casos de tests y un único test. Si tuvieramos que cambiar el test porque el comportamiento de nuesto validator hubiera cambiado solamente necesitamos cambiar un único test y no N como nos hubiera pasado anteriormente. Además, añadir nuevos casos de test para nuevas validaciones es muy sencillo y limpio.

Hasta aquí hemos llegado, espero que te haya sido de utilidad lo explicado en este articulo y recuerda: la mejor forma de aprender es practicar.

Un saludo.
