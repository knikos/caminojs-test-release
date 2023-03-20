/**
 * @packageDocumentation
 * @module API-PlatformVM-UTXOs
 */
import { Buffer } from "buffer/";
import BN from "bn.js";
import { TransferableOutput } from "./outputs";
import { TransferableInput } from "./inputs";
import { StandardUTXO, StandardUTXOSet } from "../../common/utxos";
import { StandardAssetAmountDestination } from "../../common/assetamount";
import { BaseOutput, OutputOwners } from "../../common/output";
import { SerializedEncoding } from "../../utils/serialization";
import { LockMode } from "./builder";
/**
 * Class for representing a single UTXO.
 */
export declare class UTXO extends StandardUTXO {
    protected _typeName: string;
    protected _typeID: any;
    deserialize(fields: object, encoding?: SerializedEncoding): void;
    fromBuffer(bytes: Buffer, offset?: number): number;
    /**
     * Takes a base-58 string containing a [[UTXO]], parses it, populates the class, and returns the length of the StandardUTXO in bytes.
     *
     * @param serialized A base-58 string containing a raw [[UTXO]]
     *
     * @returns The length of the raw [[UTXO]]
     *
     * @remarks
     * unlike most fromStrings, it expects the string to be serialized in cb58 format
     */
    fromString(serialized: string): number;
    /**
     * Returns a base-58 representation of the [[UTXO]].
     *
     * @remarks
     * unlike most toStrings, this returns in cb58 serialization format
     */
    toString(): string;
    clone(): this;
    create(codecID?: number, txid?: Buffer, outputidx?: Buffer | number, assetID?: Buffer, output?: BaseOutput): this;
}
export declare class AssetAmountDestination extends StandardAssetAmountDestination<TransferableOutput, TransferableInput> {
    protected signers: Buffer[];
    protected outputOwners: OutputOwners[];
    getSigners: () => Buffer[];
    setOutputOwners: (owners: OutputOwners[]) => OutputOwners[];
    getOutputOwners: () => OutputOwners[];
    constructor(destinations: Buffer[], destinationsThreshold: number, senders: Buffer[], signers: Buffer[], changeAddresses: Buffer[], changeAddressesThreshold: number);
}
/**
 * Class representing a set of [[UTXO]]s.
 */
export declare class UTXOSet extends StandardUTXOSet<UTXO> {
    protected _typeName: string;
    protected _typeID: any;
    deserialize(fields: object, encoding?: SerializedEncoding): void;
    parseUTXO(utxo: UTXO | string): UTXO;
    create(...args: any[]): this;
    clone(): this;
    _feeCheck(fee: BN, feeAssetID: Buffer): boolean;
    getConsumableUXTO: (asOf?: BN, stakeable?: boolean) => UTXO[];
    getLockedTxIDs: () => {
        depositIDs: string[];
        bondIDs: string[];
    };
    getMinimumSpendable: (aad: AssetAmountDestination, asOf?: BN, lockTime?: BN, lockMode?: LockMode) => Promise<Error>;
}
//# sourceMappingURL=utxos.d.ts.map