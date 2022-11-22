import { Avalanche } from "@c4tplatform/caminojs/dist"
import { InfoAPI } from "@c4tplatform/caminojs/dist/apis/info"
import { ExamplesConfig } from "../common/examplesConfig"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)

let info: InfoAPI

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  info = avalanche.Info()
}

const main = async (): Promise<any> => {
  await InitAvalanche()
  const alias: string = "X"
  const blockchainID: string = await info.getBlockchainID(alias)
  console.log(blockchainID)
}

main()
