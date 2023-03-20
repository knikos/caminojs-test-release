"use strict";
/**
 * @packageDocumentation
 * @module API-EVM-UTXOs
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UTXOSet = exports.AssetAmountDestination = exports.UTXO = void 0;
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const bn_js_1 = __importDefault(require("bn.js"));
const outputs_1 = require("./outputs");
const constants_1 = require("./constants");
const inputs_1 = require("./inputs");
const helperfunctions_1 = require("../../utils/helperfunctions");
const utxos_1 = require("../../common/utxos");
const constants_2 = require("../../utils/constants");
const assetamount_1 = require("../../common/assetamount");
const serialization_1 = require("../../utils/serialization");
const tx_1 = require("./tx");
const importtx_1 = require("./importtx");
const exporttx_1 = require("./exporttx");
const errors_1 = require("../../utils/errors");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serializer = serialization_1.Serialization.getInstance();
/**
 * Class for representing a single UTXO.
 */
class UTXO extends utxos_1.StandardUTXO {
    constructor() {
        super(...arguments);
        this._typeName = "UTXO";
        this._typeID = undefined;
    }
    //serialize is inherited
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.output = (0, outputs_1.SelectOutputClass)(fields["output"]["_typeID"]);
        this.output.deserialize(fields["output"], encoding);
    }
    fromBuffer(bytes, offset = 0) {
        this.codecID = bintools.copyFrom(bytes, offset, offset + 2);
        offset += 2;
        this.txid = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        this.outputidx = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        this.assetID = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        const outputid = bintools
            .copyFrom(bytes, offset, offset + 4)
            .readUInt32BE(0);
        offset += 4;
        this.output = (0, outputs_1.SelectOutputClass)(outputid);
        return this.output.fromBuffer(bytes, offset);
    }
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
    fromString(serialized) {
        /* istanbul ignore next */
        return this.fromBuffer(bintools.cb58Decode(serialized));
    }
    /**
     * Returns a base-58 representation of the [[UTXO]].
     *
     * @remarks
     * unlike most toStrings, this returns in cb58 serialization format
     */
    toString() {
        /* istanbul ignore next */
        return bintools.cb58Encode(this.toBuffer());
    }
    clone() {
        const utxo = new UTXO();
        utxo.fromBuffer(this.toBuffer());
        return utxo;
    }
    create(codecID = constants_1.EVMConstants.LATESTCODEC, txID = undefined, outputidx = undefined, assetID = undefined, output = undefined) {
        return new UTXO(codecID, txID, outputidx, assetID, output);
    }
}
exports.UTXO = UTXO;
class AssetAmountDestination extends assetamount_1.StandardAssetAmountDestination {
}
exports.AssetAmountDestination = AssetAmountDestination;
/**
 * Class representing a set of [[UTXO]]s.
 */
class UTXOSet extends utxos_1.StandardUTXOSet {
    constructor() {
        super(...arguments);
        this._typeName = "UTXOSet";
        this._typeID = undefined;
        this.getMinimumSpendable = (aad, asOf = (0, helperfunctions_1.UnixNow)(), locktime = new bn_js_1.default(0), threshold = 1) => {
            const utxoArray = this.getAllUTXOs();
            const outids = {};
            for (let i = 0; i < utxoArray.length && !aad.canComplete(); i++) {
                const u = utxoArray[`${i}`];
                const assetKey = u.getAssetID().toString("hex");
                const fromAddresses = aad.getSenders();
                if (u.getOutput() instanceof outputs_1.AmountOutput &&
                    aad.assetExists(assetKey) &&
                    u.getOutput().meetsThreshold(fromAddresses, asOf)) {
                    const am = aad.getAssetAmount(assetKey);
                    if (!am.isFinished()) {
                        const uout = u.getOutput();
                        outids[`${assetKey}`] = uout.getOutputID();
                        const amount = uout.getAmount();
                        am.spendAmount(amount);
                        const txid = u.getTxID();
                        const outputidx = u.getOutputIdx();
                        const input = new inputs_1.SECPTransferInput(amount);
                        const xferin = new inputs_1.TransferableInput(txid, outputidx, u.getAssetID(), input);
                        const spenders = uout.getSpenders(fromAddresses, asOf);
                        spenders.forEach((spender) => {
                            const idx = uout.getAddressIdx(spender);
                            if (idx === -1) {
                                /* istanbul ignore next */
                                throw new errors_1.AddressError("Error - UTXOSet.getMinimumSpendable: no such address in output");
                            }
                            xferin.getInput().addSignatureIdx(idx, spender);
                        });
                        aad.addInput(xferin);
                    }
                    else if (aad.assetExists(assetKey) &&
                        !(u.getOutput() instanceof outputs_1.AmountOutput)) {
                        /**
                         * Leaving the below lines, not simply for posterity, but for clarification.
                         * AssetIDs may have mixed OutputTypes.
                         * Some of those OutputTypes may implement AmountOutput.
                         * Others may not.
                         * Simply continue in this condition.
                         */
                        /*return new Error('Error - UTXOSet.getMinimumSpendable: outputID does not '
                           + `implement AmountOutput: ${u.getOutput().getOutputID}`);*/
                        continue;
                    }
                }
            }
            if (!aad.canComplete()) {
                return new errors_1.InsufficientFundsError(`Error - UTXOSet.getMinimumSpendable: insufficient funds to create the transaction`);
            }
            const amounts = aad.getAmounts();
            const zero = new bn_js_1.default(0);
            for (let i = 0; i < amounts.length; i++) {
                const assetKey = amounts[`${i}`].getAssetIDString();
                const amount = amounts[`${i}`].getAmount();
                if (amount.gt(zero)) {
                    const spendout = (0, outputs_1.SelectOutputClass)(outids[`${assetKey}`], amount, aad.getDestinations(), locktime, threshold);
                    const xferout = new outputs_1.TransferableOutput(amounts[`${i}`].getAssetID(), spendout);
                    aad.addOutput(xferout);
                }
                const change = amounts[`${i}`].getChange();
                if (change.gt(zero)) {
                    const changeout = (0, outputs_1.SelectOutputClass)(outids[`${assetKey}`], change, aad.getChangeAddresses());
                    const chgxferout = new outputs_1.TransferableOutput(amounts[`${i}`].getAssetID(), changeout);
                    aad.addChange(chgxferout);
                }
            }
            return undefined;
        };
        /**
         * Creates an unsigned ImportTx transaction.
         *
         * @param networkID The number representing NetworkID of the node
         * @param blockchainID The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
         * @param toAddress The address to send the funds
         * @param importIns An array of [[TransferableInput]]s being imported
         * @param sourceChain A {@link https://github.com/feross/buffer|Buffer} for the chainid where the imports are coming from.
         * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}. Fee will come from the inputs first, if they can.
         * @param feeAssetID Optional. The assetID of the fees being burned.
         * @returns An unsigned transaction created from the passed in parameters.
         *
         */
        this.buildImportTx = (networkID, blockchainID, toAddress, atomics, sourceChain = undefined, fee = undefined, feeAssetID = undefined) => {
            const zero = new bn_js_1.default(0);
            const map = new Map();
            let ins = [];
            let outs = [];
            let feepaid = new bn_js_1.default(0);
            if (typeof fee === "undefined") {
                fee = zero.clone();
            }
            // build a set of inputs which covers the fee
            atomics.forEach((atomic) => {
                const assetIDBuf = atomic.getAssetID();
                const assetID = bintools.cb58Encode(atomic.getAssetID());
                const output = atomic.getOutput();
                const amount = output.getAmount().clone();
                let infeeamount = amount.clone();
                if (typeof feeAssetID !== "undefined" &&
                    fee.gt(zero) &&
                    feepaid.lt(fee) &&
                    buffer_1.Buffer.compare(feeAssetID, assetIDBuf) === 0) {
                    feepaid = feepaid.add(infeeamount);
                    if (feepaid.gt(fee)) {
                        infeeamount = feepaid.sub(fee);
                        feepaid = fee.clone();
                    }
                    else {
                        infeeamount = zero.clone();
                    }
                }
                const txid = atomic.getTxID();
                const outputidx = atomic.getOutputIdx();
                const input = new inputs_1.SECPTransferInput(amount);
                const xferin = new inputs_1.TransferableInput(txid, outputidx, assetIDBuf, input);
                const from = output.getAddresses();
                const spenders = output.getSpenders(from);
                spenders.forEach((spender) => {
                    const idx = output.getAddressIdx(spender);
                    if (idx === -1) {
                        /* istanbul ignore next */
                        throw new errors_1.AddressError("Error - UTXOSet.buildImportTx: no such address in output");
                    }
                    xferin.getInput().addSignatureIdx(idx, spender);
                });
                ins.push(xferin);
                if (map.has(assetID)) {
                    infeeamount = infeeamount.add(new bn_js_1.default(map.get(assetID)));
                }
                map.set(assetID, infeeamount.toString());
            });
            for (let [assetID, amount] of map) {
                // Create single EVMOutput for each assetID
                const evmOutput = new outputs_1.EVMOutput(toAddress, new bn_js_1.default(amount), bintools.cb58Decode(assetID));
                outs.push(evmOutput);
            }
            // lexicographically sort array
            ins = ins.sort(inputs_1.TransferableInput.comparator());
            outs = outs.sort(outputs_1.EVMOutput.comparator());
            const importTx = new importtx_1.ImportTx(networkID, blockchainID, sourceChain, ins, outs, fee);
            return new tx_1.UnsignedTx(importTx);
        };
        /**
         * Creates an unsigned ExportTx transaction.
         *
         * @param networkID The number representing NetworkID of the node
         * @param blockchainID The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
         * @param amount The amount being exported as a {@link https://github.com/indutny/bn.js/|BN}
         * @param avaxAssetID {@link https://github.com/feross/buffer|Buffer} of the AssetID for AVAX
         * @param toAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who recieves the AVAX
         * @param fromAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who owns the AVAX
         * @param changeAddresses Optional. The addresses that can spend the change remaining from the spent UTXOs.
         * @param destinationChain Optional. A {@link https://github.com/feross/buffer|Buffer} for the chainid where to send the asset.
         * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
         * @param feeAssetID Optional. The assetID of the fees being burned.
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param locktime Optional. The locktime field created in the resulting outputs
         * @param toThreshold Optional. The number of signatures required to spend the funds in the resultant UTXO
         * @param changethreshold Optional. The number of signatures required to spend the funds in the resultant change UTXO
         * @returns An unsigned transaction created from the passed in parameters.
         *
         */
        this.buildExportTx = (networkID, blockchainID, amount, avaxAssetID, toAddresses, fromAddresses, changeAddresses = undefined, destinationChain = undefined, fee = undefined, feeAssetID = undefined, asOf = (0, helperfunctions_1.UnixNow)(), locktime = new bn_js_1.default(0), toThreshold = 1, changeThreshold = 1) => {
            let ins = [];
            let exportouts = [];
            if (typeof changeAddresses === "undefined") {
                changeAddresses = toAddresses;
            }
            const zero = new bn_js_1.default(0);
            if (amount.eq(zero)) {
                return undefined;
            }
            if (typeof feeAssetID === "undefined") {
                feeAssetID = avaxAssetID;
            }
            else if (feeAssetID.toString("hex") !== avaxAssetID.toString("hex")) {
                /* istanbul ignore next */
                throw new errors_1.FeeAssetError("Error - UTXOSet.buildExportTx: feeAssetID must match avaxAssetID");
            }
            if (typeof destinationChain === "undefined") {
                destinationChain = bintools.cb58Decode(constants_2.DefaultPlatformChainID);
            }
            const aad = new AssetAmountDestination(toAddresses, toThreshold, fromAddresses, changeAddresses, changeThreshold);
            if (avaxAssetID.toString("hex") === feeAssetID.toString("hex")) {
                aad.addAssetAmount(avaxAssetID, amount, fee);
            }
            else {
                aad.addAssetAmount(avaxAssetID, amount, zero);
                if (this._feeCheck(fee, feeAssetID)) {
                    aad.addAssetAmount(feeAssetID, zero, fee);
                }
            }
            const success = this.getMinimumSpendable(aad, asOf, locktime);
            if (typeof success === "undefined") {
                exportouts = aad.getOutputs();
            }
            else {
                throw success;
            }
            const exportTx = new exporttx_1.ExportTx(networkID, blockchainID, destinationChain, ins, exportouts);
            return new tx_1.UnsignedTx(exportTx);
        };
    }
    //serialize is inherited
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        let utxos = {};
        for (let utxoid in fields["utxos"]) {
            let utxoidCleaned = serializer.decoder(utxoid, encoding, "base58", "base58");
            utxos[`${utxoidCleaned}`] = new UTXO();
            utxos[`${utxoidCleaned}`].deserialize(fields["utxos"][`${utxoid}`], encoding);
        }
        let addressUTXOs = {};
        for (let address in fields["addressUTXOs"]) {
            let addressCleaned = serializer.decoder(address, encoding, "cb58", "hex");
            let utxobalance = {};
            for (let utxoid in fields["addressUTXOs"][`${address}`]) {
                let utxoidCleaned = serializer.decoder(utxoid, encoding, "base58", "base58");
                utxobalance[`${utxoidCleaned}`] = serializer.decoder(fields["addressUTXOs"][`${address}`][`${utxoid}`], encoding, "decimalString", "BN");
            }
            addressUTXOs[`${addressCleaned}`] = utxobalance;
        }
        this.utxos = utxos;
        this.addressUTXOs = addressUTXOs;
    }
    parseUTXO(utxo) {
        const utxovar = new UTXO();
        // force a copy
        if (typeof utxo === "string") {
            utxovar.fromBuffer(bintools.cb58Decode(utxo));
        }
        else if (utxo instanceof UTXO) {
            utxovar.fromBuffer(utxo.toBuffer()); // forces a copy
        }
        else {
            /* istanbul ignore next */
            throw new errors_1.UTXOError("Error - UTXO.parseUTXO: utxo parameter is not a UTXO or string");
        }
        return utxovar;
    }
    create() {
        return new UTXOSet();
    }
    clone() {
        const newset = this.create();
        const allUTXOs = this.getAllUTXOs();
        newset.addArray(allUTXOs);
        return newset;
    }
    _feeCheck(fee, feeAssetID) {
        return (typeof fee !== "undefined" &&
            typeof feeAssetID !== "undefined" &&
            fee.gt(new bn_js_1.default(0)) &&
            feeAssetID instanceof buffer_1.Buffer);
    }
}
exports.UTXOSet = UTXOSet;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXR4b3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9ldm0vdXR4b3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7Ozs7O0FBRUgsb0NBQWdDO0FBQ2hDLG9FQUEyQztBQUMzQyxrREFBc0I7QUFDdEIsdUNBS2tCO0FBQ2xCLDJDQUEwQztBQUMxQyxxQ0FBeUU7QUFFekUsaUVBQXFEO0FBQ3JELDhDQUFrRTtBQUNsRSxxREFBOEQ7QUFDOUQsMERBR2lDO0FBQ2pDLDZEQUE2RTtBQUM3RSw2QkFBaUM7QUFDakMseUNBQXFDO0FBQ3JDLHlDQUFxQztBQUNyQywrQ0FLMkI7QUFFM0I7O0dBRUc7QUFDSCxNQUFNLFFBQVEsR0FBYSxrQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBQ2pELE1BQU0sVUFBVSxHQUFrQiw2QkFBYSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBRTdEOztHQUVHO0FBQ0gsTUFBYSxJQUFLLFNBQVEsb0JBQVk7SUFBdEM7O1FBQ1ksY0FBUyxHQUFHLE1BQU0sQ0FBQTtRQUNsQixZQUFPLEdBQUcsU0FBUyxDQUFBO0lBb0UvQixDQUFDO0lBbEVDLHdCQUF3QjtJQUV4QixXQUFXLENBQUMsTUFBYyxFQUFFLFdBQStCLEtBQUs7UUFDOUQsS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUE7UUFDbkMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFBLDJCQUFpQixFQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFBO1FBQzVELElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQTtJQUNyRCxDQUFDO0lBRUQsVUFBVSxDQUFDLEtBQWEsRUFBRSxTQUFpQixDQUFDO1FBQzFDLElBQUksQ0FBQyxPQUFPLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FB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SSxLQUFLLFFBQVEsRUFBRTtZQUM1QixPQUFPLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQTtTQUM5QzthQUFNLElBQUksSUFBSSxZQUFZLElBQUksRUFBRTtZQUMvQixPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFBLENBQUMsZ0JBQWdCO1NBQ3JEO2FBQU07WUFDTCwwQkFBMEI7WUFDMUIsTUFBTSxJQUFJLGtCQUFTLENBQ2pCLGdFQUFnRSxDQUNqRSxDQUFBO1NBQ0Y7UUFDRCxPQUFPLE9BQU8sQ0FBQTtJQUNoQixDQUFDO0lBRUQsTUFBTTtRQUNKLE9BQU8sSUFBSSxPQUFPLEVBQVUsQ0FBQTtJQUM5QixDQUFDO0lBRUQsS0FBSztRQUNILE1BQU0sTUFBTSxHQUFZLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQTtRQUNyQyxNQUFNLFFBQVEsR0FBVyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUE7UUFDM0MsTUFBTSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQTtRQUN6QixPQUFPLE1BQWMsQ0FBQTtJQUN2QixDQUFDO0lBRUQsU0FBUyxDQUFDLEdBQU8sRUFBRSxVQUFrQjtRQUNuQyxPQUFPLENBQ0wsT0FBTyxHQUFHLEtBQUssV0FBVztZQUMxQixPQUFPLFVBQVUsS0FBSyxXQUFXO1lBQ2pDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxlQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakIsVUFBVSxZQUFZLGVBQU0sQ0FDN0IsQ0FBQTtJQUNILENBQUM7Q0FtVEY7QUF4WUQsMEJBd1lDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgQVBJLUVWTS1VVFhPc1xuICovXG5cbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCJidWZmZXIvXCJcbmltcG9ydCBCaW5Ub29scyBmcm9tIFwiLi4vLi4vdXRpbHMvYmludG9vbHNcIlxuaW1wb3J0IEJOIGZyb20gXCJibi5qc1wiXG5pbXBvcnQge1xuICBBbW91bnRPdXRwdXQsXG4gIFNlbGVjdE91dHB1dENsYXNzLFxuICBUcmFuc2ZlcmFibGVPdXRwdXQsXG4gIEVWTU91dHB1dFxufSBmcm9tIFwiLi9vdXRwdXRzXCJcbmltcG9ydCB7IEVWTUNvbnN0YW50cyB9IGZyb20gXCIuL2NvbnN0YW50c1wiXG5pbXBvcnQgeyBFVk1JbnB1dCwgU0VDUFRyYW5zZmVySW5wdXQsIFRyYW5zZmVyYWJsZUlucHV0IH0gZnJvbSBcIi4vaW5wdXRzXCJcbmltcG9ydCB7IE91dHB1dCB9IGZyb20gXCIuLi8uLi9jb21tb24vb3V0cHV0XCJcbmltcG9ydCB7IFVuaXhOb3cgfSBmcm9tIFwiLi4vLi4vdXRpbHMvaGVscGVyZnVuY3Rpb25zXCJcbmltcG9ydCB7IFN0YW5kYXJkVVRYTywgU3RhbmRhcmRVVFhPU2V0IH0gZnJvbSBcIi4uLy4uL2NvbW1vbi91dHhvc1wiXG5pbXBvcnQgeyBEZWZhdWx0UGxhdGZvcm1DaGFpbklEIH0gZnJvbSBcIi4uLy4uL3V0aWxzL2NvbnN0YW50c1wiXG5pbXBvcnQge1xuICBTdGFuZGFyZEFzc2V0QW1vdW50RGVzdGluYXRpb24sXG4gIEFzc2V0QW1vdW50XG59IGZyb20gXCIuLi8uLi9jb21tb24vYXNzZXRhbW91bnRcIlxuaW1wb3J0IHsgU2VyaWFsaXphdGlvbiwgU2VyaWFsaXplZEVuY29kaW5nIH0gZnJvbSBcIi4uLy4uL3V0aWxzL3NlcmlhbGl6YXRpb25cIlxuaW1wb3J0IHsgVW5zaWduZWRUeCB9IGZyb20gXCIuL3R4XCJcbmltcG9ydCB7IEltcG9ydFR4IH0gZnJvbSBcIi4vaW1wb3J0dHhcIlxuaW1wb3J0IHsgRXhwb3J0VHggfSBmcm9tIFwiLi9leHBvcnR0eFwiXG5pbXBvcnQge1xuICBVVFhPRXJyb3IsXG4gIEFkZHJlc3NFcnJvcixcbiAgSW5zdWZmaWNpZW50RnVuZHNFcnJvcixcbiAgRmVlQXNzZXRFcnJvclxufSBmcm9tIFwiLi4vLi4vdXRpbHMvZXJyb3JzXCJcblxuLyoqXG4gKiBAaWdub3JlXG4gKi9cbmNvbnN0IGJpbnRvb2xzOiBCaW5Ub29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKClcbmNvbnN0IHNlcmlhbGl6ZXI6IFNlcmlhbGl6YXRpb24gPSBTZXJpYWxpemF0aW9uLmdldEluc3RhbmNlKClcblxuLyoqXG4gKiBDbGFzcyBmb3IgcmVwcmVzZW50aW5nIGEgc2luZ2xlIFVUWE8uXG4gKi9cbmV4cG9ydCBjbGFzcyBVVFhPIGV4dGVuZHMgU3RhbmRhcmRVVFhPIHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiVVRYT1wiXG4gIHByb3RlY3RlZCBfdHlwZUlEID0gdW5kZWZpbmVkXG5cbiAgLy9zZXJpYWxpemUgaXMgaW5oZXJpdGVkXG5cbiAgZGVzZXJpYWxpemUoZmllbGRzOiBvYmplY3QsIGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcbiAgICB0aGlzLm91dHB1dCA9IFNlbGVjdE91dHB1dENsYXNzKGZpZWxkc1tcIm91dHB1dFwiXVtcIl90eXBlSURcIl0pXG4gICAgdGhpcy5vdXRwdXQuZGVzZXJpYWxpemUoZmllbGRzW1wib3V0cHV0XCJdLCBlbmNvZGluZylcbiAgfVxuXG4gIGZyb21CdWZmZXIoYnl0ZXM6IEJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIgPSAwKTogbnVtYmVyIHtcbiAgICB0aGlzLmNvZGVjSUQgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyAyKVxuICAgIG9mZnNldCArPSAyXG4gICAgdGhpcy50eGlkID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgMzIpXG4gICAgb2Zmc2V0ICs9IDMyXG4gICAgdGhpcy5vdXRwdXRpZHggPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KVxuICAgIG9mZnNldCArPSA0XG4gICAgdGhpcy5hc3NldElEID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgMzIpXG4gICAgb2Zmc2V0ICs9IDMyXG4gICAgY29uc3Qgb3V0cHV0aWQ6IG51bWJlciA9IGJpbnRvb2xzXG4gICAgICAuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNClcbiAgICAgIC5yZWFkVUludDMyQkUoMClcbiAgICBvZmZzZXQgKz0gNFxuICAgIHRoaXMub3V0cHV0ID0gU2VsZWN0T3V0cHV0Q2xhc3Mob3V0cHV0aWQpXG4gICAgcmV0dXJuIHRoaXMub3V0cHV0LmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldClcbiAgfVxuXG4gIC8qKlxuICAgKiBUYWtlcyBhIGJhc2UtNTggc3RyaW5nIGNvbnRhaW5pbmcgYSBbW1VUWE9dXSwgcGFyc2VzIGl0LCBwb3B1bGF0ZXMgdGhlIGNsYXNzLCBhbmQgcmV0dXJucyB0aGUgbGVuZ3RoIG9mIHRoZSBTdGFuZGFyZFVUWE8gaW4gYnl0ZXMuXG4gICAqXG4gICAqIEBwYXJhbSBzZXJpYWxpemVkIEEgYmFzZS01OCBzdHJpbmcgY29udGFpbmluZyBhIHJhdyBbW1VUWE9dXVxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbGVuZ3RoIG9mIHRoZSByYXcgW1tVVFhPXV1cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogdW5saWtlIG1vc3QgZnJvbVN0cmluZ3MsIGl0IGV4cGVjdHMgdGhlIHN0cmluZyB0byBiZSBzZXJpYWxpemVkIGluIGNiNTggZm9ybWF0XG4gICAqL1xuICBmcm9tU3RyaW5nKHNlcmlhbGl6ZWQ6IHN0cmluZyk6IG51bWJlciB7XG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICByZXR1cm4gdGhpcy5mcm9tQnVmZmVyKGJpbnRvb2xzLmNiNThEZWNvZGUoc2VyaWFsaXplZCkpXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGJhc2UtNTggcmVwcmVzZW50YXRpb24gb2YgdGhlIFtbVVRYT11dLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiB1bmxpa2UgbW9zdCB0b1N0cmluZ3MsIHRoaXMgcmV0dXJucyBpbiBjYjU4IHNlcmlhbGl6YXRpb24gZm9ybWF0XG4gICAqL1xuICB0b1N0cmluZygpOiBzdHJpbmcge1xuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgcmV0dXJuIGJpbnRvb2xzLmNiNThFbmNvZGUodGhpcy50b0J1ZmZlcigpKVxuICB9XG5cbiAgY2xvbmUoKTogdGhpcyB7XG4gICAgY29uc3QgdXR4bzogVVRYTyA9IG5ldyBVVFhPKClcbiAgICB1dHhvLmZyb21CdWZmZXIodGhpcy50b0J1ZmZlcigpKVxuICAgIHJldHVybiB1dHhvIGFzIHRoaXNcbiAgfVxuXG4gIGNyZWF0ZShcbiAgICBjb2RlY0lEOiBudW1iZXIgPSBFVk1Db25zdGFudHMuTEFURVNUQ09ERUMsXG4gICAgdHhJRDogQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIG91dHB1dGlkeDogQnVmZmVyIHwgbnVtYmVyID0gdW5kZWZpbmVkLFxuICAgIGFzc2V0SUQ6IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBvdXRwdXQ6IE91dHB1dCA9IHVuZGVmaW5lZFxuICApOiB0aGlzIHtcbiAgICByZXR1cm4gbmV3IFVUWE8oY29kZWNJRCwgdHhJRCwgb3V0cHV0aWR4LCBhc3NldElELCBvdXRwdXQpIGFzIHRoaXNcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgQXNzZXRBbW91bnREZXN0aW5hdGlvbiBleHRlbmRzIFN0YW5kYXJkQXNzZXRBbW91bnREZXN0aW5hdGlvbjxcbiAgVHJhbnNmZXJhYmxlT3V0cHV0LFxuICBUcmFuc2ZlcmFibGVJbnB1dFxuPiB7fVxuXG4vKipcbiAqIENsYXNzIHJlcHJlc2VudGluZyBhIHNldCBvZiBbW1VUWE9dXXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBVVFhPU2V0IGV4dGVuZHMgU3RhbmRhcmRVVFhPU2V0PFVUWE8+IHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiVVRYT1NldFwiXG4gIHByb3RlY3RlZCBfdHlwZUlEID0gdW5kZWZpbmVkXG5cbiAgLy9zZXJpYWxpemUgaXMgaW5oZXJpdGVkXG5cbiAgZGVzZXJpYWxpemUoZmllbGRzOiBvYmplY3QsIGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKTogdm9pZCB7XG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcbiAgICBsZXQgdXR4b3M6IHsgW2tleTogc3RyaW5nXTogVVRYTyB9ID0ge31cbiAgICBmb3IgKGxldCB1dHhvaWQgaW4gZmllbGRzW1widXR4b3NcIl0pIHtcbiAgICAgIGxldCB1dHhvaWRDbGVhbmVkOiBzdHJpbmcgPSBzZXJpYWxpemVyLmRlY29kZXIoXG4gICAgICAgIHV0eG9pZCxcbiAgICAgICAgZW5jb2RpbmcsXG4gICAgICAgIFwiYmFzZTU4XCIsXG4gICAgICAgIFwiYmFzZTU4XCJcbiAgICAgIClcbiAgICAgIHV0eG9zW2Ake3V0eG9pZENsZWFuZWR9YF0gPSBuZXcgVVRYTygpXG4gICAgICB1dHhvc1tgJHt1dHhvaWRDbGVhbmVkfWBdLmRlc2VyaWFsaXplKFxuICAgICAgICBmaWVsZHNbXCJ1dHhvc1wiXVtgJHt1dHhvaWR9YF0sXG4gICAgICAgIGVuY29kaW5nXG4gICAgICApXG4gICAgfVxuICAgIGxldCBhZGRyZXNzVVRYT3M6IHsgW2tleTogc3RyaW5nXTogeyBba2V5OiBzdHJpbmddOiBCTiB9IH0gPSB7fVxuICAgIGZvciAobGV0IGFkZHJlc3MgaW4gZmllbGRzW1wiYWRkcmVzc1VUWE9zXCJdKSB7XG4gICAgICBsZXQgYWRkcmVzc0NsZWFuZWQ6IHN0cmluZyA9IHNlcmlhbGl6ZXIuZGVjb2RlcihcbiAgICAgICAgYWRkcmVzcyxcbiAgICAgICAgZW5jb2RpbmcsXG4gICAgICAgIFwiY2I1OFwiLFxuICAgICAgICBcImhleFwiXG4gICAgICApXG4gICAgICBsZXQgdXR4b2JhbGFuY2U6IHsgW2tleTogc3RyaW5nXTogQk4gfSA9IHt9XG4gICAgICBmb3IgKGxldCB1dHhvaWQgaW4gZmllbGRzW1wiYWRkcmVzc1VUWE9zXCJdW2Ake2FkZHJlc3N9YF0pIHtcbiAgICAgICAgbGV0IHV0eG9pZENsZWFuZWQ6IHN0cmluZyA9IHNlcmlhbGl6ZXIuZGVjb2RlcihcbiAgICAgICAgICB1dHhvaWQsXG4gICAgICAgICAgZW5jb2RpbmcsXG4gICAgICAgICAgXCJiYXNlNThcIixcbiAgICAgICAgICBcImJhc2U1OFwiXG4gICAgICAgIClcbiAgICAgICAgdXR4b2JhbGFuY2VbYCR7dXR4b2lkQ2xlYW5lZH1gXSA9IHNlcmlhbGl6ZXIuZGVjb2RlcihcbiAgICAgICAgICBmaWVsZHNbXCJhZGRyZXNzVVRYT3NcIl1bYCR7YWRkcmVzc31gXVtgJHt1dHhvaWR9YF0sXG4gICAgICAgICAgZW5jb2RpbmcsXG4gICAgICAgICAgXCJkZWNpbWFsU3RyaW5nXCIsXG4gICAgICAgICAgXCJCTlwiXG4gICAgICAgIClcbiAgICAgIH1cbiAgICAgIGFkZHJlc3NVVFhPc1tgJHthZGRyZXNzQ2xlYW5lZH1gXSA9IHV0eG9iYWxhbmNlXG4gICAgfVxuICAgIHRoaXMudXR4b3MgPSB1dHhvc1xuICAgIHRoaXMuYWRkcmVzc1VUWE9zID0gYWRkcmVzc1VUWE9zXG4gIH1cblxuICBwYXJzZVVUWE8odXR4bzogVVRYTyB8IHN0cmluZyk6IFVUWE8ge1xuICAgIGNvbnN0IHV0eG92YXI6IFVUWE8gPSBuZXcgVVRYTygpXG4gICAgLy8gZm9yY2UgYSBjb3B5XG4gICAgaWYgKHR5cGVvZiB1dHhvID09PSBcInN0cmluZ1wiKSB7XG4gICAgICB1dHhvdmFyLmZyb21CdWZmZXIoYmludG9vbHMuY2I1OERlY29kZSh1dHhvKSlcbiAgICB9IGVsc2UgaWYgKHV0eG8gaW5zdGFuY2VvZiBVVFhPKSB7XG4gICAgICB1dHhvdmFyLmZyb21CdWZmZXIodXR4by50b0J1ZmZlcigpKSAvLyBmb3JjZXMgYSBjb3B5XG4gICAgfSBlbHNlIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgVVRYT0Vycm9yKFxuICAgICAgICBcIkVycm9yIC0gVVRYTy5wYXJzZVVUWE86IHV0eG8gcGFyYW1ldGVyIGlzIG5vdCBhIFVUWE8gb3Igc3RyaW5nXCJcbiAgICAgIClcbiAgICB9XG4gICAgcmV0dXJuIHV0eG92YXJcbiAgfVxuXG4gIGNyZWF0ZSgpOiB0aGlzIHtcbiAgICByZXR1cm4gbmV3IFVUWE9TZXQoKSBhcyB0aGlzXG4gIH1cblxuICBjbG9uZSgpOiB0aGlzIHtcbiAgICBjb25zdCBuZXdzZXQ6IFVUWE9TZXQgPSB0aGlzLmNyZWF0ZSgpXG4gICAgY29uc3QgYWxsVVRYT3M6IFVUWE9bXSA9IHRoaXMuZ2V0QWxsVVRYT3MoKVxuICAgIG5ld3NldC5hZGRBcnJheShhbGxVVFhPcylcbiAgICByZXR1cm4gbmV3c2V0IGFzIHRoaXNcbiAgfVxuXG4gIF9mZWVDaGVjayhmZWU6IEJOLCBmZWVBc3NldElEOiBCdWZmZXIpOiBib29sZWFuIHtcbiAgICByZXR1cm4gKFxuICAgICAgdHlwZW9mIGZlZSAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgICAgdHlwZW9mIGZlZUFzc2V0SUQgIT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICAgIGZlZS5ndChuZXcgQk4oMCkpICYmXG4gICAgICBmZWVBc3NldElEIGluc3RhbmNlb2YgQnVmZmVyXG4gICAgKVxuICB9XG5cbiAgZ2V0TWluaW11bVNwZW5kYWJsZSA9IChcbiAgICBhYWQ6IEFzc2V0QW1vdW50RGVzdGluYXRpb24sXG4gICAgYXNPZjogQk4gPSBVbml4Tm93KCksXG4gICAgbG9ja3RpbWU6IEJOID0gbmV3IEJOKDApLFxuICAgIHRocmVzaG9sZDogbnVtYmVyID0gMVxuICApOiBFcnJvciA9PiB7XG4gICAgY29uc3QgdXR4b0FycmF5OiBVVFhPW10gPSB0aGlzLmdldEFsbFVUWE9zKClcbiAgICBjb25zdCBvdXRpZHM6IG9iamVjdCA9IHt9XG4gICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IHV0eG9BcnJheS5sZW5ndGggJiYgIWFhZC5jYW5Db21wbGV0ZSgpOyBpKyspIHtcbiAgICAgIGNvbnN0IHU6IFVUWE8gPSB1dHhvQXJyYXlbYCR7aX1gXVxuICAgICAgY29uc3QgYXNzZXRLZXk6IHN0cmluZyA9IHUuZ2V0QXNzZXRJRCgpLnRvU3RyaW5nKFwiaGV4XCIpXG4gICAgICBjb25zdCBmcm9tQWRkcmVzc2VzOiBCdWZmZXJbXSA9IGFhZC5nZXRTZW5kZXJzKClcbiAgICAgIGlmIChcbiAgICAgICAgdS5nZXRPdXRwdXQoKSBpbnN0YW5jZW9mIEFtb3VudE91dHB1dCAmJlxuICAgICAgICBhYWQuYXNzZXRFeGlzdHMoYXNzZXRLZXkpICYmXG4gICAgICAgIHUuZ2V0T3V0cHV0KCkubWVldHNUaHJlc2hvbGQoZnJvbUFkZHJlc3NlcywgYXNPZilcbiAgICAgICkge1xuICAgICAgICBjb25zdCBhbTogQXNzZXRBbW91bnQgPSBhYWQuZ2V0QXNzZXRBbW91bnQoYXNzZXRLZXkpXG4gICAgICAgIGlmICghYW0uaXNGaW5pc2hlZCgpKSB7XG4gICAgICAgICAgY29uc3QgdW91dDogQW1vdW50T3V0cHV0ID0gdS5nZXRPdXRwdXQoKSBhcyBBbW91bnRPdXRwdXRcbiAgICAgICAgICBvdXRpZHNbYCR7YXNzZXRLZXl9YF0gPSB1b3V0LmdldE91dHB1dElEKClcbiAgICAgICAgICBjb25zdCBhbW91bnQgPSB1b3V0LmdldEFtb3VudCgpXG4gICAgICAgICAgYW0uc3BlbmRBbW91bnQoYW1vdW50KVxuICAgICAgICAgIGNvbnN0IHR4aWQ6IEJ1ZmZlciA9IHUuZ2V0VHhJRCgpXG4gICAgICAgICAgY29uc3Qgb3V0cHV0aWR4OiBCdWZmZXIgPSB1LmdldE91dHB1dElkeCgpXG4gICAgICAgICAgY29uc3QgaW5wdXQ6IFNFQ1BUcmFuc2ZlcklucHV0ID0gbmV3IFNFQ1BUcmFuc2ZlcklucHV0KGFtb3VudClcbiAgICAgICAgICBjb25zdCB4ZmVyaW46IFRyYW5zZmVyYWJsZUlucHV0ID0gbmV3IFRyYW5zZmVyYWJsZUlucHV0KFxuICAgICAgICAgICAgdHhpZCxcbiAgICAgICAgICAgIG91dHB1dGlkeCxcbiAgICAgICAgICAgIHUuZ2V0QXNzZXRJRCgpLFxuICAgICAgICAgICAgaW5wdXRcbiAgICAgICAgICApXG4gICAgICAgICAgY29uc3Qgc3BlbmRlcnM6IEJ1ZmZlcltdID0gdW91dC5nZXRTcGVuZGVycyhmcm9tQWRkcmVzc2VzLCBhc09mKVxuICAgICAgICAgIHNwZW5kZXJzLmZvckVhY2goKHNwZW5kZXI6IEJ1ZmZlcikgPT4ge1xuICAgICAgICAgICAgY29uc3QgaWR4OiBudW1iZXIgPSB1b3V0LmdldEFkZHJlc3NJZHgoc3BlbmRlcilcbiAgICAgICAgICAgIGlmIChpZHggPT09IC0xKSB7XG4gICAgICAgICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICAgICAgICAgIHRocm93IG5ldyBBZGRyZXNzRXJyb3IoXG4gICAgICAgICAgICAgICAgXCJFcnJvciAtIFVUWE9TZXQuZ2V0TWluaW11bVNwZW5kYWJsZTogbm8gc3VjaCBhZGRyZXNzIGluIG91dHB1dFwiXG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHhmZXJpbi5nZXRJbnB1dCgpLmFkZFNpZ25hdHVyZUlkeChpZHgsIHNwZW5kZXIpXG4gICAgICAgICAgfSlcbiAgICAgICAgICBhYWQuYWRkSW5wdXQoeGZlcmluKVxuICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgIGFhZC5hc3NldEV4aXN0cyhhc3NldEtleSkgJiZcbiAgICAgICAgICAhKHUuZ2V0T3V0cHV0KCkgaW5zdGFuY2VvZiBBbW91bnRPdXRwdXQpXG4gICAgICAgICkge1xuICAgICAgICAgIC8qKlxuICAgICAgICAgICAqIExlYXZpbmcgdGhlIGJlbG93IGxpbmVzLCBub3Qgc2ltcGx5IGZvciBwb3N0ZXJpdHksIGJ1dCBmb3IgY2xhcmlmaWNhdGlvbi5cbiAgICAgICAgICAgKiBBc3NldElEcyBtYXkgaGF2ZSBtaXhlZCBPdXRwdXRUeXBlcy5cbiAgICAgICAgICAgKiBTb21lIG9mIHRob3NlIE91dHB1dFR5cGVzIG1heSBpbXBsZW1lbnQgQW1vdW50T3V0cHV0LlxuICAgICAgICAgICAqIE90aGVycyBtYXkgbm90LlxuICAgICAgICAgICAqIFNpbXBseSBjb250aW51ZSBpbiB0aGlzIGNvbmRpdGlvbi5cbiAgICAgICAgICAgKi9cbiAgICAgICAgICAvKnJldHVybiBuZXcgRXJyb3IoJ0Vycm9yIC0gVVRYT1NldC5nZXRNaW5pbXVtU3BlbmRhYmxlOiBvdXRwdXRJRCBkb2VzIG5vdCAnXG4gICAgICAgICAgICAgKyBgaW1wbGVtZW50IEFtb3VudE91dHB1dDogJHt1LmdldE91dHB1dCgpLmdldE91dHB1dElEfWApOyovXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIWFhZC5jYW5Db21wbGV0ZSgpKSB7XG4gICAgICByZXR1cm4gbmV3IEluc3VmZmljaWVudEZ1bmRzRXJyb3IoXG4gICAgICAgIGBFcnJvciAtIFVUWE9TZXQuZ2V0TWluaW11bVNwZW5kYWJsZTogaW5zdWZmaWNpZW50IGZ1bmRzIHRvIGNyZWF0ZSB0aGUgdHJhbnNhY3Rpb25gXG4gICAgICApXG4gICAgfVxuICAgIGNvbnN0IGFtb3VudHM6IEFzc2V0QW1vdW50W10gPSBhYWQuZ2V0QW1vdW50cygpXG4gICAgY29uc3QgemVybzogQk4gPSBuZXcgQk4oMClcbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgYW1vdW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgYXNzZXRLZXk6IHN0cmluZyA9IGFtb3VudHNbYCR7aX1gXS5nZXRBc3NldElEU3RyaW5nKClcbiAgICAgIGNvbnN0IGFtb3VudDogQk4gPSBhbW91bnRzW2Ake2l9YF0uZ2V0QW1vdW50KClcbiAgICAgIGlmIChhbW91bnQuZ3QoemVybykpIHtcbiAgICAgICAgY29uc3Qgc3BlbmRvdXQ6IEFtb3VudE91dHB1dCA9IFNlbGVjdE91dHB1dENsYXNzKFxuICAgICAgICAgIG91dGlkc1tgJHthc3NldEtleX1gXSxcbiAgICAgICAgICBhbW91bnQsXG4gICAgICAgICAgYWFkLmdldERlc3RpbmF0aW9ucygpLFxuICAgICAgICAgIGxvY2t0aW1lLFxuICAgICAgICAgIHRocmVzaG9sZFxuICAgICAgICApIGFzIEFtb3VudE91dHB1dFxuICAgICAgICBjb25zdCB4ZmVyb3V0OiBUcmFuc2ZlcmFibGVPdXRwdXQgPSBuZXcgVHJhbnNmZXJhYmxlT3V0cHV0KFxuICAgICAgICAgIGFtb3VudHNbYCR7aX1gXS5nZXRBc3NldElEKCksXG4gICAgICAgICAgc3BlbmRvdXRcbiAgICAgICAgKVxuICAgICAgICBhYWQuYWRkT3V0cHV0KHhmZXJvdXQpXG4gICAgICB9XG4gICAgICBjb25zdCBjaGFuZ2U6IEJOID0gYW1vdW50c1tgJHtpfWBdLmdldENoYW5nZSgpXG4gICAgICBpZiAoY2hhbmdlLmd0KHplcm8pKSB7XG4gICAgICAgIGNvbnN0IGNoYW5nZW91dDogQW1vdW50T3V0cHV0ID0gU2VsZWN0T3V0cHV0Q2xhc3MoXG4gICAgICAgICAgb3V0aWRzW2Ake2Fzc2V0S2V5fWBdLFxuICAgICAgICAgIGNoYW5nZSxcbiAgICAgICAgICBhYWQuZ2V0Q2hhbmdlQWRkcmVzc2VzKClcbiAgICAgICAgKSBhcyBBbW91bnRPdXRwdXRcbiAgICAgICAgY29uc3QgY2hneGZlcm91dDogVHJhbnNmZXJhYmxlT3V0cHV0ID0gbmV3IFRyYW5zZmVyYWJsZU91dHB1dChcbiAgICAgICAgICBhbW91bnRzW2Ake2l9YF0uZ2V0QXNzZXRJRCgpLFxuICAgICAgICAgIGNoYW5nZW91dFxuICAgICAgICApXG4gICAgICAgIGFhZC5hZGRDaGFuZ2UoY2hneGZlcm91dClcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gdW5zaWduZWQgSW1wb3J0VHggdHJhbnNhY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSBuZXR3b3JrSUQgVGhlIG51bWJlciByZXByZXNlbnRpbmcgTmV0d29ya0lEIG9mIHRoZSBub2RlXG4gICAqIEBwYXJhbSBibG9ja2NoYWluSUQgVGhlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGluZyB0aGUgQmxvY2tjaGFpbklEIGZvciB0aGUgdHJhbnNhY3Rpb25cbiAgICogQHBhcmFtIHRvQWRkcmVzcyBUaGUgYWRkcmVzcyB0byBzZW5kIHRoZSBmdW5kc1xuICAgKiBAcGFyYW0gaW1wb3J0SW5zIEFuIGFycmF5IG9mIFtbVHJhbnNmZXJhYmxlSW5wdXRdXXMgYmVpbmcgaW1wb3J0ZWRcbiAgICogQHBhcmFtIHNvdXJjZUNoYWluIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gZm9yIHRoZSBjaGFpbmlkIHdoZXJlIHRoZSBpbXBvcnRzIGFyZSBjb21pbmcgZnJvbS5cbiAgICogQHBhcmFtIGZlZSBPcHRpb25hbC4gVGhlIGFtb3VudCBvZiBmZWVzIHRvIGJ1cm4gaW4gaXRzIHNtYWxsZXN0IGRlbm9taW5hdGlvbiwgcmVwcmVzZW50ZWQgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0uIEZlZSB3aWxsIGNvbWUgZnJvbSB0aGUgaW5wdXRzIGZpcnN0LCBpZiB0aGV5IGNhbi5cbiAgICogQHBhcmFtIGZlZUFzc2V0SUQgT3B0aW9uYWwuIFRoZSBhc3NldElEIG9mIHRoZSBmZWVzIGJlaW5nIGJ1cm5lZC5cbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gY3JlYXRlZCBmcm9tIHRoZSBwYXNzZWQgaW4gcGFyYW1ldGVycy5cbiAgICpcbiAgICovXG4gIGJ1aWxkSW1wb3J0VHggPSAoXG4gICAgbmV0d29ya0lEOiBudW1iZXIsXG4gICAgYmxvY2tjaGFpbklEOiBCdWZmZXIsXG4gICAgdG9BZGRyZXNzOiBzdHJpbmcsXG4gICAgYXRvbWljczogVVRYT1tdLFxuICAgIHNvdXJjZUNoYWluOiBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgZmVlOiBCTiA9IHVuZGVmaW5lZCxcbiAgICBmZWVBc3NldElEOiBCdWZmZXIgPSB1bmRlZmluZWRcbiAgKTogVW5zaWduZWRUeCA9PiB7XG4gICAgY29uc3QgemVybzogQk4gPSBuZXcgQk4oMClcbiAgICBjb25zdCBtYXA6IE1hcDxzdHJpbmcsIHN0cmluZz4gPSBuZXcgTWFwKClcblxuICAgIGxldCBpbnM6IFRyYW5zZmVyYWJsZUlucHV0W10gPSBbXVxuICAgIGxldCBvdXRzOiBFVk1PdXRwdXRbXSA9IFtdXG4gICAgbGV0IGZlZXBhaWQ6IEJOID0gbmV3IEJOKDApXG5cbiAgICBpZiAodHlwZW9mIGZlZSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgZmVlID0gemVyby5jbG9uZSgpXG4gICAgfVxuXG4gICAgLy8gYnVpbGQgYSBzZXQgb2YgaW5wdXRzIHdoaWNoIGNvdmVycyB0aGUgZmVlXG4gICAgYXRvbWljcy5mb3JFYWNoKChhdG9taWM6IFVUWE8pOiB2b2lkID0+IHtcbiAgICAgIGNvbnN0IGFzc2V0SURCdWY6IEJ1ZmZlciA9IGF0b21pYy5nZXRBc3NldElEKClcbiAgICAgIGNvbnN0IGFzc2V0SUQ6IHN0cmluZyA9IGJpbnRvb2xzLmNiNThFbmNvZGUoYXRvbWljLmdldEFzc2V0SUQoKSlcbiAgICAgIGNvbnN0IG91dHB1dDogQW1vdW50T3V0cHV0ID0gYXRvbWljLmdldE91dHB1dCgpIGFzIEFtb3VudE91dHB1dFxuICAgICAgY29uc3QgYW1vdW50OiBCTiA9IG91dHB1dC5nZXRBbW91bnQoKS5jbG9uZSgpXG4gICAgICBsZXQgaW5mZWVhbW91bnQ6IEJOID0gYW1vdW50LmNsb25lKClcblxuICAgICAgaWYgKFxuICAgICAgICB0eXBlb2YgZmVlQXNzZXRJRCAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgICAgICBmZWUuZ3QoemVybykgJiZcbiAgICAgICAgZmVlcGFpZC5sdChmZWUpICYmXG4gICAgICAgIEJ1ZmZlci5jb21wYXJlKGZlZUFzc2V0SUQsIGFzc2V0SURCdWYpID09PSAwXG4gICAgICApIHtcbiAgICAgICAgZmVlcGFpZCA9IGZlZXBhaWQuYWRkKGluZmVlYW1vdW50KVxuICAgICAgICBpZiAoZmVlcGFpZC5ndChmZWUpKSB7XG4gICAgICAgICAgaW5mZWVhbW91bnQgPSBmZWVwYWlkLnN1YihmZWUpXG4gICAgICAgICAgZmVlcGFpZCA9IGZlZS5jbG9uZSgpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaW5mZWVhbW91bnQgPSB6ZXJvLmNsb25lKClcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCB0eGlkOiBCdWZmZXIgPSBhdG9taWMuZ2V0VHhJRCgpXG4gICAgICBjb25zdCBvdXRwdXRpZHg6IEJ1ZmZlciA9IGF0b21pYy5nZXRPdXRwdXRJZHgoKVxuICAgICAgY29uc3QgaW5wdXQ6IFNFQ1BUcmFuc2ZlcklucHV0ID0gbmV3IFNFQ1BUcmFuc2ZlcklucHV0KGFtb3VudClcbiAgICAgIGNvbnN0IHhmZXJpbjogVHJhbnNmZXJhYmxlSW5wdXQgPSBuZXcgVHJhbnNmZXJhYmxlSW5wdXQoXG4gICAgICAgIHR4aWQsXG4gICAgICAgIG91dHB1dGlkeCxcbiAgICAgICAgYXNzZXRJREJ1ZixcbiAgICAgICAgaW5wdXRcbiAgICAgIClcbiAgICAgIGNvbnN0IGZyb206IEJ1ZmZlcltdID0gb3V0cHV0LmdldEFkZHJlc3NlcygpXG4gICAgICBjb25zdCBzcGVuZGVyczogQnVmZmVyW10gPSBvdXRwdXQuZ2V0U3BlbmRlcnMoZnJvbSlcbiAgICAgIHNwZW5kZXJzLmZvckVhY2goKHNwZW5kZXI6IEJ1ZmZlcik6IHZvaWQgPT4ge1xuICAgICAgICBjb25zdCBpZHg6IG51bWJlciA9IG91dHB1dC5nZXRBZGRyZXNzSWR4KHNwZW5kZXIpXG4gICAgICAgIGlmIChpZHggPT09IC0xKSB7XG4gICAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgICAgICB0aHJvdyBuZXcgQWRkcmVzc0Vycm9yKFxuICAgICAgICAgICAgXCJFcnJvciAtIFVUWE9TZXQuYnVpbGRJbXBvcnRUeDogbm8gc3VjaCBhZGRyZXNzIGluIG91dHB1dFwiXG4gICAgICAgICAgKVxuICAgICAgICB9XG4gICAgICAgIHhmZXJpbi5nZXRJbnB1dCgpLmFkZFNpZ25hdHVyZUlkeChpZHgsIHNwZW5kZXIpXG4gICAgICB9KVxuICAgICAgaW5zLnB1c2goeGZlcmluKVxuXG4gICAgICBpZiAobWFwLmhhcyhhc3NldElEKSkge1xuICAgICAgICBpbmZlZWFtb3VudCA9IGluZmVlYW1vdW50LmFkZChuZXcgQk4obWFwLmdldChhc3NldElEKSkpXG4gICAgICB9XG4gICAgICBtYXAuc2V0KGFzc2V0SUQsIGluZmVlYW1vdW50LnRvU3RyaW5nKCkpXG4gICAgfSlcblxuICAgIGZvciAobGV0IFthc3NldElELCBhbW91bnRdIG9mIG1hcCkge1xuICAgICAgLy8gQ3JlYXRlIHNpbmdsZSBFVk1PdXRwdXQgZm9yIGVhY2ggYXNzZXRJRFxuICAgICAgY29uc3QgZXZtT3V0cHV0OiBFVk1PdXRwdXQgPSBuZXcgRVZNT3V0cHV0KFxuICAgICAgICB0b0FkZHJlc3MsXG4gICAgICAgIG5ldyBCTihhbW91bnQpLFxuICAgICAgICBiaW50b29scy5jYjU4RGVjb2RlKGFzc2V0SUQpXG4gICAgICApXG4gICAgICBvdXRzLnB1c2goZXZtT3V0cHV0KVxuICAgIH1cblxuICAgIC8vIGxleGljb2dyYXBoaWNhbGx5IHNvcnQgYXJyYXlcbiAgICBpbnMgPSBpbnMuc29ydChUcmFuc2ZlcmFibGVJbnB1dC5jb21wYXJhdG9yKCkpXG4gICAgb3V0cyA9IG91dHMuc29ydChFVk1PdXRwdXQuY29tcGFyYXRvcigpKVxuXG4gICAgY29uc3QgaW1wb3J0VHg6IEltcG9ydFR4ID0gbmV3IEltcG9ydFR4KFxuICAgICAgbmV0d29ya0lELFxuICAgICAgYmxvY2tjaGFpbklELFxuICAgICAgc291cmNlQ2hhaW4sXG4gICAgICBpbnMsXG4gICAgICBvdXRzLFxuICAgICAgZmVlXG4gICAgKVxuICAgIHJldHVybiBuZXcgVW5zaWduZWRUeChpbXBvcnRUeClcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIHVuc2lnbmVkIEV4cG9ydFR4IHRyYW5zYWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gbmV0d29ya0lEIFRoZSBudW1iZXIgcmVwcmVzZW50aW5nIE5ldHdvcmtJRCBvZiB0aGUgbm9kZVxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbklEIFRoZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRpbmcgdGhlIEJsb2NrY2hhaW5JRCBmb3IgdGhlIHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSBhbW91bnQgVGhlIGFtb3VudCBiZWluZyBleHBvcnRlZCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBhdmF4QXNzZXRJRCB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvZiB0aGUgQXNzZXRJRCBmb3IgQVZBWFxuICAgKiBAcGFyYW0gdG9BZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHdobyByZWNpZXZlcyB0aGUgQVZBWFxuICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBBbiBhcnJheSBvZiBhZGRyZXNzZXMgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2hvIG93bnMgdGhlIEFWQVhcbiAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBPcHRpb25hbC4gVGhlIGFkZHJlc3NlcyB0aGF0IGNhbiBzcGVuZCB0aGUgY2hhbmdlIHJlbWFpbmluZyBmcm9tIHRoZSBzcGVudCBVVFhPcy5cbiAgICogQHBhcmFtIGRlc3RpbmF0aW9uQ2hhaW4gT3B0aW9uYWwuIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gZm9yIHRoZSBjaGFpbmlkIHdoZXJlIHRvIHNlbmQgdGhlIGFzc2V0LlxuICAgKiBAcGFyYW0gZmVlIE9wdGlvbmFsLiBUaGUgYW1vdW50IG9mIGZlZXMgdG8gYnVybiBpbiBpdHMgc21hbGxlc3QgZGVub21pbmF0aW9uLCByZXByZXNlbnRlZCBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gZmVlQXNzZXRJRCBPcHRpb25hbC4gVGhlIGFzc2V0SUQgb2YgdGhlIGZlZXMgYmVpbmcgYnVybmVkLlxuICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gbG9ja3RpbWUgT3B0aW9uYWwuIFRoZSBsb2NrdGltZSBmaWVsZCBjcmVhdGVkIGluIHRoZSByZXN1bHRpbmcgb3V0cHV0c1xuICAgKiBAcGFyYW0gdG9UaHJlc2hvbGQgT3B0aW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCBVVFhPXG4gICAqIEBwYXJhbSBjaGFuZ2V0aHJlc2hvbGQgT3B0aW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCBjaGFuZ2UgVVRYT1xuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiBjcmVhdGVkIGZyb20gdGhlIHBhc3NlZCBpbiBwYXJhbWV0ZXJzLlxuICAgKlxuICAgKi9cbiAgYnVpbGRFeHBvcnRUeCA9IChcbiAgICBuZXR3b3JrSUQ6IG51bWJlcixcbiAgICBibG9ja2NoYWluSUQ6IEJ1ZmZlcixcbiAgICBhbW91bnQ6IEJOLFxuICAgIGF2YXhBc3NldElEOiBCdWZmZXIsXG4gICAgdG9BZGRyZXNzZXM6IEJ1ZmZlcltdLFxuICAgIGZyb21BZGRyZXNzZXM6IEJ1ZmZlcltdLFxuICAgIGNoYW5nZUFkZHJlc3NlczogQnVmZmVyW10gPSB1bmRlZmluZWQsXG4gICAgZGVzdGluYXRpb25DaGFpbjogQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGZlZTogQk4gPSB1bmRlZmluZWQsXG4gICAgZmVlQXNzZXRJRDogQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGFzT2Y6IEJOID0gVW5peE5vdygpLFxuICAgIGxvY2t0aW1lOiBCTiA9IG5ldyBCTigwKSxcbiAgICB0b1RocmVzaG9sZDogbnVtYmVyID0gMSxcbiAgICBjaGFuZ2VUaHJlc2hvbGQ6IG51bWJlciA9IDFcbiAgKTogVW5zaWduZWRUeCA9PiB7XG4gICAgbGV0IGluczogRVZNSW5wdXRbXSA9IFtdXG4gICAgbGV0IGV4cG9ydG91dHM6IFRyYW5zZmVyYWJsZU91dHB1dFtdID0gW11cblxuICAgIGlmICh0eXBlb2YgY2hhbmdlQWRkcmVzc2VzID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBjaGFuZ2VBZGRyZXNzZXMgPSB0b0FkZHJlc3Nlc1xuICAgIH1cblxuICAgIGNvbnN0IHplcm86IEJOID0gbmV3IEJOKDApXG5cbiAgICBpZiAoYW1vdW50LmVxKHplcm8pKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBmZWVBc3NldElEID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBmZWVBc3NldElEID0gYXZheEFzc2V0SURcbiAgICB9IGVsc2UgaWYgKGZlZUFzc2V0SUQudG9TdHJpbmcoXCJoZXhcIikgIT09IGF2YXhBc3NldElELnRvU3RyaW5nKFwiaGV4XCIpKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEZlZUFzc2V0RXJyb3IoXG4gICAgICAgIFwiRXJyb3IgLSBVVFhPU2V0LmJ1aWxkRXhwb3J0VHg6IGZlZUFzc2V0SUQgbXVzdCBtYXRjaCBhdmF4QXNzZXRJRFwiXG4gICAgICApXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBkZXN0aW5hdGlvbkNoYWluID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBkZXN0aW5hdGlvbkNoYWluID0gYmludG9vbHMuY2I1OERlY29kZShEZWZhdWx0UGxhdGZvcm1DaGFpbklEKVxuICAgIH1cblxuICAgIGNvbnN0IGFhZDogQXNzZXRBbW91bnREZXN0aW5hdGlvbiA9IG5ldyBBc3NldEFtb3VudERlc3RpbmF0aW9uKFxuICAgICAgdG9BZGRyZXNzZXMsXG4gICAgICB0b1RocmVzaG9sZCxcbiAgICAgIGZyb21BZGRyZXNzZXMsXG4gICAgICBjaGFuZ2VBZGRyZXNzZXMsXG4gICAgICBjaGFuZ2VUaHJlc2hvbGRcbiAgICApXG4gICAgaWYgKGF2YXhBc3NldElELnRvU3RyaW5nKFwiaGV4XCIpID09PSBmZWVBc3NldElELnRvU3RyaW5nKFwiaGV4XCIpKSB7XG4gICAgICBhYWQuYWRkQXNzZXRBbW91bnQoYXZheEFzc2V0SUQsIGFtb3VudCwgZmVlKVxuICAgIH0gZWxzZSB7XG4gICAgICBhYWQuYWRkQXNzZXRBbW91bnQoYXZheEFzc2V0SUQsIGFtb3VudCwgemVybylcbiAgICAgIGlmICh0aGlzLl9mZWVDaGVjayhmZWUsIGZlZUFzc2V0SUQpKSB7XG4gICAgICAgIGFhZC5hZGRBc3NldEFtb3VudChmZWVBc3NldElELCB6ZXJvLCBmZWUpXG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IHN1Y2Nlc3M6IEVycm9yID0gdGhpcy5nZXRNaW5pbXVtU3BlbmRhYmxlKGFhZCwgYXNPZiwgbG9ja3RpbWUpXG4gICAgaWYgKHR5cGVvZiBzdWNjZXNzID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBleHBvcnRvdXRzID0gYWFkLmdldE91dHB1dHMoKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBzdWNjZXNzXG4gICAgfVxuXG4gICAgY29uc3QgZXhwb3J0VHg6IEV4cG9ydFR4ID0gbmV3IEV4cG9ydFR4KFxuICAgICAgbmV0d29ya0lELFxuICAgICAgYmxvY2tjaGFpbklELFxuICAgICAgZGVzdGluYXRpb25DaGFpbixcbiAgICAgIGlucyxcbiAgICAgIGV4cG9ydG91dHNcbiAgICApXG4gICAgcmV0dXJuIG5ldyBVbnNpZ25lZFR4KGV4cG9ydFR4KVxuICB9XG59XG4iXX0=