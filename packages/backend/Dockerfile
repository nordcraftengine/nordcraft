# -------- BUILD STAGE --------
FROM oven/bun:1.3.2-debian AS build

WORKDIR /app

# Copy relevant package.json files
COPY bun.lock package.json bunfig.toml ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/core/package.json ./packages/core/
COPY packages/lib/package.json ./packages/lib/
COPY packages/runtime/package.json ./packages/runtime/
COPY packages/search/package.json ./packages/search/
COPY packages/ssr/package.json ./packages/ssr/
COPY packages/backend/dist/ ./packages/backend/dist/

# Build dependencies
RUN bun install

# Copy source and compile
COPY . .

# RUN bun build to generate a standalone executable
RUN bun build --minify --target=node ./packages/backend/src/node.index.ts --outdir ./packages/backend/dist/

RUN ls -R ./packages/backend/dist/

# -------- RUN STAGE --------

# Our application runner. Use gcr.io/distroless/base-debian12:debug to allow debugging
# using docker run -it --entrypoint=sh nordcraft-backend
# see https://github.com/GoogleContainerTools/distroless
FROM gcr.io/distroless/nodejs24-debian12 AS runner

ENV NODE_ENV=production

ARG BUILD_APP_PORT=3000
ENV APP_PORT=${BUILD_APP_PORT}
EXPOSE ${APP_PORT}

WORKDIR /app/dist

# Copy project specific files
COPY --from=build --chown=65532:65532 /app/node_modules/ ../node_modules/
COPY --from=build --chown=65532:65532 /app/packages/backend/dist/ .

CMD ["node.index.js"]