"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseTx = void 0;
/**
 * @packageDocumentation
 * @module API-PlatformVM-BaseTx
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const outputs_1 = require("./outputs");
const inputs_1 = require("./inputs");
const credentials_1 = require("./credentials");
const common_1 = require("../../common");
const constants_2 = require("../../utils/constants");
const tx_1 = require("../platformvm/tx");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
/**
 * Class representing a base for all transactions.
 */
class BaseTx extends common_1.StandardBaseTx {
    /**
     * Class representing a BaseTx which is the foundation for all transactions.
     *
     * @param networkID Optional networkID, [[DefaultNetworkID]]
     * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
     * @param outs Optional array of the [[TransferableOutput]]s
     * @param ins Optional array of the [[TransferableInput]]s
     * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
     */
    constructor(networkID = constants_2.DefaultNetworkID, blockchainID = buffer_1.Buffer.alloc(32, 16), outs = undefined, ins = undefined, memo = undefined) {
        super(networkID, blockchainID, outs, ins, memo);
        this._typeName = "BaseTx";
        this._typeID = constants_1.PlatformVMConstants.CREATESUBNETTX;
        this._outputOwners = undefined;
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.outs = fields["outs"].map((o) => {
            let newOut = new outputs_1.TransferableOutput();
            newOut.deserialize(o, encoding);
            return newOut;
        });
        this.ins = fields["ins"].map((i) => {
            let newIn = new inputs_1.TransferableInput();
            newIn.deserialize(i, encoding);
            return newIn;
        });
        this.numouts = buffer_1.Buffer.alloc(4);
        this.numouts.writeUInt32BE(this.outs.length, 0);
        this.numins = buffer_1.Buffer.alloc(4);
        this.numins.writeUInt32BE(this.ins.length, 0);
    }
    getOuts() {
        return this.outs;
    }
    getIns() {
        return this.ins;
    }
    getTotalOuts() {
        return this.getOuts();
    }
    /**
     * Returns the id of the [[BaseTx]]
     */
    getTxType() {
        return constants_1.PlatformVMConstants.BASETX;
    }
    /**
     * @returns The outputOwners of inputs, one per input
     */
    getOutputOwners() {
        if (this._outputOwners) {
            return [...this._outputOwners];
        }
        return [];
    }
    /**
     * @params The outputOwners of inputs, one per input
     */
    setOutputOwners(owners) {
        this._outputOwners = [...owners];
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
        this.numouts = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        const outcount = this.numouts.readUInt32BE(0);
        this.outs = [];
        for (let i = 0; i < outcount; i++) {
            const xferout = new outputs_1.TransferableOutput();
            offset = xferout.fromBuffer(bytes, offset);
            this.outs.push(xferout);
        }
        this.numins = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        const incount = this.numins.readUInt32BE(0);
        this.ins = [];
        for (let i = 0; i < incount; i++) {
            const xferin = new inputs_1.TransferableInput();
            offset = xferin.fromBuffer(bytes, offset);
            this.ins.push(xferin);
        }
        let memolen = bintools
            .copyFrom(bytes, offset, offset + 4)
            .readUInt32BE(0);
        offset += 4;
        this.memo = bintools.copyFrom(bytes, offset, offset + memolen);
        offset += memolen;
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
    sign(msg, kc) {
        const creds = [];
        for (let i = 0; i < this.ins.length; i++) {
            const cred = (0, credentials_1.SelectCredentialClass)(this.ins[`${i}`].getInput().getCredentialID());
            const sigidxs = this.ins[`${i}`].getInput().getSigIdxs();
            for (let j = 0; j < sigidxs.length; j++) {
                const keypair = kc.getKey(sigidxs[`${j}`].getSource());
                const signval = keypair.sign(msg);
                const sig = new common_1.Signature();
                sig.fromBuffer(signval);
                cred.addSignature(sig);
            }
            creds.push(cred);
        }
        return creds;
    }
    clone() {
        let newbase = new BaseTx();
        newbase.fromBuffer(this.toBuffer());
        return newbase;
    }
    create(...args) {
        return new BaseTx(...args);
    }
    select(id, ...args) {
        let newbasetx = (0, tx_1.SelectTxClass)(id, ...args);
        return newbasetx;
    }
}
exports.BaseTx = BaseTx;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZXR4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvcGxhdGZvcm12bS9iYXNldHgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7OztHQUdHO0FBQ0gsb0NBQWdDO0FBQ2hDLG9FQUEyQztBQUMzQywyQ0FBaUQ7QUFDakQsdUNBQThDO0FBQzlDLHFDQUE0QztBQUM1QywrQ0FBcUQ7QUFDckQseUNBUXFCO0FBQ3JCLHFEQUF3RDtBQUN4RCx5Q0FBZ0Q7QUFJaEQ7O0dBRUc7QUFDSCxNQUFNLFFBQVEsR0FBYSxrQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBRWpEOztHQUVHO0FBQ0gsTUFBYSxNQUFPLFNBQVEsdUJBQTZDO0lBK0l2RTs7Ozs7Ozs7T0FRRztJQUNILFlBQ0UsWUFBb0IsNEJBQWdCLEVBQ3BDLGVBQXVCLGVBQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUMzQyxPQUE2QixTQUFTLEVBQ3RDLE1BQTJCLFNBQVMsRUFDcEMsT0FBZSxTQUFTO1FBRXhCLEtBQUssQ0FBQyxTQUFTLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUE7UUE5SnZDLGNBQVMsR0FBRyxRQUFRLENBQUE7UUFDcEIsWUFBTyxHQUFHLCtCQUFtQixDQUFDLGNBQWMsQ0FBQTtRQUM1QyxrQkFBYSxHQUFtQixTQUFTLENBQUE7SUE2Sm5ELENBQUM7SUEzSkQsV0FBVyxDQUFDLE1BQWMsRUFBRSxXQUErQixLQUFLO1FBQzlELEtBQUssQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFBO1FBQ25DLElBQUksQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQXFCLEVBQUUsRUFBRTtZQUN2RCxJQUFJLE1BQU0sR0FBdUIsSUFBSSw0QkFBa0IsRUFBRSxDQUFBO1lBQ3pELE1B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O1FBQy9CLElBQUksU0FBUyxHQUFXLElBQUEsa0JBQWEsRUFBQyxFQUFFLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQTtRQUNsRCxPQUFPLFNBQWlCLENBQUE7SUFDMUIsQ0FBQztDQW9CRjtBQWpLRCx3QkFpS0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxuICogQG1vZHVsZSBBUEktUGxhdGZvcm1WTS1CYXNlVHhcbiAqL1xuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcImJ1ZmZlci9cIlxuaW1wb3J0IEJpblRvb2xzIGZyb20gXCIuLi8uLi91dGlscy9iaW50b29sc1wiXG5pbXBvcnQgeyBQbGF0Zm9ybVZNQ29uc3RhbnRzIH0gZnJvbSBcIi4vY29uc3RhbnRzXCJcbmltcG9ydCB7IFRyYW5zZmVyYWJsZU91dHB1dCB9IGZyb20gXCIuL291dHB1dHNcIlxuaW1wb3J0IHsgVHJhbnNmZXJhYmxlSW5wdXQgfSBmcm9tIFwiLi9pbnB1dHNcIlxuaW1wb3J0IHsgU2VsZWN0Q3JlZGVudGlhbENsYXNzIH0gZnJvbSBcIi4vY3JlZGVudGlhbHNcIlxuaW1wb3J0IHtcbiAgU2lnbmVyS2V5Q2hhaW4sXG4gIFNpZ25lcktleVBhaXIsXG4gIFN0YW5kYXJkQmFzZVR4LFxuICBTaWduYXR1cmUsXG4gIFNpZ0lkeCxcbiAgQ3JlZGVudGlhbCxcbiAgT3V0cHV0T3duZXJzXG59IGZyb20gXCIuLi8uLi9jb21tb25cIlxuaW1wb3J0IHsgRGVmYXVsdE5ldHdvcmtJRCB9IGZyb20gXCIuLi8uLi91dGlscy9jb25zdGFudHNcIlxuaW1wb3J0IHsgU2VsZWN0VHhDbGFzcyB9IGZyb20gXCIuLi9wbGF0Zm9ybXZtL3R4XCJcbmltcG9ydCB7IFNlcmlhbGl6ZWRFbmNvZGluZyB9IGZyb20gXCIuLi8uLi91dGlscy9zZXJpYWxpemF0aW9uXCJcbmltcG9ydCB7fSBmcm9tIFwiY2FtaW5vanMvY29tbW9uXCJcblxuLyoqXG4gKiBAaWdub3JlXG4gKi9cbmNvbnN0IGJpbnRvb2xzOiBCaW5Ub29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKClcblxuLyoqXG4gKiBDbGFzcyByZXByZXNlbnRpbmcgYSBiYXNlIGZvciBhbGwgdHJhbnNhY3Rpb25zLlxuICovXG5leHBvcnQgY2xhc3MgQmFzZVR4IGV4dGVuZHMgU3RhbmRhcmRCYXNlVHg8U2lnbmVyS2V5UGFpciwgU2lnbmVyS2V5Q2hhaW4+IHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiQmFzZVR4XCJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSBQbGF0Zm9ybVZNQ29uc3RhbnRzLkNSRUFURVNVQk5FVFRYXG4gIHByb3RlY3RlZCBfb3V0cHV0T3duZXJzOiBPdXRwdXRPd25lcnNbXSA9IHVuZGVmaW5lZFxuXG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpXG4gICAgdGhpcy5vdXRzID0gZmllbGRzW1wib3V0c1wiXS5tYXAoKG86IFRyYW5zZmVyYWJsZU91dHB1dCkgPT4ge1xuICAgICAgbGV0IG5ld091dDogVHJhbnNmZXJhYmxlT3V0cHV0ID0gbmV3IFRyYW5zZmVyYWJsZU91dHB1dCgpXG4gICAgICBuZXdPdXQuZGVzZXJpYWxpemUobywgZW5jb2RpbmcpXG4gICAgICByZXR1cm4gbmV3T3V0XG4gICAgfSlcbiAgICB0aGlzLmlucyA9IGZpZWxkc1tcImluc1wiXS5tYXAoKGk6IFRyYW5zZmVyYWJsZUlucHV0KSA9PiB7XG4gICAgICBsZXQgbmV3SW46IFRyYW5zZmVyYWJsZUlucHV0ID0gbmV3IFRyYW5zZmVyYWJsZUlucHV0KClcbiAgICAgIG5ld0luLmRlc2VyaWFsaXplKGksIGVuY29kaW5nKVxuICAgICAgcmV0dXJuIG5ld0luXG4gICAgfSlcbiAgICB0aGlzLm51bW91dHMgPSBCdWZmZXIuYWxsb2MoNClcbiAgICB0aGlzLm51bW91dHMud3JpdGVVSW50MzJCRSh0aGlzLm91dHMubGVuZ3RoLCAwKVxuICAgIHRoaXMubnVtaW5zID0gQnVmZmVyLmFsbG9jKDQpXG4gICAgdGhpcy5udW1pbnMud3JpdGVVSW50MzJCRSh0aGlzLmlucy5sZW5ndGgsIDApXG4gIH1cblxuICBnZXRPdXRzKCk6IFRyYW5zZmVyYWJsZU91dHB1dFtdIHtcbiAgICByZXR1cm4gdGhpcy5vdXRzIGFzIFRyYW5zZmVyYWJsZU91dHB1dFtdXG4gIH1cblxuICBnZXRJbnMoKTogVHJhbnNmZXJhYmxlSW5wdXRbXSB7XG4gICAgcmV0dXJuIHRoaXMuaW5zIGFzIFRyYW5zZmVyYWJsZUlucHV0W11cbiAgfVxuXG4gIGdldFRvdGFsT3V0cygpOiBUcmFuc2ZlcmFibGVPdXRwdXRbXSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0T3V0cygpIGFzIFRyYW5zZmVyYWJsZU91dHB1dFtdXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgaWQgb2YgdGhlIFtbQmFzZVR4XV1cbiAgICovXG4gIGdldFR4VHlwZSgpOiBudW1iZXIge1xuICAgIHJldHVybiBQbGF0Zm9ybVZNQ29uc3RhbnRzLkJBU0VUWFxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIFRoZSBvdXRwdXRPd25lcnMgb2YgaW5wdXRzLCBvbmUgcGVyIGlucHV0XG4gICAqL1xuICBnZXRPdXRwdXRPd25lcnMoKTogT3V0cHV0T3duZXJzW10ge1xuICAgIGlmICh0aGlzLl9vdXRwdXRPd25lcnMpIHtcbiAgICAgIHJldHVybiBbLi4udGhpcy5fb3V0cHV0T3duZXJzXVxuICAgIH1cbiAgICByZXR1cm4gW11cbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW1zIFRoZSBvdXRwdXRPd25lcnMgb2YgaW5wdXRzLCBvbmUgcGVyIGlucHV0XG4gICAqL1xuICBzZXRPdXRwdXRPd25lcnMob3duZXJzOiBPdXRwdXRPd25lcnNbXSkge1xuICAgIHRoaXMuX291dHB1dE93bmVycyA9IFsuLi5vd25lcnNdXG4gIH1cblxuICAvKipcbiAgICogVGFrZXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBjb250YWluaW5nIGFuIFtbQmFzZVR4XV0sIHBhcnNlcyBpdCwgcG9wdWxhdGVzIHRoZSBjbGFzcywgYW5kIHJldHVybnMgdGhlIGxlbmd0aCBvZiB0aGUgQmFzZVR4IGluIGJ5dGVzLlxuICAgKlxuICAgKiBAcGFyYW0gYnl0ZXMgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBjb250YWluaW5nIGEgcmF3IFtbQmFzZVR4XV1cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGxlbmd0aCBvZiB0aGUgcmF3IFtbQmFzZVR4XV1cbiAgICpcbiAgICogQHJlbWFya3MgYXNzdW1lIG5vdC1jaGVja3N1bW1lZFxuICAgKi9cbiAgZnJvbUJ1ZmZlcihieXRlczogQnVmZmVyLCBvZmZzZXQ6IG51bWJlciA9IDApOiBudW1iZXIge1xuICAgIHRoaXMubmV0d29ya0lEID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNClcbiAgICBvZmZzZXQgKz0gNFxuICAgIHRoaXMuYmxvY2tjaGFpbklEID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgMzIpXG4gICAgb2Zmc2V0ICs9IDMyXG4gICAgdGhpcy5udW1vdXRzID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNClcbiAgICBvZmZzZXQgKz0gNFxuICAgIGNvbnN0IG91dGNvdW50OiBudW1iZXIgPSB0aGlzLm51bW91dHMucmVhZFVJbnQzMkJFKDApXG4gICAgdGhpcy5vdXRzID0gW11cbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgb3V0Y291bnQ7IGkrKykge1xuICAgICAgY29uc3QgeGZlcm91dDogVHJhbnNmZXJhYmxlT3V0cHV0ID0gbmV3IFRyYW5zZmVyYWJsZU91dHB1dCgpXG4gICAgICBvZmZzZXQgPSB4ZmVyb3V0LmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldClcbiAgICAgIHRoaXMub3V0cy5wdXNoKHhmZXJvdXQpXG4gICAgfVxuXG4gICAgdGhpcy5udW1pbnMgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KVxuICAgIG9mZnNldCArPSA0XG4gICAgY29uc3QgaW5jb3VudDogbnVtYmVyID0gdGhpcy5udW1pbnMucmVhZFVJbnQzMkJFKDApXG4gICAgdGhpcy5pbnMgPSBbXVxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBpbmNvdW50OyBpKyspIHtcbiAgICAgIGNvbnN0IHhmZXJpbjogVHJhbnNmZXJhYmxlSW5wdXQgPSBuZXcgVHJhbnNmZXJhYmxlSW5wdXQoKVxuICAgICAgb2Zmc2V0ID0geGZlcmluLmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldClcbiAgICAgIHRoaXMuaW5zLnB1c2goeGZlcmluKVxuICAgIH1cbiAgICBsZXQgbWVtb2xlbjogbnVtYmVyID0gYmludG9vbHNcbiAgICAgIC5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KVxuICAgICAgLnJlYWRVSW50MzJCRSgwKVxuICAgIG9mZnNldCArPSA0XG4gICAgdGhpcy5tZW1vID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgbWVtb2xlbilcbiAgICBvZmZzZXQgKz0gbWVtb2xlblxuICAgIHJldHVybiBvZmZzZXRcbiAgfVxuXG4gIC8qKlxuICAgKiBUYWtlcyB0aGUgYnl0ZXMgb2YgYW4gW1tVbnNpZ25lZFR4XV0gYW5kIHJldHVybnMgYW4gYXJyYXkgb2YgW1tDcmVkZW50aWFsXV1zXG4gICAqXG4gICAqIEBwYXJhbSBtc2cgQSBCdWZmZXIgZm9yIHRoZSBbW1Vuc2lnbmVkVHhdXVxuICAgKiBAcGFyYW0ga2MgQW4gW1tLZXlDaGFpbl1dIHVzZWQgaW4gc2lnbmluZ1xuICAgKlxuICAgKiBAcmV0dXJucyBBbiBhcnJheSBvZiBbW0NyZWRlbnRpYWxdXXNcbiAgICovXG4gIHNpZ24obXNnOiBCdWZmZXIsIGtjOiBTaWduZXJLZXlDaGFpbik6IENyZWRlbnRpYWxbXSB7XG4gICAgY29uc3QgY3JlZHM6IENyZWRlbnRpYWxbXSA9IFtdXG4gICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IHRoaXMuaW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBjcmVkOiBDcmVkZW50aWFsID0gU2VsZWN0Q3JlZGVudGlhbENsYXNzKFxuICAgICAgICB0aGlzLmluc1tgJHtpfWBdLmdldElucHV0KCkuZ2V0Q3JlZGVudGlhbElEKClcbiAgICAgIClcbiAgICAgIGNvbnN0IHNpZ2lkeHM6IFNpZ0lkeFtdID0gdGhpcy5pbnNbYCR7aX1gXS5nZXRJbnB1dCgpLmdldFNpZ0lkeHMoKVxuICAgICAgZm9yIChsZXQgajogbnVtYmVyID0gMDsgaiA8IHNpZ2lkeHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgY29uc3Qga2V5cGFpcjogU2lnbmVyS2V5UGFpciA9IGtjLmdldEtleShzaWdpZHhzW2Ake2p9YF0uZ2V0U291cmNlKCkpXG4gICAgICAgIGNvbnN0IHNpZ252YWw6IEJ1ZmZlciA9IGtleXBhaXIuc2lnbihtc2cpXG4gICAgICAgIGNvbnN0IHNpZzogU2lnbmF0dXJlID0gbmV3IFNpZ25hdHVyZSgpXG4gICAgICAgIHNpZy5mcm9tQnVmZmVyKHNpZ252YWwpXG4gICAgICAgIGNyZWQuYWRkU2lnbmF0dXJlKHNpZylcbiAgICAgIH1cbiAgICAgIGNyZWRzLnB1c2goY3JlZClcbiAgICB9XG4gICAgcmV0dXJuIGNyZWRzXG4gIH1cblxuICBjbG9uZSgpOiB0aGlzIHtcbiAgICBsZXQgbmV3YmFzZTogQmFzZVR4ID0gbmV3IEJhc2VUeCgpXG4gICAgbmV3YmFzZS5mcm9tQnVmZmVyKHRoaXMudG9CdWZmZXIoKSlcbiAgICByZXR1cm4gbmV3YmFzZSBhcyB0aGlzXG4gIH1cblxuICBjcmVhdGUoLi4uYXJnczogYW55W10pOiB0aGlzIHtcbiAgICByZXR1cm4gbmV3IEJhc2VUeCguLi5hcmdzKSBhcyB0aGlzXG4gIH1cblxuICBzZWxlY3QoaWQ6IG51bWJlciwgLi4uYXJnczogYW55W10pOiB0aGlzIHtcbiAgICBsZXQgbmV3YmFzZXR4OiBCYXNlVHggPSBTZWxlY3RUeENsYXNzKGlkLCAuLi5hcmdzKVxuICAgIHJldHVybiBuZXdiYXNldHggYXMgdGhpc1xuICB9XG5cbiAgLyoqXG4gICAqIENsYXNzIHJlcHJlc2VudGluZyBhIEJhc2VUeCB3aGljaCBpcyB0aGUgZm91bmRhdGlvbiBmb3IgYWxsIHRyYW5zYWN0aW9ucy5cbiAgICpcbiAgICogQHBhcmFtIG5ldHdvcmtJRCBPcHRpb25hbCBuZXR3b3JrSUQsIFtbRGVmYXVsdE5ldHdvcmtJRF1dXG4gICAqIEBwYXJhbSBibG9ja2NoYWluSUQgT3B0aW9uYWwgYmxvY2tjaGFpbklELCBkZWZhdWx0IEJ1ZmZlci5hbGxvYygzMiwgMTYpXG4gICAqIEBwYXJhbSBvdXRzIE9wdGlvbmFsIGFycmF5IG9mIHRoZSBbW1RyYW5zZmVyYWJsZU91dHB1dF1dc1xuICAgKiBAcGFyYW0gaW5zIE9wdGlvbmFsIGFycmF5IG9mIHRoZSBbW1RyYW5zZmVyYWJsZUlucHV0XV1zXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgbWVtbyBmaWVsZFxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgbmV0d29ya0lEOiBudW1iZXIgPSBEZWZhdWx0TmV0d29ya0lELFxuICAgIGJsb2NrY2hhaW5JRDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDMyLCAxNiksXG4gICAgb3V0czogVHJhbnNmZXJhYmxlT3V0cHV0W10gPSB1bmRlZmluZWQsXG4gICAgaW5zOiBUcmFuc2ZlcmFibGVJbnB1dFtdID0gdW5kZWZpbmVkLFxuICAgIG1lbW86IEJ1ZmZlciA9IHVuZGVmaW5lZFxuICApIHtcbiAgICBzdXBlcihuZXR3b3JrSUQsIGJsb2NrY2hhaW5JRCwgb3V0cywgaW5zLCBtZW1vKVxuICB9XG59XG4iXX0=