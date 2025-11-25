# -------- BUILD STAGE --------
FROM oven/bun:1.3.3-debian AS build

WORKDIR /app

# Copy relevant package.json files
COPY bun.lock package.json bunfig.toml ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/core/package.json ./packages/core/
# We technically don't need the editor package for anything, but if it's no included
# then bun install will fail when --production/--frozen-lockfile is used because it
# can't find all the packages listed in the lockfile
COPY packages/editor/package.json ./packages/editor/
COPY packages/lib/package.json ./packages/lib/
COPY packages/runtime/package.json ./packages/runtime/
COPY packages/search/package.json ./packages/search/
COPY packages/ssr/package.json ./packages/ssr/
COPY packages/backend/dist/ ./packages/backend/dist/

# Build dependencies
RUN bun install --production --verbose --frozen-lockfile

# Copy source and compile
COPY . .

# RUN bun build to generate a standalone executable
RUN bun build --compile --minify --sourcemap ./packages/backend/src/bun.index.ts --outfile nordcraft-backend

# -------- RUN STAGE --------

# Our application runner. Use gcr.io/distroless/nodejs24-debian12:debug to allow debugging
# using docker run -it --entrypoint=sh nordcraft-backend
# see https://github.com/GoogleContainerTools/distroless
FROM gcr.io/distroless/base-debian12 AS runner

ENV NODE_ENV=production

ARG BUILD_APP_PORT=3000
ENV APP_PORT=${BUILD_APP_PORT}
EXPOSE ${APP_PORT}

WORKDIR /app

# Copy the compiled executable from the build stage
COPY --from=build /app/nordcraft-backend .
# Copy project specific files
COPY --from=build /app/packages/backend/dist/ .

ENTRYPOINT ["./nordcraft-backend"]