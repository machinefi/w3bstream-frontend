import { helper } from '@/lib/helper';
import { defaultOutlineButtonStyle } from '@/lib/theme';
import { useStore } from '@/store/index';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { Avatar, Box, Button, ButtonProps, Flex, Popover, PopoverArrow, PopoverBody, Text, PopoverContent, PopoverHeader, PopoverTrigger } from '@chakra-ui/react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { observer } from 'mobx-react-lite';
import { Copy } from '../Common/Copy';
import { useDisconnect } from 'wagmi';

interface WalletConnectButtonProps {
  name?: string;
  customStyle?: ButtonProps;
}

export const WalletConnectButton = observer(({ name, customStyle }: WalletConnectButtonProps) => {
  const { god, w3s: { config } } = useStore();
  const { disconnectAsync } = useDisconnect({
    onError(error) {
      console.log('Disconnect Error', error);
    },
    onSettled(data, error) {
      console.log('Disconnect Settled', { data, error });
    },
    onSuccess(data) {
      console.log('Disconnect Success', data);
    }
  });
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, authenticationStatus, mounted }) => {
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready = mounted && authenticationStatus !== 'loading';
        const connected = ready && account && chain && (!authenticationStatus || authenticationStatus === 'authenticated');

        if (!ready) {
          return null;
        }

        if (!connected) {
          return (
            <Button
              {...defaultOutlineButtonStyle}
              {...customStyle}
              onClick={openConnectModal}
            >
              {name ? name : 'Connect a Wallet'}
            </Button>
          );
        }

        if (chain.unsupported) {
          return (
            <Box p="10px 20px" color="#e53b3b" fontWeight={700} flexWrap="nowrap" borderRadius="6px" background="#ffe2e2" >
              Wrong network
            </Box>
          );
        }

        return (
          <Popover>
            <PopoverTrigger>
              <Flex alignItems="center" p="5px 14px" bg="#F3F3F3" borderRadius="60px" cursor="pointer">
                <Avatar mr="8px" w="30px" h="30px" src={god.currentNetwork.chain.current.logoUrl}  />
                <Flex
                  alignItems="center"
                >
                  <Box>
                    <Text fontSize="12px" fontWeight={700}>
                      {god.currentChain.Coin.balance.format} {god.currentNetwork.currentChain.Coin.symbol}
                    </Text>
                    <Text fontSize="12px">{helper.string.truncate(god.currentNetwork.account || '0x......', 20, '...')}</Text>
                  </Box>
                  <ChevronDownIcon ml="5px" boxSize="24px" />
                </Flex>
              </Flex>
            </PopoverTrigger>
            <PopoverContent w="285px">
              <PopoverArrow />
              {/* <PopoverCloseButton /> */}
              <PopoverHeader>Account Information</PopoverHeader>
              <PopoverBody>
                <Flex align="center">
                  <Text fontSize={"14px"} fontWeight={700}>Account ID:</Text>
                  <Text fontSize={"12px"} ml="5px">{config.form.formData.accountID}</Text>
                </Flex>
                <Flex mt="10px" align="center">
                  <Text fontSize={"14px"} fontWeight={700}>Address:</Text>
                  <Text fontSize={"12px"} ml="5px">{helper.string.truncate(god.currentNetwork.account || '0x......', 20, '...')}</Text>
                  <Copy value={god.currentNetwork.account} />
                </Flex>
                <Flex mt="10px" align="center">
                  <Button
                    w="100%"
                    size="sm"
                    {...defaultOutlineButtonStyle}
                    onClick={async () => {
                      disconnectAsync();
                    }}
                  >
                    Sign out
                  </Button>
                </Flex>
              </PopoverBody>
            </PopoverContent>
          </Popover>
        )
      }}
    </ConnectButton.Custom>
  );
});
