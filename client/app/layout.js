import './globals.css';
export const metadata = {
  title: 'Paper Trade',
  description: 'Best Algo Paper Trading Platform',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
