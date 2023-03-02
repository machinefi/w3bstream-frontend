import { observer } from 'mobx-react-lite';
import { useStore } from '@/store/index';
import { Button, Flex } from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { gradientButtonStyle } from '@/lib/theme';
import JSONTable from '@/components/JSONTable';
import { useEffect } from 'react';
import { hooks } from '@/lib/hooks';
import { axios } from '@/lib/axios';
import { showNotification } from '@mantine/notifications';
import { eventBus } from '@/lib/event';

const Publishers = observer(() => {
  const { w3s } = useStore();

  useEffect(() => {
    if (w3s.showContent === 'CURRENT_PUBLISHERS') {
      const publishers = w3s.curProject?.publishers || [];
      w3s.publisher.table.set({
        dataSource: publishers
      });
    } else {
      w3s.publisher.table.set({
        dataSource: w3s.publisher.allData
      });
    }
  }, [w3s.curProject, w3s.showContent]);

  return (
    <>
      <Flex alignItems="center">
        <Button
          h="32px"
          leftIcon={<AddIcon />}
          {...gradientButtonStyle}
          onClick={async (e) => {
            if (w3s.showContent === 'CURRENT_PUBLISHERS') {
              w3s.publisher.createPublisherForm.value.set({
                projectName: w3s.curProject?.f_name
              });
            }
            const formData = await hooks.getFormData({
              title: 'Create Publisher',
              size: 'md',
              formList: [
                {
                  form: w3s.publisher.createPublisherForm
                }
              ]
            });
            const { projectName, name, key } = formData;
            if (projectName && name && key) {
              try {
                await axios.request({
                  method: 'post',
                  url: `/api/w3bapp/publisher/${projectName}`,
                  data: {
                    name,
                    key
                  }
                });
                await showNotification({ message: 'create publisher succeeded' });
                eventBus.emit('publisher.create');
              } catch (error) {}
            }
          }}
        >
          Add Publisher
        </Button>
      </Flex>
      <JSONTable jsonstate={w3s.publisher} />
    </>
  );
});

export default Publishers;
