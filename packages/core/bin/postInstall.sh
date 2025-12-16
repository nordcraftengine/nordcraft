echo "Running post install script for core package"
if [ "$NODE_ENV" = "production" ]; then
  echo "Skipping post install script in production environment"
  exit 0
fi
tsgo -p ./tsconfig.install.json
bun run generateTypes