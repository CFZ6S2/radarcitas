import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Anúnciate Gratis en RadarCitas | Aparece en el Mapa de tu Ciudad",
  description:
    "Publica tu perfil gratis en RadarCitas y recibe clientes cercanos directamente por WhatsApp. Sin comisiones, sin intermediarios. Tú controlas tu visibilidad.",
  keywords: [
    "anunciar servicios",
    "anuncio gratis",
    "publicar perfil",
    "contactos cercanos",
    "radar geolocalizado",
    "anuncios por ciudad",
    "WhatsApp directo",
    "sin intermediarios",
  ],
  openGraph: {
    title: "Anúnciate Gratis en RadarCitas",
    description:
      "Publica tu perfil y recibe clientes cercanos por WhatsApp. Gratis, sin comisiones y con control total.",
    type: "website",
  },
};

export default function AnunciateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
