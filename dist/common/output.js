"use strict";
/**
 * @packageDocumentation
 * @module Common-Output
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseNFTOutput = exports.StandardAmountOutput = exports.StandardTransferableOutput = exports.StandardParseableOutput = exports.Output = exports.OutputOwners = exports.Address = exports.BaseOutputComparator = void 0;
const buffer_1 = require("buffer/");
const bn_js_1 = __importDefault(require("bn.js"));
const bintools_1 = __importDefault(require("../utils/bintools"));
const nbytes_1 = require("./nbytes");
const helperfunctions_1 = require("../utils/helperfunctions");
const serialization_1 = require("../utils/serialization");
const errors_1 = require("../utils/errors");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serialization = serialization_1.Serialization.getInstance();
const BaseOutputComparator = () => (a, b) => {
    const aoutid = buffer_1.Buffer.alloc(4);
    aoutid.writeUInt32BE(a.getOutputID(), 0);
    const abuff = a.toBuffer();
    const boutid = buffer_1.Buffer.alloc(4);
    boutid.writeUInt32BE(b.getOutputID(), 0);
    const bbuff = b.toBuffer();
    const asort = buffer_1.Buffer.concat([aoutid, abuff], aoutid.length + abuff.length);
    const bsort = buffer_1.Buffer.concat([boutid, bbuff], boutid.length + bbuff.length);
    return buffer_1.Buffer.compare(asort, bsort);
};
exports.BaseOutputComparator = BaseOutputComparator;
/**
 * Class for representing an address used in [[Output]] types
 */
class Address extends nbytes_1.NBytes {
    /**
     * Class for representing an address used in [[Output]] types
     */
    constructor() {
        super();
        this._typeName = "Address";
        this._typeID = undefined;
        //serialize and deserialize both are inherited
        this.bytes = buffer_1.Buffer.alloc(20);
        this.bsize = 20;
    }
    /**
     * Returns a base-58 representation of the [[Address]].
     */
    toString() {
        return bintools.cb58Encode(this.toBuffer());
    }
    /**
     * Takes a base-58 string containing an [[Address]], parses it, populates the class, and returns the length of the Address in bytes.
     *
     * @param bytes A base-58 string containing a raw [[Address]]
     *
     * @returns The length of the raw [[Address]]
     */
    fromString(addr) {
        const addrbuff = bintools.b58ToBuffer(addr);
        if (addrbuff.length === 24 && bintools.validateChecksum(addrbuff)) {
            const newbuff = bintools.copyFrom(addrbuff, 0, addrbuff.length - 4);
            if (newbuff.length === 20) {
                this.bytes = newbuff;
            }
        }
        else if (addrbuff.length === 24) {
            throw new errors_1.ChecksumError("Error - Address.fromString: invalid checksum on address");
        }
        else if (addrbuff.length === 20) {
            this.bytes = addrbuff;
        }
        else {
            /* istanbul ignore next */
            throw new errors_1.AddressError("Error - Address.fromString: invalid address");
        }
        return this.getSize();
    }
    clone() {
        let newbase = new Address();
        newbase.fromBuffer(this.toBuffer());
        return newbase;
    }
    create() {
        return new Address();
    }
}
exports.Address = Address;
/**
 * Returns a function used to sort an array of [[Address]]es
 */
Address.comparator = () => (a, b) => buffer_1.Buffer.compare(a.toBuffer(), b.toBuffer());
/**
 * Defines the most basic values for output ownership. Mostly inherited from, but can be used in population of NFT Owner data.
 */
class OutputOwners extends serialization_1.Serializable {
    /**
     * An [[Output]] class which contains addresses, locktimes, and thresholds.
     *
     * @param addresses An array of {@link https://github.com/feross/buffer|Buffer}s representing output owner's addresses
     * @param locktime A {@link https://github.com/indutny/bn.js/|BN} representing the locktime
     * @param threshold A number representing the threshold number of signers required to sign the transaction
     */
    constructor(addresses = undefined, locktime = undefined, threshold = undefined) {
        super();
        this._typeName = "OutputOwners";
        this._typeID = undefined;
        this.locktime = buffer_1.Buffer.alloc(8);
        this.threshold = buffer_1.Buffer.alloc(4);
        this.numaddrs = buffer_1.Buffer.alloc(4);
        this.addresses = [];
        /**
         * Returns the threshold of signers required to spend this output.
         */
        this.getThreshold = () => this.threshold.readUInt32BE(0);
        /**
         * Returns the a {@link https://github.com/indutny/bn.js/|BN} repersenting the UNIX Timestamp when the lock is made available.
         */
        this.getLocktime = () => bintools.fromBufferToBN(this.locktime);
        /**
         * Returns an array of {@link https://github.com/feross/buffer|Buffer}s for the addresses.
         */
        this.getAddresses = () => {
            const result = [];
            for (let i = 0; i < this.addresses.length; i++) {
                result.push(this.addresses[`${i}`].toBuffer());
            }
            return result;
        };
        /**
         * Returns an the length of the Addresses array.
         */
        this.getAddressesLength = () => this.addresses.length;
        /**
         * Returns the index of the address.
         *
         * @param address A {@link https://github.com/feross/buffer|Buffer} of the address to look up to return its index.
         *
         * @returns The index of the address.
         */
        this.getAddressIdx = (address) => {
            for (let i = 0; i < this.addresses.length; i++) {
                if (this.addresses[`${i}`].toBuffer().toString("hex") ===
                    address.toString("hex")) {
                    return i;
                }
            }
            /* istanbul ignore next */
            return -1;
        };
        /**
         * Returns the address from the index provided.
         *
         * @param idx The index of the address.
         *
         * @returns Returns the string representing the address.
         */
        this.getAddress = (idx) => {
            if (idx < this.addresses.length) {
                return this.addresses[`${idx}`].toBuffer();
            }
            throw new errors_1.AddressIndexError("Error - Output.getAddress: idx out of range");
        };
        /**
         * Given an array of address {@link https://github.com/feross/buffer|Buffer}s and an optional timestamp, returns true if the addresses meet the threshold required to spend the output.
         */
        this.meetsThreshold = (addresses, asOf = undefined) => {
            let now;
            if (typeof asOf === "undefined") {
                now = (0, helperfunctions_1.UnixNow)();
            }
            else {
                now = asOf;
            }
            const qualified = this.getSpenders(addresses, now);
            const threshold = this.threshold.readUInt32BE(0);
            if (qualified.length >= threshold) {
                return true;
            }
            return false;
        };
        /**
         * Given an array of addresses and an optional timestamp, select an array of address {@link https://github.com/feross/buffer|Buffer}s of qualified spenders for the output.
         */
        this.getSpenders = (addresses, asOf = undefined) => {
            const qualified = [];
            let now;
            if (typeof asOf === "undefined") {
                now = (0, helperfunctions_1.UnixNow)();
            }
            else {
                now = asOf;
            }
            const locktime = bintools.fromBufferToBN(this.locktime);
            if (now.lte(locktime)) {
                // not unlocked, not spendable
                return qualified;
            }
            const threshold = this.threshold.readUInt32BE(0);
            for (let i = 0; i < this.addresses.length && qualified.length < threshold; i++) {
                for (let j = 0; j < addresses.length && qualified.length < threshold; j++) {
                    if (addresses[`${j}`].toString("hex") ===
                        this.addresses[`${i}`].toBuffer().toString("hex")) {
                        qualified.push(addresses[`${j}`]);
                    }
                }
            }
            return qualified;
        };
        if (typeof addresses !== "undefined" && addresses.length) {
            const addrs = [];
            for (let i = 0; i < addresses.length; i++) {
                addrs[`${i}`] = new Address();
                addrs[`${i}`].fromBuffer(addresses[`${i}`]);
            }
            this.addresses = addrs;
            this.addresses.sort(Address.comparator());
            this.numaddrs.writeUInt32BE(this.addresses.length, 0);
        }
        if (typeof threshold !== undefined) {
            this.threshold.writeUInt32BE(threshold || 1, 0);
        }
        if (typeof locktime !== "undefined") {
            this.locktime = bintools.fromBNToBuffer(locktime, 8);
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { locktime: serialization.encoder(this.locktime, encoding, "Buffer", "decimalString", 8), threshold: serialization.encoder(this.threshold, encoding, "Buffer", "decimalString", 4), addresses: this.addresses.map((a) => a.serialize(encoding)) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.locktime = serialization.decoder(fields["locktime"], encoding, "decimalString", "Buffer", 8);
        this.threshold = serialization.decoder(fields["threshold"], encoding, "decimalString", "Buffer", 4);
        this.addresses = fields["addresses"].map((a) => {
            let addr = new Address();
            addr.deserialize(a, encoding);
            return addr;
        });
        this.numaddrs = buffer_1.Buffer.alloc(4);
        this.numaddrs.writeUInt32BE(this.addresses.length, 0);
    }
    /**
     * Returns a base-58 string representing the [[Output]].
     */
    fromBuffer(bytes, offset = 0) {
        this.locktime = bintools.copyFrom(bytes, offset, offset + 8);
        offset += 8;
        this.threshold = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        this.numaddrs = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        const numaddrs = this.numaddrs.readUInt32BE(0);
        this.addresses = [];
        for (let i = 0; i < numaddrs; i++) {
            const addr = new Address();
            offset = addr.fromBuffer(bytes, offset);
            this.addresses.push(addr);
        }
        this.addresses.sort(Address.comparator());
        return offset;
    }
    /**
     * Returns the buffer representing the [[Output]] instance.
     */
    toBuffer() {
        this.addresses.sort(Address.comparator());
        this.numaddrs.writeUInt32BE(this.addresses.length, 0);
        let bsize = this.locktime.length + this.threshold.length + this.numaddrs.length;
        const barr = [this.locktime, this.threshold, this.numaddrs];
        for (let i = 0; i < this.addresses.length; i++) {
            const b = this.addresses[`${i}`].toBuffer();
            barr.push(b);
            bsize += b.length;
        }
        return buffer_1.Buffer.concat(barr, bsize);
    }
    /**
     * Returns a base-58 string representing the [[Output]].
     */
    toString() {
        return bintools.bufferToB58(this.toBuffer());
    }
    static fromArray(b) {
        let offset = 6; //version + counter
        let num = b.readUInt32BE(2);
        const result = [];
        while (offset < b.length && num-- > 0) {
            const t = new OutputOwners();
            offset = t.fromBuffer(b, offset);
            result.push(t);
        }
        return result;
    }
    static toArray(o) {
        const numOutputOwners = buffer_1.Buffer.alloc(6);
        numOutputOwners.writeUInt32BE(o.length, 2);
        let bsize = 6;
        const barr = [numOutputOwners];
        for (const outputOwner of o) {
            const b = outputOwner.toBuffer();
            bsize += b.length;
            barr.push(b);
        }
        return buffer_1.Buffer.concat(barr, bsize);
    }
}
exports.OutputOwners = OutputOwners;
class Output extends OutputOwners {
    constructor() {
        super(...arguments);
        this._typeName = "Output";
        this._typeID = undefined;
    }
}
exports.Output = Output;
class StandardParseableOutput extends serialization_1.Serializable {
    /**
     * Class representing an [[ParseableOutput]] for a transaction.
     *
     * @param output A number representing the InputID of the [[ParseableOutput]]
     */
    constructor(output = undefined) {
        super();
        this._typeName = "StandardParseableOutput";
        this._typeID = undefined;
        this.getOutput = () => this.output;
        this.output = output;
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { output: this.output.serialize(encoding) });
    }
    toBuffer() {
        const outbuff = this.output.toBuffer();
        const outid = buffer_1.Buffer.alloc(4);
        outid.writeUInt32BE(this.output.getOutputID(), 0);
        const barr = [outid, outbuff];
        return buffer_1.Buffer.concat(barr, outid.length + outbuff.length);
    }
    getThreshold() {
        return this.output.getThreshold();
    }
    getLocktime() {
        return this.output.getLocktime();
    }
    getAddresses() {
        return this.output.getAddresses();
    }
    meetsThreshold(addrs, asOf) {
        return this.output.meetsThreshold(addrs, asOf);
    }
}
exports.StandardParseableOutput = StandardParseableOutput;
/**
 * Returns a function used to sort an array of [[ParseableOutput]]s
 */
StandardParseableOutput.comparator = () => (a, b) => {
    const sorta = a.toBuffer();
    const sortb = b.toBuffer();
    return buffer_1.Buffer.compare(sorta, sortb);
};
class StandardTransferableOutput extends StandardParseableOutput {
    /**
     * Class representing an [[StandardTransferableOutput]] for a transaction.
     *
     * @param assetID A {@link https://github.com/feross/buffer|Buffer} representing the assetID of the [[Output]]
     * @param output A number representing the InputID of the [[StandardTransferableOutput]]
     */
    constructor(assetID = undefined, output = undefined) {
        super(output);
        this._typeName = "StandardTransferableOutput";
        this._typeID = undefined;
        this.assetID = undefined;
        this.getAssetID = () => this.assetID;
        if (typeof assetID !== "undefined") {
            this.assetID = assetID;
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { assetID: serialization.encoder(this.assetID, encoding, "Buffer", "cb58") });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.assetID = serialization.decoder(fields["assetID"], encoding, "cb58", "Buffer", 32);
    }
    toBuffer() {
        const parseableBuff = super.toBuffer();
        const barr = [this.assetID, parseableBuff];
        return buffer_1.Buffer.concat(barr, this.assetID.length + parseableBuff.length);
    }
}
exports.StandardTransferableOutput = StandardTransferableOutput;
/**
 * An [[Output]] class which specifies a token amount .
 */
class StandardAmountOutput extends Output {
    /**
     * A [[StandardAmountOutput]] class which issues a payment on an assetID.
     *
     * @param amount A {@link https://github.com/indutny/bn.js/|BN} representing the amount in the output
     * @param addresses An array of {@link https://github.com/feross/buffer|Buffer}s representing addresses
     * @param locktime A {@link https://github.com/indutny/bn.js/|BN} representing the locktime
     * @param threshold A number representing the the threshold number of signers required to sign the transaction
     */
    constructor(amount = undefined, addresses = undefined, locktime = undefined, threshold = undefined) {
        super(addresses, locktime, threshold);
        this._typeName = "StandardAmountOutput";
        this._typeID = undefined;
        this.amount = buffer_1.Buffer.alloc(8);
        this.amountValue = new bn_js_1.default(0);
        if (typeof amount !== "undefined") {
            this.amountValue = amount.clone();
            this.amount = bintools.fromBNToBuffer(amount, 8);
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { amount: serialization.encoder(this.amount, encoding, "Buffer", "decimalString", 8) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.amount = serialization.decoder(fields["amount"], encoding, "decimalString", "Buffer", 8);
        this.amountValue = bintools.fromBufferToBN(this.amount);
    }
    /**
     * Returns the amount as a {@link https://github.com/indutny/bn.js/|BN}.
     */
    getAmount() {
        return this.amountValue.clone();
    }
    /**
     * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[StandardAmountOutput]] and returns the size of the output.
     */
    fromBuffer(outbuff, offset = 0) {
        this.amount = bintools.copyFrom(outbuff, offset, offset + 8);
        this.amountValue = bintools.fromBufferToBN(this.amount);
        offset += 8;
        return super.fromBuffer(outbuff, offset);
    }
    /**
     * Returns the buffer representing the [[StandardAmountOutput]] instance.
     */
    toBuffer() {
        const superbuff = super.toBuffer();
        const bsize = this.amount.length + superbuff.length;
        this.numaddrs.writeUInt32BE(this.addresses.length, 0);
        const barr = [this.amount, superbuff];
        return buffer_1.Buffer.concat(barr, bsize);
    }
}
exports.StandardAmountOutput = StandardAmountOutput;
/**
 * An [[Output]] class which specifies an NFT.
 */
class BaseNFTOutput extends Output {
    constructor() {
        super(...arguments);
        this._typeName = "BaseNFTOutput";
        this._typeID = undefined;
        this.groupID = buffer_1.Buffer.alloc(4);
        /**
         * Returns the groupID as a number.
         */
        this.getGroupID = () => {
            return this.groupID.readUInt32BE(0);
        };
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { groupID: serialization.encoder(this.groupID, encoding, "Buffer", "decimalString", 4) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.groupID = serialization.decoder(fields["groupID"], encoding, "decimalString", "Buffer", 4);
    }
}
exports.BaseNFTOutput = BaseNFTOutput;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2NvbW1vbi9vdXRwdXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7Ozs7O0FBRUgsb0NBQWdDO0FBQ2hDLGtEQUFzQjtBQUN0QixpRUFBd0M7QUFDeEMscUNBQWlDO0FBQ2pDLDhEQUFrRDtBQUNsRCwwREFJK0I7QUFDL0IsNENBQWdGO0FBRWhGOztHQUVHO0FBQ0gsTUFBTSxRQUFRLEdBQWEsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUNqRCxNQUFNLGFBQWEsR0FBa0IsNkJBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQW9CekQsTUFBTSxvQkFBb0IsR0FDL0IsR0FBbUQsRUFBRSxDQUNyRCxDQUFDLENBQWEsRUFBRSxDQUFhLEVBQWMsRUFBRTtJQUMzQyxNQUFNLE1BQU0sR0FBVyxlQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO0lBQ3RDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFBO0lBQ3hDLE1BQU0sS0FBSyxHQUFXLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQTtJQUVsQyxNQUFNLE1BQU0sR0FBVyxlQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO0lBQ3RDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFBO0lBQ3hDLE1BQU0sS0FBSyxHQUFXLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQTtJQUVsQyxNQUFNLEtBQUssR0FBVyxlQUFNLENBQUMsTUFBTSxDQUNqQyxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsRUFDZixNQUFNLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQzdCLENBQUE7SUFDRCxNQUFNLEtBQUssR0FBVyxlQUFNLENBQUMsTUFBTSxDQUNqQyxDQUFD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Q0FDbEMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUNqQixRQUFRLEVBQ1IsZUFBZSxFQUNmLFFBQVEsRUFDUixDQUFDLENBQ0YsQ0FBQTtJQUNILENBQUM7Q0FVRjtBQXBDRCxzQ0FvQ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxuICogQG1vZHVsZSBDb21tb24tT3V0cHV0XG4gKi9cblxuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcImJ1ZmZlci9cIlxuaW1wb3J0IEJOIGZyb20gXCJibi5qc1wiXG5pbXBvcnQgQmluVG9vbHMgZnJvbSBcIi4uL3V0aWxzL2JpbnRvb2xzXCJcbmltcG9ydCB7IE5CeXRlcyB9IGZyb20gXCIuL25ieXRlc1wiXG5pbXBvcnQgeyBVbml4Tm93IH0gZnJvbSBcIi4uL3V0aWxzL2hlbHBlcmZ1bmN0aW9uc1wiXG5pbXBvcnQge1xuICBTZXJpYWxpemFibGUsXG4gIFNlcmlhbGl6YXRpb24sXG4gIFNlcmlhbGl6ZWRFbmNvZGluZ1xufSBmcm9tIFwiLi4vdXRpbHMvc2VyaWFsaXphdGlvblwiXG5pbXBvcnQgeyBDaGVja3N1bUVycm9yLCBBZGRyZXNzRXJyb3IsIEFkZHJlc3NJbmRleEVycm9yIH0gZnJvbSBcIi4uL3V0aWxzL2Vycm9yc1wiXG5cbi8qKlxuICogQGlnbm9yZVxuICovXG5jb25zdCBiaW50b29sczogQmluVG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpXG5jb25zdCBzZXJpYWxpemF0aW9uOiBTZXJpYWxpemF0aW9uID0gU2VyaWFsaXphdGlvbi5nZXRJbnN0YW5jZSgpXG5cbmV4cG9ydCBpbnRlcmZhY2UgQmFzZU91dHB1dCB7XG4gIGdldFR5cGVJRCgpOiBudW1iZXJcblxuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyk6IG9iamVjdFxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyk6IHZvaWRcbiAgZnJvbUJ1ZmZlcihieXRlczogQnVmZmVyLCBvZmZzZXQ6IG51bWJlcik6IG51bWJlclxuICB0b0J1ZmZlcigpOiBCdWZmZXJcblxuICBnZXRUaHJlc2hvbGQoKTogbnVtYmVyXG4gIGdldExvY2t0aW1lKCk6IEJOXG4gIGdldEFkZHJlc3NlcygpOiBCdWZmZXJbXVxuICBtZWV0c1RocmVzaG9sZChhZGRyczogQnVmZmVyW10sIGFzT2Y6IEJOKTogYm9vbGVhblxuXG4gIGdldE91dHB1dElEKCk6IG51bWJlclxuICBjbG9uZSgpOiB0aGlzXG4gIGNyZWF0ZSguLi5hcmdzOiBhbnlbXSk6IHRoaXNcbn1cblxuZXhwb3J0IGNvbnN0IEJhc2VPdXRwdXRDb21wYXJhdG9yID1cbiAgKCk6ICgoYTogQmFzZU91dHB1dCwgYjogQmFzZU91dHB1dCkgPT4gMSB8IC0xIHwgMCkgPT5cbiAgKGE6IEJhc2VPdXRwdXQsIGI6IEJhc2VPdXRwdXQpOiAxIHwgLTEgfCAwID0+IHtcbiAgICBjb25zdCBhb3V0aWQ6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxuICAgIGFvdXRpZC53cml0ZVVJbnQzMkJFKGEuZ2V0T3V0cHV0SUQoKSwgMClcbiAgICBjb25zdCBhYnVmZjogQnVmZmVyID0gYS50b0J1ZmZlcigpXG5cbiAgICBjb25zdCBib3V0aWQ6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxuICAgIGJvdXRpZC53cml0ZVVJbnQzMkJFKGIuZ2V0T3V0cHV0SUQoKSwgMClcbiAgICBjb25zdCBiYnVmZjogQnVmZmVyID0gYi50b0J1ZmZlcigpXG5cbiAgICBjb25zdCBhc29ydDogQnVmZmVyID0gQnVmZmVyLmNvbmNhdChcbiAgICAgIFthb3V0aWQsIGFidWZmXSxcbiAgICAgIGFvdXRpZC5sZW5ndGggKyBhYnVmZi5sZW5ndGhcbiAgICApXG4gICAgY29uc3QgYnNvcnQ6IEJ1ZmZlciA9IEJ1ZmZlci5jb25jYXQoXG4gICAgICBbYm91dGlkLCBiYnVmZl0sXG4gICAgICBib3V0aWQubGVuZ3RoICsgYmJ1ZmYubGVuZ3RoXG4gICAgKVxuICAgIHJldHVybiBCdWZmZXIuY29tcGFyZShhc29ydCwgYnNvcnQpIGFzIDEgfCAtMSB8IDBcbiAgfVxuXG4vKipcbiAqIENsYXNzIGZvciByZXByZXNlbnRpbmcgYW4gYWRkcmVzcyB1c2VkIGluIFtbT3V0cHV0XV0gdHlwZXNcbiAqL1xuZXhwb3J0IGNsYXNzIEFkZHJlc3MgZXh0ZW5kcyBOQnl0ZXMge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJBZGRyZXNzXCJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcblxuICAvL3NlcmlhbGl6ZSBhbmQgZGVzZXJpYWxpemUgYm90aCBhcmUgaW5oZXJpdGVkXG5cbiAgcHJvdGVjdGVkIGJ5dGVzID0gQnVmZmVyLmFsbG9jKDIwKVxuICBwcm90ZWN0ZWQgYnNpemUgPSAyMFxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgZnVuY3Rpb24gdXNlZCB0byBzb3J0IGFuIGFycmF5IG9mIFtbQWRkcmVzc11dZXNcbiAgICovXG4gIHN0YXRpYyBjb21wYXJhdG9yID1cbiAgICAoKTogKChhOiBBZGRyZXNzLCBiOiBBZGRyZXNzKSA9PiAxIHwgLTEgfCAwKSA9PlxuICAgIChhOiBBZGRyZXNzLCBiOiBBZGRyZXNzKTogMSB8IC0xIHwgMCA9PlxuICAgICAgQnVmZmVyLmNvbXBhcmUoYS50b0J1ZmZlcigpLCBiLnRvQnVmZmVyKCkpIGFzIDEgfCAtMSB8IDBcblxuICAvKipcbiAgICogUmV0dXJucyBhIGJhc2UtNTggcmVwcmVzZW50YXRpb24gb2YgdGhlIFtbQWRkcmVzc11dLlxuICAgKi9cbiAgdG9TdHJpbmcoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYmludG9vbHMuY2I1OEVuY29kZSh0aGlzLnRvQnVmZmVyKCkpXG4gIH1cblxuICAvKipcbiAgICogVGFrZXMgYSBiYXNlLTU4IHN0cmluZyBjb250YWluaW5nIGFuIFtbQWRkcmVzc11dLCBwYXJzZXMgaXQsIHBvcHVsYXRlcyB0aGUgY2xhc3MsIGFuZCByZXR1cm5zIHRoZSBsZW5ndGggb2YgdGhlIEFkZHJlc3MgaW4gYnl0ZXMuXG4gICAqXG4gICAqIEBwYXJhbSBieXRlcyBBIGJhc2UtNTggc3RyaW5nIGNvbnRhaW5pbmcgYSByYXcgW1tBZGRyZXNzXV1cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGxlbmd0aCBvZiB0aGUgcmF3IFtbQWRkcmVzc11dXG4gICAqL1xuICBmcm9tU3RyaW5nKGFkZHI6IHN0cmluZyk6IG51bWJlciB7XG4gICAgY29uc3QgYWRkcmJ1ZmY6IEJ1ZmZlciA9IGJpbnRvb2xzLmI1OFRvQnVmZmVyKGFkZHIpXG4gICAgaWYgKGFkZHJidWZmLmxlbmd0aCA9PT0gMjQgJiYgYmludG9vbHMudmFsaWRhdGVDaGVja3N1bShhZGRyYnVmZikpIHtcbiAgICAgIGNvbnN0IG5ld2J1ZmY6IEJ1ZmZlciA9IGJpbnRvb2xzLmNvcHlGcm9tKFxuICAgICAgICBhZGRyYnVmZixcbiAgICAgICAgMCxcbiAgICAgICAgYWRkcmJ1ZmYubGVuZ3RoIC0gNFxuICAgICAgKVxuICAgICAgaWYgKG5ld2J1ZmYubGVuZ3RoID09PSAyMCkge1xuICAgICAgICB0aGlzLmJ5dGVzID0gbmV3YnVmZlxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoYWRkcmJ1ZmYubGVuZ3RoID09PSAyNCkge1xuICAgICAgdGhyb3cgbmV3IENoZWNrc3VtRXJyb3IoXG4gICAgICAgIFwiRXJyb3IgLSBBZGRyZXNzLmZyb21TdHJpbmc6IGludmFsaWQgY2hlY2tzdW0gb24gYWRkcmVzc1wiXG4gICAgICApXG4gICAgfSBlbHNlIGlmIChhZGRyYnVmZi5sZW5ndGggPT09IDIwKSB7XG4gICAgICB0aGlzLmJ5dGVzID0gYWRkcmJ1ZmZcbiAgICB9IGVsc2Uge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBBZGRyZXNzRXJyb3IoXCJFcnJvciAtIEFkZHJlc3MuZnJvbVN0cmluZzogaW52YWxpZCBhZGRyZXNzXCIpXG4gICAgfVxuICAgIHJldHVybiB0aGlzLmdldFNpemUoKVxuICB9XG5cbiAgY2xvbmUoKTogdGhpcyB7XG4gICAgbGV0IG5ld2Jhc2U6IEFkZHJlc3MgPSBuZXcgQWRkcmVzcygpXG4gICAgbmV3YmFzZS5mcm9tQnVmZmVyKHRoaXMudG9CdWZmZXIoKSlcbiAgICByZXR1cm4gbmV3YmFzZSBhcyB0aGlzXG4gIH1cblxuICBjcmVhdGUoKTogdGhpcyB7XG4gICAgcmV0dXJuIG5ldyBBZGRyZXNzKCkgYXMgdGhpc1xuICB9XG5cbiAgLyoqXG4gICAqIENsYXNzIGZvciByZXByZXNlbnRpbmcgYW4gYWRkcmVzcyB1c2VkIGluIFtbT3V0cHV0XV0gdHlwZXNcbiAgICovXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKClcbiAgfVxufVxuXG4vKipcbiAqIERlZmluZXMgdGhlIG1vc3QgYmFzaWMgdmFsdWVzIGZvciBvdXRwdXQgb3duZXJzaGlwLiBNb3N0bHkgaW5oZXJpdGVkIGZyb20sIGJ1dCBjYW4gYmUgdXNlZCBpbiBwb3B1bGF0aW9uIG9mIE5GVCBPd25lciBkYXRhLlxuICovXG5leHBvcnQgY2xhc3MgT3V0cHV0T3duZXJzIGV4dGVuZHMgU2VyaWFsaXphYmxlIHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiT3V0cHV0T3duZXJzXCJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcblxuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOiBvYmplY3Qge1xuICAgIGxldCBmaWVsZHM6IG9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZylcbiAgICByZXR1cm4ge1xuICAgICAgLi4uZmllbGRzLFxuICAgICAgbG9ja3RpbWU6IHNlcmlhbGl6YXRpb24uZW5jb2RlcihcbiAgICAgICAgdGhpcy5sb2NrdGltZSxcbiAgICAgICAgZW5jb2RpbmcsXG4gICAgICAgIFwiQnVmZmVyXCIsXG4gICAgICAgIFwiZGVjaW1hbFN0cmluZ1wiLFxuICAgICAgICA4XG4gICAgICApLFxuICAgICAgdGhyZXNob2xkOiBzZXJpYWxpemF0aW9uLmVuY29kZXIoXG4gICAgICAgIHRoaXMudGhyZXNob2xkLFxuICAgICAgICBlbmNvZGluZyxcbiAgICAgICAgXCJCdWZmZXJcIixcbiAgICAgICAgXCJkZWNpbWFsU3RyaW5nXCIsXG4gICAgICAgIDRcbiAgICAgICksXG4gICAgICBhZGRyZXNzZXM6IHRoaXMuYWRkcmVzc2VzLm1hcCgoYTogQWRkcmVzcyk6IG9iamVjdCA9PlxuICAgICAgICBhLnNlcmlhbGl6ZShlbmNvZGluZylcbiAgICAgIClcbiAgICB9XG4gIH1cbiAgZGVzZXJpYWxpemUoZmllbGRzOiBvYmplY3QsIGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcbiAgICB0aGlzLmxvY2t0aW1lID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxuICAgICAgZmllbGRzW1wibG9ja3RpbWVcIl0sXG4gICAgICBlbmNvZGluZyxcbiAgICAgIFwiZGVjaW1hbFN0cmluZ1wiLFxuICAgICAgXCJCdWZmZXJcIixcbiAgICAgIDhcbiAgICApXG4gICAgdGhpcy50aHJlc2hvbGQgPSBzZXJpYWxpemF0aW9uLmRlY29kZXIoXG4gICAgICBmaWVsZHNbXCJ0aHJlc2hvbGRcIl0sXG4gICAgICBlbmNvZGluZyxcbiAgICAgIFwiZGVjaW1hbFN0cmluZ1wiLFxuICAgICAgXCJCdWZmZXJcIixcbiAgICAgIDRcbiAgICApXG4gICAgdGhpcy5hZGRyZXNzZXMgPSBmaWVsZHNbXCJhZGRyZXNzZXNcIl0ubWFwKChhOiBvYmplY3QpID0+IHtcbiAgICAgIGxldCBhZGRyOiBBZGRyZXNzID0gbmV3IEFkZHJlc3MoKVxuICAgICAgYWRkci5kZXNlcmlhbGl6ZShhLCBlbmNvZGluZylcbiAgICAgIHJldHVybiBhZGRyXG4gICAgfSlcbiAgICB0aGlzLm51bWFkZHJzID0gQnVmZmVyLmFsbG9jKDQpXG4gICAgdGhpcy5udW1hZGRycy53cml0ZVVJbnQzMkJFKHRoaXMuYWRkcmVzc2VzLmxlbmd0aCwgMClcbiAgfVxuXG4gIHByb3RlY3RlZCBsb2NrdGltZTogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDgpXG4gIHByb3RlY3RlZCB0aHJlc2hvbGQ6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxuICBwcm90ZWN0ZWQgbnVtYWRkcnM6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxuICBwcm90ZWN0ZWQgYWRkcmVzc2VzOiBBZGRyZXNzW10gPSBbXVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSB0aHJlc2hvbGQgb2Ygc2lnbmVycyByZXF1aXJlZCB0byBzcGVuZCB0aGlzIG91dHB1dC5cbiAgICovXG4gIGdldFRocmVzaG9sZCA9ICgpOiBudW1iZXIgPT4gdGhpcy50aHJlc2hvbGQucmVhZFVJbnQzMkJFKDApXG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0gcmVwZXJzZW50aW5nIHRoZSBVTklYIFRpbWVzdGFtcCB3aGVuIHRoZSBsb2NrIGlzIG1hZGUgYXZhaWxhYmxlLlxuICAgKi9cbiAgZ2V0TG9ja3RpbWUgPSAoKTogQk4gPT4gYmludG9vbHMuZnJvbUJ1ZmZlclRvQk4odGhpcy5sb2NrdGltZSlcblxuICAvKipcbiAgICogUmV0dXJucyBhbiBhcnJheSBvZiB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfXMgZm9yIHRoZSBhZGRyZXNzZXMuXG4gICAqL1xuICBnZXRBZGRyZXNzZXMgPSAoKTogQnVmZmVyW10gPT4ge1xuICAgIGNvbnN0IHJlc3VsdDogQnVmZmVyW10gPSBbXVxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCB0aGlzLmFkZHJlc3Nlcy5sZW5ndGg7IGkrKykge1xuICAgICAgcmVzdWx0LnB1c2godGhpcy5hZGRyZXNzZXNbYCR7aX1gXS50b0J1ZmZlcigpKVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbiB0aGUgbGVuZ3RoIG9mIHRoZSBBZGRyZXNzZXMgYXJyYXkuXG4gICAqL1xuICBnZXRBZGRyZXNzZXNMZW5ndGggPSAoKTogbnVtYmVyID0+IHRoaXMuYWRkcmVzc2VzLmxlbmd0aFxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBpbmRleCBvZiB0aGUgYWRkcmVzcy5cbiAgICpcbiAgICogQHBhcmFtIGFkZHJlc3MgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvZiB0aGUgYWRkcmVzcyB0byBsb29rIHVwIHRvIHJldHVybiBpdHMgaW5kZXguXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBpbmRleCBvZiB0aGUgYWRkcmVzcy5cbiAgICovXG4gIGdldEFkZHJlc3NJZHggPSAoYWRkcmVzczogQnVmZmVyKTogbnVtYmVyID0+IHtcbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgdGhpcy5hZGRyZXNzZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChcbiAgICAgICAgdGhpcy5hZGRyZXNzZXNbYCR7aX1gXS50b0J1ZmZlcigpLnRvU3RyaW5nKFwiaGV4XCIpID09PVxuICAgICAgICBhZGRyZXNzLnRvU3RyaW5nKFwiaGV4XCIpXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIGlcbiAgICAgIH1cbiAgICB9XG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICByZXR1cm4gLTFcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBhZGRyZXNzIGZyb20gdGhlIGluZGV4IHByb3ZpZGVkLlxuICAgKlxuICAgKiBAcGFyYW0gaWR4IFRoZSBpbmRleCBvZiB0aGUgYWRkcmVzcy5cbiAgICpcbiAgICogQHJldHVybnMgUmV0dXJucyB0aGUgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgYWRkcmVzcy5cbiAgICovXG4gIGdldEFkZHJlc3MgPSAoaWR4OiBudW1iZXIpOiBCdWZmZXIgPT4ge1xuICAgIGlmIChpZHggPCB0aGlzLmFkZHJlc3Nlcy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiB0aGlzLmFkZHJlc3Nlc1tgJHtpZHh9YF0udG9CdWZmZXIoKVxuICAgIH1cbiAgICB0aHJvdyBuZXcgQWRkcmVzc0luZGV4RXJyb3IoXCJFcnJvciAtIE91dHB1dC5nZXRBZGRyZXNzOiBpZHggb3V0IG9mIHJhbmdlXCIpXG4gIH1cblxuICAvKipcbiAgICogR2l2ZW4gYW4gYXJyYXkgb2YgYWRkcmVzcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfXMgYW5kIGFuIG9wdGlvbmFsIHRpbWVzdGFtcCwgcmV0dXJucyB0cnVlIGlmIHRoZSBhZGRyZXNzZXMgbWVldCB0aGUgdGhyZXNob2xkIHJlcXVpcmVkIHRvIHNwZW5kIHRoZSBvdXRwdXQuXG4gICAqL1xuICBtZWV0c1RocmVzaG9sZCA9IChhZGRyZXNzZXM6IEJ1ZmZlcltdLCBhc09mOiBCTiA9IHVuZGVmaW5lZCk6IGJvb2xlYW4gPT4ge1xuICAgIGxldCBub3c6IEJOXG4gICAgaWYgKHR5cGVvZiBhc09mID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBub3cgPSBVbml4Tm93KClcbiAgICB9IGVsc2Uge1xuICAgICAgbm93ID0gYXNPZlxuICAgIH1cbiAgICBjb25zdCBxdWFsaWZpZWQ6IEJ1ZmZlcltdID0gdGhpcy5nZXRTcGVuZGVycyhhZGRyZXNzZXMsIG5vdylcbiAgICBjb25zdCB0aHJlc2hvbGQ6IG51bWJlciA9IHRoaXMudGhyZXNob2xkLnJlYWRVSW50MzJCRSgwKVxuICAgIGlmIChxdWFsaWZpZWQubGVuZ3RoID49IHRocmVzaG9sZCkge1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIC8qKlxuICAgKiBHaXZlbiBhbiBhcnJheSBvZiBhZGRyZXNzZXMgYW5kIGFuIG9wdGlvbmFsIHRpbWVzdGFtcCwgc2VsZWN0IGFuIGFycmF5IG9mIGFkZHJlc3Mge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1zIG9mIHF1YWxpZmllZCBzcGVuZGVycyBmb3IgdGhlIG91dHB1dC5cbiAgICovXG4gIGdldFNwZW5kZXJzID0gKGFkZHJlc3NlczogQnVmZmVyW10sIGFzT2Y6IEJOID0gdW5kZWZpbmVkKTogQnVmZmVyW10gPT4ge1xuICAgIGNvbnN0IHF1YWxpZmllZDogQnVmZmVyW10gPSBbXVxuICAgIGxldCBub3c6IEJOXG4gICAgaWYgKHR5cGVvZiBhc09mID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBub3cgPSBVbml4Tm93KClcbiAgICB9IGVsc2Uge1xuICAgICAgbm93ID0gYXNPZlxuICAgIH1cbiAgICBjb25zdCBsb2NrdGltZTogQk4gPSBiaW50b29scy5mcm9tQnVmZmVyVG9CTih0aGlzLmxvY2t0aW1lKVxuICAgIGlmIChub3cubHRlKGxvY2t0aW1lKSkge1xuICAgICAgLy8gbm90IHVubG9ja2VkLCBub3Qgc3BlbmRhYmxlXG4gICAgICByZXR1cm4gcXVhbGlmaWVkXG4gICAgfVxuXG4gICAgY29uc3QgdGhyZXNob2xkOiBudW1iZXIgPSB0aGlzLnRocmVzaG9sZC5yZWFkVUludDMyQkUoMClcbiAgICBmb3IgKFxuICAgICAgbGV0IGk6IG51bWJlciA9IDA7XG4gICAgICBpIDwgdGhpcy5hZGRyZXNzZXMubGVuZ3RoICYmIHF1YWxpZmllZC5sZW5ndGggPCB0aHJlc2hvbGQ7XG4gICAgICBpKytcbiAgICApIHtcbiAgICAgIGZvciAoXG4gICAgICAgIGxldCBqOiBudW1iZXIgPSAwO1xuICAgICAgICBqIDwgYWRkcmVzc2VzLmxlbmd0aCAmJiBxdWFsaWZpZWQubGVuZ3RoIDwgdGhyZXNob2xkO1xuICAgICAgICBqKytcbiAgICAgICkge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgYWRkcmVzc2VzW2Ake2p9YF0udG9TdHJpbmcoXCJoZXhcIikgPT09XG4gICAgICAgICAgdGhpcy5hZGRyZXNzZXNbYCR7aX1gXS50b0J1ZmZlcigpLnRvU3RyaW5nKFwiaGV4XCIpXG4gICAgICAgICkge1xuICAgICAgICAgIHF1YWxpZmllZC5wdXNoKGFkZHJlc3Nlc1tgJHtqfWBdKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHF1YWxpZmllZFxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBiYXNlLTU4IHN0cmluZyByZXByZXNlbnRpbmcgdGhlIFtbT3V0cHV0XV0uXG4gICAqL1xuICBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyID0gMCk6IG51bWJlciB7XG4gICAgdGhpcy5sb2NrdGltZSA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDgpXG4gICAgb2Zmc2V0ICs9IDhcbiAgICB0aGlzLnRocmVzaG9sZCA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpXG4gICAgb2Zmc2V0ICs9IDRcbiAgICB0aGlzLm51bWFkZHJzID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNClcbiAgICBvZmZzZXQgKz0gNFxuICAgIGNvbnN0IG51bWFkZHJzOiBudW1iZXIgPSB0aGlzLm51bWFkZHJzLnJlYWRVSW50MzJCRSgwKVxuICAgIHRoaXMuYWRkcmVzc2VzID0gW11cbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgbnVtYWRkcnM7IGkrKykge1xuICAgICAgY29uc3QgYWRkcjogQWRkcmVzcyA9IG5ldyBBZGRyZXNzKClcbiAgICAgIG9mZnNldCA9IGFkZHIuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxuICAgICAgdGhpcy5hZGRyZXNzZXMucHVzaChhZGRyKVxuICAgIH1cbiAgICB0aGlzLmFkZHJlc3Nlcy5zb3J0KEFkZHJlc3MuY29tcGFyYXRvcigpKVxuICAgIHJldHVybiBvZmZzZXRcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBidWZmZXIgcmVwcmVzZW50aW5nIHRoZSBbW091dHB1dF1dIGluc3RhbmNlLlxuICAgKi9cbiAgdG9CdWZmZXIoKTogQnVmZmVyIHtcbiAgICB0aGlzLmFkZHJlc3Nlcy5zb3J0KEFkZHJlc3MuY29tcGFyYXRvcigpKVxuICAgIHRoaXMubnVtYWRkcnMud3JpdGVVSW50MzJCRSh0aGlzLmFkZHJlc3Nlcy5sZW5ndGgsIDApXG4gICAgbGV0IGJzaXplOiBudW1iZXIgPVxuICAgICAgdGhpcy5sb2NrdGltZS5sZW5ndGggKyB0aGlzLnRocmVzaG9sZC5sZW5ndGggKyB0aGlzLm51bWFkZHJzLmxlbmd0aFxuICAgIGNvbnN0IGJhcnI6IEJ1ZmZlcltdID0gW3RoaXMubG9ja3RpbWUsIHRoaXMudGhyZXNob2xkLCB0aGlzLm51bWFkZHJzXVxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCB0aGlzLmFkZHJlc3Nlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgYjogQnVmZmVyID0gdGhpcy5hZGRyZXNzZXNbYCR7aX1gXS50b0J1ZmZlcigpXG4gICAgICBiYXJyLnB1c2goYilcbiAgICAgIGJzaXplICs9IGIubGVuZ3RoXG4gICAgfVxuICAgIHJldHVybiBCdWZmZXIuY29uY2F0KGJhcnIsIGJzaXplKVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBiYXNlLTU4IHN0cmluZyByZXByZXNlbnRpbmcgdGhlIFtbT3V0cHV0XV0uXG4gICAqL1xuICB0b1N0cmluZygpOiBzdHJpbmcge1xuICAgIHJldHVybiBiaW50b29scy5idWZmZXJUb0I1OCh0aGlzLnRvQnVmZmVyKCkpXG4gIH1cblxuICAvKipcbiAgICogQW4gW1tPdXRwdXRdXSBjbGFzcyB3aGljaCBjb250YWlucyBhZGRyZXNzZXMsIGxvY2t0aW1lcywgYW5kIHRocmVzaG9sZHMuXG4gICAqXG4gICAqIEBwYXJhbSBhZGRyZXNzZXMgQW4gYXJyYXkgb2Yge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1zIHJlcHJlc2VudGluZyBvdXRwdXQgb3duZXIncyBhZGRyZXNzZXNcbiAgICogQHBhcmFtIGxvY2t0aW1lIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0gcmVwcmVzZW50aW5nIHRoZSBsb2NrdGltZVxuICAgKiBAcGFyYW0gdGhyZXNob2xkIEEgbnVtYmVyIHJlcHJlc2VudGluZyB0aGUgdGhyZXNob2xkIG51bWJlciBvZiBzaWduZXJzIHJlcXVpcmVkIHRvIHNpZ24gdGhlIHRyYW5zYWN0aW9uXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICBhZGRyZXNzZXM6IEJ1ZmZlcltdID0gdW5kZWZpbmVkLFxuICAgIGxvY2t0aW1lOiBCTiA9IHVuZGVmaW5lZCxcbiAgICB0aHJlc2hvbGQ6IG51bWJlciA9IHVuZGVmaW5lZFxuICApIHtcbiAgICBzdXBlcigpXG4gICAgaWYgKHR5cGVvZiBhZGRyZXNzZXMgIT09IFwidW5kZWZpbmVkXCIgJiYgYWRkcmVzc2VzLmxlbmd0aCkge1xuICAgICAgY29uc3QgYWRkcnM6IEFkZHJlc3NbXSA9IFtdXG4gICAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgYWRkcmVzc2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGFkZHJzW2Ake2l9YF0gPSBuZXcgQWRkcmVzcygpXG4gICAgICAgIGFkZHJzW2Ake2l9YF0uZnJvbUJ1ZmZlcihhZGRyZXNzZXNbYCR7aX1gXSlcbiAgICAgIH1cbiAgICAgIHRoaXMuYWRkcmVzc2VzID0gYWRkcnNcbiAgICAgIHRoaXMuYWRkcmVzc2VzLnNvcnQoQWRkcmVzcy5jb21wYXJhdG9yKCkpXG4gICAgICB0aGlzLm51bWFkZHJzLndyaXRlVUludDMyQkUodGhpcy5hZGRyZXNzZXMubGVuZ3RoLCAwKVxuICAgIH1cbiAgICBpZiAodHlwZW9mIHRocmVzaG9sZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLnRocmVzaG9sZC53cml0ZVVJbnQzMkJFKHRocmVzaG9sZCB8fCAxLCAwKVxuICAgIH1cbiAgICBpZiAodHlwZW9mIGxvY2t0aW1lICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aGlzLmxvY2t0aW1lID0gYmludG9vbHMuZnJvbUJOVG9CdWZmZXIobG9ja3RpbWUsIDgpXG4gICAgfVxuICB9XG5cbiAgc3RhdGljIGZyb21BcnJheShiOiBCdWZmZXIpOiBPdXRwdXRPd25lcnNbXSB7XG4gICAgbGV0IG9mZnNldCA9IDYgLy92ZXJzaW9uICsgY291bnRlclxuICAgIGxldCBudW0gPSBiLnJlYWRVSW50MzJCRSgyKVxuICAgIGNvbnN0IHJlc3VsdDogT3V0cHV0T3duZXJzW10gPSBbXVxuICAgIHdoaWxlIChvZmZzZXQgPCBiLmxlbmd0aCAmJiBudW0tLSA+IDApIHtcbiAgICAgIGNvbnN0IHQgPSBuZXcgT3V0cHV0T3duZXJzKClcbiAgICAgIG9mZnNldCA9IHQuZnJvbUJ1ZmZlcihiLCBvZmZzZXQpXG4gICAgICByZXN1bHQucHVzaCh0KVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cblxuICBzdGF0aWMgdG9BcnJheShvOiBPdXRwdXRPd25lcnNbXSk6IEJ1ZmZlciB7XG4gICAgY29uc3QgbnVtT3V0cHV0T3duZXJzID0gQnVmZmVyLmFsbG9jKDYpXG4gICAgbnVtT3V0cHV0T3duZXJzLndyaXRlVUludDMyQkUoby5sZW5ndGgsIDIpXG4gICAgbGV0IGJzaXplOiBudW1iZXIgPSA2XG4gICAgY29uc3QgYmFycjogQnVmZmVyW10gPSBbbnVtT3V0cHV0T3duZXJzXVxuICAgIGZvciAoY29uc3Qgb3V0cHV0T3duZXIgb2Ygbykge1xuICAgICAgY29uc3QgYiA9IG91dHB1dE93bmVyLnRvQnVmZmVyKClcbiAgICAgIGJzaXplICs9IGIubGVuZ3RoXG4gICAgICBiYXJyLnB1c2goYilcbiAgICB9XG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoYmFyciwgYnNpemUpXG4gIH1cbn1cblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIE91dHB1dCBleHRlbmRzIE91dHB1dE93bmVycyB7XG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIk91dHB1dFwiXG4gIHByb3RlY3RlZCBfdHlwZUlEID0gdW5kZWZpbmVkXG5cbiAgLy9zZXJpYWxpemUgYW5kIGRlc2VyaWFsaXplIGJvdGggYXJlIGluaGVyaXRlZFxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBvdXRwdXRJRCBmb3IgdGhlIG91dHB1dCB3aGljaCB0ZWxscyBwYXJzZXJzIHdoYXQgdHlwZSBpdCBpc1xuICAgKi9cbiAgYWJzdHJhY3QgZ2V0T3V0cHV0SUQoKTogbnVtYmVyXG5cbiAgYWJzdHJhY3QgY2xvbmUoKTogdGhpc1xuXG4gIGFic3RyYWN0IGNyZWF0ZSguLi5hcmdzOiBhbnlbXSk6IHRoaXNcblxuICAvKipcbiAgICpcbiAgICogQHBhcmFtIGFzc2V0SUQgQW4gYXNzZXRJRCB3aGljaCBpcyB3cmFwcGVkIGFyb3VuZCB0aGUgQnVmZmVyIG9mIHRoZSBPdXRwdXRcbiAgICpcbiAgICogTXVzdCBiZSBpbXBsZW1lbnRlZCB0byB1c2UgdGhlIGFwcHJvcHJpYXRlIFRyYW5zZmVyYWJsZU91dHB1dCBmb3IgdGhlIFZNLlxuICAgKi9cbiAgYWJzdHJhY3QgbWFrZVRyYW5zZmVyYWJsZShhc3NldElEOiBCdWZmZXIpOiBTdGFuZGFyZFRyYW5zZmVyYWJsZU91dHB1dFxufVxuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgU3RhbmRhcmRQYXJzZWFibGVPdXRwdXQgZXh0ZW5kcyBTZXJpYWxpemFibGUge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJTdGFuZGFyZFBhcnNlYWJsZU91dHB1dFwiXG4gIHByb3RlY3RlZCBfdHlwZUlEID0gdW5kZWZpbmVkXG5cbiAgc2VyaWFsaXplKGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKTogb2JqZWN0IHtcbiAgICBsZXQgZmllbGRzOiBvYmplY3QgPSBzdXBlci5zZXJpYWxpemUoZW5jb2RpbmcpXG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLmZpZWxkcyxcbiAgICAgIG91dHB1dDogdGhpcy5vdXRwdXQuc2VyaWFsaXplKGVuY29kaW5nKVxuICAgIH1cbiAgfVxuXG4gIHByb3RlY3RlZCBvdXRwdXQ6IEJhc2VPdXRwdXRcblxuICAvKipcbiAgICogUmV0dXJucyBhIGZ1bmN0aW9uIHVzZWQgdG8gc29ydCBhbiBhcnJheSBvZiBbW1BhcnNlYWJsZU91dHB1dF1dc1xuICAgKi9cbiAgc3RhdGljIGNvbXBhcmF0b3IgPVxuICAgICgpOiAoKFxuICAgICAgYTogU3RhbmRhcmRQYXJzZWFibGVPdXRwdXQsXG4gICAgICBiOiBTdGFuZGFyZFBhcnNlYWJsZU91dHB1dFxuICAgICkgPT4gMSB8IC0xIHwgMCkgPT5cbiAgICAoYTogU3RhbmRhcmRQYXJzZWFibGVPdXRwdXQsIGI6IFN0YW5kYXJkUGFyc2VhYmxlT3V0cHV0KTogMSB8IC0xIHwgMCA9PiB7XG4gICAgICBjb25zdCBzb3J0YSA9IGEudG9CdWZmZXIoKVxuICAgICAgY29uc3Qgc29ydGIgPSBiLnRvQnVmZmVyKClcbiAgICAgIHJldHVybiBCdWZmZXIuY29tcGFyZShzb3J0YSwgc29ydGIpIGFzIDEgfCAtMSB8IDBcbiAgICB9XG5cbiAgLy8gbXVzdCBiZSBpbXBsZW1lbnRlZCB0byBzZWxlY3Qgb3V0cHV0IHR5cGVzIGZvciB0aGUgVk0gaW4gcXVlc3Rpb25cbiAgYWJzdHJhY3QgZnJvbUJ1ZmZlcihieXRlczogQnVmZmVyLCBvZmZzZXQ/OiBudW1iZXIpOiBudW1iZXJcblxuICB0b0J1ZmZlcigpOiBCdWZmZXIge1xuICAgIGNvbnN0IG91dGJ1ZmY6IEJ1ZmZlciA9IHRoaXMub3V0cHV0LnRvQnVmZmVyKClcbiAgICBjb25zdCBvdXRpZDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXG4gICAgb3V0aWQud3JpdGVVSW50MzJCRSh0aGlzLm91dHB1dC5nZXRPdXRwdXRJRCgpLCAwKVxuICAgIGNvbnN0IGJhcnI6IEJ1ZmZlcltdID0gW291dGlkLCBvdXRidWZmXVxuICAgIHJldHVybiBCdWZmZXIuY29uY2F0KGJhcnIsIG91dGlkLmxlbmd0aCArIG91dGJ1ZmYubGVuZ3RoKVxuICB9XG5cbiAgZ2V0VGhyZXNob2xkKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMub3V0cHV0LmdldFRocmVzaG9sZCgpXG4gIH1cbiAgZ2V0TG9ja3RpbWUoKTogQk4ge1xuICAgIHJldHVybiB0aGlzLm91dHB1dC5nZXRMb2NrdGltZSgpXG4gIH1cbiAgZ2V0QWRkcmVzc2VzKCk6IEJ1ZmZlcltdIHtcbiAgICByZXR1cm4gdGhpcy5vdXRwdXQuZ2V0QWRkcmVzc2VzKClcbiAgfVxuXG4gIG1lZXRzVGhyZXNob2xkKGFkZHJzOiBCdWZmZXJbXSwgYXNPZjogQk4pOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5vdXRwdXQubWVldHNUaHJlc2hvbGQoYWRkcnMsIGFzT2YpXG4gIH1cblxuICBnZXRPdXRwdXQgPSAoKTogQmFzZU91dHB1dCA9PiB0aGlzLm91dHB1dFxuXG4gIC8qKlxuICAgKiBDbGFzcyByZXByZXNlbnRpbmcgYW4gW1tQYXJzZWFibGVPdXRwdXRdXSBmb3IgYSB0cmFuc2FjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIG91dHB1dCBBIG51bWJlciByZXByZXNlbnRpbmcgdGhlIElucHV0SUQgb2YgdGhlIFtbUGFyc2VhYmxlT3V0cHV0XV1cbiAgICovXG4gIGNvbnN0cnVjdG9yKG91dHB1dDogQmFzZU91dHB1dCA9IHVuZGVmaW5lZCkge1xuICAgIHN1cGVyKClcbiAgICB0aGlzLm91dHB1dCA9IG91dHB1dFxuICB9XG59XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBTdGFuZGFyZFRyYW5zZmVyYWJsZU91dHB1dCBleHRlbmRzIFN0YW5kYXJkUGFyc2VhYmxlT3V0cHV0IHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiU3RhbmRhcmRUcmFuc2ZlcmFibGVPdXRwdXRcIlxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZFxuXG4gIHNlcmlhbGl6ZShlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6IG9iamVjdCB7XG4gICAgbGV0IGZpZWxkczogb2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKVxuICAgIHJldHVybiB7XG4gICAgICAuLi5maWVsZHMsXG4gICAgICBhc3NldElEOiBzZXJpYWxpemF0aW9uLmVuY29kZXIodGhpcy5hc3NldElELCBlbmNvZGluZywgXCJCdWZmZXJcIiwgXCJjYjU4XCIpXG4gICAgfVxuICB9XG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpXG4gICAgdGhpcy5hc3NldElEID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxuICAgICAgZmllbGRzW1wiYXNzZXRJRFwiXSxcbiAgICAgIGVuY29kaW5nLFxuICAgICAgXCJjYjU4XCIsXG4gICAgICBcIkJ1ZmZlclwiLFxuICAgICAgMzJcbiAgICApXG4gIH1cblxuICBwcm90ZWN0ZWQgYXNzZXRJRDogQnVmZmVyID0gdW5kZWZpbmVkXG5cbiAgZ2V0QXNzZXRJRCA9ICgpOiBCdWZmZXIgPT4gdGhpcy5hc3NldElEXG5cbiAgLy8gbXVzdCBiZSBpbXBsZW1lbnRlZCB0byBzZWxlY3Qgb3V0cHV0IHR5cGVzIGZvciB0aGUgVk0gaW4gcXVlc3Rpb25cbiAgYWJzdHJhY3QgZnJvbUJ1ZmZlcihieXRlczogQnVmZmVyLCBvZmZzZXQ/OiBudW1iZXIpOiBudW1iZXJcblxuICB0b0J1ZmZlcigpOiBCdWZmZXIge1xuICAgIGNvbnN0IHBhcnNlYWJsZUJ1ZmY6IEJ1ZmZlciA9IHN1cGVyLnRvQnVmZmVyKClcbiAgICBjb25zdCBiYXJyOiBCdWZmZXJbXSA9IFt0aGlzLmFzc2V0SUQsIHBhcnNlYWJsZUJ1ZmZdXG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoYmFyciwgdGhpcy5hc3NldElELmxlbmd0aCArIHBhcnNlYWJsZUJ1ZmYubGVuZ3RoKVxuICB9XG5cbiAgLyoqXG4gICAqIENsYXNzIHJlcHJlc2VudGluZyBhbiBbW1N0YW5kYXJkVHJhbnNmZXJhYmxlT3V0cHV0XV0gZm9yIGEgdHJhbnNhY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSBhc3NldElEIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50aW5nIHRoZSBhc3NldElEIG9mIHRoZSBbW091dHB1dF1dXG4gICAqIEBwYXJhbSBvdXRwdXQgQSBudW1iZXIgcmVwcmVzZW50aW5nIHRoZSBJbnB1dElEIG9mIHRoZSBbW1N0YW5kYXJkVHJhbnNmZXJhYmxlT3V0cHV0XV1cbiAgICovXG4gIGNvbnN0cnVjdG9yKGFzc2V0SUQ6IEJ1ZmZlciA9IHVuZGVmaW5lZCwgb3V0cHV0OiBCYXNlT3V0cHV0ID0gdW5kZWZpbmVkKSB7XG4gICAgc3VwZXIob3V0cHV0KVxuICAgIGlmICh0eXBlb2YgYXNzZXRJRCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhpcy5hc3NldElEID0gYXNzZXRJRFxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEFuIFtbT3V0cHV0XV0gY2xhc3Mgd2hpY2ggc3BlY2lmaWVzIGEgdG9rZW4gYW1vdW50IC5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFN0YW5kYXJkQW1vdW50T3V0cHV0IGV4dGVuZHMgT3V0cHV0IHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiU3RhbmRhcmRBbW91bnRPdXRwdXRcIlxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZFxuXG4gIHNlcmlhbGl6ZShlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6IG9iamVjdCB7XG4gICAgbGV0IGZpZWxkczogb2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKVxuICAgIHJldHVybiB7XG4gICAgICAuLi5maWVsZHMsXG4gICAgICBhbW91bnQ6IHNlcmlhbGl6YXRpb24uZW5jb2RlcihcbiAgICAgICAgdGhpcy5hbW91bnQsXG4gICAgICAgIGVuY29kaW5nLFxuICAgICAgICBcIkJ1ZmZlclwiLFxuICAgICAgICBcImRlY2ltYWxTdHJpbmdcIixcbiAgICAgICAgOFxuICAgICAgKVxuICAgIH1cbiAgfVxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxuICAgIHRoaXMuYW1vdW50ID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxuICAgICAgZmllbGRzW1wiYW1vdW50XCJdLFxuICAgICAgZW5jb2RpbmcsXG4gICAgICBcImRlY2ltYWxTdHJpbmdcIixcbiAgICAgIFwiQnVmZmVyXCIsXG4gICAgICA4XG4gICAgKVxuICAgIHRoaXMuYW1vdW50VmFsdWUgPSBiaW50b29scy5mcm9tQnVmZmVyVG9CTih0aGlzLmFtb3VudClcbiAgfVxuXG4gIHByb3RlY3RlZCBhbW91bnQ6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg4KVxuICBwcm90ZWN0ZWQgYW1vdW50VmFsdWU6IEJOID0gbmV3IEJOKDApXG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGFtb3VudCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59LlxuICAgKi9cbiAgZ2V0QW1vdW50KCk6IEJOIHtcbiAgICByZXR1cm4gdGhpcy5hbW91bnRWYWx1ZS5jbG9uZSgpXG4gIH1cblxuICAvKipcbiAgICogUG9wdWF0ZXMgdGhlIGluc3RhbmNlIGZyb20gYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRpbmcgdGhlIFtbU3RhbmRhcmRBbW91bnRPdXRwdXRdXSBhbmQgcmV0dXJucyB0aGUgc2l6ZSBvZiB0aGUgb3V0cHV0LlxuICAgKi9cbiAgZnJvbUJ1ZmZlcihvdXRidWZmOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyID0gMCk6IG51bWJlciB7XG4gICAgdGhpcy5hbW91bnQgPSBiaW50b29scy5jb3B5RnJvbShvdXRidWZmLCBvZmZzZXQsIG9mZnNldCArIDgpXG4gICAgdGhpcy5hbW91bnRWYWx1ZSA9IGJpbnRvb2xzLmZyb21CdWZmZXJUb0JOKHRoaXMuYW1vdW50KVxuICAgIG9mZnNldCArPSA4XG4gICAgcmV0dXJuIHN1cGVyLmZyb21CdWZmZXIob3V0YnVmZiwgb2Zmc2V0KVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGJ1ZmZlciByZXByZXNlbnRpbmcgdGhlIFtbU3RhbmRhcmRBbW91bnRPdXRwdXRdXSBpbnN0YW5jZS5cbiAgICovXG4gIHRvQnVmZmVyKCk6IEJ1ZmZlciB7XG4gICAgY29uc3Qgc3VwZXJidWZmOiBCdWZmZXIgPSBzdXBlci50b0J1ZmZlcigpXG4gICAgY29uc3QgYnNpemU6IG51bWJlciA9IHRoaXMuYW1vdW50Lmxlbmd0aCArIHN1cGVyYnVmZi5sZW5ndGhcbiAgICB0aGlzLm51bWFkZHJzLndyaXRlVUludDMyQkUodGhpcy5hZGRyZXNzZXMubGVuZ3RoLCAwKVxuICAgIGNvbnN0IGJhcnI6IEJ1ZmZlcltdID0gW3RoaXMuYW1vdW50LCBzdXBlcmJ1ZmZdXG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoYmFyciwgYnNpemUpXG4gIH1cblxuICAvKipcbiAgICogQSBbW1N0YW5kYXJkQW1vdW50T3V0cHV0XV0gY2xhc3Mgd2hpY2ggaXNzdWVzIGEgcGF5bWVudCBvbiBhbiBhc3NldElELlxuICAgKlxuICAgKiBAcGFyYW0gYW1vdW50IEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0gcmVwcmVzZW50aW5nIHRoZSBhbW91bnQgaW4gdGhlIG91dHB1dFxuICAgKiBAcGFyYW0gYWRkcmVzc2VzIEFuIGFycmF5IG9mIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9cyByZXByZXNlbnRpbmcgYWRkcmVzc2VzXG4gICAqIEBwYXJhbSBsb2NrdGltZSBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59IHJlcHJlc2VudGluZyB0aGUgbG9ja3RpbWVcbiAgICogQHBhcmFtIHRocmVzaG9sZCBBIG51bWJlciByZXByZXNlbnRpbmcgdGhlIHRoZSB0aHJlc2hvbGQgbnVtYmVyIG9mIHNpZ25lcnMgcmVxdWlyZWQgdG8gc2lnbiB0aGUgdHJhbnNhY3Rpb25cbiAgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgIGFtb3VudDogQk4gPSB1bmRlZmluZWQsXG4gICAgYWRkcmVzc2VzOiBCdWZmZXJbXSA9IHVuZGVmaW5lZCxcbiAgICBsb2NrdGltZTogQk4gPSB1bmRlZmluZWQsXG4gICAgdGhyZXNob2xkOiBudW1iZXIgPSB1bmRlZmluZWRcbiAgKSB7XG4gICAgc3VwZXIoYWRkcmVzc2VzLCBsb2NrdGltZSwgdGhyZXNob2xkKVxuICAgIGlmICh0eXBlb2YgYW1vdW50ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aGlzLmFtb3VudFZhbHVlID0gYW1vdW50LmNsb25lKClcbiAgICAgIHRoaXMuYW1vdW50ID0gYmludG9vbHMuZnJvbUJOVG9CdWZmZXIoYW1vdW50LCA4KVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEFuIFtbT3V0cHV0XV0gY2xhc3Mgd2hpY2ggc3BlY2lmaWVzIGFuIE5GVC5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEJhc2VORlRPdXRwdXQgZXh0ZW5kcyBPdXRwdXQge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJCYXNlTkZUT3V0cHV0XCJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcblxuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOiBvYmplY3Qge1xuICAgIGxldCBmaWVsZHM6IG9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZylcbiAgICByZXR1cm4ge1xuICAgICAgLi4uZmllbGRzLFxuICAgICAgZ3JvdXBJRDogc2VyaWFsaXphdGlvbi5lbmNvZGVyKFxuICAgICAgICB0aGlzLmdyb3VwSUQsXG4gICAgICAgIGVuY29kaW5nLFxuICAgICAgICBcIkJ1ZmZlclwiLFxuICAgICAgICBcImRlY2ltYWxTdHJpbmdcIixcbiAgICAgICAgNFxuICAgICAgKVxuICAgIH1cbiAgfVxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxuICAgIHRoaXMuZ3JvdXBJRCA9IHNlcmlhbGl6YXRpb24uZGVjb2RlcihcbiAgICAgIGZpZWxkc1tcImdyb3VwSURcIl0sXG4gICAgICBlbmNvZGluZyxcbiAgICAgIFwiZGVjaW1hbFN0cmluZ1wiLFxuICAgICAgXCJCdWZmZXJcIixcbiAgICAgIDRcbiAgICApXG4gIH1cblxuICBwcm90ZWN0ZWQgZ3JvdXBJRDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGdyb3VwSUQgYXMgYSBudW1iZXIuXG4gICAqL1xuICBnZXRHcm91cElEID0gKCk6IG51bWJlciA9PiB7XG4gICAgcmV0dXJuIHRoaXMuZ3JvdXBJRC5yZWFkVUludDMyQkUoMClcbiAgfVxufVxuIl19