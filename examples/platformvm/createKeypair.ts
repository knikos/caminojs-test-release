import { Avalanche } from "@c4tplatform/caminojs/dist"
import {
  PlatformVMAPI,
  KeyChain,
  KeyPair
} from "@c4tplatform/caminojs/dist/apis/platformvm"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const pchain: PlatformVMAPI = avalanche.PChain()

const main = async (): Promise<any> => {
  const keychain: KeyChain = pchain.keyChain()
  const keypair: KeyPair = keychain.makeKey()
  const response: {
    address: string
    publicKey: string
    privateKey: string
  } = {
    address: keypair.getAddressString(),
    publicKey: keypair.getPublicKeyString(),
    privateKey: keypair.getPrivateKeyString()
  }
  console.log(response)
}

main()
