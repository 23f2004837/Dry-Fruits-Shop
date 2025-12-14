# Dry Fruits Shop

A React-based e-commerce application for selling dry fruits, built with Vite.

## 🚀 Live Demo

The application is automatically deployed to GitHub Pages: [https://23f2004837.github.io/Dry-Fruits-Shop/](https://23f2004837.github.io/Dry-Fruits-Shop/)

## 📦 Development

### Prerequisites

- Node.js 20 or higher
- npm

### Installation

```bash
npm install
```

### Running Locally

```bash
npm run dev
```

### Firebase Authentication (Google Sign-In)

This project uses Firebase Authentication for Google sign-in. Before running locally, create a Firebase project and add the web configuration values to a `.env.local` file in the project root:

```bash
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=sender-id
VITE_FIREBASE_APP_ID=app-id
```

In the Firebase console, enable the **Google** provider under *Authentication → Sign-in method*. After saving the `.env.local` file, restart the dev server so Vite can pick up the environment variables.

### Building for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 🌐 Deployment

This project is configured to automatically deploy to GitHub Pages when changes are pushed to the `main` branch.

### How it works:

1. GitHub Actions workflow (`.github/workflows/deploy.yml`) is triggered on push to `main`
2. The workflow installs dependencies, builds the project, and deploys to GitHub Pages
3. The site is available at `https://23f2004837.github.io/Dry-Fruits-Shop/`

### Manual Deployment

You can also trigger a manual deployment by going to the Actions tab in GitHub and running the "Deploy to GitHub Pages" workflow.

## 🛠️ Technologies

- **React 19** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **ESLint** - Code linting

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
