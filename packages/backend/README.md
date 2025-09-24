# Backend for the Nordcraft Engine

## Install

In the root of the project:

```sh
bun install
```

## Run

The `dev` command has a `predev` command that copies static files into the `assets/_static` directory (see [syncStaticAssets.js](/bin/syncStaticAssets.js)). This is necessary for the example application to work. Please make sure you build the static assets before running the application (see above).

```sh
bun run dev
```

To use a different project, replace the json file in the `__project__` folder.

## Deploy

The `deploy` command will deploy the backend to Cloudflare Workers. It has a `predeploy` command that copies static files into the `assets/_static` directory (see [syncStaticAssets.js](/bin/syncStaticAssets.js)). The `wrangler.toml` file does not include an account id, so you will need to provide that as an environment variable (`CLOUDFLARE_ACCOUNT_ID`) or modify the `wrangler.toml` file directly.

```sh
bun run deploy
```

## Preview

The `preview` command will run a preview server that fetches a project's files from a Durable Object (running on the internal Nordcraft services). To run this, first run `bun run preview-link <path-to-nordcraft-internal>` to create a symlink to the internal Nordcraft repository. This will allow the preview server to start the relevant service that powers the Durable Object.

```sh
bun run preview
```

### Status

This package is still in development but will be part of the new infrastructure for the Nordcraft Engine.
