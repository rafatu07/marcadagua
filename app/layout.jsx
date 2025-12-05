import "./globals.css";

export const metadata = {
  title: "Marca d'água Animada em Vídeo - DVD Bouncing",
  description: "Aplicação para adicionar logotipo animado (estilo DVD bouncing) em vídeos",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

