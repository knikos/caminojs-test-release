// This file read secrets from a separate file called "secrets.json"
// which you can create based on "secrets.example" which is in the
// root of the `examples/` directory.
// Unlike "secrets.example", "secrets.json" should never be committed to git.
import { Avalanche } from "@c4tplatform/caminojs/dist"
import { AuthAPI } from "@c4tplatform/caminojs/dist/apis/auth"
import { readFile } from "fs"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const auth: AuthAPI = avalanche.Auth()

const main = async (): Promise<any> => {
  const path: string = "./examples/secrets.json"
  const encoding: "utf8" = "utf8"
  const cb = async (err: any, data: any): Promise<void> => {
    if (err) throw err
    const jsonData: any = JSON.parse(data)
    const oldPassword: string = jsonData.oldPassword
    const newPassword: string = jsonData.newPassword
    const successful: boolean = await auth.changePassword(
      oldPassword,
      newPassword
    )
    console.log(successful)
  }
  readFile(path, encoding, cb)
}

main()
