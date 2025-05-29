# 🚕 Hammonia Taxi Shift Planner

**Hammonia Taxi Shift Planner** is a web-based application built using Next.js and Firebase, designed to streamline and manage taxi shift scheduling efficiently.

## ✨ Features

- Modern UI built with Tailwind CSS and Radix UI components
- Authentication and data handling via Firebase
- Integration with Genkit for AI features
- Modular code structure with reusable components
- TypeScript support for type-safe development

## 📁 Project Structure

```
hammoniataxishiftplanner/
├── src/               # Main application source code
├── firebase/          # Firebase configuration and functions
├── docs/              # Documentation and design notes
├── public/            # Static assets
├── .vscode/           # Editor configuration
├── package.json       # Project metadata and dependencies
└── README.md          # Project documentation
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.x
- Firebase CLI
- Google Cloud SDK (for Genkit)

### Installation

```bash
git clone https://github.com/yourusername/hammoniataxishiftplanner.git
cd hammoniataxishiftplanner
npm install
```

### Development

To start the development server:

```bash
npm run dev
```

To run with Genkit in watch mode:

```bash
npm run genkit:watch
```

### Linting and Type Checking

```bash
npm run lint
npm run typecheck
```

### Build

```bash
npm run build
```

## 🔒 Firebase Setup

Ensure you have Firebase initialized and configured. Key files include:

- `firebase.json`
- `firestore.rules`

Deploy Firebase services using:

```bash
firebase deploy
```

## 🧠 AI Integration (Genkit)

This project integrates [Genkit](https://github.com/genkit-dev/genkit) to enable AI features via:

- `@genkit-ai/googleai`
- `@genkit-ai/next`

## 🛠️ Technologies Used

- [Next.js](https://nextjs.org/)
- [Firebase](https://firebase.google.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [React Hook Form](https://react-hook-form.com/)
- [TypeScript](https://www.typescriptlang.org/)

## 📄 License

MIT License. See `LICENSE` file for more information.