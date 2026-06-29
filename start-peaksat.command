#!/bin/zsh

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
RUN_DIR="$ROOT_DIR/.run"

mkdir -p "$RUN_DIR"

if ! lsof -nP -iTCP:3306 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "MySQL is stopped. Enter your Mac password to start it."
  sudo /usr/local/mysql/support-files/mysql.server start
fi

if ! lsof -nP -iTCP:8080 -sTCP:LISTEN >/dev/null 2>&1; then
  cd "$ROOT_DIR/Java" || exit 1
  mvn spring-boot:run >"$RUN_DIR/backend.log" 2>&1 &
  echo "Starting the PeakSAT API on http://localhost:8080 ..."
fi

cd "$ROOT_DIR/SATProject" || exit 1
echo "Starting PeakSAT with hot reload on http://localhost:5173 ..."
echo "Keep this window open while using the local site."
npm run dev
