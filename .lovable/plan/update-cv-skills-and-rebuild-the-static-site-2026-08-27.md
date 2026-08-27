Update CV skills and rebuild the static site

1. Edit `scripts/cv-source.json` skills section:
   - Remove `Microsoft Office`.
   - Replace `Jira (Atlassian)` and `Confluence (Atlassian)` with a single entry `Jira & Confluence (Atlassian)` at level `Skillful` (score 68).
   - Add `AI Prompt Engineering (Lovable, Perplexity)` at level `Skillful` (score 70), positioned above `Python`.

2. Re-encrypt the updated source into `src/lib/cv-payload.ts` using the existing passphrase.

3. Run `bun run build:static` to regenerate `dist/client/` for GitHub Pages.

4. Verify the unlocked site shows the new skills list correctly, then tell the user to push to `main` to deploy.
