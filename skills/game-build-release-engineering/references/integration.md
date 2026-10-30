# Integration playbook

For browser targets run from an HTTP server; browser security semantics can differ under file://. For standalone HTML, produce one self-contained file, then still smoke-test it in a real browser.
A reproducible archive normalizes timestamps and file ordering. The bundled script logs per-file SHA-256 digests. It does not minify, tree-shake, or compile the user's code.
Platform-specific delivery matrix: itch.io HTML5 => zipped static build, desktop installer => external packager, Steam => Steamworks/depots outside this skill, YouTube Playables => developer-guidance-specific checks (not automated here).
