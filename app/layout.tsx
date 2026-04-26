import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quarteto MVP",
  description: "Cadastro de musicas e repertorios para ensaio e apresentacoes.",
};

const themeInitScript = `
(() => {
  const storageKey = "quarteto.theme";
  const storedTheme = window.localStorage.getItem(storageKey);
  const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const theme = storedTheme === "dark" || storedTheme === "light" ? storedTheme : preferredTheme;
  document.documentElement.dataset.theme = theme;
})();
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {children}
      </body>
    </html>
  );
}
