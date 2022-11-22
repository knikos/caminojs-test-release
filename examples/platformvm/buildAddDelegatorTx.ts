import { Avalanche, BN, Buffer } from "@c4tplatform/caminojs/dist"
import {
  PlatformVMAPI,
  KeyChain,
  UTXOSet,
  UnsignedTx,
  Tx
} from "@c4tplatform/caminojs/dist/apis/platformvm"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  UnixNow
} from "@c4tplatform/caminojs/dist/utils"
import { ExamplesConfig } from "../common/examplesConfig"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)

const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
const threshold: number = 1
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from(
  "PlatformVM utility method buildAddDelegatorTx to add a delegator to the primary subnet"
)
const asOf: BN = UnixNow()
const nodeID: string = "NodeID-DueWyGi3B9jtKfa9mPoecd4YSDJ1ftF69"
const startTime: BN = UnixNow().add(new BN(60 * 1))
const endTime: BN = startTime.add(new BN(2630000))

let pchain: PlatformVMAPI
let pKeychain: KeyChain
let pAddresses: Buffer[]
let pAddressStrings: string[]
let avaxAssetID: string
let fee: BN
let pChainBlockchainID: string

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  pchain = avalanche.PChain()
  pKeychain = pchain.keyChain()
  pKeychain.importKey(privKey)
  pAddresses = pchain.keyChain().getAddresses()
  pAddressStrings = pchain.keyChain().getAddressStrings()
  avaxAssetID = avalanche.getNetwork().X.avaxAssetID
  fee = pchain.getDefaultTxFee()
  pChainBlockchainID = avalanche.getNetwork().P.blockchainID
}

const main = async (): Promise<any> => {
  await InitAvalanche()

  const stakeAmount: any = await pchain.getMinStake()
  const platformVMUTXOResponse: any = await pchain.getUTXOs(pAddressStrings)
  const utxoSet: UTXOSet = platformVMUTXOResponse.utxos

  const unsignedTx: UnsignedTx = await pchain.buildAddDelegatorTx(
    utxoSet,
    pAddressStrings,
    pAddressStrings,
    pAddressStrings,
    nodeID,
    startTime,
    endTime,
    stakeAmount.minDelegatorStake,
    pAddressStrings,
    locktime,
    threshold,
    memo,
    asOf
  )

  const tx: Tx = unsignedTx.sign(pKeychain)
  const txid: string = await pchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
