"use strict";
/**
 * @packageDocumentation
 * @module API-EVM-ImportTx
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportTx = void 0;
const buffer_1 = require("buffer/");
const bn_js_1 = __importDefault(require("bn.js"));
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const outputs_1 = require("./outputs");
const inputs_1 = require("./inputs");
const basetx_1 = require("./basetx");
const credentials_1 = require("./credentials");
const credentials_2 = require("../../common/credentials");
const input_1 = require("../../common/input");
const constants_2 = require("../../utils/constants");
const errors_1 = require("../../utils/errors");
const networks_1 = __importDefault(require("../../utils/networks"));
const serialization_1 = require("../../utils/serialization");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serializer = serialization_1.Serialization.getInstance();
/**
 * Class representing an unsigned Import transaction.
 */
class ImportTx extends basetx_1.EVMBaseTx {
    /**
     * Class representing an unsigned Import transaction.
     *
     * @param networkID Optional networkID, [[DefaultNetworkID]]
     * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
     * @param sourceChainID Optional chainID for the source inputs to import. Default Buffer.alloc(32, 16)
     * @param importIns Optional array of [[TransferableInput]]s used in the transaction
     * @param outs Optional array of the [[EVMOutput]]s
     * @param fee Optional the fee as a BN
     */
    constructor(networkID = constants_2.DefaultNetworkID, blockchainID = buffer_1.Buffer.alloc(32, 16), sourceChainID = buffer_1.Buffer.alloc(32, 16), importIns = undefined, outs = undefined, fee = new bn_js_1.default(0)) {
        super(networkID, blockchainID);
        this._typeName = "ImportTx";
        this._typeID = constants_1.EVMConstants.IMPORTTX;
        this.sourceChain = buffer_1.Buffer.alloc(32);
        this.numIns = buffer_1.Buffer.alloc(4);
        this.importIns = [];
        this.numOuts = buffer_1.Buffer.alloc(4);
        this.outs = [];
        this.sourceChain = sourceChainID;
        let inputsPassed = false;
        let outputsPassed = false;
        if (typeof importIns !== "undefined" &&
            Array.isArray(importIns) &&
            importIns.length > 0) {
            importIns.forEach((importIn) => {
                if (!(importIn instanceof inputs_1.TransferableInput)) {
                    throw new errors_1.TransferableInputError("Error - ImportTx.constructor: invalid TransferableInput in array parameter 'importIns'");
                }
            });
            inputsPassed = true;
            this.importIns = importIns;
        }
        if (typeof outs !== "undefined" && Array.isArray(outs) && outs.length > 0) {
            outs.forEach((out) => {
                if (!(out instanceof outputs_1.EVMOutput)) {
                    throw new errors_1.EVMOutputError("Error - ImportTx.constructor: invalid EVMOutput in array parameter 'outs'");
                }
            });
            if (outs.length > 1) {
                outs = outs.sort(outputs_1.EVMOutput.comparator());
            }
            outputsPassed = true;
            this.outs = outs;
        }
        if (inputsPassed && outputsPassed) {
            this.validateOuts(fee);
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { sourceChain: serializer.encoder(this.sourceChain, encoding, "Buffer", "cb58"), importIns: this.importIns.map((i) => i.serialize(encoding)) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.sourceChain = serializer.decoder(fields["sourceChain"], encoding, "cb58", "Buffer", 32);
        this.importIns = fields["importIns"].map((i) => {
            let ii = new inputs_1.TransferableInput();
            ii.deserialize(i, encoding);
            return ii;
        });
        this.numIns = buffer_1.Buffer.alloc(4);
        this.numIns.writeUInt32BE(this.importIns.length, 0);
    }
    /**
     * Returns the id of the [[ImportTx]]
     */
    getTxType() {
        return this._typeID;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} for the source chainid.
     */
    getSourceChain() {
        return this.sourceChain;
    }
    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[ImportTx]], parses it,
     * populates the class, and returns the length of the [[ImportTx]] in bytes.
     *
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[ImportTx]]
     * @param offset A number representing the byte offset. Defaults to 0.
     *
     * @returns The length of the raw [[ImportTx]]
     *
     * @remarks assume not-checksummed
     */
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        this.sourceChain = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        this.numIns = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        const numIns = this.numIns.readUInt32BE(0);
        for (let i = 0; i < numIns; i++) {
            const anIn = new inputs_1.TransferableInput();
            offset = anIn.fromBuffer(bytes, offset);
            this.importIns.push(anIn);
        }
        this.numOuts = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        const numOuts = this.numOuts.readUInt32BE(0);
        for (let i = 0; i < numOuts; i++) {
            const anOut = new outputs_1.EVMOutput();
            offset = anOut.fromBuffer(bytes, offset);
            this.outs.push(anOut);
        }
        return offset;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[ImportTx]].
     */
    toBuffer() {
        if (typeof this.sourceChain === "undefined") {
            throw new errors_1.ChainIdError("ImportTx.toBuffer -- this.sourceChain is undefined");
        }
        this.numIns.writeUInt32BE(this.importIns.length, 0);
        this.numOuts.writeUInt32BE(this.outs.length, 0);
        let barr = [super.toBuffer(), this.sourceChain, this.numIns];
        let bsize = super.toBuffer().length + this.sourceChain.length + this.numIns.length;
        this.importIns = this.importIns.sort(inputs_1.TransferableInput.comparator());
        this.importIns.forEach((importIn) => {
            bsize += importIn.toBuffer().length;
            barr.push(importIn.toBuffer());
        });
        bsize += this.numOuts.length;
        barr.push(this.numOuts);
        this.outs.forEach((out) => {
            bsize += out.toBuffer().length;
            barr.push(out.toBuffer());
        });
        return buffer_1.Buffer.concat(barr, bsize);
    }
    /**
     * Returns an array of [[TransferableInput]]s in this transaction.
     */
    getImportInputs() {
        return this.importIns;
    }
    /**
     * Returns an array of [[EVMOutput]]s in this transaction.
     */
    getOuts() {
        return this.outs;
    }
    clone() {
        let newImportTx = new ImportTx();
        newImportTx.fromBuffer(this.toBuffer());
        return newImportTx;
    }
    create(...args) {
        return new ImportTx(...args);
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
        const creds = super.sign(msg, kc);
        this.importIns.forEach((importIn) => {
            const cred = (0, credentials_1.SelectCredentialClass)(importIn.getInput().getCredentialID());
            const sigidxs = importIn.getInput().getSigIdxs();
            sigidxs.forEach((sigidx) => {
                const keypair = kc.getKey(sigidx.getSource());
                const signval = keypair.sign(msg);
                const sig = new credentials_2.Signature();
                sig.fromBuffer(signval);
                cred.addSignature(sig);
            });
            creds.push(cred);
        });
        return creds;
    }
    validateOuts(fee) {
        // This Map enforces uniqueness of pair(address, assetId) for each EVMOutput.
        // For each imported assetID, each ETH-style C-Chain address can
        // have exactly 1 EVMOutput.
        // Map(2) {
        //   '0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC' => [
        //     'FvwEAhmxKfeiG8SnEvq42hc6whRyY3EFYAvebMqDNDGCgxN5Z',
        //     'F4MyJcUvq3Rxbqgd4Zs8sUpvwLHApyrp4yxJXe2bAV86Vvp38'
        //   ],
        //   '0xecC3B2968B277b837a81A7181e0b94EB1Ca54EdE' => [
        //     'FvwEAhmxKfeiG8SnEvq42hc6whRyY3EFYAvebMqDNDGCgxN5Z',
        //     '2Df96yHyhNc3vooieNNhyKwrjEfTsV2ReMo5FKjMpr8vwN4Jqy',
        //     'SfSXBzDb9GZ9R2uH61qZKe8nxQHW9KERW9Kq9WRe4vHJZRN3e'
        //   ]
        // }
        const seenAssetSends = new Map();
        this.outs.forEach((evmOutput) => {
            const address = evmOutput.getAddressString();
            const assetId = bintools.cb58Encode(evmOutput.getAssetID());
            if (seenAssetSends.has(address)) {
                const assetsSentToAddress = seenAssetSends.get(address);
                if (assetsSentToAddress.includes(assetId)) {
                    const errorMessage = `Error - ImportTx: duplicate (address, assetId) pair found in outputs: (0x${address}, ${assetId})`;
                    throw new errors_1.EVMOutputError(errorMessage);
                }
                assetsSentToAddress.push(assetId);
            }
            else {
                seenAssetSends.set(address, [assetId]);
            }
        });
        // make sure this transaction pays the required avax fee
        const selectedNetwork = this.getNetworkID();
        const feeDiff = new bn_js_1.default(0);
        const avaxAssetID = networks_1.default.getNetwork(selectedNetwork).X.avaxAssetID;
        // sum incoming AVAX
        this.importIns.forEach((input) => {
            // only check StandardAmountInputs
            if (input.getInput() instanceof input_1.StandardAmountInput &&
                avaxAssetID === bintools.cb58Encode(input.getAssetID())) {
                const ui = input.getInput();
                const i = ui;
                feeDiff.iadd(i.getAmount());
            }
        });
        // subtract all outgoing AVAX
        this.outs.forEach((evmOutput) => {
            if (avaxAssetID === bintools.cb58Encode(evmOutput.getAssetID())) {
                feeDiff.isub(evmOutput.getAmount());
            }
        });
        if (feeDiff.lt(fee)) {
            const errorMessage = `Error - ${fee} nAVAX required for fee and only ${feeDiff} nAVAX provided`;
            throw new errors_1.EVMFeeError(errorMessage);
        }
    }
}
exports.ImportTx = ImportTx;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0dHguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9ldm0vaW1wb3J0dHgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7Ozs7O0FBRUgsb0NBQWdDO0FBQ2hDLGtEQUFzQjtBQUN0QixvRUFBMkM7QUFDM0MsMkNBQTBDO0FBQzFDLHVDQUFxQztBQUNyQyxxQ0FBNEM7QUFDNUMscUNBQW9DO0FBQ3BDLCtDQUFxRDtBQUNyRCwwREFBd0U7QUFDeEUsOENBQXdEO0FBRXhELHFEQUF3RDtBQUN4RCwrQ0FLMkI7QUFDM0Isb0VBQTJDO0FBQzNDLDZEQUE2RTtBQUU3RTs7R0FFRztBQUNILE1BQU0sUUFBUSxHQUFhLGtCQUFRLENBQUMsV0FBVyxFQUFFLENBQUE7QUFDakQsTUFBTSxVQUFVLEdBQWtCLDZCQUFhLENBQUMsV0FBVyxFQUFFLENBQUE7QUFFN0Q7O0dBRUc7QUFDSCxNQUFhLFFBQVMsU0FBUSxrQkFBUztJQXdLckM7Ozs7Ozs7OztPQVNHO0lBQ0gsWUFDRSxZQUFvQiw0QkFBZ0IsRUFDcEMsZUFBdUIsZUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQzNDLGdCQUF3QixlQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFDNUMsWUFBaUMsU0FBUyxFQUMxQyxPQUFvQixTQUFTLEVBQzdCLE1BQVUsSUFBSSxlQUFFLENBQUMsQ0FBQyxDQUFDO1FBRW5CLEtBQUssQ0FBQyxTQUFTLEVBQUUsWUFBWSxDQUFDLENBQUE7UUF6THRCLGNBQVMsR0FBRyxVQUFVLENBQUE7UUFDdEIsWUFBTyxHQUFHLHdCQUFZLENBQUMsUUFBUSxDQUFBO1FBaUMvQixnQkFBVyxHQUFXLGVBQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUE7UUFDdEMsV0FBTSxHQUFXLGVBQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDaEMs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VUFBVSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUE7UUFFcEQsb0JBQW9CO1FBQ3BCLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBd0IsRUFBUSxFQUFFO1lBQ3hELGtDQUFrQztZQUNsQyxJQUNFLEtBQUssQ0FBQyxRQUFRLEVBQUUsWUFBWSwyQkFBbUI7Z0JBQy9DLFdBQVcsS0FBSyxRQUFRLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsQ0FBQyxFQUN2RDtnQkFDQSxNQUFNLEVBQUUsR0FBRyxLQUFLLENBQUMsUUFBUSxFQUFhLENBQUE7Z0JBQ3RDLE1BQU0sQ0FBQyxHQUFHLEVBQXlCLENBQUE7Z0JBQ25DLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUE7YUFDNUI7UUFDSCxDQUFDLENBQUMsQ0FBQTtRQUNGLDZCQUE2QjtRQUM3QixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLFNBQW9CLEVBQVEsRUFBRTtZQUMvQyxJQUFJLFdBQVcsS0FBSyxRQUFRLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxFQUFFO2dCQUMvRCxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFBO2FBQ3BDO1FBQ0gsQ0FBQyxDQUFDLENBQUE7UUFDRixJQUFJLE9BQU8sQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDbkIsTUFBTSxZQUFZLEdBQVcsV0FBVyxHQUFHLG9DQUFvQyxPQUFPLGlCQUFpQixDQUFBO1lBQ3ZHLE1BQU0sSUFBSSxvQkFBVyxDQUFDLFlBQVksQ0FBQyxDQUFBO1NBQ3BDO0lBQ0gsQ0FBQztDQUNGO0FBM1JELDRCQTJSQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXG4gKiBAbW9kdWxlIEFQSS1FVk0tSW1wb3J0VHhcbiAqL1xuXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiYnVmZmVyL1wiXG5pbXBvcnQgQk4gZnJvbSBcImJuLmpzXCJcbmltcG9ydCBCaW5Ub29scyBmcm9tIFwiLi4vLi4vdXRpbHMvYmludG9vbHNcIlxuaW1wb3J0IHsgRVZNQ29uc3RhbnRzIH0gZnJvbSBcIi4vY29uc3RhbnRzXCJcbmltcG9ydCB7IEVWTU91dHB1dCB9IGZyb20gXCIuL291dHB1dHNcIlxuaW1wb3J0IHsgVHJhbnNmZXJhYmxlSW5wdXQgfSBmcm9tIFwiLi9pbnB1dHNcIlxuaW1wb3J0IHsgRVZNQmFzZVR4IH0gZnJvbSBcIi4vYmFzZXR4XCJcbmltcG9ydCB7IFNlbGVjdENyZWRlbnRpYWxDbGFzcyB9IGZyb20gXCIuL2NyZWRlbnRpYWxzXCJcbmltcG9ydCB7IFNpZ25hdHVyZSwgU2lnSWR4LCBDcmVkZW50aWFsIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9jcmVkZW50aWFsc1wiXG5pbXBvcnQgeyBTdGFuZGFyZEFtb3VudElucHV0IH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9pbnB1dFwiXG5pbXBvcnQgeyBLZXlDaGFpbiwgS2V5UGFpciB9IGZyb20gXCIuL2tleWNoYWluXCJcbmltcG9ydCB7IERlZmF1bHROZXR3b3JrSUQgfSBmcm9tIFwiLi4vLi4vdXRpbHMvY29uc3RhbnRzXCJcbmltcG9ydCB7XG4gIENoYWluSWRFcnJvcixcbiAgVHJhbnNmZXJhYmxlSW5wdXRFcnJvcixcbiAgRVZNT3V0cHV0RXJyb3IsXG4gIEVWTUZlZUVycm9yXG59IGZyb20gXCIuLi8uLi91dGlscy9lcnJvcnNcIlxuaW1wb3J0IE5ldHdvcmtzIGZyb20gXCIuLi8uLi91dGlscy9uZXR3b3Jrc1wiXG5pbXBvcnQgeyBTZXJpYWxpemF0aW9uLCBTZXJpYWxpemVkRW5jb2RpbmcgfSBmcm9tIFwiLi4vLi4vdXRpbHMvc2VyaWFsaXphdGlvblwiXG5cbi8qKlxuICogQGlnbm9yZVxuICovXG5jb25zdCBiaW50b29sczogQmluVG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpXG5jb25zdCBzZXJpYWxpemVyOiBTZXJpYWxpemF0aW9uID0gU2VyaWFsaXphdGlvbi5nZXRJbnN0YW5jZSgpXG5cbi8qKlxuICogQ2xhc3MgcmVwcmVzZW50aW5nIGFuIHVuc2lnbmVkIEltcG9ydCB0cmFuc2FjdGlvbi5cbiAqL1xuZXhwb3J0IGNsYXNzIEltcG9ydFR4IGV4dGVuZHMgRVZNQmFzZVR4IHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiSW1wb3J0VHhcIlxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IEVWTUNvbnN0YW50cy5JTVBPUlRUWFxuXG4gIHNlcmlhbGl6ZShlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6IG9iamVjdCB7XG4gICAgbGV0IGZpZWxkczogb2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKVxuICAgIHJldHVybiB7XG4gICAgICAuLi5maWVsZHMsXG4gICAgICBzb3VyY2VDaGFpbjogc2VyaWFsaXplci5lbmNvZGVyKFxuICAgICAgICB0aGlzLnNvdXJjZUNoYWluLFxuICAgICAgICBlbmNvZGluZyxcbiAgICAgICAgXCJCdWZmZXJcIixcbiAgICAgICAgXCJjYjU4XCJcbiAgICAgICksXG4gICAgICBpbXBvcnRJbnM6IHRoaXMuaW1wb3J0SW5zLm1hcCgoaSkgPT4gaS5zZXJpYWxpemUoZW5jb2RpbmcpKVxuICAgIH1cbiAgfVxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxuICAgIHRoaXMuc291cmNlQ2hhaW4gPSBzZXJpYWxpemVyLmRlY29kZXIoXG4gICAgICBmaWVsZHNbXCJzb3VyY2VDaGFpblwiXSxcbiAgICAgIGVuY29kaW5nLFxuICAgICAgXCJjYjU4XCIsXG4gICAgICBcIkJ1ZmZlclwiLFxuICAgICAgMzJcbiAgICApXG4gICAgdGhpcy5pbXBvcnRJbnMgPSBmaWVsZHNbXCJpbXBvcnRJbnNcIl0ubWFwKChpOiBvYmplY3QpID0+IHtcbiAgICAgIGxldCBpaTogVHJhbnNmZXJhYmxlSW5wdXQgPSBuZXcgVHJhbnNmZXJhYmxlSW5wdXQoKVxuICAgICAgaWkuZGVzZXJpYWxpemUoaSwgZW5jb2RpbmcpXG4gICAgICByZXR1cm4gaWlcbiAgICB9KVxuICAgIHRoaXMubnVtSW5zID0gQnVmZmVyLmFsbG9jKDQpXG4gICAgdGhpcy5udW1JbnMud3JpdGVVSW50MzJCRSh0aGlzLmltcG9ydElucy5sZW5ndGgsIDApXG4gIH1cblxuICBwcm90ZWN0ZWQgc291cmNlQ2hhaW46IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygzMilcbiAgcHJvdGVjdGVkIG51bUluczogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXG4gIHByb3RlY3RlZCBpbXBvcnRJbnM6IFRyYW5zZmVyYWJsZUlucHV0W10gPSBbXVxuICBwcm90ZWN0ZWQgbnVtT3V0czogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXG4gIHByb3RlY3RlZCBvdXRzOiBFVk1PdXRwdXRbXSA9IFtdXG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGlkIG9mIHRoZSBbW0ltcG9ydFR4XV1cbiAgICovXG4gIGdldFR4VHlwZSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl90eXBlSURcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gZm9yIHRoZSBzb3VyY2UgY2hhaW5pZC5cbiAgICovXG4gIGdldFNvdXJjZUNoYWluKCk6IEJ1ZmZlciB7XG4gICAgcmV0dXJuIHRoaXMuc291cmNlQ2hhaW5cbiAgfVxuXG4gIC8qKlxuICAgKiBUYWtlcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgYW4gW1tJbXBvcnRUeF1dLCBwYXJzZXMgaXQsXG4gICAqIHBvcHVsYXRlcyB0aGUgY2xhc3MsIGFuZCByZXR1cm5zIHRoZSBsZW5ndGggb2YgdGhlIFtbSW1wb3J0VHhdXSBpbiBieXRlcy5cbiAgICpcbiAgICogQHBhcmFtIGJ5dGVzIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gY29udGFpbmluZyBhIHJhdyBbW0ltcG9ydFR4XV1cbiAgICogQHBhcmFtIG9mZnNldCBBIG51bWJlciByZXByZXNlbnRpbmcgdGhlIGJ5dGUgb2Zmc2V0LiBEZWZhdWx0cyB0byAwLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbGVuZ3RoIG9mIHRoZSByYXcgW1tJbXBvcnRUeF1dXG4gICAqXG4gICAqIEByZW1hcmtzIGFzc3VtZSBub3QtY2hlY2tzdW1tZWRcbiAgICovXG4gIGZyb21CdWZmZXIoYnl0ZXM6IEJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIgPSAwKTogbnVtYmVyIHtcbiAgICBvZmZzZXQgPSBzdXBlci5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXG4gICAgdGhpcy5zb3VyY2VDaGFpbiA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDMyKVxuICAgIG9mZnNldCArPSAzMlxuICAgIHRoaXMubnVtSW5zID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNClcbiAgICBvZmZzZXQgKz0gNFxuICAgIGNvbnN0IG51bUluczogbnVtYmVyID0gdGhpcy5udW1JbnMucmVhZFVJbnQzMkJFKDApXG4gICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IG51bUluczsgaSsrKSB7XG4gICAgICBjb25zdCBhbkluOiBUcmFuc2ZlcmFibGVJbnB1dCA9IG5ldyBUcmFuc2ZlcmFibGVJbnB1dCgpXG4gICAgICBvZmZzZXQgPSBhbkluLmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldClcbiAgICAgIHRoaXMuaW1wb3J0SW5zLnB1c2goYW5JbilcbiAgICB9XG4gICAgdGhpcy5udW1PdXRzID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNClcbiAgICBvZmZzZXQgKz0gNFxuICAgIGNvbnN0IG51bU91dHM6IG51bWJlciA9IHRoaXMubnVtT3V0cy5yZWFkVUludDMyQkUoMClcbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgbnVtT3V0czsgaSsrKSB7XG4gICAgICBjb25zdCBhbk91dDogRVZNT3V0cHV0ID0gbmV3IEVWTU91dHB1dCgpXG4gICAgICBvZmZzZXQgPSBhbk91dC5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXG4gICAgICB0aGlzLm91dHMucHVzaChhbk91dClcbiAgICB9XG4gICAgcmV0dXJuIG9mZnNldFxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRhdGlvbiBvZiB0aGUgW1tJbXBvcnRUeF1dLlxuICAgKi9cbiAgdG9CdWZmZXIoKTogQnVmZmVyIHtcbiAgICBpZiAodHlwZW9mIHRoaXMuc291cmNlQ2hhaW4gPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHRocm93IG5ldyBDaGFpbklkRXJyb3IoXG4gICAgICAgIFwiSW1wb3J0VHgudG9CdWZmZXIgLS0gdGhpcy5zb3VyY2VDaGFpbiBpcyB1bmRlZmluZWRcIlxuICAgICAgKVxuICAgIH1cbiAgICB0aGlzLm51bUlucy53cml0ZVVJbnQzMkJFKHRoaXMuaW1wb3J0SW5zLmxlbmd0aCwgMClcbiAgICB0aGlzLm51bU91dHMud3JpdGVVSW50MzJCRSh0aGlzLm91dHMubGVuZ3RoLCAwKVxuICAgIGxldCBiYXJyOiBCdWZmZXJbXSA9IFtzdXBlci50b0J1ZmZlcigpLCB0aGlzLnNvdXJjZUNoYWluLCB0aGlzLm51bUluc11cbiAgICBsZXQgYnNpemU6IG51bWJlciA9XG4gICAgICBzdXBlci50b0J1ZmZlcigpLmxlbmd0aCArIHRoaXMuc291cmNlQ2hhaW4ubGVuZ3RoICsgdGhpcy5udW1JbnMubGVuZ3RoXG4gICAgdGhpcy5pbXBvcnRJbnMgPSB0aGlzLmltcG9ydElucy5zb3J0KFRyYW5zZmVyYWJsZUlucHV0LmNvbXBhcmF0b3IoKSlcbiAgICB0aGlzLmltcG9ydElucy5mb3JFYWNoKChpbXBvcnRJbjogVHJhbnNmZXJhYmxlSW5wdXQpID0+IHtcbiAgICAgIGJzaXplICs9IGltcG9ydEluLnRvQnVmZmVyKCkubGVuZ3RoXG4gICAgICBiYXJyLnB1c2goaW1wb3J0SW4udG9CdWZmZXIoKSlcbiAgICB9KVxuICAgIGJzaXplICs9IHRoaXMubnVtT3V0cy5sZW5ndGhcbiAgICBiYXJyLnB1c2godGhpcy5udW1PdXRzKVxuICAgIHRoaXMub3V0cy5mb3JFYWNoKChvdXQ6IEVWTU91dHB1dCkgPT4ge1xuICAgICAgYnNpemUgKz0gb3V0LnRvQnVmZmVyKCkubGVuZ3RoXG4gICAgICBiYXJyLnB1c2gob3V0LnRvQnVmZmVyKCkpXG4gICAgfSlcbiAgICByZXR1cm4gQnVmZmVyLmNvbmNhdChiYXJyLCBic2l6ZSlcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIFtbVHJhbnNmZXJhYmxlSW5wdXRdXXMgaW4gdGhpcyB0cmFuc2FjdGlvbi5cbiAgICovXG4gIGdldEltcG9ydElucHV0cygpOiBUcmFuc2ZlcmFibGVJbnB1dFtdIHtcbiAgICByZXR1cm4gdGhpcy5pbXBvcnRJbnNcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIFtbRVZNT3V0cHV0XV1zIGluIHRoaXMgdHJhbnNhY3Rpb24uXG4gICAqL1xuICBnZXRPdXRzKCk6IEVWTU91dHB1dFtdIHtcbiAgICByZXR1cm4gdGhpcy5vdXRzXG4gIH1cblxuICBjbG9uZSgpOiB0aGlzIHtcbiAgICBsZXQgbmV3SW1wb3J0VHg6IEltcG9ydFR4ID0gbmV3IEltcG9ydFR4KClcbiAgICBuZXdJbXBvcnRUeC5mcm9tQnVmZmVyKHRoaXMudG9CdWZmZXIoKSlcbiAgICByZXR1cm4gbmV3SW1wb3J0VHggYXMgdGhpc1xuICB9XG5cbiAgY3JlYXRlKC4uLmFyZ3M6IGFueVtdKTogdGhpcyB7XG4gICAgcmV0dXJuIG5ldyBJbXBvcnRUeCguLi5hcmdzKSBhcyB0aGlzXG4gIH1cblxuICAvKipcbiAgICogVGFrZXMgdGhlIGJ5dGVzIG9mIGFuIFtbVW5zaWduZWRUeF1dIGFuZCByZXR1cm5zIGFuIGFycmF5IG9mIFtbQ3JlZGVudGlhbF1dc1xuICAgKlxuICAgKiBAcGFyYW0gbXNnIEEgQnVmZmVyIGZvciB0aGUgW1tVbnNpZ25lZFR4XV1cbiAgICogQHBhcmFtIGtjIEFuIFtbS2V5Q2hhaW5dXSB1c2VkIGluIHNpZ25pbmdcbiAgICpcbiAgICogQHJldHVybnMgQW4gYXJyYXkgb2YgW1tDcmVkZW50aWFsXV1zXG4gICAqL1xuICBzaWduKG1zZzogQnVmZmVyLCBrYzogS2V5Q2hhaW4pOiBDcmVkZW50aWFsW10ge1xuICAgIGNvbnN0IGNyZWRzOiBDcmVkZW50aWFsW10gPSBzdXBlci5zaWduKG1zZywga2MpXG4gICAgdGhpcy5pbXBvcnRJbnMuZm9yRWFjaCgoaW1wb3J0SW46IFRyYW5zZmVyYWJsZUlucHV0KSA9PiB7XG4gICAgICBjb25zdCBjcmVkOiBDcmVkZW50aWFsID0gU2VsZWN0Q3JlZGVudGlhbENsYXNzKFxuICAgICAgICBpbXBvcnRJbi5nZXRJbnB1dCgpLmdldENyZWRlbnRpYWxJRCgpXG4gICAgICApXG4gICAgICBjb25zdCBzaWdpZHhzOiBTaWdJZHhbXSA9IGltcG9ydEluLmdldElucHV0KCkuZ2V0U2lnSWR4cygpXG4gICAgICBzaWdpZHhzLmZvckVhY2goKHNpZ2lkeDogU2lnSWR4KSA9PiB7XG4gICAgICAgIGNvbnN0IGtleXBhaXI6IEtleVBhaXIgPSBrYy5nZXRLZXkoc2lnaWR4LmdldFNvdXJjZSgpKVxuICAgICAgICBjb25zdCBzaWdudmFsOiBCdWZmZXIgPSBrZXlwYWlyLnNpZ24obXNnKVxuICAgICAgICBjb25zdCBzaWc6IFNpZ25hdHVyZSA9IG5ldyBTaWduYXR1cmUoKVxuICAgICAgICBzaWcuZnJvbUJ1ZmZlcihzaWdudmFsKVxuICAgICAgICBjcmVkLmFkZFNpZ25hdHVyZShzaWcpXG4gICAgICB9KVxuICAgICAgY3JlZHMucHVzaChjcmVkKVxuICAgIH0pXG4gICAgcmV0dXJuIGNyZWRzXG4gIH1cblxuICAvKipcbiAgICogQ2xhc3MgcmVwcmVzZW50aW5nIGFuIHVuc2lnbmVkIEltcG9ydCB0cmFuc2FjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIG5ldHdvcmtJRCBPcHRpb25hbCBuZXR3b3JrSUQsIFtbRGVmYXVsdE5ldHdvcmtJRF1dXG4gICAqIEBwYXJhbSBibG9ja2NoYWluSUQgT3B0aW9uYWwgYmxvY2tjaGFpbklELCBkZWZhdWx0IEJ1ZmZlci5hbGxvYygzMiwgMTYpXG4gICAqIEBwYXJhbSBzb3VyY2VDaGFpbklEIE9wdGlvbmFsIGNoYWluSUQgZm9yIHRoZSBzb3VyY2UgaW5wdXRzIHRvIGltcG9ydC4gRGVmYXVsdCBCdWZmZXIuYWxsb2MoMzIsIDE2KVxuICAgKiBAcGFyYW0gaW1wb3J0SW5zIE9wdGlvbmFsIGFycmF5IG9mIFtbVHJhbnNmZXJhYmxlSW5wdXRdXXMgdXNlZCBpbiB0aGUgdHJhbnNhY3Rpb25cbiAgICogQHBhcmFtIG91dHMgT3B0aW9uYWwgYXJyYXkgb2YgdGhlIFtbRVZNT3V0cHV0XV1zXG4gICAqIEBwYXJhbSBmZWUgT3B0aW9uYWwgdGhlIGZlZSBhcyBhIEJOXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICBuZXR3b3JrSUQ6IG51bWJlciA9IERlZmF1bHROZXR3b3JrSUQsXG4gICAgYmxvY2tjaGFpbklEOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMzIsIDE2KSxcbiAgICBzb3VyY2VDaGFpbklEOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMzIsIDE2KSxcbiAgICBpbXBvcnRJbnM6IFRyYW5zZmVyYWJsZUlucHV0W10gPSB1bmRlZmluZWQsXG4gICAgb3V0czogRVZNT3V0cHV0W10gPSB1bmRlZmluZWQsXG4gICAgZmVlOiBCTiA9IG5ldyBCTigwKVxuICApIHtcbiAgICBzdXBlcihuZXR3b3JrSUQsIGJsb2NrY2hhaW5JRClcbiAgICB0aGlzLnNvdXJjZUNoYWluID0gc291cmNlQ2hhaW5JRFxuICAgIGxldCBpbnB1dHNQYXNzZWQ6IGJvb2xlYW4gPSBmYWxzZVxuICAgIGxldCBvdXRwdXRzUGFzc2VkOiBib29sZWFuID0gZmFsc2VcbiAgICBpZiAoXG4gICAgICB0eXBlb2YgaW1wb3J0SW5zICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgICBBcnJheS5pc0FycmF5KGltcG9ydElucykgJiZcbiAgICAgIGltcG9ydElucy5sZW5ndGggPiAwXG4gICAgKSB7XG4gICAgICBpbXBvcnRJbnMuZm9yRWFjaCgoaW1wb3J0SW46IFRyYW5zZmVyYWJsZUlucHV0KSA9PiB7XG4gICAgICAgIGlmICghKGltcG9ydEluIGluc3RhbmNlb2YgVHJhbnNmZXJhYmxlSW5wdXQpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFRyYW5zZmVyYWJsZUlucHV0RXJyb3IoXG4gICAgICAgICAgICBcIkVycm9yIC0gSW1wb3J0VHguY29uc3RydWN0b3I6IGludmFsaWQgVHJhbnNmZXJhYmxlSW5wdXQgaW4gYXJyYXkgcGFyYW1ldGVyICdpbXBvcnRJbnMnXCJcbiAgICAgICAgICApXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICBpbnB1dHNQYXNzZWQgPSB0cnVlXG4gICAgICB0aGlzLmltcG9ydElucyA9IGltcG9ydEluc1xuICAgIH1cbiAgICBpZiAodHlwZW9mIG91dHMgIT09IFwidW5kZWZpbmVkXCIgJiYgQXJyYXkuaXNBcnJheShvdXRzKSAmJiBvdXRzLmxlbmd0aCA+IDApIHtcbiAgICAgIG91dHMuZm9yRWFjaCgob3V0OiBFVk1PdXRwdXQpID0+IHtcbiAgICAgICAgaWYgKCEob3V0IGluc3RhbmNlb2YgRVZNT3V0cHV0KSkge1xuICAgICAgICAgIHRocm93IG5ldyBFVk1PdXRwdXRFcnJvcihcbiAgICAgICAgICAgIFwiRXJyb3IgLSBJbXBvcnRUeC5jb25zdHJ1Y3RvcjogaW52YWxpZCBFVk1PdXRwdXQgaW4gYXJyYXkgcGFyYW1ldGVyICdvdXRzJ1wiXG4gICAgICAgICAgKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgaWYgKG91dHMubGVuZ3RoID4gMSkge1xuICAgICAgICBvdXRzID0gb3V0cy5zb3J0KEVWTU91dHB1dC5jb21wYXJhdG9yKCkpXG4gICAgICB9XG4gICAgICBvdXRwdXRzUGFzc2VkID0gdHJ1ZVxuICAgICAgdGhpcy5vdXRzID0gb3V0c1xuICAgIH1cbiAgICBpZiAoaW5wdXRzUGFzc2VkICYmIG91dHB1dHNQYXNzZWQpIHtcbiAgICAgIHRoaXMudmFsaWRhdGVPdXRzKGZlZSlcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHZhbGlkYXRlT3V0cyhmZWU6IEJOKTogdm9pZCB7XG4gICAgLy8gVGhpcyBNYXAgZW5mb3JjZXMgdW5pcXVlbmVzcyBvZiBwYWlyKGFkZHJlc3MsIGFzc2V0SWQpIGZvciBlYWNoIEVWTU91dHB1dC5cbiAgICAvLyBGb3IgZWFjaCBpbXBvcnRlZCBhc3NldElELCBlYWNoIEVUSC1zdHlsZSBDLUNoYWluIGFkZHJlc3MgY2FuXG4gICAgLy8gaGF2ZSBleGFjdGx5IDEgRVZNT3V0cHV0LlxuICAgIC8vIE1hcCgyKSB7XG4gICAgLy8gICAnMHg4ZGI5N0M3Y0VjRTI0OWMyYjk4YkRDMDIyNkNjNEMyQTU3QkY1MkZDJyA9PiBbXG4gICAgLy8gICAgICdGdndFQWhteEtmZWlHOFNuRXZxNDJoYzZ3aFJ5WTNFRllBdmViTXFETkRHQ2d4TjVaJyxcbiAgICAvLyAgICAgJ0Y0TXlKY1V2cTNSeGJxZ2Q0WnM4c1VwdndMSEFweXJwNHl4SlhlMmJBVjg2VnZwMzgnXG4gICAgLy8gICBdLFxuICAgIC8vICAgJzB4ZWNDM0IyOTY4QjI3N2I4MzdhODFBNzE4MWUwYjk0RUIxQ2E1NEVkRScgPT4gW1xuICAgIC8vICAgICAnRnZ3RUFobXhLZmVpRzhTbkV2cTQyaGM2d2hSeVkzRUZZQXZlYk1xRE5ER0NneE41WicsXG4gICAgLy8gICAgICcyRGY5NnlIeWhOYzN2b29pZU5OaHlLd3JqRWZUc1YyUmVNbzVGS2pNcHI4dndONEpxeScsXG4gICAgLy8gICAgICdTZlNYQnpEYjlHWjlSMnVINjFxWktlOG54UUhXOUtFUlc5S3E5V1JlNHZISlpSTjNlJ1xuICAgIC8vICAgXVxuICAgIC8vIH1cbiAgICBjb25zdCBzZWVuQXNzZXRTZW5kczogTWFwPHN0cmluZywgc3RyaW5nW10+ID0gbmV3IE1hcCgpXG4gICAgdGhpcy5vdXRzLmZvckVhY2goKGV2bU91dHB1dDogRVZNT3V0cHV0KTogdm9pZCA9PiB7XG4gICAgICBjb25zdCBhZGRyZXNzOiBzdHJpbmcgPSBldm1PdXRwdXQuZ2V0QWRkcmVzc1N0cmluZygpXG4gICAgICBjb25zdCBhc3NldElkOiBzdHJpbmcgPSBiaW50b29scy5jYjU4RW5jb2RlKGV2bU91dHB1dC5nZXRBc3NldElEKCkpXG4gICAgICBpZiAoc2VlbkFzc2V0U2VuZHMuaGFzKGFkZHJlc3MpKSB7XG4gICAgICAgIGNvbnN0IGFzc2V0c1NlbnRUb0FkZHJlc3M6IHN0cmluZ1tdID0gc2VlbkFzc2V0U2VuZHMuZ2V0KGFkZHJlc3MpXG4gICAgICAgIGlmIChhc3NldHNTZW50VG9BZGRyZXNzLmluY2x1ZGVzKGFzc2V0SWQpKSB7XG4gICAgICAgICAgY29uc3QgZXJyb3JNZXNzYWdlOiBzdHJpbmcgPSBgRXJyb3IgLSBJbXBvcnRUeDogZHVwbGljYXRlIChhZGRyZXNzLCBhc3NldElkKSBwYWlyIGZvdW5kIGluIG91dHB1dHM6ICgweCR7YWRkcmVzc30sICR7YXNzZXRJZH0pYFxuICAgICAgICAgIHRocm93IG5ldyBFVk1PdXRwdXRFcnJvcihlcnJvck1lc3NhZ2UpXG4gICAgICAgIH1cbiAgICAgICAgYXNzZXRzU2VudFRvQWRkcmVzcy5wdXNoKGFzc2V0SWQpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZWVuQXNzZXRTZW5kcy5zZXQoYWRkcmVzcywgW2Fzc2V0SWRdKVxuICAgICAgfVxuICAgIH0pXG4gICAgLy8gbWFrZSBzdXJlIHRoaXMgdHJhbnNhY3Rpb24gcGF5cyB0aGUgcmVxdWlyZWQgYXZheCBmZWVcbiAgICBjb25zdCBzZWxlY3RlZE5ldHdvcms6IG51bWJlciA9IHRoaXMuZ2V0TmV0d29ya0lEKClcbiAgICBjb25zdCBmZWVEaWZmOiBCTiA9IG5ldyBCTigwKVxuICAgIGNvbnN0IGF2YXhBc3NldElEOiBzdHJpbmcgPVxuICAgICAgTmV0d29ya3MuZ2V0TmV0d29yayhzZWxlY3RlZE5ldHdvcmspLlguYXZheEFzc2V0SURcblxuICAgIC8vIHN1bSBpbmNvbWluZyBBVkFYXG4gICAgdGhpcy5pbXBvcnRJbnMuZm9yRWFjaCgoaW5wdXQ6IFRyYW5zZmVyYWJsZUlucHV0KTogdm9pZCA9PiB7XG4gICAgICAvLyBvbmx5IGNoZWNrIFN0YW5kYXJkQW1vdW50SW5wdXRzXG4gICAgICBpZiAoXG4gICAgICAgIGlucHV0LmdldElucHV0KCkgaW5zdGFuY2VvZiBTdGFuZGFyZEFtb3VudElucHV0ICYmXG4gICAgICAgIGF2YXhBc3NldElEID09PSBiaW50b29scy5jYjU4RW5jb2RlKGlucHV0LmdldEFzc2V0SUQoKSlcbiAgICAgICkge1xuICAgICAgICBjb25zdCB1aSA9IGlucHV0LmdldElucHV0KCkgYXMgdW5rbm93blxuICAgICAgICBjb25zdCBpID0gdWkgYXMgU3RhbmRhcmRBbW91bnRJbnB1dFxuICAgICAgICBmZWVEaWZmLmlhZGQoaS5nZXRBbW91bnQoKSlcbiAgICAgIH1cbiAgICB9KVxuICAgIC8vIHN1YnRyYWN0IGFsbCBvdXRnb2luZyBBVkFYXG4gICAgdGhpcy5vdXRzLmZvckVhY2goKGV2bU91dHB1dDogRVZNT3V0cHV0KTogdm9pZCA9PiB7XG4gICAgICBpZiAoYXZheEFzc2V0SUQgPT09IGJpbnRvb2xzLmNiNThFbmNvZGUoZXZtT3V0cHV0LmdldEFzc2V0SUQoKSkpIHtcbiAgICAgICAgZmVlRGlmZi5pc3ViKGV2bU91dHB1dC5nZXRBbW91bnQoKSlcbiAgICAgIH1cbiAgICB9KVxuICAgIGlmIChmZWVEaWZmLmx0KGZlZSkpIHtcbiAgICAgIGNvbnN0IGVycm9yTWVzc2FnZTogc3RyaW5nID0gYEVycm9yIC0gJHtmZWV9IG5BVkFYIHJlcXVpcmVkIGZvciBmZWUgYW5kIG9ubHkgJHtmZWVEaWZmfSBuQVZBWCBwcm92aWRlZGBcbiAgICAgIHRocm93IG5ldyBFVk1GZWVFcnJvcihlcnJvck1lc3NhZ2UpXG4gICAgfVxuICB9XG59XG4iXX0=