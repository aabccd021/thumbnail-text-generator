{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-23.11";
    nix-filter.url = "github:numtide/nix-filter";
  };

  outputs = inputs: with inputs.nixpkgs.legacyPackages.x86_64-linux;
    let

      filter = inputs.nix-filter.lib;

      src = filter {
        root = ./.;
        include = [
          "server.ts"
          "index.html.ts"
          "generate-text.ts"
          "client.ts"
        ];
      };

      nodeModules = buildNpmPackage {
        name = "scripts";
        src = filter { root = ./.; include = [ "package.json" "package-lock.json" ]; };
        npmDepsHash = builtins.readFile ./npm-deps-hash.txt;
        makeCacheWritable = true;
        dontNpmBuild = true;
        installPhase = "mkdir $out && cp -r node_modules $out";
      };

      zenAntique = fetchurl {
        url = "https://github.com/google/fonts/raw/main/ofl/zenantique/ZenAntique-Regular.ttf";
        hash = "sha256-jFz3oTaDfucF0Gu8Ez6hisBrfdKE84qs6R9d42clwxU=";
      };

      delaGothicOne = fetchurl {
        url = "https://github.com/google/fonts/raw/main/ofl/delagothicone/DelaGothicOne-Regular.ttf";
        hash = "sha256-T/h6CWXxsFBeWixYQkvGrTz/J+VqgvIcL8nWsOOFfuI=";
      };

      rocknRollOne = fetchurl {
        url = "https://github.com/google/fonts/raw/main/ofl/rocknrollone/RocknRollOne-Regular.ttf";
        hash = "sha256-3A9f+XWFGCf2Pyxr/tEo/7yhS2OZoQ+14XESFcAQhSY=";
      };

      staticAssets = runCommand "staticAssets" { } ''
        mkdir -p $out/fonts
      '';

      thumbnailGenerator = runCommand "thumbnailGenerator" { } ''
        cp -r ${src}/* .
        cp -r ${nodeModules}/node_modules ./node_modules

        ${esbuild}/bin/esbuild \
          ./server.ts \
          --platform=node \
          --format=esm \
          --bundle \
          --banner:js="#!${nodejs_20}/bin/node" \
          --outfile=$out/server.mjs

        mkdir -p $out/assets

        mkdir -p $out/assets/fonts
        cp ${zenAntique} $out/assets/fonts/zenantique.ttf
        cp ${delaGothicOne} $out/assets/fonts/delagothicone.ttf
        cp ${rocknRollOne} $out/assets/fonts/rocknrollone.ttf

        ${esbuild}/bin/esbuild \
          ./client.ts \
          --platform=browser \
          --format=esm \
          --target=es6 \
          --bundle \
          --outfile=$out/assets/client.js
      '';


      mkApp = { runPhase }: {
        type = "app";
        program = toString (writeShellScript "app" ''
          set -euxo pipefail
          cd $(git rev-parse --show-toplevel)
          ${runPhase}
        '');
      };


    in
    {
      packages.x86_64-linux = {
        inherit
          nodeModules
          ;
      };

      devShells.x86_64-linux.default = mkShellNoCC {
        buildInputs = [
          nodePackages_latest.typescript
          nodePackages_latest.typescript-language-server
          nixpkgs-fmt
          nodejs_20
        ];
      };

      apps.x86_64-linux.thumbnail-generator = {
        type = "app";
        program = "${thumbnailGenerator}/bin/server.mjs";
      };


      apps.x86_64-linux.fix = mkApp {
        runPhase = ''
          git add --no-all
          updateHash() {
            ${prefetch-npm-deps}/bin/prefetch-npm-deps ./package-lock.json > ./npm-deps-hash.txt
            git add ./npm-deps-hash.txt
            nix build -L ".#nodeModules"
          }

          ${nodejs_20}/bin/npm install --package-lock-only
          nix build -L ".#nodeModules" || updateHash
          rm -rf ./node_modules || true
          cp -r ./result/node_modules .
          chmod -R 777 ./node_modules
          cd ../..

          nix build -L .#client.devJs
          cp ./result/import-map.gen.json ./packages/server

        '';
      };

      apps.x86_64-linux.dev = mkApp {
        runPhase = ''
          out=$(mktemp -d)

          cp -r ${thumbnailGenerator}/* $out
          chmod -R 777 $out

          ${concurrently}/bin/concurrently \
            --names "server-build,client-build,server-run" \
            "${esbuild}/bin/esbuild \
              ./server.ts \
              --platform=node \
              --format=esm \
              --bundle \
              --watch=forever \
              --outfile=$out/server.mjs" \
            "${esbuild}/bin/esbuild \
              ./client.ts \
              --platform=browser \
              --format=esm \
              --target=es6 \
              --bundle \
              --watch=forever \
              --outfile=$out/assets/client.js" \
            "${nodejs_20}/bin/node --watch $out/server.mjs" \
        '';
      };

    };
}
