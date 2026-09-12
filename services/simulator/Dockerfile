# EngUvers Circuit Lab simulator image.
#
# Builds the UNMODIFIED `velxio` submodule (pinned commit, see
# ../../docs/LICENSING.md) with the EngUvers Bridge injected purely
# through Velxio's own build-time extension points:
#   - frontend: VITE_PRO_BUILD + PRO_OVERLAY_PATH (see vite.config.ts)
#   - backend:  a `backend/app/pro/` package auto-loaded by main.py
#     (`try: from app.pro import register_pro / except ImportError: pass`)
#
# Scope: arduino-cli lane only (AVR + RP2040 boards) — no ESP-IDF/QEMU/
# STM32. Those need Velxio's much heavier Dockerfile.standalone stages;
# add them here later if a phase actually needs ESP32/Pi boards.
#
# Build context must be the repo root (see docker-compose.yml) so this
# Dockerfile can reach both services/simulator/velxio (the submodule) and
# services/simulator/bridge-overlay (our code).

FROM node:20-slim AS frontend-builder

ARG VITE_ENGUVERS_ORIGIN=http://localhost:3000

WORKDIR /build
COPY services/simulator/velxio/frontend/ ./frontend/
# Inject the Bridge exactly the way a real pro overlay is deployed
# ("physically COPYed into src/pro/", per vite.config.ts's own comment).
COPY services/simulator/bridge-overlay/frontend/ ./frontend/src/pro/

WORKDIR /build/frontend
# --legacy-peer-deps works around a known npm 10 arborist crash on this
# dependency tree (unrelated to our overlay) — see services/simulator/README.md.
RUN npm install --legacy-peer-deps
ENV VITE_PRO_BUILD=true
ENV PRO_OVERLAY_PATH=./src/pro
ENV VITE_ENGUVERS_ORIGIN=${VITE_ENGUVERS_ORIGIN}
RUN npx vite build


FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates nginx git \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh \
    | BINDIR=/usr/local/bin sh

WORKDIR /app

COPY services/simulator/velxio/backend/requirements.txt ./requirements.txt
COPY services/simulator/bridge-overlay/backend/requirements-overlay.txt ./requirements-overlay.txt
RUN pip install --no-cache-dir -r requirements.txt -r requirements-overlay.txt

COPY services/simulator/velxio/backend/app/ ./app/
# Auto-loaded by app/main.py's existing try/except ImportError — see the
# header comment above. Not a modification to any existing file.
COPY services/simulator/bridge-overlay/backend/pro/ ./app/pro/

COPY --from=frontend-builder /build/frontend/dist /usr/share/nginx/html
COPY services/simulator/velxio/docker/nginx.conf /etc/nginx/conf.d/default.conf
RUN rm -f /etc/nginx/sites-enabled/default

COPY services/simulator/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

CMD ["/app/entrypoint.sh"]
