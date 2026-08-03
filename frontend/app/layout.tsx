export const metadata = {
  title: 'Amigal - Chat with Strangers',
  description: 'Anonymous text and video chat with interest matching',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-white">{children}</body>
    </html>
  );
}
