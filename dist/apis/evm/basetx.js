"use strict";
/**
 * @packageDocumentation
 * @module API-EVM-BaseTx
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVMBaseTx = void 0;
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const evmtx_1 = require("../../common/evmtx");
const constants_1 = require("../../utils/constants");
const tx_1 = require("./tx");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
/**
 * Class representing a base for all transactions.
 */
class EVMBaseTx extends evmtx_1.EVMStandardBaseTx {
    /**
     * Class representing an EVMBaseTx which is the foundation for all EVM transactions.
     *
     * @param networkID Optional networkID, [[DefaultNetworkID]]
     * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
     */
    constructor(networkID = constants_1.DefaultNetworkID, blockchainID = buffer_1.Buffer.alloc(32, 16)) {
        super(networkID, blockchainID);
        this._typeName = "BaseTx";
        this._typeID = undefined;
    }
    //serialize is inherited
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
    }
    /**
     * Returns the id of the [[BaseTx]]
     */
    getTxType() {
        return this._typeID;
    }
    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[BaseTx]], parses it, populates the class, and returns the length of the BaseTx in bytes.
     *
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[BaseTx]]
     *
     * @returns The length of the raw [[BaseTx]]
     *
     * @remarks assume not-checksummed
     */
    fromBuffer(bytes, offset = 0) {
        this.networkID = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        this.blockchainID = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        return offset;
    }
    /**
     * Takes the bytes of an [[UnsignedTx]] and returns an array of [[Credential]]s
     *
     * @param msg A Buffer for the [[UnsignedTx]]
     * @param kc An [[KeyChain]] used in signing
     *
     * @returns An array of [[Credential]]s
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sign(msg, kc) {
        const creds = [];
        return creds;
    }
    clone() {
        const newEVMBaseTx = new EVMBaseTx();
        newEVMBaseTx.fromBuffer(this.toBuffer());
        return newEVMBaseTx;
    }
    create(...args) {
        return new EVMBaseTx(...args);
    }
    select(id, ...args) {
        const newEVMBaseTx = (0, tx_1.SelectTxClass)(id, ...args);
        return newEVMBaseTx;
    }
}
exports.EVMBaseTx = EVMBaseTx;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZXR4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvZXZtL2Jhc2V0eC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztHQUdHOzs7Ozs7QUFFSCxvQ0FBZ0M7QUFDaEMsb0VBQTJDO0FBRTNDLDhDQUFzRDtBQUV0RCxxREFBd0Q7QUFDeEQsNkJBQW9DO0FBR3BDOztHQUVHO0FBQ0gsTUFBTSxRQUFRLEdBQWEsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUVqRDs7R0FFRztBQUNILE1BQWEsU0FBVSxTQUFRLHlCQUFvQztJQStEakU7Ozs7O09BS0c7SUFDSCxZQUNFLFlBQW9CLDRCQUFnQixFQUNwQyxlQUF1QixlQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUM7UUFFM0MsS0FBSyxDQUFDLFNBQVMsRUFBRSxZQUFZLENBQUMsQ0FBQTtRQXhFdEIsY0FBUyxHQUFHLFFBQVEsQ0FBQTtRQUNwQixZQUFPLEdBQUcsU0FBUyxDQUFBO0lBd0U3QixDQUFDO0lBdEVELHdCQUF3QjtJQUV4QixXQUFXLENBQUMsTUFBYyxFQUFFLFdBQStCLEtBQUs7UUFDOUQsS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUE7SUFDckMsQ0FBQztJQUVEOztPQUVHO0lBQ0gsU0FBUztRQUNQLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQTtJQUNyQixDQUFDO0lBRUQ7Ozs7Ozs7O09BUUc7SUFDSCxVQUFVLENBQUMsS0FBYSxFQUFFLFNBQWlCLENBQUM7UUFDMUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFBO1FBQzdELE1BQU0sSUFBSSxDQUFDLENBQUE7UUFDWCxJQUFJLENBQUMsWUFBWSxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxNQUFNLEdBQUcsRUFBRSxDQUFDLENBQUE7UUFDakUsTUFBTSxJQUFJLEVBQUUsQ0FBQTtRQUNaLE9BQU8sTUFBTSxDQUFBO0lBQ2YsQ0FBQztJQUVEOzs7Ozs7O09BT0c7SUFDSCw2REFBNkQ7SUFDN0QsSUFBSSxDQUFDLEdBQVcsRUFBRSxFQUFZO1FBQzVCLE1BQU0sS0FBSyxHQUFpQixFQUFFLENBQUE7UUFDOUIsT0FBTyxLQUFLLENBQUE7SUFDZCxDQUFDO0lBRUQsS0FBSztRQUNILE1BQU0sWUFBWSxHQUFjLElBQUksU0FBUyxFQUFFLENBQUE7UUFDL0MsWUFBWSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQTtRQUN4QyxPQUFPLFlBQW9CLENBQUE7SUFDN0IsQ0FBQztJQUVELE1BQU0sQ0FBQyxHQUFHLElBQVc7UUFDbkIsT0FBTyxJQUFJLFNBQVMsQ0FBQyxHQUFHLElBQUksQ0FBUyxDQUFBO0lBQ3ZDLENBQUM7SUFFRCxNQUFNLENBQUMsRUFBVSxFQUFFLEdBQUcsSUFBVztRQUMvQixNQUFNLFlBQVksR0FBYyxJQUFBLGtCQUFhLEVBQUMsRUFBRSxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUE7UUFDMUQsT0FBTyxZQUFvQixDQUFBO0lBQzdCLENBQUM7Q0FjRjtBQTNFRCw4QkEyRUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxuICogQG1vZHVsZSBBUEktRVZNLUJhc2VUeFxuICovXG5cbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCJidWZmZXIvXCJcbmltcG9ydCBCaW5Ub29scyBmcm9tIFwiLi4vLi4vdXRpbHMvYmludG9vbHNcIlxuaW1wb3J0IHsgS2V5Q2hhaW4sIEtleVBhaXIgfSBmcm9tIFwiLi9rZXljaGFpblwiXG5pbXBvcnQgeyBFVk1TdGFuZGFyZEJhc2VUeCB9IGZyb20gXCIuLi8uLi9jb21tb24vZXZtdHhcIlxuaW1wb3J0IHsgQ3JlZGVudGlhbCB9IGZyb20gXCIuLi8uLi9jb21tb24vY3JlZGVudGlhbHNcIlxuaW1wb3J0IHsgRGVmYXVsdE5ldHdvcmtJRCB9IGZyb20gXCIuLi8uLi91dGlscy9jb25zdGFudHNcIlxuaW1wb3J0IHsgU2VsZWN0VHhDbGFzcyB9IGZyb20gXCIuL3R4XCJcbmltcG9ydCB7IFNlcmlhbGl6ZWRFbmNvZGluZyB9IGZyb20gXCIuLi8uLi91dGlscy9zZXJpYWxpemF0aW9uXCJcblxuLyoqXG4gKiBAaWdub3JlXG4gKi9cbmNvbnN0IGJpbnRvb2xzOiBCaW5Ub29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKClcblxuLyoqXG4gKiBDbGFzcyByZXByZXNlbnRpbmcgYSBiYXNlIGZvciBhbGwgdHJhbnNhY3Rpb25zLlxuICovXG5leHBvcnQgY2xhc3MgRVZNQmFzZVR4IGV4dGVuZHMgRVZNU3RhbmRhcmRCYXNlVHg8S2V5UGFpciwgS2V5Q2hhaW4+IHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiQmFzZVR4XCJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcblxuICAvL3NlcmlhbGl6ZSBpcyBpbmhlcml0ZWRcblxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGlkIG9mIHRoZSBbW0Jhc2VUeF1dXG4gICAqL1xuICBnZXRUeFR5cGUoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdHlwZUlEXG4gIH1cblxuICAvKipcbiAgICogVGFrZXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBjb250YWluaW5nIGFuIFtbQmFzZVR4XV0sIHBhcnNlcyBpdCwgcG9wdWxhdGVzIHRoZSBjbGFzcywgYW5kIHJldHVybnMgdGhlIGxlbmd0aCBvZiB0aGUgQmFzZVR4IGluIGJ5dGVzLlxuICAgKlxuICAgKiBAcGFyYW0gYnl0ZXMgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBjb250YWluaW5nIGEgcmF3IFtbQmFzZVR4XV1cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGxlbmd0aCBvZiB0aGUgcmF3IFtbQmFzZVR4XV1cbiAgICpcbiAgICogQHJlbWFya3MgYXNzdW1lIG5vdC1jaGVja3N1bW1lZFxuICAgKi9cbiAgZnJvbUJ1ZmZlcihieXRlczogQnVmZmVyLCBvZmZzZXQ6IG51bWJlciA9IDApOiBudW1iZXIge1xuICAgIHRoaXMubmV0d29ya0lEID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNClcbiAgICBvZmZzZXQgKz0gNFxuICAgIHRoaXMuYmxvY2tjaGFpbklEID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgMzIpXG4gICAgb2Zmc2V0ICs9IDMyXG4gICAgcmV0dXJuIG9mZnNldFxuICB9XG5cbiAgLyoqXG4gICAqIFRha2VzIHRoZSBieXRlcyBvZiBhbiBbW1Vuc2lnbmVkVHhdXSBhbmQgcmV0dXJucyBhbiBhcnJheSBvZiBbW0NyZWRlbnRpYWxdXXNcbiAgICpcbiAgICogQHBhcmFtIG1zZyBBIEJ1ZmZlciBmb3IgdGhlIFtbVW5zaWduZWRUeF1dXG4gICAqIEBwYXJhbSBrYyBBbiBbW0tleUNoYWluXV0gdXNlZCBpbiBzaWduaW5nXG4gICAqXG4gICAqIEByZXR1cm5zIEFuIGFycmF5IG9mIFtbQ3JlZGVudGlhbF1dc1xuICAgKi9cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby11bnVzZWQtdmFyc1xuICBzaWduKG1zZzogQnVmZmVyLCBrYzogS2V5Q2hhaW4pOiBDcmVkZW50aWFsW10ge1xuICAgIGNvbnN0IGNyZWRzOiBDcmVkZW50aWFsW10gPSBbXVxuICAgIHJldHVybiBjcmVkc1xuICB9XG5cbiAgY2xvbmUoKTogdGhpcyB7XG4gICAgY29uc3QgbmV3RVZNQmFzZVR4OiBFVk1CYXNlVHggPSBuZXcgRVZNQmFzZVR4KClcbiAgICBuZXdFVk1CYXNlVHguZnJvbUJ1ZmZlcih0aGlzLnRvQnVmZmVyKCkpXG4gICAgcmV0dXJuIG5ld0VWTUJhc2VUeCBhcyB0aGlzXG4gIH1cblxuICBjcmVhdGUoLi4uYXJnczogYW55W10pOiB0aGlzIHtcbiAgICByZXR1cm4gbmV3IEVWTUJhc2VUeCguLi5hcmdzKSBhcyB0aGlzXG4gIH1cblxuICBzZWxlY3QoaWQ6IG51bWJlciwgLi4uYXJnczogYW55W10pOiB0aGlzIHtcbiAgICBjb25zdCBuZXdFVk1CYXNlVHg6IEVWTUJhc2VUeCA9IFNlbGVjdFR4Q2xhc3MoaWQsIC4uLmFyZ3MpXG4gICAgcmV0dXJuIG5ld0VWTUJhc2VUeCBhcyB0aGlzXG4gIH1cblxuICAvKipcbiAgICogQ2xhc3MgcmVwcmVzZW50aW5nIGFuIEVWTUJhc2VUeCB3aGljaCBpcyB0aGUgZm91bmRhdGlvbiBmb3IgYWxsIEVWTSB0cmFuc2FjdGlvbnMuXG4gICAqXG4gICAqIEBwYXJhbSBuZXR3b3JrSUQgT3B0aW9uYWwgbmV0d29ya0lELCBbW0RlZmF1bHROZXR3b3JrSURdXVxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbklEIE9wdGlvbmFsIGJsb2NrY2hhaW5JRCwgZGVmYXVsdCBCdWZmZXIuYWxsb2MoMzIsIDE2KVxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgbmV0d29ya0lEOiBudW1iZXIgPSBEZWZhdWx0TmV0d29ya0lELFxuICAgIGJsb2NrY2hhaW5JRDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDMyLCAxNilcbiAgKSB7XG4gICAgc3VwZXIobmV0d29ya0lELCBibG9ja2NoYWluSUQpXG4gIH1cbn1cbiJdfQ==