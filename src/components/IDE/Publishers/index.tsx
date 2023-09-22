import { observer } from 'mobx-react-lite';
import { useStore } from '@/store/index';
import { Button, Flex, Box, Text } from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { defaultButtonStyle } from '@/lib/theme';
import JSONTable from '@/components/JSONTable';
import { useEffect } from 'react';
import { hooks } from '@/lib/hooks';
import { axios } from '@/lib/axios';
import { eventBus } from '@/lib/event';
import toast from 'react-hot-toast';

const Publishers = observer(() => {
  const { w3s } = useStore();

  useEffect(() => {
    if (w3s.showContent === 'CURRENT_PUBLISHERS') {
      w3s.publisher.table.set({
        dataSource: w3s.publisher.curPublishers
      });
    }
  }, [w3s.publisher.curPublishers, w3s.showContent]);

  return (
    <Box minH="calc(100vh - 158px)">
      <Flex alignItems="center" mb="24px">
        <Box flex="1">
          <Text fontSize={'1.25rem'} fontWeight={600}>Authorized Publisher</Text>
          <Text color={'#7A7A7A'} fontSize="14px">In this section, you can create and manage unique authentication tokens for your authorized publishers. These tokens act as digital keys, ensuring that only trusted publishers can send messages to your project and have them accepted.</Text>
        </Box>
        <Button
          h="36px"
          size={"sm"}
          leftIcon={<AddIcon />}
          {...defaultButtonStyle}
          onClick={async (e) => {
            if (w3s.showContent === 'CURRENT_PUBLISHERS') {
              w3s.publisher.createPublisherForm.value.set({
                projectName: w3s.project.curProject?.name
              });
              w3s.publisher.createPublisherForm.uiSchema.projectName = {
                // 'ui:disabled': true,
                'ui:widget': 'hidden'
              };
            }
            const formData = await hooks.getFormData({
              title: 'Add Publisher',
              size: 'lg',
              formList: [
                {
                  form: w3s.publisher.createPublisherForm
                }
              ]
            });
            const { projectName, key } = formData;
            if (projectName && key) {
              try {
                await axios.request({
                  method: 'post',
                  url: `/api/w3bapp/publisher/x/${projectName}`,
                  data: {
                    key,
                    name: key
                  }
                });
                toast.success('Publisher successfully added');
                eventBus.emit('publisher.create');
              } catch (error) {}
            }
          }}
        >
          <Text>Add Publisher</Text>
        </Button>
      </Flex>
      <JSONTable jsonstate={w3s.publisher} />
    </Box>
  );
});

export default Publishers;
