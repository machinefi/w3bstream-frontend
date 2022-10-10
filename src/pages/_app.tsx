import React, { useEffect, useMemo } from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { Web3ReactProvider } from '@web3-react/core';
import { Toaster } from 'react-hot-toast';
import { withTRPC } from '@trpc/next';
import { observer } from 'mobx-react-lite';
import { httpBatchLink } from '@trpc/client/links/httpBatchLink';
import { loggerLink } from '@trpc/client/links/loggerLink';
import superjson from 'superjson';
import { useStore } from '@/store/index';
import { theme } from '@/lib/theme';
import { getLibrary } from '@/lib/web3-react';
import { GlobalProvider } from '@/components/Global';
import Header from '@/components/Header';
import NextRouter from 'next/router';
import type { AppRouter } from '@/server/routers/_app';
import type { AppProps } from 'next/app';

function MyApp({ Component, pageProps }: AppProps) {
  const { lang, w3s } = useStore();
  useEffect(() => {
    lang.init();

    if (!w3s.isLogin) {
      NextRouter.push('/login');
    }
  }, []);

  return useMemo(() => {
    return (
      <ChakraProvider theme={theme}>
        <GlobalProvider>
          <Web3ReactProvider getLibrary={getLibrary}>
            <Toaster />
            <Header />
            <Component {...pageProps} />
          </Web3ReactProvider>
        </GlobalProvider>
      </ChakraProvider>
    );
  }, [Component, pageProps]);
}

function getBaseUrl() {
  if (process.browser) {
    return '';
  }
  // reference for vercel.com
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // // reference for render.com
  if (process.env.RENDER_INTERNAL_HOSTNAME) {
    return `http://${process.env.RENDER_INTERNAL_HOSTNAME}:${process.env.PORT}`;
  }

  // assume localhost
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export default withTRPC<AppRouter>({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  config() {
    /**
     * If you want to use SSR, you need to use the server's full URL
     * @link https://trpc.io/docs/ssr
     */
    return {
      /**
       * @link https://trpc.io/docs/links
       */
      links: [
        // adds pretty logs to your console in development and logs errors in production
        loggerLink({
          enabled: (opts) => process.env.NODE_ENV === 'development' || (opts.direction === 'down' && opts.result instanceof Error)
        }),
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`
        })
      ],
      /**
       * @link https://trpc.io/docs/data-transformers
       */
      transformer: superjson
      /**
       * @link https://react-query.tanstack.com/reference/QueryClient
       */
      // queryClientConfig: { defaultOptions: { queries: { staleTime: 60 } } },
    };
  },
  /**
   * @link https://trpc.io/docs/ssr
   */
  ssr: true,
  /**
   * Set headers or status code when doing SSR
   */
  responseMeta({ clientErrors }) {
    if (clientErrors.length) {
      // propagate http first error from API calls
      return {
        //@ts-ignore
        status: clientErrors[0].data?.httpStatus ?? 500
      };
    }

    // for app caching with SSR see https://trpc.io/docs/caching

    return {};
  }
})(observer(MyApp));
