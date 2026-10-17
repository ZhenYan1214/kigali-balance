# Clean Linux environment used to reproduce every number in the repository from scratch.
#   docker build -t kigali-ci ci/
#   docker run --rm -v "$PWD:/src:ro" kigali-ci
# The container clones the mounted repository (committed state only) and runs scripts/ci_check.sh.
FROM python:3.12-bookworm

ARG NODE_VERSION=24.12.0
ARG FOUNDRY_VERSION=v1.8.5

RUN apt-get update \
 && apt-get install -y --no-install-recommends git curl ca-certificates xz-utils chromium fonts-dejavu-core \
 && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz" \
    | tar -xJ -C /usr/local --strip-components=1

ENV FOUNDRY_DIR=/root/.foundry PATH=/root/.foundry/bin:$PATH
RUN curl -fsSL https://foundry.paradigm.xyz | bash && foundryup --install "${FOUNDRY_VERSION}"

WORKDIR /work
CMD ["bash", "-c", "git config --global --add safe.directory '*' && git clone --recurse-submodules --quiet /src /work/kigali-balance && cd /work/kigali-balance && bash scripts/ci_check.sh"]
