# Skillpath

Skillpath is a modern learning platform concept built in Framer. The project includes a responsive landing page with a live course section powered by the APIs provided in the assignment.

## Features

- Live course data fetched from the provided API
- Country-based INR / USD pricing
- Loading and skeleton states
- Error handling with retry
- Empty-state handling
- Search courses
- Sort courses by price
- Refundable course badges
- Responsive 3-column desktop, 2-column tablet, and 1-column mobile layouts
- Custom Framer property controls
- Responsive and clean e-learning focused UI

## Live Demo

https://skillpath-farhan.framer.website

## Development Process

I started by exploring Framer and understanding how to build the page and work with code components. I first connected the API endpoints provided in the assignment and successfully fetched the course and country data.

While working with Framer's styling and code-component structure, I used ChatGPT and Google Gemini to better understand how Framer works and how to implement certain parts of the UI and component styling.

I then built the initial page structure and basic design myself, including the Hero, Courses, Footer, and responsive layouts for desktop, tablet, and mobile.

Once the required functionality was working, I used Framer's Agent to help refine and polish the user interface. After finalizing the design, I added the optional features including course search, price sorting, skeleton loading, retry handling, and refundable badges.

Finally, I tested the page across different screen sizes and API states to make sure the implementation behaved as expected.

It was a fun project to work on, and I really enjoyed building and experimenting with the different parts of the implementation.

## AI Usage

I used AI as a development aid rather than relying on it to build the entire project.

- **ChatGPT:** Used to understand Framer concepts, troubleshoot implementation issues, reason about responsive behavior, and review/refine parts of the implementation.
- **Google Gemini:** Used to help understand Framer styling and implementation concepts.
- **Framer Agent:** Used primarily for UI refinement and visual polish after the core functionality and initial design were already implemented.

I reviewed and tested the generated suggestions and made sure I understood the code and implementation used in the final project.

## API

Base URL:

https://syncsphere-hiv6.onrender.com

Endpoints used:

- `/assignment/course-data`
- `/assignment/country-code`

## Built With

- Framer
- React
- TypeScript
- REST APIs
