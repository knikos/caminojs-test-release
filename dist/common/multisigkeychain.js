"use strict";
/**
 * @packageDocumentation
 * @module Common-MultisigKeyChain
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultisigKeyChain = exports.MultisigKeyPair = exports.SignatureError = void 0;
const buffer_1 = require("buffer/");
const _1 = require(".");
const utils_1 = require("../utils");
const bintools_1 = __importDefault(require("../utils/bintools"));
const keychain_1 = require("./keychain");
const secp256k1_1 = require("./secp256k1");
class SignatureError extends Error {
}
exports.SignatureError = SignatureError;
const NotImplemented = new Error("not implemented in MultiSig KeyPair");
const TooManySignatures = new SignatureError("too many signatures");
const serialization = utils_1.Serialization.getInstance();
const bintools = bintools_1.default.getInstance();
const MaxSignatures = 256;
/**
 * Class for representing a generic multi signature key.
 */
class MultisigKeyPair extends keychain_1.StandardKeyPair {
    constructor(keyChain, address, signature) {
        super();
        this.keyChain = keyChain;
        this.pubk = buffer_1.Buffer.from(address);
        this.privk = buffer_1.Buffer.from(signature);
    }
    generateKey() {
        throw NotImplemented;
    }
    importKey(_) {
        return false;
    }
    sign(_) {
        return this.privk;
    }
    recover(msg, sig) {
        throw NotImplemented;
    }
    verify(msg, sig) {
        throw NotImplemented;
    }
    getAddress() {
        return this.pubk;
    }
    getAddressString() {
        const addr = secp256k1_1.SECP256k1KeyPair.addressFromPublicKey(this.pubk);
        const type = "bech32";
        return serialization.bufferToType(addr, type, this.keyChain.getHRP(), this.keyChain.getChainID());
    }
    create(...args) {
        if (args.length == 3) {
            return new MultisigKeyPair(args[0], args[1], args[2]);
        }
        return new MultisigKeyPair(this.keyChain, this.pubk, this.privk);
    }
    clone() {
        return new MultisigKeyPair(this.keyChain, this.pubk, this.privk);
    }
    getPrivateKeyString() {
        return bintools.cb58Encode(this.privk);
    }
    getPublicKeyString() {
        return bintools.cb58Encode(this.pubk);
    }
}
exports.MultisigKeyPair = MultisigKeyPair;
/**
 * Class for representing a multisig keyChain in Camino.
 *
 * @typeparam MultisigKeyChain Class extending [[StandardKeyChain]]
 */
class MultisigKeyChain extends keychain_1.StandardKeyChain {
    constructor(hrp, chainID, signedBytes, credTypeID, txOwners, msigAliases) {
        super();
        this.hrp = hrp;
        this.chainID = chainID;
        this.signedBytes = buffer_1.Buffer.from(signedBytes);
        (this.credTypeID = credTypeID), (this.txOwners = txOwners !== null && txOwners !== void 0 ? txOwners : []);
        this.msigAliases = msigAliases !== null && msigAliases !== void 0 ? msigAliases : new Map();
    }
    getHRP() {
        return this.hrp;
    }
    getChainID() {
        return this.chainID;
    }
    create(...args) {
        if (args.length == 4) {
            return new MultisigKeyChain(args[0], args[1], args[2], args[4]);
        }
        return new MultisigKeyChain(this.hrp, this.chainID, this.signedBytes, this.credTypeID);
    }
    clone() {
        const newkc = new MultisigKeyChain(this.hrp, this.chainID, this.signedBytes, this.credTypeID);
        for (let k in this.keys) {
            newkc.addKey(this.keys[`${k}`].clone());
        }
        newkc.txOwners = new Array(this.txOwners.length);
        this.txOwners.forEach((txo, index) => newkc.txOwners[index].fromBuffer(txo.toBuffer()));
        return newkc;
    }
    union(kc) {
        if (kc.chainID !== this.chainID ||
            kc.hrp != this.hrp ||
            kc.signedBytes.compare(this.signedBytes) != 0) {
            throw new Error("keychains do not match");
        }
        const newkc = kc.clone();
        Object.assign(newkc.keys, kc.keys);
        return newkc;
    }
    // Visit every txOutputOwner and try to verify with keys.
    // Traverse into msig aliases. Throw if one cannot be fulfilled
    buildSignatureIndices() {
        this.sigIdxs = [];
        for (const o of this.txOwners)
            this._traverseOwner(o);
    }
    getCredentials() {
        const result = [];
        for (const sigSet of this.sigIdxs) {
            const cred = new _1.SECPMultisigCredential(this.credTypeID);
            for (const sigIdx of sigSet) {
                cred.addSSignatureIndex(sigIdx);
                const sig = new _1.Signature();
                sig.fromBuffer(this.getKey(sigIdx.getSource()).getPrivateKey());
                cred.addSignature(sig);
            }
            result.push(cred);
        }
        return result;
    }
    _traverseOwner(owner) {
        var addrVisited = 0;
        var addrVerified = 0;
        const cycleCheck = new Set();
        const stack = [
            {
                index: 0,
                verified: 0,
                addrVerifiedTotal: 0,
                parentVerified: false,
                owners: owner
            }
        ];
        const sigIdxs = [];
        const helper = buffer_1.Buffer.alloc(4);
        Stack: while (stack.length > 0) {
            // get head
            var currentStack = stack[stack.length - 1];
            while (currentStack.index < currentStack.owners.getAddressesLength()) {
                // get the next address to check
                const addr = currentStack.owners.getAddress(currentStack.index);
                const addrStr = addr.toString("hex");
                currentStack.index++;
                // Is it a multi-sig address ?
                const alias = this.msigAliases.get(addrStr);
                if (alias !== undefined) {
                    if (stack.length > MaxSignatures) {
                        throw TooManySignatures;
                    }
                    if (cycleCheck.has(addrStr)) {
                        throw new Error("cyclink multisig alias");
                    }
                    cycleCheck.add(addrStr);
                    stack.push({
                        index: 0,
                        verified: 0,
                        addrVerifiedTotal: addrVerified,
                        parentVerified: currentStack.parentVerified ||
                            currentStack.verified >= currentStack.owners.getThreshold(),
                        owners: alias
                    });
                    continue Stack;
                }
                else {
                    if (!currentStack.parentVerified &&
                        currentStack.verified < currentStack.owners.getThreshold()) {
                        if (this.hasKey(addr)) {
                            if (addrVisited > MaxSignatures) {
                                throw TooManySignatures;
                            }
                            const sigIdx = new _1.SigIdx();
                            sigIdx.setSource(addr);
                            helper.writeUIntBE(addrVisited, 0, 4);
                            sigIdx.fromBuffer(helper);
                            sigIdxs.push(sigIdx);
                            currentStack.verified++;
                            addrVerified++;
                        }
                    }
                    addrVisited++;
                }
            }
            // remove head
            stack.pop();
            // verify current level
            if (currentStack.verified < currentStack.owners.getThreshold()) {
                if (stack.length == 0) {
                    throw new SignatureError("Not enough signatures");
                }
                // We recover to previous state
                addrVerified = currentStack.addrVerifiedTotal;
                stack.splice(addrVerified);
            }
            else if (stack.length > 0) {
                currentStack = stack[stack.length - 1];
                if (currentStack.verified < currentStack.owners.getThreshold()) {
                    // apply child verification
                    currentStack.verified++;
                }
            }
        }
        this.sigIdxs.push(sigIdxs);
    }
}
exports.MultisigKeyChain = MultisigKeyChain;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXVsdGlzaWdrZXljaGFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21tb24vbXVsdGlzaWdrZXljaGFpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztHQUdHOzs7Ozs7QUFFSCxvQ0FBZ0M7QUFDaEMsd0JBTVU7QUFFVixvQ0FBd0Q7QUFDeEQsaUVBQXdDO0FBQ3hDLHlDQUE4RDtBQUM5RCwyQ0FBOEM7QUFFOUMsTUFBYSxjQUFlLFNBQVEsS0FBSztDQUFHO0FBQTVDLHdDQUE0QztBQUM1QyxNQUFNLGNBQWMsR0FBRyxJQUFJLEtBQUssQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFBO0FBQ3ZFLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxjQUFjLENBQUMscUJBQXFCLENBQUMsQ0FBQTtBQUVuRSxNQUFNLGFBQWEsR0FBa0IscUJBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUNoRSxNQUFNLFFBQVEsR0FBYSxrQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBQ2pELE1BQU0sYUFBYSxHQUFHLEdBQUcsQ0FBQTtBQUV6Qjs7R0FFRztBQUNILE1BQWEsZUFBZ0IsU0FBUSwwQkFBZTtJQTBEbEQsWUFBWSxRQUEwQixFQUFFLE9BQWUsRUFBRSxTQUFpQjtRQUN4RSxLQUFLLEVBQUUsQ0FBQTtRQUNQLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFBO1FBQ3hCLElBQUksQ0FBQyxJQUFJLEdBQUcsZUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUNoQyxJQUFJLENBQUMsS0FBSyxHQUFHLGVBQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUE7SUFDckMsQ0FBQztJQTNERCxXQUFXO1FBQ1QsTUFBTSxjQUFjLENBQUE7SUFDdEIsQ0FBQztJQUVELFNBQVMsQ0FBQyxDQUFTO1FBQ2pCLE9BQU8sS0FBSyxDQUFBO0lBQ2QsQ0FBQztJQUVELElBQUksQ0FBQyxDQUFTO1FBQ1osT0FBTyxJQUFJ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LENBQUMsUUFBUSxHQUFHLFlBQVksQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLEVBQUU7Z0JBQzlELElBQUksS0FBSyxDQUFDLE1BQU0sSUFBSSxDQUFDLEVBQUU7b0JBQ3JCLE1BQU0sSUFBSSxjQUFjLENBQUMsdUJBQXVCLENBQUMsQ0FBQTtpQkFDbEQ7Z0JBQ0QsK0JBQStCO2dCQUMvQixZQUFZLEdBQUcsWUFBWSxDQUFDLGlCQUFpQixDQUFBO2dCQUM3QyxLQUFLLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFBO2FBQzNCO2lCQUFNLElBQUksS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7Z0JBQzNCLFlBQVksR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQTtnQkFDdEMsSUFBSSxZQUFZLENBQUMsUUFBUSxHQUFHLFlBQVksQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLEVBQUU7b0JBQzlELDJCQUEyQjtvQkFDM0IsWUFBWSxDQUFDLFFBQVEsRUFBRSxDQUFBO2lCQUN4QjthQUNGO1NBQ0Y7UUFFRCxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtJQUM1QixDQUFDO0NBaUJGO0FBNU1ELDRDQTRNQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXG4gKiBAbW9kdWxlIENvbW1vbi1NdWx0aXNpZ0tleUNoYWluXG4gKi9cblxuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcImJ1ZmZlci9cIlxuaW1wb3J0IHtcbiAgQ3JlZGVudGlhbCxcbiAgT3V0cHV0T3duZXJzLFxuICBTRUNQTXVsdGlzaWdDcmVkZW50aWFsLFxuICBTaWdJZHgsXG4gIFNpZ25hdHVyZVxufSBmcm9tIFwiLlwiXG5cbmltcG9ydCB7IFNlcmlhbGl6YXRpb24sIFNlcmlhbGl6ZWRUeXBlIH0gZnJvbSBcIi4uL3V0aWxzXCJcbmltcG9ydCBCaW5Ub29scyBmcm9tIFwiLi4vdXRpbHMvYmludG9vbHNcIlxuaW1wb3J0IHsgU3RhbmRhcmRLZXlDaGFpbiwgU3RhbmRhcmRLZXlQYWlyIH0gZnJvbSBcIi4va2V5Y2hhaW5cIlxuaW1wb3J0IHsgU0VDUDI1NmsxS2V5UGFpciB9IGZyb20gXCIuL3NlY3AyNTZrMVwiXG5cbmV4cG9ydCBjbGFzcyBTaWduYXR1cmVFcnJvciBleHRlbmRzIEVycm9yIHt9XG5jb25zdCBOb3RJbXBsZW1lbnRlZCA9IG5ldyBFcnJvcihcIm5vdCBpbXBsZW1lbnRlZCBpbiBNdWx0aVNpZyBLZXlQYWlyXCIpXG5jb25zdCBUb29NYW55U2lnbmF0dXJlcyA9IG5ldyBTaWduYXR1cmVFcnJvcihcInRvbyBtYW55IHNpZ25hdHVyZXNcIilcblxuY29uc3Qgc2VyaWFsaXphdGlvbjogU2VyaWFsaXphdGlvbiA9IFNlcmlhbGl6YXRpb24uZ2V0SW5zdGFuY2UoKVxuY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKVxuY29uc3QgTWF4U2lnbmF0dXJlcyA9IDI1NlxuXG4vKipcbiAqIENsYXNzIGZvciByZXByZXNlbnRpbmcgYSBnZW5lcmljIG11bHRpIHNpZ25hdHVyZSBrZXkuXG4gKi9cbmV4cG9ydCBjbGFzcyBNdWx0aXNpZ0tleVBhaXIgZXh0ZW5kcyBTdGFuZGFyZEtleVBhaXIge1xuICAvLyBUaGUga2V5Y2hhaW4gcmVxdWlyZWQgZm9yIGFkZHJlc3MgZ2VuZXJhdGlvblxuICBwcm90ZWN0ZWQga2V5Q2hhaW46IE11bHRpc2lnS2V5Q2hhaW5cblxuICBnZW5lcmF0ZUtleSgpIHtcbiAgICB0aHJvdyBOb3RJbXBsZW1lbnRlZFxuICB9XG5cbiAgaW1wb3J0S2V5KF86IEJ1ZmZlcik6IGJvb2xlYW4ge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgc2lnbihfOiBCdWZmZXIpOiBCdWZmZXIge1xuICAgIHJldHVybiB0aGlzLnByaXZrXG4gIH1cblxuICByZWNvdmVyKG1zZzogQnVmZmVyLCBzaWc6IEJ1ZmZlcik6IEJ1ZmZlciB7XG4gICAgdGhyb3cgTm90SW1wbGVtZW50ZWRcbiAgfVxuXG4gIHZlcmlmeShtc2c6IEJ1ZmZlciwgc2lnOiBCdWZmZXIpOiBib29sZWFuIHtcbiAgICB0aHJvdyBOb3RJbXBsZW1lbnRlZFxuICB9XG5cbiAgZ2V0QWRkcmVzcygpOiBCdWZmZXIge1xuICAgIHJldHVybiB0aGlzLnB1YmtcbiAgfVxuXG4gIGdldEFkZHJlc3NTdHJpbmcoKTogc3RyaW5nIHtcbiAgICBjb25zdCBhZGRyOiBCdWZmZXIgPSBTRUNQMjU2azFLZXlQYWlyLmFkZHJlc3NGcm9tUHVibGljS2V5KHRoaXMucHViaylcbiAgICBjb25zdCB0eXBlOiBTZXJpYWxpemVkVHlwZSA9IFwiYmVjaDMyXCJcbiAgICByZXR1cm4gc2VyaWFsaXphdGlvbi5idWZmZXJUb1R5cGUoXG4gICAgICBhZGRyLFxuICAgICAgdHlwZSxcbiAgICAgIHRoaXMua2V5Q2hhaW4uZ2V0SFJQKCksXG4gICAgICB0aGlzLmtleUNoYWluLmdldENoYWluSUQoKVxuICAgIClcbiAgfVxuXG4gIGNyZWF0ZSguLi5hcmdzOiBhbnlbXSk6IHRoaXMge1xuICAgIGlmIChhcmdzLmxlbmd0aCA9PSAzKSB7XG4gICAgICByZXR1cm4gbmV3IE11bHRpc2lnS2V5UGFpcihhcmdzWzBdLCBhcmdzWzFdLCBhcmdzWzJdKSBhcyB0aGlzXG4gICAgfVxuICAgIHJldHVybiBuZXcgTXVsdGlzaWdLZXlQYWlyKHRoaXMua2V5Q2hhaW4sIHRoaXMucHViaywgdGhpcy5wcml2aykgYXMgdGhpc1xuICB9XG5cbiAgY2xvbmUoKTogdGhpcyB7XG4gICAgcmV0dXJuIG5ldyBNdWx0aXNpZ0tleVBhaXIodGhpcy5rZXlDaGFpbiwgdGhpcy5wdWJrLCB0aGlzLnByaXZrKSBhcyB0aGlzXG4gIH1cblxuICBnZXRQcml2YXRlS2V5U3RyaW5nKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGJpbnRvb2xzLmNiNThFbmNvZGUodGhpcy5wcml2aylcbiAgfVxuXG4gIGdldFB1YmxpY0tleVN0cmluZygpOiBzdHJpbmcge1xuICAgIHJldHVybiBiaW50b29scy5jYjU4RW5jb2RlKHRoaXMucHViaylcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKGtleUNoYWluOiBNdWx0aXNpZ0tleUNoYWluLCBhZGRyZXNzOiBCdWZmZXIsIHNpZ25hdHVyZTogQnVmZmVyKSB7XG4gICAgc3VwZXIoKVxuICAgIHRoaXMua2V5Q2hhaW4gPSBrZXlDaGFpblxuICAgIHRoaXMucHViayA9IEJ1ZmZlci5mcm9tKGFkZHJlc3MpXG4gICAgdGhpcy5wcml2ayA9IEJ1ZmZlci5mcm9tKHNpZ25hdHVyZSlcbiAgfVxufVxuXG4vKipcbiAqIENsYXNzIGZvciByZXByZXNlbnRpbmcgYSBtdWx0aXNpZyBrZXlDaGFpbiBpbiBDYW1pbm8uXG4gKlxuICogQHR5cGVwYXJhbSBNdWx0aXNpZ0tleUNoYWluIENsYXNzIGV4dGVuZGluZyBbW1N0YW5kYXJkS2V5Q2hhaW5dXVxuICovXG5leHBvcnQgY2xhc3MgTXVsdGlzaWdLZXlDaGFpbiBleHRlbmRzIFN0YW5kYXJkS2V5Q2hhaW48TXVsdGlzaWdLZXlQYWlyPiB7XG4gIC8vIFRoZSBIUlAgcmVxdWlyZWQgZm9yIGFkZHJlc3MgZ2VuZXJhdGlvblxuICBwcm90ZWN0ZWQgaHJwOiBzdHJpbmdcbiAgLy8gVGhlIGNoYWluIElEIHJlcXVpcmVkIGZvciBhZGRyZXNzIGdlbmVyYXRpb25cbiAgcHJvdGVjdGVkIGNoYWluSUQ6IHN0cmluZ1xuICAvLyBUaGUgYnl0ZXMgd2hpY2ggYXJlIHNpZ25lZCBieSB0aGlzIHR4SURcbiAgcHJvdGVjdGVkIHNpZ25lZEJ5dGVzOiBCdWZmZXJcbiAgLy8gdGhlIE91dHB1dE93bmVycyBvZiBhbGwgaW5wdXRzIGFuZCBBdXRocyBpbnNpZGUgdGhlIG1lc3NhZ2VcbiAgcHJvdGVjdGVkIHR4T3duZXJzOiBPdXRwdXRPd25lcnNbXVxuICAvLyB0aGUgbXVsdGlzaWcgYWxpYXNlcyB3aGljaCB0YWtlIHBhcnQgaW4gZXZhbHVhdGlvblxuICBwcm90ZWN0ZWQgbXNpZ0FsaWFzZXM6IE1hcDxzdHJpbmcsIE91dHB1dE93bmVycz5cbiAgLy8gQ3JlZGVudGlhbHMgZm9yIGFsbCB0aGUgdHhPd25lcnNcbiAgcHJvdGVjdGVkIHNpZ0lkeHM6IFNpZ0lkeFtdW11cbiAgLy8gVGhlIENyZWRlbnRpYWxJRCB1c2VkIGZvciBTRUNQTXVsdGlzaWdDcmVkZW50aWFsXG4gIHByb3RlY3RlZCBjcmVkVHlwZUlEOiBudW1iZXJcblxuICBnZXRIUlAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5ocnBcbiAgfVxuXG4gIGdldENoYWluSUQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5jaGFpbklEXG4gIH1cblxuICBjcmVhdGUoLi4uYXJnczogYW55W10pOiB0aGlzIHtcbiAgICBpZiAoYXJncy5sZW5ndGggPT0gNCkge1xuICAgICAgcmV0dXJuIG5ldyBNdWx0aXNpZ0tleUNoYWluKGFyZ3NbMF0sIGFyZ3NbMV0sIGFyZ3NbMl0sIGFyZ3NbNF0pIGFzIHRoaXNcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBNdWx0aXNpZ0tleUNoYWluKFxuICAgICAgdGhpcy5ocnAsXG4gICAgICB0aGlzLmNoYWluSUQsXG4gICAgICB0aGlzLnNpZ25lZEJ5dGVzLFxuICAgICAgdGhpcy5jcmVkVHlwZUlEXG4gICAgKSBhcyB0aGlzXG4gIH1cblxuICBjbG9uZSgpOiB0aGlzIHtcbiAgICBjb25zdCBuZXdrYyA9IG5ldyBNdWx0aXNpZ0tleUNoYWluKFxuICAgICAgdGhpcy5ocnAsXG4gICAgICB0aGlzLmNoYWluSUQsXG4gICAgICB0aGlzLnNpZ25lZEJ5dGVzLFxuICAgICAgdGhpcy5jcmVkVHlwZUlEXG4gICAgKSBhcyB0aGlzXG4gICAgZm9yIChsZXQgayBpbiB0aGlzLmtleXMpIHtcbiAgICAgIG5ld2tjLmFkZEtleSh0aGlzLmtleXNbYCR7a31gXS5jbG9uZSgpKVxuICAgIH1cbiAgICBuZXdrYy50eE93bmVycyA9IG5ldyBBcnJheSh0aGlzLnR4T3duZXJzLmxlbmd0aClcbiAgICB0aGlzLnR4T3duZXJzLmZvckVhY2goKHR4bywgaW5kZXgpID0+XG4gICAgICBuZXdrYy50eE93bmVyc1tpbmRleF0uZnJvbUJ1ZmZlcih0eG8udG9CdWZmZXIoKSlcbiAgICApXG4gICAgcmV0dXJuIG5ld2tjXG4gIH1cblxuICB1bmlvbihrYzogdGhpcyk6IHRoaXMge1xuICAgIGlmIChcbiAgICAgIGtjLmNoYWluSUQgIT09IHRoaXMuY2hhaW5JRCB8fFxuICAgICAga2MuaHJwICE9IHRoaXMuaHJwIHx8XG4gICAgICBrYy5zaWduZWRCeXRlcy5jb21wYXJlKHRoaXMuc2lnbmVkQnl0ZXMpICE9IDBcbiAgICApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcImtleWNoYWlucyBkbyBub3QgbWF0Y2hcIilcbiAgICB9XG4gICAgY29uc3QgbmV3a2MgPSBrYy5jbG9uZSgpXG4gICAgT2JqZWN0LmFzc2lnbihuZXdrYy5rZXlzLCBrYy5rZXlzKVxuXG4gICAgcmV0dXJuIG5ld2tjXG4gIH1cblxuICAvLyBWaXNpdCBldmVyeSB0eE91dHB1dE93bmVyIGFuZCB0cnkgdG8gdmVyaWZ5IHdpdGgga2V5cy5cbiAgLy8gVHJhdmVyc2UgaW50byBtc2lnIGFsaWFzZXMuIFRocm93IGlmIG9uZSBjYW5ub3QgYmUgZnVsZmlsbGVkXG4gIGJ1aWxkU2lnbmF0dXJlSW5kaWNlcygpIHtcbiAgICB0aGlzLnNpZ0lkeHMgPSBbXVxuICAgIGZvciAoY29uc3QgbyBvZiB0aGlzLnR4T3duZXJzKSB0aGlzLl90cmF2ZXJzZU93bmVyKG8pXG4gIH1cblxuICBnZXRDcmVkZW50aWFscygpOiBDcmVkZW50aWFsW10ge1xuICAgIGNvbnN0IHJlc3VsdDogU0VDUE11bHRpc2lnQ3JlZGVudGlhbFtdID0gW11cbiAgICBmb3IgKGNvbnN0IHNpZ1NldCBvZiB0aGlzLnNpZ0lkeHMpIHtcbiAgICAgIGNvbnN0IGNyZWQgPSBuZXcgU0VDUE11bHRpc2lnQ3JlZGVudGlhbCh0aGlzLmNyZWRUeXBlSUQpXG4gICAgICBmb3IgKGNvbnN0IHNpZ0lkeCBvZiBzaWdTZXQpIHtcbiAgICAgICAgY3JlZC5hZGRTU2lnbmF0dXJlSW5kZXgoc2lnSWR4KVxuICAgICAgICBjb25zdCBzaWcgPSBuZXcgU2lnbmF0dXJlKClcbiAgICAgICAgc2lnLmZyb21CdWZmZXIodGhpcy5nZXRLZXkoc2lnSWR4LmdldFNvdXJjZSgpKS5nZXRQcml2YXRlS2V5KCkpXG4gICAgICAgIGNyZWQuYWRkU2lnbmF0dXJlKHNpZylcbiAgICAgIH1cbiAgICAgIHJlc3VsdC5wdXNoKGNyZWQpXG4gICAgfVxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuXG4gIHByb3RlY3RlZCBfdHJhdmVyc2VPd25lcihvd25lcjogT3V0cHV0T3duZXJzKTogdm9pZCB7XG4gICAgdmFyIGFkZHJWaXNpdGVkID0gMFxuICAgIHZhciBhZGRyVmVyaWZpZWQgPSAwXG5cbiAgICB0eXBlIHN0YWNrSXRlbSA9IHtcbiAgICAgIGluZGV4OiBudW1iZXJcbiAgICAgIHZlcmlmaWVkOiBudW1iZXJcbiAgICAgIGFkZHJWZXJpZmllZFRvdGFsOiBudW1iZXJcbiAgICAgIHBhcmVudFZlcmlmaWVkOiBib29sZWFuXG4gICAgICBvd25lcnM6IE91dHB1dE93bmVyc1xuICAgIH1cblxuICAgIGNvbnN0IGN5Y2xlQ2hlY2sgPSBuZXcgU2V0PHN0cmluZz4oKVxuICAgIGNvbnN0IHN0YWNrOiBzdGFja0l0ZW1bXSA9IFtcbiAgICAgIHtcbiAgICAgICAgaW5kZXg6IDAsXG4gICAgICAgIHZlcmlmaWVkOiAwLFxuICAgICAgICBhZGRyVmVyaWZpZWRUb3RhbDogMCxcbiAgICAgICAgcGFyZW50VmVyaWZpZWQ6IGZhbHNlLFxuICAgICAgICBvd25lcnM6IG93bmVyXG4gICAgICB9XG4gICAgXVxuXG4gICAgY29uc3Qgc2lnSWR4czogU2lnSWR4W10gPSBbXVxuICAgIGNvbnN0IGhlbHBlciA9IEJ1ZmZlci5hbGxvYyg0KVxuXG4gICAgU3RhY2s6IHdoaWxlIChzdGFjay5sZW5ndGggPiAwKSB7XG4gICAgICAvLyBnZXQgaGVhZFxuICAgICAgdmFyIGN1cnJlbnRTdGFjayA9IHN0YWNrW3N0YWNrLmxlbmd0aCAtIDFdXG4gICAgICB3aGlsZSAoY3VycmVudFN0YWNrLmluZGV4IDwgY3VycmVudFN0YWNrLm93bmVycy5nZXRBZGRyZXNzZXNMZW5ndGgoKSkge1xuICAgICAgICAvLyBnZXQgdGhlIG5leHQgYWRkcmVzcyB0byBjaGVja1xuICAgICAgICBjb25zdCBhZGRyID0gY3VycmVudFN0YWNrLm93bmVycy5nZXRBZGRyZXNzKGN1cnJlbnRTdGFjay5pbmRleClcbiAgICAgICAgY29uc3QgYWRkclN0ciA9IGFkZHIudG9TdHJpbmcoXCJoZXhcIilcbiAgICAgICAgY3VycmVudFN0YWNrLmluZGV4KytcbiAgICAgICAgLy8gSXMgaXQgYSBtdWx0aS1zaWcgYWRkcmVzcyA/XG4gICAgICAgIGNvbnN0IGFsaWFzID0gdGhpcy5tc2lnQWxpYXNlcy5nZXQoYWRkclN0cilcbiAgICAgICAgaWYgKGFsaWFzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBpZiAoc3RhY2subGVuZ3RoID4gTWF4U2lnbmF0dXJlcykge1xuICAgICAgICAgICAgdGhyb3cgVG9vTWFueVNpZ25hdHVyZXNcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGN5Y2xlQ2hlY2suaGFzKGFkZHJTdHIpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJjeWNsaW5rIG11bHRpc2lnIGFsaWFzXCIpXG4gICAgICAgICAgfVxuICAgICAgICAgIGN5Y2xlQ2hlY2suYWRkKGFkZHJTdHIpXG4gICAgICAgICAgc3RhY2sucHVzaCh7XG4gICAgICAgICAgICBpbmRleDogMCxcbiAgICAgICAgICAgIHZlcmlmaWVkOiAwLFxuICAgICAgICAgICAgYWRkclZlcmlmaWVkVG90YWw6IGFkZHJWZXJpZmllZCxcbiAgICAgICAgICAgIHBhcmVudFZlcmlmaWVkOlxuICAgICAgICAgICAgICBjdXJyZW50U3RhY2sucGFyZW50VmVyaWZpZWQgfHxcbiAgICAgICAgICAgICAgY3VycmVudFN0YWNrLnZlcmlmaWVkID49IGN1cnJlbnRTdGFjay5vd25lcnMuZ2V0VGhyZXNob2xkKCksXG4gICAgICAgICAgICBvd25lcnM6IGFsaWFzXG4gICAgICAgICAgfSlcbiAgICAgICAgICBjb250aW51ZSBTdGFja1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICFjdXJyZW50U3RhY2sucGFyZW50VmVyaWZpZWQgJiZcbiAgICAgICAgICAgIGN1cnJlbnRTdGFjay52ZXJpZmllZCA8IGN1cnJlbnRTdGFjay5vd25lcnMuZ2V0VGhyZXNob2xkKClcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmhhc0tleShhZGRyKSkge1xuICAgICAgICAgICAgICBpZiAoYWRkclZpc2l0ZWQgPiBNYXhTaWduYXR1cmVzKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgVG9vTWFueVNpZ25hdHVyZXNcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGNvbnN0IHNpZ0lkeCA9IG5ldyBTaWdJZHgoKVxuICAgICAgICAgICAgICBzaWdJZHguc2V0U291cmNlKGFkZHIpXG4gICAgICAgICAgICAgIGhlbHBlci53cml0ZVVJbnRCRShhZGRyVmlzaXRlZCwgMCwgNClcbiAgICAgICAgICAgICAgc2lnSWR4LmZyb21CdWZmZXIoaGVscGVyKVxuICAgICAgICAgICAgICBzaWdJZHhzLnB1c2goc2lnSWR4KVxuXG4gICAgICAgICAgICAgIGN1cnJlbnRTdGFjay52ZXJpZmllZCsrXG4gICAgICAgICAgICAgIGFkZHJWZXJpZmllZCsrXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGFkZHJWaXNpdGVkKytcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyByZW1vdmUgaGVhZFxuICAgICAgc3RhY2sucG9wKClcbiAgICAgIC8vIHZlcmlmeSBjdXJyZW50IGxldmVsXG4gICAgICBpZiAoY3VycmVudFN0YWNrLnZlcmlmaWVkIDwgY3VycmVudFN0YWNrLm93bmVycy5nZXRUaHJlc2hvbGQoKSkge1xuICAgICAgICBpZiAoc3RhY2subGVuZ3RoID09IDApIHtcbiAgICAgICAgICB0aHJvdyBuZXcgU2lnbmF0dXJlRXJyb3IoXCJOb3QgZW5vdWdoIHNpZ25hdHVyZXNcIilcbiAgICAgICAgfVxuICAgICAgICAvLyBXZSByZWNvdmVyIHRvIHByZXZpb3VzIHN0YXRlXG4gICAgICAgIGFkZHJWZXJpZmllZCA9IGN1cnJlbnRTdGFjay5hZGRyVmVyaWZpZWRUb3RhbFxuICAgICAgICBzdGFjay5zcGxpY2UoYWRkclZlcmlmaWVkKVxuICAgICAgfSBlbHNlIGlmIChzdGFjay5sZW5ndGggPiAwKSB7XG4gICAgICAgIGN1cnJlbnRTdGFjayA9IHN0YWNrW3N0YWNrLmxlbmd0aCAtIDFdXG4gICAgICAgIGlmIChjdXJyZW50U3RhY2sudmVyaWZpZWQgPCBjdXJyZW50U3RhY2sub3duZXJzLmdldFRocmVzaG9sZCgpKSB7XG4gICAgICAgICAgLy8gYXBwbHkgY2hpbGQgdmVyaWZpY2F0aW9uXG4gICAgICAgICAgY3VycmVudFN0YWNrLnZlcmlmaWVkKytcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuc2lnSWR4cy5wdXNoKHNpZ0lkeHMpXG4gIH1cblxuICBjb25zdHJ1Y3RvcihcbiAgICBocnA6IHN0cmluZyxcbiAgICBjaGFpbklEOiBzdHJpbmcsXG4gICAgc2lnbmVkQnl0ZXM6IEJ1ZmZlcixcbiAgICBjcmVkVHlwZUlEOiBudW1iZXIsXG4gICAgdHhPd25lcnM/OiBPdXRwdXRPd25lcnNbXSxcbiAgICBtc2lnQWxpYXNlcz86IE1hcDxzdHJpbmcsIE91dHB1dE93bmVycz5cbiAgKSB7XG4gICAgc3VwZXIoKVxuICAgIHRoaXMuaHJwID0gaHJwXG4gICAgdGhpcy5jaGFpbklEID0gY2hhaW5JRFxuICAgIHRoaXMuc2lnbmVkQnl0ZXMgPSBCdWZmZXIuZnJvbShzaWduZWRCeXRlcylcbiAgICA7KHRoaXMuY3JlZFR5cGVJRCA9IGNyZWRUeXBlSUQpLCAodGhpcy50eE93bmVycyA9IHR4T3duZXJzID8/IFtdKVxuICAgIHRoaXMubXNpZ0FsaWFzZXMgPSBtc2lnQWxpYXNlcyA/PyBuZXcgTWFwPHN0cmluZywgT3V0cHV0T3duZXJzPigpXG4gIH1cbn1cbiJdfQ==