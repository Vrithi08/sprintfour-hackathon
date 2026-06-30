# Project Setup Guide

Follow these instructions to set up and run the Conseal Trust Viewer application locally.

---

## 1. Prerequisites

Ensure the following tools are installed on the system:
* **Node.js** (version 18.x or higher is recommended)
* **npm** (comes packaged with Node.js)
* **Git** (for version control)

---

## 2. Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/Vrithi08/sprintfour-hackathon.git
   cd sprintfour-hackathon
   ```

2. **Install Dependencies:**
   Install all required frontend and backend packages:
   ```bash
   npm install
   ```

---

## 3. Configuration

The application requires environment variables to connect to the Gemini API and set the server port.

1. **Create the Environment File:**
   Copy the example environment file in the root directory:
   ```bash
   cp .env.example .env
   ```

2. **Set the Variables:**
   Open the newly created `.env` file and configure the values:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=5000
   ```
   *Replace `your_gemini_api_key_here` with a valid Google Gemini API Key.*

---

## 4. Running the Application

### Development Mode (Recommended)
To run both the frontend (Vite) and backend (Express) concurrently:
```bash
npm run dev
```
* The frontend will be available at `http://localhost:5173` (or the next available port).
* The backend will run on `http://localhost:5000` (or the port specified in `.env`).

### Running Separately
If needed, the frontend and backend can be run in separate terminal windows:
* **Start Backend only:**
  ```bash
  npm run dev:backend
  ```
* **Start Frontend only:**
  ```bash
  npm run dev:frontend
  ```

---

## 5. Other Available Commands

* **Build the Application:**
  Compiles TypeScript and creates a production-ready bundle in the `dist/` directory.
  ```bash
  npm run build
  ```

* **Lint the Codebase:**
  Runs the `oxlint` linter to check for potential errors or style violations.
  ```bash
  npm run lint
  ```

* **Preview the Production Build:**
  Serves the locally built application.
  ```bash
  npm run preview
  ```

---

## 6. Troubleshooting

* **Port Conflicts:** 
  If port `5000` or `5173` is already in use, the application might fail to start. You can change the backend port in the `.env` file or kill the active ports:
  * *Windows (PowerShell):* `Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess -Force`
  * *macOS/Linux:* `kill -9 $(lsof -t -i:5000)`
* **Missing API Key:**
  If the Gemini API key is missing or invalid, the application will automatically fall back to local context-aware explanations, allowing full offline testing of the explainability interface.
