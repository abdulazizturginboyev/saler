import './globals.css';

export const metadata = {
  title: 'Saler',
  description: "Qurilish mollari magazini uchun savdo va hisobot ilovasi",
  manifest: '/manifest.json',
  themeColor: '#0f0f0f',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="uz">
      <body>{children}</body>
    </html>
  );
}
