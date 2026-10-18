import { useState } from "react";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Escudo da Epic como máscara: herda a cor do texto. */
export function EpicIcon({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block aspect-[1920/2228] h-6 shrink-0 bg-current", className)}
      style={{
        maskImage: "url(/epicgames-mask.png)",
        WebkitMaskImage: "url(/epicgames-mask.png)",
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
      }}
    />
  );
}

/** Imagem em vez de emoji: o emoji de bandeira não aparece no Windows. */
export function Flag({ code, className }: { code: string; className?: string }) {
  return (
    <img
      src={`https://flagcdn.com/${code.toLowerCase()}.svg`}
      alt=""
      width={20}
      height={15}
      loading="lazy"
      className={cn("h-[15px] w-5 shrink-0 rounded-[2px] object-cover", className)}
    />
  );
}

/** Foto do jogador: a skin equipada ou, sem ela, as iniciais do nome. */
export function Avatar({ src, name, className }: { src?: string | null; name: string; className?: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = src && failedSrc !== src;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-foreground/10 font-semibold text-foreground select-none",
        className,
      )}
    >
      {showImage ? (
        <img src={src} alt="" className="size-full object-cover object-top" onError={() => setFailedSrc(src)} />
      ) : (
        <span>{initials(name)}</span>
      )}
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return <img src="/llama-api.png" alt="Llama Checker" className={cn("size-8 shrink-0 object-contain", className)} />;
}
