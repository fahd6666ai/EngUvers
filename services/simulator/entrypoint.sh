#!/bin/bash
# EngUvers simulator container entrypoint. Deliberately much smaller than
# Velxio's own docker/entrypoint.sh: we only ship the arduino-cli lane
# (AVR + RP2040 — the Free/Student Pro tier per the plan), not ESP32/
# ESP-IDF/QEMU/STM32, which need a much heavier image and aren't needed
# for Phase 2's test target (Blink on an Arduino Uno). Adding those
# later means extending this script and the Dockerfile, not touching
# the submodule.
set -e

if [ ! -f /root/.arduino15/arduino-cli.yaml ]; then
  echo "Initializing arduino-cli config..."
  arduino-cli config init 2>/dev/null || true
  arduino-cli config add board_manager.additional_urls \
    https://github.com/earlephilhower/arduino-pico/releases/download/global/package_rp2040_index.json 2>/dev/null || true
fi

arduino-cli core update-index 2>/dev/null || true
arduino-cli core install arduino:avr 2>/dev/null || true
arduino-cli core install rp2040:rp2040 2>/dev/null || true

echo "Starting Velxio backend (uvicorn, 127.0.0.1:8001)..."
uvicorn app.main:app --host 127.0.0.1 --port 8001 &
BACKEND_PID=$!

echo "Starting nginx (0.0.0.0:80)..."
nginx -g "daemon off;" &
NGINX_PID=$!

# Exit (and let Docker restart the container) if either process dies.
wait -n "$BACKEND_PID" "$NGINX_PID"
exit $?
