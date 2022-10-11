import { useEffect } from 'react';
import { Button, Flex, TableContainer, Table, Thead, Tr, Th, Tbody, Td, useDisclosure, Collapse, Badge } from '@chakra-ui/react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { useStore } from '@/store/index';
import { AddIcon, ChevronDownIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { W3bStream } from '@/store/lib/w3bstream';
import copy from 'copy-to-clipboard';
import toast from 'react-hot-toast';
import { AppletModal } from '../AppletModal';
import SimplePagination from '@/components/Common/SimplePagination';

const AppletTable = observer(() => {
  const { ide, w3s } = useStore();
  const paginationState = useLocalObservable(() => ({
    page: 1,
    limit: 10,
    total: 0,
    get offset() {
      return (this.page - 1) * this.limit;
    },
    onPageChange(page: number) {
      this.page = page;
    },
    onSizeChange(limit: number) {
      this.limit = limit;
    },
    setTotal(total: number) {
      this.total = total;
    }
  }));

  const applets = w3s.curProject?.applets || [];

  useEffect(() => {
    paginationState.setTotal(applets.length);
  }, [applets]);

  const dataSource = applets.slice(paginationState.offset, paginationState.offset + paginationState.limit);

  return (
    <>
      <TableContainer>
        <Flex fontSize="xl" fontWeight={600}>
          Applets
        </Flex>
        <Flex mt={2}>
          <Button
            leftIcon={<AddIcon />}
            colorScheme="blue"
            size="xs"
            borderRadius="base"
            onClick={(e) => {
              ide.appletModal = {
                show: true,
                type: 'add'
              };
            }}
          >
            Add Applet
          </Button>
        </Flex>
        <Table mt={2} variant="simple">
          <Thead>
            <Tr bg="#FAFAFA">
              <Th></Th>
              <Th>ID</Th>
              <Th>Name</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {dataSource.map((applet) => {
              return <CollapseTable key={applet.f_applet_id} applet={applet} w3s={w3s} />;
            })}
          </Tbody>
        </Table>
        <SimplePagination total={paginationState.total} limit={paginationState.limit} page={paginationState.page} onPageChange={paginationState.onPageChange} />
      </TableContainer>
      <AppletModal />
    </>
  );
});

const STATUS = {
  0: {
    colorScheme: 'gray',
    text: ''
  },
  1: {
    colorScheme: 'gray',
    text: 'idle'
  },
  2: {
    colorScheme: 'green',
    text: 'running'
  },
  3: {
    colorScheme: 'red',
    text: 'stop'
  }
};

function CollapseTable({ applet, w3s }: { applet: Partial<{ f_name: string; f_project_id: string; f_applet_id: string; instances: any[] }>; w3s: W3bStream }) {
  const { isOpen, onToggle } = useDisclosure();

  return (
    <>
      <Tr>
        <Td w="40px">{isOpen ? <ChevronDownIcon w={6} h={6} onClick={onToggle} cursor="pointer" /> : <ChevronRightIcon w={6} h={6} onClick={onToggle} cursor="pointer" />}</Td>
        <Td w="300px">{applet.f_applet_id}</Td>
        <Td w="140px">{applet.f_name}</Td>
        <Td>
          {applet.instances.length > 0 ? (
            <>
              <Button colorScheme="blue" size="xs" borderRadius="base" onClick={(e) => w3s.publishEvent.call({ appletID: applet.f_applet_id, projectID: applet.f_project_id })}>
                Send Event
              </Button>
              <Button
                ml={4}
                colorScheme="blue"
                size="xs"
                borderRadius="base"
                onClick={() => {
                  copy(
                    `curl --location --request POST 'localhost:8888/srv-applet-mgr/v0/event/${applet.f_project_id}/${applet.f_applet_id}/start' --header 'publisher: "admin"' --header 'Content-Type: text/plain' --data-raw 'input event'`
                  );
                  toast.success('Copied');
                }}
              >
                Copy
              </Button>
            </>
          ) : (
            <Button
              colorScheme="blue"
              size="xs"
              borderRadius="base"
              onClick={(e) => {
                if (applet.instances.length === 0) {
                  w3s.deployApplet.call({ appletID: applet.f_applet_id });
                }
              }}
            >
              Deploy
            </Button>
          )}
        </Td>
      </Tr>
      <Tr>
        <Td></Td>
        <Td colSpan={3}>
          <Collapse in={isOpen} animateOpacity>
            <TableContainer>
              <Table size="sm">
                <Thead bg="#EAF5FE">
                  <Tr>
                    <Th>ID</Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {applet.instances.map((item) => (
                    <Tr bg="#F2FAFB" key={item.f_instance_id}>
                      <Td w="340px">{item.f_instance_id}</Td>
                      <Td w="120px">
                        <Badge colorScheme={STATUS[item.f_state].colorScheme}>{STATUS[item.f_state].text}</Badge>
                      </Td>
                      <Td>
                        <Button colorScheme="green" size="xs" borderRadius="base" onClick={(e) => w3s.handleInstance.call({ instaceID: item.f_instance_id, event: 'START' })}>
                          Start
                        </Button>
                        <Button ml={4} colorScheme="yellow" size="xs" borderRadius="base" onClick={(e) => w3s.handleInstance.call({ instaceID: item.f_instance_id, event: 'Restart' })}>
                          Restart
                        </Button>
                        <Button ml={4} colorScheme="red" size="xs" borderRadius="base" onClick={(e) => w3s.handleInstance.call({ instaceID: item.f_instance_id, event: 'STOP' })}>
                          Stop
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </Collapse>
        </Td>
      </Tr>
    </>
  );
}

export default AppletTable;
