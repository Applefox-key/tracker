# LearnyPie Language Progress Tracker

A web application for organizing language learning content, tracking learning progress, and practicing vocabulary and phrases through multiple interactive study modes.

## Live Demo

A demo version is available without registration:

**https://tracker.learnypie.com/dashboard**

## Features

### Dashboard

The dashboard provides an overview of learning activity and progress:

- Learning streak tracking
- Weekly activity
- Cards scheduled for review
- Learning statistics
- Category distribution
- Recent entries
- Quick access to practice and review

### Learning Entries

Users can create and manage different types of learning content:

- Words
- Phrases
- Grammar
- Idioms
- Notes

Entries can include translations, explanations, examples, notes, tags, and learning progress information.

### Search and Filters

Learning content can be searched and filtered by:

- Text
- Category
- Rating
- Learning status
- Tags

### Practice Modes

The application provides several interactive practice modes:

- **Flashcards** — review and rate learning cards
- **Quiz** — choose the correct answer
- **Match** — match content with corresponding answers
- **Puzzle** — complete content by arranging elements in the correct order
- **Write It** — type the correct answer
- **Mixer** — practice using a combination of different modes

### Flashcard Rating

During practice, users can rate how well they remembered an entry:

- Forgot
- Hard
- Good
- Easy

Ratings are used to track learning progress and manage future review.

### Progress Tracking

The application tracks learning activity and provides information about:

- Learning streaks
- Practice activity
- Entry ratings
- Mastered content
- Scheduled reviews
- Practice session progress

### Responsive Design

The application provides optimized layouts for both desktop and mobile devices.

The responsive interface includes:

- Adaptive layouts for different screen sizes
- Desktop and mobile navigation patterns
- Bottom navigation for mobile devices
- Mobile-friendly practice interfaces
- Responsive cards and controls

### Internationalization

The application supports multiple interface languages.

## Tech Stack

### Front End

- React
- TypeScript
- React Router
- Zustand
- Tailwind CSS

### Data Management

- TanStack React Query
- Axios
- REST API integration

### Internationalization

- i18next
- react-i18next

### Development Tools

- Vite
- npm
- Git
- GitHub

## Project Structure

```text
src/
├── api/          # API communication
├── app/          # Application configuration
├── data/         # Application data
├── features/     # Feature-specific functionality
├── hooks/        # Custom React hooks
├── i18n/         # Internationalization
├── lib/          # Shared libraries and utilities
├── pages/        # Application pages
├── shared/       # Reusable components and utilities
├── index.css
└── main.tsx
