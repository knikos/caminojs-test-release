import { Avalanche, BinTools, BN, Buffer } from "@c4tplatform/caminojs/dist"
import {
  AVMAPI,
  KeyChain as AVMKeyChain
} from "@c4tplatform/caminojs/dist/apis/avm"
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
  ExportTx
} from "@c4tplatform/caminojs/dist/apis/platformvm"
import { Output } from "@c4tplatform/caminojs/dist/common"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  MILLIAVAX
} from "@c4tplatform/caminojs/dist/utils"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const xchain: AVMAPI = avalanche.XChain()
const pchain: PlatformVMAPI = avalanche.PChain()
const bintools: BinTools = BinTools.getInstance()
const xKeychain: AVMKeyChain = xchain.keyChain()
const pKeychain: KeyChain = pchain.keyChain()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
xKeychain.importKey(privKey)
pKeychain.importKey(privKey)
const xAddresses: Buffer[] = xchain.keyChain().getAddresses()
const pAddressStrings: string[] = pchain.keyChain().getAddressStrings()
const xChainBlockchainID: string = avalanche.getNetwork().X.blockchainID
const pChainBlockchainID: string = avalanche.getNetwork().P.blockchainID
const exportedOuts: TransferableOutput[] = []
const outputs: TransferableOutput[] = []
const inputs: TransferableInput[] = []
const fee: BN = MILLIAVAX
const threshold: number = 1
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from("Manually Export AVAX from P-Chain to X-Chain")

const main = async (): Promise<any> => {
  const avaxAssetID: Buffer = await pchain.getAVAXAssetID()
  const getBalanceResponse: any = await pchain.getBalance(pAddressStrings[0])
  const unlocked: BN = new BN(getBalanceResponse.unlocked)
  console.log(unlocked.sub(fee).toString())
  const secpTransferOutput: SECPTransferOutput = new SECPTransferOutput(
    unlocked.sub(fee),
    xAddresses,
    locktime,
    threshold
  )
  const transferableOutput: TransferableOutput = new TransferableOutput(
    avaxAssetID,
    secpTransferOutput
  )
  exportedOuts.push(transferableOutput)

  const platformVMUTXOResponse: any = await pchain.getUTXOs(pAddressStrings)
  const utxoSet: UTXOSet = platformVMUTXOResponse.utxos
  const utxos: UTXO[] = utxoSet.getAllUTXOs()
  utxos.forEach((utxo: UTXO) => {
    const output: Output = utxo.getOutput()
    // if (output.getOutputID() === 7) {
    const amountOutput: AmountOutput = utxo.getOutput() as AmountOutput
    const amt: BN = amountOutput.getAmount().clone()
    const txid: Buffer = utxo.getTxID()
    const outputidx: Buffer = utxo.getOutputIdx()

    const secpTransferInput: SECPTransferInput = new SECPTransferInput(amt)
    secpTransferInput.addSignatureIdx(0, xAddresses[0])

    const input: TransferableInput = new TransferableInput(
      txid,
      outputidx,
      avaxAssetID,
      secpTransferInput
    )
    inputs.push(input)
    // }
  })

  const exportTx: ExportTx = new ExportTx(
    networkID,
    bintools.cb58Decode(pChainBlockchainID),
    outputs,
    inputs,
    memo,
    bintools.cb58Decode(xChainBlockchainID),
    exportedOuts
  )

  const unsignedTx: UnsignedTx = new UnsignedTx(exportTx)
  const tx: Tx = unsignedTx.sign(pKeychain)
  const txid: string = await pchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
