import './globals.css';

export const metadata = {
  title: 'Dimension Sheet — Takeoff',
  description: 'Digital takeoff, the standard way'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
