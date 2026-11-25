# Studio Matzu — vídeo motion graphic

- `studio_matzu_motion_leve.mp4` — vídeo final (1080p, 30fps, 65s, 5 Mbps).
- A versão em alta (12 Mbps, ~99 MB) não é versionada (`.gitignore`).

## Como foi gerado
1. `scripts/narrate.py` — narração pt-BR com Kokoro TTS (`pip install kokoro-onnx soundfile`; modelos `kokoro-v1.0.onnx` e `voices-v1.0.bin` dos releases de thewh1teagle/kokoro-onnx). Gera `raw.wav` e `timeline.json`.
2. Pós-processamento da voz e mixagem com ffmpeg (pitch -5%, EQ, compressão, ducking da trilha).
3. `scripts/music.py` — trilha original sintetizada com numpy.
4. `src/index.html` — animação em canvas, sincronizada com `timeline.json` (cores, fontes e logo de studiomatzu.com).
5. `scripts/render.js` — renderiza quadro a quadro com Playwright e codifica com ffmpeg:
   `node scripts/render.js src video out.mp4 65`
