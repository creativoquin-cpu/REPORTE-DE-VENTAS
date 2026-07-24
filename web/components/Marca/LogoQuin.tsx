import Image from "next/image";

/**
 * Logo oficial de Agencia Quin (Q + corona + cursor), extraído del manual de
 * marca. Dos tonos según el fondo, como manda el manual (pág 5):
 *  - "oscuro": texto blanco + corona teal, para fondos oscuros (panel, login).
 *  - "claro":  texto negro + corona teal, para fondos claros (vista pública).
 * No se altera color ni proporción; solo se escala por altura (relación 558:401).
 */
const RATIO = 558 / 401;

interface LogoQuinProps {
  tono: "claro" | "oscuro";
  /** Alto en px; el ancho se calcula manteniendo la proporción original. */
  alto: number;
  className?: string;
  priority?: boolean;
}

export function LogoQuin({ tono, alto, className, priority }: LogoQuinProps) {
  const src = tono === "oscuro" ? "/quin-logo-oscuro.png" : "/quin-logo-claro.png";
  return (
    <Image
      src={src}
      alt="Agencia Quin"
      height={alto}
      width={Math.round(alto * RATIO)}
      priority={priority}
      className={className}
    />
  );
}
