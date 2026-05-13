{
  inputs = {
    flake-utils.url = "github:numtide/flake-utils";
    nixpkgs = {
      url = "github:NixOS/nixpkgs/nixos-unstable";
    };
    rust-overlay = {
      url = "github:oxalica/rust-overlay";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    pre-commit-hooks = {
      url = "github:cachix/pre-commit-hooks.nix";
      inputs = {
        nixpkgs.follows = "nixpkgs";
      };
    };
  };

  outputs = {
    self,
    nixpkgs,
    flake-utils,
    rust-overlay,
    pre-commit-hooks,
  }:
    {
      overlays.default = _final: _prev: {};
    }
    // flake-utils.lib.eachDefaultSystem
    (
      system: let
        pkgs = import nixpkgs {
          inherit system;
          overlays = [self.overlays.default rust-overlay.overlays.default];
        };
        rustToolchain = pkgs.rust-bin.fromRustupToolchainFile ./rust-toolchain.toml;
        tree-sitter-env = pkgs.stdenv.mkDerivation {
          name = "tree-sitter-env";
          nativeBuildInputs = with pkgs; [
            makeWrapper
          ];
          dontUnpack = true;
          dontBuild = true;
          installPhase = ''
            mkdir -p $out/bin
            makeWrapper \
              ${pkgs.tree-sitter}/bin/tree-sitter \
              $out/bin/tree-sitter \
              --prefix PATH : "${with pkgs; lib.makeBinPath [stdenv.cc nodejs]}"
          '';
        };
      in rec {
        checks = {
          pre-commit = pre-commit-hooks.lib.${system}.run {
            src = ./.;

            hooks = {
              alejandra.enable = true;

              tree-sitter = {
                enable = true;
                name = "tree-sitter tests";
                entry = "${tree-sitter-env}/bin/tree-sitter test";
                pass_filenames = false;
              };
            };
          };
        };

        devShells = {
          default = pkgs.mkShell {
            nativeBuildInputs = with pkgs; [
              nodejs_22
              node-gyp
              tree-sitter
              rustToolchain
              python3
            ];

            inherit (checks.pre-commit) shellHook;
          };
        };

        packages = {
          default = packages.tree-sitter-bql;

          tree-sitter-bql = pkgs.tree-sitter.buildGrammar {
            language = "bql";
            generate = true;
            src = ./.;
            version = "n/a";
          };

          inherit (pkgs) tree-sitter;
        };
      }
    );
}
