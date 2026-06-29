#!/bin/zsh

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
RUN_DIR="$ROOT_DIR/.run"

mkdir -p "$RUN_DIR"

if ! nc -z 127.0.0.1 3306 >/dev/null 2>&1; then
  echo "MySQL is stopped. Enter your Mac password to start it."
  sudo /usr/local/mysql/support-files/mysql.server start || exit 1
fi

if ! lsof -nP -iTCP:8080 -sTCP:LISTEN >/dev/null 2>&1; then
  cd "$ROOT_DIR/Java" || exit 1
  JAR_PATH="$ROOT_DIR/Java/target/sale-0.0.1-SNAPSHOT.jar"

  if [[ ! -f "$JAR_PATH" ]] || find src pom.xml -newer "$JAR_PATH" -print -quit | grep -q .; then
    echo "Building the PeakSAT API..."
    mvn -q -DskipTests package || exit 1
  fi

  nohup java -jar "$JAR_PATH" >"$RUN_DIR/backend.log" 2>&1 </dev/null &
  echo $! >"$RUN_DIR/backend.pid"
  echo "Starting the PeakSAT API on http://localhost:8080 ..."

  for _ in {1..60}; do
    curl -fsS "http://localhost:8080/api/sat/domains" >/dev/null 2>&1 && break
    sleep 0.5
  done

  if ! curl -fsS "http://localhost:8080/api/sat/domains" >/dev/null 2>&1; then
    echo "The API could not start. Check $RUN_DIR/backend.log"
    exit 1
  fi
fi

if lsof -nP -iTCP:5173 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "PeakSAT is already running on http://localhost:5173"
  open "http://localhost:5173"
  exit 0
fi

cd "$ROOT_DIR/SATProject" || exit 1
echo "Starting PeakSAT with hot reload on http://localhost:5173 ..."
echo "Keep this window open while using the local site."
npm run dev
