# Conseal Trust Viewer

Conseal Trust Viewer is an interactive, explainable, and privacy-first PII (Personally Identifiable Information) redaction and auditing platform. It is designed to bridge the gap between automated AI redaction and human trust by transforming the "black box" of AI decisions into a transparent, verifiable, and user-controlled workflow.

---

## 🚀 Key Features

### 1. Three-Pane Explainability Dashboard
* **Document Viewer (Left):** Renders the document with color-coded, interactive highlights showing which PII spans are redacted (masked) or kept (visible).
* **PII Decision Inspector (Right):** The primary explainability panel. Selecting any highlighted entity provides immediate, deep-dive answers to why it was classified and how it is handled.
* **Audit Log & Metrics (Bottom):** A tabular, chronological log of all detected PII and system decisions, alongside a real-time trust summary with safety scores and threshold controls.

### 2. Smart Context-Aware Explanation Engine
* **Interactive Q&A ("Ask Why"):** Users can ask custom questions about any decision (e.g., *"Why was this email redacted?"* or *"Is this name safe to show?"*).
* **Empathetic "Worried Mode":** A toggle that changes the explanation tone to be highly reassuring and non-technical, validating user privacy concerns and explaining rigorous security measures.
* **Grounded Local Fallbacks:** If the backend or external AI APIs are unreachable, a local context-aware engine automatically takes over, analyzing nearby words and providing explanations without failing.
* **Zero-Leak Guarantee:** The explanation engine never includes the actual sensitive text in its Q&A responses, protecting privacy at all times.

### 3. Local Verification & Decryption
* **Local Decryption Box:** Users can temporarily reveal masked text directly within the browser.
* **Safety Warning Flow:** To prevent accidental exposure, a multi-stage warning reminds the user that the decryption is done entirely locally and never transmitted externally.

### 4. Interactive Manual Masking & Unmasking
* **Main Viewer Quick-Toggle:** Double-clicking any highlighted span in the document viewer instantly overrides the AI's decision (masking kept items or unmasking redacted ones).
* **Diff Viewer Quick-Toggle:** Clicking any highlight in the side-by-side comparison view (Original vs. Redacted) instantly toggles its state, recalculating the diff in real-time.

### 5. "Before-You-Share" Verification Gate
* Prevents accidental leaks by displaying a checklist modal before allowing text copying or file downloading.
* Scans the document for any low-confidence unmasked items (< 80%) and warns the user to review them.
* Requires explicit confirmation that the output has been verified and is safe for external sharing.

---

## 🛠️ Tech Stack

* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Zustand (state management), Lucide React (icons), Framer Motion (animations).
* **Backend:** Node.js, Express, Google Gemini API / Hugging Face.

---

## ⚙️ Getting Started

For detailed installation and setup instructions, please refer to the [Setup Guide (setup.md)](file:///C:/Users/kmvri/OneDrive/Documents/Desktop/CSE%202023-2027/MY%20PROJECTS/sprintfour-hackathon/setup.md).

### Quick Start
1. Install dependencies:
   ```bash
   npm install
   ```
2. Set up environment variables in a `.env` file:
   ```env
   GEMINI_API_KEY=your_key_here
   PORT=5000
   ```
3. Run in development mode:
   ```bash
   npm run dev
   ```
