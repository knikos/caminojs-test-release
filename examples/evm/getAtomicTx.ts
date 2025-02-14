import { Avalanche } from "@c4tplatform/caminojs/dist"
import { EVMAPI } from "@c4tplatform/caminojs/dist/apis/evm"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const cchain: EVMAPI = avalanche.CChain()

const main = async (): Promise<any> => {
  const txID: string = "2GD5SRYJQr2kw5jE73trBFiAgVQyrCaeg223TaTyJFYXf2kPty"
  const status: string = await cchain.getAtomicTx(txID)
  console.log(status)
}

main()
