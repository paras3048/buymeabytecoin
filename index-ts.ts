import {
  createWalletClient,
  custom,
  createPublicClient,
  parseEther,
  defineChain,
  formatEther,
  WalletClient,
  PublicClient,
  Chain,
} from "viem"
import "viem/window"
import { contractAddress, abi } from "./constants-js.js"

// Type-safe DOM access
const connectButton = document.getElementById('connectButton') as HTMLButtonElement | null
const fundButton = document.getElementById('fundButton') as HTMLButtonElement | null
const ethAmountInput = document.getElementById('ethAmount') as HTMLInputElement | null
const balanceButton = document.getElementById('BalanceButton') as HTMLButtonElement | null
const withdrawButton = document.getElementById('withdrawButton') as HTMLButtonElement | null
const getFundedAddressButton = document.getElementById('getFundedAddress') as HTMLButtonElement
const fundedAddressDisplay = document.getElementById('fundedAddressDisplay') as HTMLParagraphElement 


let walletClient: WalletClient | undefined
let publicClient: PublicClient | undefined

async function connect(): Promise<void> {
  if (typeof window.ethereum !== 'undefined') {
    walletClient = createWalletClient({
      transport: custom(window.ethereum)
    })
    await walletClient.requestAddresses()
    console.log('Connected to MetaMask')
  } else if (connectButton) {
    connectButton.innerText = 'Please install MetaMask!'
  }
}

async function fund(): Promise<void> {
  if (!ethAmountInput) return
  const ethAmount = ethAmountInput.value
  console.log(`Funding with ${ethAmount} ETH`)

  if (typeof window.ethereum !== 'undefined') {
    walletClient = createWalletClient({ transport: custom(window.ethereum) })
    publicClient = createPublicClient({ transport: custom(window.ethereum) })
    const [connectedAccount] = await walletClient.requestAddresses()
    const currentChain = await getCurrentChain(walletClient)

    const { request } = await publicClient.simulateContract({
      address: contractAddress,
      abi: abi,
      functionName: 'fund',
      account: connectedAccount,
      chain: currentChain,
      value: parseEther(ethAmount),
    })

    console.log('Simulated transaction:', request)
    const hash = await walletClient.writeContract(request)
    console.log('Transaction hash:', hash)
  } else if (connectButton) {
    connectButton.innerHTML = 'Please install MetaMask!'
  }
}

async function getFundedAddress() {
  if (typeof window.ethereum !== 'undefined') {
    try {
      walletClient = createWalletClient({
        transport: custom(window.ethereum),
      })

      const [account] = await walletClient.requestAddresses()
      fundedAddressDisplay.innerText = `Connected address: ${account}`
      console.log("Connected address:", account)
    } catch (error) {
      console.error("Error getting address:", error)
      fundedAddressDisplay.innerText = "Failed to fetch address"
    }
  } else {
    fundedAddressDisplay.innerText = "MetaMask not detected"
  }
}


async function getCurrentChain(client: WalletClient): Promise<Chain> {
  const chainId = await client.getChainId()
  const currentChain = defineChain({
    id: chainId,
    name: "Custom Chain",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: {
        http: ["http://localhost:8545"],
      },
    },
  })
  return currentChain
}

async function getBalance(): Promise<void> {
  if (typeof window.ethereum !== 'undefined') {
    publicClient = createPublicClient({ transport: custom(window.ethereum) })
    const balance = await publicClient.getBalance({ address: contractAddress })
    console.log(formatEther(balance), 'ETH')
  }
}

async function withdraw(): Promise<void> {
  console.log(`Withdrawing...`)

  if (typeof window.ethereum !== 'undefined') {
    try {
      walletClient = createWalletClient({ transport: custom(window.ethereum) })
      publicClient = createPublicClient({ transport: custom(window.ethereum) })
      const [account] = await walletClient.requestAddresses()
      const currentChain = await getCurrentChain(walletClient)

      const { request } = await publicClient.simulateContract({
        account,
        address: contractAddress,
        abi: abi,
        functionName: "withdraw",
        chain: currentChain,
      })

      const hash = await walletClient.writeContract(request)
      console.log("Transaction processed: ", hash)
    } catch (error) {
      console.error(error)
    }
  } else if (withdrawButton) {
    withdrawButton.innerHTML = "Please install MetaMask"
  }
}

// Attach event listeners
connectButton?.addEventListener('click', connect)
fundButton?.addEventListener('click', fund)
balanceButton?.addEventListener('click', getBalance)
withdrawButton?.addEventListener('click', withdraw)
getFundedAddressButton?.addEventListener('click',getFundedAddress)
