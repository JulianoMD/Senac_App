import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";

type Detector = { detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]> };

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats?: string[] }) => Detector;
  }
}

// Leitor do código no balcão: câmera + BarcodeDetector onde o navegador tem (Chrome no Android).
// No iPhone o Safari ainda não lê código pela câmera, então o atendente digita o código.
// `onCode` devolve true quando o código bate com uma reserva (aí a leitura para).
export default function CodeScanner({ onCode }: { onCode: (value: string) => boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // A câmera só reinicia quando liga/desliga, não a cada novo render da lista de reservas.
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;
  const supported = typeof window.BarcodeDetector === "function" && !!navigator.mediaDevices?.getUserMedia;
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState<"idle" | "starting" | "on" | "denied">("idle");
  const [typed, setTyped] = useState("");
  const [miss, setMiss] = useState(false);

  useEffect(() => {
    if (!active || !window.BarcodeDetector) return;
    let stream: MediaStream | undefined;
    let timer = 0;
    let stopped = false;
    const detector = new window.BarcodeDetector({ formats: ["ean_13", "code_128", "qr_code"] });
    setStatus("starting");
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then(async (media) => {
        if (stopped) {
          media.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = media;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = media;
        await video.play();
        setStatus("on");
        const scan = async () => {
          if (stopped) return;
          try {
            const codes = await detector.detect(video);
            if (codes.some((code) => onCodeRef.current(code.rawValue))) return;
          } catch {
            // Quadro sem código legível: tenta de novo no próximo.
          }
          timer = window.setTimeout(scan, 250);
        };
        scan();
      })
      .catch(() => setStatus("denied"));
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [active]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const found = onCode(typed);
    setMiss(!found);
    if (found) setTyped("");
  }

  return (
    <div className="scanner">
      {supported && status !== "denied" ? (
        active ? (
          <div className="scanner-video">
            <video ref={videoRef} muted playsInline aria-label="Câmera lendo o código" />
            <span className="scanner-frame" aria-hidden="true" />
            {status === "starting" && <span className="scanner-hint">Abrindo a câmera…</span>}
          </div>
        ) : (
          <button className="primary-button primary-button--wide" type="button" onClick={() => setActive(true)}>
            <Icon name="expand" size={18} />
            Ler código com a câmera
          </button>
        )
      ) : (
        <p className="scanner-note">
          {status === "denied"
            ? "Sem acesso à câmera. Digite o código que aparece na tela do aluno."
            : "Este navegador não lê código pela câmera. Digite o código que aparece na tela do aluno."}
        </p>
      )}

      <form className="scanner-form" onSubmit={submit}>
        <label>
          <span>Código do aluno</span>
          <input
            value={typed}
            onChange={(event) => {
              setTyped(event.target.value);
              setMiss(false);
            }}
            placeholder="FZ-1234"
            autoCapitalize="characters"
            autoComplete="off"
            inputMode="text"
          />
        </label>
        <button className="code-button" type="submit" disabled={!typed.trim()}>
          Confirmar
        </button>
        {miss && <p role="alert">Nenhuma reserva pendente com esse código nesta cantina.</p>}
      </form>
    </div>
  );
}
