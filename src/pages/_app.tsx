import "@/styles/globals.css";
import type { AppProps } from "next/app";

// Wrap all pages with global styling
export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
