"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StandardUTXOSet = exports.StandardUTXO = void 0;
/**
 * @packageDocumentation
 * @module Common-UTXOs
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../utils/bintools"));
const bn_js_1 = __importDefault(require("bn.js"));
const output_1 = require("./output");
const helperfunctions_1 = require("../utils/helperfunctions");
const serialization_1 = require("../utils/serialization");
const errors_1 = require("../utils/errors");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serialization = serialization_1.Serialization.getInstance();
/**
 * Class for representing a single StandardUTXO.
 */
class StandardUTXO extends serialization_1.Serializable {
    /**
     * Class for representing a single StandardUTXO.
     *
     * @param codecID Optional number which specifies the codeID of the UTXO. Default 0
     * @param txID Optional {@link https://github.com/feross/buffer|Buffer} of transaction ID for the StandardUTXO
     * @param txidx Optional {@link https://github.com/feross/buffer|Buffer} or number for the index of the transaction's [[Output]]
     * @param assetID Optional {@link https://github.com/feross/buffer|Buffer} of the asset ID for the StandardUTXO
     * @param outputid Optional {@link https://github.com/feross/buffer|Buffer} or number of the output ID for the StandardUTXO
     */
    constructor(codecID = 0, txID = undefined, outputidx = undefined, assetID = undefined, output = undefined) {
        super();
        this._typeName = "StandardUTXO";
        this._typeID = undefined;
        this.codecID = buffer_1.Buffer.alloc(2);
        this.txid = buffer_1.Buffer.alloc(32);
        this.outputidx = buffer_1.Buffer.alloc(4);
        this.assetID = buffer_1.Buffer.alloc(32);
        this.output = undefined;
        /**
         * Returns the numeric representation of the CodecID.
         */
        this.getCodecID = () => this.codecID.readUInt8(0);
        /**
         * Returns the {@link https://github.com/feross/buffer|Buffer} representation of the CodecID
         */
        this.getCodecIDBuffer = () => this.codecID;
        /**
         * Returns a {@link https://github.com/feross/buffer|Buffer} of the TxID.
         */
        this.getTxID = () => this.txid;
        /**
         * Returns a {@link https://github.com/feross/buffer|Buffer}  of the OutputIdx.
         */
        this.getOutputIdx = () => this.outputidx;
        /**
         * Returns the assetID as a {@link https://github.com/feross/buffer|Buffer}.
         */
        this.getAssetID = () => this.assetID;
        /**
         * Returns the UTXOID as a base-58 string (UTXOID is a string )
         */
        this.getUTXOID = () => bintools.bufferToB58(buffer_1.Buffer.concat([this.getTxID(), this.getOutputIdx()]));
        /**
         * Returns a reference to the output
         */
        this.getOutput = () => this.output;
        if (typeof codecID !== "undefined") {
            this.codecID.writeUInt8(codecID, 0);
        }
        if (typeof txID !== "undefined") {
            this.txid = txID;
        }
        if (typeof outputidx === "number") {
            this.outputidx.writeUInt32BE(outputidx, 0);
        }
        else if (outputidx instanceof buffer_1.Buffer) {
            this.outputidx = outputidx;
        }
        if (typeof assetID !== "undefined") {
            this.assetID = assetID;
        }
        if (typeof output !== "undefined") {
            this.output = output;
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { codecID: serialization.encoder(this.codecID, encoding, "Buffer", "decimalString"), txid: serialization.encoder(this.txid, encoding, "Buffer", "cb58"), outputidx: serialization.encoder(this.outputidx, encoding, "Buffer", "decimalString"), assetID: serialization.encoder(this.assetID, encoding, "Buffer", "cb58"), output: this.output.serialize(encoding) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.codecID = serialization.decoder(fields["codecID"], encoding, "decimalString", "Buffer", 2);
        this.txid = serialization.decoder(fields["txid"], encoding, "cb58", "Buffer", 32);
        this.outputidx = serialization.decoder(fields["outputidx"], encoding, "decimalString", "Buffer", 4);
        this.assetID = serialization.decoder(fields["assetID"], encoding, "cb58", "Buffer", 32);
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[StandardUTXO]].
     */
    toBuffer() {
        const outbuff = this.output.toBuffer();
        const outputidbuffer = buffer_1.Buffer.alloc(4);
        outputidbuffer.writeUInt32BE(this.output.getOutputID(), 0);
        const barr = [
            this.codecID,
            this.txid,
            this.outputidx,
            this.assetID,
            outputidbuffer,
            outbuff
        ];
        return buffer_1.Buffer.concat(barr, this.codecID.length +
            this.txid.length +
            this.outputidx.length +
            this.assetID.length +
            outputidbuffer.length +
            outbuff.length);
    }
}
exports.StandardUTXO = StandardUTXO;
/**
 * Class representing a set of [[StandardUTXO]]s.
 */
class StandardUTXOSet extends serialization_1.Serializable {
    constructor() {
        super(...arguments);
        this._typeName = "StandardUTXOSet";
        this._typeID = undefined;
        this.utxos = {};
        this.addressUTXOs = {}; // maps address to utxoids:locktime
        /**
         * Returns true if the [[StandardUTXO]] is in the StandardUTXOSet.
         *
         * @param utxo Either a [[StandardUTXO]] a cb58 serialized string representing a StandardUTXO
         */
        this.includes = (utxo) => {
            let utxoX = undefined;
            let utxoid = undefined;
            try {
                utxoX = this.parseUTXO(utxo);
                utxoid = utxoX.getUTXOID();
            }
            catch (e) {
                if (e instanceof Error) {
                    console.log(e.message);
                }
                else {
                    console.log(e);
                }
                return false;
            }
            return utxoid in this.utxos;
        };
        /**
         * Removes a [[StandardUTXO]] from the [[StandardUTXOSet]] if it exists.
         *
         * @param utxo Either a [[StandardUTXO]] an cb58 serialized string representing a StandardUTXO
         *
         * @returns A [[StandardUTXO]] if it was removed and undefined if nothing was removed.
         */
        this.remove = (utxo) => {
            let utxovar = undefined;
            try {
                utxovar = this.parseUTXO(utxo);
            }
            catch (e) {
                if (e instanceof Error) {
                    console.log(e.message);
                }
                else {
                    console.log(e);
                }
                return undefined;
            }
            const utxoid = utxovar.getUTXOID();
            if (!(utxoid in this.utxos)) {
                return undefined;
            }
            delete this.utxos[`${utxoid}`];
            const addresses = Object.keys(this.addressUTXOs);
            for (let i = 0; i < addresses.length; i++) {
                if (utxoid in this.addressUTXOs[addresses[`${i}`]]) {
                    delete this.addressUTXOs[addresses[`${i}`]][`${utxoid}`];
                }
            }
            return utxovar;
        };
        /**
         * Removes an array of [[StandardUTXO]]s to the [[StandardUTXOSet]].
         *
         * @param utxo Either a [[StandardUTXO]] an cb58 serialized string representing a StandardUTXO
         * @param overwrite If true, if the UTXOID already exists, overwrite it... default false
         *
         * @returns An array of UTXOs which were removed.
         */
        this.removeArray = (utxos) => {
            const removed = [];
            for (let i = 0; i < utxos.length; i++) {
                const result = this.remove(utxos[`${i}`]);
                if (typeof result !== "undefined") {
                    removed.push(result);
                }
            }
            return removed;
        };
        /**
         * Gets a [[StandardUTXO]] from the [[StandardUTXOSet]] by its UTXOID.
         *
         * @param utxoid String representing the UTXOID
         *
         * @returns A [[StandardUTXO]] if it exists in the set.
         */
        this.getUTXO = (utxoid) => this.utxos[`${utxoid}`];
        /**
         * Gets all the [[StandardUTXO]]s, optionally that match with UTXOIDs in an array
         *
         * @param utxoids An optional array of UTXOIDs, returns all [[StandardUTXO]]s if not provided
         *
         * @returns An array of [[StandardUTXO]]s.
         */
        this.getAllUTXOs = (utxoids = undefined) => {
            let results = [];
            if (typeof utxoids !== "undefined" && Array.isArray(utxoids)) {
                results = utxoids
                    .filter((utxoid) => this.utxos[`${utxoid}`])
                    .map((utxoid) => this.utxos[`${utxoid}`]);
            }
            else {
                results = Object.values(this.utxos);
            }
            return results;
        };
        /**
         * Gets all the [[StandardUTXO]]s as strings, optionally that match with UTXOIDs in an array.
         *
         * @param utxoids An optional array of UTXOIDs, returns all [[StandardUTXO]]s if not provided
         *
         * @returns An array of [[StandardUTXO]]s as cb58 serialized strings.
         */
        this.getAllUTXOStrings = (utxoids = undefined) => {
            const results = [];
            const utxos = Object.keys(this.utxos);
            if (typeof utxoids !== "undefined" && Array.isArray(utxoids)) {
                for (let i = 0; i < utxoids.length; i++) {
                    if (utxoids[`${i}`] in this.utxos) {
                        results.push(this.utxos[utxoids[`${i}`]].toString());
                    }
                }
            }
            else {
                for (const u of utxos) {
                    results.push(this.utxos[`${u}`].toString());
                }
            }
            return results;
        };
        /**
         * Given an address or array of addresses, returns all the UTXOIDs for those addresses
         *
         * @param address An array of address {@link https://github.com/feross/buffer|Buffer}s
         * @param spendable If true, only retrieves UTXOIDs whose locktime has passed
         *
         * @returns An array of addresses.
         */
        this.getUTXOIDs = (addresses = undefined, spendable = true) => {
            if (typeof addresses !== "undefined") {
                const results = [];
                const now = (0, helperfunctions_1.UnixNow)();
                for (let i = 0; i < addresses.length; i++) {
                    if (addresses[`${i}`].toString("hex") in this.addressUTXOs) {
                        const entries = Object.entries(this.addressUTXOs[addresses[`${i}`].toString("hex")]);
                        for (const [utxoid, locktime] of entries) {
                            if ((results.indexOf(utxoid) === -1 &&
                                spendable &&
                                locktime.lte(now)) ||
                                !spendable) {
                                results.push(utxoid);
                            }
                        }
                    }
                }
                return results;
            }
            return Object.keys(this.utxos);
        };
        /**
         * Gets the addresses in the [[StandardUTXOSet]] and returns an array of {@link https://github.com/feross/buffer|Buffer}.
         */
        this.getAddresses = () => Object.keys(this.addressUTXOs).map((k) => buffer_1.Buffer.from(k, "hex"));
        /**
         * Returns the balance of a set of addresses in the StandardUTXOSet.
         *
         * @param addresses An array of addresses
         * @param assetID Either a {@link https://github.com/feross/buffer|Buffer} or an cb58 serialized representation of an AssetID
         * @param asOf The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         *
         * @returns Returns the total balance as a {@link https://github.com/indutny/bn.js/|BN}.
         */
        this.getBalance = (addresses, assetID, asOf = undefined) => {
            const utxoids = this.getUTXOIDs(addresses);
            const utxos = this.getAllUTXOs(utxoids);
            let spend = new bn_js_1.default(0);
            let asset;
            if (typeof assetID === "string") {
                asset = bintools.cb58Decode(assetID);
            }
            else {
                asset = assetID;
            }
            for (let i = 0; i < utxos.length; i++) {
                if (utxos[`${i}`].getOutput() instanceof output_1.StandardAmountOutput &&
                    utxos[`${i}`].getAssetID().toString("hex") === asset.toString("hex") &&
                    utxos[`${i}`].getOutput().meetsThreshold(addresses, asOf)) {
                    spend = spend.add(utxos[`${i}`].getOutput().getAmount());
                }
            }
            return spend;
        };
        /**
         * Gets all the Asset IDs, optionally that match with Asset IDs in an array
         *
         * @param utxoids An optional array of Addresses as string or Buffer, returns all Asset IDs if not provided
         *
         * @returns An array of {@link https://github.com/feross/buffer|Buffer} representing the Asset IDs.
         */
        this.getAssetIDs = (addresses = undefined) => {
            const results = new Set();
            let utxoids = [];
            if (typeof addresses !== "undefined") {
                utxoids = this.getUTXOIDs(addresses);
            }
            else {
                utxoids = this.getUTXOIDs();
            }
            for (let i = 0; i < utxoids.length; i++) {
                if (utxoids[`${i}`] in this.utxos && !(utxoids[`${i}`] in results)) {
                    results.add(this.utxos[utxoids[`${i}`]].getAssetID());
                }
            }
            return [...results];
        };
        /**
         * Returns a new set with copy of UTXOs in this and set parameter.
         *
         * @param utxoset The [[StandardUTXOSet]] to merge with this one
         * @param hasUTXOIDs Will subselect a set of [[StandardUTXO]]s which have the UTXOIDs provided in this array, defults to all UTXOs
         *
         * @returns A new StandardUTXOSet that contains all the filtered elements.
         */
        this.merge = (utxoset, hasUTXOIDs = undefined) => {
            const results = this.create();
            const utxos1 = this.getAllUTXOs(hasUTXOIDs);
            const utxos2 = utxoset.getAllUTXOs(hasUTXOIDs);
            const process = (utxo) => {
                results.add(utxo);
            };
            utxos1.forEach(process);
            utxos2.forEach(process);
            return results;
        };
        /**
         * Set intersetion between this set and a parameter.
         *
         * @param utxoset The set to intersect
         *
         * @returns A new StandardUTXOSet containing the intersection
         */
        this.intersection = (utxoset) => {
            const us1 = this.getUTXOIDs();
            const us2 = utxoset.getUTXOIDs();
            const results = us1.filter((utxoid) => us2.includes(utxoid));
            return this.merge(utxoset, results);
        };
        /**
         * Set difference between this set and a parameter.
         *
         * @param utxoset The set to difference
         *
         * @returns A new StandardUTXOSet containing the difference
         */
        this.difference = (utxoset) => {
            const us1 = this.getUTXOIDs();
            const us2 = utxoset.getUTXOIDs();
            const results = us1.filter((utxoid) => !us2.includes(utxoid));
            return this.merge(utxoset, results);
        };
        /**
         * Set symmetrical difference between this set and a parameter.
         *
         * @param utxoset The set to symmetrical difference
         *
         * @returns A new StandardUTXOSet containing the symmetrical difference
         */
        this.symDifference = (utxoset) => {
            const us1 = this.getUTXOIDs();
            const us2 = utxoset.getUTXOIDs();
            const results = us1
                .filter((utxoid) => !us2.includes(utxoid))
                .concat(us2.filter((utxoid) => !us1.includes(utxoid)));
            return this.merge(utxoset, results);
        };
        /**
         * Set union between this set and a parameter.
         *
         * @param utxoset The set to union
         *
         * @returns A new StandardUTXOSet containing the union
         */
        this.union = (utxoset) => this.merge(utxoset);
        /**
         * Merges a set by the rule provided.
         *
         * @param utxoset The set to merge by the MergeRule
         * @param mergeRule The [[MergeRule]] to apply
         *
         * @returns A new StandardUTXOSet containing the merged data
         *
         * @remarks
         * The merge rules are as follows:
         *   * "intersection" - the intersection of the set
         *   * "differenceSelf" - the difference between the existing data and new set
         *   * "differenceNew" - the difference between the new data and the existing set
         *   * "symDifference" - the union of the differences between both sets of data
         *   * "union" - the unique set of all elements contained in both sets
         *   * "unionMinusNew" - the unique set of all elements contained in both sets, excluding values only found in the new set
         *   * "unionMinusSelf" - the unique set of all elements contained in both sets, excluding values only found in the existing set
         */
        this.mergeByRule = (utxoset, mergeRule) => {
            let uSet;
            switch (mergeRule) {
                case "intersection":
                    return this.intersection(utxoset);
                case "differenceSelf":
                    return this.difference(utxoset);
                case "differenceNew":
                    return utxoset.difference(this);
                case "symDifference":
                    return this.symDifference(utxoset);
                case "union":
                    return this.union(utxoset);
                case "unionMinusNew":
                    uSet = this.union(utxoset);
                    return uSet.difference(utxoset);
                case "unionMinusSelf":
                    uSet = this.union(utxoset);
                    return uSet.difference(this);
                default:
                    throw new errors_1.MergeRuleError("Error - StandardUTXOSet.mergeByRule: bad MergeRule");
            }
        };
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        let utxos = {};
        for (let utxoid in this.utxos) {
            let utxoidCleaned = serialization.encoder(utxoid, encoding, "base58", "base58");
            utxos[`${utxoidCleaned}`] = this.utxos[`${utxoid}`].serialize(encoding);
        }
        let addressUTXOs = {};
        for (let address in this.addressUTXOs) {
            let addressCleaned = serialization.encoder(address, encoding, "hex", "cb58");
            let utxobalance = {};
            for (let utxoid in this.addressUTXOs[`${address}`]) {
                let utxoidCleaned = serialization.encoder(utxoid, encoding, "base58", "base58");
                utxobalance[`${utxoidCleaned}`] = serialization.encoder(this.addressUTXOs[`${address}`][`${utxoid}`], encoding, "BN", "decimalString");
            }
            addressUTXOs[`${addressCleaned}`] = utxobalance;
        }
        return Object.assign(Object.assign({}, fields), { utxos,
            addressUTXOs });
    }
    /**
     * Adds a [[StandardUTXO]] to the StandardUTXOSet.
     *
     * @param utxo Either a [[StandardUTXO]] an cb58 serialized string representing a StandardUTXO
     * @param overwrite If true, if the UTXOID already exists, overwrite it... default false
     *
     * @returns A [[StandardUTXO]] if one was added and undefined if nothing was added.
     */
    add(utxo, overwrite = false) {
        let utxovar = undefined;
        try {
            utxovar = this.parseUTXO(utxo);
        }
        catch (e) {
            if (e instanceof Error) {
                console.log(e.message);
            }
            else {
                console.log(e);
            }
            return undefined;
        }
        const utxoid = utxovar.getUTXOID();
        if (!(utxoid in this.utxos) || overwrite === true) {
            this.utxos[`${utxoid}`] = utxovar;
            const addresses = utxovar.getOutput().getAddresses();
            const locktime = utxovar.getOutput().getLocktime();
            for (let i = 0; i < addresses.length; i++) {
                const address = addresses[`${i}`].toString("hex");
                if (!(address in this.addressUTXOs)) {
                    this.addressUTXOs[`${address}`] = {};
                }
                this.addressUTXOs[`${address}`][`${utxoid}`] = locktime;
            }
            return utxovar;
        }
        return undefined;
    }
    /**
     * Adds an array of [[StandardUTXO]]s to the [[StandardUTXOSet]].
     *
     * @param utxo Either a [[StandardUTXO]] an cb58 serialized string representing a StandardUTXO
     * @param overwrite If true, if the UTXOID already exists, overwrite it... default false
     *
     * @returns An array of StandardUTXOs which were added.
     */
    addArray(utxos, overwrite = false) {
        const added = [];
        for (let i = 0; i < utxos.length; i++) {
            let result = this.add(utxos[`${i}`], overwrite);
            if (typeof result !== "undefined") {
                added.push(result);
            }
        }
        return added;
    }
    filter(args, lambda) {
        let newset = this.clone();
        let utxos = this.getAllUTXOs();
        for (let i = 0; i < utxos.length; i++) {
            if (lambda(utxos[`${i}`], ...args) === false) {
                newset.remove(utxos[`${i}`]);
            }
        }
        return newset;
    }
}
exports.StandardUTXOSet = StandardUTXOSet;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXR4b3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29tbW9uL3V0eG9zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7R0FHRztBQUNILG9DQUFnQztBQUNoQyxpRUFBd0M7QUFDeEMsa0RBQXNCO0FBQ3RCLHFDQUEyRDtBQUMzRCw4REFBa0Q7QUFFbEQsMERBSStCO0FBQy9CLDRDQUFnRDtBQUVoRDs7R0FFRztBQUNILE1BQU0sUUFBUSxHQUFhLGtCQUFRLENBQUMsV0FBVyxFQUFFLENBQUE7QUFDakQsTUFBTSxhQUFhLEdBQWtCLDZCQUFhLENBQUMsV0FBVyxFQUFFLENBQUE7QUFFaEU7O0dBRUc7QUFDSCxNQUFzQixZQUFhLFNBQVEsNEJBQVk7SUFtSnJEOzs7Ozs7OztPQVFHO0lBQ0gsWUFDRSxVQUFrQixDQUFDLEVBQ25CLE9BQWUsU0FBUyxFQUN4QixZQUE2QixTQUFTLEVBQ3RDLFVBQWtCLFNBQVMsRUFDM0IsU0FBcUIsU0FBUztRQUU5QixLQUFLLEVBQUUsQ0FBQTtRQWxLQyxjQUFTLEdBQUcsY0FBYyxDQUFBO1FBQzFCLFlBQU8sR0FBRyxTQUFTLENBQUE7UUF1RG5CLFlBQU8sR0FBVyxlQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ2pDLFNBQUksR0FBVyxlQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQy9CLGNBQVMsR0FBVyxlQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ25DLFlBQU8sR0FBVyxlQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQ2xDLFdBQU0sR0FBZSxTQUFTLENBQUE7UUFFeEM7O1dBRUc7UUFDSCxlQUFVLEdBQUcsR0FBc0MsRUFBRSxDQUNuRCxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUUzQjs7V0FFRztRQUNILHFCQUFnQixHQUFHLEdBQVcs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LENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO2FBQzdCO1NBQ0Y7UUFDRCxPQUFPLE1BQU0sQ0FBQTtJQUNmLENBQUM7Q0FzSEY7QUFqZUQsMENBaWVDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgQ29tbW9uLVVUWE9zXG4gKi9cbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCJidWZmZXIvXCJcbmltcG9ydCBCaW5Ub29scyBmcm9tIFwiLi4vdXRpbHMvYmludG9vbHNcIlxuaW1wb3J0IEJOIGZyb20gXCJibi5qc1wiXG5pbXBvcnQgeyBCYXNlT3V0cHV0LCBTdGFuZGFyZEFtb3VudE91dHB1dCB9IGZyb20gXCIuL291dHB1dFwiXG5pbXBvcnQgeyBVbml4Tm93IH0gZnJvbSBcIi4uL3V0aWxzL2hlbHBlcmZ1bmN0aW9uc1wiXG5pbXBvcnQgeyBNZXJnZVJ1bGUgfSBmcm9tIFwiLi4vdXRpbHMvY29uc3RhbnRzXCJcbmltcG9ydCB7XG4gIFNlcmlhbGl6YWJsZSxcbiAgU2VyaWFsaXphdGlvbixcbiAgU2VyaWFsaXplZEVuY29kaW5nXG59IGZyb20gXCIuLi91dGlscy9zZXJpYWxpemF0aW9uXCJcbmltcG9ydCB7IE1lcmdlUnVsZUVycm9yIH0gZnJvbSBcIi4uL3V0aWxzL2Vycm9yc1wiXG5cbi8qKlxuICogQGlnbm9yZVxuICovXG5jb25zdCBiaW50b29sczogQmluVG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpXG5jb25zdCBzZXJpYWxpemF0aW9uOiBTZXJpYWxpemF0aW9uID0gU2VyaWFsaXphdGlvbi5nZXRJbnN0YW5jZSgpXG5cbi8qKlxuICogQ2xhc3MgZm9yIHJlcHJlc2VudGluZyBhIHNpbmdsZSBTdGFuZGFyZFVUWE8uXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBTdGFuZGFyZFVUWE8gZXh0ZW5kcyBTZXJpYWxpemFibGUge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJTdGFuZGFyZFVUWE9cIlxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZFxuXG4gIHNlcmlhbGl6ZShlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6IG9iamVjdCB7XG4gICAgbGV0IGZpZWxkczogb2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKVxuICAgIHJldHVybiB7XG4gICAgICAuLi5maWVsZHMsXG4gICAgICBjb2RlY0lEOiBzZXJpYWxpemF0aW9uLmVuY29kZXIoXG4gICAgICAgIHRoaXMuY29kZWNJRCxcbiAgICAgICAgZW5jb2RpbmcsXG4gICAgICAgIFwiQnVmZmVyXCIsXG4gICAgICAgIFwiZGVjaW1hbFN0cmluZ1wiXG4gICAgICApLFxuICAgICAgdHhpZDogc2VyaWFsaXphdGlvbi5lbmNvZGVyKHRoaXMudHhpZCwgZW5jb2RpbmcsIFwiQnVmZmVyXCIsIFwiY2I1OFwiKSxcbiAgICAgIG91dHB1dGlkeDogc2VyaWFsaXphdGlvbi5lbmNvZGVyKFxuICAgICAgICB0aGlzLm91dHB1dGlkeCxcbiAgICAgICAgZW5jb2RpbmcsXG4gICAgICAgIFwiQnVmZmVyXCIsXG4gICAgICAgIFwiZGVjaW1hbFN0cmluZ1wiXG4gICAgICApLFxuICAgICAgYXNzZXRJRDogc2VyaWFsaXphdGlvbi5lbmNvZGVyKHRoaXMuYXNzZXRJRCwgZW5jb2RpbmcsIFwiQnVmZmVyXCIsIFwiY2I1OFwiKSxcbiAgICAgIG91dHB1dDogdGhpcy5vdXRwdXQuc2VyaWFsaXplKGVuY29kaW5nKVxuICAgIH1cbiAgfVxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxuICAgIHRoaXMuY29kZWNJRCA9IHNlcmlhbGl6YXRpb24uZGVjb2RlcihcbiAgICAgIGZpZWxkc1tcImNvZGVjSURcIl0sXG4gICAgICBlbmNvZGluZyxcbiAgICAgIFwiZGVjaW1hbFN0cmluZ1wiLFxuICAgICAgXCJCdWZmZXJcIixcbiAgICAgIDJcbiAgICApXG4gICAgdGhpcy50eGlkID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxuICAgICAgZmllbGRzW1widHhpZFwiXSxcbiAgICAgIGVuY29kaW5nLFxuICAgICAgXCJjYjU4XCIsXG4gICAgICBcIkJ1ZmZlclwiLFxuICAgICAgMzJcbiAgICApXG4gICAgdGhpcy5vdXRwdXRpZHggPSBzZXJpYWxpemF0aW9uLmRlY29kZXIoXG4gICAgICBmaWVsZHNbXCJvdXRwdXRpZHhcIl0sXG4gICAgICBlbmNvZGluZyxcbiAgICAgIFwiZGVjaW1hbFN0cmluZ1wiLFxuICAgICAgXCJCdWZmZXJcIixcbiAgICAgIDRcbiAgICApXG4gICAgdGhpcy5hc3NldElEID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxuICAgICAgZmllbGRzW1wiYXNzZXRJRFwiXSxcbiAgICAgIGVuY29kaW5nLFxuICAgICAgXCJjYjU4XCIsXG4gICAgICBcIkJ1ZmZlclwiLFxuICAgICAgMzJcbiAgICApXG4gIH1cblxuICBwcm90ZWN0ZWQgY29kZWNJRDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDIpXG4gIHByb3RlY3RlZCB0eGlkOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMzIpXG4gIHByb3RlY3RlZCBvdXRwdXRpZHg6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxuICBwcm90ZWN0ZWQgYXNzZXRJRDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDMyKVxuICBwcm90ZWN0ZWQgb3V0cHV0OiBCYXNlT3V0cHV0ID0gdW5kZWZpbmVkXG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIG51bWVyaWMgcmVwcmVzZW50YXRpb24gb2YgdGhlIENvZGVjSUQuXG4gICAqL1xuICBnZXRDb2RlY0lEID0gKCk6IC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovIG51bWJlciA9PlxuICAgIHRoaXMuY29kZWNJRC5yZWFkVUludDgoMClcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50YXRpb24gb2YgdGhlIENvZGVjSURcbiAgICovXG4gIGdldENvZGVjSURCdWZmZXIgPSAoKTogQnVmZmVyID0+IHRoaXMuY29kZWNJRFxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gb2YgdGhlIFR4SUQuXG4gICAqL1xuICBnZXRUeElEID0gKCk6IC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovIEJ1ZmZlciA9PiB0aGlzLnR4aWRcblxuICAvKipcbiAgICogUmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9ICBvZiB0aGUgT3V0cHV0SWR4LlxuICAgKi9cbiAgZ2V0T3V0cHV0SWR4ID0gKCk6IC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovIEJ1ZmZlciA9PiB0aGlzLm91dHB1dGlkeFxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBhc3NldElEIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0uXG4gICAqL1xuICBnZXRBc3NldElEID0gKCk6IEJ1ZmZlciA9PiB0aGlzLmFzc2V0SURcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgVVRYT0lEIGFzIGEgYmFzZS01OCBzdHJpbmcgKFVUWE9JRCBpcyBhIHN0cmluZyApXG4gICAqL1xuICBnZXRVVFhPSUQgPSAoKTogLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi8gc3RyaW5nID0+XG4gICAgYmludG9vbHMuYnVmZmVyVG9CNTgoQnVmZmVyLmNvbmNhdChbdGhpcy5nZXRUeElEKCksIHRoaXMuZ2V0T3V0cHV0SWR4KCldKSlcblxuICAvKipcbiAgICogUmV0dXJucyBhIHJlZmVyZW5jZSB0byB0aGUgb3V0cHV0XG4gICAqL1xuICBnZXRPdXRwdXQgPSAoKTogQmFzZU91dHB1dCA9PiB0aGlzLm91dHB1dFxuXG4gIC8qKlxuICAgKiBUYWtlcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgYW4gW1tTdGFuZGFyZFVUWE9dXSwgcGFyc2VzIGl0LCBwb3B1bGF0ZXMgdGhlIGNsYXNzLCBhbmQgcmV0dXJucyB0aGUgbGVuZ3RoIG9mIHRoZSBTdGFuZGFyZFVUWE8gaW4gYnl0ZXMuXG4gICAqXG4gICAqIEBwYXJhbSBieXRlcyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgYSByYXcgW1tTdGFuZGFyZFVUWE9dXVxuICAgKi9cbiAgYWJzdHJhY3QgZnJvbUJ1ZmZlcihieXRlczogQnVmZmVyLCBvZmZzZXQ/OiBudW1iZXIpOiBudW1iZXJcblxuICAvKipcbiAgICogUmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBbW1N0YW5kYXJkVVRYT11dLlxuICAgKi9cbiAgdG9CdWZmZXIoKTogQnVmZmVyIHtcbiAgICBjb25zdCBvdXRidWZmOiBCdWZmZXIgPSB0aGlzLm91dHB1dC50b0J1ZmZlcigpXG4gICAgY29uc3Qgb3V0cHV0aWRidWZmZXI6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxuICAgIG91dHB1dGlkYnVmZmVyLndyaXRlVUludDMyQkUodGhpcy5vdXRwdXQuZ2V0T3V0cHV0SUQoKSwgMClcbiAgICBjb25zdCBiYXJyOiBCdWZmZXJbXSA9IFtcbiAgICAgIHRoaXMuY29kZWNJRCxcbiAgICAgIHRoaXMudHhpZCxcbiAgICAgIHRoaXMub3V0cHV0aWR4LFxuICAgICAgdGhpcy5hc3NldElELFxuICAgICAgb3V0cHV0aWRidWZmZXIsXG4gICAgICBvdXRidWZmXG4gICAgXVxuICAgIHJldHVybiBCdWZmZXIuY29uY2F0KFxuICAgICAgYmFycixcbiAgICAgIHRoaXMuY29kZWNJRC5sZW5ndGggK1xuICAgICAgICB0aGlzLnR4aWQubGVuZ3RoICtcbiAgICAgICAgdGhpcy5vdXRwdXRpZHgubGVuZ3RoICtcbiAgICAgICAgdGhpcy5hc3NldElELmxlbmd0aCArXG4gICAgICAgIG91dHB1dGlkYnVmZmVyLmxlbmd0aCArXG4gICAgICAgIG91dGJ1ZmYubGVuZ3RoXG4gICAgKVxuICB9XG5cbiAgYWJzdHJhY3QgZnJvbVN0cmluZyhzZXJpYWxpemVkOiBzdHJpbmcpOiBudW1iZXJcblxuICBhYnN0cmFjdCB0b1N0cmluZygpOiBzdHJpbmdcblxuICBhYnN0cmFjdCBjbG9uZSgpOiB0aGlzXG5cbiAgYWJzdHJhY3QgY3JlYXRlKFxuICAgIGNvZGVjSUQ/OiBudW1iZXIsXG4gICAgdHhpZD86IEJ1ZmZlcixcbiAgICBvdXRwdXRpZHg/OiBCdWZmZXIgfCBudW1iZXIsXG4gICAgYXNzZXRJRD86IEJ1ZmZlcixcbiAgICBvdXRwdXQ/OiBCYXNlT3V0cHV0XG4gICk6IHRoaXNcblxuICAvKipcbiAgICogQ2xhc3MgZm9yIHJlcHJlc2VudGluZyBhIHNpbmdsZSBTdGFuZGFyZFVUWE8uXG4gICAqXG4gICAqIEBwYXJhbSBjb2RlY0lEIE9wdGlvbmFsIG51bWJlciB3aGljaCBzcGVjaWZpZXMgdGhlIGNvZGVJRCBvZiB0aGUgVVRYTy4gRGVmYXVsdCAwXG4gICAqIEBwYXJhbSB0eElEIE9wdGlvbmFsIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9mIHRyYW5zYWN0aW9uIElEIGZvciB0aGUgU3RhbmRhcmRVVFhPXG4gICAqIEBwYXJhbSB0eGlkeCBPcHRpb25hbCB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvciBudW1iZXIgZm9yIHRoZSBpbmRleCBvZiB0aGUgdHJhbnNhY3Rpb24ncyBbW091dHB1dF1dXG4gICAqIEBwYXJhbSBhc3NldElEIE9wdGlvbmFsIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9mIHRoZSBhc3NldCBJRCBmb3IgdGhlIFN0YW5kYXJkVVRYT1xuICAgKiBAcGFyYW0gb3V0cHV0aWQgT3B0aW9uYWwge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gb3IgbnVtYmVyIG9mIHRoZSBvdXRwdXQgSUQgZm9yIHRoZSBTdGFuZGFyZFVUWE9cbiAgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgIGNvZGVjSUQ6IG51bWJlciA9IDAsXG4gICAgdHhJRDogQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIG91dHB1dGlkeDogQnVmZmVyIHwgbnVtYmVyID0gdW5kZWZpbmVkLFxuICAgIGFzc2V0SUQ6IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBvdXRwdXQ6IEJhc2VPdXRwdXQgPSB1bmRlZmluZWRcbiAgKSB7XG4gICAgc3VwZXIoKVxuICAgIGlmICh0eXBlb2YgY29kZWNJRCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhpcy5jb2RlY0lELndyaXRlVUludDgoY29kZWNJRCwgMClcbiAgICB9XG4gICAgaWYgKHR5cGVvZiB0eElEICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aGlzLnR4aWQgPSB0eElEXG4gICAgfVxuICAgIGlmICh0eXBlb2Ygb3V0cHV0aWR4ID09PSBcIm51bWJlclwiKSB7XG4gICAgICB0aGlzLm91dHB1dGlkeC53cml0ZVVJbnQzMkJFKG91dHB1dGlkeCwgMClcbiAgICB9IGVsc2UgaWYgKG91dHB1dGlkeCBpbnN0YW5jZW9mIEJ1ZmZlcikge1xuICAgICAgdGhpcy5vdXRwdXRpZHggPSBvdXRwdXRpZHhcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGFzc2V0SUQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHRoaXMuYXNzZXRJRCA9IGFzc2V0SURcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBvdXRwdXQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHRoaXMub3V0cHV0ID0gb3V0cHV0XG4gICAgfVxuICB9XG59XG4vKipcbiAqIENsYXNzIHJlcHJlc2VudGluZyBhIHNldCBvZiBbW1N0YW5kYXJkVVRYT11dcy5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFN0YW5kYXJkVVRYT1NldDxcbiAgVVRYT0NsYXNzIGV4dGVuZHMgU3RhbmRhcmRVVFhPXG4+IGV4dGVuZHMgU2VyaWFsaXphYmxlIHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiU3RhbmRhcmRVVFhPU2V0XCJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcblxuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOiBvYmplY3Qge1xuICAgIGxldCBmaWVsZHM6IG9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZylcbiAgICBsZXQgdXR4b3MgPSB7fVxuICAgIGZvciAobGV0IHV0eG9pZCBpbiB0aGlzLnV0eG9zKSB7XG4gICAgICBsZXQgdXR4b2lkQ2xlYW5lZDogc3RyaW5nID0gc2VyaWFsaXphdGlvbi5lbmNvZGVyKFxuICAgICAgICB1dHhvaWQsXG4gICAgICAgIGVuY29kaW5nLFxuICAgICAgICBcImJhc2U1OFwiLFxuICAgICAgICBcImJhc2U1OFwiXG4gICAgICApXG4gICAgICB1dHhvc1tgJHt1dHhvaWRDbGVhbmVkfWBdID0gdGhpcy51dHhvc1tgJHt1dHhvaWR9YF0uc2VyaWFsaXplKGVuY29kaW5nKVxuICAgIH1cbiAgICBsZXQgYWRkcmVzc1VUWE9zID0ge31cbiAgICBmb3IgKGxldCBhZGRyZXNzIGluIHRoaXMuYWRkcmVzc1VUWE9zKSB7XG4gICAgICBsZXQgYWRkcmVzc0NsZWFuZWQ6IHN0cmluZyA9IHNlcmlhbGl6YXRpb24uZW5jb2RlcihcbiAgICAgICAgYWRkcmVzcyxcbiAgICAgICAgZW5jb2RpbmcsXG4gICAgICAgIFwiaGV4XCIsXG4gICAgICAgIFwiY2I1OFwiXG4gICAgICApXG4gICAgICBsZXQgdXR4b2JhbGFuY2UgPSB7fVxuICAgICAgZm9yIChsZXQgdXR4b2lkIGluIHRoaXMuYWRkcmVzc1VUWE9zW2Ake2FkZHJlc3N9YF0pIHtcbiAgICAgICAgbGV0IHV0eG9pZENsZWFuZWQ6IHN0cmluZyA9IHNlcmlhbGl6YXRpb24uZW5jb2RlcihcbiAgICAgICAgICB1dHhvaWQsXG4gICAgICAgICAgZW5jb2RpbmcsXG4gICAgICAgICAgXCJiYXNlNThcIixcbiAgICAgICAgICBcImJhc2U1OFwiXG4gICAgICAgIClcbiAgICAgICAgdXR4b2JhbGFuY2VbYCR7dXR4b2lkQ2xlYW5lZH1gXSA9IHNlcmlhbGl6YXRpb24uZW5jb2RlcihcbiAgICAgICAgICB0aGlzLmFkZHJlc3NVVFhPc1tgJHthZGRyZXNzfWBdW2Ake3V0eG9pZH1gXSxcbiAgICAgICAgICBlbmNvZGluZyxcbiAgICAgICAgICBcIkJOXCIsXG4gICAgICAgICAgXCJkZWNpbWFsU3RyaW5nXCJcbiAgICAgICAgKVxuICAgICAgfVxuICAgICAgYWRkcmVzc1VUWE9zW2Ake2FkZHJlc3NDbGVhbmVkfWBdID0gdXR4b2JhbGFuY2VcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLmZpZWxkcyxcbiAgICAgIHV0eG9zLFxuICAgICAgYWRkcmVzc1VUWE9zXG4gICAgfVxuICB9XG5cbiAgcHJvdGVjdGVkIHV0eG9zOiB7IFt1dHhvaWQ6IHN0cmluZ106IFVUWE9DbGFzcyB9ID0ge31cbiAgcHJvdGVjdGVkIGFkZHJlc3NVVFhPczogeyBbYWRkcmVzczogc3RyaW5nXTogeyBbdXR4b2lkOiBzdHJpbmddOiBCTiB9IH0gPSB7fSAvLyBtYXBzIGFkZHJlc3MgdG8gdXR4b2lkczpsb2NrdGltZVxuXG4gIGFic3RyYWN0IHBhcnNlVVRYTyh1dHhvOiBVVFhPQ2xhc3MgfCBzdHJpbmcpOiBVVFhPQ2xhc3NcblxuICAvKipcbiAgICogUmV0dXJucyB0cnVlIGlmIHRoZSBbW1N0YW5kYXJkVVRYT11dIGlzIGluIHRoZSBTdGFuZGFyZFVUWE9TZXQuXG4gICAqXG4gICAqIEBwYXJhbSB1dHhvIEVpdGhlciBhIFtbU3RhbmRhcmRVVFhPXV0gYSBjYjU4IHNlcmlhbGl6ZWQgc3RyaW5nIHJlcHJlc2VudGluZyBhIFN0YW5kYXJkVVRYT1xuICAgKi9cbiAgaW5jbHVkZXMgPSAodXR4bzogVVRYT0NsYXNzIHwgc3RyaW5nKTogYm9vbGVhbiA9PiB7XG4gICAgbGV0IHV0eG9YOiBVVFhPQ2xhc3MgPSB1bmRlZmluZWRcbiAgICBsZXQgdXR4b2lkOiBzdHJpbmcgPSB1bmRlZmluZWRcbiAgICB0cnkge1xuICAgICAgdXR4b1ggPSB0aGlzLnBhcnNlVVRYTyh1dHhvKVxuICAgICAgdXR4b2lkID0gdXR4b1guZ2V0VVRYT0lEKClcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGUubWVzc2FnZSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGUpXG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gICAgcmV0dXJuIHV0eG9pZCBpbiB0aGlzLnV0eG9zXG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhIFtbU3RhbmRhcmRVVFhPXV0gdG8gdGhlIFN0YW5kYXJkVVRYT1NldC5cbiAgICpcbiAgICogQHBhcmFtIHV0eG8gRWl0aGVyIGEgW1tTdGFuZGFyZFVUWE9dXSBhbiBjYjU4IHNlcmlhbGl6ZWQgc3RyaW5nIHJlcHJlc2VudGluZyBhIFN0YW5kYXJkVVRYT1xuICAgKiBAcGFyYW0gb3ZlcndyaXRlIElmIHRydWUsIGlmIHRoZSBVVFhPSUQgYWxyZWFkeSBleGlzdHMsIG92ZXJ3cml0ZSBpdC4uLiBkZWZhdWx0IGZhbHNlXG4gICAqXG4gICAqIEByZXR1cm5zIEEgW1tTdGFuZGFyZFVUWE9dXSBpZiBvbmUgd2FzIGFkZGVkIGFuZCB1bmRlZmluZWQgaWYgbm90aGluZyB3YXMgYWRkZWQuXG4gICAqL1xuICBhZGQodXR4bzogVVRYT0NsYXNzIHwgc3RyaW5nLCBvdmVyd3JpdGU6IGJvb2xlYW4gPSBmYWxzZSk6IFVUWE9DbGFzcyB7XG4gICAgbGV0IHV0eG92YXI6IFVUWE9DbGFzcyA9IHVuZGVmaW5lZFxuICAgIHRyeSB7XG4gICAgICB1dHhvdmFyID0gdGhpcy5wYXJzZVVUWE8odXR4bylcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGUubWVzc2FnZSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGUpXG4gICAgICB9XG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgfVxuXG4gICAgY29uc3QgdXR4b2lkOiBzdHJpbmcgPSB1dHhvdmFyLmdldFVUWE9JRCgpXG4gICAgaWYgKCEodXR4b2lkIGluIHRoaXMudXR4b3MpIHx8IG92ZXJ3cml0ZSA9PT0gdHJ1ZSkge1xuICAgICAgdGhpcy51dHhvc1tgJHt1dHhvaWR9YF0gPSB1dHhvdmFyXG4gICAgICBjb25zdCBhZGRyZXNzZXM6IEJ1ZmZlcltdID0gdXR4b3Zhci5nZXRPdXRwdXQoKS5nZXRBZGRyZXNzZXMoKVxuICAgICAgY29uc3QgbG9ja3RpbWU6IEJOID0gdXR4b3Zhci5nZXRPdXRwdXQoKS5nZXRMb2NrdGltZSgpXG4gICAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgYWRkcmVzc2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGFkZHJlc3M6IHN0cmluZyA9IGFkZHJlc3Nlc1tgJHtpfWBdLnRvU3RyaW5nKFwiaGV4XCIpXG4gICAgICAgIGlmICghKGFkZHJlc3MgaW4gdGhpcy5hZGRyZXNzVVRYT3MpKSB7XG4gICAgICAgICAgdGhpcy5hZGRyZXNzVVRYT3NbYCR7YWRkcmVzc31gXSA9IHt9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5hZGRyZXNzVVRYT3NbYCR7YWRkcmVzc31gXVtgJHt1dHhvaWR9YF0gPSBsb2NrdGltZVxuICAgICAgfVxuICAgICAgcmV0dXJuIHV0eG92YXJcbiAgICB9XG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYW4gYXJyYXkgb2YgW1tTdGFuZGFyZFVUWE9dXXMgdG8gdGhlIFtbU3RhbmRhcmRVVFhPU2V0XV0uXG4gICAqXG4gICAqIEBwYXJhbSB1dHhvIEVpdGhlciBhIFtbU3RhbmRhcmRVVFhPXV0gYW4gY2I1OCBzZXJpYWxpemVkIHN0cmluZyByZXByZXNlbnRpbmcgYSBTdGFuZGFyZFVUWE9cbiAgICogQHBhcmFtIG92ZXJ3cml0ZSBJZiB0cnVlLCBpZiB0aGUgVVRYT0lEIGFscmVhZHkgZXhpc3RzLCBvdmVyd3JpdGUgaXQuLi4gZGVmYXVsdCBmYWxzZVxuICAgKlxuICAgKiBAcmV0dXJucyBBbiBhcnJheSBvZiBTdGFuZGFyZFVUWE9zIHdoaWNoIHdlcmUgYWRkZWQuXG4gICAqL1xuICBhZGRBcnJheShcbiAgICB1dHhvczogc3RyaW5nW10gfCBVVFhPQ2xhc3NbXSxcbiAgICBvdmVyd3JpdGU6IGJvb2xlYW4gPSBmYWxzZVxuICApOiBTdGFuZGFyZFVUWE9bXSB7XG4gICAgY29uc3QgYWRkZWQ6IFVUWE9DbGFzc1tdID0gW11cbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgdXR4b3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxldCByZXN1bHQ6IFVUWE9DbGFzcyA9IHRoaXMuYWRkKHV0eG9zW2Ake2l9YF0sIG92ZXJ3cml0ZSlcbiAgICAgIGlmICh0eXBlb2YgcmVzdWx0ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIGFkZGVkLnB1c2gocmVzdWx0KVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYWRkZWRcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGEgW1tTdGFuZGFyZFVUWE9dXSBmcm9tIHRoZSBbW1N0YW5kYXJkVVRYT1NldF1dIGlmIGl0IGV4aXN0cy5cbiAgICpcbiAgICogQHBhcmFtIHV0eG8gRWl0aGVyIGEgW1tTdGFuZGFyZFVUWE9dXSBhbiBjYjU4IHNlcmlhbGl6ZWQgc3RyaW5nIHJlcHJlc2VudGluZyBhIFN0YW5kYXJkVVRYT1xuICAgKlxuICAgKiBAcmV0dXJucyBBIFtbU3RhbmRhcmRVVFhPXV0gaWYgaXQgd2FzIHJlbW92ZWQgYW5kIHVuZGVmaW5lZCBpZiBub3RoaW5nIHdhcyByZW1vdmVkLlxuICAgKi9cbiAgcmVtb3ZlID0gKHV0eG86IFVUWE9DbGFzcyB8IHN0cmluZyk6IFVUWE9DbGFzcyA9PiB7XG4gICAgbGV0IHV0eG92YXI6IFVUWE9DbGFzcyA9IHVuZGVmaW5lZFxuICAgIHRyeSB7XG4gICAgICB1dHhvdmFyID0gdGhpcy5wYXJzZVVUWE8odXR4bylcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGUubWVzc2FnZSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGUpXG4gICAgICB9XG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgfVxuXG4gICAgY29uc3QgdXR4b2lkOiBzdHJpbmcgPSB1dHhvdmFyLmdldFVUWE9JRCgpXG4gICAgaWYgKCEodXR4b2lkIGluIHRoaXMudXR4b3MpKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgfVxuICAgIGRlbGV0ZSB0aGlzLnV0eG9zW2Ake3V0eG9pZH1gXVxuICAgIGNvbnN0IGFkZHJlc3NlcyA9IE9iamVjdC5rZXlzKHRoaXMuYWRkcmVzc1VUWE9zKVxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBhZGRyZXNzZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh1dHhvaWQgaW4gdGhpcy5hZGRyZXNzVVRYT3NbYWRkcmVzc2VzW2Ake2l9YF1dKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLmFkZHJlc3NVVFhPc1thZGRyZXNzZXNbYCR7aX1gXV1bYCR7dXR4b2lkfWBdXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB1dHhvdmFyXG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBhbiBhcnJheSBvZiBbW1N0YW5kYXJkVVRYT11dcyB0byB0aGUgW1tTdGFuZGFyZFVUWE9TZXRdXS5cbiAgICpcbiAgICogQHBhcmFtIHV0eG8gRWl0aGVyIGEgW1tTdGFuZGFyZFVUWE9dXSBhbiBjYjU4IHNlcmlhbGl6ZWQgc3RyaW5nIHJlcHJlc2VudGluZyBhIFN0YW5kYXJkVVRYT1xuICAgKiBAcGFyYW0gb3ZlcndyaXRlIElmIHRydWUsIGlmIHRoZSBVVFhPSUQgYWxyZWFkeSBleGlzdHMsIG92ZXJ3cml0ZSBpdC4uLiBkZWZhdWx0IGZhbHNlXG4gICAqXG4gICAqIEByZXR1cm5zIEFuIGFycmF5IG9mIFVUWE9zIHdoaWNoIHdlcmUgcmVtb3ZlZC5cbiAgICovXG4gIHJlbW92ZUFycmF5ID0gKHV0eG9zOiBzdHJpbmdbXSB8IFVUWE9DbGFzc1tdKTogVVRYT0NsYXNzW10gPT4ge1xuICAgIGNvbnN0IHJlbW92ZWQ6IFVUWE9DbGFzc1tdID0gW11cbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgdXR4b3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHJlc3VsdDogVVRYT0NsYXNzID0gdGhpcy5yZW1vdmUodXR4b3NbYCR7aX1gXSlcbiAgICAgIGlmICh0eXBlb2YgcmVzdWx0ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIHJlbW92ZWQucHVzaChyZXN1bHQpXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZW1vdmVkXG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhIFtbU3RhbmRhcmRVVFhPXV0gZnJvbSB0aGUgW1tTdGFuZGFyZFVUWE9TZXRdXSBieSBpdHMgVVRYT0lELlxuICAgKlxuICAgKiBAcGFyYW0gdXR4b2lkIFN0cmluZyByZXByZXNlbnRpbmcgdGhlIFVUWE9JRFxuICAgKlxuICAgKiBAcmV0dXJucyBBIFtbU3RhbmRhcmRVVFhPXV0gaWYgaXQgZXhpc3RzIGluIHRoZSBzZXQuXG4gICAqL1xuICBnZXRVVFhPID0gKHV0eG9pZDogc3RyaW5nKTogVVRYT0NsYXNzID0+IHRoaXMudXR4b3NbYCR7dXR4b2lkfWBdXG5cbiAgLyoqXG4gICAqIEdldHMgYWxsIHRoZSBbW1N0YW5kYXJkVVRYT11dcywgb3B0aW9uYWxseSB0aGF0IG1hdGNoIHdpdGggVVRYT0lEcyBpbiBhbiBhcnJheVxuICAgKlxuICAgKiBAcGFyYW0gdXR4b2lkcyBBbiBvcHRpb25hbCBhcnJheSBvZiBVVFhPSURzLCByZXR1cm5zIGFsbCBbW1N0YW5kYXJkVVRYT11dcyBpZiBub3QgcHJvdmlkZWRcbiAgICpcbiAgICogQHJldHVybnMgQW4gYXJyYXkgb2YgW1tTdGFuZGFyZFVUWE9dXXMuXG4gICAqL1xuICBnZXRBbGxVVFhPcyA9ICh1dHhvaWRzOiBzdHJpbmdbXSA9IHVuZGVmaW5lZCk6IFVUWE9DbGFzc1tdID0+IHtcbiAgICBsZXQgcmVzdWx0czogVVRYT0NsYXNzW10gPSBbXVxuICAgIGlmICh0eXBlb2YgdXR4b2lkcyAhPT0gXCJ1bmRlZmluZWRcIiAmJiBBcnJheS5pc0FycmF5KHV0eG9pZHMpKSB7XG4gICAgICByZXN1bHRzID0gdXR4b2lkc1xuICAgICAgICAuZmlsdGVyKCh1dHhvaWQpID0+IHRoaXMudXR4b3NbYCR7dXR4b2lkfWBdKVxuICAgICAgICAubWFwKCh1dHhvaWQpID0+IHRoaXMudXR4b3NbYCR7dXR4b2lkfWBdKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXN1bHRzID0gT2JqZWN0LnZhbHVlcyh0aGlzLnV0eG9zKVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0c1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYWxsIHRoZSBbW1N0YW5kYXJkVVRYT11dcyBhcyBzdHJpbmdzLCBvcHRpb25hbGx5IHRoYXQgbWF0Y2ggd2l0aCBVVFhPSURzIGluIGFuIGFycmF5LlxuICAgKlxuICAgKiBAcGFyYW0gdXR4b2lkcyBBbiBvcHRpb25hbCBhcnJheSBvZiBVVFhPSURzLCByZXR1cm5zIGFsbCBbW1N0YW5kYXJkVVRYT11dcyBpZiBub3QgcHJvdmlkZWRcbiAgICpcbiAgICogQHJldHVybnMgQW4gYXJyYXkgb2YgW1tTdGFuZGFyZFVUWE9dXXMgYXMgY2I1OCBzZXJpYWxpemVkIHN0cmluZ3MuXG4gICAqL1xuICBnZXRBbGxVVFhPU3RyaW5ncyA9ICh1dHhvaWRzOiBzdHJpbmdbXSA9IHVuZGVmaW5lZCk6IHN0cmluZ1tdID0+IHtcbiAgICBjb25zdCByZXN1bHRzOiBzdHJpbmdbXSA9IFtdXG4gICAgY29uc3QgdXR4b3MgPSBPYmplY3Qua2V5cyh0aGlzLnV0eG9zKVxuICAgIGlmICh0eXBlb2YgdXR4b2lkcyAhPT0gXCJ1bmRlZmluZWRcIiAmJiBBcnJheS5pc0FycmF5KHV0eG9pZHMpKSB7XG4gICAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgdXR4b2lkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAodXR4b2lkc1tgJHtpfWBdIGluIHRoaXMudXR4b3MpIHtcbiAgICAgICAgICByZXN1bHRzLnB1c2godGhpcy51dHhvc1t1dHhvaWRzW2Ake2l9YF1dLnRvU3RyaW5nKCkpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZm9yIChjb25zdCB1IG9mIHV0eG9zKSB7XG4gICAgICAgIHJlc3VsdHMucHVzaCh0aGlzLnV0eG9zW2Ake3V9YF0udG9TdHJpbmcoKSlcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdHNcbiAgfVxuXG4gIC8qKlxuICAgKiBHaXZlbiBhbiBhZGRyZXNzIG9yIGFycmF5IG9mIGFkZHJlc3NlcywgcmV0dXJucyBhbGwgdGhlIFVUWE9JRHMgZm9yIHRob3NlIGFkZHJlc3Nlc1xuICAgKlxuICAgKiBAcGFyYW0gYWRkcmVzcyBBbiBhcnJheSBvZiBhZGRyZXNzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9c1xuICAgKiBAcGFyYW0gc3BlbmRhYmxlIElmIHRydWUsIG9ubHkgcmV0cmlldmVzIFVUWE9JRHMgd2hvc2UgbG9ja3RpbWUgaGFzIHBhc3NlZFxuICAgKlxuICAgKiBAcmV0dXJucyBBbiBhcnJheSBvZiBhZGRyZXNzZXMuXG4gICAqL1xuICBnZXRVVFhPSURzID0gKFxuICAgIGFkZHJlc3NlczogQnVmZmVyW10gPSB1bmRlZmluZWQsXG4gICAgc3BlbmRhYmxlOiBib29sZWFuID0gdHJ1ZVxuICApOiBzdHJpbmdbXSA9PiB7XG4gICAgaWYgKHR5cGVvZiBhZGRyZXNzZXMgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGNvbnN0IHJlc3VsdHM6IHN0cmluZ1tdID0gW11cbiAgICAgIGNvbnN0IG5vdzogQk4gPSBVbml4Tm93KClcbiAgICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBhZGRyZXNzZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGFkZHJlc3Nlc1tgJHtpfWBdLnRvU3RyaW5nKFwiaGV4XCIpIGluIHRoaXMuYWRkcmVzc1VUWE9zKSB7XG4gICAgICAgICAgY29uc3QgZW50cmllcyA9IE9iamVjdC5lbnRyaWVzKFxuICAgICAgICAgICAgdGhpcy5hZGRyZXNzVVRYT3NbYWRkcmVzc2VzW2Ake2l9YF0udG9TdHJpbmcoXCJoZXhcIildXG4gICAgICAgICAgKVxuICAgICAgICAgIGZvciAoY29uc3QgW3V0eG9pZCwgbG9ja3RpbWVdIG9mIGVudHJpZXMpIHtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgKHJlc3VsdHMuaW5kZXhPZih1dHhvaWQpID09PSAtMSAmJlxuICAgICAgICAgICAgICAgIHNwZW5kYWJsZSAmJlxuICAgICAgICAgICAgICAgIGxvY2t0aW1lLmx0ZShub3cpKSB8fFxuICAgICAgICAgICAgICAhc3BlbmRhYmxlXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHV0eG9pZClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHRzXG4gICAgfVxuICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLnV0eG9zKVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGFkZHJlc3NlcyBpbiB0aGUgW1tTdGFuZGFyZFVUWE9TZXRdXSBhbmQgcmV0dXJucyBhbiBhcnJheSBvZiB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfS5cbiAgICovXG4gIGdldEFkZHJlc3NlcyA9ICgpOiBCdWZmZXJbXSA9PlxuICAgIE9iamVjdC5rZXlzKHRoaXMuYWRkcmVzc1VUWE9zKS5tYXAoKGspID0+IEJ1ZmZlci5mcm9tKGssIFwiaGV4XCIpKVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBiYWxhbmNlIG9mIGEgc2V0IG9mIGFkZHJlc3NlcyBpbiB0aGUgU3RhbmRhcmRVVFhPU2V0LlxuICAgKlxuICAgKiBAcGFyYW0gYWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3Nlc1xuICAgKiBAcGFyYW0gYXNzZXRJRCBFaXRoZXIgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvciBhbiBjYjU4IHNlcmlhbGl6ZWQgcmVwcmVzZW50YXRpb24gb2YgYW4gQXNzZXRJRFxuICAgKiBAcGFyYW0gYXNPZiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqXG4gICAqIEByZXR1cm5zIFJldHVybnMgdGhlIHRvdGFsIGJhbGFuY2UgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfS5cbiAgICovXG4gIGdldEJhbGFuY2UgPSAoXG4gICAgYWRkcmVzc2VzOiBCdWZmZXJbXSxcbiAgICBhc3NldElEOiBCdWZmZXIgfCBzdHJpbmcsXG4gICAgYXNPZjogQk4gPSB1bmRlZmluZWRcbiAgKTogQk4gPT4ge1xuICAgIGNvbnN0IHV0eG9pZHM6IHN0cmluZ1tdID0gdGhpcy5nZXRVVFhPSURzKGFkZHJlc3NlcylcbiAgICBjb25zdCB1dHhvczogU3RhbmRhcmRVVFhPW10gPSB0aGlzLmdldEFsbFVUWE9zKHV0eG9pZHMpXG4gICAgbGV0IHNwZW5kOiBCTiA9IG5ldyBCTigwKVxuICAgIGxldCBhc3NldDogQnVmZmVyXG4gICAgaWYgKHR5cGVvZiBhc3NldElEID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBhc3NldCA9IGJpbnRvb2xzLmNiNThEZWNvZGUoYXNzZXRJRClcbiAgICB9IGVsc2Uge1xuICAgICAgYXNzZXQgPSBhc3NldElEXG4gICAgfVxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCB1dHhvcy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKFxuICAgICAgICB1dHhvc1tgJHtpfWBdLmdldE91dHB1dCgpIGluc3RhbmNlb2YgU3RhbmRhcmRBbW91bnRPdXRwdXQgJiZcbiAgICAgICAgdXR4b3NbYCR7aX1gXS5nZXRBc3NldElEKCkudG9TdHJpbmcoXCJoZXhcIikgPT09IGFzc2V0LnRvU3RyaW5nKFwiaGV4XCIpICYmXG4gICAgICAgIHV0eG9zW2Ake2l9YF0uZ2V0T3V0cHV0KCkubWVldHNUaHJlc2hvbGQoYWRkcmVzc2VzLCBhc09mKVxuICAgICAgKSB7XG4gICAgICAgIHNwZW5kID0gc3BlbmQuYWRkKFxuICAgICAgICAgICh1dHhvc1tgJHtpfWBdLmdldE91dHB1dCgpIGFzIFN0YW5kYXJkQW1vdW50T3V0cHV0KS5nZXRBbW91bnQoKVxuICAgICAgICApXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzcGVuZFxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYWxsIHRoZSBBc3NldCBJRHMsIG9wdGlvbmFsbHkgdGhhdCBtYXRjaCB3aXRoIEFzc2V0IElEcyBpbiBhbiBhcnJheVxuICAgKlxuICAgKiBAcGFyYW0gdXR4b2lkcyBBbiBvcHRpb25hbCBhcnJheSBvZiBBZGRyZXNzZXMgYXMgc3RyaW5nIG9yIEJ1ZmZlciwgcmV0dXJucyBhbGwgQXNzZXQgSURzIGlmIG5vdCBwcm92aWRlZFxuICAgKlxuICAgKiBAcmV0dXJucyBBbiBhcnJheSBvZiB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRpbmcgdGhlIEFzc2V0IElEcy5cbiAgICovXG4gIGdldEFzc2V0SURzID0gKGFkZHJlc3NlczogQnVmZmVyW10gPSB1bmRlZmluZWQpOiBCdWZmZXJbXSA9PiB7XG4gICAgY29uc3QgcmVzdWx0czogU2V0PEJ1ZmZlcj4gPSBuZXcgU2V0KClcbiAgICBsZXQgdXR4b2lkczogc3RyaW5nW10gPSBbXVxuICAgIGlmICh0eXBlb2YgYWRkcmVzc2VzICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB1dHhvaWRzID0gdGhpcy5nZXRVVFhPSURzKGFkZHJlc3NlcylcbiAgICB9IGVsc2Uge1xuICAgICAgdXR4b2lkcyA9IHRoaXMuZ2V0VVRYT0lEcygpXG4gICAgfVxuXG4gICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IHV0eG9pZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh1dHhvaWRzW2Ake2l9YF0gaW4gdGhpcy51dHhvcyAmJiAhKHV0eG9pZHNbYCR7aX1gXSBpbiByZXN1bHRzKSkge1xuICAgICAgICByZXN1bHRzLmFkZCh0aGlzLnV0eG9zW3V0eG9pZHNbYCR7aX1gXV0uZ2V0QXNzZXRJRCgpKVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBbLi4ucmVzdWx0c11cbiAgfVxuXG4gIGFic3RyYWN0IGNsb25lKCk6IHRoaXNcblxuICBhYnN0cmFjdCBjcmVhdGUoLi4uYXJnczogYW55W10pOiB0aGlzXG5cbiAgZmlsdGVyKFxuICAgIGFyZ3M6IGFueVtdLFxuICAgIGxhbWJkYTogKHV0eG86IFVUWE9DbGFzcywgLi4ubGFyZ3M6IGFueVtdKSA9PiBib29sZWFuXG4gICk6IHRoaXMge1xuICAgIGxldCBuZXdzZXQ6IHRoaXMgPSB0aGlzLmNsb25lKClcbiAgICBsZXQgdXR4b3M6IFVUWE9DbGFzc1tdID0gdGhpcy5nZXRBbGxVVFhPcygpXG4gICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IHV0eG9zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAobGFtYmRhKHV0eG9zW2Ake2l9YF0sIC4uLmFyZ3MpID09PSBmYWxzZSkge1xuICAgICAgICBuZXdzZXQucmVtb3ZlKHV0eG9zW2Ake2l9YF0pXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBuZXdzZXRcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgbmV3IHNldCB3aXRoIGNvcHkgb2YgVVRYT3MgaW4gdGhpcyBhbmQgc2V0IHBhcmFtZXRlci5cbiAgICpcbiAgICogQHBhcmFtIHV0eG9zZXQgVGhlIFtbU3RhbmRhcmRVVFhPU2V0XV0gdG8gbWVyZ2Ugd2l0aCB0aGlzIG9uZVxuICAgKiBAcGFyYW0gaGFzVVRYT0lEcyBXaWxsIHN1YnNlbGVjdCBhIHNldCBvZiBbW1N0YW5kYXJkVVRYT11dcyB3aGljaCBoYXZlIHRoZSBVVFhPSURzIHByb3ZpZGVkIGluIHRoaXMgYXJyYXksIGRlZnVsdHMgdG8gYWxsIFVUWE9zXG4gICAqXG4gICAqIEByZXR1cm5zIEEgbmV3IFN0YW5kYXJkVVRYT1NldCB0aGF0IGNvbnRhaW5zIGFsbCB0aGUgZmlsdGVyZWQgZWxlbWVudHMuXG4gICAqL1xuICBtZXJnZSA9ICh1dHhvc2V0OiB0aGlzLCBoYXNVVFhPSURzOiBzdHJpbmdbXSA9IHVuZGVmaW5lZCk6IHRoaXMgPT4ge1xuICAgIGNvbnN0IHJlc3VsdHM6IHRoaXMgPSB0aGlzLmNyZWF0ZSgpXG4gICAgY29uc3QgdXR4b3MxOiBVVFhPQ2xhc3NbXSA9IHRoaXMuZ2V0QWxsVVRYT3MoaGFzVVRYT0lEcylcbiAgICBjb25zdCB1dHhvczI6IFVUWE9DbGFzc1tdID0gdXR4b3NldC5nZXRBbGxVVFhPcyhoYXNVVFhPSURzKVxuICAgIGNvbnN0IHByb2Nlc3MgPSAodXR4bzogVVRYT0NsYXNzKSA9PiB7XG4gICAgICByZXN1bHRzLmFkZCh1dHhvKVxuICAgIH1cbiAgICB1dHhvczEuZm9yRWFjaChwcm9jZXNzKVxuICAgIHV0eG9zMi5mb3JFYWNoKHByb2Nlc3MpXG4gICAgcmV0dXJuIHJlc3VsdHMgYXMgdGhpc1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBpbnRlcnNldGlvbiBiZXR3ZWVuIHRoaXMgc2V0IGFuZCBhIHBhcmFtZXRlci5cbiAgICpcbiAgICogQHBhcmFtIHV0eG9zZXQgVGhlIHNldCB0byBpbnRlcnNlY3RcbiAgICpcbiAgICogQHJldHVybnMgQSBuZXcgU3RhbmRhcmRVVFhPU2V0IGNvbnRhaW5pbmcgdGhlIGludGVyc2VjdGlvblxuICAgKi9cbiAgaW50ZXJzZWN0aW9uID0gKHV0eG9zZXQ6IHRoaXMpOiB0aGlzID0+IHtcbiAgICBjb25zdCB1czE6IHN0cmluZ1tdID0gdGhpcy5nZXRVVFhPSURzKClcbiAgICBjb25zdCB1czI6IHN0cmluZ1tdID0gdXR4b3NldC5nZXRVVFhPSURzKClcbiAgICBjb25zdCByZXN1bHRzOiBzdHJpbmdbXSA9IHVzMS5maWx0ZXIoKHV0eG9pZCkgPT4gdXMyLmluY2x1ZGVzKHV0eG9pZCkpXG4gICAgcmV0dXJuIHRoaXMubWVyZ2UodXR4b3NldCwgcmVzdWx0cykgYXMgdGhpc1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBkaWZmZXJlbmNlIGJldHdlZW4gdGhpcyBzZXQgYW5kIGEgcGFyYW1ldGVyLlxuICAgKlxuICAgKiBAcGFyYW0gdXR4b3NldCBUaGUgc2V0IHRvIGRpZmZlcmVuY2VcbiAgICpcbiAgICogQHJldHVybnMgQSBuZXcgU3RhbmRhcmRVVFhPU2V0IGNvbnRhaW5pbmcgdGhlIGRpZmZlcmVuY2VcbiAgICovXG4gIGRpZmZlcmVuY2UgPSAodXR4b3NldDogdGhpcyk6IHRoaXMgPT4ge1xuICAgIGNvbnN0IHVzMTogc3RyaW5nW10gPSB0aGlzLmdldFVUWE9JRHMoKVxuICAgIGNvbnN0IHVzMjogc3RyaW5nW10gPSB1dHhvc2V0LmdldFVUWE9JRHMoKVxuICAgIGNvbnN0IHJlc3VsdHM6IHN0cmluZ1tdID0gdXMxLmZpbHRlcigodXR4b2lkKSA9PiAhdXMyLmluY2x1ZGVzKHV0eG9pZCkpXG4gICAgcmV0dXJuIHRoaXMubWVyZ2UodXR4b3NldCwgcmVzdWx0cykgYXMgdGhpc1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBzeW1tZXRyaWNhbCBkaWZmZXJlbmNlIGJldHdlZW4gdGhpcyBzZXQgYW5kIGEgcGFyYW1ldGVyLlxuICAgKlxuICAgKiBAcGFyYW0gdXR4b3NldCBUaGUgc2V0IHRvIHN5bW1ldHJpY2FsIGRpZmZlcmVuY2VcbiAgICpcbiAgICogQHJldHVybnMgQSBuZXcgU3RhbmRhcmRVVFhPU2V0IGNvbnRhaW5pbmcgdGhlIHN5bW1ldHJpY2FsIGRpZmZlcmVuY2VcbiAgICovXG4gIHN5bURpZmZlcmVuY2UgPSAodXR4b3NldDogdGhpcyk6IHRoaXMgPT4ge1xuICAgIGNvbnN0IHVzMTogc3RyaW5nW10gPSB0aGlzLmdldFVUWE9JRHMoKVxuICAgIGNvbnN0IHVzMjogc3RyaW5nW10gPSB1dHhvc2V0LmdldFVUWE9JRHMoKVxuICAgIGNvbnN0IHJlc3VsdHM6IHN0cmluZ1tdID0gdXMxXG4gICAgICAuZmlsdGVyKCh1dHhvaWQpID0+ICF1czIuaW5jbHVkZXModXR4b2lkKSlcbiAgICAgIC5jb25jYXQodXMyLmZpbHRlcigodXR4b2lkKSA9PiAhdXMxLmluY2x1ZGVzKHV0eG9pZCkpKVxuICAgIHJldHVybiB0aGlzLm1lcmdlKHV0eG9zZXQsIHJlc3VsdHMpIGFzIHRoaXNcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdW5pb24gYmV0d2VlbiB0aGlzIHNldCBhbmQgYSBwYXJhbWV0ZXIuXG4gICAqXG4gICAqIEBwYXJhbSB1dHhvc2V0IFRoZSBzZXQgdG8gdW5pb25cbiAgICpcbiAgICogQHJldHVybnMgQSBuZXcgU3RhbmRhcmRVVFhPU2V0IGNvbnRhaW5pbmcgdGhlIHVuaW9uXG4gICAqL1xuICB1bmlvbiA9ICh1dHhvc2V0OiB0aGlzKTogdGhpcyA9PiB0aGlzLm1lcmdlKHV0eG9zZXQpIGFzIHRoaXNcblxuICAvKipcbiAgICogTWVyZ2VzIGEgc2V0IGJ5IHRoZSBydWxlIHByb3ZpZGVkLlxuICAgKlxuICAgKiBAcGFyYW0gdXR4b3NldCBUaGUgc2V0IHRvIG1lcmdlIGJ5IHRoZSBNZXJnZVJ1bGVcbiAgICogQHBhcmFtIG1lcmdlUnVsZSBUaGUgW1tNZXJnZVJ1bGVdXSB0byBhcHBseVxuICAgKlxuICAgKiBAcmV0dXJucyBBIG5ldyBTdGFuZGFyZFVUWE9TZXQgY29udGFpbmluZyB0aGUgbWVyZ2VkIGRhdGFcbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogVGhlIG1lcmdlIHJ1bGVzIGFyZSBhcyBmb2xsb3dzOlxuICAgKiAgICogXCJpbnRlcnNlY3Rpb25cIiAtIHRoZSBpbnRlcnNlY3Rpb24gb2YgdGhlIHNldFxuICAgKiAgICogXCJkaWZmZXJlbmNlU2VsZlwiIC0gdGhlIGRpZmZlcmVuY2UgYmV0d2VlbiB0aGUgZXhpc3RpbmcgZGF0YSBhbmQgbmV3IHNldFxuICAgKiAgICogXCJkaWZmZXJlbmNlTmV3XCIgLSB0aGUgZGlmZmVyZW5jZSBiZXR3ZWVuIHRoZSBuZXcgZGF0YSBhbmQgdGhlIGV4aXN0aW5nIHNldFxuICAgKiAgICogXCJzeW1EaWZmZXJlbmNlXCIgLSB0aGUgdW5pb24gb2YgdGhlIGRpZmZlcmVuY2VzIGJldHdlZW4gYm90aCBzZXRzIG9mIGRhdGFcbiAgICogICAqIFwidW5pb25cIiAtIHRoZSB1bmlxdWUgc2V0IG9mIGFsbCBlbGVtZW50cyBjb250YWluZWQgaW4gYm90aCBzZXRzXG4gICAqICAgKiBcInVuaW9uTWludXNOZXdcIiAtIHRoZSB1bmlxdWUgc2V0IG9mIGFsbCBlbGVtZW50cyBjb250YWluZWQgaW4gYm90aCBzZXRzLCBleGNsdWRpbmcgdmFsdWVzIG9ubHkgZm91bmQgaW4gdGhlIG5ldyBzZXRcbiAgICogICAqIFwidW5pb25NaW51c1NlbGZcIiAtIHRoZSB1bmlxdWUgc2V0IG9mIGFsbCBlbGVtZW50cyBjb250YWluZWQgaW4gYm90aCBzZXRzLCBleGNsdWRpbmcgdmFsdWVzIG9ubHkgZm91bmQgaW4gdGhlIGV4aXN0aW5nIHNldFxuICAgKi9cbiAgbWVyZ2VCeVJ1bGUgPSAodXR4b3NldDogdGhpcywgbWVyZ2VSdWxlOiBNZXJnZVJ1bGUpOiB0aGlzID0+IHtcbiAgICBsZXQgdVNldDogdGhpc1xuICAgIHN3aXRjaCAobWVyZ2VSdWxlKSB7XG4gICAgICBjYXNlIFwiaW50ZXJzZWN0aW9uXCI6XG4gICAgICAgIHJldHVybiB0aGlzLmludGVyc2VjdGlvbih1dHhvc2V0KVxuICAgICAgY2FzZSBcImRpZmZlcmVuY2VTZWxmXCI6XG4gICAgICAgIHJldHVybiB0aGlzLmRpZmZlcmVuY2UodXR4b3NldClcbiAgICAgIGNhc2UgXCJkaWZmZXJlbmNlTmV3XCI6XG4gICAgICAgIHJldHVybiB1dHhvc2V0LmRpZmZlcmVuY2UodGhpcykgYXMgdGhpc1xuICAgICAgY2FzZSBcInN5bURpZmZlcmVuY2VcIjpcbiAgICAgICAgcmV0dXJuIHRoaXMuc3ltRGlmZmVyZW5jZSh1dHhvc2V0KVxuICAgICAgY2FzZSBcInVuaW9uXCI6XG4gICAgICAgIHJldHVybiB0aGlzLnVuaW9uKHV0eG9zZXQpXG4gICAgICBjYXNlIFwidW5pb25NaW51c05ld1wiOlxuICAgICAgICB1U2V0ID0gdGhpcy51bmlvbih1dHhvc2V0KVxuICAgICAgICByZXR1cm4gdVNldC5kaWZmZXJlbmNlKHV0eG9zZXQpIGFzIHRoaXNcbiAgICAgIGNhc2UgXCJ1bmlvbk1pbnVzU2VsZlwiOlxuICAgICAgICB1U2V0ID0gdGhpcy51bmlvbih1dHhvc2V0KVxuICAgICAgICByZXR1cm4gdVNldC5kaWZmZXJlbmNlKHRoaXMpIGFzIHRoaXNcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IG5ldyBNZXJnZVJ1bGVFcnJvcihcbiAgICAgICAgICBcIkVycm9yIC0gU3RhbmRhcmRVVFhPU2V0Lm1lcmdlQnlSdWxlOiBiYWQgTWVyZ2VSdWxlXCJcbiAgICAgICAgKVxuICAgIH1cbiAgfVxufVxuIl19