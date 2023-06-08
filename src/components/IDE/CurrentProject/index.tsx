import React from 'react';
import { Flex, Box, Spinner } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/store/index';
import dynamic from 'next/dynamic';
import ToolBar from '../ToolBar';

const DynamicMetrics = dynamic(() => import('../Metrics'), {
  ssr: false
});

const DynamicPublishers = dynamic(() => import('../Publishers'), {
  ssr: false
});

const DynamicTriggers = dynamic(() => import('../Triggers'), {
  ssr: false
});

const DynamicDBTable = dynamic(() => import('../DBTable'), {
  ssr: false
});

const DynamicEventLogs = dynamic(() => import('../EventLogs'), {
  ssr: false
});

const DynamicSettings = dynamic(() => import('../Settings'), {
  ssr: false
});

const CurrentProject = observer(() => {
  const {
    w3s,
    w3s: { showContent },
    lang: { t }
  } = useStore();
  const { projectDetail } = w3s.project;

  return (
    <>
      {/* {projectDetail.loading.value ? (
        <Flex h="calc(100vh - 158px)" alignItems={'center'} justifyContent={'center'}>
          <Spinner color="#946FFF" />
        </Flex>
      ) : ( */}
      <Flex w="100%" minH="100%" position="relative">
        <ToolBar borderRadius="8px" overflowY="auto" />
        <Box ml="220px" w="calc(100% - 220px)" minH="100%" p="12px 24px" bg="#fff" borderRadius="8px" paddingBottom={200}>
          {!projectDetail.value ? (
            <Flex h="calc(100vh - 158px)" alignItems={'center'} justifyContent={'center'}>
              <Spinner color="#946FFF" />
            </Flex>
          ) : (
            <>
              {showContent === 'METRICS' && <DynamicMetrics />}
              {showContent === 'CURRENT_PUBLISHERS' && <DynamicPublishers />}
              {(showContent === 'CONTRACT_LOGS' || showContent === 'CHAIN_TX' || showContent === 'CHAIN_HEIGHT') && <DynamicTriggers />}
              {showContent === 'DB_TABLE' && <DynamicDBTable />}
              {showContent === 'CURRENT_EVENT_LOGS' && <DynamicEventLogs />}
              {showContent === 'SETTINGS' && <DynamicSettings />}
            </>
          )}
        </Box>
      </Flex>
    </>
  );
});

export default CurrentProject;
