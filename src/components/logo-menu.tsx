import { Download, ExternalLink } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Logo, PlatformIcon } from "@/components/ui/misc";
import { useI18n } from "@/lib/i18n";

const API_DOCS = "https://llamaapi.mintlify.site";
const REPOSITORY = "https://github.com/matheusaudibert/llama-checker";

const ITEM_CLASS =
  "flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium outline-none transition-colors hover:bg-foreground/[0.07] focus-visible:bg-foreground/[0.07]";

/**
 * Monta o logo como no cabeçalho, a llama com "Llama Checker" ao lado na Burbank Big,
 * em PNG transparente. Mesmas proporções do cabeçalho (32px de imagem, texto de 20px), 8x maior.
 */
async function renderLogo(): Promise<Blob | null> {
  const scale = 8;
  const imageSize = 32 * scale;
  const fontSize = 20 * scale;
  const gap = 10 * scale;
  const font = `900 ${fontSize}px "Burbank Big"`;
  const text = "Llama Checker";

  await document.fonts.load(font);
  const image = new Image();
  image.src = "/llama-api.png";
  await image.decode();

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  // Mesmo espaçamento entre letras do cabeçalho (tracking-wide).
  const spacing = `${fontSize * 0.025}px`;
  ctx.font = font;
  ctx.letterSpacing = spacing;
  const textWidth = Math.ceil(ctx.measureText(text).width);
  canvas.width = imageSize + gap + textWidth;
  canvas.height = imageSize;

  // Mudar o tamanho do canvas apaga o estado do contexto.
  ctx.font = font;
  ctx.letterSpacing = spacing;
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "middle";
  // Como o object-contain do cabeçalho: a llama cabe no quadrado sem esticar.
  const fit = Math.min(imageSize / image.naturalWidth, imageSize / image.naturalHeight);
  const width = image.naturalWidth * fit;
  const height = image.naturalHeight * fit;
  ctx.drawImage(image, (imageSize - width) / 2, (imageSize - height) / 2, width, height);
  ctx.fillText(text, imageSize + gap, imageSize / 2);

  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
}

async function downloadLogo() {
  const blob = await renderLogo();
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "llama-checker.png";
  link.click();
  URL.revokeObjectURL(url);
}

async function openLogo() {
  // A aba abre já no clique: aberta depois do await, o navegador a bloquearia como pop-up.
  const tab = window.open("", "_blank");
  const blob = await renderLogo();
  if (!tab) return;
  if (!blob) return tab.close();
  tab.location.href = URL.createObjectURL(blob);
}

/** Botão direito na marca abre um menu com os links da API e do repositório e o download do logo, na posição do cursor. */
export function LogoMenu({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!position) return;
    const close = () => setPosition(null);
    const onPointer = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) close();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    window.addEventListener("blur", close);
    menuRef.current?.querySelector("a")?.focus();
    return () => {
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("blur", close);
    };
  }, [position]);

  const links = [
    { href: API_DOCS, label: "Llama API", icon: <Logo className="size-5" /> },
    { href: REPOSITORY, label: t.header.repository, icon: <PlatformIcon type="github" className="size-5" /> },
  ];

  return (
    <div
      className="min-w-0"
      onContextMenu={(event) => {
        event.preventDefault();
        setPosition({ x: event.clientX, y: event.clientY });
      }}
    >
      {children}
      {position ? (
        <div
          ref={menuRef}
          role="menu"
          style={{ left: position.x, top: position.y }}
          className="fixed z-50 min-w-48 rounded-[10px] border border-border bg-card p-1 shadow-lg"
        >
          {links.map((item) => (
            <a
              key={item.href}
              role="menuitem"
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setPosition(null)}
              className={ITEM_CLASS}
            >
              {item.icon}
              {item.label}
            </a>
          ))}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setPosition(null);
              void openLogo();
            }}
            className={ITEM_CLASS}
          >
            <ExternalLink className="size-5" />
            {t.header.openLogo}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setPosition(null);
              void downloadLogo();
            }}
            className={ITEM_CLASS}
          >
            <Download className="size-5" />
            {t.header.downloadLogo}
          </button>
        </div>
      ) : null}
    </div>
  );
}
