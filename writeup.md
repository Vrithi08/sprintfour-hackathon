# Building Trust: How AI Redaction Was Made Explainable

When looking at AI-driven PII redaction, the biggest hurdle isn't just accuracy—it's trust. A user looking at a redacted document is often left in the dark, wondering why certain words were hidden while others were left visible. For this project, the focus was placed on opening up that "black box" and providing users with the tools needed to understand, verify, and correct AI decisions without feeling overwhelmed.

Here is a look at what was built, and the conscious decisions made about what to leave out.

---

## What Was Built

Instead of making drastic changes to the layout or introducing complicated widgets, the existing **PII Decision Inspector** panel on the right side was enhanced to be incredibly rich and interactive.

1. **A Smart, Context-Aware Explanation Engine**
   The AI is designed to act as a helpful assistant explaining its reasoning. A local fallback engine was built to generate highly specific, context-aware answers to the "Why did you do this?" question. 
   - **Privacy-First Explanations:** The engine analyzes surrounding words to explain why a decision was made (e.g., explaining that a 9-digit number near the word "passport" triggered a high-confidence match) without ever revealing the masked text itself.
   - **Worried Mode:** If a user is anxious about privacy, "Worried Mode" can be toggled. The tone of the explanations is dynamically adjusted to be highly reassuring, thorough, and clear, avoiding dry technical jargon and focusing on safety.
   - **Spotting Missed Redactions:** Explanations also highlight why nearby words were not redacted, helping users understand if the system missed something or if it was correctly identified as safe.

2. **Local Verification and Decryption**
   Trust is built through verification. A local "Verification Box" was added to the inspector. If a user is unsure about a redaction, the original text can be decrypted and revealed. To prevent accidental exposure, a warning flow was implemented to remind users of the privacy implications before revealing the text.

3. **Seamless User Overrides**
   AI mistakes can occur. The system was designed to allow users to challenge decisions easily. With a single click of the "Flag" button, the AI's choice can be overridden—either masking missed PII or restoring over-redacted text. The document view is updated instantly, and trust metrics are recalculated.

4. **Developer Quality-of-Life**
   On the backend, the server was configured to run with auto-recovery (`node --watch`) to ensure the local explanation service remains online and resilient during active testing.

---

## What Was Intentionally Chosen Not to Build

To maintain security, simplicity, and visual integrity, several features were intentionally omitted:

1. **No Remote Decryption or PII Leaking**
   It was decided that the original, sensitive text should never leave the user's local browser during Q&A or verification. When a user asks "Why was this redacted?", no PII is sent to the backend. The decryption happens entirely client-side, ensuring that sensitive data remains completely secure.

2. **No Visual Redesigns**
   Overhauling the dashboard or altering the document viewer was avoided. The existing three-pane layout was preserved, and value was added entirely within the existing structure to keep the design clean, familiar, and focused.

3. **No Complex Cloud Databases**
   A cloud-based state persistence layer was not built. All user overrides, flags, and Q&A history are kept in a local Zustand store and temporary local storage, keeping the application fast, easy to run, and free of database-compliance overhead.
