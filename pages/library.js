const readedBooks = [
  'Diseño ágil con TDD - Carlos Blé',
  'Extreme Programming Explained: Embrace Change, 2nd Edition',
  'Clean Code - Robert C. Martin',
  'Domain-Driven Design Distilled',
  '4 Rules of simple design - Kent Beck',
  'Thinking functionally',
  'Clean architecture - Robert C. Martin',
  'Agile Retrospectives',
  'The Pragmatic Programmer by Dave Thomas and Andy Hunt',
  'Código sostenible, Carlos Blé',
  'Practical Object-Oriented Design in Ruby by Sandi Metz',
]

const wannaReadBooks = [
  'Cryptography in C and C++, Second Edition',
  'Secure By Design',
  'Microservices Patterns (Chris Richardson)',
  'CQRS by example',
  'Cracking the coding interview',
  'Compiladores.Principios, Ténicas Y Herramientas',
  'Isomorphic Web Applications',
  'No Silver Bullet – Essence and Accident in Software Engineering',
  'Working effectively with legacy code - Michael C. Feathers',
  'CQRS Documents by Greg Young',
  'Growing Object-Oriented Software Guided By Tests by Nat Pryce and Steve Freeman',
  'Mock Roles, not Objects by Steve Freeman, Nat Pryce, Tim Mackinnon, Joe Walnes',
  'Haskell Programming from first principles',
  'REST in Practice: Hypermedia and Systems Architecture',
  'No me hagas pensar - Steve Krug',
  'Patterns, Principles, and Practices of Domain-Driven Design',
  'Object oriented software engineering A Use Case Driven Approach - Ivar Jacobson',
  'Growing object oriented software with tests - Steve Freeman',
  'Explore It!: Reduce Risk and Increase Confidence with Exploratory Testing',
  'XUnit Test Patterns: Refactoring Test Code',
  'Refactoring databases',
  'Teoría de grafos. Ejercicios y problemas resueltos.',
  'Accelerate — Building and Scaling High Performing Technology Organizations',
  'The Cucumber Book: Behaviour-Driven Development for Testers and Developers',
  'Drive: The Surprising Truth About What Motivates Us',
  'Continuous Delivery: Reliable Software Releases through Build, Test, and Deployment Automation',
  'The Manager`s Path: A Guide for Tech Leaders Navigating Growth and Change',
  'The Five Dysfunctions of a Team: A Leadership Fable',
  'EL HOMBRE EN BUSCA DE SENTIDO',
  'Un libro de la sabiduría tolteca',
  'Deep Work. Rules For Focused Success In A Distracted World',
  'Invicto: Logra Más, Sufre Menos',
]

export default function Projects() {
  return (
    <>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="space-y-2 pt-6 pb-8 md:space-y-5">
          <h1 className="text-3xl font-extrabold leading-9 tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14">
            Biblioteca
          </h1>
        </div>
        <div className="container py-12">
          <div className="mt-3">
            <h2 className="text-xl font-extrabold leading-9 tracking-tight text-gray-900 dark:text-gray-100 sm:text-2xl sm:leading-10 md:text-4xl md:leading-14">
              Leyendo actualmente:
            </h2>
            <p className="text-xl text-gray-500 dark:text-gray-400">
              Implementing Domain-Driven Design - Vernon Vaughn
            </p>
          </div>
          <div className="mt-3">
            <h2 className="text-xl font-extrabold leading-9 tracking-tight text-gray-900 dark:text-gray-100 sm:text-2xl sm:leading-10 md:text-4xl md:leading-14">
              Leidos:
            </h2>
            <ul className="mx-5 list-disc">
              {readedBooks.map((book, index) => (
                <li key={index} className="text-xl text-gray-500 dark:text-gray-400">
                  {book}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-3">
            <h2 className="text-xl font-extrabold leading-9 tracking-tight text-gray-900 dark:text-gray-100 sm:text-2xl sm:leading-10 md:text-4xl md:leading-14">
              Me gustaría leer:
            </h2>
            <ul className="mx-5 list-disc">
              {wannaReadBooks.map((book, index) => (
                <li key={index} className="text-xl text-gray-500 dark:text-gray-400">
                  {book}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}
