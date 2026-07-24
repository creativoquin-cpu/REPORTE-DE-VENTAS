import Image from "next/image";

/**
 * Quino, la mascota de la marca (robot teal). Once emociones optimizadas viven
 * en /public/quino/*.png (512px, fondo transparente). Este wrapper las escala
 * por altura manteniendo su proporción natural con height/width "intrínsecos"
 * de next/image vía `sizes`; como cada PNG tiene distinta relación, usamos un
 * contenedor de alto fijo y `width:auto` con object-contain.
 */
export type EmocionQuino =
  | "bienvenida"
  | "presentando"
  | "celebrando"
  | "sorprendido"
  | "sorprendido-2"
  | "pensando"
  | "analizador"
  | "ideas"
  | "trabajando"
  | "confirmando"
  | "explicando";

interface QuinoProps {
  emocion: EmocionQuino;
  /** Alto en px. El ancho se ajusta solo a la proporción de la imagen. */
  alto: number;
  className?: string;
  priority?: boolean;
}

export function Quino({ emocion, alto, className, priority }: QuinoProps) {
  return (
    <Image
      src={`/quino/${emocion}.png`}
      alt=""
      aria-hidden
      width={512}
      height={512}
      priority={priority}
      style={{ height: alto, width: "auto" }}
      className={className}
    />
  );
}
