/**
 * @packageDocumentation
 * @module API-PlatformVM-AddressStateTx
 */
import { Buffer } from "buffer/";
import { TransferableOutput } from "./outputs";
import { TransferableInput } from "./inputs";
import { BaseTx } from "./basetx";
import { SerializedEncoding } from "../../utils/serialization";
export declare const ADDRESSSTATEKYCVERIFIED: number;
export declare const ADDRESSSTATECONSORTIUM: number;
export declare const ADDRESSSTATEDEFERRED: number;
/**
 * Class representing an unsigned AdressStateTx transaction.
 */
export declare class AddressStateTx extends BaseTx {
    protected _typeName: string;
    protected _typeID: number;
    serialize(encoding?: SerializedEncoding): object;
    deserialize(fields: object, encoding?: SerializedEncoding): void;
    protected address: Buffer;
    protected state: number;
    protected remove: boolean;
    /**
     * Returns the id of the [[AddressStateTx]]
     */
    getTxType(): number;
    /**
     * Returns the address
     */
    getAddress(): Buffer;
    /**
     * Returns the state
     */
    getState(): number;
    /**
     * Returns the remove flag
     */
    getRemove(): boolean;
    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[AddressStateTx]], parses it, populates the class, and returns the length of the [[AddressStateTx]] in bytes.
     *
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[AddressStateTx]]
     *
     * @returns The length of the raw [[AddressStateTx]]
     *
     * @remarks assume not-checksummed
     */
    fromBuffer(bytes: Buffer, offset?: number): number;
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[AddressStateTx]].
     */
    toBuffer(): Buffer;
    clone(): this;
    create(...args: any[]): this;
    /**
     * Class representing an unsigned RegisterNode transaction.
     *
     * @param networkID Optional networkID, [[DefaultNetworkID]]
     * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
     * @param outs Optional array of the [[TransferableOutput]]s
     * @param ins Optional array of the [[TransferableInput]]s
     * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
     * @param address Optional address to alter state.
     * @param state Optional state to alter.
     * @param remove Optional if true remove the flag, otherwise set
     */
    constructor(networkID?: number, blockchainID?: Buffer, outs?: TransferableOutput[], ins?: TransferableInput[], memo?: Buffer, address?: string | Buffer, state?: number, remove?: boolean);
}
//# sourceMappingURL=addressstatetx.d.ts.map