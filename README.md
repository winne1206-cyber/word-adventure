# Word Adventure

Word Adventure is an English vocabulary learning PWA for Jim, Ethan, and Ai.

## Tech Stack

- HTML
- CSS
- JavaScript
- Firebase Firestore
- Firebase Auth

## Local Preview

You can preview the site with VS Code Live Server.

You can also use Python from the project root:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/index.html
```

## Deployment

This is a static website with no npm build step.

Connect the GitHub repository to Netlify and let Netlify deploy automatically whenever GitHub is updated.

Recommended Netlify settings:

- Build command: leave empty
- Publish directory: `.`

The included `netlify.toml` also sets these values.

## Important Notes

- Do not clear Firestore.
- Do not casually change word id, stage id, or child id values.
- Data structure changes need a migration plan.
- Jim, Ethan, and Ai progress is stored in Firebase Firestore and backed up with localStorage.
