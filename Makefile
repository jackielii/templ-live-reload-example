## live/templ: watch temp files and regenerate
.PHONY: live/templ
live/templ:
	templ generate --watch --proxy="http://localhost:8080" --open-browser=false

## live/server: watch for changes in go files and restart the server
.PHONY: live/server
live/server:
	go run github.com/cosmtrek/air@v1.51.0 \
	--build.cmd "go build -o tmp/bin/main" --build.bin "tmp/bin/main" --build.delay "100" \
	--build.exclude_dir "node_modules,assets" \
	--build.include_ext "go" \
	--misc.clean_on_exit true \
	--log.main_only false

## live/tailwind: watch for changes in tailwind files and rebuild the css
.PHONY: live/tailwind
live/tailwind:
	npx tailwindcss -i ./input.css -o ./assets/styles.css --minify --watch

## live/esbuild: watch for changes in js files and rebuild the js
.PHONY: live/esbuild
live/esbuild:
	npx esbuild js/index.js --bundle --outfile=assets/index.js --watch --minify

## live/sync_assets: watch for changes in assets and sync them using templ proxy server
.PHONY: live/sync_assets
live/sync_assets:
	go run github.com/cosmtrek/air@v1.51.0 \
	--build.cmd "templ generate --notify-proxy" \
	--build.bin "true" \
	--build.delay "100" \
	--build.exclude_dir "" \
	--build.include_dir "assets" \
	--build.include_ext "js,css"

## live: run all live development tasks
.PHONY: live
live:
	make -j5 live/templ live/server live/tailwind live/sync_assets live/esbuild


