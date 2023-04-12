/**
 * @packageDocumentation
 * @module API-PlatformVM-ClaimTx
 */
import { Buffer } from "buffer/";
import { ParseableOutput, TransferableOutput } from "./outputs";
import { TransferableInput } from "./inputs";
import { BaseTx } from "./basetx";
import { SerializedEncoding } from "../../utils/serialization";
import BN from "bn.js";
import { Credential, SigIdx } from "../../common";
import { KeyChain } from "caminojs/apis/platformvm/keychain";
export declare const ClaimType: {
    readonly VALIDATOR_REWARD: BN;
    readonly EXPIRED_DEPOSIT_REWARD: BN;
    readonly ALL: BN;
};
/**
 * Class representing an unsigned ClaimTx transaction.
 */
export declare class ClaimTx extends BaseTx {
    protected _typeName: string;
    protected _typeID: number;
    deserialize(fields: object, encoding?: SerializedEncoding): void;
    serialize(encoding?: SerializedEncoding): object;
    protected numDepositTxs: Buffer;
    protected depositTxs: Buffer[];
    protected numClaimableOwnerIDs: Buffer;
    protected claimableOwnerIDs: Buffer[];
    protected numClaimedAmounts: Buffer;
    protected claimedAmounts: Buffer[];
    protected claimType: Buffer;
    protected claimTo: ParseableOutput;
    protected sigCount: Buffer;
    protected sigIdxs: SigIdx[];
    /**
     * Returns the id of the [[RegisterNodeTx]]
     */
    getTxType(): number;
    /**
     * Returns the array of claimed owner ids
     */
    getClaimableOwnerIDs(): Buffer[];
    /**
     * Returns the array of claimed amounts
     */
    getClaimedAmounts(): Buffer[];
    /**
     * Returns the array of deposit tx ids
     */
    getDepositTxs(): Buffer[];
    /**
     * Returns the claimTo
     */
    getClaimTo(): ParseableOutput;
    getClaimType(): Buffer;
    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing a [[ClaimTx]], parses it, populates the class, and returns the length of the [[ClaimTx]] in bytes.
     *
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[ClaimTx]]
     *
     * @returns The length of the raw [[ClaimTx]]
     *
     * @remarks assume not-checksummed
     */
    fromBuffer(bytes: Buffer, offset?: number): number;
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[ClaimTx]].
     */
    toBuffer(): Buffer;
    clone(): this;
    create(...args: any[]): this;
    /**
     * Creates and adds a [[SigIdx]] to the [[ClaimTx]].
     *
     * @param addressIdx The index of the address to reference in the signatures
     * @param address The address of the source of the signature
     */
    addSignatureIdx(addressIdx: number, address: Buffer): void;
    /**
     * Returns the array of [[SigIdx]] for this [[TX]]
     */
    getSigIdxs(): SigIdx[];
    /**
     * Set the array of [[SigIdx]] for this [[TX]]
     */
    setSigIdxs(sigIdxs: SigIdx[]): void;
    /**
     * Class representing an unsigned RegisterNode transaction.
     *
     * @param networkID Optional networkID, [[DefaultNetworkID]]
     * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
     * @param outs Optional array of the [[TransferableOutput]]s
     * @param ins Optional array of the [[TransferableInput]]s
     * @param depositTxIDs Optional array of the deposit tx ids
     * @param claimableOwnerIDs Optional array of the claimable owner ids
     * @param claimedAmounts Optional array of the claimed amounts
     * @param claimType Optional the type of the claim
     * @param claimTo Optional the owner of the rewards
     */
    constructor(networkID?: number, blockchainID?: Buffer, outs?: TransferableOutput[], ins?: TransferableInput[], memo?: Buffer, depositTxIDs?: string[] | Buffer[], claimableOwnerIDs?: string[] | Buffer[], claimedAmounts?: BN[], claimType?: BN, claimTo?: ParseableOutput);
    /**
     * Takes the bytes of an [[UnsignedTx]] and returns an array of [[Credential]]s
     *
     * @param msg A Buffer for the [[UnsignedTx]]
     * @param kc An [[KeyChain]] used in signing
     *
     * @returns An array of [[Credential]]s
     */
    sign(msg: Buffer, kc: KeyChain): Credential[];
}
//# sourceMappingURL=claimtx.d.ts.map