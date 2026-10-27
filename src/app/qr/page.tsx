import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Download, ShieldCheck, Sparkles } from 'lucide-react';

export const metadata = {
  title: 'Código QR Oficial · Memorial Lorenzo Chamba',
  description: 'Código QR permanente y gratuito para la lápida o placa conmemorativa de Lorenzo Chamba.',
};

export default function QRPage() {
  const urlMemorial = 'https://lorenzo-qr.vercel.app';

  return (
    <main className="qr-page-container">
      <div className="family-toolbar">
        <Link className="text-link" href="/">
          <ArrowLeft size={16} /> Volver al memorial
        </Link>
        <Link className="text-link" href="/admin">
          Espacio familiar
        </Link>
      </div>

      <div className="qr-card-main">
        <div className="qr-badge">
          <ShieldCheck size={16} /> 100% Permanente · Sin caducidad · Gratuito
        </div>

        <h1>Código QR del Memorial</h1>
        <p className="qr-subtitle">
          Este código QR enlaza directamente a la página principal de <strong>Lorenzo Chamba</strong>.
          Es un código estático definitivo: <strong>nunca vencerá ni requerirá pagos</strong>.
        </p>

        <div className="qr-image-wrapper">
          <Image
            src="/qr-lorenzo.png"
            alt="Código QR de Lorenzo Chamba"
            width={320}
            height={320}
            priority
            unoptimized
          />
          <p className="qr-url-display">
            {urlMemorial}
          </p>
        </div>

        <div className="qr-download-actions">
          <a
            href="/qr-lorenzo.png"
            download="QR-Lorenzo-Chamba-Alta-Resolucion.png"
            className="btn-modal-action qr-btn"
          >
            <Download size={18} /> Descargar en PNG (Imagen 2048px)
          </a>

          <a
            href="/qr-lorenzo.svg"
            download="QR-Lorenzo-Chamba-Vectorial.svg"
            className="btn-secondary qr-btn"
          >
            <Download size={18} /> Descargar en SVG (Grabado Láser / Placa)
          </a>
        </div>

        <div className="qr-tips-box">
          <h3>
            <Sparkles size={18} /> Recomendaciones para la lápida o placa:
          </h3>
          <ul>
            <li>
              <strong>Tamaño mínimo recomendado:</strong> 4 cm × 4 cm (o 5 cm × 5 cm) para que cualquier celular lo escanee al instante desde cierta distancia, incluso bajo el sol.
            </li>
            <li>
              <strong>Nivel de corrección alto (H):</strong> Este código fue generado con tolerancia a daños del 30%, lo que permite que siga funcionando incluso si la placa sufre polvo, lluvia o desgaste leve con los años.
            </li>
            <li>
              <strong>Materiales recomendados:</strong> Porcelana cerámica horneada, placa de acero inoxidable grabada en bajo relieve, granito o acrílico protector para exteriores. El archivo <strong>SVG</strong> es el que piden los talleres de grabado láser.
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
