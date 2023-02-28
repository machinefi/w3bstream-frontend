import React, { useEffect, useMemo } from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { Toaster } from 'react-hot-toast';
import { withTRPC } from '@trpc/next';
import { observer } from 'mobx-react-lite';
import { httpBatchLink } from '@trpc/client/links/httpBatchLink';
import { loggerLink } from '@trpc/client/links/loggerLink';
import { useStore } from '@/store/index';
import { theme } from '@/lib/theme';
import NextRouter, { useRouter } from 'next/router';
import type { AppRouter } from '@/server/routers/_app';
import type { AppProps } from 'next/app';
import { NotificationsProvider } from '@mantine/notifications';
import { eventBus } from '@/lib/event';
import superjson from 'superjson';

import '@/lib/superjson';
function MyApp({ Component, pageProps }: AppProps) {
  const { lang, w3s } = useStore();
  const { token } = w3s.config.form.formData;
  const router = useRouter();

  useEffect(() => {
    lang.init();
    eventBus.emit('app.ready');
  }, []);

  useEffect(() => {
    if (!token && !['/openapi'].includes(router.pathname)) {
      NextRouter.push('/login');
    }
  }, [token]);

  return useMemo(() => {
    return (
      <ChakraProvider theme={theme}>
        <NotificationsProvider>
          <Toaster />
          <Component {...pageProps} />
        </NotificationsProvider>
      </ChakraProvider>
    );
  }, [Component, pageProps]);
}

function getBaseUrl() {
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
