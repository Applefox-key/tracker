const FEATURES = [
  {
    icon: '📝',
    title: 'Entries',
    description:
      'Save words, phrases, grammar rules, idioms, and notes. Tag them, rate difficulty, and search instantly.',
  },
  {
    icon: '🎯',
    title: 'Practice',
    description:
      'Study your entries with four interactive modes: flip cards, multiple choice quiz, match pairs, and word/letter puzzle.',
  },
  {
    icon: '📊',
    title: 'Stats & Dashboard',
    description:
      'See your progress at a glance — total entries, daily and weekly activity, average rating, and category breakdown.',
  },
]

export function AboutPage() {
  return (
    <div className="flex flex-col gap-10 max-w-2xl mx-auto">

      {/* Hero */}
      <div className="text-center flex flex-col gap-3 pt-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Language Progress Tracker</h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed">
          Track your learning progress, save entries, and practise with interactive study activities.
        </p>
      </div>

      <hr className="border-gray-200 dark:border-gray-700" />

      {/* Features */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {FEATURES.map(({ icon, title, description }) => (
            <div
              key={title}
              className="flex flex-col gap-2 p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm"
            >
              <span className="text-2xl">{icon}</span>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-gray-200 dark:border-gray-700" />

      {/* About the app */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">About</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          Language Progress Tracker is a personal study companion built to help language learners
          organise their vocabulary, grammar notes, and idioms in one place. Reinforce what you
          learn through practice modes — flashcards, quizzes, matching pairs, and puzzles. It is
          designed to be fast, distraction-free, and offline-friendly.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          Built with React, TypeScript, Vite, Tailwind CSS, and Zustand.
        </p>
      </section>
    </div>
  )
}
