const readedBooks = [
  'Diseño ágil con TDD - Carlos Blé',
  'Extreme Programming Explained: Embrace Change, 2nd Edition',
  'Clean Code - Robert C. Martin',
  'Domain-Driven Design Distilled',
  '4 Rules of simple design - Kent Beck',
  'Thinking functionally',
  'Clean architecture - Robert C. Martin',
  'Agile Retrospectives',
]

export default function Projects() {
  return (
    <>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="space-y-2 pt-6 pb-8 md:space-y-5">
          <h1 className="text-3xl font-extrabold leading-9 tracking-tight text-gray-900 dark:text-gray-100">
            Biblioteca
          </h1>
        </div>
        <div className="container py-12">
          <div className="-m-4 flex flex-wrap">
            <h2 className="text-2xl font-extrabold leading-9 tracking-tight text-gray-900 dark:text-gray-100">
              Leidos
            </h2>
            {readedBooks.map((book, index) => (
              <h3
                key={index}
                className="text-xl font-extrabold leading-9 tracking-tight text-gray-900 dark:text-gray-100"
              >
                {book}
              </h3>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
