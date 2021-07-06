/**
 * @packageDocumentation
 * @module API-AVM-GenesisAsset
 */
import { Buffer } from 'buffer/'
import { AVMConstants } from './constants'
import { InitialStates } from './initialstates'
import { DefaultNetworkID } from '../../utils/constants'
import { Serialization, SerializedEncoding } from '../../utils/serialization'
import { CreateAssetTx } from './createassettx'

/**
 * @ignore
 */
const serialization: Serialization = Serialization.getInstance()

export class GenesisAsset extends CreateAssetTx {
  protected _typeName = "GenesisAsset"
  protected _codecID = undefined
  protected _typeID = undefined

  serialize(encoding: SerializedEncoding = "hex"): object {
    const fields: object = super.serialize(encoding)
    delete fields["blockchainID"]
    delete fields["outs"]
    delete fields["ins"]
    return {
      ...fields,
      "assetAlias": serialization.encoder(this.assetAlias, encoding, "utf8", "utf8"),
      "name": serialization.encoder(this.name, encoding, "utf8", "utf8"),
      "symbol": serialization.encoder(this.symbol, encoding, "utf8", "utf8"),
      "denomination": serialization.encoder(this.denomination, encoding, "Buffer", "decimalString", 1),
      "initialstate": this.initialstate.serialize(encoding)
    }
  }

  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    fields["blockchainID"] = Buffer.alloc(32, 16).toString("hex")
    fields["outs"] = []
    fields["ins"] = []
    super.deserialize(fields, encoding)
    this.assetAlias = serialization.decoder(fields["assetAlias"], encoding, "utf8", "utf8")
    this.name = serialization.decoder(fields["name"], encoding, "utf8", "utf8")
    this.symbol = serialization.decoder(fields["symbol"], encoding, "utf8", "utf8")
    this.denomination = serialization.decoder(fields["denomination"], encoding, "decimalString", "Buffer", 1)
    this.initialstate = new InitialStates()
    this.initialstate.deserialize(fields["initialstate"], encoding)
  }

  protected assetAlias: string = ''

  /**
   * Returns the string representation of the assetAlias
   */
  getAssetAlias = (): string => this.assetAlias

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[GenesisAsset]].
   */
  toBuffer(): Buffer {
    // asset alias
    const assetAlias: string = this.getAssetAlias()
    const assetAliasbuffSize: Buffer = Buffer.alloc(2)
    assetAliasbuffSize.writeUInt16BE(assetAlias.length, 0)
    let bsize: number = assetAliasbuffSize.length
    let barr: Buffer[] = [assetAliasbuffSize]
    const assetAliasbuff: Buffer = Buffer.alloc(assetAlias.length)
    assetAliasbuff.write(assetAlias, 0, assetAlias.length, 'utf8')
    bsize += assetAliasbuff.length
    barr.push(assetAliasbuff)

    const networkIDBuff: Buffer = Buffer.alloc(4)
    networkIDBuff.writeUInt32BE(serialization.bufferToType(this.networkID, "BN").toNumber(), 0)
    bsize += networkIDBuff.length
    barr.push(networkIDBuff)

    // Blockchain ID
    bsize += 32
    barr.push(Buffer.alloc(32))

    // num Outputs
    bsize += 4
    barr.push(Buffer.alloc(4))

    // num Inputs
    bsize += 4
    barr.push(Buffer.alloc(4))

    // memo
    const memo: Buffer = this.getMemo()
    const memobuffSize: Buffer = Buffer.alloc(4)
    memobuffSize.writeUInt32BE(memo.length, 0)
    bsize += memobuffSize.length
    barr.push(memobuffSize)

    bsize += memo.length
    barr.push(memo)

    // asset name
    // currently same as asset alias
    // TODO - allow users to pass in alias and name
    bsize += assetAliasbuffSize.length
    barr.push(assetAliasbuffSize)

    bsize += assetAliasbuff.length
    barr.push(assetAliasbuff)

    // symbol
    const symbol: string = this.getSymbol()
    const symbolbuffSize: Buffer = Buffer.alloc(2)
    symbolbuffSize.writeUInt16BE(symbol.length, 0)
    bsize += symbolbuffSize.length
    barr.push(symbolbuffSize)

    const symbolbuff: Buffer = Buffer.alloc(symbol.length)
    symbolbuff.write(symbol, 0, symbol.length, 'utf8')
    bsize += symbolbuff.length
    barr.push(symbolbuff)

    // denomination
    const denomination: number = this.getDenomination()
    const denominationbuffSize: Buffer = Buffer.alloc(1)
    denominationbuffSize.writeUInt8(denomination, 0)
    bsize += denominationbuffSize.length
    barr.push(denominationbuffSize)

    bsize += this.initialstate.toBuffer().length
    barr.push(this.initialstate.toBuffer())
    return Buffer.concat(barr, bsize)
  }

  /**
  * Class representing a GenesisAsset
   *
   * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
   * @param name String for the descriptive name of the asset
   * @param symbol String for the ticker symbol of the asset
   * @param denomination Optional number for the denomination which is 10^D. D must be >= 0 and <= 32. Ex: $1 AVAX = 10^9 $nAVAX
   * @param initialstate Optional [[InitialStates]] that represent the intial state of a created asset
   */
  constructor(
    networkID: number = DefaultNetworkID,
    assetAlias: string = undefined,
    name: string = undefined,
    symbol: string = undefined,
    denomination: number = undefined,
    initialstate: InitialStates = undefined,
    memo: Buffer = undefined
  ) {
    super(networkID, Buffer.alloc(32, 16), [], [], memo)
    if (
      typeof assetAlias === 'string' && typeof name === 'string' &&
      typeof symbol === 'string' && typeof denomination === 'number' &&
      denomination >= 0 && denomination <= 32 && typeof initialstate !== 'undefined'
    ) {
      this.assetAlias = assetAlias
      this.name = name
      this.symbol = symbol
      this.denomination.writeUInt8(denomination, 0)
      this.initialstate = initialstate
    }
  }
}