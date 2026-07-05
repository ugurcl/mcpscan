# Demo recording

The README GIF is rendered from [`demo.tape`](demo.tape) with [vhs](https://github.com/charmbracelet/vhs).

## Render it

1. Install vhs (it also needs `ffmpeg` and `ttyd`):
   - macOS: `brew install vhs`
   - Windows: `scoop install vhs` or `winget install charmbracelet.vhs`
   - Linux / Go: `go install github.com/charmbracelet/vhs@latest`
2. Make the `mcpscan` command resolve locally without publishing:
   ```bash
   npm run build
   npm link
   ```
3. From the project root, render:
   ```bash
   vhs demo/demo.tape
   ```
   This writes `demo/demo.gif`.

Then reference it at the top of the main README.
