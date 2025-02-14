import { Avalanche } from "@c4tplatform/caminojs/dist"
import { PlatformVMAPI } from "@c4tplatform/caminojs/dist/apis/platformvm"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const pchain: PlatformVMAPI = avalanche.PChain()

const main = async (): Promise<any> => {
  const txID: string = "2T7F1AzTLPzZrUcw22JLcC8yZ8o2muhjrM5zoQ3TBuENbAUvZd"
  const encoding: string = "json"
  const tx: string | object = await pchain.getTx(txID, encoding)
  console.log(tx)
}

main()
