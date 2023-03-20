"use strict";
/**
 * @packageDocumentation
 * @module API-EVM-KeyChain
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyChain = exports.KeyPair = void 0;
const bintools_1 = __importDefault(require("../../utils/bintools"));
const secp256k1_1 = require("../../common/secp256k1");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
/**
 * Class for representing a private and public keypair on an AVM Chain.
 */
class KeyPair extends secp256k1_1.SECP256k1KeyPair {
    clone() {
        const newkp = new KeyPair(this.hrp, this.chainID);
        newkp.importKey(bintools.copyFrom(this.getPrivateKey()));
        return newkp;
    }
    create(...args) {
        if (args.length == 2) {
            return new KeyPair(args[0], args[1]);
        }
        return new KeyPair(this.hrp, this.chainID);
    }
}
exports.KeyPair = KeyPair;
/**
 * Class for representing a key chain in Avalanche.
 *
 * @typeparam KeyPair Class extending [[SECP256k1KeyChain]] which is used as the key in [[KeyChain]]
 */
class KeyChain extends secp256k1_1.SECP256k1KeyChain {
    /**
     * Returns instance of KeyChain.
     */
    constructor(hrp, chainID) {
        super();
        this.hrp = "";
        this.chainID = "";
        /**
         * Makes a new key pair, returns the address.
         *
         * @returns The new key pair
         */
        this.makeKey = () => {
            const keypair = new KeyPair(this.hrp, this.chainID);
            this.addKey(keypair);
            return keypair;
        };
        this.addKey = (newKey) => {
            newKey.setChainID(this.chainID);
            super.addKey(newKey);
        };
        /**
         * Given a private key, makes a new key pair, returns the address.
         *
         * @param privk A {@link https://github.com/feross/buffer|Buffer}
         * or cb58 serialized string representing the private key
         *
         * @returns The new key pair
         */
        this.importKey = (privk) => {
            const keypair = new KeyPair(this.hrp, this.chainID);
            let pk;
            if (typeof privk === "string") {
                pk = bintools.cb58Decode(privk.split("-")[1]);
            }
            else {
                pk = bintools.copyFrom(privk);
            }
            keypair.importKey(pk);
            if (!(keypair.getAddress().toString("hex") in this.keys)) {
                this.addKey(keypair);
            }
            return keypair;
        };
        this.hrp = hrp;
        this.chainID = chainID;
    }
    create(...args) {
        if (args.length == 2) {
            return new KeyChain(args[0], args[1]);
        }
        return new KeyChain(this.hrp, this.chainID);
    }
    clone() {
        const newkc = new KeyChain(this.hrp, this.chainID);
        for (let k in this.keys) {
            newkc.addKey(this.keys[`${k}`].clone());
        }
        return newkc;
    }
    union(kc) {
        const newkc = kc.clone();
        for (let k in this.keys) {
            newkc.addKey(this.keys[`${k}`].clone());
        }
        return newkc;
    }
}
exports.KeyChain = KeyChain;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5Y2hhaW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9ldm0va2V5Y2hhaW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7Ozs7O0FBR0gsb0VBQTJDO0FBQzNDLHNEQUE0RTtBQUU1RTs7R0FFRztBQUNILE1BQU0sUUFBUSxHQUFhLGtCQUFRLENBQUMsV0FBVyxFQUFFLENBQUE7QUFFakQ7O0dBRUc7QUFDSCxNQUFhLE9BQVEsU0FBUSw0QkFBZ0I7SUFDM0MsS0FBSztRQUNILE1BQU0sS0FBSyxHQUFZLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBQzFELEtBQUssQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxDQUFBO1FBQ3hELE9BQU8sS0FBYSxDQUFBO0lBQ3RCLENBQUM7SUFFRCxNQUFNLENBQUMsR0FBRyxJQUFXO1FBQ25CLElBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLEVBQUU7WUFDcEIsT0FBTyxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFTLENBQUE7U0FDN0M7UUFDRCxPQUFPLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBUyxDQUFBO0lBQ3BELENBQUM7Q0FDRjtBQWJELDBCQWFDO0FBRUQ7Ozs7R0FJRztBQUNILE1BQWEsUUFBUyxTQUFRLDZCQUEwQjtJQWtFdEQ7O09BRUc7SUFDSCxZQUFZLEdBQVcsRUFBRSxPQUFlO1FBQ3RDLEtBQUssRUFBRSxDQUFBO1FBckVULFFBQUcsR0FBVyxFQUFFLENBQUE7UUFDaEIsWUFBTyxHQUFXLEVBQUUsQ0FBQTtRQUVwQjs7OztXQUlHO1FBQ0gsWUFBTyxHQUFHLEdBQVksRUFBRTtZQUN0QixNQUFNLE9BQU8sR0FBWSxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtZQUM1RCxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1lBQ3BCLE9BQU8sT0FBTyxDQUFBO1FBQ2hCLENBQUMsQ0FBQTtRQUVELFdBQU0sR0FBRyxDQUFDLE1BQWUsRUFBRSxFQUFFO1lBQzNCLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1lBQy9CLEtBQUssQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUE7UUFDdEIsQ0FBQyxDQUFBO1FBRUQ7Ozs7Ozs7V0FPRztRQUNILGNBQVMsR0FBRyxDQUFDLEtBQXNCLEVBQVcsRUFBRTtZQUM5QyxNQUFNLE9BQU8sR0FBWSxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtZQUM1RCxJQUFJLEVBQVUsQ0FBQTtZQUNkLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFO2dCQUM3QixFQUFFLEdBQUcsUUFBUSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7YUFDOUM7aUJBQU07Z0JBQ0wsRUFBRSxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUE7YUFDOUI7WUFDRCxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFBO1lBQ3JCLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUN4RCxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFBO2FBQ3JCO1lBQ0QsT0FBTyxPQUFPLENBQUE7UUFDaEIsQ0FBQyxDQUFBO1FBOEJDLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFBO1FBQ2QsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUE7SUFDeEIsQ0FBQztJQTlCRCxNQUFNLENBQUMsR0FBRyxJQUFXO1FBQ25CLElBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLEVBQUU7WUFDcEIsT0FBTyxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFTLENBQUE7U0FDOUM7UUFDRCxPQUFPLElBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBUyxDQUFBO0lBQ3JELENBQUM7SUFFRCxLQUFLO1FBQ0gsTUFBTSxLQUFLLEdBQWEsSUFBSSxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7UUFDNUQsS0FBSyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFO1lBQ3ZCLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQTtTQUN4QztRQUNELE9BQU8sS0FBYSxDQUFBO0lBQ3RCLENBQUM7SUFFRCxLQUFLLENBQUMsRUFBUTtRQUNaLE1BQU0sS0FBSyxHQUFhLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQTtRQUNsQyxLQUFLLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUU7WUFDdkIsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFBO1NBQ3hDO1FBQ0QsT0FBTyxLQUFhLENBQUE7SUFDdEIsQ0FBQztDQVVGO0FBMUVELDRCQTBFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXG4gKiBAbW9kdWxlIEFQSS1FVk0tS2V5Q2hhaW5cbiAqL1xuXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiYnVmZmVyL1wiXG5pbXBvcnQgQmluVG9vbHMgZnJvbSBcIi4uLy4uL3V0aWxzL2JpbnRvb2xzXCJcbmltcG9ydCB7IFNFQ1AyNTZrMUtleUNoYWluLCBTRUNQMjU2azFLZXlQYWlyIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9zZWNwMjU2azFcIlxuXG4vKipcbiAqIEBpZ25vcmVcbiAqL1xuY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKVxuXG4vKipcbiAqIENsYXNzIGZvciByZXByZXNlbnRpbmcgYSBwcml2YXRlIGFuZCBwdWJsaWMga2V5cGFpciBvbiBhbiBBVk0gQ2hhaW4uXG4gKi9cbmV4cG9ydCBjbGFzcyBLZXlQYWlyIGV4dGVuZHMgU0VDUDI1NmsxS2V5UGFpciB7XG4gIGNsb25lKCk6IHRoaXMge1xuICAgIGNvbnN0IG5ld2twOiBLZXlQYWlyID0gbmV3IEtleVBhaXIodGhpcy5ocnAsIHRoaXMuY2hhaW5JRClcbiAgICBuZXdrcC5pbXBvcnRLZXkoYmludG9vbHMuY29weUZyb20odGhpcy5nZXRQcml2YXRlS2V5KCkpKVxuICAgIHJldHVybiBuZXdrcCBhcyB0aGlzXG4gIH1cblxuICBjcmVhdGUoLi4uYXJnczogYW55W10pOiB0aGlzIHtcbiAgICBpZiAoYXJncy5sZW5ndGggPT0gMikge1xuICAgICAgcmV0dXJuIG5ldyBLZXlQYWlyKGFyZ3NbMF0sIGFyZ3NbMV0pIGFzIHRoaXNcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBLZXlQYWlyKHRoaXMuaHJwLCB0aGlzLmNoYWluSUQpIGFzIHRoaXNcbiAgfVxufVxuXG4vKipcbiAqIENsYXNzIGZvciByZXByZXNlbnRpbmcgYSBrZXkgY2hhaW4gaW4gQXZhbGFuY2hlLlxuICpcbiAqIEB0eXBlcGFyYW0gS2V5UGFpciBDbGFzcyBleHRlbmRpbmcgW1tTRUNQMjU2azFLZXlDaGFpbl1dIHdoaWNoIGlzIHVzZWQgYXMgdGhlIGtleSBpbiBbW0tleUNoYWluXV1cbiAqL1xuZXhwb3J0IGNsYXNzIEtleUNoYWluIGV4dGVuZHMgU0VDUDI1NmsxS2V5Q2hhaW48S2V5UGFpcj4ge1xuICBocnA6IHN0cmluZyA9IFwiXCJcbiAgY2hhaW5JRDogc3RyaW5nID0gXCJcIlxuXG4gIC8qKlxuICAgKiBNYWtlcyBhIG5ldyBrZXkgcGFpciwgcmV0dXJucyB0aGUgYWRkcmVzcy5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIG5ldyBrZXkgcGFpclxuICAgKi9cbiAgbWFrZUtleSA9ICgpOiBLZXlQYWlyID0+IHtcbiAgICBjb25zdCBrZXlwYWlyOiBLZXlQYWlyID0gbmV3IEtleVBhaXIodGhpcy5ocnAsIHRoaXMuY2hhaW5JRClcbiAgICB0aGlzLmFkZEtleShrZXlwYWlyKVxuICAgIHJldHVybiBrZXlwYWlyXG4gIH1cblxuICBhZGRLZXkgPSAobmV3S2V5OiBLZXlQYWlyKSA9PiB7XG4gICAgbmV3S2V5LnNldENoYWluSUQodGhpcy5jaGFpbklEKVxuICAgIHN1cGVyLmFkZEtleShuZXdLZXkpXG4gIH1cblxuICAvKipcbiAgICogR2l2ZW4gYSBwcml2YXRlIGtleSwgbWFrZXMgYSBuZXcga2V5IHBhaXIsIHJldHVybnMgdGhlIGFkZHJlc3MuXG4gICAqXG4gICAqIEBwYXJhbSBwcml2ayBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XG4gICAqIG9yIGNiNTggc2VyaWFsaXplZCBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBwcml2YXRlIGtleVxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbmV3IGtleSBwYWlyXG4gICAqL1xuICBpbXBvcnRLZXkgPSAocHJpdms6IEJ1ZmZlciB8IHN0cmluZyk6IEtleVBhaXIgPT4ge1xuICAgIGNvbnN0IGtleXBhaXI6IEtleVBhaXIgPSBuZXcgS2V5UGFpcih0aGlzLmhycCwgdGhpcy5jaGFpbklEKVxuICAgIGxldCBwazogQnVmZmVyXG4gICAgaWYgKHR5cGVvZiBwcml2ayA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgcGsgPSBiaW50b29scy5jYjU4RGVjb2RlKHByaXZrLnNwbGl0KFwiLVwiKVsxXSlcbiAgICB9IGVsc2Uge1xuICAgICAgcGsgPSBiaW50b29scy5jb3B5RnJvbShwcml2aylcbiAgICB9XG4gICAga2V5cGFpci5pbXBvcnRLZXkocGspXG4gICAgaWYgKCEoa2V5cGFpci5nZXRBZGRyZXNzKCkudG9TdHJpbmcoXCJoZXhcIikgaW4gdGhpcy5rZXlzKSkge1xuICAgICAgdGhpcy5hZGRLZXkoa2V5cGFpcilcbiAgICB9XG4gICAgcmV0dXJuIGtleXBhaXJcbiAgfVxuXG4gIGNyZWF0ZSguLi5hcmdzOiBhbnlbXSk6IHRoaXMge1xuICAgIGlmIChhcmdzLmxlbmd0aCA9PSAyKSB7XG4gICAgICByZXR1cm4gbmV3IEtleUNoYWluKGFyZ3NbMF0sIGFyZ3NbMV0pIGFzIHRoaXNcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBLZXlDaGFpbih0aGlzLmhycCwgdGhpcy5jaGFpbklEKSBhcyB0aGlzXG4gIH1cblxuICBjbG9uZSgpOiB0aGlzIHtcbiAgICBjb25zdCBuZXdrYzogS2V5Q2hhaW4gPSBuZXcgS2V5Q2hhaW4odGhpcy5ocnAsIHRoaXMuY2hhaW5JRClcbiAgICBmb3IgKGxldCBrIGluIHRoaXMua2V5cykge1xuICAgICAgbmV3a2MuYWRkS2V5KHRoaXMua2V5c1tgJHtrfWBdLmNsb25lKCkpXG4gICAgfVxuICAgIHJldHVybiBuZXdrYyBhcyB0aGlzXG4gIH1cblxuICB1bmlvbihrYzogdGhpcyk6IHRoaXMge1xuICAgIGNvbnN0IG5ld2tjOiBLZXlDaGFpbiA9IGtjLmNsb25lKClcbiAgICBmb3IgKGxldCBrIGluIHRoaXMua2V5cykge1xuICAgICAgbmV3a2MuYWRkS2V5KHRoaXMua2V5c1tgJHtrfWBdLmNsb25lKCkpXG4gICAgfVxuICAgIHJldHVybiBuZXdrYyBhcyB0aGlzXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBpbnN0YW5jZSBvZiBLZXlDaGFpbi5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGhycDogc3RyaW5nLCBjaGFpbklEOiBzdHJpbmcpIHtcbiAgICBzdXBlcigpXG4gICAgdGhpcy5ocnAgPSBocnBcbiAgICB0aGlzLmNoYWluSUQgPSBjaGFpbklEXG4gIH1cbn1cbiJdfQ==