import React, { useEffect, useMemo } from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import toast, { Toaster } from 'react-hot-toast';
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
import { Inspector, InspectParams } from 'react-dev-inspector';
import { WagmiProvider } from '@/components/WagmiProvider';
import '@/lib/superjson';
import { Button, Text } from '@mantine/core';
import { ContextModalProps, modals, ModalsProvider } from '@mantine/modals';
import { ProjectType } from '@/server/routers/w3bstream';
import { SqlDB } from '@/server/wasmvm/sqldb';
import initSqlJs from 'sql.js';

const InspectorWrapper = process.env.NODE_ENV === 'development' ? Inspector : React.Fragment;
export let asc: typeof import('assemblyscript/dist/asc');

function MyApp({ Component, pageProps }: AppProps) {
  const { lang, w3s, god } = useStore();
  const { token } = w3s.config.form.formData;
  const router = useRouter();

  useEffect(() => {
    lang.init();
    eventBus.emit('app.ready');
    const asyncImportASC = async () => {
      asc = await import('assemblyscript/dist/asc');
    };
    asyncImportASC();
    god.initSQLDB();
  }, []);

  useEffect(() => {
    if (!token && !['/openapi', '/admin-login'].includes(router.pathname)) {
      NextRouter.push('/login');
    }

    if (token) {
      w3s.init();
    }
  }, [token]);

  const GoToProjectModal = ({ context, id, innerProps }: ContextModalProps<{ modalBody: string; instance: ProjectType }>) => (
    <>
      <Text size="sm">{innerProps.modalBody}</Text>
      <Button
        fullWidth
        mt="md"
        onClick={(e) => {
          try {
            console.log('xxx');
            // modals.closeAll();
            // w3s.headerTabs === 'PROJECTS'
            // w3s.project.resetSelectedNames();
            // w3s.project.allProjects.onSelect(0)
            // w3s.showContent = 'METRICS';
            // w3s.metrics.allMetrics.call();
          } catch (error) {
            toast.error(error.message);
          }
        }}
      >
        View
      </Button>
    </>
  );

  return useMemo(() => {
    return (
      <InspectorWrapper
        // props see docs:
        // https://github.com/zthxxx/react-dev-inspector#inspector-component-props
        keys={['control', 'shift', 'z']}
        disableLaunchEditor={true}
        onClickElement={({ codeInfo }: InspectParams) => {
          if (!codeInfo?.absolutePath) return;
          const { absolutePath, lineNumber, columnNumber } = codeInfo;
          // you can change the url protocol if you are using in Web IDE
          window.open(`vscode://file/${absolutePath}:${lineNumber}:${columnNumber}`);
        }}
      >
        <ChakraProvider theme={theme}>
          <NotificationsProvider>
            <Toaster position="bottom-right" />
            <WagmiProvider>
              <ModalsProvider modals={{ projectstration: GoToProjectModal }}>
                <Component {...pageProps} />
              </ModalsProvider>
            </WagmiProvider>
          </NotificationsProvider>
        </ChakraProvider>
      </InspectorWrapper>
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
