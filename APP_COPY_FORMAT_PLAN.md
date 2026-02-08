# App Copy Format Plan

## Problems To Fix
- `description` is currently one free-form string, so hierarchy is inconsistent per app.
- UI styling has to infer structure from punctuation (`:` and `- `), which is fragile.
- App Store metadata and website marketing copy are mixed together.

## Target Data Model (`public/apps.json`)
- Keep existing fields for backward compatibility.
- Add a structured block for display copy and App Store copy.

```json
{
  "slug": "rituals",
  "copy": {
    "lead": "Rituals helps you build consistent habits through focused, time-bound ritual arcs instead of endless streak pressure.",
    "sections": [
      {
        "heading": "Create rituals that match your life",
        "bullets": [
          "Set a custom duration from 7 to 365 days",
          "Organize habits by morning, midday, afternoon, evening, night, or anytime",
          "Personalize rituals with themes, icons, categories, and notes"
        ]
      }
    ],
    "closing": "Rituals gives you a clear structure you can actually sustain."
  },
  "appStore": {
    "promotionalText": "",
    "keywords": "",
    "description": ""
  }
}
```

## Rendering Rules
- `copy.lead`: one prominent paragraph (not bold by default, slightly higher contrast).
- `copy.sections[].heading`: section heading style.
- `copy.sections[].bullets`: native `<ul><li>` rendering.
- `copy.closing`: normal paragraph style.
- Fallback to legacy `description` only if `copy` is missing.

## Migration Plan
1. Add new optional fields (`copy`, `appStore`) to all apps.
2. Keep `description` unchanged during migration.
3. Update `app-detail.jsx` to prefer `copy` over parsed `description`.
4. Validate with a script that each app has required `copy` keys.
5. Remove string parsing heuristics after all apps migrate.

## Skill Plan: `app-copy-normalizer`
- Purpose: Convert raw App Store text into the structured `copy` + `appStore` schema.
- Inputs: App name, tagline, promotional text, keywords, description.
- Outputs: JSON patch for one app entry in `public/apps.json`.

### Skill Structure
```text
app-copy-normalizer/
├── SKILL.md
├── scripts/
│   ├── normalize_app_copy.js
│   └── validate_apps_json.js
└── references/
    └── schema.md
```

### Skill Workflow
1. Parse provided description into `lead`, `sections`, `bullets`, `closing`.
2. Enforce App Store limits (`170`, `100`, `4000`).
3. Emit normalized JSON block.
4. Run validator script and report issues.

### Acceptance Checks
- JSON is valid.
- All apps have `copy.lead` and at least one `copy.sections` entry.
- No heading ends with punctuation noise.
- All bullet lines are plain sentences (no leading `- ` in stored data).
