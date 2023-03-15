import React from 'react';
import { observer } from 'mobx-react-lite';
import { Box, Button, Flex, Image, Text } from '@chakra-ui/react';
import { Center } from '@chakra-ui/layout';
import { JSONForm } from '@/components/JSONForm';
import { useStore } from '../store';
import { Divider } from '@mantine/core';
import { ethers } from 'ethers';
import { SiweMessage } from 'siwe';

const enum Providers {
  METAMASK = 'metamask'
}

const signIn = async (connector: Providers) => {
  let provider: ethers.providers.Web3Provider;
  if (connector === 'metamask') {
    // @ts-ignore
    if (window.ethereum == null) {
      console.log('MetaMask not installed; using read-only defaults');
    } else {
      // @ts-ignore
      const metamask = window.ethereum;
      await metamask.request({
        method: 'eth_requestAccounts'
      });
      provider = new ethers.providers.Web3Provider(metamask);
    }
  }

  const [address] = await provider.listAccounts();
  if (!address) {
    throw new Error('Address not found.');
  }

  console.log('address', address);

  // const nonce = await fetch('/api/nonce', { credentials: 'include' }).then((res) => res.text());
  // const chainId = await provider.getNetwork().then(({ chainId }) => chainId);
  // const message = new SiweMessage({
  //   address,
  //   chainId,
  //   domain: document.location.host,
  //   uri: document.location.origin,
  //   statement: 'Sign in with Ethereum to the app.',
  //   version: '1',
  //   nonce
  // });
  // const signature = await provider.getSigner().signMessage(message.prepareMessage());
  // const tokenRes = await await fetch(`/api/auth/jwt`, {
  //   method: 'POST',
  //   body: JSON.stringify({
  //     message,
  //     signature
  //   })
  // });
};

const Login = observer(() => {
  const { w3s } = useStore();

  return (
    <Box w="100vw" h="100vh" minW="1440px" bg="linear-gradient(to right, #EBF2FC, #E3DEFC)">
      <Image w="200px" pos="fixed" top="70px" left="100px" src="/images/logo.svg" alt="logo" />
      <Image pos="fixed" top="0px" left="52%" src="/images/polygon_1.svg" alt="" />
      <Image pos="fixed" bottom="0px" right="0px" src="/images/polygon_3.svg" alt="" />
      <Center h="100%" p="20px">
        <Flex>
          <Box>
            <Text fontSize="30px" fontWeight={700} color="#0D0D0D">
              Welcome to W3bstream Studio
            </Text>
            <Image mt="120px" w="350px" src="/images/polygon_2.svg" alt="" />
          </Box>
          <Box zIndex={9} ml="120px" w="580px" py="40px" px="40px" bg="#fff">
            <Box>
              <Text fontSize="lg" fontWeight={500}>
                Welcome to W3bstream Studio, login with
              </Text>
              <Flex my="20px" justify="center">
                <Button
                  leftIcon={<Image boxSize="20px" objectFit="cover" src="/images/icons/metamask.svg" alt="MetaMask" />}
                  colorScheme="blue"
                  variant="outline"
                  onClick={() => signIn(Providers.METAMASK)}
                >
                  MetaMask
                </Button>
              </Flex>
            </Box>
            <Divider mb="10px" label="Or continue with Username" labelPosition="center" />
            <JSONForm formState={w3s.user.loginForm} />
          </Box>
        </Flex>
      </Center>
    </Box>
  );
});

export default Login;
