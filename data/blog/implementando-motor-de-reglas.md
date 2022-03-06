---
title: Implementando nuestro propio motor de reglas - Java.
date: '2017-10-25'
tags: ['Java']
draft: false
summary: Un motor de reglas es una estrategia en programación para ejecutar acciones acorde a unas condiciones, esto podría sonar como si fuese un simple condicional if-then y en realidad la idea es la misma pero con el motor de reglas tendremos un software mucho más escalable y legible.
---

## Implementando nuestro propio motor de reglas - Java

Un motor de reglas es una estrategia en programación para ejecutar acciones acorde a unas condiciones, esto podría sonar como si fuese un simple condicional if-then y en realidad la idea es la misma pero con el motor de reglas tendremos un software mucho más escalable y legible.

Supongamos que tenemos este ejemplo:

```java
class FizzBuzz{
    String generate(int number){
        if(isFizz(number) && isBuzz(number)){
            return "FizzBuzz"
        }
        if(isBuzz(number)){
            return "Buzz"
        }
        if(isFizz(number)){
            return "Fizz"
        }
        return String.valueOf(number);
    }

    private boolean isFizz(int number){
        return number % 3 == 0;
    }

    private boolean isBuzz(int number){
        return number % 5 == 0;
    }
```

Como vemos tenemos una clase llamada _FizzBuzz_ que implementa un método llamado generate, este método nos retorna en base a un número una cadena o el mismo número como una string; Todo depende si el dicho número cumple con las reglas establecidas para FizzBuzz que son:

- Retorna FizzBuzz si el número es divisible entre 3 y a su vez divisible por 5.
- Retorna Buzz si el número es divisible por 5.
- Retorna Fizz si el número es divisible por 3.
- Retorna el mismo número si no se cumple las condiciones anteriores.

¿Parece una buena solución verdad?, bueno para este caso sí pero ¿y si en vez de tener 3 reglas tenemos 50? el código se nos quedaría con muchos condicionales unos debajo de otros. Esto sería una pesadilla de mantener, generaría una clase muy grande, los comportamientos de cada regla estarían todos en el mismo lugar, se nos complicaría el trabajo a la hora de añadir nuevas reglas. En definitiva es una mala práctica de programación.

Un motor de reglas nos solucionaría todos los problemas anteriormente dichos, pero, ¿Cómo implementamos nuestro propio motor de reglas?. En un artículo llamado [Should I use a Rules Engine?](https://martinfowler.com/bliki/RulesEngine.html) de Martin Fowler nos explica como hacerlo.

_You can build a simple rules engine yourself. All you need is to create a bunch of objects with conditions and actions, store them in a collection, and run through them to evaluate the conditions and execute the actions._

¿Parece sencillo verdad?, bueno vamos a ello.

Lo primero que haremos es crear una interfaz para definir los métodos que tendrán en común todas nuestras en regla.

```java
package rules;

public interface RulesInterface {
    boolean condition(int number);
    String action();
}
```

El método condition almacenará la condición de la regla y el método action la acción de la regla.

Ahora crearemos 3 clases (porque nosotros tenemos 3 reglas, en caso de tener más crearemos tantas clases como reglas existan) que implementen esta interfaz, cada clase tendrá su propia condición y su propia acción:

```java
package rules;

public class FizzBuzzRule implements RulesInterface {
    @Override
    public boolean contidion(int number){
        return number % 15 == 0;
    }

    @Override
    public String action(){
        return "FizzBuzz"
    }
}
```

```java
package rules;

public class BuzzRule implements RulesInterface {
    @Override
    public boolean contidion(int number){
        return number % 5 == 0;
    }

    @Override
    public String action(){
        return "Buzz"
    }
}
```

```java
package rules;

public class FizzRule implements RulesInterface {
    @Override
    public boolean contidion(int number){
        return number % 3 == 0;
    }

    @Override
    public String action(){
        return "Fizz"
    }
}
```

¡Ya tenemos nuestras reglas implementadas!, solo faltaría crear el motor de reglas que será el encargado de almacenar las reglas en una lista y ejecutarlas todas cuando se le diga. Nuestro motor de reglas quedaría de esta forma:

```java
import rules.RulesInterface;
import java.utils.ArrayList;

class RulesEngine{

    private ArrayList<RulesInterface> rulesEngine;

    RulesEngine(){
        rulesEngine = new ArrayList<>();
    }

    void addRules(RulesInterface rule){
        rulesEngine.add(rule);
    }

    String executeRules(int number){
        for(RulesInterface rule : rulesEngine){
            if(rule.condition(number)){
                return rule.action();
            }
        }
        return String.valueOf(number);
    }
}
```

En la clase _RulesEngine_ tenemos un Array que almacena objetos del tipo de nuestra interfaz, como todas nuestras reglas la implementan no tendremos problemas en añadirlas a la lista mediante el método addRule. El método executeRules recibe por parámetro un número que es necesario para pasarlo a nuestras reglas, luego recorre el array y va evaluando cada condición de cada regla; Si se da el caso de cumplirse una de estas condiciones retorna la acción de la regla, en el caso de no cumplirse ninguna retorna el mismo número convertido a String.

Ya solo nos queda refactorizar nuestra clase FizzBuzz para que utilice nuestro motor de reglas.

```java
import rules.FizzRule;
import rules.BuzzRule;
import rules.FizzBuzzRule;

class FizzBuzz{

    private RulesEngine rulesEngine;

    FizzBuzz(){
        rulesEngine = new RulesEngine();
        rulesEngine.addRule(new FizzBuzzRule());
        rulesEngine.addRule(new BuzzRule());
        rulesEngine.addRule(new FizzRule());
    }

    String generate(int number){
        rulesEngine.executeRules(number);
    }
}
```

¡Bonito verdad!.

Podríamos mejorar nuestro motor de reglas añadiendo una variable que establezca la prioridad de la regla y reordenando el vector en base a esta variable siempre que se añade una nueva. De esta forma daría igual el orden en que añadamos las reglas, se ejecutarán por orden de prioridad. Esto ya os lo dejo a vosotros :D.

Un saludo.
