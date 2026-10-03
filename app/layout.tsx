import "./globals.css";
import "./access.css";

export const metadata = {
  title: "Murano Media Hub",
  description: "Biblioteca inteligente de mídias da Murano Joias",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
