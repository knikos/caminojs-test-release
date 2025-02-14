import { Avalanche } from "@c4tplatform/caminojs/dist"
import { AVMAPI } from "@c4tplatform/caminojs/dist/apis/avm"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const xchain: AVMAPI = avalanche.XChain()

const main = async (): Promise<any> => {
  const txID: string = "Ycg5QzddNwe3ebfFXhoGUDnWgC6GE88QRakRnn9dp3nGwqCwD"
  const encoding: string = "json"
  const tx: string | object = await xchain.getTx(txID, encoding)
  console.log(tx)
}

main()
