import { observer, useLocalObservable } from 'mobx-react-lite';
import { useStore } from '@/store/index';
import { Box, Button, ButtonProps, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerHeader, DrawerOverlay, Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';
import MonacoEditor from '@monaco-editor/react';
import copy from 'copy-to-clipboard';
import toast from 'react-hot-toast';
import { defaultButtonStyle, defaultOutlineButtonStyle } from '@/lib/theme';
import { CopyIcon } from '@chakra-ui/icons';
import { getHTTPRequestTemplate, getMQTTRequestTemplate } from '@/constants/publish-event-code-templates';

export const ShowRequestTemplatesButton = observer(({ props = {} }: { props?: ButtonProps }) => {
  const {
    w3s: {
      publisher,
      config: {
        form: {
          formData: { accountRole }
        }
      }
    }
  } = useStore();
  return (
    <Button
      {...defaultOutlineButtonStyle}
      {...props}
      onClick={() => {
        if (accountRole === 'ADMIN') {
          const { projectName } = publisher.publishEventForm.formData;
          if (!projectName) {
            toast.error('Please select the project first');
            return;
          }
        }
        publisher.showPublishEventRequestTemplates = true;
      }}
    >
      API Code Sample
    </Button>
  );
});

export const ShowRequestTemplatesButtonWidget = () => {
  return <ShowRequestTemplatesButton props={{ mt: '10px', w: '100%', h: '32px' }} />;
};

const PublishEventRequestTemplates = observer(() => {
  const {
    w3s: {
      publisher,
      config: {
        form: {
          formData: { accountRole }
        }
      },
      project: { curProject },
      env: { envs }
    }
  } = useStore();

  const store = useLocalObservable(() => ({
    get params() {
      if (accountRole === 'ADMIN') {
        const pub = publisher.allData.find((item) => publisher.publishEventForm.formData.publisher === item.f_publisher_id.toString());
        const timestamp = Date.now();
        const eventType = 'ANY';
        const eventID = pub?.f_key || `${timestamp}`;
        return {
          eventID,
          eventType,
          timestamp
        };
      } else {
        const timestamp = Date.now();
        const eventType = 'ANY';
        const eventID = `${timestamp}`;
        return {
          eventID,
          eventType,
          timestamp
        };
      }
    }
  }));

  const languages = ['javascript', 'go', 'rust'];
  const projectName = (accountRole === 'ADMIN' ? publisher.publishEventForm.formData.projectName : curProject?.name) || ':projectName';

  return (
    <Drawer
      isOpen={publisher.showPublishEventRequestTemplates}
      placement="right"
      size="xl"
      onClose={() => {
        publisher.showPublishEventRequestTemplates = false;
      }}
    >
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>API Code Sample</DrawerHeader>
        <DrawerBody>
          <Tabs variant="unstyled">
            <TabList>
              <Tab _selected={{ color: '#855EFF', fontWeight: 700, borderBottom: '2px solid #855EFF' }}>HTTP</Tab>
              <Tab _selected={{ color: '#855EFF', fontWeight: 700, borderBottom: '2px solid #855EFF' }}>MQTT</Tab>
            </TabList>
            <TabPanels>
              <TabPanel p="10px 0px">
                <Tabs orientation="vertical" variant="unstyled">
                  <TabList>
                    {languages.map((item) => (
                      <Tab key={item} _selected={{ color: '#855EFF', fontWeight: 700, borderRight: '2px solid #855EFF' }}>
                        {item}
                      </Tab>
                    ))}
                  </TabList>
                  <TabPanels p="0px">
                    {languages.map((language) => {
                      const codeStr = getHTTPRequestTemplate({
                        language,
                        params: store.params,
                        url: envs.value?.httpURL,
                        body: publisher.publishEventForm.formData.body
                      });
                      return (
                        <TabPanel key={language}>
                          <Box pos="relative" width="100%" height="calc(100vh - 180px)">
                            <Button
                              zIndex={99}
                              pos="absolute"
                              bottom="20px"
                              right="20px"
                              {...defaultButtonStyle}
                              leftIcon={<CopyIcon />}
                              onClick={() => {
                                copy(codeStr);
                                toast.success('Copied');
                              }}
                            >
                              Copy
                            </Button>
                            <MonacoEditor width="100%" height="calc(100vh - 180px)" theme="vs-dark" language={language} value={codeStr} />
                          </Box>
                        </TabPanel>
                      );
                    })}
                  </TabPanels>
                </Tabs>
              </TabPanel>
              <TabPanel p="10px 0px">
                <Tabs orientation="vertical" variant="unstyled">
                  <TabList>
                    {languages.map((item) => (
                      <Tab key={item} _selected={{ color: '#855EFF', fontWeight: 700, borderRight: '2px solid #855EFF' }}>
                        {item}
                      </Tab>
                    ))}
                  </TabList>
                  <TabPanels p="0px">
                    {languages.map((language) => {
                      const codeStr = getMQTTRequestTemplate({
                        language,
                        projectName,
                        url: envs.value?.mqttURL,
                        message: publisher.publishEventForm.formData.body
                      });
                      return (
                        <TabPanel key={language}>
                          <Box pos="relative" width="100%" height="calc(100vh - 180px)">
                            <Button
                              zIndex={99}
                              pos="absolute"
                              bottom="20px"
                              right="20px"
                              {...defaultButtonStyle}
                              leftIcon={<CopyIcon />}
                              onClick={() => {
                                copy(codeStr);
                                toast.success('Copied');
                              }}
                            >
                              Copy
                            </Button>
                            <MonacoEditor width="100%" height="calc(100vh - 180px)" theme="vs-dark" language={language} value={codeStr} />
                          </Box>
                        </TabPanel>
                      );
                    })}
                  </TabPanels>
                </Tabs>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
});

export default PublishEventRequestTemplates;
