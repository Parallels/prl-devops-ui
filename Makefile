.PHONY: help install dev build build-web build-all build-windows build-macos build-linux build-linux-arm64 build-windows-arm64 ios android check clean
.PHONY: lint test test-coverage ui-kit-lint ui-kit-build

# Default target
.DEFAULT_GOAL := help

# Colors
GREEN  := $(shell tput -Txterm setaf 2)
YELLOW := $(shell tput -Txterm setaf 3)
RESET  := $(shell tput -Txterm sgr0)

# Load .env if present (used by signing and distribution)
-include .env

## Show this help
help:
	@echo ''
	@echo 'Usage:'
	@echo '  ${YELLOW}make${RESET} ${GREEN}<target>${RESET}'
	@echo ''
	@echo 'Targets:'
	@awk '/^[a-zA-Z\-\_0-9]+:/ { \
		helpMessage = match(lastLine, /^## (.*)/); \
		if (helpMessage) { \
			helpCommand = substr($$1, 0, index($$1, ":")-1); \
			helpMessage = substr(lastLine, RSTART + 3, RLENGTH); \
			printf "  ${YELLOW}%-20s${RESET} ${GREEN}%s${RESET}\n", helpCommand, helpMessage; \
		} \
	} \
	{ lastLine = $$0 }' $(MAKEFILE_LIST)

## Install dependencies (Frontend & Backend)
install:
	npm install
	cd src-tauri && cargo fetch

## Lint the application (type check)
lint:
	npm run lint

## Run tests
test:
	npm run test

## Run tests with coverage report
test-coverage:
	npm run test -- --coverage

## Start development server (Desktop)
dev:
	npm run tauri dev

## Build for current OS (Tauri desktop app)
build:
	npm run tauri build

## Build web application only
build-web:
	npm run build:web

## Lint the UI Kit
ui-kit-lint:
	npm run lint -w packages/ui-kit

## Build the UI Kit
ui-kit-build:
	npm run build -w packages/ui-kit

## Build for macOS (Universal)
build-macos:
	@echo "Updating Tauri configuration file with signing identity..."
	@if [ -n "$(APPLE_SIGNING_IDENTITY)" ]; then \
		jq --arg v "$(APPLE_SIGNING_IDENTITY)" '.bundle.macOS.signingIdentity = $$v' src-tauri/tauri.conf.json > src-tauri/tauri.conf.json.tmp && \
		mv src-tauri/tauri.conf.json.tmp src-tauri/tauri.conf.json; \
	fi
	@APPLE_SIGNING_IDENTITY='$(APPLE_SIGNING_IDENTITY)' \
	 APPLE_API_KEY='$(APPLE_API_KEY)' \
	 APPLE_API_KEY_PATH='$(APPLE_API_KEY_PATH)' \
	 APPLE_API_ISSUER='$(APPLE_API_ISSUER)' \
	 TAURI_SIGNING_PRIVATE_KEY='$(TAURI_SIGNING_PRIVATE_KEY)' \
	 TAURI_SIGNING_PRIVATE_KEY_PASSWORD='$(TAURI_SIGNING_PRIVATE_KEY_PASSWORD)' \
	 npm run tauri build -- --target universal-apple-darwin
	@echo "Resetting configuration files..."
	@jq '.bundle.macOS.signingIdentity = "Developer ID Application: Parallels International GmbH (4C6364ACXT)"' src-tauri/tauri.conf.json > src-tauri/tauri.conf.json.tmp && \
	mv src-tauri/tauri.conf.json.tmp src-tauri/tauri.conf.json

## Build for Windows (Requires Windows or Setup)
build-windows:
	@SIGNING_KVU='$(SIGNING_KVU)' \
	  SIGNING_KVI='$(SIGNING_KVI)' \
	  SIGNING_KVS='$(SIGNING_KVS)' \
	  SIGNING_KVT='$(SIGNING_KVT)' \
	  SIGNING_KVC='$(SIGNING_KVC)' \
	  TAURI_SIGNING_PRIVATE_KEY='$(TAURI_SIGNING_PRIVATE_KEY)' \
	  TAURI_SIGNING_PRIVATE_KEY_PASSWORD='$(TAURI_SIGNING_PRIVATE_KEY_PASSWORD)' \
	  npm run tauri build -- --target x86_64-pc-windows-msvc

## Build for Linux
build-linux:
	@TAURI_SIGNING_PRIVATE_KEY='$(TAURI_SIGNING_PRIVATE_KEY)' \
	  TAURI_SIGNING_PRIVATE_KEY_PASSWORD='$(TAURI_SIGNING_PRIVATE_KEY_PASSWORD)' \
	  npm run tauri build -- --target x86_64-unknown-linux-gnu

## Build for Linux (ARM64)
build-linux-arm64:
	@TAURI_SIGNING_PRIVATE_KEY='$(TAURI_SIGNING_PRIVATE_KEY)' \
	  TAURI_SIGNING_PRIVATE_KEY_PASSWORD='$(TAURI_SIGNING_PRIVATE_KEY_PASSWORD)' \
	  npm run tauri build -- --target aarch64-unknown-linux-gnu

## Build for Windows (ARM64)
build-windows-arm64:
	@SIGNING_KVU='$(SIGNING_KVU)' \
	  SIGNING_KVI='$(SIGNING_KVI)' \
	  SIGNING_KVS='$(SIGNING_KVS)' \
	  SIGNING_KVT='$(SIGNING_KVT)' \
	  SIGNING_KVC='$(SIGNING_KVC)' \
	  TAURI_SIGNING_PRIVATE_KEY='$(TAURI_SIGNING_PRIVATE_KEY)' \
	  TAURI_SIGNING_PRIVATE_KEY_PASSWORD='$(TAURI_SIGNING_PRIVATE_KEY_PASSWORD)' \
	  npm run tauri build -- --target aarch64-pc-windows-msvc

## Build for all desktop platforms (Note: Requires cross-compilation setup)
build-all: build-macos build-windows build-linux build-linux-arm64 build-windows-arm64

## Start iOS development
ios:
	npm run tauri ios dev

## Init iOS project
ios-init:
	npm run tauri ios init

## Build iOS
build-ios:
	npm run tauri ios build

## Start Android development
android:
	npm run tauri android dev

## Init Android project
android-init:
	npm run tauri android init

## Build Android
build-android:
	npm run tauri android build

## Check Tauri environment
check:
	npm run tauri info

## Clean build artifacts
clean:
	rm -rf src-tauri/target
	rm -rf dist
	rm -rf packages/ui-kit/dist
