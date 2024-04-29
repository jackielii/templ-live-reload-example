# Templ live reload example

This example project demonstrates live reloading of a templ project with:

- tailwindcss for styling
- htmx for ajax requests
- alpine.js for interactivity
- esbuild for bundling js
- templ for live reloading
- air for rebuilding the Go http server and watching for asset changes

## Usage

```sh
make live
```

Now try modify the `index.templ`, `js/index.js` or input.css or any other file and see the changes live in the browser.
