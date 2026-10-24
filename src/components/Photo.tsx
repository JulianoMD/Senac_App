import { useLayoutEffect, useRef, useState } from "react";

// Fotos que já carregaram nesta visita: aparecem nítidas na hora, sem refazer o efeito de foco
// (era isso que deixava a foto da oferta borrada logo depois de abrir).
const loadedSources = new Set<string>();

// Versão minúscula da mesma foto, que carrega quase na hora e aparece desfocada por trás.
function tinyVersion(src: string) {
  return src.includes("images.unsplash.com") ? src.replace(/w=\d+/, "w=24").replace(/q=\d+/, "q=40") : null;
}

export default function Photo({
  src,
  alt = "",
  className = "",
  style,
  eager = false,
}: {
  src: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  eager?: boolean;
}) {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(() => loadedSources.has(src));
  // A prévia desfocada só é necessária para fotos que ainda não estavam prontas.
  const [cachedAtMount] = useState(() => loadedSources.has(src));
  const tiny = cachedAtMount ? null : tinyVersion(src);

  useLayoutEffect(() => {
    const image = ref.current;
    if (loadedSources.has(src) || (image?.complete && image.naturalWidth)) {
      loadedSources.add(src);
      setLoaded(true);
    }
  }, [src]);

  function markLoaded() {
    loadedSources.add(src);
    setLoaded(true);
  }

  return (
    <>
      {tiny && <img className="photo-placeholder" src={tiny} alt="" aria-hidden="true" />}
      <img
        ref={ref}
        className={`photo ${loaded ? "is-loaded" : ""} ${className}`}
        src={src}
        alt={alt}
        style={style}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onLoad={markLoaded}
        onError={markLoaded}
      />
    </>
  );
}
