import { Avalanche, BinTools, BN, Buffer } from "@c4tplatform/caminojs/dist"
import {
  AVMAPI,
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
} from "@c4tplatform/caminojs/dist/apis/avm"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey
} from "@c4tplatform/caminojs/dist/utils"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const xchain: AVMAPI = avalanche.XChain()
const bintools: BinTools = BinTools.getInstance()
const xKeychain: KeyChain = xchain.keyChain()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
xKeychain.importKey(privKey)
const xAddresses: Buffer[] = xchain.keyChain().getAddresses()
const xAddressStrings: string[] = xchain.keyChain().getAddressStrings()
const blockchainID: string = avalanche.getNetwork().X.blockchainID
const avaxAssetID: string = avalanche.getNetwork().X.avaxAssetID
const avaxAssetIDBuf: Buffer = bintools.cb58Decode(avaxAssetID)
const pChainBlockchainID: string = avalanche.getNetwork().P.blockchainID
const importedInputs: TransferableInput[] = []
const outputs: TransferableOutput[] = []
const inputs: TransferableInput[] = []
const fee: BN = xchain.getDefaultTxFee()
const threshold: number = 1
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from(
  "Manually Import AVAX to the X-Chain from the P-Chain"
)
// Uncomment for codecID 00 01
// const codecID: number = 1

const main = async (): Promise<any> => {
  const avmUTXOResponse: any = await xchain.getUTXOs(
    xAddressStrings,
    pChainBlockchainID
  )
  const utxoSet: UTXOSet = avmUTXOResponse.utxos
  const utxo: UTXO = utxoSet.getAllUTXOs()[0]
  const amountOutput: AmountOutput = utxo.getOutput() as AmountOutput
  const amt: BN = amountOutput.getAmount().clone()
  const txid: Buffer = utxo.getTxID()
  const outputidx: Buffer = utxo.getOutputIdx()

  const secpTransferInput: SECPTransferInput = new SECPTransferInput(amt)
  secpTransferInput.addSignatureIdx(0, xAddresses[0])
  // Uncomment for codecID 00 01
  // secpTransferInput.setCodecID(codecID)

  const input: TransferableInput = new TransferableInput(
    txid,
    outputidx,
    avaxAssetIDBuf,
    secpTransferInput
  )
  importedInputs.push(input)

  const secpTransferOutput: SECPTransferOutput = new SECPTransferOutput(
    amt.sub(fee),
    xAddresses,
    locktime,
    threshold
  )
  // Uncomment for codecID 00 01
  // secpTransferOutput.setCodecID(codecID)
  const transferableOutput: TransferableOutput = new TransferableOutput(
    avaxAssetIDBuf,
    secpTransferOutput
  )
  outputs.push(transferableOutput)

  const importTx: ImportTx = new ImportTx(
    networkID,
    bintools.cb58Decode(blockchainID),
    outputs,
    inputs,
    memo,
    bintools.cb58Decode(pChainBlockchainID),
    importedInputs
  )
  // Uncomment for codecID 00 01
  // importTx.setCodecID(codecID)

  const unsignedTx: UnsignedTx = new UnsignedTx(importTx)
  const tx: Tx = unsignedTx.sign(xKeychain)
  const id: string = await xchain.issueTx(tx)
  console.log(`Success! TXID: ${id}`)
}

main()
