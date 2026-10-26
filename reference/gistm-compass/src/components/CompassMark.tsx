// Marca oficial do GISTM Compass: a agulha de uma bússola dentro de um limbo
// graduado (ver manual de identidade visual). O anel/ticks/pivô herdam a cor
// do texto (currentColor), como um ícone do lucide-react — a mesma
// convenção usada nos lugares onde este componente substitui o ícone
// genérico `Compass`. A agulha em si (azul ao norte, tinta/navy ao sul) é
// fixa: é o elemento reconhecível da marca, não algo para re-colorir por
// contexto.
export function CompassMark({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="16" cy="16" r="14.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <line x1="16" y1="2.3" x2="16" y2="5.3" stroke="currentColor" strokeWidth="1.6" />
      <line x1="16" y1="26.7" x2="16" y2="29.7" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <line x1="2.3" y1="16" x2="5.3" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <line x1="26.7" y1="16" x2="29.7" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <polygon points="16,5.5 19,16 16,16" fill="#0b6fde" />
      <polygon points="16,5.5 13,16 16,16" fill="#7db8f7" />
      <polygon points="16,26.5 19,16 16,16" fill="#132a4c" />
      <polygon points="16,26.5 13,16 16,16" fill="#0f2340" />
      <circle cx="16" cy="16" r="1.5" fill="currentColor" />
    </svg>
  );
}
