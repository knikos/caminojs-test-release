import { Avalanche, BinTools, BN, Buffer } from "@c4tplatform/caminojs/dist"
import {
  PlatformVMAPI,
  KeyChain,
  UTXOSet,
  UnsignedTx,
  Tx
} from "@c4tplatform/caminojs/dist/apis/platformvm"
import {
  UnixNow
} from "@c4tplatform/caminojs/dist/utils"


const bintools: BinTools = BinTools.getInstance()


let pchain: PlatformVMAPI
let pKeychain: KeyChain
let pAddresses: Buffer[]
let pAddressStrings: string[]
let fee: BN
let cBlockchainID: string

const ip: string = "kopernikus.camino.network"
const port: number = 443
const protocol: string = "https"
const networkID: number = 1002
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID);

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  pchain = avalanche.PChain()
  pKeychain = pchain.keyChain()
  // PrivateKey-2XqzgRjbbV7KRbPG9uAZWHKHPScdE9iUqMkBZzjGYVGQeLm2yS => c9bb9afaa068cab5909939b2b0107fdf6349c3d961f5d0c2fb4cf5bdd0732143
  // PrivateKey-2Wvi67aaZHHJH6YXofwb4h4QBMT88BB6xSXEqE6JgpUxuoA6jf => c7a591c5cbdd66a4e2a506957cf66e1b13c7717878d917a224f72d0e08b52e75
  const pKeys = ["PrivateKey-2XqzgRjbbV7KRbPG9uAZWHKHPScdE9iUqMkBZzjGYVGQeLm2yS", "PrivateKey-2Wvi67aaZHHJH6YXofwb4h4QBMT88BB6xSXEqE6JgpUxuoA6jf"]
  for (let k of pKeys) {
    pKeychain.importKey(k)
  }

  pAddresses = pchain.keyChain().getAddresses()
  pAddressStrings = pchain.keyChain().getAddressStrings()
  fee = pchain.getDefaultTxFee()
  cBlockchainID = avalanche.getNetwork().C.blockchainID
}

const msigAlias: string = "P-kopernikus18gw475en5h5jvtkslp7xqed7t7ugq6rmc4zrvh"
const toAddress: string[] = ["0xf0666140a161e725e8d2cb4c445a06f7b8886f11"]
const fromAddress: string[] = [msigAlias]
const changeAddress: string[] = [msigAlias]
const memo: Buffer = Buffer.from(
  `MSig-Alias Test from @jax and @alex - ${Date.now()}`
)
const asOf: BN = UnixNow()

const main = async (): Promise<any> => {
  await InitAvalanche()
  const getBalanceResponse: any = await pchain.getBalance(msigAlias)
  const unlocked: BN = new BN(getBalanceResponse.unlocked)
  const platformVMUTXOResponse: any = await pchain.getUTXOs(msigAlias)
  const utxoSet: UTXOSet = platformVMUTXOResponse.utxos
  const unsignedTx: UnsignedTx = await pchain.buildExportTx(
    utxoSet,
    unlocked.sub(fee),
    cBlockchainID,
    toAddress,
    fromAddress,
    changeAddress,
    memo,
    asOf,
  )
  const tx: Tx = unsignedTx.sign(pKeychain)
  const txid: string = await pchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
