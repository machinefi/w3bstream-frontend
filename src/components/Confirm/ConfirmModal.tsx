import { useStore } from '@/store/index';
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Button, ButtonGroup } from '@chakra-ui/react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import React from 'react';
import { ConfirmProps } from './index';

interface OpenState {
  isOpen: boolean;
  toggleOpen: (isOpen: boolean) => void;
}

interface ConfirmModalProps extends ConfirmProps{
  openState?: OpenState
}


const Trigger = ({ trigger, openState }: { trigger?: React.ReactElement; openState: OpenState }) => {
  const triggerClone = trigger
    ? React.cloneElement(trigger, {
        onClick: (e: MouseEvent) => {
          openState.toggleOpen(true);
          e.stopPropagation();
          e.preventDefault();
        }
      })
    : null;
  return triggerClone;
};

export const ConfirmModal = observer((props: ConfirmModalProps ) => {
  const { title, description, trigger, onOk, onCancel, okText, cancelText } = props;
  const openState = props.openState ||
    useLocalObservable<OpenState>(() => ({
      isOpen: false,
      toggleOpen(val: boolean) {
        this.isOpen = val;
      }
    }));

  const handleApply = async (e) => {
    try {
      const cancelClose = [trigger?.props?.onClick(e), onOk?.()].some(item => item === false)
      if (!cancelClose) {
        openState.toggleOpen(false);
      }
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <>
      <Trigger trigger={trigger} openState={openState} />
      <Modal closeOnOverlayClick={false} isOpen={openState.isOpen} onClose={() => openState.toggleOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>{description}</ModalBody>

          <ModalFooter>
            <ButtonGroup size="sm">
              <Button
                variant="outline"
                onClick={() => {
                  openState.toggleOpen(false);
                  onCancel?.();
                }}
              >
                {cancelText || 'Cancel'}
              </Button>
              <Button colorScheme="red" onClick={handleApply}>
                {okText || 'Apply'}
              </Button>
            </ButtonGroup>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
});

