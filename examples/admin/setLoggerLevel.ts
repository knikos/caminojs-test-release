import { Avalanche } from "@c4tplatform/caminojs/dist"
import { AdminAPI } from "@c4tplatform/caminojs/dist/apis/admin"
import { SetLoggerLevelResponse } from "@c4tplatform/caminojs/dist/apis/admin/interfaces"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const admin: AdminAPI = avalanche.Admin()

const main = async (): Promise<any> => {
  const loggerName: string = "C"
  const logLevel: string = "DEBUG"
  const displayLevel: string = "INFO"
  const loggerLevel: SetLoggerLevelResponse = await admin.setLoggerLevel(
    loggerName,
    logLevel,
    displayLevel
  )
  console.log(loggerLevel)
}

main()
