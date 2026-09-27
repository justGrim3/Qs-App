import './globals.css';
import TipBubble from './TipBubble';

export const metadata = {
  title: 'Dimension Sheet — Takeoff',
  description: 'Digital takeoff, the standard way'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <TipBubble />
      </body>
    </html>
  );
}
