export const metadata = {
  title: "Lamunn Line Translate Bot",
  description: "LINE bot that auto-translates Thai / Burmese / English in group chats",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>{children}</body>
    </html>
  );
}
