import './globals.css';

export const metadata = {
  title: 'Scannit GPU | Bare-Metal Enterprise AI Compute',
  description: 'High-density NVIDIA clusters engineered for enterprise AI workloads.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap"
        />
      </head>
      <body className="dark-section" suppressHydrationWarning>
        <main>{children}</main>
      </body>
    </html>
  );
}