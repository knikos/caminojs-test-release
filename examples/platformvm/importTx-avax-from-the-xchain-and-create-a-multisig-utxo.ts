import { Avalanche, BinTools, BN, Buffer } from "@c4tplatform/caminojs/dist"
import {
  PlatformVMAPI,
  KeyChain,
  SECPTransferOutput,
  SECPTransferInput,
  TransferableOutput,
  TransferableInput,
  UTXOSet,
  UTXO,
  AmountOutput,
  UnsignedTx,
  Tx,
  ImportTx
} from "@c4tplatform/caminojs/dist/apis/platformvm"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey
} from "@c4tplatform/caminojs/dist/utils"
import { ExamplesConfig } from "../common/examplesConfig"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)

const bintools: BinTools = BinTools.getInstance()
// X-local18jma8ppw3nhx5r4ap8clazz0dps7rv5u9xde7p
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
// P-local15s7p7mkdev0uajrd0pzxh88kr8ryccztnlmzvj
const privKey2 = "PrivateKey-R6e8f5QSa89DjpvL9asNdhdJ4u8VqzMJStPV8VVdDmLgPd8a4"
// P-local1jwwk62ktygl0w29rsq2hq55amamhpvx82kfnte
const privKey3 = "PrivateKey-rKsiN3X4NSJcPpWxMSh7WcuY653NGQ7tfADgQwDZ9yyUPPDG9"

const importedInputs: TransferableInput[] = []
const outputs: TransferableOutput[] = []
const inputs: TransferableInput[] = []
const threshold: number = 2
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from(
  "Import AVAX to P-Chain from X-Chain and consume a multisig atomic output and create a multisig utxo"
)

let pchain: PlatformVMAPI
let pKeychain: KeyChain
let pAddresses: Buffer[]
let pAddressStrings: string[]
let avaxAssetID: string
let fee: BN
let pChainBlockchainID: string
let pChainBlockchainIDBuf: Buffer
let avaxAssetIDBuf: Buffer

let xChainBlockchainID: string
let xChainBlockchainIDBuf: Buffer

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  pchain = avalanche.PChain()
  pKeychain = pchain.keyChain()
  pKeychain.importKey(privKey)
  pKeychain.importKey(privKey2)
  pKeychain.importKey(privKey3)
  pAddresses = pchain.keyChain().getAddresses()
  pAddressStrings = pchain.keyChain().getAddressStrings()
  avaxAssetID = avalanche.getNetwork().X.avaxAssetID
  fee = pchain.getDefaultTxFee()
  pChainBlockchainID = avalanche.getNetwork().P.blockchainID
  pChainBlockchainIDBuf = bintools.cb58Decode(pChainBlockchainID)
  avaxAssetIDBuf = bintools.cb58Decode(avaxAssetID)

  xChainBlockchainID = avalanche.getNetwork().X.blockchainID
  xChainBlockchainIDBuf = bintools.cb58Decode(xChainBlockchainID)
}

const main = async (): Promise<any> => {
  await InitAvalanche()

  const avaxAssetID: Buffer = await pchain.getAVAXAssetID()
  const platformvmUTXOResponse: any = await pchain.getUTXOs(
    pAddressStrings,
    xChainBlockchainID
  )
  const utxoSet: UTXOSet = platformvmUTXOResponse.utxos
  const utxos: UTXO[] = utxoSet.getAllUTXOs()
  let amount: BN = new BN(0)
  utxos.forEach((utxo: UTXO): void => {
    console.log(utxo.getOutput().getAddresses())
    const amountOutput: AmountOutput = utxo.getOutput() as AmountOutput
    const amt: BN = amountOutput.getAmount()
    const txid: Buffer = utxo.getTxID()
    const outputidx: Buffer = utxo.getOutputIdx()
    const assetID: Buffer = utxo.getAssetID()

    if (avaxAssetID.toString("hex") === assetID.toString("hex")) {
      const secpTransferInput: SECPTransferInput = new SECPTransferInput(amt)
      secpTransferInput.addSignatureIdx(1, pAddresses[2])
      secpTransferInput.addSignatureIdx(2, pAddresses[1])
      const input: TransferableInput = new TransferableInput(
        txid,
        outputidx,
        avaxAssetID,
        secpTransferInput
      )
      importedInputs.push(input)
      amount = amount.add(amt)
    }
  })
  const secpTransferOutput: SECPTransferOutput = new SECPTransferOutput(
    amount.sub(fee),
    pAddresses,
    locktime,
    threshold
  )
  const transferableOutput: TransferableOutput = new TransferableOutput(
    avaxAssetID,
    secpTransferOutput
  )
  outputs.push(transferableOutput)

  const importTx: ImportTx = new ImportTx(
    config.networkID,
    pChainBlockchainIDBuf,
    outputs,
    inputs,
    memo,
    xChainBlockchainIDBuf,
    importedInputs
  )

  const unsignedTx: UnsignedTx = new UnsignedTx(importTx)
  const tx: Tx = unsignedTx.sign(pKeychain)
  const txid: string = await pchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
