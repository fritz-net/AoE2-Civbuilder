# AoE2-Civbuilder Docker Usage Guide

This guide explains how to build and run AoE2-Civbuilder using Docker. For general project information, features, and architecture, see the main [`README.md`](README.md:1).

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed on your system, or preferably [Podman](https://podman.io/) (with optional Podman Desktop UI) since its open source.

---

## Dockerfiles Overview

AoE2-Civbuilder provides two Dockerfiles for different use cases:

- [`Dockerfile.build-cpp`](Dockerfile.build-cpp:1):
  Builds the C++ components (the genieutils for .dat file editing) from source inside the container. Use this if you want to ensure the latest C++ code is compiled or if you are developing/updating the C++/genie parts. This Dockerfile uses a 4-stage multi-stage build for optimal layer caching: separate stages for C++ build dependencies, C++ compilation, Node.js dependencies, and final runtime assembly.

- [`Dockerfile.prebuilt-cpp`](Dockerfile.prebuilt-cpp:1):
  Uses precompiled C++ binaries (the genieutils). Use this for faster builds if you do not need to recompile the C++ code.

---

## Building and Running

### 1. Using `Dockerfile.build-cpp`

**Build the image:**
```sh
git submodule update --init --recursive # once every now and then is enough

docker build -f Dockerfile.build-cpp -t aoe2-civbuilder:build-cpp .
```

**Run the container:**
```sh
docker run -p 4000:4000 aoe2-civbuilder:build-cpp
```

### 2. Using `Dockerfile.prebuilt-cpp`

**Build the image:**
```sh
docker build -f Dockerfile.prebuilt-cpp -t aoe2-civbuilder:prebuilt-cpp .


# or build and run
docker build -t aoe2-civbuilder:build-cpp -f Dockerfile.build-cpp . && docker run --rm -e CIVBUILDER_HOSTNAME=http://localhost:4000 -p 4000:4000 aoe2-civbuilder:build-cpp
docker build -t aoe2-civbuilder:prebuilt-cpp -f Dockerfile.prebuilt-cpp . && docker run --rm -e CIVBUILDER_HOSTNAME=http://localhost:4000 -p 4000:4000 aoe2-civbuilder:prebuilt-cpp
```

**Run the container:**
```sh
docker run -p 4000:4000 aoe2-civbuilder:prebuilt-cpp

# if u like to adjust the links
docker run -p 4000:4000 -e CIVBUILDER_HOSTNAME=http://localhost:4000/ aoe2-civbuilder:prebuilt-cpp 
```

---

## Accessing the Application

Once the container is running, access AoE2-Civbuilder at:  
[http://localhost:4000/civbuilder](http://localhost:4000/civbuilder)

---

## Data Persistence and Volumes

To persist user-generated mods or other data, you can mount a local directory to the container. For example:

```sh
docker run -p 4000:4000 -v $(pwd)/modding/requested_mods:/app/modding/requested_mods aoe2-civbuilder:build-cpp
```

Adjust the paths as you want for your environment.

---

## Environment Variables and Ports

- The default exposed port is **4000**. You can change the host port mapping if needed (e.g., `-p 8080:4000`).
- to set a different hostname then `https://krakenmeister.com/civbuilder`, use the `CIVBUILDER_HOSTNAME` environment variable:
```sh
docker run -p 4000:4000 -e CIVBUILDER_HOSTNAME=http://localhost:4000/ aoe2-civbuilder:prebuilt-cpp
```

---

## Additional Notes

- For development or debugging, you may want to mount the entire project directory as a volume.
- If you need to recompile the C++ code, use [`Dockerfile.build-cpp`](Dockerfile.build-cpp:1).
- For faster startup and if you do not need to modify C++ code, use [`Dockerfile.prebuilt-cpp`](Dockerfile.prebuilt-cpp:1).

### Build Optimization

The [`Dockerfile.build-cpp`](Dockerfile.build-cpp:1) uses a 4-stage multi-stage build for optimal Docker layer caching:

1. **Stage 1 (cpp-dependencies)**: Installs C++ build tools and libraries - cached unless base image changes
2. **Stage 2 (cpp-build)**: Builds C++ binaries - cached unless `modding/` directory changes  
3. **Stage 3 (node-dependencies)**: Installs Node.js dependencies - cached unless `package.json` changes
4. **Stage 4 (build)**: Final runtime image - assembles artifacts from previous stages

This structure ensures that:
- Changes to C++ code don't invalidate Node.js dependency cache (saving minutes on npm install)
- Changes to Node.js code don't trigger C++ recompilation
- Build and runtime dependencies are properly separated
- Docker can maximize layer reuse for faster rebuilds

---

For further details on project structure, features, or troubleshooting, see the main [`README.md`](README.md:1).