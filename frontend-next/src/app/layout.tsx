import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'BDO PvP Helper',
  description: 'The ultimate tool for tracking your Black Desert Online PvP performance.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
          <Navbar />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
