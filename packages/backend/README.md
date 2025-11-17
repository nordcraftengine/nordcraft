# Backend for the Nordcraft Engine

## Install

In the root of the project:

```sh
bun install
```

## Run

The `dev` command has a `predev` command that copies static files into the `assets/_static` directory (see [syncStaticAssets.ts](/bin/syncStaticAssets.ts)). This is necessary for the example application to work. Please make sure you build the static assets before running the application.

```sh
bun run dev
```

To use a different project, replace the json file in the `__project__` folder with a project exported from the Nordcraft Editor.

## Deploy

The `deploy` command will deploy the backend to Cloudflare Workers. It has a `predeploy` command that copies static files into the `assets/_static` directory (see [syncStaticAssets.ts](/bin/syncStaticAssets.ts)). The `wrangler.toml` file does not include an account id, so you will need to provide that as an environment variable (`CLOUDFLARE_ACCOUNT_ID`) or modify the `wrangler.toml` file directly.

```sh
bun run deploy
```

## Preview

The `preview` command will run a preview server that fetches a project's files from a Durable Object (running on the internal Nordcraft services). To run this, first run `bun run preview-link <path-to-nordcraft-internal>` to create a symlink to the internal Nordcraft repository. This will allow the preview server to start the relevant service that powers the Durable Object.

```sh
bun run preview
```

## Docker

The [Dockerfile](/Dockerfile) uses a distroless Node.js (24) image to run the backend in a lightweight container. To summarize its steps:

- **Build Stage**
  - Use [oven/bun:1.3.2-debian](https://hub.docker.com/r/oven/bun/tags) as the base image.
  - Set working directory to `/app`.
  - Copy lockfiles and package manifests.
  - Copy package-specific package.json files and dist folder.
  - Install dependencies with `bun install`.
  - Copy the full source code.
  - Build the backend entrypoint (`node.index.ts`) with `bun build`.

- **Run Stage**
  - Use [gcr.io/distroless/nodejs24-debian12](https://github.com/GoogleContainerTools/distroless) as the base image.
  - Set environment variables and expose the app port.
  - Set working directory to `/app/dist`.
  - Copy node_modules and built files from the build stage.
  - Set the container command to run `node.index.js`.

To build and run the backend in a Docker container, use the following commands:

```sh
bun run docker:build
bun run docker:run
```

If you want to build without cache, use the `docker:build:debug` command. If you want to automatically remove any existing container before running a new one, use the `docker:run:debug` command.

### Status

This package is still in development but will be part of the new infrastructure for the Nordcraft Engine.
