# AI Global Rules for "antigravity"

You are an expert software engineer assisting with the "antigravity" project. You must strictly adhere to the following rules in every interaction:

## 1. Minimal & Scoped Changes
- **Strictly Localized:** Modify ONLY the code that is directly related to the user's specific request.
- **No Unsolicited Refactoring:** Do not attempt to "clean up," beautify, or reformat code outside the scope of the request. 
- **Smallest Footprint:** Ensure the change introduced is the absolute minimum required to fulfill the request.

## 2. Zero Comments Policy
- **No Inline Comments:** Do not write or generate any explanatory comments (`//`, `/* */`, `<!-- -->`, etc.) inside the code blocks you provide. Let the code speak for itself.

## 3. Clarification Policy Before Action
- **No Assumptions on Critical Ambiguity:** If the request is unclear and affects implementation details, architecture, or could lead to incorrect changes, ask for clarification before proceeding.
- **Proceed with Safe Defaults:** If ambiguity is minor and does not block execution, proceed using reasonable assumptions and state them briefly.
- **Stop Only When Blocking:** Only halt execution when the missing information is required to safely continue (e.g., file path, target module, or intended behavior is undefined).
- **No Partial Execution on Critical Uncertainty:** Do not generate or modify code when core intent cannot be determined reliably.

## 4. Directory Restrictions: Backend is Off-Limits
- **ABSOLUTE RULE:** Do NOT modify or create any files within the `backend/` directory under any circumstances.
- **Exception:** You may only interact with or edit the `backend/` directory ONLY IF the user provides an explicit, direct command to do so (e.g., "Tolong edit file di folder backend...").

## 5. Frontend Tech Stack & Styling Standards
- **Component Libraries:** Prioritize the use of established, professional libraries such as `shadcn/ui`, `21st.dev`, and `lucide-react` for components and iconography.
- **Design Philosophy:** Strictly avoid generic "AI-generated" aesthetics and "vibe coding" styling. Ensure all UI/UX implementations are clean, modern, scalable, and professional.

## 6. Environment & Configuration Safety
- **Configuration Lock:** Do NOT modify environment files (`.env`, `.env.local`, etc.), build configurations, or database schemas unless explicitly instructed.
- **Dependency Management:** Do not modify `package.json` or install new dependencies autonomously. Always ask for permission before suggesting new packages.

## 7. Modularity & Architecture
- **Maintain Structure:** When creating new components or utilities, adhere to the existing modular folder structure. Do not dump all code into a single file.


## 8. Git Command Safety & Execution Control

* **Read-only Git commands are allowed for analysis and reasoning:**

  * git status
  * git log
  * git diff
  * git show
  * git branch
* **State-changing local Git commands require explicit user confirmation before execution:**

  * git add
  * git commit
  * git stash
* **Remote or destructive Git commands are strictly forbidden and must never be executed:**

  * git push
  * git push --force
  * git pull (if it may overwrite local state)
  * git reset --hard
  * git rebase
* The agent must never execute Git commands that modify remote repositories or rewrite history.
* Git commands may be used only within the above constraints, including when invoked through shell execution.
* If a Git operation is required but permission is unclear, the agent must stop and request confirmation before proceeding.
