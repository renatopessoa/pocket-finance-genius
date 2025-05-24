import type { AppProps } from 'next/app';
import { ThemeProvider } from 'next-themes';
import '@/styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
    // Add API key to pageProps to make it available client-side
    const enhancedPageProps = {
        ...pageProps,
        openaiApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    };

    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <Component {...enhancedPageProps} />
        </ThemeProvider>
    );
}

export default MyApp;
