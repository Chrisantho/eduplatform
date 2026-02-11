#!/bin/bash

echo "Starting EduPlatform..."

cd /home/runner/workspace/backend
if [ ! -f target/eduplatform-backend-1.0.0.jar ]; then
  echo "Building backend JAR..."
  mvn package -DskipTests -q
fi

echo "Starting Spring Boot backend on port 8080..."
java -jar target/eduplatform-backend-1.0.0.jar &
BACKEND_PID=$!

sleep 3

echo "Starting Vite frontend dev server on port 5000..."
cd /home/runner/workspace/frontend
npx vite --host 0.0.0.0 --port 5000 &
FRONTEND_PID=$!

cleanup() {
  echo "Shutting down..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
  exit 0
}

trap cleanup SIGINT SIGTERM

wait -n
cleanup
