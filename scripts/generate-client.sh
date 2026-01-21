#!/bin/bash

set -e
set -x

cd api
uv run python -c "import app.main; import json; print(json.dumps(app.main.app.openapi()))" > ../openapi.json
cd ..
mv openapi.json web/
cd web
pnpm run openapi-ts