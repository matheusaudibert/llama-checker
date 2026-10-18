// Gera public/epicgames-mask.png a partir do ícone colorido public/epicgames.png:
// o escudo vira preto opaco e as letras (brancas) viram transparentes, para
// usar como mask-image e herdar a cor do texto.
import fs from "node:fs";
import { PNG } from "pngjs";

const src = PNG.sync.read(fs.readFileSync("public/epicgames.png"));
const out = new PNG({ width: src.width, height: src.height });

for (let i = 0; i < src.data.length; i += 4) {
  const [r, g, b, a] = src.data.subarray(i, i + 4);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  // Escuro (escudo) fica opaco; claro (letras) some, com borda suave.
  const keep = Math.min(1, Math.max(0, (0.75 - luminance) / 0.35));
  out.data[i] = 0;
  out.data[i + 1] = 0;
  out.data[i + 2] = 0;
  out.data[i + 3] = Math.round(a * keep);
}

fs.writeFileSync("public/epicgames-mask.png", PNG.sync.write(out));
console.log(`public/epicgames-mask.png ${src.width}x${src.height}`);
