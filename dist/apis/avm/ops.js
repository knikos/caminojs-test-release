"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UTXOID = exports.NFTTransferOperation = exports.NFTMintOperation = exports.SECPMintOperation = exports.TransferableOperation = exports.Operation = exports.SelectOperationClass = void 0;
/**
 * @packageDocumentation
 * @module API-AVM-Operations
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const outputs_1 = require("./outputs");
const nbytes_1 = require("../../common/nbytes");
const credentials_1 = require("../../common/credentials");
const output_1 = require("../../common/output");
const serialization_1 = require("../../utils/serialization");
const errors_1 = require("../../utils/errors");
const bintools = bintools_1.default.getInstance();
const serialization = serialization_1.Serialization.getInstance();
const cb58 = "cb58";
const buffer = "Buffer";
const hex = "hex";
const decimalString = "decimalString";
/**
 * Takes a buffer representing the output and returns the proper [[Operation]] instance.
 *
 * @param opid A number representing the operation ID parsed prior to the bytes passed in
 *
 * @returns An instance of an [[Operation]]-extended class.
 */
const SelectOperationClass = (opid, ...args) => {
    if (opid === constants_1.AVMConstants.SECPMINTOPID ||
        opid === constants_1.AVMConstants.SECPMINTOPID_CODECONE) {
        return new SECPMintOperation(...args);
    }
    else if (opid === constants_1.AVMConstants.NFTMINTOPID ||
        opid === constants_1.AVMConstants.NFTMINTOPID_CODECTWO) {
        return new NFTMintOperation(...args);
    }
    else if (opid === constants_1.AVMConstants.NFTXFEROPID ||
        opid === constants_1.AVMConstants.NFTXFEROPID_CODECTWO) {
        return new NFTTransferOperation(...args);
    }
    /* istanbul ignore next */
    throw new errors_1.InvalidOperationIdError(`Error - SelectOperationClass: unknown opid ${opid}`);
};
exports.SelectOperationClass = SelectOperationClass;
/**
 * A class representing an operation. All operation types must extend on this class.
 */
class Operation extends serialization_1.Serializable {
    constructor() {
        super(...arguments);
        this._typeName = "Operation";
        this._typeID = undefined;
        this.sigCount = buffer_1.Buffer.alloc(4);
        this.sigIdxs = []; // idxs of signers from utxo
        /**
         * Returns the array of [[SigIdx]] for this [[Operation]]
         */
        this.getSigIdxs = () => this.sigIdxs;
        /**
         * Creates and adds a [[SigIdx]] to the [[Operation]].
         *
         * @param addressIdx The index of the address to reference in the signatures
         * @param address The address of the source of the signature
         */
        this.addSignatureIdx = (addressIdx, address) => {
            const sigidx = new credentials_1.SigIdx();
            const b = buffer_1.Buffer.alloc(4);
            b.writeUInt32BE(addressIdx, 0);
            sigidx.fromBuffer(b);
            sigidx.setSource(address);
            this.sigIdxs.push(sigidx);
            this.sigCount.writeUInt32BE(this.sigIdxs.length, 0);
        };
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { sigIdxs: this.sigIdxs.map((s) => s.serialize(encoding)) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.sigIdxs = fields["sigIdxs"].map((s) => {
            let sidx = new credentials_1.SigIdx();
            sidx.deserialize(s, encoding);
            return sidx;
        });
        this.sigCount.writeUInt32BE(this.sigIdxs.length, 0);
    }
    fromBuffer(bytes, offset = 0) {
        this.sigCount = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        const sigCount = this.sigCount.readUInt32BE(0);
        this.sigIdxs = [];
        for (let i = 0; i < sigCount; i++) {
            const sigidx = new credentials_1.SigIdx();
            const sigbuff = bintools.copyFrom(bytes, offset, offset + 4);
            sigidx.fromBuffer(sigbuff);
            offset += 4;
            this.sigIdxs.push(sigidx);
        }
        return offset;
    }
    toBuffer() {
        this.sigCount.writeUInt32BE(this.sigIdxs.length, 0);
        let bsize = this.sigCount.length;
        const barr = [this.sigCount];
        for (let i = 0; i < this.sigIdxs.length; i++) {
            const b = this.sigIdxs[`${i}`].toBuffer();
            barr.push(b);
            bsize += b.length;
        }
        return buffer_1.Buffer.concat(barr, bsize);
    }
    /**
     * Returns a base-58 string representing the [[NFTMintOperation]].
     */
    toString() {
        return bintools.bufferToB58(this.toBuffer());
    }
}
exports.Operation = Operation;
Operation.comparator = () => (a, b) => {
    const aoutid = buffer_1.Buffer.alloc(4);
    aoutid.writeUInt32BE(a.getOperationID(), 0);
    const abuff = a.toBuffer();
    const boutid = buffer_1.Buffer.alloc(4);
    boutid.writeUInt32BE(b.getOperationID(), 0);
    const bbuff = b.toBuffer();
    const asort = buffer_1.Buffer.concat([aoutid, abuff], aoutid.length + abuff.length);
    const bsort = buffer_1.Buffer.concat([boutid, bbuff], boutid.length + bbuff.length);
    return buffer_1.Buffer.compare(asort, bsort);
};
/**
 * A class which contains an [[Operation]] for transfers.
 *
 */
class TransferableOperation extends serialization_1.Serializable {
    constructor(assetID = undefined, utxoids = undefined, operation = undefined) {
        super();
        this._typeName = "TransferableOperation";
        this._typeID = undefined;
        this.assetID = buffer_1.Buffer.alloc(32);
        this.utxoIDs = [];
        /**
         * Returns the assetID as a {@link https://github.com/feross/buffer|Buffer}.
         */
        this.getAssetID = () => this.assetID;
        /**
         * Returns an array of UTXOIDs in this operation.
         */
        this.getUTXOIDs = () => this.utxoIDs;
        /**
         * Returns the operation
         */
        this.getOperation = () => this.operation;
        if (typeof assetID !== "undefined" &&
            assetID.length === constants_1.AVMConstants.ASSETIDLEN &&
            operation instanceof Operation &&
            typeof utxoids !== "undefined" &&
            Array.isArray(utxoids)) {
            this.assetID = assetID;
            this.operation = operation;
            for (let i = 0; i < utxoids.length; i++) {
                const utxoid = new UTXOID();
                if (typeof utxoids[`${i}`] === "string") {
                    utxoid.fromString(utxoids[`${i}`]);
                }
                else if (utxoids[`${i}`] instanceof buffer_1.Buffer) {
                    utxoid.fromBuffer(utxoids[`${i}`]);
                }
                else if (utxoids[`${i}`] instanceof UTXOID) {
                    utxoid.fromString(utxoids[`${i}`].toString()); // clone
                }
                this.utxoIDs.push(utxoid);
            }
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { assetID: serialization.encoder(this.assetID, encoding, buffer, cb58, 32), utxoIDs: this.utxoIDs.map((u) => u.serialize(encoding)), operation: this.operation.serialize(encoding) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.assetID = serialization.decoder(fields["assetID"], encoding, cb58, buffer, 32);
        this.utxoIDs = fields["utxoIDs"].map((u) => {
            let utxoid = new UTXOID();
            utxoid.deserialize(u, encoding);
            return utxoid;
        });
        this.operation = (0, exports.SelectOperationClass)(fields["operation"]["_typeID"]);
        this.operation.deserialize(fields["operation"], encoding);
    }
    fromBuffer(bytes, offset = 0) {
        this.assetID = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        const numutxoIDs = bintools
            .copyFrom(bytes, offset, offset + 4)
            .readUInt32BE(0);
        offset += 4;
        this.utxoIDs = [];
        for (let i = 0; i < numutxoIDs; i++) {
            const utxoid = new UTXOID();
            offset = utxoid.fromBuffer(bytes, offset);
            this.utxoIDs.push(utxoid);
        }
        const opid = bintools
            .copyFrom(bytes, offset, offset + 4)
            .readUInt32BE(0);
        offset += 4;
        this.operation = (0, exports.SelectOperationClass)(opid);
        return this.operation.fromBuffer(bytes, offset);
    }
    toBuffer() {
        const numutxoIDs = buffer_1.Buffer.alloc(4);
        numutxoIDs.writeUInt32BE(this.utxoIDs.length, 0);
        let bsize = this.assetID.length + numutxoIDs.length;
        const barr = [this.assetID, numutxoIDs];
        this.utxoIDs = this.utxoIDs.sort(UTXOID.comparator());
        for (let i = 0; i < this.utxoIDs.length; i++) {
            const b = this.utxoIDs[`${i}`].toBuffer();
            barr.push(b);
            bsize += b.length;
        }
        const opid = buffer_1.Buffer.alloc(4);
        opid.writeUInt32BE(this.operation.getOperationID(), 0);
        barr.push(opid);
        bsize += opid.length;
        const b = this.operation.toBuffer();
        bsize += b.length;
        barr.push(b);
        return buffer_1.Buffer.concat(barr, bsize);
    }
}
exports.TransferableOperation = TransferableOperation;
/**
 * Returns a function used to sort an array of [[TransferableOperation]]s
 */
TransferableOperation.comparator = () => {
    return function (a, b) {
        return buffer_1.Buffer.compare(a.toBuffer(), b.toBuffer());
    };
};
/**
 * An [[Operation]] class which specifies a SECP256k1 Mint Op.
 */
class SECPMintOperation extends Operation {
    /**
     * An [[Operation]] class which mints new tokens on an assetID.
     *
     * @param mintOutput The [[SECPMintOutput]] that will be produced by this transaction.
     * @param transferOutput A [[SECPTransferOutput]] that will be produced from this minting operation.
     */
    constructor(mintOutput = undefined, transferOutput = undefined) {
        super();
        this._typeName = "SECPMintOperation";
        this._codecID = constants_1.AVMConstants.LATESTCODEC;
        this._typeID = this._codecID === 0
            ? constants_1.AVMConstants.SECPMINTOPID
            : constants_1.AVMConstants.SECPMINTOPID_CODECONE;
        this.mintOutput = undefined;
        this.transferOutput = undefined;
        if (typeof mintOutput !== "undefined") {
            this.mintOutput = mintOutput;
        }
        if (typeof transferOutput !== "undefined") {
            this.transferOutput = transferOutput;
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { mintOutput: this.mintOutput.serialize(encoding), transferOutputs: this.transferOutput.serialize(encoding) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.mintOutput = new outputs_1.SECPMintOutput();
        this.mintOutput.deserialize(fields["mintOutput"], encoding);
        this.transferOutput = new outputs_1.SECPTransferOutput();
        this.transferOutput.deserialize(fields["transferOutputs"], encoding);
    }
    /**
     * Set the codecID
     *
     * @param codecID The codecID to set
     */
    setCodecID(codecID) {
        if (codecID !== 0 && codecID !== 1) {
            /* istanbul ignore next */
            throw new errors_1.CodecIdError("Error - SECPMintOperation.setCodecID: invalid codecID. Valid codecIDs are 0 and 1.");
        }
        this._codecID = codecID;
        this._typeID =
            this._codecID === 0
                ? constants_1.AVMConstants.SECPMINTOPID
                : constants_1.AVMConstants.SECPMINTOPID_CODECONE;
    }
    /**
     * Returns the operation ID.
     */
    getOperationID() {
        return this._typeID;
    }
    /**
     * Returns the credential ID.
     */
    getCredentialID() {
        if (this._codecID === 0) {
            return constants_1.AVMConstants.SECPCREDENTIAL;
        }
        else if (this._codecID === 1) {
            return constants_1.AVMConstants.SECPCREDENTIAL_CODECONE;
        }
    }
    /**
     * Returns the [[SECPMintOutput]] to be produced by this operation.
     */
    getMintOutput() {
        return this.mintOutput;
    }
    /**
     * Returns [[SECPTransferOutput]] to be produced by this operation.
     */
    getTransferOutput() {
        return this.transferOutput;
    }
    /**
     * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[SECPMintOperation]] and returns the updated offset.
     */
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        this.mintOutput = new outputs_1.SECPMintOutput();
        offset = this.mintOutput.fromBuffer(bytes, offset);
        this.transferOutput = new outputs_1.SECPTransferOutput();
        offset = this.transferOutput.fromBuffer(bytes, offset);
        return offset;
    }
    /**
     * Returns the buffer representing the [[SECPMintOperation]] instance.
     */
    toBuffer() {
        const superbuff = super.toBuffer();
        const mintoutBuff = this.mintOutput.toBuffer();
        const transferOutBuff = this.transferOutput.toBuffer();
        const bsize = superbuff.length + mintoutBuff.length + transferOutBuff.length;
        const barr = [superbuff, mintoutBuff, transferOutBuff];
        return buffer_1.Buffer.concat(barr, bsize);
    }
}
exports.SECPMintOperation = SECPMintOperation;
/**
 * An [[Operation]] class which specifies a NFT Mint Op.
 */
class NFTMintOperation extends Operation {
    /**
     * An [[Operation]] class which contains an NFT on an assetID.
     *
     * @param groupID The group to which to issue the NFT Output
     * @param payload A {@link https://github.com/feross/buffer|Buffer} of the NFT payload
     * @param outputOwners An array of outputOwners
     */
    constructor(groupID = undefined, payload = undefined, outputOwners = undefined) {
        super();
        this._typeName = "NFTMintOperation";
        this._codecID = constants_1.AVMConstants.LATESTCODEC;
        this._typeID = this._codecID === 0
            ? constants_1.AVMConstants.NFTMINTOPID
            : constants_1.AVMConstants.NFTMINTOPID_CODECTWO;
        this.groupID = buffer_1.Buffer.alloc(4);
        this.outputOwners = [];
        /**
         * Returns the credential ID.
         */
        this.getCredentialID = () => {
            if (this._codecID === 0) {
                return constants_1.AVMConstants.NFTCREDENTIAL;
            }
            else if (this._codecID === 1) {
                return constants_1.AVMConstants.NFTCREDENTIAL_CODECTWO;
            }
        };
        /**
         * Returns the payload.
         */
        this.getGroupID = () => {
            return bintools.copyFrom(this.groupID, 0);
        };
        /**
         * Returns the payload.
         */
        this.getPayload = () => {
            return bintools.copyFrom(this.payload, 0);
        };
        /**
         * Returns the payload's raw {@link https://github.com/feross/buffer|Buffer} with length prepended, for use with [[PayloadBase]]'s fromBuffer
         */
        this.getPayloadBuffer = () => {
            let payloadlen = buffer_1.Buffer.alloc(4);
            payloadlen.writeUInt32BE(this.payload.length, 0);
            return buffer_1.Buffer.concat([payloadlen, bintools.copyFrom(this.payload, 0)]);
        };
        /**
         * Returns the outputOwners.
         */
        this.getOutputOwners = () => {
            return this.outputOwners;
        };
        if (typeof groupID !== "undefined" &&
            typeof payload !== "undefined" &&
            outputOwners.length) {
            this.groupID.writeUInt32BE(groupID ? groupID : 0, 0);
            this.payload = payload;
            this.outputOwners = outputOwners;
        }
    }
    serialize(encoding = "hex") {
        const fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { groupID: serialization.encoder(this.groupID, encoding, buffer, decimalString, 4), payload: serialization.encoder(this.payload, encoding, buffer, hex), outputOwners: this.outputOwners.map((o) => o.serialize(encoding)) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.groupID = serialization.decoder(fields["groupID"], encoding, decimalString, buffer, 4);
        this.payload = serialization.decoder(fields["payload"], encoding, hex, buffer);
        // this.outputOwners = fields["outputOwners"].map((o: NFTMintOutput) => {
        //   let oo: NFTMintOutput = new NFTMintOutput()
        //   oo.deserialize(o, encoding)
        //   return oo
        // })
        this.outputOwners = fields["outputOwners"].map((o) => {
            let oo = new output_1.OutputOwners();
            oo.deserialize(o, encoding);
            return oo;
        });
    }
    /**
     * Set the codecID
     *
     * @param codecID The codecID to set
     */
    setCodecID(codecID) {
        if (codecID !== 0 && codecID !== 1) {
            /* istanbul ignore next */
            throw new errors_1.CodecIdError("Error - NFTMintOperation.setCodecID: invalid codecID. Valid codecIDs are 0 and 1.");
        }
        this._codecID = codecID;
        this._typeID =
            this._codecID === 0
                ? constants_1.AVMConstants.NFTMINTOPID
                : constants_1.AVMConstants.NFTMINTOPID_CODECTWO;
    }
    /**
     * Returns the operation ID.
     */
    getOperationID() {
        return this._typeID;
    }
    /**
     * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[NFTMintOperation]] and returns the updated offset.
     */
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        this.groupID = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        let payloadLen = bintools
            .copyFrom(bytes, offset, offset + 4)
            .readUInt32BE(0);
        offset += 4;
        this.payload = bintools.copyFrom(bytes, offset, offset + payloadLen);
        offset += payloadLen;
        let numoutputs = bintools
            .copyFrom(bytes, offset, offset + 4)
            .readUInt32BE(0);
        offset += 4;
        this.outputOwners = [];
        for (let i = 0; i < numoutputs; i++) {
            let outputOwner = new output_1.OutputOwners();
            offset = outputOwner.fromBuffer(bytes, offset);
            this.outputOwners.push(outputOwner);
        }
        return offset;
    }
    /**
     * Returns the buffer representing the [[NFTMintOperation]] instance.
     */
    toBuffer() {
        const superbuff = super.toBuffer();
        const payloadlen = buffer_1.Buffer.alloc(4);
        payloadlen.writeUInt32BE(this.payload.length, 0);
        const outputownerslen = buffer_1.Buffer.alloc(4);
        outputownerslen.writeUInt32BE(this.outputOwners.length, 0);
        let bsize = superbuff.length +
            this.groupID.length +
            payloadlen.length +
            this.payload.length +
            outputownerslen.length;
        const barr = [
            superbuff,
            this.groupID,
            payloadlen,
            this.payload,
            outputownerslen
        ];
        for (let i = 0; i < this.outputOwners.length; i++) {
            let b = this.outputOwners[`${i}`].toBuffer();
            barr.push(b);
            bsize += b.length;
        }
        return buffer_1.Buffer.concat(barr, bsize);
    }
    /**
     * Returns a base-58 string representing the [[NFTMintOperation]].
     */
    toString() {
        return bintools.bufferToB58(this.toBuffer());
    }
}
exports.NFTMintOperation = NFTMintOperation;
/**
 * A [[Operation]] class which specifies a NFT Transfer Op.
 */
class NFTTransferOperation extends Operation {
    /**
     * An [[Operation]] class which contains an NFT on an assetID.
     *
     * @param output An [[NFTTransferOutput]]
     */
    constructor(output = undefined) {
        super();
        this._typeName = "NFTTransferOperation";
        this._codecID = constants_1.AVMConstants.LATESTCODEC;
        this._typeID = this._codecID === 0
            ? constants_1.AVMConstants.NFTXFEROPID
            : constants_1.AVMConstants.NFTXFEROPID_CODECTWO;
        this.getOutput = () => this.output;
        if (typeof output !== "undefined") {
            this.output = output;
        }
    }
    serialize(encoding = "hex") {
        const fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { output: this.output.serialize(encoding) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.output = new outputs_1.NFTTransferOutput();
        this.output.deserialize(fields["output"], encoding);
    }
    /**
     * Set the codecID
     *
     * @param codecID The codecID to set
     */
    setCodecID(codecID) {
        if (codecID !== 0 && codecID !== 1) {
            /* istanbul ignore next */
            throw new errors_1.CodecIdError("Error - NFTTransferOperation.setCodecID: invalid codecID. Valid codecIDs are 0 and 1.");
        }
        this._codecID = codecID;
        this._typeID =
            this._codecID === 0
                ? constants_1.AVMConstants.NFTXFEROPID
                : constants_1.AVMConstants.NFTXFEROPID_CODECTWO;
    }
    /**
     * Returns the operation ID.
     */
    getOperationID() {
        return this._typeID;
    }
    /**
     * Returns the credential ID.
     */
    getCredentialID() {
        if (this._codecID === 0) {
            return constants_1.AVMConstants.NFTCREDENTIAL;
        }
        else if (this._codecID === 1) {
            return constants_1.AVMConstants.NFTCREDENTIAL_CODECTWO;
        }
    }
    /**
     * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[NFTTransferOperation]] and returns the updated offset.
     */
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        this.output = new outputs_1.NFTTransferOutput();
        return this.output.fromBuffer(bytes, offset);
    }
    /**
     * Returns the buffer representing the [[NFTTransferOperation]] instance.
     */
    toBuffer() {
        const superbuff = super.toBuffer();
        const outbuff = this.output.toBuffer();
        const bsize = superbuff.length + outbuff.length;
        const barr = [superbuff, outbuff];
        return buffer_1.Buffer.concat(barr, bsize);
    }
    /**
     * Returns a base-58 string representing the [[NFTTransferOperation]].
     */
    toString() {
        return bintools.bufferToB58(this.toBuffer());
    }
}
exports.NFTTransferOperation = NFTTransferOperation;
/**
 * Class for representing a UTXOID used in [[TransferableOp]] types
 */
class UTXOID extends nbytes_1.NBytes {
    /**
     * Class for representing a UTXOID used in [[TransferableOp]] types
     */
    constructor() {
        super();
        this._typeName = "UTXOID";
        this._typeID = undefined;
        //serialize and deserialize both are inherited
        this.bytes = buffer_1.Buffer.alloc(36);
        this.bsize = 36;
    }
    /**
     * Returns a base-58 representation of the [[UTXOID]].
     */
    toString() {
        return bintools.cb58Encode(this.toBuffer());
    }
    /**
     * Takes a base-58 string containing an [[UTXOID]], parses it, populates the class, and returns the length of the UTXOID in bytes.
     *
     * @param bytes A base-58 string containing a raw [[UTXOID]]
     *
     * @returns The length of the raw [[UTXOID]]
     */
    fromString(utxoid) {
        const utxoidbuff = bintools.b58ToBuffer(utxoid);
        if (utxoidbuff.length === 40 && bintools.validateChecksum(utxoidbuff)) {
            const newbuff = bintools.copyFrom(utxoidbuff, 0, utxoidbuff.length - 4);
            if (newbuff.length === 36) {
                this.bytes = newbuff;
            }
        }
        else if (utxoidbuff.length === 40) {
            throw new errors_1.ChecksumError("Error - UTXOID.fromString: invalid checksum on address");
        }
        else if (utxoidbuff.length === 36) {
            this.bytes = utxoidbuff;
        }
        else {
            /* istanbul ignore next */
            throw new errors_1.AddressError("Error - UTXOID.fromString: invalid address");
        }
        return this.getSize();
    }
    clone() {
        const newbase = new UTXOID();
        newbase.fromBuffer(this.toBuffer());
        return newbase;
    }
    create() {
        return new UTXOID();
    }
}
exports.UTXOID = UTXOID;
/**
 * Returns a function used to sort an array of [[UTXOID]]s
 */
UTXOID.comparator = () => (a, b) => buffer_1.Buffer.compare(a.toBuffer(), b.toBuffer());
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3BzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvYXZtL29wcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7O0dBR0c7QUFDSCxvQ0FBZ0M7QUFDaEMsb0VBQTJDO0FBQzNDLDJDQUEwQztBQUMxQyx1Q0FJa0I7QUFDbEIsZ0RBQTRDO0FBQzVDLDBEQUFpRDtBQUNqRCxnREFBa0Q7QUFDbEQsNkRBS2tDO0FBQ2xDLCtDQUsyQjtBQUUzQixNQUFNLFFBQVEsR0FBYSxrQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBQ2pELE1BQU0sYUFBYSxHQUFrQiw2QkFBYSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBQ2hFLE1BQU0sSUFBSSxHQUFtQixNQUFNLENBQUE7QUFDbkMsTUFBTSxNQUFNLEdBQW1CLFFBQVEsQ0FBQTtBQUN2QyxNQUFNLEdBQUcsR0FBbUIsS0FBSyxDQUFBO0FBQ2pDLE1BQU0sYUFBYSxHQUFtQixlQUFlLENBQUE7QUFFckQ7Ozs7OztHQU1HO0FBQ0ksTUFBTSxvQkFBb0IsR0FBRyxDQUNsQyxJQUFZLEVBQ1osR0FBRyxJQUFXLEVBQ0gsRUFBRTtJQUNiLElBQ0UsSUFBSSxLQUFLLHdCQUFZLENBQUMsWUFBWTtRQUNsQyxJQUFJLEtBQUssd0JBQVksQ0FBQyxxQkFBcUIsRUFDM0M7UUFDQSxPQUFPLElBQUksaUJBQWlCLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQTtLQUN0QztTQUFNLElBQ0wsSUFBSSxLQUFLLHdCQUFZLENBQUMsV0FBVztRQUNqQyxJQUFJLEtBQUssd0JBQVksQ0FBQyxvQkFBb0IsRUFDMUM7UUFDQSxPQUFPLElBQUksZ0JBQWdCLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQTtLQUNyQztTQUFNLElBQ0wsSUFBSSxLQUFLLHdCQUFZLENBQUMsV0FBVztRQUNqQyxJQUFJLEtBQUssd0JBQVksQ0FBQyxvQkFBb0IsRUFDMUM7UUFDQSxPQUFPLElBQUksb0JBQW9C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QUUsQ0FBQTtJQUN2QixDQUFDO0lBRUQsS0FBSztRQUNILE1BQU0sT0FBTyxHQUFXLElBQUksTUFBTSxFQUFFLENBQUE7UUFDcEMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQTtRQUNuQyxPQUFPLE9BQWUsQ0FBQTtJQUN4QixDQUFDO0lBRUQsTUFBTTtRQUNKLE9BQU8sSUFBSSxNQUFNLEVBQVUsQ0FBQTtJQUM3QixDQUFDOztBQS9ESCx3QkF1RUM7QUE5REM7O0dBRUc7QUFDSSxpQkFBVSxHQUNmLEdBQTJDLEVBQUUsQ0FDN0MsQ0FBQyxDQUFTLEVBQUUsQ0FBUyxFQUFjLEVBQUUsQ0FDbkMsZUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFlLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxuICogQG1vZHVsZSBBUEktQVZNLU9wZXJhdGlvbnNcbiAqL1xuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcImJ1ZmZlci9cIlxuaW1wb3J0IEJpblRvb2xzIGZyb20gXCIuLi8uLi91dGlscy9iaW50b29sc1wiXG5pbXBvcnQgeyBBVk1Db25zdGFudHMgfSBmcm9tIFwiLi9jb25zdGFudHNcIlxuaW1wb3J0IHtcbiAgTkZUVHJhbnNmZXJPdXRwdXQsXG4gIFNFQ1BNaW50T3V0cHV0LFxuICBTRUNQVHJhbnNmZXJPdXRwdXRcbn0gZnJvbSBcIi4vb3V0cHV0c1wiXG5pbXBvcnQgeyBOQnl0ZXMgfSBmcm9tIFwiLi4vLi4vY29tbW9uL25ieXRlc1wiXG5pbXBvcnQgeyBTaWdJZHggfSBmcm9tIFwiLi4vLi4vY29tbW9uL2NyZWRlbnRpYWxzXCJcbmltcG9ydCB7IE91dHB1dE93bmVycyB9IGZyb20gXCIuLi8uLi9jb21tb24vb3V0cHV0XCJcbmltcG9ydCB7XG4gIFNlcmlhbGl6YWJsZSxcbiAgU2VyaWFsaXphdGlvbixcbiAgU2VyaWFsaXplZEVuY29kaW5nLFxuICBTZXJpYWxpemVkVHlwZVxufSBmcm9tIFwiLi4vLi4vdXRpbHMvc2VyaWFsaXphdGlvblwiXG5pbXBvcnQge1xuICBJbnZhbGlkT3BlcmF0aW9uSWRFcnJvcixcbiAgQ29kZWNJZEVycm9yLFxuICBDaGVja3N1bUVycm9yLFxuICBBZGRyZXNzRXJyb3Jcbn0gZnJvbSBcIi4uLy4uL3V0aWxzL2Vycm9yc1wiXG5cbmNvbnN0IGJpbnRvb2xzOiBCaW5Ub29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKClcbmNvbnN0IHNlcmlhbGl6YXRpb246IFNlcmlhbGl6YXRpb24gPSBTZXJpYWxpemF0aW9uLmdldEluc3RhbmNlKClcbmNvbnN0IGNiNTg6IFNlcmlhbGl6ZWRUeXBlID0gXCJjYjU4XCJcbmNvbnN0IGJ1ZmZlcjogU2VyaWFsaXplZFR5cGUgPSBcIkJ1ZmZlclwiXG5jb25zdCBoZXg6IFNlcmlhbGl6ZWRUeXBlID0gXCJoZXhcIlxuY29uc3QgZGVjaW1hbFN0cmluZzogU2VyaWFsaXplZFR5cGUgPSBcImRlY2ltYWxTdHJpbmdcIlxuXG4vKipcbiAqIFRha2VzIGEgYnVmZmVyIHJlcHJlc2VudGluZyB0aGUgb3V0cHV0IGFuZCByZXR1cm5zIHRoZSBwcm9wZXIgW1tPcGVyYXRpb25dXSBpbnN0YW5jZS5cbiAqXG4gKiBAcGFyYW0gb3BpZCBBIG51bWJlciByZXByZXNlbnRpbmcgdGhlIG9wZXJhdGlvbiBJRCBwYXJzZWQgcHJpb3IgdG8gdGhlIGJ5dGVzIHBhc3NlZCBpblxuICpcbiAqIEByZXR1cm5zIEFuIGluc3RhbmNlIG9mIGFuIFtbT3BlcmF0aW9uXV0tZXh0ZW5kZWQgY2xhc3MuXG4gKi9cbmV4cG9ydCBjb25zdCBTZWxlY3RPcGVyYXRpb25DbGFzcyA9IChcbiAgb3BpZDogbnVtYmVyLFxuICAuLi5hcmdzOiBhbnlbXVxuKTogT3BlcmF0aW9uID0+IHtcbiAgaWYgKFxuICAgIG9waWQgPT09IEFWTUNvbnN0YW50cy5TRUNQTUlOVE9QSUQgfHxcbiAgICBvcGlkID09PSBBVk1Db25zdGFudHMuU0VDUE1JTlRPUElEX0NPREVDT05FXG4gICkge1xuICAgIHJldHVybiBuZXcgU0VDUE1pbnRPcGVyYXRpb24oLi4uYXJncylcbiAgfSBlbHNlIGlmIChcbiAgICBvcGlkID09PSBBVk1Db25zdGFudHMuTkZUTUlOVE9QSUQgfHxcbiAgICBvcGlkID09PSBBVk1Db25zdGFudHMuTkZUTUlOVE9QSURfQ09ERUNUV09cbiAgKSB7XG4gICAgcmV0dXJuIG5ldyBORlRNaW50T3BlcmF0aW9uKC4uLmFyZ3MpXG4gIH0gZWxzZSBpZiAoXG4gICAgb3BpZCA9PT0gQVZNQ29uc3RhbnRzLk5GVFhGRVJPUElEIHx8XG4gICAgb3BpZCA9PT0gQVZNQ29uc3RhbnRzLk5GVFhGRVJPUElEX0NPREVDVFdPXG4gICkge1xuICAgIHJldHVybiBuZXcgTkZUVHJhbnNmZXJPcGVyYXRpb24oLi4uYXJncylcbiAgfVxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICB0aHJvdyBuZXcgSW52YWxpZE9wZXJhdGlvbklkRXJyb3IoXG4gICAgYEVycm9yIC0gU2VsZWN0T3BlcmF0aW9uQ2xhc3M6IHVua25vd24gb3BpZCAke29waWR9YFxuICApXG59XG5cbi8qKlxuICogQSBjbGFzcyByZXByZXNlbnRpbmcgYW4gb3BlcmF0aW9uLiBBbGwgb3BlcmF0aW9uIHR5cGVzIG11c3QgZXh0ZW5kIG9uIHRoaXMgY2xhc3MuXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBPcGVyYXRpb24gZXh0ZW5kcyBTZXJpYWxpemFibGUge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJPcGVyYXRpb25cIlxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZFxuXG4gIHNlcmlhbGl6ZShlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6IG9iamVjdCB7XG4gICAgbGV0IGZpZWxkczogb2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKVxuICAgIHJldHVybiB7XG4gICAgICAuLi5maWVsZHMsXG4gICAgICBzaWdJZHhzOiB0aGlzLnNpZ0lkeHMubWFwKChzOiBTaWdJZHgpOiBvYmplY3QgPT4gcy5zZXJpYWxpemUoZW5jb2RpbmcpKVxuICAgIH1cbiAgfVxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxuICAgIHRoaXMuc2lnSWR4cyA9IGZpZWxkc1tcInNpZ0lkeHNcIl0ubWFwKChzOiBvYmplY3QpOiBTaWdJZHggPT4ge1xuICAgICAgbGV0IHNpZHg6IFNpZ0lkeCA9IG5ldyBTaWdJZHgoKVxuICAgICAgc2lkeC5kZXNlcmlhbGl6ZShzLCBlbmNvZGluZylcbiAgICAgIHJldHVybiBzaWR4XG4gICAgfSlcbiAgICB0aGlzLnNpZ0NvdW50LndyaXRlVUludDMyQkUodGhpcy5zaWdJZHhzLmxlbmd0aCwgMClcbiAgfVxuXG4gIHByb3RlY3RlZCBzaWdDb3VudDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXG4gIHByb3RlY3RlZCBzaWdJZHhzOiBTaWdJZHhbXSA9IFtdIC8vIGlkeHMgb2Ygc2lnbmVycyBmcm9tIHV0eG9cblxuICBzdGF0aWMgY29tcGFyYXRvciA9XG4gICAgKCk6ICgoYTogT3BlcmF0aW9uLCBiOiBPcGVyYXRpb24pID0+IDEgfCAtMSB8IDApID0+XG4gICAgKGE6IE9wZXJhdGlvbiwgYjogT3BlcmF0aW9uKTogMSB8IC0xIHwgMCA9PiB7XG4gICAgICBjb25zdCBhb3V0aWQ6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxuICAgICAgYW91dGlkLndyaXRlVUludDMyQkUoYS5nZXRPcGVyYXRpb25JRCgpLCAwKVxuICAgICAgY29uc3QgYWJ1ZmY6IEJ1ZmZlciA9IGEudG9CdWZmZXIoKVxuXG4gICAgICBjb25zdCBib3V0aWQ6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxuICAgICAgYm91dGlkLndyaXRlVUludDMyQkUoYi5nZXRPcGVyYXRpb25JRCgpLCAwKVxuICAgICAgY29uc3QgYmJ1ZmY6IEJ1ZmZlciA9IGIudG9CdWZmZXIoKVxuXG4gICAgICBjb25zdCBhc29ydDogQnVmZmVyID0gQnVmZmVyLmNvbmNhdChcbiAgICAgICAgW2FvdXRpZCwgYWJ1ZmZdLFxuICAgICAgICBhb3V0aWQubGVuZ3RoICsgYWJ1ZmYubGVuZ3RoXG4gICAgICApXG4gICAgICBjb25zdCBic29ydDogQnVmZmVyID0gQnVmZmVyLmNvbmNhdChcbiAgICAgICAgW2JvdXRpZCwgYmJ1ZmZdLFxuICAgICAgICBib3V0aWQubGVuZ3RoICsgYmJ1ZmYubGVuZ3RoXG4gICAgICApXG4gICAgICByZXR1cm4gQnVmZmVyLmNvbXBhcmUoYXNvcnQsIGJzb3J0KSBhcyAxIHwgLTEgfCAwXG4gICAgfVxuXG4gIGFic3RyYWN0IGdldE9wZXJhdGlvbklEKCk6IG51bWJlclxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBhcnJheSBvZiBbW1NpZ0lkeF1dIGZvciB0aGlzIFtbT3BlcmF0aW9uXV1cbiAgICovXG4gIGdldFNpZ0lkeHMgPSAoKTogU2lnSWR4W10gPT4gdGhpcy5zaWdJZHhzXG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGNyZWRlbnRpYWwgSUQuXG4gICAqL1xuICBhYnN0cmFjdCBnZXRDcmVkZW50aWFsSUQoKTogbnVtYmVyXG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW5kIGFkZHMgYSBbW1NpZ0lkeF1dIHRvIHRoZSBbW09wZXJhdGlvbl1dLlxuICAgKlxuICAgKiBAcGFyYW0gYWRkcmVzc0lkeCBUaGUgaW5kZXggb2YgdGhlIGFkZHJlc3MgdG8gcmVmZXJlbmNlIGluIHRoZSBzaWduYXR1cmVzXG4gICAqIEBwYXJhbSBhZGRyZXNzIFRoZSBhZGRyZXNzIG9mIHRoZSBzb3VyY2Ugb2YgdGhlIHNpZ25hdHVyZVxuICAgKi9cbiAgYWRkU2lnbmF0dXJlSWR4ID0gKGFkZHJlc3NJZHg6IG51bWJlciwgYWRkcmVzczogQnVmZmVyKSA9PiB7XG4gICAgY29uc3Qgc2lnaWR4OiBTaWdJZHggPSBuZXcgU2lnSWR4KClcbiAgICBjb25zdCBiOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcbiAgICBiLndyaXRlVUludDMyQkUoYWRkcmVzc0lkeCwgMClcbiAgICBzaWdpZHguZnJvbUJ1ZmZlcihiKVxuICAgIHNpZ2lkeC5zZXRTb3VyY2UoYWRkcmVzcylcbiAgICB0aGlzLnNpZ0lkeHMucHVzaChzaWdpZHgpXG4gICAgdGhpcy5zaWdDb3VudC53cml0ZVVJbnQzMkJFKHRoaXMuc2lnSWR4cy5sZW5ndGgsIDApXG4gIH1cblxuICBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyID0gMCk6IG51bWJlciB7XG4gICAgdGhpcy5zaWdDb3VudCA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpXG4gICAgb2Zmc2V0ICs9IDRcbiAgICBjb25zdCBzaWdDb3VudDogbnVtYmVyID0gdGhpcy5zaWdDb3VudC5yZWFkVUludDMyQkUoMClcbiAgICB0aGlzLnNpZ0lkeHMgPSBbXVxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBzaWdDb3VudDsgaSsrKSB7XG4gICAgICBjb25zdCBzaWdpZHg6IFNpZ0lkeCA9IG5ldyBTaWdJZHgoKVxuICAgICAgY29uc3Qgc2lnYnVmZjogQnVmZmVyID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNClcbiAgICAgIHNpZ2lkeC5mcm9tQnVmZmVyKHNpZ2J1ZmYpXG4gICAgICBvZmZzZXQgKz0gNFxuICAgICAgdGhpcy5zaWdJZHhzLnB1c2goc2lnaWR4KVxuICAgIH1cbiAgICByZXR1cm4gb2Zmc2V0XG4gIH1cblxuICB0b0J1ZmZlcigpOiBCdWZmZXIge1xuICAgIHRoaXMuc2lnQ291bnQud3JpdGVVSW50MzJCRSh0aGlzLnNpZ0lkeHMubGVuZ3RoLCAwKVxuICAgIGxldCBic2l6ZTogbnVtYmVyID0gdGhpcy5zaWdDb3VudC5sZW5ndGhcbiAgICBjb25zdCBiYXJyOiBCdWZmZXJbXSA9IFt0aGlzLnNpZ0NvdW50XVxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCB0aGlzLnNpZ0lkeHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGI6IEJ1ZmZlciA9IHRoaXMuc2lnSWR4c1tgJHtpfWBdLnRvQnVmZmVyKClcbiAgICAgIGJhcnIucHVzaChiKVxuICAgICAgYnNpemUgKz0gYi5sZW5ndGhcbiAgICB9XG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoYmFyciwgYnNpemUpXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGJhc2UtNTggc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgW1tORlRNaW50T3BlcmF0aW9uXV0uXG4gICAqL1xuICB0b1N0cmluZygpOiBzdHJpbmcge1xuICAgIHJldHVybiBiaW50b29scy5idWZmZXJUb0I1OCh0aGlzLnRvQnVmZmVyKCkpXG4gIH1cbn1cblxuLyoqXG4gKiBBIGNsYXNzIHdoaWNoIGNvbnRhaW5zIGFuIFtbT3BlcmF0aW9uXV0gZm9yIHRyYW5zZmVycy5cbiAqXG4gKi9cbmV4cG9ydCBjbGFzcyBUcmFuc2ZlcmFibGVPcGVyYXRpb24gZXh0ZW5kcyBTZXJpYWxpemFibGUge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJUcmFuc2ZlcmFibGVPcGVyYXRpb25cIlxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZFxuXG4gIHNlcmlhbGl6ZShlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6IG9iamVjdCB7XG4gICAgbGV0IGZpZWxkczogb2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKVxuICAgIHJldHVybiB7XG4gICAgICAuLi5maWVsZHMsXG4gICAgICBhc3NldElEOiBzZXJpYWxpemF0aW9uLmVuY29kZXIodGhpcy5hc3NldElELCBlbmNvZGluZywgYnVmZmVyLCBjYjU4LCAzMiksXG4gICAgICB1dHhvSURzOiB0aGlzLnV0eG9JRHMubWFwKCh1KSA9PiB1LnNlcmlhbGl6ZShlbmNvZGluZykpLFxuICAgICAgb3BlcmF0aW9uOiB0aGlzLm9wZXJhdGlvbi5zZXJpYWxpemUoZW5jb2RpbmcpXG4gICAgfVxuICB9XG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpXG4gICAgdGhpcy5hc3NldElEID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxuICAgICAgZmllbGRzW1wiYXNzZXRJRFwiXSxcbiAgICAgIGVuY29kaW5nLFxuICAgICAgY2I1OCxcbiAgICAgIGJ1ZmZlcixcbiAgICAgIDMyXG4gICAgKVxuICAgIHRoaXMudXR4b0lEcyA9IGZpZWxkc1tcInV0eG9JRHNcIl0ubWFwKCh1OiBvYmplY3QpID0+IHtcbiAgICAgIGxldCB1dHhvaWQ6IFVUWE9JRCA9IG5ldyBVVFhPSUQoKVxuICAgICAgdXR4b2lkLmRlc2VyaWFsaXplKHUsIGVuY29kaW5nKVxuICAgICAgcmV0dXJuIHV0eG9pZFxuICAgIH0pXG4gICAgdGhpcy5vcGVyYXRpb24gPSBTZWxlY3RPcGVyYXRpb25DbGFzcyhmaWVsZHNbXCJvcGVyYXRpb25cIl1bXCJfdHlwZUlEXCJdKVxuICAgIHRoaXMub3BlcmF0aW9uLmRlc2VyaWFsaXplKGZpZWxkc1tcIm9wZXJhdGlvblwiXSwgZW5jb2RpbmcpXG4gIH1cblxuICBwcm90ZWN0ZWQgYXNzZXRJRDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDMyKVxuICBwcm90ZWN0ZWQgdXR4b0lEczogVVRYT0lEW10gPSBbXVxuICBwcm90ZWN0ZWQgb3BlcmF0aW9uOiBPcGVyYXRpb25cblxuICAvKipcbiAgICogUmV0dXJucyBhIGZ1bmN0aW9uIHVzZWQgdG8gc29ydCBhbiBhcnJheSBvZiBbW1RyYW5zZmVyYWJsZU9wZXJhdGlvbl1dc1xuICAgKi9cbiAgc3RhdGljIGNvbXBhcmF0b3IgPSAoKTogKChcbiAgICBhOiBUcmFuc2ZlcmFibGVPcGVyYXRpb24sXG4gICAgYjogVHJhbnNmZXJhYmxlT3BlcmF0aW9uXG4gICkgPT4gMSB8IC0xIHwgMCkgPT4ge1xuICAgIHJldHVybiBmdW5jdGlvbiAoXG4gICAgICBhOiBUcmFuc2ZlcmFibGVPcGVyYXRpb24sXG4gICAgICBiOiBUcmFuc2ZlcmFibGVPcGVyYXRpb25cbiAgICApOiAxIHwgLTEgfCAwIHtcbiAgICAgIHJldHVybiBCdWZmZXIuY29tcGFyZShhLnRvQnVmZmVyKCksIGIudG9CdWZmZXIoKSkgYXMgMSB8IC0xIHwgMFxuICAgIH1cbiAgfVxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYXNzZXRJRCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9LlxuICAgKi9cbiAgZ2V0QXNzZXRJRCA9ICgpOiBCdWZmZXIgPT4gdGhpcy5hc3NldElEXG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gYXJyYXkgb2YgVVRYT0lEcyBpbiB0aGlzIG9wZXJhdGlvbi5cbiAgICovXG4gIGdldFVUWE9JRHMgPSAoKTogVVRYT0lEW10gPT4gdGhpcy51dHhvSURzXG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIG9wZXJhdGlvblxuICAgKi9cbiAgZ2V0T3BlcmF0aW9uID0gKCk6IE9wZXJhdGlvbiA9PiB0aGlzLm9wZXJhdGlvblxuXG4gIGZyb21CdWZmZXIoYnl0ZXM6IEJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIgPSAwKTogbnVtYmVyIHtcbiAgICB0aGlzLmFzc2V0SUQgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyAzMilcbiAgICBvZmZzZXQgKz0gMzJcbiAgICBjb25zdCBudW11dHhvSURzOiBudW1iZXIgPSBiaW50b29sc1xuICAgICAgLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpXG4gICAgICAucmVhZFVJbnQzMkJFKDApXG4gICAgb2Zmc2V0ICs9IDRcbiAgICB0aGlzLnV0eG9JRHMgPSBbXVxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBudW11dHhvSURzOyBpKyspIHtcbiAgICAgIGNvbnN0IHV0eG9pZDogVVRYT0lEID0gbmV3IFVUWE9JRCgpXG4gICAgICBvZmZzZXQgPSB1dHhvaWQuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxuICAgICAgdGhpcy51dHhvSURzLnB1c2godXR4b2lkKVxuICAgIH1cbiAgICBjb25zdCBvcGlkOiBudW1iZXIgPSBiaW50b29sc1xuICAgICAgLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpXG4gICAgICAucmVhZFVJbnQzMkJFKDApXG4gICAgb2Zmc2V0ICs9IDRcbiAgICB0aGlzLm9wZXJhdGlvbiA9IFNlbGVjdE9wZXJhdGlvbkNsYXNzKG9waWQpXG4gICAgcmV0dXJuIHRoaXMub3BlcmF0aW9uLmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldClcbiAgfVxuXG4gIHRvQnVmZmVyKCk6IEJ1ZmZlciB7XG4gICAgY29uc3QgbnVtdXR4b0lEcyA9IEJ1ZmZlci5hbGxvYyg0KVxuICAgIG51bXV0eG9JRHMud3JpdGVVSW50MzJCRSh0aGlzLnV0eG9JRHMubGVuZ3RoLCAwKVxuICAgIGxldCBic2l6ZTogbnVtYmVyID0gdGhpcy5hc3NldElELmxlbmd0aCArIG51bXV0eG9JRHMubGVuZ3RoXG4gICAgY29uc3QgYmFycjogQnVmZmVyW10gPSBbdGhpcy5hc3NldElELCBudW11dHhvSURzXVxuICAgIHRoaXMudXR4b0lEcyA9IHRoaXMudXR4b0lEcy5zb3J0KFVUWE9JRC5jb21wYXJhdG9yKCkpXG4gICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IHRoaXMudXR4b0lEcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgYjogQnVmZmVyID0gdGhpcy51dHhvSURzW2Ake2l9YF0udG9CdWZmZXIoKVxuICAgICAgYmFyci5wdXNoKGIpXG4gICAgICBic2l6ZSArPSBiLmxlbmd0aFxuICAgIH1cbiAgICBjb25zdCBvcGlkOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcbiAgICBvcGlkLndyaXRlVUludDMyQkUodGhpcy5vcGVyYXRpb24uZ2V0T3BlcmF0aW9uSUQoKSwgMClcbiAgICBiYXJyLnB1c2gob3BpZClcbiAgICBic2l6ZSArPSBvcGlkLmxlbmd0aFxuICAgIGNvbnN0IGI6IEJ1ZmZlciA9IHRoaXMub3BlcmF0aW9uLnRvQnVmZmVyKClcbiAgICBic2l6ZSArPSBiLmxlbmd0aFxuICAgIGJhcnIucHVzaChiKVxuICAgIHJldHVybiBCdWZmZXIuY29uY2F0KGJhcnIsIGJzaXplKVxuICB9XG5cbiAgY29uc3RydWN0b3IoXG4gICAgYXNzZXRJRDogQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIHV0eG9pZHM6IFVUWE9JRFtdIHwgc3RyaW5nW10gfCBCdWZmZXJbXSA9IHVuZGVmaW5lZCxcbiAgICBvcGVyYXRpb246IE9wZXJhdGlvbiA9IHVuZGVmaW5lZFxuICApIHtcbiAgICBzdXBlcigpXG4gICAgaWYgKFxuICAgICAgdHlwZW9mIGFzc2V0SUQgIT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICAgIGFzc2V0SUQubGVuZ3RoID09PSBBVk1Db25zdGFudHMuQVNTRVRJRExFTiAmJlxuICAgICAgb3BlcmF0aW9uIGluc3RhbmNlb2YgT3BlcmF0aW9uICYmXG4gICAgICB0eXBlb2YgdXR4b2lkcyAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgICAgQXJyYXkuaXNBcnJheSh1dHhvaWRzKVxuICAgICkge1xuICAgICAgdGhpcy5hc3NldElEID0gYXNzZXRJRFxuICAgICAgdGhpcy5vcGVyYXRpb24gPSBvcGVyYXRpb25cbiAgICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCB1dHhvaWRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHV0eG9pZDogVVRYT0lEID0gbmV3IFVUWE9JRCgpXG4gICAgICAgIGlmICh0eXBlb2YgdXR4b2lkc1tgJHtpfWBdID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgdXR4b2lkLmZyb21TdHJpbmcodXR4b2lkc1tgJHtpfWBdIGFzIHN0cmluZylcbiAgICAgICAgfSBlbHNlIGlmICh1dHhvaWRzW2Ake2l9YF0gaW5zdGFuY2VvZiBCdWZmZXIpIHtcbiAgICAgICAgICB1dHhvaWQuZnJvbUJ1ZmZlcih1dHhvaWRzW2Ake2l9YF0gYXMgQnVmZmVyKVxuICAgICAgICB9IGVsc2UgaWYgKHV0eG9pZHNbYCR7aX1gXSBpbnN0YW5jZW9mIFVUWE9JRCkge1xuICAgICAgICAgIHV0eG9pZC5mcm9tU3RyaW5nKHV0eG9pZHNbYCR7aX1gXS50b1N0cmluZygpKSAvLyBjbG9uZVxuICAgICAgICB9XG4gICAgICAgIHRoaXMudXR4b0lEcy5wdXNoKHV0eG9pZClcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBBbiBbW09wZXJhdGlvbl1dIGNsYXNzIHdoaWNoIHNwZWNpZmllcyBhIFNFQ1AyNTZrMSBNaW50IE9wLlxuICovXG5leHBvcnQgY2xhc3MgU0VDUE1pbnRPcGVyYXRpb24gZXh0ZW5kcyBPcGVyYXRpb24ge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJTRUNQTWludE9wZXJhdGlvblwiXG4gIHByb3RlY3RlZCBfY29kZWNJRCA9IEFWTUNvbnN0YW50cy5MQVRFU1RDT0RFQ1xuICBwcm90ZWN0ZWQgX3R5cGVJRCA9XG4gICAgdGhpcy5fY29kZWNJRCA9PT0gMFxuICAgICAgPyBBVk1Db25zdGFudHMuU0VDUE1JTlRPUElEXG4gICAgICA6IEFWTUNvbnN0YW50cy5TRUNQTUlOVE9QSURfQ09ERUNPTkVcblxuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOiBvYmplY3Qge1xuICAgIGxldCBmaWVsZHM6IG9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZylcbiAgICByZXR1cm4ge1xuICAgICAgLi4uZmllbGRzLFxuICAgICAgbWludE91dHB1dDogdGhpcy5taW50T3V0cHV0LnNlcmlhbGl6ZShlbmNvZGluZyksXG4gICAgICB0cmFuc2Zlck91dHB1dHM6IHRoaXMudHJhbnNmZXJPdXRwdXQuc2VyaWFsaXplKGVuY29kaW5nKVxuICAgIH1cbiAgfVxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxuICAgIHRoaXMubWludE91dHB1dCA9IG5ldyBTRUNQTWludE91dHB1dCgpXG4gICAgdGhpcy5taW50T3V0cHV0LmRlc2VyaWFsaXplKGZpZWxkc1tcIm1pbnRPdXRwdXRcIl0sIGVuY29kaW5nKVxuICAgIHRoaXMudHJhbnNmZXJPdXRwdXQgPSBuZXcgU0VDUFRyYW5zZmVyT3V0cHV0KClcbiAgICB0aGlzLnRyYW5zZmVyT3V0cHV0LmRlc2VyaWFsaXplKGZpZWxkc1tcInRyYW5zZmVyT3V0cHV0c1wiXSwgZW5jb2RpbmcpXG4gIH1cblxuICBwcm90ZWN0ZWQgbWludE91dHB1dDogU0VDUE1pbnRPdXRwdXQgPSB1bmRlZmluZWRcbiAgcHJvdGVjdGVkIHRyYW5zZmVyT3V0cHV0OiBTRUNQVHJhbnNmZXJPdXRwdXQgPSB1bmRlZmluZWRcblxuICAvKipcbiAgICogU2V0IHRoZSBjb2RlY0lEXG4gICAqXG4gICAqIEBwYXJhbSBjb2RlY0lEIFRoZSBjb2RlY0lEIHRvIHNldFxuICAgKi9cbiAgc2V0Q29kZWNJRChjb2RlY0lEOiBudW1iZXIpOiB2b2lkIHtcbiAgICBpZiAoY29kZWNJRCAhPT0gMCAmJiBjb2RlY0lEICE9PSAxKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IENvZGVjSWRFcnJvcihcbiAgICAgICAgXCJFcnJvciAtIFNFQ1BNaW50T3BlcmF0aW9uLnNldENvZGVjSUQ6IGludmFsaWQgY29kZWNJRC4gVmFsaWQgY29kZWNJRHMgYXJlIDAgYW5kIDEuXCJcbiAgICAgIClcbiAgICB9XG4gICAgdGhpcy5fY29kZWNJRCA9IGNvZGVjSURcbiAgICB0aGlzLl90eXBlSUQgPVxuICAgICAgdGhpcy5fY29kZWNJRCA9PT0gMFxuICAgICAgICA/IEFWTUNvbnN0YW50cy5TRUNQTUlOVE9QSURcbiAgICAgICAgOiBBVk1Db25zdGFudHMuU0VDUE1JTlRPUElEX0NPREVDT05FXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgb3BlcmF0aW9uIElELlxuICAgKi9cbiAgZ2V0T3BlcmF0aW9uSUQoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdHlwZUlEXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgY3JlZGVudGlhbCBJRC5cbiAgICovXG4gIGdldENyZWRlbnRpYWxJRCgpOiBudW1iZXIge1xuICAgIGlmICh0aGlzLl9jb2RlY0lEID09PSAwKSB7XG4gICAgICByZXR1cm4gQVZNQ29uc3RhbnRzLlNFQ1BDUkVERU5USUFMXG4gICAgfSBlbHNlIGlmICh0aGlzLl9jb2RlY0lEID09PSAxKSB7XG4gICAgICByZXR1cm4gQVZNQ29uc3RhbnRzLlNFQ1BDUkVERU5USUFMX0NPREVDT05FXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIFtbU0VDUE1pbnRPdXRwdXRdXSB0byBiZSBwcm9kdWNlZCBieSB0aGlzIG9wZXJhdGlvbi5cbiAgICovXG4gIGdldE1pbnRPdXRwdXQoKTogU0VDUE1pbnRPdXRwdXQge1xuICAgIHJldHVybiB0aGlzLm1pbnRPdXRwdXRcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIFtbU0VDUFRyYW5zZmVyT3V0cHV0XV0gdG8gYmUgcHJvZHVjZWQgYnkgdGhpcyBvcGVyYXRpb24uXG4gICAqL1xuICBnZXRUcmFuc2Zlck91dHB1dCgpOiBTRUNQVHJhbnNmZXJPdXRwdXQge1xuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyT3V0cHV0XG4gIH1cblxuICAvKipcbiAgICogUG9wdWF0ZXMgdGhlIGluc3RhbmNlIGZyb20gYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRpbmcgdGhlIFtbU0VDUE1pbnRPcGVyYXRpb25dXSBhbmQgcmV0dXJucyB0aGUgdXBkYXRlZCBvZmZzZXQuXG4gICAqL1xuICBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyID0gMCk6IG51bWJlciB7XG4gICAgb2Zmc2V0ID0gc3VwZXIuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxuICAgIHRoaXMubWludE91dHB1dCA9IG5ldyBTRUNQTWludE91dHB1dCgpXG4gICAgb2Zmc2V0ID0gdGhpcy5taW50T3V0cHV0LmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldClcbiAgICB0aGlzLnRyYW5zZmVyT3V0cHV0ID0gbmV3IFNFQ1BUcmFuc2Zlck91dHB1dCgpXG4gICAgb2Zmc2V0ID0gdGhpcy50cmFuc2Zlck91dHB1dC5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXG4gICAgcmV0dXJuIG9mZnNldFxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGJ1ZmZlciByZXByZXNlbnRpbmcgdGhlIFtbU0VDUE1pbnRPcGVyYXRpb25dXSBpbnN0YW5jZS5cbiAgICovXG4gIHRvQnVmZmVyKCk6IEJ1ZmZlciB7XG4gICAgY29uc3Qgc3VwZXJidWZmOiBCdWZmZXIgPSBzdXBlci50b0J1ZmZlcigpXG4gICAgY29uc3QgbWludG91dEJ1ZmY6IEJ1ZmZlciA9IHRoaXMubWludE91dHB1dC50b0J1ZmZlcigpXG4gICAgY29uc3QgdHJhbnNmZXJPdXRCdWZmOiBCdWZmZXIgPSB0aGlzLnRyYW5zZmVyT3V0cHV0LnRvQnVmZmVyKClcbiAgICBjb25zdCBic2l6ZTogbnVtYmVyID1cbiAgICAgIHN1cGVyYnVmZi5sZW5ndGggKyBtaW50b3V0QnVmZi5sZW5ndGggKyB0cmFuc2Zlck91dEJ1ZmYubGVuZ3RoXG5cbiAgICBjb25zdCBiYXJyOiBCdWZmZXJbXSA9IFtzdXBlcmJ1ZmYsIG1pbnRvdXRCdWZmLCB0cmFuc2Zlck91dEJ1ZmZdXG5cbiAgICByZXR1cm4gQnVmZmVyLmNvbmNhdChiYXJyLCBic2l6ZSlcbiAgfVxuXG4gIC8qKlxuICAgKiBBbiBbW09wZXJhdGlvbl1dIGNsYXNzIHdoaWNoIG1pbnRzIG5ldyB0b2tlbnMgb24gYW4gYXNzZXRJRC5cbiAgICpcbiAgICogQHBhcmFtIG1pbnRPdXRwdXQgVGhlIFtbU0VDUE1pbnRPdXRwdXRdXSB0aGF0IHdpbGwgYmUgcHJvZHVjZWQgYnkgdGhpcyB0cmFuc2FjdGlvbi5cbiAgICogQHBhcmFtIHRyYW5zZmVyT3V0cHV0IEEgW1tTRUNQVHJhbnNmZXJPdXRwdXRdXSB0aGF0IHdpbGwgYmUgcHJvZHVjZWQgZnJvbSB0aGlzIG1pbnRpbmcgb3BlcmF0aW9uLlxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgbWludE91dHB1dDogU0VDUE1pbnRPdXRwdXQgPSB1bmRlZmluZWQsXG4gICAgdHJhbnNmZXJPdXRwdXQ6IFNFQ1BUcmFuc2Zlck91dHB1dCA9IHVuZGVmaW5lZFxuICApIHtcbiAgICBzdXBlcigpXG4gICAgaWYgKHR5cGVvZiBtaW50T3V0cHV0ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aGlzLm1pbnRPdXRwdXQgPSBtaW50T3V0cHV0XG4gICAgfVxuICAgIGlmICh0eXBlb2YgdHJhbnNmZXJPdXRwdXQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHRoaXMudHJhbnNmZXJPdXRwdXQgPSB0cmFuc2Zlck91dHB1dFxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEFuIFtbT3BlcmF0aW9uXV0gY2xhc3Mgd2hpY2ggc3BlY2lmaWVzIGEgTkZUIE1pbnQgT3AuXG4gKi9cbmV4cG9ydCBjbGFzcyBORlRNaW50T3BlcmF0aW9uIGV4dGVuZHMgT3BlcmF0aW9uIHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiTkZUTWludE9wZXJhdGlvblwiXG4gIHByb3RlY3RlZCBfY29kZWNJRCA9IEFWTUNvbnN0YW50cy5MQVRFU1RDT0RFQ1xuICBwcm90ZWN0ZWQgX3R5cGVJRCA9XG4gICAgdGhpcy5fY29kZWNJRCA9PT0gMFxuICAgICAgPyBBVk1Db25zdGFudHMuTkZUTUlOVE9QSURcbiAgICAgIDogQVZNQ29uc3RhbnRzLk5GVE1JTlRPUElEX0NPREVDVFdPXG5cbiAgc2VyaWFsaXplKGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKTogb2JqZWN0IHtcbiAgICBjb25zdCBmaWVsZHM6IG9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZylcbiAgICByZXR1cm4ge1xuICAgICAgLi4uZmllbGRzLFxuICAgICAgZ3JvdXBJRDogc2VyaWFsaXphdGlvbi5lbmNvZGVyKFxuICAgICAgICB0aGlzLmdyb3VwSUQsXG4gICAgICAgIGVuY29kaW5nLFxuICAgICAgICBidWZmZXIsXG4gICAgICAgIGRlY2ltYWxTdHJpbmcsXG4gICAgICAgIDRcbiAgICAgICksXG4gICAgICBwYXlsb2FkOiBzZXJpYWxpemF0aW9uLmVuY29kZXIodGhpcy5wYXlsb2FkLCBlbmNvZGluZywgYnVmZmVyLCBoZXgpLFxuICAgICAgb3V0cHV0T3duZXJzOiB0aGlzLm91dHB1dE93bmVycy5tYXAoKG8pID0+IG8uc2VyaWFsaXplKGVuY29kaW5nKSlcbiAgICB9XG4gIH1cbiAgZGVzZXJpYWxpemUoZmllbGRzOiBvYmplY3QsIGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcbiAgICB0aGlzLmdyb3VwSUQgPSBzZXJpYWxpemF0aW9uLmRlY29kZXIoXG4gICAgICBmaWVsZHNbXCJncm91cElEXCJdLFxuICAgICAgZW5jb2RpbmcsXG4gICAgICBkZWNpbWFsU3RyaW5nLFxuICAgICAgYnVmZmVyLFxuICAgICAgNFxuICAgIClcbiAgICB0aGlzLnBheWxvYWQgPSBzZXJpYWxpemF0aW9uLmRlY29kZXIoXG4gICAgICBmaWVsZHNbXCJwYXlsb2FkXCJdLFxuICAgICAgZW5jb2RpbmcsXG4gICAgICBoZXgsXG4gICAgICBidWZmZXJcbiAgICApXG4gICAgLy8gdGhpcy5vdXRwdXRPd25lcnMgPSBmaWVsZHNbXCJvdXRwdXRPd25lcnNcIl0ubWFwKChvOiBORlRNaW50T3V0cHV0KSA9PiB7XG4gICAgLy8gICBsZXQgb286IE5GVE1pbnRPdXRwdXQgPSBuZXcgTkZUTWludE91dHB1dCgpXG4gICAgLy8gICBvby5kZXNlcmlhbGl6ZShvLCBlbmNvZGluZylcbiAgICAvLyAgIHJldHVybiBvb1xuICAgIC8vIH0pXG4gICAgdGhpcy5vdXRwdXRPd25lcnMgPSBmaWVsZHNbXCJvdXRwdXRPd25lcnNcIl0ubWFwKFxuICAgICAgKG86IG9iamVjdCk6IE91dHB1dE93bmVycyA9PiB7XG4gICAgICAgIGxldCBvbzogT3V0cHV0T3duZXJzID0gbmV3IE91dHB1dE93bmVycygpXG4gICAgICAgIG9vLmRlc2VyaWFsaXplKG8sIGVuY29kaW5nKVxuICAgICAgICByZXR1cm4gb29cbiAgICAgIH1cbiAgICApXG4gIH1cblxuICBwcm90ZWN0ZWQgZ3JvdXBJRDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXG4gIHByb3RlY3RlZCBwYXlsb2FkOiBCdWZmZXJcbiAgcHJvdGVjdGVkIG91dHB1dE93bmVyczogT3V0cHV0T3duZXJzW10gPSBbXVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIGNvZGVjSURcbiAgICpcbiAgICogQHBhcmFtIGNvZGVjSUQgVGhlIGNvZGVjSUQgdG8gc2V0XG4gICAqL1xuICBzZXRDb2RlY0lEKGNvZGVjSUQ6IG51bWJlcik6IHZvaWQge1xuICAgIGlmIChjb2RlY0lEICE9PSAwICYmIGNvZGVjSUQgIT09IDEpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgQ29kZWNJZEVycm9yKFxuICAgICAgICBcIkVycm9yIC0gTkZUTWludE9wZXJhdGlvbi5zZXRDb2RlY0lEOiBpbnZhbGlkIGNvZGVjSUQuIFZhbGlkIGNvZGVjSURzIGFyZSAwIGFuZCAxLlwiXG4gICAgICApXG4gICAgfVxuICAgIHRoaXMuX2NvZGVjSUQgPSBjb2RlY0lEXG4gICAgdGhpcy5fdHlwZUlEID1cbiAgICAgIHRoaXMuX2NvZGVjSUQgPT09IDBcbiAgICAgICAgPyBBVk1Db25zdGFudHMuTkZUTUlOVE9QSURcbiAgICAgICAgOiBBVk1Db25zdGFudHMuTkZUTUlOVE9QSURfQ09ERUNUV09cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBvcGVyYXRpb24gSUQuXG4gICAqL1xuICBnZXRPcGVyYXRpb25JRCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl90eXBlSURcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBjcmVkZW50aWFsIElELlxuICAgKi9cbiAgZ2V0Q3JlZGVudGlhbElEID0gKCk6IG51bWJlciA9PiB7XG4gICAgaWYgKHRoaXMuX2NvZGVjSUQgPT09IDApIHtcbiAgICAgIHJldHVybiBBVk1Db25zdGFudHMuTkZUQ1JFREVOVElBTFxuICAgIH0gZWxzZSBpZiAodGhpcy5fY29kZWNJRCA9PT0gMSkge1xuICAgICAgcmV0dXJuIEFWTUNvbnN0YW50cy5ORlRDUkVERU5USUFMX0NPREVDVFdPXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHBheWxvYWQuXG4gICAqL1xuICBnZXRHcm91cElEID0gKCk6IEJ1ZmZlciA9PiB7XG4gICAgcmV0dXJuIGJpbnRvb2xzLmNvcHlGcm9tKHRoaXMuZ3JvdXBJRCwgMClcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBwYXlsb2FkLlxuICAgKi9cbiAgZ2V0UGF5bG9hZCA9ICgpOiBCdWZmZXIgPT4ge1xuICAgIHJldHVybiBiaW50b29scy5jb3B5RnJvbSh0aGlzLnBheWxvYWQsIDApXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgcGF5bG9hZCdzIHJhdyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB3aXRoIGxlbmd0aCBwcmVwZW5kZWQsIGZvciB1c2Ugd2l0aCBbW1BheWxvYWRCYXNlXV0ncyBmcm9tQnVmZmVyXG4gICAqL1xuICBnZXRQYXlsb2FkQnVmZmVyID0gKCk6IEJ1ZmZlciA9PiB7XG4gICAgbGV0IHBheWxvYWRsZW46IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxuICAgIHBheWxvYWRsZW4ud3JpdGVVSW50MzJCRSh0aGlzLnBheWxvYWQubGVuZ3RoLCAwKVxuICAgIHJldHVybiBCdWZmZXIuY29uY2F0KFtwYXlsb2FkbGVuLCBiaW50b29scy5jb3B5RnJvbSh0aGlzLnBheWxvYWQsIDApXSlcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBvdXRwdXRPd25lcnMuXG4gICAqL1xuICBnZXRPdXRwdXRPd25lcnMgPSAoKTogT3V0cHV0T3duZXJzW10gPT4ge1xuICAgIHJldHVybiB0aGlzLm91dHB1dE93bmVyc1xuICB9XG5cbiAgLyoqXG4gICAqIFBvcHVhdGVzIHRoZSBpbnN0YW5jZSBmcm9tIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50aW5nIHRoZSBbW05GVE1pbnRPcGVyYXRpb25dXSBhbmQgcmV0dXJucyB0aGUgdXBkYXRlZCBvZmZzZXQuXG4gICAqL1xuICBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyID0gMCk6IG51bWJlciB7XG4gICAgb2Zmc2V0ID0gc3VwZXIuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxuICAgIHRoaXMuZ3JvdXBJRCA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpXG4gICAgb2Zmc2V0ICs9IDRcbiAgICBsZXQgcGF5bG9hZExlbjogbnVtYmVyID0gYmludG9vbHNcbiAgICAgIC5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KVxuICAgICAgLnJlYWRVSW50MzJCRSgwKVxuICAgIG9mZnNldCArPSA0XG4gICAgdGhpcy5wYXlsb2FkID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgcGF5bG9hZExlbilcbiAgICBvZmZzZXQgKz0gcGF5bG9hZExlblxuICAgIGxldCBudW1vdXRwdXRzOiBudW1iZXIgPSBiaW50b29sc1xuICAgICAgLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpXG4gICAgICAucmVhZFVJbnQzMkJFKDApXG4gICAgb2Zmc2V0ICs9IDRcbiAgICB0aGlzLm91dHB1dE93bmVycyA9IFtdXG4gICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IG51bW91dHB1dHM7IGkrKykge1xuICAgICAgbGV0IG91dHB1dE93bmVyOiBPdXRwdXRPd25lcnMgPSBuZXcgT3V0cHV0T3duZXJzKClcbiAgICAgIG9mZnNldCA9IG91dHB1dE93bmVyLmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldClcbiAgICAgIHRoaXMub3V0cHV0T3duZXJzLnB1c2gob3V0cHV0T3duZXIpXG4gICAgfVxuICAgIHJldHVybiBvZmZzZXRcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBidWZmZXIgcmVwcmVzZW50aW5nIHRoZSBbW05GVE1pbnRPcGVyYXRpb25dXSBpbnN0YW5jZS5cbiAgICovXG4gIHRvQnVmZmVyKCk6IEJ1ZmZlciB7XG4gICAgY29uc3Qgc3VwZXJidWZmOiBCdWZmZXIgPSBzdXBlci50b0J1ZmZlcigpXG4gICAgY29uc3QgcGF5bG9hZGxlbjogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXG4gICAgcGF5bG9hZGxlbi53cml0ZVVJbnQzMkJFKHRoaXMucGF5bG9hZC5sZW5ndGgsIDApXG5cbiAgICBjb25zdCBvdXRwdXRvd25lcnNsZW46IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxuICAgIG91dHB1dG93bmVyc2xlbi53cml0ZVVJbnQzMkJFKHRoaXMub3V0cHV0T3duZXJzLmxlbmd0aCwgMClcblxuICAgIGxldCBic2l6ZTogbnVtYmVyID1cbiAgICAgIHN1cGVyYnVmZi5sZW5ndGggK1xuICAgICAgdGhpcy5ncm91cElELmxlbmd0aCArXG4gICAgICBwYXlsb2FkbGVuLmxlbmd0aCArXG4gICAgICB0aGlzLnBheWxvYWQubGVuZ3RoICtcbiAgICAgIG91dHB1dG93bmVyc2xlbi5sZW5ndGhcblxuICAgIGNvbnN0IGJhcnI6IEJ1ZmZlcltdID0gW1xuICAgICAgc3VwZXJidWZmLFxuICAgICAgdGhpcy5ncm91cElELFxuICAgICAgcGF5bG9hZGxlbixcbiAgICAgIHRoaXMucGF5bG9hZCxcbiAgICAgIG91dHB1dG93bmVyc2xlblxuICAgIF1cblxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCB0aGlzLm91dHB1dE93bmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgbGV0IGI6IEJ1ZmZlciA9IHRoaXMub3V0cHV0T3duZXJzW2Ake2l9YF0udG9CdWZmZXIoKVxuICAgICAgYmFyci5wdXNoKGIpXG4gICAgICBic2l6ZSArPSBiLmxlbmd0aFxuICAgIH1cblxuICAgIHJldHVybiBCdWZmZXIuY29uY2F0KGJhcnIsIGJzaXplKVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBiYXNlLTU4IHN0cmluZyByZXByZXNlbnRpbmcgdGhlIFtbTkZUTWludE9wZXJhdGlvbl1dLlxuICAgKi9cbiAgdG9TdHJpbmcoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYmludG9vbHMuYnVmZmVyVG9CNTgodGhpcy50b0J1ZmZlcigpKVxuICB9XG5cbiAgLyoqXG4gICAqIEFuIFtbT3BlcmF0aW9uXV0gY2xhc3Mgd2hpY2ggY29udGFpbnMgYW4gTkZUIG9uIGFuIGFzc2V0SUQuXG4gICAqXG4gICAqIEBwYXJhbSBncm91cElEIFRoZSBncm91cCB0byB3aGljaCB0byBpc3N1ZSB0aGUgTkZUIE91dHB1dFxuICAgKiBAcGFyYW0gcGF5bG9hZCBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9mIHRoZSBORlQgcGF5bG9hZFxuICAgKiBAcGFyYW0gb3V0cHV0T3duZXJzIEFuIGFycmF5IG9mIG91dHB1dE93bmVyc1xuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgZ3JvdXBJRDogbnVtYmVyID0gdW5kZWZpbmVkLFxuICAgIHBheWxvYWQ6IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBvdXRwdXRPd25lcnM6IE91dHB1dE93bmVyc1tdID0gdW5kZWZpbmVkXG4gICkge1xuICAgIHN1cGVyKClcbiAgICBpZiAoXG4gICAgICB0eXBlb2YgZ3JvdXBJRCAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgICAgdHlwZW9mIHBheWxvYWQgIT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICAgIG91dHB1dE93bmVycy5sZW5ndGhcbiAgICApIHtcbiAgICAgIHRoaXMuZ3JvdXBJRC53cml0ZVVJbnQzMkJFKGdyb3VwSUQgPyBncm91cElEIDogMCwgMClcbiAgICAgIHRoaXMucGF5bG9hZCA9IHBheWxvYWRcbiAgICAgIHRoaXMub3V0cHV0T3duZXJzID0gb3V0cHV0T3duZXJzXG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQSBbW09wZXJhdGlvbl1dIGNsYXNzIHdoaWNoIHNwZWNpZmllcyBhIE5GVCBUcmFuc2ZlciBPcC5cbiAqL1xuZXhwb3J0IGNsYXNzIE5GVFRyYW5zZmVyT3BlcmF0aW9uIGV4dGVuZHMgT3BlcmF0aW9uIHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiTkZUVHJhbnNmZXJPcGVyYXRpb25cIlxuICBwcm90ZWN0ZWQgX2NvZGVjSUQgPSBBVk1Db25zdGFudHMuTEFURVNUQ09ERUNcbiAgcHJvdGVjdGVkIF90eXBlSUQgPVxuICAgIHRoaXMuX2NvZGVjSUQgPT09IDBcbiAgICAgID8gQVZNQ29uc3RhbnRzLk5GVFhGRVJPUElEXG4gICAgICA6IEFWTUNvbnN0YW50cy5ORlRYRkVST1BJRF9DT0RFQ1RXT1xuXG4gIHNlcmlhbGl6ZShlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6IG9iamVjdCB7XG4gICAgY29uc3QgZmllbGRzOiBvYmplY3QgPSBzdXBlci5zZXJpYWxpemUoZW5jb2RpbmcpXG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLmZpZWxkcyxcbiAgICAgIG91dHB1dDogdGhpcy5vdXRwdXQuc2VyaWFsaXplKGVuY29kaW5nKVxuICAgIH1cbiAgfVxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxuICAgIHRoaXMub3V0cHV0ID0gbmV3IE5GVFRyYW5zZmVyT3V0cHV0KClcbiAgICB0aGlzLm91dHB1dC5kZXNlcmlhbGl6ZShmaWVsZHNbXCJvdXRwdXRcIl0sIGVuY29kaW5nKVxuICB9XG5cbiAgcHJvdGVjdGVkIG91dHB1dDogTkZUVHJhbnNmZXJPdXRwdXRcblxuICAvKipcbiAgICogU2V0IHRoZSBjb2RlY0lEXG4gICAqXG4gICAqIEBwYXJhbSBjb2RlY0lEIFRoZSBjb2RlY0lEIHRvIHNldFxuICAgKi9cbiAgc2V0Q29kZWNJRChjb2RlY0lEOiBudW1iZXIpOiB2b2lkIHtcbiAgICBpZiAoY29kZWNJRCAhPT0gMCAmJiBjb2RlY0lEICE9PSAxKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IENvZGVjSWRFcnJvcihcbiAgICAgICAgXCJFcnJvciAtIE5GVFRyYW5zZmVyT3BlcmF0aW9uLnNldENvZGVjSUQ6IGludmFsaWQgY29kZWNJRC4gVmFsaWQgY29kZWNJRHMgYXJlIDAgYW5kIDEuXCJcbiAgICAgIClcbiAgICB9XG4gICAgdGhpcy5fY29kZWNJRCA9IGNvZGVjSURcbiAgICB0aGlzLl90eXBlSUQgPVxuICAgICAgdGhpcy5fY29kZWNJRCA9PT0gMFxuICAgICAgICA/IEFWTUNvbnN0YW50cy5ORlRYRkVST1BJRFxuICAgICAgICA6IEFWTUNvbnN0YW50cy5ORlRYRkVST1BJRF9DT0RFQ1RXT1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIG9wZXJhdGlvbiBJRC5cbiAgICovXG4gIGdldE9wZXJhdGlvbklEKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3R5cGVJRFxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGNyZWRlbnRpYWwgSUQuXG4gICAqL1xuICBnZXRDcmVkZW50aWFsSUQoKTogbnVtYmVyIHtcbiAgICBpZiAodGhpcy5fY29kZWNJRCA9PT0gMCkge1xuICAgICAgcmV0dXJuIEFWTUNvbnN0YW50cy5ORlRDUkVERU5USUFMXG4gICAgfSBlbHNlIGlmICh0aGlzLl9jb2RlY0lEID09PSAxKSB7XG4gICAgICByZXR1cm4gQVZNQ29uc3RhbnRzLk5GVENSRURFTlRJQUxfQ09ERUNUV09cbiAgICB9XG4gIH1cblxuICBnZXRPdXRwdXQgPSAoKTogTkZUVHJhbnNmZXJPdXRwdXQgPT4gdGhpcy5vdXRwdXRcblxuICAvKipcbiAgICogUG9wdWF0ZXMgdGhlIGluc3RhbmNlIGZyb20gYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRpbmcgdGhlIFtbTkZUVHJhbnNmZXJPcGVyYXRpb25dXSBhbmQgcmV0dXJucyB0aGUgdXBkYXRlZCBvZmZzZXQuXG4gICAqL1xuICBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyID0gMCk6IG51bWJlciB7XG4gICAgb2Zmc2V0ID0gc3VwZXIuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxuICAgIHRoaXMub3V0cHV0ID0gbmV3IE5GVFRyYW5zZmVyT3V0cHV0KClcbiAgICByZXR1cm4gdGhpcy5vdXRwdXQuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGJ1ZmZlciByZXByZXNlbnRpbmcgdGhlIFtbTkZUVHJhbnNmZXJPcGVyYXRpb25dXSBpbnN0YW5jZS5cbiAgICovXG4gIHRvQnVmZmVyKCk6IEJ1ZmZlciB7XG4gICAgY29uc3Qgc3VwZXJidWZmOiBCdWZmZXIgPSBzdXBlci50b0J1ZmZlcigpXG4gICAgY29uc3Qgb3V0YnVmZjogQnVmZmVyID0gdGhpcy5vdXRwdXQudG9CdWZmZXIoKVxuICAgIGNvbnN0IGJzaXplOiBudW1iZXIgPSBzdXBlcmJ1ZmYubGVuZ3RoICsgb3V0YnVmZi5sZW5ndGhcbiAgICBjb25zdCBiYXJyOiBCdWZmZXJbXSA9IFtzdXBlcmJ1ZmYsIG91dGJ1ZmZdXG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoYmFyciwgYnNpemUpXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGJhc2UtNTggc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgW1tORlRUcmFuc2Zlck9wZXJhdGlvbl1dLlxuICAgKi9cbiAgdG9TdHJpbmcoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYmludG9vbHMuYnVmZmVyVG9CNTgodGhpcy50b0J1ZmZlcigpKVxuICB9XG5cbiAgLyoqXG4gICAqIEFuIFtbT3BlcmF0aW9uXV0gY2xhc3Mgd2hpY2ggY29udGFpbnMgYW4gTkZUIG9uIGFuIGFzc2V0SUQuXG4gICAqXG4gICAqIEBwYXJhbSBvdXRwdXQgQW4gW1tORlRUcmFuc2Zlck91dHB1dF1dXG4gICAqL1xuICBjb25zdHJ1Y3RvcihvdXRwdXQ6IE5GVFRyYW5zZmVyT3V0cHV0ID0gdW5kZWZpbmVkKSB7XG4gICAgc3VwZXIoKVxuICAgIGlmICh0eXBlb2Ygb3V0cHV0ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aGlzLm91dHB1dCA9IG91dHB1dFxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIENsYXNzIGZvciByZXByZXNlbnRpbmcgYSBVVFhPSUQgdXNlZCBpbiBbW1RyYW5zZmVyYWJsZU9wXV0gdHlwZXNcbiAqL1xuZXhwb3J0IGNsYXNzIFVUWE9JRCBleHRlbmRzIE5CeXRlcyB7XG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIlVUWE9JRFwiXG4gIHByb3RlY3RlZCBfdHlwZUlEID0gdW5kZWZpbmVkXG5cbiAgLy9zZXJpYWxpemUgYW5kIGRlc2VyaWFsaXplIGJvdGggYXJlIGluaGVyaXRlZFxuXG4gIHByb3RlY3RlZCBieXRlcyA9IEJ1ZmZlci5hbGxvYygzNilcbiAgcHJvdGVjdGVkIGJzaXplID0gMzZcblxuICAvKipcbiAgICogUmV0dXJucyBhIGZ1bmN0aW9uIHVzZWQgdG8gc29ydCBhbiBhcnJheSBvZiBbW1VUWE9JRF1dc1xuICAgKi9cbiAgc3RhdGljIGNvbXBhcmF0b3IgPVxuICAgICgpOiAoKGE6IFVUWE9JRCwgYjogVVRYT0lEKSA9PiAxIHwgLTEgfCAwKSA9PlxuICAgIChhOiBVVFhPSUQsIGI6IFVUWE9JRCk6IDEgfCAtMSB8IDAgPT5cbiAgICAgIEJ1ZmZlci5jb21wYXJlKGEudG9CdWZmZXIoKSwgYi50b0J1ZmZlcigpKSBhcyAxIHwgLTEgfCAwXG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBiYXNlLTU4IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBbW1VUWE9JRF1dLlxuICAgKi9cbiAgdG9TdHJpbmcoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYmludG9vbHMuY2I1OEVuY29kZSh0aGlzLnRvQnVmZmVyKCkpXG4gIH1cblxuICAvKipcbiAgICogVGFrZXMgYSBiYXNlLTU4IHN0cmluZyBjb250YWluaW5nIGFuIFtbVVRYT0lEXV0sIHBhcnNlcyBpdCwgcG9wdWxhdGVzIHRoZSBjbGFzcywgYW5kIHJldHVybnMgdGhlIGxlbmd0aCBvZiB0aGUgVVRYT0lEIGluIGJ5dGVzLlxuICAgKlxuICAgKiBAcGFyYW0gYnl0ZXMgQSBiYXNlLTU4IHN0cmluZyBjb250YWluaW5nIGEgcmF3IFtbVVRYT0lEXV1cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGxlbmd0aCBvZiB0aGUgcmF3IFtbVVRYT0lEXV1cbiAgICovXG4gIGZyb21TdHJpbmcodXR4b2lkOiBzdHJpbmcpOiBudW1iZXIge1xuICAgIGNvbnN0IHV0eG9pZGJ1ZmY6IEJ1ZmZlciA9IGJpbnRvb2xzLmI1OFRvQnVmZmVyKHV0eG9pZClcbiAgICBpZiAodXR4b2lkYnVmZi5sZW5ndGggPT09IDQwICYmIGJpbnRvb2xzLnZhbGlkYXRlQ2hlY2tzdW0odXR4b2lkYnVmZikpIHtcbiAgICAgIGNvbnN0IG5ld2J1ZmY6IEJ1ZmZlciA9IGJpbnRvb2xzLmNvcHlGcm9tKFxuICAgICAgICB1dHhvaWRidWZmLFxuICAgICAgICAwLFxuICAgICAgICB1dHhvaWRidWZmLmxlbmd0aCAtIDRcbiAgICAgIClcbiAgICAgIGlmIChuZXdidWZmLmxlbmd0aCA9PT0gMzYpIHtcbiAgICAgICAgdGhpcy5ieXRlcyA9IG5ld2J1ZmZcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHV0eG9pZGJ1ZmYubGVuZ3RoID09PSA0MCkge1xuICAgICAgdGhyb3cgbmV3IENoZWNrc3VtRXJyb3IoXG4gICAgICAgIFwiRXJyb3IgLSBVVFhPSUQuZnJvbVN0cmluZzogaW52YWxpZCBjaGVja3N1bSBvbiBhZGRyZXNzXCJcbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKHV0eG9pZGJ1ZmYubGVuZ3RoID09PSAzNikge1xuICAgICAgdGhpcy5ieXRlcyA9IHV0eG9pZGJ1ZmZcbiAgICB9IGVsc2Uge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBBZGRyZXNzRXJyb3IoXCJFcnJvciAtIFVUWE9JRC5mcm9tU3RyaW5nOiBpbnZhbGlkIGFkZHJlc3NcIilcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZ2V0U2l6ZSgpXG4gIH1cblxuICBjbG9uZSgpOiB0aGlzIHtcbiAgICBjb25zdCBuZXdiYXNlOiBVVFhPSUQgPSBuZXcgVVRYT0lEKClcbiAgICBuZXdiYXNlLmZyb21CdWZmZXIodGhpcy50b0J1ZmZlcigpKVxuICAgIHJldHVybiBuZXdiYXNlIGFzIHRoaXNcbiAgfVxuXG4gIGNyZWF0ZSgpOiB0aGlzIHtcbiAgICByZXR1cm4gbmV3IFVUWE9JRCgpIGFzIHRoaXNcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGFzcyBmb3IgcmVwcmVzZW50aW5nIGEgVVRYT0lEIHVzZWQgaW4gW1tUcmFuc2ZlcmFibGVPcF1dIHR5cGVzXG4gICAqL1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpXG4gIH1cbn1cbiJdfQ==