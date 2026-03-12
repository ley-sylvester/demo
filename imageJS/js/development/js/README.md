# LiveLabs JS Development Notes

The development sources for `main.26.2.js` are now split into modular chunks
under `development/js/modules`. Each file mirrors a logical section of the
legacy monolith (bootstrap, markdown pipeline, navigation, UI components,
utilities, QA, and quiz helpers).

## Rebuilding main.26.2.js

1. Make edits inside the relevant module(s).
2. Run `python3 development/js/build_main.py` from the repository root.
3. The script regenerates `development/js/main.26.2.js` with a banner noting
   that it is auto-generated. Do **not** edit the bundle directly.

The same process should be used before minifying to update
`development/js/main.26.2.min.js` and the production `js/main.min.js`.

## Local testing workflow

- Start a static server from the repository root (for example
  `python3 -m http.server 5500`) so the sample templates and modules are served.
- Point the sample workshop
  (`sample-livelabs-templates/sample-workshop/index.html`) at the development
  bundle via `<script src="../redwood-hol/development/js/main.26.2.js"></script>`
  while iterating.
- Refresh the browser after each rebuild. Once satisfied, switch the script tag
  back to the minified production bundle before committing.
