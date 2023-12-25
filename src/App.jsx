import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Image,
  Input,
  SimpleGrid,
  Stack,
  Text,
  Tag,
} from '@chakra-ui/react';
import { Alchemy, Network, Utils } from 'alchemy-sdk';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';

const provider = new ethers.providers.Web3Provider(window.ethereum);

const config = {
  apiKey: 'r_dJr7k5xMuk8bMvg9UWtjYT6LQXrU3M',
  network: Network.ETH_MAINNET,
};

const alchemy = new Alchemy(config);

function App() {
  const [userAddress, setUserAddress] = useState('');
  const [results, setResults] = useState([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [tokenDataObjects, setTokenDataObjects] = useState([]);
  const [account, setAccount] = useState();

  async function connectWallet() {
    if(!window.ethereum){
      alert("MetaMask is not installed!")
    } 

    const accounts = await provider.send('eth_requestAccounts', []);
    setAccount(accounts[0]);
    document.getElementById("inputAddress").value = accounts[0];
    setUserAddress(accounts[0]);
  }
  /*
  useEffect(() => {
    async function getAccounts() {
      const accounts = await provider.send('eth_requestAccounts', []);

      setAccount(accounts[0]);
      setSigner(provider.getSigner());
    }

    getAccounts();
  }, [account]);
  */

  useEffect(() => {
    window.ethereum.on('accountsChanged', async function (accounts) {
      // accounts[0] is the new selected account in MetaMask
      setAccount(accounts[0]);
      document.getElementById("inputAddress").value = accounts[0];
      setUserAddress(accounts[0]);
    });
  }, []);

  async function checkInput() {
    let addr = document.getElementById('inputAddress').value;
    const isENS = await alchemy.core.resolveName(addr);
    console.log(isENS);
    if (isENS != null) {
      addr = isENS;
    }
    try {
      console.log(addr);
      ethers.utils.getAddress(addr); // This will throw an error if the address is invalid
      setUserAddress(addr);
      await getTokenBalance(addr);
    } catch (error) {
      alert("Please type a valid address!");
    }
  }

  async function getTokenBalance(address) {

    console.log(userAddress);

    const data = await alchemy.core.getTokenBalances(address);

    setResults(data);

    const tokenDataPromises = [];

    for (let i = 0; i < data.tokenBalances.length; i++) {
      const tokenData = alchemy.core.getTokenMetadata(
        data.tokenBalances[i].contractAddress
      );
      tokenDataPromises.push(tokenData);
    }

    setTokenDataObjects(await Promise.all(tokenDataPromises));
    setHasQueried(true);
  }
  return (
    <Box w="100vw">
      <Stack align="end" m={5}>
        {!account ? (
        <Button variant="outline" onClick={connectWallet} size="sm" colorScheme="teal">
          Connect Wallet
        </Button>) : (
        <Tag size="sm" colorScheme="teal">
          Connected
        </Tag>
        )}
      </Stack>
      <Center m={10}>
        <Flex
          alignItems={'center'}
          justifyContent="center"
          flexDirection={'column'}
        >
          <Heading mb={0} fontSize={36}>
            ERC-20 Token Indexer
          </Heading>
          <Text>
            Plug in an address and this website will return all of its ERC-20
            token balances!
          </Text>
        </Flex>
      </Center>
      <Flex
        w="100%"
        flexDirection="column"
        alignItems="center"
        justifyContent={'center'}
      >
        <Heading mt={42}>
          Get all the ERC-20 token balances of this address:
        </Heading>
        <Input
          id="inputAddress"
          onChange={(e) => setUserAddress(e.target.value)}
          color="black"
          w="600px"
          textAlign="center"
          p={4}
          bgColor="white"
          fontSize={24}
        />
        <Button fontSize={20} onClick={checkInput} mt={36} bgColor="blue">
          Check ERC-20 Token Balances
        </Button>

        <Heading my={36}>ERC-20 token balances:</Heading>

        {hasQueried ? (
          <div>
          {
            !tokenDataObjects ? (
            <Alert status='info'>
                  <AlertIcon />
                  <AlertDescription>
                    Tokens are loading...
                  </AlertDescription>
                </Alert>
          ) : (
          <SimpleGrid w={'90vw'} columns={4} spacing={24}>
            {results.tokenBalances.map((e, i) => {
              return (
                <Flex
                  flexDir={'column'}
                  color="white"
                  bg="blue"
                  w={'20vw'}
                  key={e.id}
                >
                  <Box>
                    <b>Symbol:</b> ${tokenDataObjects[i].symbol}&nbsp;
                  </Box>
                  <Box>
                    <b>Balance:</b>&nbsp;
                    {Utils.formatUnits(
                      e.tokenBalance,
                      tokenDataObjects[i].decimals
                    )}
                  </Box>
                  <Image src={tokenDataObjects[i].logo} />
                </Flex>
              );
            })}
          </SimpleGrid>
          )
          }
</div>
        ) : (
          'Please make a query! This may take a few seconds...'
        )}
      </Flex>
    </Box>
  );
}

export default App;
