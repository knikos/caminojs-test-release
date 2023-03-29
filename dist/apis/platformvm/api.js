"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformVMAPI = void 0;
/**
 * @packageDocumentation
 * @module API-PlatformVM
 */
const buffer_1 = require("buffer/");
const bn_js_1 = __importDefault(require("bn.js"));
const common_1 = require("../../common");
const errors_1 = require("../../utils/errors");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const keychain_1 = require("./keychain");
const constants_1 = require("../../utils/constants");
const constants_2 = require("./constants");
const tx_1 = require("./tx");
const payload_1 = require("../../utils/payload");
const helperfunctions_1 = require("../../utils/helperfunctions");
const utxos_1 = require("../platformvm/utxos");
const errors_2 = require("../../utils/errors");
const inputs_1 = require("./inputs");
const outputs_1 = require("./outputs");
const utils_1 = require("../../utils");
const builder_1 = require("./builder");
const spender_1 = require("./spender");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serialization = utils_1.Serialization.getInstance();
const NanoBN = new bn_js_1.default(1000000000);
const rewardPercentDenom = 1000000;
/**
 * Class for interacting with a node's PlatformVMAPI
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Avalanche.addAPI]] function to register this interface with Avalanche.
 */
class PlatformVMAPI extends common_1.JRPCAPI {
    /**
     * This class should not be instantiated directly.
     * Instead use the [[Avalanche.addAPI]] method.
     *
     * @param core A reference to the Avalanche class
     * @param baseURL Defaults to the string "/ext/P" as the path to blockchain's baseURL
     */
    constructor(core, baseURL = "/ext/bc/P") {
        super(core, baseURL);
        /**
         * @ignore
         */
        this.keychain = new keychain_1.KeyChain("", "");
        this.blockchainID = "";
        this.blockchainAlias = undefined;
        this.AVAXAssetID = undefined;
        this.txFee = undefined;
        this.creationTxFee = undefined;
        this.minValidatorStake = undefined;
        this.minDelegatorStake = undefined;
        /**
         * Gets the alias for the blockchainID if it exists, otherwise returns `undefined`.
         *
         * @returns The alias for the blockchainID
         */
        this.getBlockchainAlias = () => {
            return this.core.getNetwork().P.alias;
        };
        /**
         * Gets the current network, fetched via avalanche.fetchNetworkSettings.
         *
         * @returns The current Network
         */
        this.getNetwork = () => {
            return this.core.getNetwork();
        };
        /**
         * Gets the blockchainID and returns it.
         *
         * @returns The blockchainID
         */
        this.getBlockchainID = () => this.blockchainID;
        /**
         * Takes an address string and returns its {@link https://github.com/feross/buffer|Buffer} representation if valid.
         *
         * @returns A {@link https://github.com/feross/buffer|Buffer} for the address if valid, undefined if not valid.
         */
        this.parseAddress = (addr) => {
            const alias = this.getBlockchainAlias();
            const blockchainID = this.getBlockchainID();
            return bintools.parseAddress(addr, blockchainID, alias, constants_2.PlatformVMConstants.ADDRESSLENGTH);
        };
        this.addressFromBuffer = (address) => {
            const chainid = this.getBlockchainAlias()
                ? this.getBlockchainAlias()
                : this.getBlockchainID();
            const type = "bech32";
            return serialization.bufferToType(address, type, this.core.getHRP(), chainid);
        };
        /**
         * Fetches the AVAX AssetID and returns it in a Promise.
         *
         * @param refresh This function caches the response. Refresh = true will bust the cache.
         *
         * @returns The the provided string representing the AVAX AssetID
         */
        this.getAVAXAssetID = (refresh = false) => __awaiter(this, void 0, void 0, function* () {
            if (typeof this.AVAXAssetID === "undefined" || refresh) {
                this.AVAXAssetID = bintools.cb58Decode(this.core.getNetwork().X.avaxAssetID);
            }
            return this.AVAXAssetID;
        });
        /**
         * Overrides the defaults and sets the cache to a specific AVAX AssetID
         *
         * @param avaxAssetID A cb58 string or Buffer representing the AVAX AssetID
         *
         * @returns The the provided string representing the AVAX AssetID
         */
        this.setAVAXAssetID = (avaxAssetID) => {
            if (typeof avaxAssetID === "string") {
                avaxAssetID = bintools.cb58Decode(avaxAssetID);
            }
            this.AVAXAssetID = avaxAssetID;
        };
        /**
         * Gets the default tx fee for this chain.
         *
         * @returns The default tx fee as a {@link https://github.com/indutny/bn.js/|BN}
         */
        this.getDefaultTxFee = () => {
            return new bn_js_1.default(this.core.getNetwork().P.txFee);
        };
        /**
         * Gets the tx fee for this chain.
         *
         * @returns The tx fee as a {@link https://github.com/indutny/bn.js/|BN}
         */
        this.getTxFee = () => {
            if (typeof this.txFee === "undefined") {
                this.txFee = this.getDefaultTxFee();
            }
            return this.txFee;
        };
        /**
         * Gets the CreateSubnetTx fee.
         *
         * @returns The CreateSubnetTx fee as a {@link https://github.com/indutny/bn.js/|BN}
         */
        this.getCreateSubnetTxFee = () => {
            var _a;
            return new bn_js_1.default((_a = this.core.getNetwork().P.createSubnetTx) !== null && _a !== void 0 ? _a : 0);
        };
        /**
         * Gets the CreateChainTx fee.
         *
         * @returns The CreateChainTx fee as a {@link https://github.com/indutny/bn.js/|BN}
         */
        this.getCreateChainTxFee = () => {
            var _a;
            return new bn_js_1.default((_a = this.core.getNetwork().P.createChainTx) !== null && _a !== void 0 ? _a : 0);
        };
        /**
         * Sets the tx fee for this chain.
         *
         * @param fee The tx fee amount to set as {@link https://github.com/indutny/bn.js/|BN}
         */
        this.setTxFee = (fee) => {
            this.txFee = fee;
        };
        /**
         * Gets the default creation fee for this chain.
         *
         * @returns The default creation fee as a {@link https://github.com/indutny/bn.js/|BN}
         */
        this.getDefaultCreationTxFee = () => {
            return new bn_js_1.default(this.core.getNetwork().P.creationTxFee);
        };
        /**
         * Gets the creation fee for this chain.
         *
         * @returns The creation fee as a {@link https://github.com/indutny/bn.js/|BN}
         */
        this.getCreationTxFee = () => {
            if (typeof this.creationTxFee === "undefined") {
                this.creationTxFee = this.getDefaultCreationTxFee();
            }
            return this.creationTxFee;
        };
        /**
         * Sets the creation fee for this chain.
         *
         * @param fee The creation fee amount to set as {@link https://github.com/indutny/bn.js/|BN}
         */
        this.setCreationTxFee = (fee) => {
            this.creationTxFee = fee;
        };
        /**
         * Gets a reference to the keychain for this class.
         *
         * @returns The instance of [[]] for this class
         */
        this.keyChain = () => this.keychain;
        /**
         * @ignore
         */
        this.newKeyChain = () => {
            // warning, overwrites the old keychain
            const alias = this.getBlockchainAlias();
            if (alias) {
                this.keychain = new keychain_1.KeyChain(this.core.getHRP(), alias);
            }
            else {
                this.keychain = new keychain_1.KeyChain(this.core.getHRP(), this.blockchainID);
            }
            return this.keychain;
        };
        /**
         * Helper function which determines if a tx is a goose egg transaction.
         *
         * @param utx An UnsignedTx
         *
         * @returns boolean true if passes goose egg test and false if fails.
         *
         * @remarks
         * A "Goose Egg Transaction" is when the fee far exceeds a reasonable amount
         */
        this.checkGooseEgg = (utx, outTotal = common_1.ZeroBN) => __awaiter(this, void 0, void 0, function* () {
            const avaxAssetID = yield this.getAVAXAssetID();
            let outputTotal = outTotal.gt(common_1.ZeroBN)
                ? outTotal
                : utx.getOutputTotal(avaxAssetID);
            const fee = utx.getBurn(avaxAssetID);
            if (fee.lte(constants_1.ONEAVAX.mul(new bn_js_1.default(10))) || fee.lte(outputTotal)) {
                return true;
            }
            else {
                return false;
            }
        });
        /**
         * Retrieves an assetID for a subnet"s staking assset.
         *
         * @returns Returns a Promise string with cb58 encoded value of the assetID.
         */
        this.getStakingAssetID = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("platform.getStakingAssetID");
            return response.data.result.assetID;
        });
        /**
         * Creates a new blockchain.
         *
         * @param username The username of the Keystore user that controls the new account
         * @param password The password of the Keystore user that controls the new account
         * @param subnetID Optional. Either a {@link https://github.com/feross/buffer|Buffer} or an cb58 serialized string for the SubnetID or its alias.
         * @param vmID The ID of the Virtual Machine the blockchain runs. Can also be an alias of the Virtual Machine.
         * @param fxIDs The ids of the FXs the VM is running.
         * @param name A human-readable name for the new blockchain
         * @param genesis The base 58 (with checksum) representation of the genesis state of the new blockchain. Virtual Machines should have a static API method named buildGenesis that can be used to generate genesisData.
         *
         * @returns Promise for the unsigned transaction to create this blockchain. Must be signed by a sufficient number of the Subnet’s control keys and by the account paying the transaction fee.
         */
        this.createBlockchain = (username, password, subnetID = undefined, vmID, fxIDs, name, genesis) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
                fxIDs,
                vmID,
                name,
                genesisData: genesis
            };
            if (typeof subnetID === "string") {
                params.subnetID = subnetID;
            }
            else if (typeof subnetID !== "undefined") {
                params.subnetID = bintools.cb58Encode(subnetID);
            }
            const response = yield this.callMethod("platform.createBlockchain", params);
            return response.data.result.txID;
        });
        /**
         * Gets the status of a blockchain.
         *
         * @param blockchainID The blockchainID requesting a status update
         *
         * @returns Promise for a string of one of: "Validating", "Created", "Preferred", "Unknown".
         */
        this.getBlockchainStatus = (blockchainID) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                blockchainID
            };
            const response = yield this.callMethod("platform.getBlockchainStatus", params);
            return response.data.result.status;
        });
        /**
         * Get the validators and their weights of a subnet or the Primary Network at a given P-Chain height.
         *
         * @param height The P-Chain height to get the validator set at.
         * @param subnetID Optional. A cb58 serialized string for the SubnetID or its alias.
         *
         * @returns Promise GetValidatorsAtResponse
         */
        this.getValidatorsAt = (height, subnetID) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                height
            };
            if (typeof subnetID !== "undefined") {
                params.subnetID = subnetID;
            }
            const response = yield this.callMethod("platform.getValidatorsAt", params);
            return response.data.result;
        });
        /**
         * Create an address in the node's keystore.
         *
         * @param username The username of the Keystore user that controls the new account
         * @param password The password of the Keystore user that controls the new account
         *
         * @returns Promise for a string of the newly created account address.
         */
        this.createAddress = (username, password) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password
            };
            const response = yield this.callMethod("platform.createAddress", params);
            return response.data.result.address;
        });
        /**
         * Gets the balance of a particular asset.
         *
         * @param address The address to pull the asset balance from
         *
         * @returns Promise with the balance as a {@link https://github.com/indutny/bn.js/|BN} on the provided address.
         */
        this.getBalance = (params) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (params.address &&
                typeof this.parseAddress(params.address) === "undefined") {
                /* istanbul ignore next */
                throw new errors_2.AddressError("Error - PlatformVMAPI.getBalance: Invalid address format");
            }
            (_a = params.addresses) === null || _a === void 0 ? void 0 : _a.forEach((address) => {
                if (typeof this.parseAddress(address) === "undefined") {
                    /* istanbul ignore next */
                    throw new errors_2.AddressError("Error - PlatformVMAPI.getBalance: Invalid address format");
                }
            });
            const response = yield this.callMethod("platform.getBalance", params);
            const result = response.data.result;
            const parseDict = (input) => {
                let dict = {};
                for (const [k, v] of Object.entries(input))
                    dict[k] = new bn_js_1.default(v);
                return dict;
            };
            if (this.core.getNetwork().P.lockModeBondDeposit) {
                return {
                    balances: parseDict(result.balances),
                    unlockedOutputs: parseDict(result.unlockedOutputs),
                    bondedOutputs: parseDict(result.bondedOutputs),
                    depositedOutputs: parseDict(result.depositedOutputs),
                    bondedDepositedOutputs: parseDict(result.bondedDepositedOutputs),
                    utxoIDs: result.utxoIDs
                };
            }
            return {
                balance: new bn_js_1.default(result.balance),
                unlocked: new bn_js_1.default(result.unlocked),
                lockedStakeable: new bn_js_1.default(result.lockedStakeable),
                lockedNotStakeable: new bn_js_1.default(result.lockedNotStakeable),
                utxoIDs: result.utxoIDs
            };
        });
        /**
         * List the addresses controlled by the user.
         *
         * @param username The username of the Keystore user
         * @param password The password of the Keystore user
         *
         * @returns Promise for an array of addresses.
         */
        this.listAddresses = (username, password) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password
            };
            const response = yield this.callMethod("platform.listAddresses", params);
            return response.data.result.addresses;
        });
        /**
         * Lists the set of current validators.
         *
         * @param subnetID Optional. Either a {@link https://github.com/feross/buffer|Buffer} or an
         * cb58 serialized string for the SubnetID or its alias.
         * @param nodeIDs Optional. An array of strings
         *
         * @returns Promise for an array of validators that are currently staking, see: {@link https://docs.avax.network/v1.0/en/api/platform/#platformgetcurrentvalidators|platform.getCurrentValidators documentation}.
         *
         */
        this.getCurrentValidators = (subnetID = undefined, nodeIDs = undefined) => __awaiter(this, void 0, void 0, function* () {
            const params = {};
            if (typeof subnetID === "string") {
                params.subnetID = subnetID;
            }
            else if (typeof subnetID !== "undefined") {
                params.subnetID = bintools.cb58Encode(subnetID);
            }
            if (typeof nodeIDs != "undefined" && nodeIDs.length > 0) {
                params.nodeIDs = nodeIDs;
            }
            const response = yield this.callMethod("platform.getCurrentValidators", params);
            return response.data.result;
        });
        /**
         * A request that in address field accepts either a nodeID (and returns a bech32 address if it exists), or a bech32 address (and returns a NodeID if it exists).
         *
         * @param address A nodeID or a bech32 address
         *
         * @returns Promise for a string containing bech32 address that is the node owner or nodeID that the address passed is an owner of.
         */
        this.getRegisteredShortIDLink = (address) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                address
            };
            const response = yield this.callMethod("platform.getRegisteredShortIDLink", params);
            return response.data.result.address;
        });
        /**
         * Returns active or inactive deposit offers.
         *
         * @param active A boolean indicating whether to return active or inactive deposit offers.
         *
         * @returns Promise for a list containing deposit offers.
         */
        this.getAllDepositOffers = (active) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                active
            };
            const response = yield this.callMethod("platform.getAllDepositOffers", params);
            const offers = response.data.result;
            return offers.depositOffers.map((offer) => {
                return {
                    id: offer.id,
                    interestRateNominator: new bn_js_1.default(offer.interestRateNominator),
                    start: new bn_js_1.default(offer.start),
                    end: new bn_js_1.default(offer.end),
                    minAmount: new bn_js_1.default(offer.minAmount),
                    minDuration: offer.minDuration,
                    maxDuration: offer.maxDuration,
                    unlockPeriodDuration: offer.unlockPeriodDuration,
                    noRewardsPeriodDuration: offer.noRewardsPeriodDuration,
                    memo: offer.memo,
                    flags: new bn_js_1.default(offer.flags)
                };
            });
        });
        /**
         * Returns deposits coressponding to requested txIDs.
         *
         * @param depositTxIDs A list of txIDs (cb58) to request deposits for.
         *
         * @returns Promise for a list containing deposits.
         */
        this.getDeposits = (depositTxIDs) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                depositTxIDs
            };
            const response = yield this.callMethod("platform.getDeposits", params);
            const deposits = response.data.result;
            return deposits.deposits.map((deposit) => {
                return {
                    depositTxID: deposit.depositTxID,
                    depositOfferID: deposit.depositOfferID,
                    unlockedAmount: new bn_js_1.default(deposit.unlockedAmount),
                    claimedRewardAmount: new bn_js_1.default(deposit.claimedRewardAmount),
                    start: new bn_js_1.default(deposit.start),
                    duration: deposit.duration,
                    amount: new bn_js_1.default(deposit.amount)
                };
            });
        });
        /**
         * List amounts that can be claimed: validator rewards, expired deposit rewards, active deposit rewards claimable at current time.
         *
         * @param addresses An array of addresses as cb58 strings or addresses as {@link https://github.com/feross/buffer|Buffer}s
         * @param depositTxIDs An array of deposit transactions ids
         * @param locktime Optional. The locktime field created in the resulting outputs
         * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
         *
         * @returns Promise for an object containing the amounts that can be claimed.
         */
        this.getClaimables = (addresses, depositTxIDs, locktime = undefined, threshold = 1) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                threshold,
                addresses,
                depositTxIDs
            };
            if (typeof locktime !== "undefined") {
                params.locktime = locktime;
            }
            const response = yield this.callMethod("platform.getClaimables", params);
            const result = response.data.result;
            return {
                depositRewards: new bn_js_1.default(result.depositRewards),
                validatorRewards: new bn_js_1.default(result.validatorRewards),
                expiredDepositRewards: new bn_js_1.default(result.expiredDepositRewards)
            };
        });
        /**
         * Lists the set of pending validators.
         *
         * @param subnetID Optional. Either a {@link https://github.com/feross/buffer|Buffer}
         * or a cb58 serialized string for the SubnetID or its alias.
         * @param nodeIDs Optional. An array of strings
         *
         * @returns Promise for an array of validators that are pending staking, see: {@link https://docs.avax.network/v1.0/en/api/platform/#platformgetpendingvalidators|platform.getPendingValidators documentation}.
         *
         */
        this.getPendingValidators = (subnetID = undefined, nodeIDs = undefined) => __awaiter(this, void 0, void 0, function* () {
            const params = {};
            if (typeof subnetID === "string") {
                params.subnetID = subnetID;
            }
            else if (typeof subnetID !== "undefined") {
                params.subnetID = bintools.cb58Encode(subnetID);
            }
            if (typeof nodeIDs != "undefined" && nodeIDs.length > 0) {
                params.nodeIDs = nodeIDs;
            }
            const response = yield this.callMethod("platform.getPendingValidators", params);
            return response.data.result;
        });
        /**
         * Samples `Size` validators from the current validator set.
         *
         * @param sampleSize Of the total universe of validators, select this many at random
         * @param subnetID Optional. Either a {@link https://github.com/feross/buffer|Buffer} or an
         * cb58 serialized string for the SubnetID or its alias.
         *
         * @returns Promise for an array of validator"s stakingIDs.
         */
        this.sampleValidators = (sampleSize, subnetID = undefined) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                size: sampleSize.toString()
            };
            if (typeof subnetID === "string") {
                params.subnetID = subnetID;
            }
            else if (typeof subnetID !== "undefined") {
                params.subnetID = bintools.cb58Encode(subnetID);
            }
            const response = yield this.callMethod("platform.sampleValidators", params);
            return response.data.result.validators;
        });
        /**
         * Add a validator to the Primary Network.
         *
         * @param username The username of the Keystore user
         * @param password The password of the Keystore user
         * @param nodeID The node ID of the validator
         * @param startTime Javascript Date object for the start time to validate
         * @param endTime Javascript Date object for the end time to validate
         * @param stakeAmount The amount of nAVAX the validator is staking as
         * a {@link https://github.com/indutny/bn.js/|BN}
         * @param rewardAddress The address the validator reward will go to, if there is one.
         * @param delegationFeeRate Optional. A {@link https://github.com/indutny/bn.js/|BN} for the percent fee this validator
         * charges when others delegate stake to them. Up to 4 decimal places allowed additional decimal places are ignored.
         * Must be between 0 and 100, inclusive. For example, if delegationFeeRate is 1.2345 and someone delegates to this
         * validator, then when the delegation period is over, 1.2345% of the reward goes to the validator and the rest goes
         * to the delegator.
         *
         * @returns Promise for a base58 string of the unsigned transaction.
         */
        this.addValidator = (username, password, nodeID, startTime, endTime, stakeAmount, rewardAddress, delegationFeeRate = undefined) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
                nodeID,
                startTime: startTime.getTime() / 1000,
                endTime: endTime.getTime() / 1000,
                stakeAmount: stakeAmount.toString(10),
                rewardAddress
            };
            if (typeof delegationFeeRate !== "undefined") {
                params.delegationFeeRate = delegationFeeRate.toString(10);
            }
            const response = yield this.callMethod("platform.addValidator", params);
            return response.data.result.txID;
        });
        /**
         * Add a validator to a Subnet other than the Primary Network. The validator must validate the Primary Network for the entire duration they validate this Subnet.
         *
         * @param username The username of the Keystore user
         * @param password The password of the Keystore user
         * @param nodeID The node ID of the validator
         * @param subnetID Either a {@link https://github.com/feross/buffer|Buffer} or a cb58 serialized string for the SubnetID or its alias.
         * @param startTime Javascript Date object for the start time to validate
         * @param endTime Javascript Date object for the end time to validate
         * @param weight The validator’s weight used for sampling
         *
         * @returns Promise for the unsigned transaction. It must be signed (using sign) by the proper number of the Subnet’s control keys and by the key of the account paying the transaction fee before it can be issued.
         */
        this.addSubnetValidator = (username, password, nodeID, subnetID, startTime, endTime, weight) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
                nodeID,
                startTime: startTime.getTime() / 1000,
                endTime: endTime.getTime() / 1000,
                weight
            };
            if (typeof subnetID === "string") {
                params.subnetID = subnetID;
            }
            else if (typeof subnetID !== "undefined") {
                params.subnetID = bintools.cb58Encode(subnetID);
            }
            const response = yield this.callMethod("platform.addSubnetValidator", params);
            return response.data.result.txID;
        });
        /**
         * Add a delegator to the Primary Network.
         *
         * @param username The username of the Keystore user
         * @param password The password of the Keystore user
         * @param nodeID The node ID of the delegatee
         * @param startTime Javascript Date object for when the delegator starts delegating
         * @param endTime Javascript Date object for when the delegator starts delegating
         * @param stakeAmount The amount of nAVAX the delegator is staking as
         * a {@link https://github.com/indutny/bn.js/|BN}
         * @param rewardAddress The address of the account the staked AVAX and validation reward
         * (if applicable) are sent to at endTime
         *
         * @returns Promise for an array of validator"s stakingIDs.
         */
        this.addDelegator = (username, password, nodeID, startTime, endTime, stakeAmount, rewardAddress) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
                nodeID,
                startTime: startTime.getTime() / 1000,
                endTime: endTime.getTime() / 1000,
                stakeAmount: stakeAmount.toString(10),
                rewardAddress
            };
            const response = yield this.callMethod("platform.addDelegator", params);
            return response.data.result.txID;
        });
        /**
         * Create an unsigned transaction to create a new Subnet. The unsigned transaction must be
         * signed with the key of the account paying the transaction fee. The Subnet’s ID is the ID of the transaction that creates it (ie the response from issueTx when issuing the signed transaction).
         *
         * @param username The username of the Keystore user
         * @param password The password of the Keystore user
         * @param controlKeys Array of platform addresses as strings
         * @param threshold To add a validator to this Subnet, a transaction must have threshold
         * signatures, where each signature is from a key whose address is an element of `controlKeys`
         *
         * @returns Promise for a string with the unsigned transaction encoded as base58.
         */
        this.createSubnet = (username, password, controlKeys, threshold) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
                controlKeys,
                threshold
            };
            const response = yield this.callMethod("platform.createSubnet", params);
            return response.data.result.txID
                ? response.data.result.txID
                : response.data.result;
        });
        /**
         * Get the Subnet that validates a given blockchain.
         *
         * @param blockchainID Either a {@link https://github.com/feross/buffer|Buffer} or a cb58
         * encoded string for the blockchainID or its alias.
         *
         * @returns Promise for a string of the subnetID that validates the blockchain.
         */
        this.validatedBy = (blockchainID) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                blockchainID
            };
            const response = yield this.callMethod("platform.validatedBy", params);
            return response.data.result.subnetID;
        });
        /**
         * Get the IDs of the blockchains a Subnet validates.
         *
         * @param subnetID Either a {@link https://github.com/feross/buffer|Buffer} or an AVAX
         * serialized string for the SubnetID or its alias.
         *
         * @returns Promise for an array of blockchainIDs the subnet validates.
         */
        this.validates = (subnetID) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                subnetID
            };
            if (typeof subnetID === "string") {
                params.subnetID = subnetID;
            }
            else if (typeof subnetID !== "undefined") {
                params.subnetID = bintools.cb58Encode(subnetID);
            }
            const response = yield this.callMethod("platform.validates", params);
            return response.data.result.blockchainIDs;
        });
        /**
         * Get all the blockchains that exist (excluding the P-Chain).
         *
         * @returns Promise for an array of objects containing fields "id", "subnetID", and "vmID".
         */
        this.getBlockchains = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("platform.getBlockchains");
            return response.data.result.blockchains;
        });
        /**
         * Send AVAX from an account on the P-Chain to an address on the X-Chain. This transaction
         * must be signed with the key of the account that the AVAX is sent from and which pays the
         * transaction fee. After issuing this transaction, you must call the X-Chain’s importAVAX
         * method to complete the transfer.
         *
         * @param username The Keystore user that controls the account specified in `to`
         * @param password The password of the Keystore user
         * @param to The address on the X-Chain to send the AVAX to. Do not include X- in the address
         * @param amount Amount of AVAX to export as a {@link https://github.com/indutny/bn.js/|BN}
         *
         * @returns Promise for an unsigned transaction to be signed by the account the the AVAX is
         * sent from and pays the transaction fee.
         */
        this.exportAVAX = (username, password, amount, to) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
                to,
                amount: amount.toString(10)
            };
            const response = yield this.callMethod("platform.exportAVAX", params);
            return response.data.result.txID
                ? response.data.result.txID
                : response.data.result;
        });
        /**
         * Send AVAX from an account on the P-Chain to an address on the X-Chain. This transaction
         * must be signed with the key of the account that the AVAX is sent from and which pays
         * the transaction fee. After issuing this transaction, you must call the X-Chain’s
         * importAVAX method to complete the transfer.
         *
         * @param username The Keystore user that controls the account specified in `to`
         * @param password The password of the Keystore user
         * @param to The ID of the account the AVAX is sent to. This must be the same as the to
         * argument in the corresponding call to the X-Chain’s exportAVAX
         * @param sourceChain The chainID where the funds are coming from.
         *
         * @returns Promise for a string for the transaction, which should be sent to the network
         * by calling issueTx.
         */
        this.importAVAX = (username, password, to, sourceChain) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                to,
                sourceChain,
                username,
                password
            };
            const response = yield this.callMethod("platform.importAVAX", params);
            return response.data.result.txID
                ? response.data.result.txID
                : response.data.result;
        });
        /**
         * Calls the node's issueTx method from the API and returns the resulting transaction ID as a string.
         *
         * @param tx A string, {@link https://github.com/feross/buffer|Buffer}, or [[Tx]] representing a transaction
         *
         * @returns A Promise string representing the transaction ID of the posted transaction.
         */
        this.issueTx = (tx) => __awaiter(this, void 0, void 0, function* () {
            let Transaction = "";
            if (typeof tx === "string") {
                Transaction = tx;
            }
            else if (tx instanceof buffer_1.Buffer) {
                const txobj = new tx_1.Tx();
                txobj.fromBuffer(tx);
                Transaction = txobj.toStringHex();
            }
            else if (tx instanceof tx_1.Tx) {
                Transaction = tx.toStringHex();
            }
            else {
                /* istanbul ignore next */
                throw new errors_2.TransactionError("Error - platform.issueTx: provided tx is not expected type of string, Buffer, or Tx");
            }
            const params = {
                tx: Transaction.toString(),
                encoding: "hex"
            };
            const response = yield this.callMethod("platform.issueTx", params);
            return response.data.result.txID;
        });
        /**
         * Returns an upper bound on the amount of tokens that exist. Not monotonically increasing because this number can go down if a staker"s reward is denied.
         */
        this.getCurrentSupply = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("platform.getCurrentSupply");
            return new bn_js_1.default(response.data.result.supply, 10);
        });
        /**
         * Returns the height of the platform chain.
         */
        this.getHeight = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("platform.getHeight");
            return new bn_js_1.default(response.data.result.height, 10);
        });
        /**
         * Gets the minimum staking amount.
         *
         * @param refresh A boolean to bypass the local cached value of Minimum Stake Amount, polling the node instead.
         */
        this.getMinStake = (refresh = false) => __awaiter(this, void 0, void 0, function* () {
            if (refresh !== true &&
                typeof this.minValidatorStake !== "undefined" &&
                typeof this.minDelegatorStake !== "undefined") {
                return {
                    minValidatorStake: this.minValidatorStake,
                    minDelegatorStake: this.minDelegatorStake
                };
            }
            const response = yield this.callMethod("platform.getMinStake");
            this.minValidatorStake = new bn_js_1.default(response.data.result.minValidatorStake, 10);
            this.minDelegatorStake = new bn_js_1.default(response.data.result.minDelegatorStake, 10);
            return {
                minValidatorStake: this.minValidatorStake,
                minDelegatorStake: this.minDelegatorStake
            };
        });
        /**
         * getTotalStake() returns the total amount staked on the Primary Network
         *
         * @returns A big number representing total staked by validators on the primary network
         */
        this.getTotalStake = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("platform.getTotalStake");
            return new bn_js_1.default(response.data.result.stake, 10);
        });
        /**
         * getMaxStakeAmount() returns the maximum amount of nAVAX staking to the named node during the time period.
         *
         * @param subnetID A Buffer or cb58 string representing subnet
         * @param nodeID A string representing ID of the node whose stake amount is required during the given duration
         * @param startTime A big number denoting start time of the duration during which stake amount of the node is required.
         * @param endTime A big number denoting end time of the duration during which stake amount of the node is required.
         * @returns A big number representing total staked by validators on the primary network
         */
        this.getMaxStakeAmount = (subnetID, nodeID, startTime, endTime) => __awaiter(this, void 0, void 0, function* () {
            const now = (0, helperfunctions_1.UnixNow)();
            if (startTime.gt(now) || endTime.lte(startTime)) {
                throw new errors_2.TimeError("PlatformVMAPI.getMaxStakeAmount -- startTime must be in the past and endTime must come after startTime");
            }
            const params = {
                nodeID: nodeID,
                startTime: startTime.toString(10),
                endTime: endTime.toString(10)
            };
            if (typeof subnetID === "string") {
                params.subnetID = subnetID;
            }
            else if (typeof subnetID !== "undefined") {
                params.subnetID = bintools.cb58Encode(subnetID);
            }
            const response = yield this.callMethod("platform.getMaxStakeAmount", params);
            return new bn_js_1.default(response.data.result.amount, 10);
        });
        /**
         * Sets the minimum stake cached in this class.
         * @param minValidatorStake A {@link https://github.com/indutny/bn.js/|BN} to set the minimum stake amount cached in this class.
         * @param minDelegatorStake A {@link https://github.com/indutny/bn.js/|BN} to set the minimum delegation amount cached in this class.
         */
        this.setMinStake = (minValidatorStake = undefined, minDelegatorStake = undefined) => {
            if (typeof minValidatorStake !== "undefined") {
                this.minValidatorStake = minValidatorStake;
            }
            if (typeof minDelegatorStake !== "undefined") {
                this.minDelegatorStake = minDelegatorStake;
            }
        };
        /**
         * Gets the total amount staked for an array of addresses.
         */
        this.getStake = (addresses, encoding = "hex") => __awaiter(this, void 0, void 0, function* () {
            const params = {
                addresses,
                encoding
            };
            const response = yield this.callMethod("platform.getStake", params);
            return {
                staked: new bn_js_1.default(response.data.result.staked, 10),
                stakedOutputs: response.data.result.stakedOutputs.map((stakedOutput) => {
                    const transferableOutput = new outputs_1.TransferableOutput();
                    let buf;
                    if (encoding === "cb58") {
                        buf = bintools.cb58Decode(stakedOutput);
                    }
                    else {
                        buf = buffer_1.Buffer.from(stakedOutput.replace(/0x/g, ""), "hex");
                    }
                    transferableOutput.fromBuffer(buf, 2);
                    return transferableOutput;
                })
            };
        });
        /**
         * Get all the subnets that exist.
         *
         * @param ids IDs of the subnets to retrieve information about. If omitted, gets all subnets
         *
         * @returns Promise for an array of objects containing fields "id",
         * "controlKeys", and "threshold".
         */
        this.getSubnets = (ids = undefined) => __awaiter(this, void 0, void 0, function* () {
            const params = {};
            if (typeof ids !== undefined) {
                params.ids = ids;
            }
            const response = yield this.callMethod("platform.getSubnets", params);
            return response.data.result.subnets;
        });
        /**
         * Exports the private key for an address.
         *
         * @param username The name of the user with the private key
         * @param password The password used to decrypt the private key
         * @param address The address whose private key should be exported
         *
         * @returns Promise with the decrypted private key as store in the database
         */
        this.exportKey = (username, password, address) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
                address
            };
            const response = yield this.callMethod("platform.exportKey", params);
            return response.data.result.privateKey
                ? response.data.result.privateKey
                : response.data.result;
        });
        /**
         * Give a user control over an address by providing the private key that controls the address.
         *
         * @param username The name of the user to store the private key
         * @param password The password that unlocks the user
         * @param privateKey A string representing the private key in the vm"s format
         *
         * @returns The address for the imported private key.
         */
        this.importKey = (username, password, privateKey) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
                privateKey
            };
            const response = yield this.callMethod("platform.importKey", params);
            return response.data.result.address
                ? response.data.result.address
                : response.data.result;
        });
        /**
         * Returns the treansaction data of a provided transaction ID by calling the node's `getTx` method.
         *
         * @param txID The string representation of the transaction ID
         * @param encoding sets the format of the returned transaction. Can be, "cb58", "hex" or "json". Defaults to "cb58".
         *
         * @returns Returns a Promise string or object containing the bytes retrieved from the node
         */
        this.getTx = (txID, encoding = "hex") => __awaiter(this, void 0, void 0, function* () {
            const params = {
                txID,
                encoding
            };
            const response = yield this.callMethod("platform.getTx", params);
            return response.data.result.tx
                ? response.data.result.tx
                : response.data.result;
        });
        /**
         * Returns the status of a provided transaction ID by calling the node's `getTxStatus` method.
         *
         * @param txid The string representation of the transaction ID
         * @param includeReason Return the reason tx was dropped, if applicable. Defaults to true
         *
         * @returns Returns a Promise string containing the status retrieved from the node and the reason a tx was dropped, if applicable.
         */
        this.getTxStatus = (txid, includeReason = true) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                txID: txid,
                includeReason: includeReason
            };
            const response = yield this.callMethod("platform.getTxStatus", params);
            return response.data.result;
        });
        /**
         * Retrieves the UTXOs related to the addresses provided from the node's `getUTXOs` method.
         *
         * @param addresses An array of addresses as cb58 strings or addresses as {@link https://github.com/feross/buffer|Buffer}s
         * @param sourceChain A string for the chain to look for the UTXO"s. Default is to use this chain, but if exported UTXOs exist from other chains, this can used to pull them instead.
         * @param limit Optional. Returns at most [limit] addresses. If [limit] == 0 or > [maxUTXOsToFetch], fetches up to [maxUTXOsToFetch].
         * @param startIndex Optional. [StartIndex] defines where to start fetching UTXOs (for pagination.)
         * UTXOs fetched are from addresses equal to or greater than [StartIndex.Address]
         * For address [StartIndex.Address], only UTXOs with IDs greater than [StartIndex.Utxo] will be returned.
         * @param persistOpts Options available to persist these UTXOs in local storage
         * @param encoding Optional.  is the encoding format to use for the payload argument. Can be either "cb58" or "hex". Defaults to "hex".
         *
         * @remarks
         * persistOpts is optional and must be of type [[PersistanceOptions]]
         *
         */
        this.getUTXOs = (addresses, sourceChain = undefined, limit = 0, startIndex = undefined, persistOpts = undefined, encoding = "hex") => __awaiter(this, void 0, void 0, function* () {
            if (typeof addresses === "string") {
                addresses = [addresses];
            }
            const params = {
                addresses: addresses,
                limit,
                encoding
            };
            if (typeof startIndex !== "undefined" && startIndex) {
                params.startIndex = startIndex;
            }
            if (typeof sourceChain !== "undefined") {
                params.sourceChain = sourceChain;
            }
            const response = yield this.callMethod("platform.getUTXOs", params);
            const utxos = new utxos_1.UTXOSet();
            let data = response.data.result.utxos;
            if (persistOpts && typeof persistOpts === "object") {
                if (this.db.has(persistOpts.getName())) {
                    const selfArray = this.db.get(persistOpts.getName());
                    if (Array.isArray(selfArray)) {
                        utxos.addArray(data);
                        const self = new utxos_1.UTXOSet();
                        self.addArray(selfArray);
                        self.mergeByRule(utxos, persistOpts.getMergeRule());
                        data = self.getAllUTXOStrings();
                    }
                }
                this.db.set(persistOpts.getName(), data, persistOpts.getOverwrite());
            }
            if (data.length > 0 && data[0].substring(0, 2) === "0x") {
                const cb58Strs = [];
                data.forEach((str) => {
                    cb58Strs.push(bintools.cb58Encode(buffer_1.Buffer.from(str.slice(2), "hex")));
                });
                utxos.addArray(cb58Strs, false);
            }
            else {
                utxos.addArray(data, false);
            }
            response.data.result.utxos = utxos;
            response.data.result.numFetched = parseInt(response.data.result.numFetched);
            return response.data.result;
        });
        /**
         * getAddressStates() returns an 64 bit bitmask of states applied to address
         *
         * @returns A big number representing the states applied to given address
         */
        this.getAddressStates = (address) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                address: address
            };
            const response = yield this.callMethod("platform.getAddressStates", params);
            return new bn_js_1.default(response.data.result, 10);
        });
        /**
         * getMultisigAlias() returns a MultisigAliasReply
         *
         * @returns A MultiSigAlias
         */
        this.getMultisigAlias = (address) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                address: address
            };
            const response = yield this.callMethod("platform.getMultisigAlias", params);
            return response.data.result;
        });
        /**
         * Helper function which creates an unsigned Import Tx. For more granular control, you may create your own
         * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
         *
         * @param utxoset A set of UTXOs that the transaction is built on
         * @param ownerAddresses The addresses being used to import
         * @param sourceChain The chainid for where the import is coming from.
         * @param toAddresses The addresses to send the funds
         * @param fromAddresses The addresses being used to send the funds from the UTXOs provided
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param locktime Optional. The locktime field created in the resulting outputs
         * @param toThreshold Optional. The number of signatures required to spend the funds in the resultant UTXO
         * @param changeThreshold Optional. The number of signatures required to spend the funds in the resultant change UTXO
         *
         * @returns An unsigned transaction ([[UnsignedTx]]) which contains a [[ImportTx]].
         *
         * @remarks
         * This helper exists because the endpoint API should be the primary point of entry for most functionality.
         */
        this.buildImportTx = (utxoset, ownerAddresses, sourceChain, toAddresses, fromAddresses, changeAddresses = undefined, memo = undefined, asOf = common_1.ZeroBN, locktime = common_1.ZeroBN, toThreshold = 1, changeThreshold = 1) => __awaiter(this, void 0, void 0, function* () {
            const caller = "buildImportTx";
            const to = this._cleanAddressArrayBuffer(toAddresses, caller);
            const fromSigner = this._parseFromSigner(fromAddresses, caller);
            const change = this._cleanAddressArrayBuffer(changeAddresses, caller);
            let srcChain = undefined;
            if (typeof sourceChain === "undefined") {
                throw new errors_2.ChainIdError("Error - PlatformVMAPI.buildImportTx: Source ChainID is undefined.");
            }
            else if (typeof sourceChain === "string") {
                srcChain = sourceChain;
                sourceChain = bintools.cb58Decode(sourceChain);
            }
            else if (!(sourceChain instanceof buffer_1.Buffer)) {
                throw new errors_2.ChainIdError("Error - PlatformVMAPI.buildImportTx: Invalid destinationChain type: " +
                    typeof sourceChain);
            }
            const atomicUTXOs = yield (yield this.getUTXOs(ownerAddresses, srcChain, 0, undefined)).utxos;
            const avaxAssetID = yield this.getAVAXAssetID();
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const atomics = atomicUTXOs.getAllUTXOs();
            const builtUnsignedTx = yield this._getBuilder(utxoset).buildImportTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), to, fromSigner, change, atomics, sourceChain, this.getTxFee(), avaxAssetID, memo, asOf, locktime, toThreshold, changeThreshold);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
                /* istanbul ignore next */
                throw new errors_2.GooseEggCheckError("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Helper function which creates an unsigned Export Tx. For more granular control, you may create your own
         * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
         *
         * @param utxoset A set of UTXOs that the transaction is built on
         * @param amount The amount being exported as a {@link https://github.com/indutny/bn.js/|BN}
         * @param destinationChain The chainid for where the assets will be sent.
         * @param toAddresses The addresses to send the funds
         * @param fromAddresses The addresses being used to send the funds from the UTXOs provided
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param locktime Optional. The locktime field created in the resulting outputs
         * @param toThreshold Optional. The number of signatures required to spend the funds in the resultant UTXO
         * @param changeThreshold Optional. The number of signatures required to spend the funds in the resultant change UTXO
         *
         * @returns An unsigned transaction ([[UnsignedTx]]) which contains an [[ExportTx]].
         */
        this.buildExportTx = (utxoset, amount, destinationChain, toAddresses, fromAddresses, changeAddresses = undefined, memo = undefined, asOf = common_1.ZeroBN, locktime = common_1.ZeroBN, toThreshold = 1, changeThreshold = 1) => __awaiter(this, void 0, void 0, function* () {
            const caller = "buildExportTx";
            let prefixes = {};
            toAddresses.map((a) => {
                prefixes[a.split("-")[0]] = true;
            });
            if (Object.keys(prefixes).length !== 1) {
                throw new errors_2.AddressError("Error - PlatformVMAPI.buildExportTx: To addresses must have the same chainID prefix.");
            }
            if (typeof destinationChain === "undefined") {
                throw new errors_2.ChainIdError("Error - PlatformVMAPI.buildExportTx: Destination ChainID is undefined.");
            }
            else if (typeof destinationChain === "string") {
                destinationChain = bintools.cb58Decode(destinationChain); //
            }
            else if (!(destinationChain instanceof buffer_1.Buffer)) {
                throw new errors_2.ChainIdError("Error - PlatformVMAPI.buildExportTx: Invalid destinationChain type: " +
                    typeof destinationChain);
            }
            if (destinationChain.length !== 32) {
                throw new errors_2.ChainIdError("Error - PlatformVMAPI.buildExportTx: Destination ChainID must be 32 bytes in length.");
            }
            let to = [];
            toAddresses.map((a) => {
                to.push(bintools.stringToAddress(a));
            });
            const fromSigner = this._parseFromSigner(fromAddresses, caller);
            const change = this._cleanAddressArrayBuffer(changeAddresses, caller);
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const avaxAssetID = yield this.getAVAXAssetID();
            const builtUnsignedTx = yield this._getBuilder(utxoset).buildExportTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), amount, avaxAssetID, to, fromSigner, destinationChain, change, this.getTxFee(), avaxAssetID, memo, asOf, locktime, toThreshold, changeThreshold);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
                /* istanbul ignore next */
                throw new errors_2.GooseEggCheckError("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Helper function which creates an unsigned [[AddSubnetValidatorTx]]. For more granular control, you may create your own
         * [[UnsignedTx]] manually and import the [[AddSubnetValidatorTx]] class directly.
         *
         * @param utxoset A set of UTXOs that the transaction is built on.
         * @param fromAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who pays the fees in AVAX
         * @param changeAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who gets the change leftover from the fee payment
         * @param nodeID The node ID of the validator being added.
         * @param startTime The Unix time when the validator starts validating the Primary Network.
         * @param endTime The Unix time when the validator stops validating the Primary Network (and staked AVAX is returned).
         * @param weight The amount of weight for this subnet validator.
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param subnetAuth Optional. An Auth struct which contains the subnet Auth and the signers.
         * @param changeThreshold Optional. The number of signatures required to spend the funds in the resultant change UTXO
         *
         * @returns An unsigned transaction created from the passed in parameters.
         */
        this.buildAddSubnetValidatorTx = (utxoset, fromAddresses, changeAddresses, nodeID, startTime, endTime, weight, subnetID, memo = undefined, asOf = common_1.ZeroBN, subnetAuth = { addresses: [], threshold: 0, signer: [] }, changeThreshold = 1) => __awaiter(this, void 0, void 0, function* () {
            const caller = "buildAddSubnetValidatorTx";
            const fromSigner = this._parseFromSigner(fromAddresses, caller);
            const change = this._cleanAddressArrayBuffer(changeAddresses, caller);
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const avaxAssetID = yield this.getAVAXAssetID();
            const now = (0, helperfunctions_1.UnixNow)();
            if (startTime.lt(now) || endTime.lte(startTime)) {
                throw new Error("PlatformVMAPI.buildAddSubnetValidatorTx -- startTime must be in the future and endTime must come after startTime");
            }
            const builtUnsignedTx = yield this._getBuilder(utxoset).buildAddSubnetValidatorTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), fromSigner, change, (0, helperfunctions_1.NodeIDStringToBuffer)(nodeID), startTime, endTime, weight, subnetID, this.getDefaultTxFee(), avaxAssetID, memo, asOf, subnetAuth, changeThreshold);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
                /* istanbul ignore next */
                throw new Error("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Helper function which creates an unsigned [[AddDelegatorTx]]. For more granular control, you may create your own
         * [[UnsignedTx]] manually and import the [[AddDelegatorTx]] class directly.
         *
         * @param utxoset A set of UTXOs that the transaction is built on
         * @param toAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who received the staked tokens at the end of the staking period
         * @param fromAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who own the staking UTXOs the fees in AVAX
         * @param changeAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who gets the change leftover from the fee payment
         * @param nodeID The node ID of the validator being added.
         * @param startTime The Unix time when the validator starts validating the Primary Network.
         * @param endTime The Unix time when the validator stops validating the Primary Network (and staked AVAX is returned).
         * @param stakeAmount The amount being delegated as a {@link https://github.com/indutny/bn.js/|BN}
         * @param rewardAddresses The addresses which will recieve the rewards from the delegated stake.
         * @param rewardLocktime Optional. The locktime field created in the resulting reward outputs
         * @param rewardThreshold Opional. The number of signatures required to spend the funds in the resultant reward UTXO. Default 1.
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param toThreshold Optional. The number of signatures required to spend the funds in the resultant UTXO
         * @param changeThreshold Optional. The number of signatures required to spend the funds in the resultant change UTXO
         *
         * @returns An unsigned transaction created from the passed in parameters.
         */
        this.buildAddDelegatorTx = (utxoset, toAddresses, fromAddresses, changeAddresses, nodeID, startTime, endTime, stakeAmount, rewardAddresses, rewardLocktime = common_1.ZeroBN, rewardThreshold = 1, memo = undefined, asOf = common_1.ZeroBN, toThreshold = 1, changeThreshold = 1) => __awaiter(this, void 0, void 0, function* () {
            const caller = "buildAddDelegatorTx";
            const to = this._cleanAddressArrayBuffer(toAddresses, caller);
            const fromSigner = this._parseFromSigner(fromAddresses, caller);
            const change = this._cleanAddressArrayBuffer(changeAddresses, caller);
            const rewards = this._cleanAddressArrayBuffer(rewardAddresses, caller);
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const minStake = (yield this.getMinStake())["minDelegatorStake"];
            if (stakeAmount.lt(minStake)) {
                throw new errors_2.StakeError("PlatformVMAPI.buildAddDelegatorTx -- stake amount must be at least " +
                    minStake.toString(10));
            }
            const avaxAssetID = yield this.getAVAXAssetID();
            const now = (0, helperfunctions_1.UnixNow)();
            if (startTime.lt(now) || endTime.lte(startTime)) {
                throw new errors_2.TimeError("PlatformVMAPI.buildAddDelegatorTx -- startTime must be in the future and endTime must come after startTime");
            }
            if (this.core.getNetwork().P.lockModeBondDeposit) {
                throw new errors_1.UTXOError("PlatformVMAPI.buildAddDelegatorTx -- not supported in lockmodeBondDeposit");
            }
            const builtUnsignedTx = yield this._getBuilder(utxoset).buildAddDelegatorTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), avaxAssetID, to, fromSigner, change, (0, helperfunctions_1.NodeIDStringToBuffer)(nodeID), startTime, endTime, stakeAmount, rewardLocktime, rewardThreshold, rewards, common_1.ZeroBN, avaxAssetID, memo, asOf, toThreshold, changeThreshold);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
                /* istanbul ignore next */
                throw new errors_2.GooseEggCheckError("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Helper function which creates an unsigned [[AddValidatorTx]]. For more granular control, you may create your own
         * [[UnsignedTx]] manually and import the [[AddValidatorTx]] class directly.
         *
         * @param utxoset A set of UTXOs that the transaction is built on
         * @param toAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who received the staked tokens at the end of the staking period
         * @param fromAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who own the staking UTXOs the fees in AVAX
         * @param changeAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who gets the change leftover from the fee payment
         * @param nodeID The node ID of the validator being added.
         * @param startTime The Unix time when the validator starts validating the Primary Network.
         * @param endTime The Unix time when the validator stops validating the Primary Network (and staked AVAX is returned).
         * @param stakeAmount The amount being delegated as a {@link https://github.com/indutny/bn.js/|BN}
         * @param rewardAddresses The addresses which will recieve the rewards from the delegated stake.
         * @param delegationFee A number for the percentage of reward to be given to the validator when someone delegates to them. Must be between 0 and 100.
         * @param rewardLocktime Optional. The locktime field created in the resulting reward outputs
         * @param rewardThreshold Opional. The number of signatures required to spend the funds in the resultant reward UTXO. Default 1.
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param toThreshold Optional. The number of signatures required to spend the funds in the resultant UTXO
         * @param changeThreshold Optional. The number of signatures required to spend the funds in the resultant change UTXO
         *
         * @returns An unsigned transaction created from the passed in parameters.
         */
        this.buildAddValidatorTx = (utxoset, toAddresses, fromAddresses, changeAddresses, nodeID, startTime, endTime, stakeAmount, rewardAddresses, delegationFee, rewardLocktime = common_1.ZeroBN, rewardThreshold = 1, memo = undefined, asOf = common_1.ZeroBN, toThreshold = 1, changeThreshold = 1) => __awaiter(this, void 0, void 0, function* () {
            const caller = "buildAddValidatorTx";
            const to = this._cleanAddressArrayBuffer(toAddresses, caller);
            const fromSigner = this._parseFromSigner(fromAddresses, caller);
            const change = this._cleanAddressArrayBuffer(changeAddresses, caller);
            const rewards = this._cleanAddressArrayBuffer(rewardAddresses, caller);
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const minStake = (yield this.getMinStake())["minValidatorStake"];
            if (stakeAmount.lt(minStake)) {
                throw new errors_2.StakeError("PlatformVMAPI.buildAddValidatorTx -- stake amount must be at least " +
                    minStake.toString(10));
            }
            if (typeof delegationFee !== "number" ||
                delegationFee > 100 ||
                delegationFee < 0) {
                throw new errors_2.DelegationFeeError("PlatformVMAPI.buildAddValidatorTx -- delegationFee must be a number between 0 and 100");
            }
            const avaxAssetID = yield this.getAVAXAssetID();
            const now = (0, helperfunctions_1.UnixNow)();
            if (startTime.lt(now) || endTime.lte(startTime)) {
                throw new errors_2.TimeError("PlatformVMAPI.buildAddValidatorTx -- startTime must be in the future and endTime must come after startTime");
            }
            const builtUnsignedTx = yield this._getBuilder(utxoset).buildAddValidatorTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), to, fromSigner, change, (0, helperfunctions_1.NodeIDStringToBuffer)(nodeID), startTime, endTime, stakeAmount, avaxAssetID, rewardLocktime, rewardThreshold, rewards, delegationFee, common_1.ZeroBN, avaxAssetID, memo, asOf, toThreshold, changeThreshold);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
                /* istanbul ignore next */
                throw new errors_2.GooseEggCheckError("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Class representing an unsigned [[CreateSubnetTx]] transaction.
         *
         * @param utxoset A set of UTXOs that the transaction is built on
         * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
         * @param subnetOwnerAddresses An array of addresses for owners of the new subnet
         * @param subnetOwnerThreshold A number indicating the amount of signatures required to add validators to a subnet
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param changeThreshold Optional. The number of signatures required to spend the funds in the resultant change UTXO
         *
         * @returns An unsigned transaction created from the passed in parameters.
         */
        this.buildCreateSubnetTx = (utxoset, fromAddresses, changeAddresses, subnetOwnerAddresses, subnetOwnerThreshold, memo = undefined, asOf = common_1.ZeroBN, changeThreshold = 1) => __awaiter(this, void 0, void 0, function* () {
            const caller = "buildCreateSubnetTx";
            const fromSigner = this._parseFromSigner(fromAddresses, caller);
            const change = this._cleanAddressArrayBuffer(changeAddresses, caller);
            const owners = this._cleanAddressArrayBuffer(subnetOwnerAddresses, caller);
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const avaxAssetID = yield this.getAVAXAssetID();
            const networkID = this.core.getNetworkID();
            const blockchainID = bintools.cb58Decode(this.blockchainID);
            const fee = this.getCreateSubnetTxFee();
            const builtUnsignedTx = yield this._getBuilder(utxoset).buildCreateSubnetTx(networkID, blockchainID, fromSigner, change, owners, subnetOwnerThreshold, fee, avaxAssetID, memo, asOf, changeThreshold);
            if (!(yield this.checkGooseEgg(builtUnsignedTx, this.getCreationTxFee()))) {
                /* istanbul ignore next */
                throw new errors_2.GooseEggCheckError("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Build an unsigned [[CreateChainTx]].
         *
         * @param utxoset A set of UTXOs that the transaction is built on
         * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
         * @param subnetID Optional ID of the Subnet that validates this blockchain
         * @param chainName Optional A human readable name for the chain; need not be unique
         * @param vmID Optional ID of the VM running on the new chain
         * @param fxIDs Optional IDs of the feature extensions running on the new chain
         * @param genesisData Optional Byte representation of genesis state of the new chain
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param subnetAuth Optional. An Auth struct which contains the subnet Auth and the signers.
         * @param changeThreshold Optional. The number of signatures required to spend the funds in the resultant change UTXO
         *
         * @returns An unsigned transaction created from the passed in parameters.
         */
        this.buildCreateChainTx = (utxoset, fromAddresses, changeAddresses, subnetID = undefined, chainName = undefined, vmID = undefined, fxIDs = undefined, genesisData = undefined, memo = undefined, asOf = common_1.ZeroBN, subnetAuth = { addresses: [], threshold: 0, signer: [] }, changeThreshold = 1) => __awaiter(this, void 0, void 0, function* () {
            const caller = "buildCreateChainTx";
            const fromSigner = this._parseFromSigner(fromAddresses, caller);
            const change = this._cleanAddressArrayBuffer(changeAddresses, caller);
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const avaxAssetID = yield this.getAVAXAssetID();
            fxIDs = fxIDs.sort();
            const networkID = this.core.getNetworkID();
            const blockchainID = bintools.cb58Decode(this.blockchainID);
            const fee = this.getCreateChainTxFee();
            const builtUnsignedTx = yield this._getBuilder(utxoset).buildCreateChainTx(networkID, blockchainID, fromSigner, change, subnetID, chainName, vmID, fxIDs, genesisData, fee, avaxAssetID, memo, asOf, subnetAuth, changeThreshold);
            if (!(yield this.checkGooseEgg(builtUnsignedTx, this.getCreationTxFee()))) {
                /* istanbul ignore next */
                throw new errors_2.GooseEggCheckError("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Build an unsigned [[AddressStateTx]].
         *
         * @param utxoset A set of UTXOs that the transaction is built on
         * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs.
         * @param address The address to alter state.
         * @param state The state to set or remove on the given address
         * @param remove Optional. Flag if state should be applied or removed
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param changeThreshold Optional. The number of signatures required to spend the funds in the resultant change UTXO
         *
         * @returns An unsigned AddressStateTx created from the passed in parameters.
         */
        this.buildAddressStateTx = (utxoset, fromAddresses, changeAddresses, address, state, remove = false, memo = undefined, asOf = common_1.ZeroBN, changeThreshold = 1) => __awaiter(this, void 0, void 0, function* () {
            const caller = "buildAddressStateTx";
            const fromSigner = this._parseFromSigner(fromAddresses, caller);
            const change = this._cleanAddressArrayBuffer(changeAddresses, caller);
            const addressBuf = typeof address === "string" ? this.parseAddress(address) : address;
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const avaxAssetID = yield this.getAVAXAssetID();
            const networkID = this.core.getNetworkID();
            const blockchainID = bintools.cb58Decode(this.blockchainID);
            const fee = this.getTxFee();
            const builtUnsignedTx = yield this._getBuilder(utxoset).buildAddressStateTx(networkID, blockchainID, fromSigner, change, addressBuf, state, remove, fee, avaxAssetID, memo, asOf, changeThreshold);
            if (!(yield this.checkGooseEgg(builtUnsignedTx, this.getCreationTxFee()))) {
                /* istanbul ignore next */
                throw new errors_2.GooseEggCheckError("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Build an unsigned [[RegisterNodeTx]].
         *
         * @param utxoset A set of UTXOs that the transaction is built on
         * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
         * @param oldNodeID Optional. ID of the existing NodeID to replace or remove.
         * @param newNodeID Optional. ID of the newNodID to register address.
         * @param address The consortiumMemberAddress, single or multi-sig.
         * @param addressAuths An array of index and address to verify ownership of address.
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param changeThreshold Optional. The number of signatures required to spend the funds in the resultant change UTXO
         *
         * @returns An unsigned transaction created from the passed in parameters.
         */
        this.buildRegisterNodeTx = (utxoset, fromAddresses, changeAddresses = undefined, oldNodeID = undefined, newNodeID = undefined, address = undefined, addressAuths = [], memo = undefined, asOf = common_1.ZeroBN, changeThreshold = 1) => __awaiter(this, void 0, void 0, function* () {
            const caller = "buildRegisterNodeTx";
            const fromSigner = this._parseFromSigner(fromAddresses, caller);
            const change = this._cleanAddressArrayBuffer(changeAddresses, caller);
            const addrBuf = typeof address === "string" ? this.parseAddress(address) : address;
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const auth = [];
            addressAuths.forEach((c) => {
                auth.push([
                    c[0],
                    typeof c[1] === "string" ? this.parseAddress(c[1]) : c[1]
                ]);
            });
            if (typeof oldNodeID === "string") {
                oldNodeID = (0, helperfunctions_1.NodeIDStringToBuffer)(oldNodeID);
            }
            if (typeof newNodeID === "string") {
                newNodeID = (0, helperfunctions_1.NodeIDStringToBuffer)(newNodeID);
            }
            const avaxAssetID = yield this.getAVAXAssetID();
            const networkID = this.core.getNetworkID();
            const blockchainID = bintools.cb58Decode(this.blockchainID);
            const fee = this.getTxFee();
            const builtUnsignedTx = yield this._getBuilder(utxoset).buildRegisterNodeTx(networkID, blockchainID, fromSigner, change, oldNodeID, newNodeID, addrBuf, auth, fee, avaxAssetID, memo, asOf, changeThreshold);
            if (!(yield this.checkGooseEgg(builtUnsignedTx, this.getCreationTxFee()))) {
                /* istanbul ignore next */
                throw new errors_2.GooseEggCheckError("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Build an unsigned [[DepositTx]].
         *
         * @param utxoset A set of UTXOs that the transaction is built on
         * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs.
         * @param depositOfferID ID of the deposit offer.
         * @param depositDuration Duration of the deposit
         * @param rewardsOwner Optional The owners of the reward. If omitted, all inputs must have the same owner
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param changeThreshold Optional. The number of signatures required to spend the funds in the resultant change UTXO
         *
         * @returns An unsigned transaction created from the passed in parameters.
         */
        this.buildDepositTx = (utxoset, fromAddresses, changeAddresses = undefined, depositOfferID, depositDuration, rewardsOwner = undefined, memo = undefined, asOf = common_1.ZeroBN, amountToLock, changeThreshold = 1) => __awaiter(this, void 0, void 0, function* () {
            const caller = "buildRegisterNodeTx";
            const fromSigner = this._parseFromSigner(fromAddresses, caller);
            const change = this._cleanAddressArrayBuffer(changeAddresses, caller);
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const avaxAssetID = yield this.getAVAXAssetID();
            const networkID = this.core.getNetworkID();
            const blockchainID = bintools.cb58Decode(this.blockchainID);
            const fee = this.getTxFee();
            const builtUnsignedTx = yield this._getBuilder(utxoset).buildDepositTx(networkID, blockchainID, fromSigner, change, depositOfferID, depositDuration, rewardsOwner, fee, avaxAssetID, memo, asOf, amountToLock, changeThreshold);
            if (!(yield this.checkGooseEgg(builtUnsignedTx, this.getCreationTxFee()))) {
                /* istanbul ignore next */
                throw new errors_2.GooseEggCheckError("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Build an unsigned [[UnlockDepositTx]].
         *
         * @param utxoset A set of UTXOs that the transaction is built on
         * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs.
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param changeThreshold Optional. The number of signatures required to spend the funds in the resultant change UTXO
         *
         * @returns An unsigned transaction created from the passed in parameters.
         */
        this.buildUnlockDepositTx = (utxoset, fromAddresses, changeAddresses = undefined, memo = undefined, asOf = common_1.ZeroBN, amountToLock, changeThreshold = 1) => __awaiter(this, void 0, void 0, function* () {
            const caller = "buildUnlockDepositTx";
            const fromSigner = this._parseFromSigner(fromAddresses, caller);
            const change = this._cleanAddressArrayBuffer(changeAddresses, caller);
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const avaxAssetID = yield this.getAVAXAssetID();
            const networkID = this.core.getNetworkID();
            const blockchainID = bintools.cb58Decode(this.blockchainID);
            const fee = this.getTxFee();
            const builtUnsignedTx = yield this._getBuilder(utxoset).buildUnlockDepositTx(networkID, blockchainID, fromSigner, change, fee, avaxAssetID, memo, asOf, changeThreshold);
            if (!(yield this.checkGooseEgg(builtUnsignedTx, this.getCreationTxFee()))) {
                /* istanbul ignore next */
                throw new errors_2.GooseEggCheckError("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Build an unsigned [[ClaimTx]].
         *
         * @param utxoset A set of UTXOs that the transaction is built on
         * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs.
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param changeThreshold Optional. The number of signatures required to spend the funds in the resultant change UTXO
         * @param depositTxs The deposit transactions with which the claiblable rewards are associated
         * @param claimableOwnerIDs The ownerIDs of the rewards to claim
         * @param claimedAmounts The amounts of the rewards to claim
         * @param claimTo The address to claimed rewards will be directed to
         * @param claimableSigners The signers of the claimable rewards
         *
         * @returns An unsigned transaction created from the passed in parameters.
         */
        this.buildClaimTx = (utxoset, fromAddresses, changeAddresses = undefined, memo = undefined, asOf = common_1.ZeroBN, changeThreshold = 1, depositTxs, claimableOwnerIDs, claimedAmounts, claimTo, claimableSigners = []) => __awaiter(this, void 0, void 0, function* () {
            const caller = "buildClaimTx";
            const fromSigner = this._parseFromSigner(fromAddresses, caller);
            const change = this._cleanAddressArrayBuffer(changeAddresses, caller);
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const avaxAssetID = yield this.getAVAXAssetID();
            const networkID = this.core.getNetworkID();
            const blockchainID = bintools.cb58Decode(this.blockchainID);
            const fee = this.getTxFee();
            const unsignedClaimTx = yield this._getBuilder(utxoset).buildClaimTx(networkID, blockchainID, fromSigner, change, fee, avaxAssetID, memo, asOf, changeThreshold, depositTxs, claimableOwnerIDs, claimedAmounts, claimTo, claimableSigners);
            if (!(yield this.checkGooseEgg(unsignedClaimTx, this.getCreationTxFee()))) {
                /* istanbul ignore next */
                throw new errors_2.GooseEggCheckError("Failed Goose Egg Check");
            }
            return unsignedClaimTx;
        });
        /**
         * @returns the current timestamp on chain.
         */
        this.getTimestamp = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("platform.getTimestamp");
            return response.data.result.timestamp;
        });
        /**
         * @returns the UTXOs that were rewarded after the provided transaction"s staking or delegation period ended.
         */
        this.getRewardUTXOs = (txID, encoding) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                txID,
                encoding
            };
            const response = yield this.callMethod("platform.getRewardUTXOs", params);
            return response.data.result;
        });
        /**
         * Get blockchains configuration (genesis)
         *
         * @returns Promise for an GetConfigurationResponse
         */
        this.getConfiguration = () => __awaiter(this, void 0, void 0, function* () {
            var _b, _c;
            const response = yield this.callMethod("platform.getConfiguration");
            const r = response.data.result;
            return {
                networkID: parseInt(r.networkID),
                assetID: r.assetID,
                assetSymbol: r.assetSymbol,
                hrp: r.hrp,
                blockchains: r.blockchains,
                minStakeDuration: new bn_js_1.default(r.minStakeDuration).div(NanoBN).toNumber(),
                maxStakeDuration: new bn_js_1.default(r.maxStakeDuration).div(NanoBN).toNumber(),
                minValidatorStake: new bn_js_1.default(r.minValidatorStake),
                maxValidatorStake: new bn_js_1.default(r.maxValidatorStake),
                minDelegationFee: new bn_js_1.default(r.minDelegationFee),
                minDelegatorStake: new bn_js_1.default(r.minDelegatorStake),
                minConsumptionRate: parseInt(r.minConsumptionRate) / rewardPercentDenom,
                maxConsumptionRate: parseInt(r.maxConsumptionRate) / rewardPercentDenom,
                supplyCap: new bn_js_1.default(r.supplyCap),
                verifyNodeSignature: (_b = r.verifyNodeSignature) !== null && _b !== void 0 ? _b : false,
                lockModeBondDeposit: (_c = r.lockModeBondDeposit) !== null && _c !== void 0 ? _c : false
            };
        });
        /**
         * Get blockchains configuration (genesis)
         *
         * @returns Promise for an GetConfigurationResponse
         */
        this.spend = (from, signer, to, toThreshold, toLockTime, change, changeThreshold, lockMode, amountToLock, amountToBurn, asOf, encoding) => __awaiter(this, void 0, void 0, function* () {
            if (!["Unlocked", "Deposit", "Bond"].includes(lockMode)) {
                throw new errors_1.ProtocolError("Error -- PlatformAPI.spend: invalid lockMode");
            }
            const params = {
                from,
                signer,
                to: to.length > 0
                    ? {
                        locktime: toLockTime.toString(10),
                        threshold: toThreshold,
                        addresses: to
                    }
                    : undefined,
                change: change.length > 0
                    ? { locktime: "0", threshold: changeThreshold, addresses: change }
                    : undefined,
                lockMode: lockMode === "Unlocked" ? 0 : lockMode === "Deposit" ? 1 : 2,
                amountToLock: amountToLock.toString(10),
                amountToBurn: amountToBurn.toString(10),
                asOf: asOf.toString(10),
                encoding: encoding !== null && encoding !== void 0 ? encoding : "hex"
            };
            const response = yield this.callMethod("platform.spend", params);
            const r = response.data.result;
            // We need to update signature index source here
            const ins = inputs_1.TransferableInput.fromArray(buffer_1.Buffer.from(r.ins.slice(2), "hex"));
            ins.forEach((e, idx) => e.getSigIdxs().forEach((s, sidx) => {
                s.setSource(bintools.cb58Decode(r.signers[`${idx}`][`${sidx}`]));
            }));
            return {
                ins,
                out: outputs_1.TransferableOutput.fromArray(buffer_1.Buffer.from(r.outs.slice(2), "hex")),
                owners: r.owners
                    ? common_1.OutputOwners.fromArray(buffer_1.Buffer.from(r.owners.slice(2), "hex"))
                    : []
            };
        });
        this._getBuilder = (utxoSet) => {
            if (this.core.getNetwork().P.lockModeBondDeposit) {
                return new builder_1.Builder(new spender_1.Spender(this), true);
            }
            return new builder_1.Builder(utxoSet, false);
        };
        if (core.getNetwork()) {
            this.blockchainID = core.getNetwork().P.blockchainID;
            this.keychain = new keychain_1.KeyChain(core.getHRP(), core.getNetwork().P.alias);
        }
    }
    /**
     * @ignore
     */
    _cleanAddressArray(addresses, caller) {
        const addrs = [];
        const chainid = this.getBlockchainAlias()
            ? this.getBlockchainAlias()
            : this.getBlockchainID();
        if (addresses && addresses.length > 0) {
            for (let i = 0; i < addresses.length; i++) {
                if (typeof addresses[`${i}`] === "string") {
                    if (typeof this.parseAddress(addresses[`${i}`]) ===
                        "undefined") {
                        /* istanbul ignore next */
                        throw new errors_2.AddressError(`Error - Invalid address format (${caller})`);
                    }
                    addrs.push(addresses[`${i}`]);
                }
                else {
                    const bech32 = "bech32";
                    addrs.push(serialization.bufferToType(addresses[`${i}`], bech32, this.core.getHRP(), chainid));
                }
            }
        }
        return addrs;
    }
    _cleanAddressArrayBuffer(addresses, caller) {
        return this._cleanAddressArray(addresses, caller).map((a) => {
            return typeof a === "undefined"
                ? undefined
                : bintools.stringToAddress(a);
        });
    }
    _parseFromSigner(from, caller) {
        if (from.length > 0) {
            if (typeof from[0] === "string")
                return {
                    from: this._cleanAddressArrayBuffer(from, caller),
                    signer: []
                };
            else
                return {
                    from: this._cleanAddressArrayBuffer(from[0], caller),
                    signer: from.length > 1
                        ? this._cleanAddressArrayBuffer(from[1], caller)
                        : []
                };
        }
        return { from: [], signer: [] };
    }
}
exports.PlatformVMAPI = PlatformVMAPI;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvcGxhdGZvcm12bS9hcGkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7OztHQUdHO0FBQ0gsb0NBQWdDO0FBQ2hDLGtEQUFzQjtBQUV0Qix5Q0FLcUI7QUFFckIsK0NBSTJCO0FBQzNCLG9FQUEyQztBQUMzQyx5Q0FBcUM7QUFDckMscURBQStDO0FBQy9DLDJDQUFpRDtBQUNqRCw2QkFBcUM7QUFDckMsaURBQWlEO0FBQ2pELGlFQUEyRTtBQUMzRSwrQ0FBbUQ7QUFFbkQsK0NBUTJCO0FBNkMzQixxQ0FBNEM7QUFDNUMsdUNBQThDO0FBQzlDLHVDQUEyRDtBQUUzRCx1Q0FBK0Q7QUFFL0QsdUNBQW1DO0FBRW5DOztHQUVHO0FBQ0gsTUFBTSxRQUFRLEdBQWEsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUNqRCxNQUFNLGFBQWEsR0FBa0IscUJBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUVoRSxNQUFNLE1BQU0sR0FBRyxJQUFJLGVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQTtBQUNqQyxNQUFNLGtCQUFrQixHQUFHLE9BQU8sQ0FBQTtBQUlsQzs7Ozs7O0dBTUc7QUFDSCxNQUFhLGFBQWMsU0FBUSxnQkFBTztJQWc1RXhDOzs7Ozs7T0FNRztJQUNILFlBQVksSUFBbUIsRUFBRSxVQUFrQixXQUFXO1FBQzVELEtBQUssQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUE7UUF2NUV0Qjs7V0FFRztRQUNPLGFBQVEsR0FBYSxJQUFJLG1CQUFRLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFBO1FBRXpDLGlCQUFZLEdBQVcsRUFBRSxDQUFBO1FBRXpCLG9CQUFlLEdBQVcsU0FBUyxDQUFBO1FBRW5DLGdCQUFXLEdBQVcsU0FBUyxDQUFBO1FBRS9CLFVBQUssR0FBTyxTQUFTLENBQUE7UUFFckIsa0JBQWEsR0FBTyxT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Q1gsQ0FBQTs7Z0JBRUQsT0FBTztvQkFDTCxJQUFJLEVBQUUsSUFBSSxDQUFDLHdCQUF3QixDQUFDLElBQUksQ0FBQyxDQUFDLENBQWEsRUFBRSxNQUFNLENBQUM7b0JBQ2hFLE1BQU0sRUFDSixJQUFJLENBQUMsTUFBTSxHQUFHLENBQUM7d0JBQ2IsQ0FBQyxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFhLEVBQUUsTUFBTSxDQUFDO3dCQUM1RCxDQUFDLENBQUMsRUFBRTtpQkFDVCxDQUFBO1NBQ0o7UUFDRCxPQUFPLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLENBQUE7SUFDakMsQ0FBQztDQW9KRjtBQWxpRkQsc0NBa2lGQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXG4gKiBAbW9kdWxlIEFQSS1QbGF0Zm9ybVZNXG4gKi9cbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCJidWZmZXIvXCJcbmltcG9ydCBCTiBmcm9tIFwiYm4uanNcIlxuaW1wb3J0IEF2YWxhbmNoZUNvcmUgZnJvbSBcIi4uLy4uL2NhbWlub1wiXG5pbXBvcnQge1xuICBKUlBDQVBJLFxuICBPdXRwdXRPd25lcnMsXG4gIFJlcXVlc3RSZXNwb25zZURhdGEsXG4gIFplcm9CTlxufSBmcm9tIFwiLi4vLi4vY29tbW9uXCJcblxuaW1wb3J0IHtcbiAgRXJyb3JSZXNwb25zZU9iamVjdCxcbiAgUHJvdG9jb2xFcnJvcixcbiAgVVRYT0Vycm9yXG59IGZyb20gXCIuLi8uLi91dGlscy9lcnJvcnNcIlxuaW1wb3J0IEJpblRvb2xzIGZyb20gXCIuLi8uLi91dGlscy9iaW50b29sc1wiXG5pbXBvcnQgeyBLZXlDaGFpbiB9IGZyb20gXCIuL2tleWNoYWluXCJcbmltcG9ydCB7IE9ORUFWQVggfSBmcm9tIFwiLi4vLi4vdXRpbHMvY29uc3RhbnRzXCJcbmltcG9ydCB7IFBsYXRmb3JtVk1Db25zdGFudHMgfSBmcm9tIFwiLi9jb25zdGFudHNcIlxuaW1wb3J0IHsgVW5zaWduZWRUeCwgVHggfSBmcm9tIFwiLi90eFwiXG5pbXBvcnQgeyBQYXlsb2FkQmFzZSB9IGZyb20gXCIuLi8uLi91dGlscy9wYXlsb2FkXCJcbmltcG9ydCB7IFVuaXhOb3csIE5vZGVJRFN0cmluZ1RvQnVmZmVyIH0gZnJvbSBcIi4uLy4uL3V0aWxzL2hlbHBlcmZ1bmN0aW9uc1wiXG5pbXBvcnQgeyBVVFhPLCBVVFhPU2V0IH0gZnJvbSBcIi4uL3BsYXRmb3Jtdm0vdXR4b3NcIlxuaW1wb3J0IHsgUGVyc2lzdGFuY2VPcHRpb25zIH0gZnJvbSBcIi4uLy4uL3V0aWxzL3BlcnNpc3RlbmNlb3B0aW9uc1wiXG5pbXBvcnQge1xuICBBZGRyZXNzRXJyb3IsXG4gIFRyYW5zYWN0aW9uRXJyb3IsXG4gIENoYWluSWRFcnJvcixcbiAgR29vc2VFZ2dDaGVja0Vycm9yLFxuICBUaW1lRXJyb3IsXG4gIFN0YWtlRXJyb3IsXG4gIERlbGVnYXRpb25GZWVFcnJvclxufSBmcm9tIFwiLi4vLi4vdXRpbHMvZXJyb3JzXCJcbmltcG9ydCB7XG4gIEFQSURlcG9zaXQsXG4gIEJhbGFuY2VEaWN0LFxuICBEZXBvc2l0T2ZmZXIsXG4gIEdldEN1cnJlbnRWYWxpZGF0b3JzUGFyYW1zLFxuICBHZXRQZW5kaW5nVmFsaWRhdG9yc1BhcmFtcyxcbiAgR2V0UmV3YXJkVVRYT3NQYXJhbXMsXG4gIEdldFJld2FyZFVUWE9zUmVzcG9uc2UsXG4gIEdldFN0YWtlUGFyYW1zLFxuICBHZXRTdGFrZVJlc3BvbnNlLFxuICBHZXRDb25maWd1cmF0aW9uUmVzcG9uc2UsXG4gIFN1Ym5ldCxcbiAgR2V0VmFsaWRhdG9yc0F0UGFyYW1zLFxuICBHZXRWYWxpZGF0b3JzQXRSZXNwb25zZSxcbiAgQ3JlYXRlQWRkcmVzc1BhcmFtcyxcbiAgR2V0VVRYT3NQYXJhbXMsXG4gIEdldEJhbGFuY2VSZXNwb25zZSxcbiAgR2V0VVRYT3NSZXNwb25zZSxcbiAgTGlzdEFkZHJlc3Nlc1BhcmFtcyxcbiAgU2FtcGxlVmFsaWRhdG9yc1BhcmFtcyxcbiAgQWRkVmFsaWRhdG9yUGFyYW1zLFxuICBBZGREZWxlZ2F0b3JQYXJhbXMsXG4gIENyZWF0ZVN1Ym5ldFBhcmFtcyxcbiAgRXhwb3J0QVZBWFBhcmFtcyxcbiAgRXhwb3J0S2V5UGFyYW1zLFxuICBJbXBvcnRLZXlQYXJhbXMsXG4gIEltcG9ydEFWQVhQYXJhbXMsXG4gIENyZWF0ZUJsb2NrY2hhaW5QYXJhbXMsXG4gIEJsb2NrY2hhaW4sXG4gIEdldFR4U3RhdHVzUGFyYW1zLFxuICBHZXRUeFN0YXR1c1Jlc3BvbnNlLFxuICBHZXRNaW5TdGFrZVJlc3BvbnNlLFxuICBHZXRNYXhTdGFrZUFtb3VudFBhcmFtcyxcbiAgU3BlbmRQYXJhbXMsXG4gIFNwZW5kUmVwbHksXG4gIEFkZHJlc3NQYXJhbXMsXG4gIE11bHRpc2lnQWxpYXNSZXBseSxcbiAgR2V0Q2xhaW1hYmxlc1BhcmFtcyxcbiAgR2V0Q2xhaW1hYmxlc1Jlc3BvbnNlLFxuICBHZXRBbGxEZXBvc2l0T2ZmZXJzUGFyYW1zLFxuICBHZXRBbGxEZXBvc2l0T2ZmZXJzUmVzcG9uc2UsXG4gIEdldERlcG9zaXRzUGFyYW1zLFxuICBHZXREZXBvc2l0c1Jlc3BvbnNlXG59IGZyb20gXCIuL2ludGVyZmFjZXNcIlxuaW1wb3J0IHsgVHJhbnNmZXJhYmxlSW5wdXQgfSBmcm9tIFwiLi9pbnB1dHNcIlxuaW1wb3J0IHsgVHJhbnNmZXJhYmxlT3V0cHV0IH0gZnJvbSBcIi4vb3V0cHV0c1wiXG5pbXBvcnQgeyBTZXJpYWxpemF0aW9uLCBTZXJpYWxpemVkVHlwZSB9IGZyb20gXCIuLi8uLi91dGlsc1wiXG5pbXBvcnQgeyBHZW5lc2lzRGF0YSB9IGZyb20gXCIuLi9hdm1cIlxuaW1wb3J0IHsgQXV0aCwgTG9ja01vZGUsIEJ1aWxkZXIsIEZyb21TaWduZXIgfSBmcm9tIFwiLi9idWlsZGVyXCJcbmltcG9ydCB7IE5ldHdvcmsgfSBmcm9tIFwiLi4vLi4vdXRpbHMvbmV0d29ya3NcIlxuaW1wb3J0IHsgU3BlbmRlciB9IGZyb20gXCIuL3NwZW5kZXJcIlxuXG4vKipcbiAqIEBpZ25vcmVcbiAqL1xuY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKVxuY29uc3Qgc2VyaWFsaXphdGlvbjogU2VyaWFsaXphdGlvbiA9IFNlcmlhbGl6YXRpb24uZ2V0SW5zdGFuY2UoKVxuXG5jb25zdCBOYW5vQk4gPSBuZXcgQk4oMTAwMDAwMDAwMClcbmNvbnN0IHJld2FyZFBlcmNlbnREZW5vbSA9IDEwMDAwMDBcblxudHlwZSBGcm9tVHlwZSA9IFN0cmluZ1tdIHwgU3RyaW5nW11bXVxuXG4vKipcbiAqIENsYXNzIGZvciBpbnRlcmFjdGluZyB3aXRoIGEgbm9kZSdzIFBsYXRmb3JtVk1BUElcbiAqXG4gKiBAY2F0ZWdvcnkgUlBDQVBJc1xuICpcbiAqIEByZW1hcmtzIFRoaXMgZXh0ZW5kcyB0aGUgW1tKUlBDQVBJXV0gY2xhc3MuIFRoaXMgY2xhc3Mgc2hvdWxkIG5vdCBiZSBkaXJlY3RseSBjYWxsZWQuIEluc3RlYWQsIHVzZSB0aGUgW1tBdmFsYW5jaGUuYWRkQVBJXV0gZnVuY3Rpb24gdG8gcmVnaXN0ZXIgdGhpcyBpbnRlcmZhY2Ugd2l0aCBBdmFsYW5jaGUuXG4gKi9cbmV4cG9ydCBjbGFzcyBQbGF0Zm9ybVZNQVBJIGV4dGVuZHMgSlJQQ0FQSSB7XG4gIC8qKlxuICAgKiBAaWdub3JlXG4gICAqL1xuICBwcm90ZWN0ZWQga2V5Y2hhaW46IEtleUNoYWluID0gbmV3IEtleUNoYWluKFwiXCIsIFwiXCIpXG5cbiAgcHJvdGVjdGVkIGJsb2NrY2hhaW5JRDogc3RyaW5nID0gXCJcIlxuXG4gIHByb3RlY3RlZCBibG9ja2NoYWluQWxpYXM6IHN0cmluZyA9IHVuZGVmaW5lZFxuXG4gIHByb3RlY3RlZCBBVkFYQXNzZXRJRDogQnVmZmVyID0gdW5kZWZpbmVkXG5cbiAgcHJvdGVjdGVkIHR4RmVlOiBCTiA9IHVuZGVmaW5lZFxuXG4gIHByb3RlY3RlZCBjcmVhdGlvblR4RmVlOiBCTiA9IHVuZGVmaW5lZFxuXG4gIHByb3RlY3RlZCBtaW5WYWxpZGF0b3JTdGFrZTogQk4gPSB1bmRlZmluZWRcblxuICBwcm90ZWN0ZWQgbWluRGVsZWdhdG9yU3Rha2U6IEJOID0gdW5kZWZpbmVkXG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGFsaWFzIGZvciB0aGUgYmxvY2tjaGFpbklEIGlmIGl0IGV4aXN0cywgb3RoZXJ3aXNlIHJldHVybnMgYHVuZGVmaW5lZGAuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBhbGlhcyBmb3IgdGhlIGJsb2NrY2hhaW5JRFxuICAgKi9cbiAgZ2V0QmxvY2tjaGFpbkFsaWFzID0gKCk6IHN0cmluZyA9PiB7XG4gICAgcmV0dXJuIHRoaXMuY29yZS5nZXROZXR3b3JrKCkuUC5hbGlhc1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnQgbmV0d29yaywgZmV0Y2hlZCB2aWEgYXZhbGFuY2hlLmZldGNoTmV0d29ya1NldHRpbmdzLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgY3VycmVudCBOZXR3b3JrXG4gICAqL1xuICBnZXROZXR3b3JrID0gKCk6IE5ldHdvcmsgPT4ge1xuICAgIHJldHVybiB0aGlzLmNvcmUuZ2V0TmV0d29yaygpXG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgYmxvY2tjaGFpbklEIGFuZCByZXR1cm5zIGl0LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgYmxvY2tjaGFpbklEXG4gICAqL1xuICBnZXRCbG9ja2NoYWluSUQgPSAoKTogc3RyaW5nID0+IHRoaXMuYmxvY2tjaGFpbklEXG5cbiAgLyoqXG4gICAqIFRha2VzIGFuIGFkZHJlc3Mgc3RyaW5nIGFuZCByZXR1cm5zIGl0cyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRhdGlvbiBpZiB2YWxpZC5cbiAgICpcbiAgICogQHJldHVybnMgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBmb3IgdGhlIGFkZHJlc3MgaWYgdmFsaWQsIHVuZGVmaW5lZCBpZiBub3QgdmFsaWQuXG4gICAqL1xuICBwYXJzZUFkZHJlc3MgPSAoYWRkcjogc3RyaW5nKTogQnVmZmVyID0+IHtcbiAgICBjb25zdCBhbGlhczogc3RyaW5nID0gdGhpcy5nZXRCbG9ja2NoYWluQWxpYXMoKVxuICAgIGNvbnN0IGJsb2NrY2hhaW5JRDogc3RyaW5nID0gdGhpcy5nZXRCbG9ja2NoYWluSUQoKVxuICAgIHJldHVybiBiaW50b29scy5wYXJzZUFkZHJlc3MoXG4gICAgICBhZGRyLFxuICAgICAgYmxvY2tjaGFpbklELFxuICAgICAgYWxpYXMsXG4gICAgICBQbGF0Zm9ybVZNQ29uc3RhbnRzLkFERFJFU1NMRU5HVEhcbiAgICApXG4gIH1cblxuICBhZGRyZXNzRnJvbUJ1ZmZlciA9IChhZGRyZXNzOiBCdWZmZXIpOiBzdHJpbmcgPT4ge1xuICAgIGNvbnN0IGNoYWluaWQ6IHN0cmluZyA9IHRoaXMuZ2V0QmxvY2tjaGFpbkFsaWFzKClcbiAgICAgID8gdGhpcy5nZXRCbG9ja2NoYWluQWxpYXMoKVxuICAgICAgOiB0aGlzLmdldEJsb2NrY2hhaW5JRCgpXG4gICAgY29uc3QgdHlwZTogU2VyaWFsaXplZFR5cGUgPSBcImJlY2gzMlwiXG4gICAgcmV0dXJuIHNlcmlhbGl6YXRpb24uYnVmZmVyVG9UeXBlKFxuICAgICAgYWRkcmVzcyxcbiAgICAgIHR5cGUsXG4gICAgICB0aGlzLmNvcmUuZ2V0SFJQKCksXG4gICAgICBjaGFpbmlkXG4gICAgKVxuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoZXMgdGhlIEFWQVggQXNzZXRJRCBhbmQgcmV0dXJucyBpdCBpbiBhIFByb21pc2UuXG4gICAqXG4gICAqIEBwYXJhbSByZWZyZXNoIFRoaXMgZnVuY3Rpb24gY2FjaGVzIHRoZSByZXNwb25zZS4gUmVmcmVzaCA9IHRydWUgd2lsbCBidXN0IHRoZSBjYWNoZS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHRoZSBwcm92aWRlZCBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBBVkFYIEFzc2V0SURcbiAgICovXG4gIGdldEFWQVhBc3NldElEID0gYXN5bmMgKHJlZnJlc2g6IGJvb2xlYW4gPSBmYWxzZSk6IFByb21pc2U8QnVmZmVyPiA9PiB7XG4gICAgaWYgKHR5cGVvZiB0aGlzLkFWQVhBc3NldElEID09PSBcInVuZGVmaW5lZFwiIHx8IHJlZnJlc2gpIHtcbiAgICAgIHRoaXMuQVZBWEFzc2V0SUQgPSBiaW50b29scy5jYjU4RGVjb2RlKFxuICAgICAgICB0aGlzLmNvcmUuZ2V0TmV0d29yaygpLlguYXZheEFzc2V0SURcbiAgICAgIClcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuQVZBWEFzc2V0SURcbiAgfVxuXG4gIC8qKlxuICAgKiBPdmVycmlkZXMgdGhlIGRlZmF1bHRzIGFuZCBzZXRzIHRoZSBjYWNoZSB0byBhIHNwZWNpZmljIEFWQVggQXNzZXRJRFxuICAgKlxuICAgKiBAcGFyYW0gYXZheEFzc2V0SUQgQSBjYjU4IHN0cmluZyBvciBCdWZmZXIgcmVwcmVzZW50aW5nIHRoZSBBVkFYIEFzc2V0SURcbiAgICpcbiAgICogQHJldHVybnMgVGhlIHRoZSBwcm92aWRlZCBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBBVkFYIEFzc2V0SURcbiAgICovXG4gIHNldEFWQVhBc3NldElEID0gKGF2YXhBc3NldElEOiBzdHJpbmcgfCBCdWZmZXIpID0+IHtcbiAgICBpZiAodHlwZW9mIGF2YXhBc3NldElEID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBhdmF4QXNzZXRJRCA9IGJpbnRvb2xzLmNiNThEZWNvZGUoYXZheEFzc2V0SUQpXG4gICAgfVxuICAgIHRoaXMuQVZBWEFzc2V0SUQgPSBhdmF4QXNzZXRJRFxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGRlZmF1bHQgdHggZmVlIGZvciB0aGlzIGNoYWluLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgZGVmYXVsdCB0eCBmZWUgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKi9cbiAgZ2V0RGVmYXVsdFR4RmVlID0gKCk6IEJOID0+IHtcbiAgICByZXR1cm4gbmV3IEJOKHRoaXMuY29yZS5nZXROZXR3b3JrKCkuUC50eEZlZSlcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB0eCBmZWUgZm9yIHRoaXMgY2hhaW4uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSB0eCBmZWUgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKi9cbiAgZ2V0VHhGZWUgPSAoKTogQk4gPT4ge1xuICAgIGlmICh0eXBlb2YgdGhpcy50eEZlZSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhpcy50eEZlZSA9IHRoaXMuZ2V0RGVmYXVsdFR4RmVlKClcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMudHhGZWVcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBDcmVhdGVTdWJuZXRUeCBmZWUuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBDcmVhdGVTdWJuZXRUeCBmZWUgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKi9cbiAgZ2V0Q3JlYXRlU3VibmV0VHhGZWUgPSAoKTogQk4gPT4ge1xuICAgIHJldHVybiBuZXcgQk4odGhpcy5jb3JlLmdldE5ldHdvcmsoKS5QLmNyZWF0ZVN1Ym5ldFR4ID8/IDApXG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgQ3JlYXRlQ2hhaW5UeCBmZWUuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBDcmVhdGVDaGFpblR4IGZlZSBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqL1xuICBnZXRDcmVhdGVDaGFpblR4RmVlID0gKCk6IEJOID0+IHtcbiAgICByZXR1cm4gbmV3IEJOKHRoaXMuY29yZS5nZXROZXR3b3JrKCkuUC5jcmVhdGVDaGFpblR4ID8/IDApXG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdHggZmVlIGZvciB0aGlzIGNoYWluLlxuICAgKlxuICAgKiBAcGFyYW0gZmVlIFRoZSB0eCBmZWUgYW1vdW50IHRvIHNldCBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKi9cbiAgc2V0VHhGZWUgPSAoZmVlOiBCTikgPT4ge1xuICAgIHRoaXMudHhGZWUgPSBmZWVcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBkZWZhdWx0IGNyZWF0aW9uIGZlZSBmb3IgdGhpcyBjaGFpbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGRlZmF1bHQgY3JlYXRpb24gZmVlIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICovXG4gIGdldERlZmF1bHRDcmVhdGlvblR4RmVlID0gKCk6IEJOID0+IHtcbiAgICByZXR1cm4gbmV3IEJOKHRoaXMuY29yZS5nZXROZXR3b3JrKCkuUC5jcmVhdGlvblR4RmVlKVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGNyZWF0aW9uIGZlZSBmb3IgdGhpcyBjaGFpbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGNyZWF0aW9uIGZlZSBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqL1xuICBnZXRDcmVhdGlvblR4RmVlID0gKCk6IEJOID0+IHtcbiAgICBpZiAodHlwZW9mIHRoaXMuY3JlYXRpb25UeEZlZSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhpcy5jcmVhdGlvblR4RmVlID0gdGhpcy5nZXREZWZhdWx0Q3JlYXRpb25UeEZlZSgpXG4gICAgfVxuICAgIHJldHVybiB0aGlzLmNyZWF0aW9uVHhGZWVcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBjcmVhdGlvbiBmZWUgZm9yIHRoaXMgY2hhaW4uXG4gICAqXG4gICAqIEBwYXJhbSBmZWUgVGhlIGNyZWF0aW9uIGZlZSBhbW91bnQgdG8gc2V0IGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqL1xuICBzZXRDcmVhdGlvblR4RmVlID0gKGZlZTogQk4pID0+IHtcbiAgICB0aGlzLmNyZWF0aW9uVHhGZWUgPSBmZWVcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGEgcmVmZXJlbmNlIHRvIHRoZSBrZXljaGFpbiBmb3IgdGhpcyBjbGFzcy5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGluc3RhbmNlIG9mIFtbXV0gZm9yIHRoaXMgY2xhc3NcbiAgICovXG4gIGtleUNoYWluID0gKCk6IEtleUNoYWluID0+IHRoaXMua2V5Y2hhaW5cblxuICAvKipcbiAgICogQGlnbm9yZVxuICAgKi9cbiAgbmV3S2V5Q2hhaW4gPSAoKTogS2V5Q2hhaW4gPT4ge1xuICAgIC8vIHdhcm5pbmcsIG92ZXJ3cml0ZXMgdGhlIG9sZCBrZXljaGFpblxuICAgIGNvbnN0IGFsaWFzID0gdGhpcy5nZXRCbG9ja2NoYWluQWxpYXMoKVxuICAgIGlmIChhbGlhcykge1xuICAgICAgdGhpcy5rZXljaGFpbiA9IG5ldyBLZXlDaGFpbih0aGlzLmNvcmUuZ2V0SFJQKCksIGFsaWFzKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmtleWNoYWluID0gbmV3IEtleUNoYWluKHRoaXMuY29yZS5nZXRIUlAoKSwgdGhpcy5ibG9ja2NoYWluSUQpXG4gICAgfVxuICAgIHJldHVybiB0aGlzLmtleWNoYWluXG4gIH1cblxuICAvKipcbiAgICogSGVscGVyIGZ1bmN0aW9uIHdoaWNoIGRldGVybWluZXMgaWYgYSB0eCBpcyBhIGdvb3NlIGVnZyB0cmFuc2FjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHV0eCBBbiBVbnNpZ25lZFR4XG4gICAqXG4gICAqIEByZXR1cm5zIGJvb2xlYW4gdHJ1ZSBpZiBwYXNzZXMgZ29vc2UgZWdnIHRlc3QgYW5kIGZhbHNlIGlmIGZhaWxzLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBBIFwiR29vc2UgRWdnIFRyYW5zYWN0aW9uXCIgaXMgd2hlbiB0aGUgZmVlIGZhciBleGNlZWRzIGEgcmVhc29uYWJsZSBhbW91bnRcbiAgICovXG4gIGNoZWNrR29vc2VFZ2cgPSBhc3luYyAoXG4gICAgdXR4OiBVbnNpZ25lZFR4LFxuICAgIG91dFRvdGFsOiBCTiA9IFplcm9CTlxuICApOiBQcm9taXNlPGJvb2xlYW4+ID0+IHtcbiAgICBjb25zdCBhdmF4QXNzZXRJRDogQnVmZmVyID0gYXdhaXQgdGhpcy5nZXRBVkFYQXNzZXRJRCgpXG4gICAgbGV0IG91dHB1dFRvdGFsOiBCTiA9IG91dFRvdGFsLmd0KFplcm9CTilcbiAgICAgID8gb3V0VG90YWxcbiAgICAgIDogdXR4LmdldE91dHB1dFRvdGFsKGF2YXhBc3NldElEKVxuICAgIGNvbnN0IGZlZTogQk4gPSB1dHguZ2V0QnVybihhdmF4QXNzZXRJRClcbiAgICBpZiAoZmVlLmx0ZShPTkVBVkFYLm11bChuZXcgQk4oMTApKSkgfHwgZmVlLmx0ZShvdXRwdXRUb3RhbCkpIHtcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgYW4gYXNzZXRJRCBmb3IgYSBzdWJuZXRcInMgc3Rha2luZyBhc3NzZXQuXG4gICAqXG4gICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlIHN0cmluZyB3aXRoIGNiNTggZW5jb2RlZCB2YWx1ZSBvZiB0aGUgYXNzZXRJRC5cbiAgICovXG4gIGdldFN0YWtpbmdBc3NldElEID0gYXN5bmMgKCk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmdldFN0YWtpbmdBc3NldElEXCJcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LmFzc2V0SURcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGJsb2NrY2hhaW4uXG4gICAqXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgdXNlcm5hbWUgb2YgdGhlIEtleXN0b3JlIHVzZXIgdGhhdCBjb250cm9scyB0aGUgbmV3IGFjY291bnRcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCBvZiB0aGUgS2V5c3RvcmUgdXNlciB0aGF0IGNvbnRyb2xzIHRoZSBuZXcgYWNjb3VudFxuICAgKiBAcGFyYW0gc3VibmV0SUQgT3B0aW9uYWwuIEVpdGhlciBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9yIGFuIGNiNTggc2VyaWFsaXplZCBzdHJpbmcgZm9yIHRoZSBTdWJuZXRJRCBvciBpdHMgYWxpYXMuXG4gICAqIEBwYXJhbSB2bUlEIFRoZSBJRCBvZiB0aGUgVmlydHVhbCBNYWNoaW5lIHRoZSBibG9ja2NoYWluIHJ1bnMuIENhbiBhbHNvIGJlIGFuIGFsaWFzIG9mIHRoZSBWaXJ0dWFsIE1hY2hpbmUuXG4gICAqIEBwYXJhbSBmeElEcyBUaGUgaWRzIG9mIHRoZSBGWHMgdGhlIFZNIGlzIHJ1bm5pbmcuXG4gICAqIEBwYXJhbSBuYW1lIEEgaHVtYW4tcmVhZGFibGUgbmFtZSBmb3IgdGhlIG5ldyBibG9ja2NoYWluXG4gICAqIEBwYXJhbSBnZW5lc2lzIFRoZSBiYXNlIDU4ICh3aXRoIGNoZWNrc3VtKSByZXByZXNlbnRhdGlvbiBvZiB0aGUgZ2VuZXNpcyBzdGF0ZSBvZiB0aGUgbmV3IGJsb2NrY2hhaW4uIFZpcnR1YWwgTWFjaGluZXMgc2hvdWxkIGhhdmUgYSBzdGF0aWMgQVBJIG1ldGhvZCBuYW1lZCBidWlsZEdlbmVzaXMgdGhhdCBjYW4gYmUgdXNlZCB0byBnZW5lcmF0ZSBnZW5lc2lzRGF0YS5cbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgdGhlIHVuc2lnbmVkIHRyYW5zYWN0aW9uIHRvIGNyZWF0ZSB0aGlzIGJsb2NrY2hhaW4uIE11c3QgYmUgc2lnbmVkIGJ5IGEgc3VmZmljaWVudCBudW1iZXIgb2YgdGhlIFN1Ym5ldOKAmXMgY29udHJvbCBrZXlzIGFuZCBieSB0aGUgYWNjb3VudCBwYXlpbmcgdGhlIHRyYW5zYWN0aW9uIGZlZS5cbiAgICovXG4gIGNyZWF0ZUJsb2NrY2hhaW4gPSBhc3luYyAoXG4gICAgdXNlcm5hbWU6IHN0cmluZyxcbiAgICBwYXNzd29yZDogc3RyaW5nLFxuICAgIHN1Ym5ldElEOiBCdWZmZXIgfCBzdHJpbmcgPSB1bmRlZmluZWQsXG4gICAgdm1JRDogc3RyaW5nLFxuICAgIGZ4SURzOiBudW1iZXJbXSxcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgZ2VuZXNpczogc3RyaW5nXG4gICk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBDcmVhdGVCbG9ja2NoYWluUGFyYW1zID0ge1xuICAgICAgdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZCxcbiAgICAgIGZ4SURzLFxuICAgICAgdm1JRCxcbiAgICAgIG5hbWUsXG4gICAgICBnZW5lc2lzRGF0YTogZ2VuZXNpc1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHN1Ym5ldElEID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBwYXJhbXMuc3VibmV0SUQgPSBzdWJuZXRJRFxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHN1Ym5ldElEICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBwYXJhbXMuc3VibmV0SUQgPSBiaW50b29scy5jYjU4RW5jb2RlKHN1Ym5ldElEKVxuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uY3JlYXRlQmxvY2tjaGFpblwiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC50eElEXG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgc3RhdHVzIG9mIGEgYmxvY2tjaGFpbi5cbiAgICpcbiAgICogQHBhcmFtIGJsb2NrY2hhaW5JRCBUaGUgYmxvY2tjaGFpbklEIHJlcXVlc3RpbmcgYSBzdGF0dXMgdXBkYXRlXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGEgc3RyaW5nIG9mIG9uZSBvZjogXCJWYWxpZGF0aW5nXCIsIFwiQ3JlYXRlZFwiLCBcIlByZWZlcnJlZFwiLCBcIlVua25vd25cIi5cbiAgICovXG4gIGdldEJsb2NrY2hhaW5TdGF0dXMgPSBhc3luYyAoYmxvY2tjaGFpbklEOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogYW55ID0ge1xuICAgICAgYmxvY2tjaGFpbklEXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5nZXRCbG9ja2NoYWluU3RhdHVzXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnN0YXR1c1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgdmFsaWRhdG9ycyBhbmQgdGhlaXIgd2VpZ2h0cyBvZiBhIHN1Ym5ldCBvciB0aGUgUHJpbWFyeSBOZXR3b3JrIGF0IGEgZ2l2ZW4gUC1DaGFpbiBoZWlnaHQuXG4gICAqXG4gICAqIEBwYXJhbSBoZWlnaHQgVGhlIFAtQ2hhaW4gaGVpZ2h0IHRvIGdldCB0aGUgdmFsaWRhdG9yIHNldCBhdC5cbiAgICogQHBhcmFtIHN1Ym5ldElEIE9wdGlvbmFsLiBBIGNiNTggc2VyaWFsaXplZCBzdHJpbmcgZm9yIHRoZSBTdWJuZXRJRCBvciBpdHMgYWxpYXMuXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgR2V0VmFsaWRhdG9yc0F0UmVzcG9uc2VcbiAgICovXG4gIGdldFZhbGlkYXRvcnNBdCA9IGFzeW5jIChcbiAgICBoZWlnaHQ6IG51bWJlcixcbiAgICBzdWJuZXRJRD86IHN0cmluZ1xuICApOiBQcm9taXNlPEdldFZhbGlkYXRvcnNBdFJlc3BvbnNlPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBHZXRWYWxpZGF0b3JzQXRQYXJhbXMgPSB7XG4gICAgICBoZWlnaHRcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBzdWJuZXRJRCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgcGFyYW1zLnN1Ym5ldElEID0gc3VibmV0SURcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmdldFZhbGlkYXRvcnNBdFwiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdFxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhbiBhZGRyZXNzIGluIHRoZSBub2RlJ3Mga2V5c3RvcmUuXG4gICAqXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgdXNlcm5hbWUgb2YgdGhlIEtleXN0b3JlIHVzZXIgdGhhdCBjb250cm9scyB0aGUgbmV3IGFjY291bnRcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCBvZiB0aGUgS2V5c3RvcmUgdXNlciB0aGF0IGNvbnRyb2xzIHRoZSBuZXcgYWNjb3VudFxuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhIHN0cmluZyBvZiB0aGUgbmV3bHkgY3JlYXRlZCBhY2NvdW50IGFkZHJlc3MuXG4gICAqL1xuICBjcmVhdGVBZGRyZXNzID0gYXN5bmMgKFxuICAgIHVzZXJuYW1lOiBzdHJpbmcsXG4gICAgcGFzc3dvcmQ6IHN0cmluZ1xuICApOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogQ3JlYXRlQWRkcmVzc1BhcmFtcyA9IHtcbiAgICAgIHVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmRcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmNyZWF0ZUFkZHJlc3NcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuYWRkcmVzc1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGJhbGFuY2Ugb2YgYSBwYXJ0aWN1bGFyIGFzc2V0LlxuICAgKlxuICAgKiBAcGFyYW0gYWRkcmVzcyBUaGUgYWRkcmVzcyB0byBwdWxsIHRoZSBhc3NldCBiYWxhbmNlIGZyb21cbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSB3aXRoIHRoZSBiYWxhbmNlIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0gb24gdGhlIHByb3ZpZGVkIGFkZHJlc3MuXG4gICAqL1xuICBnZXRCYWxhbmNlID0gYXN5bmMgKHBhcmFtczoge1xuICAgIGFkZHJlc3M/OiBzdHJpbmdcbiAgICBhZGRyZXNzZXM/OiBzdHJpbmdbXVxuICB9KTogUHJvbWlzZTxHZXRCYWxhbmNlUmVzcG9uc2U+ID0+IHtcbiAgICBpZiAoXG4gICAgICBwYXJhbXMuYWRkcmVzcyAmJlxuICAgICAgdHlwZW9mIHRoaXMucGFyc2VBZGRyZXNzKHBhcmFtcy5hZGRyZXNzKSA9PT0gXCJ1bmRlZmluZWRcIlxuICAgICkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBBZGRyZXNzRXJyb3IoXG4gICAgICAgIFwiRXJyb3IgLSBQbGF0Zm9ybVZNQVBJLmdldEJhbGFuY2U6IEludmFsaWQgYWRkcmVzcyBmb3JtYXRcIlxuICAgICAgKVxuICAgIH1cbiAgICBwYXJhbXMuYWRkcmVzc2VzPy5mb3JFYWNoKChhZGRyZXNzKSA9PiB7XG4gICAgICBpZiAodHlwZW9mIHRoaXMucGFyc2VBZGRyZXNzKGFkZHJlc3MpID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICAgIHRocm93IG5ldyBBZGRyZXNzRXJyb3IoXG4gICAgICAgICAgXCJFcnJvciAtIFBsYXRmb3JtVk1BUEkuZ2V0QmFsYW5jZTogSW52YWxpZCBhZGRyZXNzIGZvcm1hdFwiXG4gICAgICAgIClcbiAgICAgIH1cbiAgICB9KVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5nZXRCYWxhbmNlXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG5cbiAgICBjb25zdCByZXN1bHQgPSByZXNwb25zZS5kYXRhLnJlc3VsdFxuXG4gICAgY29uc3QgcGFyc2VEaWN0ID0gKGlucHV0OiBhbnlbXSk6IEJhbGFuY2VEaWN0ID0+IHtcbiAgICAgIGxldCBkaWN0OiBCYWxhbmNlRGljdCA9IHt9XG4gICAgICBmb3IgKGNvbnN0IFtrLCB2XSBvZiBPYmplY3QuZW50cmllcyhpbnB1dCkpIGRpY3Rba10gPSBuZXcgQk4odilcbiAgICAgIHJldHVybiBkaWN0IGFzIEJhbGFuY2VEaWN0XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuY29yZS5nZXROZXR3b3JrKCkuUC5sb2NrTW9kZUJvbmREZXBvc2l0KSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBiYWxhbmNlczogcGFyc2VEaWN0KHJlc3VsdC5iYWxhbmNlcyksXG4gICAgICAgIHVubG9ja2VkT3V0cHV0czogcGFyc2VEaWN0KHJlc3VsdC51bmxvY2tlZE91dHB1dHMpLFxuICAgICAgICBib25kZWRPdXRwdXRzOiBwYXJzZURpY3QocmVzdWx0LmJvbmRlZE91dHB1dHMpLFxuICAgICAgICBkZXBvc2l0ZWRPdXRwdXRzOiBwYXJzZURpY3QocmVzdWx0LmRlcG9zaXRlZE91dHB1dHMpLFxuICAgICAgICBib25kZWREZXBvc2l0ZWRPdXRwdXRzOiBwYXJzZURpY3QocmVzdWx0LmJvbmRlZERlcG9zaXRlZE91dHB1dHMpLFxuICAgICAgICB1dHhvSURzOiByZXN1bHQudXR4b0lEc1xuICAgICAgfSBhcyBHZXRCYWxhbmNlUmVzcG9uc2VcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIGJhbGFuY2U6IG5ldyBCTihyZXN1bHQuYmFsYW5jZSksXG4gICAgICB1bmxvY2tlZDogbmV3IEJOKHJlc3VsdC51bmxvY2tlZCksXG4gICAgICBsb2NrZWRTdGFrZWFibGU6IG5ldyBCTihyZXN1bHQubG9ja2VkU3Rha2VhYmxlKSxcbiAgICAgIGxvY2tlZE5vdFN0YWtlYWJsZTogbmV3IEJOKHJlc3VsdC5sb2NrZWROb3RTdGFrZWFibGUpLFxuICAgICAgdXR4b0lEczogcmVzdWx0LnV0eG9JRHNcbiAgICB9IGFzIEdldEJhbGFuY2VSZXNwb25zZVxuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgdGhlIGFkZHJlc3NlcyBjb250cm9sbGVkIGJ5IHRoZSB1c2VyLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIHVzZXJuYW1lIG9mIHRoZSBLZXlzdG9yZSB1c2VyXG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgb2YgdGhlIEtleXN0b3JlIHVzZXJcbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYW4gYXJyYXkgb2YgYWRkcmVzc2VzLlxuICAgKi9cbiAgbGlzdEFkZHJlc3NlcyA9IGFzeW5jIChcbiAgICB1c2VybmFtZTogc3RyaW5nLFxuICAgIHBhc3N3b3JkOiBzdHJpbmdcbiAgKTogUHJvbWlzZTxzdHJpbmdbXT4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogTGlzdEFkZHJlc3Nlc1BhcmFtcyA9IHtcbiAgICAgIHVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmRcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmxpc3RBZGRyZXNzZXNcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuYWRkcmVzc2VzXG4gIH1cblxuICAvKipcbiAgICogTGlzdHMgdGhlIHNldCBvZiBjdXJyZW50IHZhbGlkYXRvcnMuXG4gICAqXG4gICAqIEBwYXJhbSBzdWJuZXRJRCBPcHRpb25hbC4gRWl0aGVyIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gb3IgYW5cbiAgICogY2I1OCBzZXJpYWxpemVkIHN0cmluZyBmb3IgdGhlIFN1Ym5ldElEIG9yIGl0cyBhbGlhcy5cbiAgICogQHBhcmFtIG5vZGVJRHMgT3B0aW9uYWwuIEFuIGFycmF5IG9mIHN0cmluZ3NcbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYW4gYXJyYXkgb2YgdmFsaWRhdG9ycyB0aGF0IGFyZSBjdXJyZW50bHkgc3Rha2luZywgc2VlOiB7QGxpbmsgaHR0cHM6Ly9kb2NzLmF2YXgubmV0d29yay92MS4wL2VuL2FwaS9wbGF0Zm9ybS8jcGxhdGZvcm1nZXRjdXJyZW50dmFsaWRhdG9yc3xwbGF0Zm9ybS5nZXRDdXJyZW50VmFsaWRhdG9ycyBkb2N1bWVudGF0aW9ufS5cbiAgICpcbiAgICovXG4gIGdldEN1cnJlbnRWYWxpZGF0b3JzID0gYXN5bmMgKFxuICAgIHN1Ym5ldElEOiBCdWZmZXIgfCBzdHJpbmcgPSB1bmRlZmluZWQsXG4gICAgbm9kZUlEczogc3RyaW5nW10gPSB1bmRlZmluZWRcbiAgKTogUHJvbWlzZTxvYmplY3Q+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IEdldEN1cnJlbnRWYWxpZGF0b3JzUGFyYW1zID0ge31cbiAgICBpZiAodHlwZW9mIHN1Ym5ldElEID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBwYXJhbXMuc3VibmV0SUQgPSBzdWJuZXRJRFxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHN1Ym5ldElEICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBwYXJhbXMuc3VibmV0SUQgPSBiaW50b29scy5jYjU4RW5jb2RlKHN1Ym5ldElEKVxuICAgIH1cbiAgICBpZiAodHlwZW9mIG5vZGVJRHMgIT0gXCJ1bmRlZmluZWRcIiAmJiBub2RlSURzLmxlbmd0aCA+IDApIHtcbiAgICAgIHBhcmFtcy5ub2RlSURzID0gbm9kZUlEc1xuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uZ2V0Q3VycmVudFZhbGlkYXRvcnNcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHRcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHJlcXVlc3QgdGhhdCBpbiBhZGRyZXNzIGZpZWxkIGFjY2VwdHMgZWl0aGVyIGEgbm9kZUlEIChhbmQgcmV0dXJucyBhIGJlY2gzMiBhZGRyZXNzIGlmIGl0IGV4aXN0cyksIG9yIGEgYmVjaDMyIGFkZHJlc3MgKGFuZCByZXR1cm5zIGEgTm9kZUlEIGlmIGl0IGV4aXN0cykuXG4gICAqXG4gICAqIEBwYXJhbSBhZGRyZXNzIEEgbm9kZUlEIG9yIGEgYmVjaDMyIGFkZHJlc3NcbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYSBzdHJpbmcgY29udGFpbmluZyBiZWNoMzIgYWRkcmVzcyB0aGF0IGlzIHRoZSBub2RlIG93bmVyIG9yIG5vZGVJRCB0aGF0IHRoZSBhZGRyZXNzIHBhc3NlZCBpcyBhbiBvd25lciBvZi5cbiAgICovXG4gIGdldFJlZ2lzdGVyZWRTaG9ydElETGluayA9IGFzeW5jIChhZGRyZXNzOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGNvbnN0IHBhcmFtcyA9IHtcbiAgICAgIGFkZHJlc3NcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmdldFJlZ2lzdGVyZWRTaG9ydElETGlua1wiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5hZGRyZXNzXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhY3RpdmUgb3IgaW5hY3RpdmUgZGVwb3NpdCBvZmZlcnMuXG4gICAqXG4gICAqIEBwYXJhbSBhY3RpdmUgQSBib29sZWFuIGluZGljYXRpbmcgd2hldGhlciB0byByZXR1cm4gYWN0aXZlIG9yIGluYWN0aXZlIGRlcG9zaXQgb2ZmZXJzLlxuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhIGxpc3QgY29udGFpbmluZyBkZXBvc2l0IG9mZmVycy5cbiAgICovXG4gIGdldEFsbERlcG9zaXRPZmZlcnMgPSBhc3luYyAoYWN0aXZlPzogYm9vbGVhbik6IFByb21pc2U8RGVwb3NpdE9mZmVyW10+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IEdldEFsbERlcG9zaXRPZmZlcnNQYXJhbXMgPSB7XG4gICAgICBhY3RpdmVcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmdldEFsbERlcG9zaXRPZmZlcnNcIixcbiAgICAgIHBhcmFtc1xuICAgIClcblxuICAgIGNvbnN0IG9mZmVyczogR2V0QWxsRGVwb3NpdE9mZmVyc1Jlc3BvbnNlID0gcmVzcG9uc2UuZGF0YS5yZXN1bHRcbiAgICByZXR1cm4gb2ZmZXJzLmRlcG9zaXRPZmZlcnMubWFwKChvZmZlcikgPT4ge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgaWQ6IG9mZmVyLmlkLFxuICAgICAgICBpbnRlcmVzdFJhdGVOb21pbmF0b3I6IG5ldyBCTihvZmZlci5pbnRlcmVzdFJhdGVOb21pbmF0b3IpLFxuICAgICAgICBzdGFydDogbmV3IEJOKG9mZmVyLnN0YXJ0KSxcbiAgICAgICAgZW5kOiBuZXcgQk4ob2ZmZXIuZW5kKSxcbiAgICAgICAgbWluQW1vdW50OiBuZXcgQk4ob2ZmZXIubWluQW1vdW50KSxcbiAgICAgICAgbWluRHVyYXRpb246IG9mZmVyLm1pbkR1cmF0aW9uLFxuICAgICAgICBtYXhEdXJhdGlvbjogb2ZmZXIubWF4RHVyYXRpb24sXG4gICAgICAgIHVubG9ja1BlcmlvZER1cmF0aW9uOiBvZmZlci51bmxvY2tQZXJpb2REdXJhdGlvbixcbiAgICAgICAgbm9SZXdhcmRzUGVyaW9kRHVyYXRpb246IG9mZmVyLm5vUmV3YXJkc1BlcmlvZER1cmF0aW9uLFxuICAgICAgICBtZW1vOiBvZmZlci5tZW1vLFxuICAgICAgICBmbGFnczogbmV3IEJOKG9mZmVyLmZsYWdzKVxuICAgICAgfSBhcyBEZXBvc2l0T2ZmZXJcbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgZGVwb3NpdHMgY29yZXNzcG9uZGluZyB0byByZXF1ZXN0ZWQgdHhJRHMuXG4gICAqXG4gICAqIEBwYXJhbSBkZXBvc2l0VHhJRHMgQSBsaXN0IG9mIHR4SURzIChjYjU4KSB0byByZXF1ZXN0IGRlcG9zaXRzIGZvci5cbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYSBsaXN0IGNvbnRhaW5pbmcgZGVwb3NpdHMuXG4gICAqL1xuICBnZXREZXBvc2l0cyA9IGFzeW5jIChkZXBvc2l0VHhJRHM6IHN0cmluZ1tdKTogUHJvbWlzZTxBUElEZXBvc2l0W10+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IEdldERlcG9zaXRzUGFyYW1zID0ge1xuICAgICAgZGVwb3NpdFR4SURzXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5nZXREZXBvc2l0c1wiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuXG4gICAgY29uc3QgZGVwb3NpdHM6IEdldERlcG9zaXRzUmVzcG9uc2UgPSByZXNwb25zZS5kYXRhLnJlc3VsdFxuICAgIHJldHVybiBkZXBvc2l0cy5kZXBvc2l0cy5tYXAoKGRlcG9zaXQpID0+IHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGRlcG9zaXRUeElEOiBkZXBvc2l0LmRlcG9zaXRUeElELFxuICAgICAgICBkZXBvc2l0T2ZmZXJJRDogZGVwb3NpdC5kZXBvc2l0T2ZmZXJJRCxcbiAgICAgICAgdW5sb2NrZWRBbW91bnQ6IG5ldyBCTihkZXBvc2l0LnVubG9ja2VkQW1vdW50KSxcbiAgICAgICAgY2xhaW1lZFJld2FyZEFtb3VudDogbmV3IEJOKGRlcG9zaXQuY2xhaW1lZFJld2FyZEFtb3VudCksXG4gICAgICAgIHN0YXJ0OiBuZXcgQk4oZGVwb3NpdC5zdGFydCksXG4gICAgICAgIGR1cmF0aW9uOiBkZXBvc2l0LmR1cmF0aW9uLFxuICAgICAgICBhbW91bnQ6IG5ldyBCTihkZXBvc2l0LmFtb3VudClcbiAgICAgIH0gYXMgQVBJRGVwb3NpdFxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogTGlzdCBhbW91bnRzIHRoYXQgY2FuIGJlIGNsYWltZWQ6IHZhbGlkYXRvciByZXdhcmRzLCBleHBpcmVkIGRlcG9zaXQgcmV3YXJkcywgYWN0aXZlIGRlcG9zaXQgcmV3YXJkcyBjbGFpbWFibGUgYXQgY3VycmVudCB0aW1lLlxuICAgKlxuICAgKiBAcGFyYW0gYWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBhcyBjYjU4IHN0cmluZ3Mgb3IgYWRkcmVzc2VzIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9c1xuICAgKiBAcGFyYW0gZGVwb3NpdFR4SURzIEFuIGFycmF5IG9mIGRlcG9zaXQgdHJhbnNhY3Rpb25zIGlkc1xuICAgKiBAcGFyYW0gbG9ja3RpbWUgT3B0aW9uYWwuIFRoZSBsb2NrdGltZSBmaWVsZCBjcmVhdGVkIGluIHRoZSByZXN1bHRpbmcgb3V0cHV0c1xuICAgKiBAcGFyYW0gdGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgVVRYT1xuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhbiBvYmplY3QgY29udGFpbmluZyB0aGUgYW1vdW50cyB0aGF0IGNhbiBiZSBjbGFpbWVkLlxuICAgKi9cbiAgZ2V0Q2xhaW1hYmxlcyA9IGFzeW5jIChcbiAgICBhZGRyZXNzZXM6IHN0cmluZ1tdLFxuICAgIGRlcG9zaXRUeElEczogc3RyaW5nW10sXG4gICAgbG9ja3RpbWU6IHN0cmluZyA9IHVuZGVmaW5lZCxcbiAgICB0aHJlc2hvbGQ6IG51bWJlciA9IDFcbiAgKTogUHJvbWlzZTxHZXRDbGFpbWFibGVzUmVzcG9uc2U+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IEdldENsYWltYWJsZXNQYXJhbXMgPSB7XG4gICAgICB0aHJlc2hvbGQsXG4gICAgICBhZGRyZXNzZXMsXG4gICAgICBkZXBvc2l0VHhJRHNcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBsb2NrdGltZSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgcGFyYW1zLmxvY2t0aW1lID0gbG9ja3RpbWVcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmdldENsYWltYWJsZXNcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICBjb25zdCByZXN1bHQgPSByZXNwb25zZS5kYXRhLnJlc3VsdFxuICAgIHJldHVybiB7XG4gICAgICBkZXBvc2l0UmV3YXJkczogbmV3IEJOKHJlc3VsdC5kZXBvc2l0UmV3YXJkcyksXG4gICAgICB2YWxpZGF0b3JSZXdhcmRzOiBuZXcgQk4ocmVzdWx0LnZhbGlkYXRvclJld2FyZHMpLFxuICAgICAgZXhwaXJlZERlcG9zaXRSZXdhcmRzOiBuZXcgQk4ocmVzdWx0LmV4cGlyZWREZXBvc2l0UmV3YXJkcylcbiAgICB9IGFzIEdldENsYWltYWJsZXNSZXNwb25zZVxuICB9XG5cbiAgLyoqXG4gICAqIExpc3RzIHRoZSBzZXQgb2YgcGVuZGluZyB2YWxpZGF0b3JzLlxuICAgKlxuICAgKiBAcGFyYW0gc3VibmV0SUQgT3B0aW9uYWwuIEVpdGhlciBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XG4gICAqIG9yIGEgY2I1OCBzZXJpYWxpemVkIHN0cmluZyBmb3IgdGhlIFN1Ym5ldElEIG9yIGl0cyBhbGlhcy5cbiAgICogQHBhcmFtIG5vZGVJRHMgT3B0aW9uYWwuIEFuIGFycmF5IG9mIHN0cmluZ3NcbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYW4gYXJyYXkgb2YgdmFsaWRhdG9ycyB0aGF0IGFyZSBwZW5kaW5nIHN0YWtpbmcsIHNlZToge0BsaW5rIGh0dHBzOi8vZG9jcy5hdmF4Lm5ldHdvcmsvdjEuMC9lbi9hcGkvcGxhdGZvcm0vI3BsYXRmb3JtZ2V0cGVuZGluZ3ZhbGlkYXRvcnN8cGxhdGZvcm0uZ2V0UGVuZGluZ1ZhbGlkYXRvcnMgZG9jdW1lbnRhdGlvbn0uXG4gICAqXG4gICAqL1xuICBnZXRQZW5kaW5nVmFsaWRhdG9ycyA9IGFzeW5jIChcbiAgICBzdWJuZXRJRDogQnVmZmVyIHwgc3RyaW5nID0gdW5kZWZpbmVkLFxuICAgIG5vZGVJRHM6IHN0cmluZ1tdID0gdW5kZWZpbmVkXG4gICk6IFByb21pc2U8b2JqZWN0PiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBHZXRQZW5kaW5nVmFsaWRhdG9yc1BhcmFtcyA9IHt9XG4gICAgaWYgKHR5cGVvZiBzdWJuZXRJRCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgcGFyYW1zLnN1Ym5ldElEID0gc3VibmV0SURcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBzdWJuZXRJRCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgcGFyYW1zLnN1Ym5ldElEID0gYmludG9vbHMuY2I1OEVuY29kZShzdWJuZXRJRClcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBub2RlSURzICE9IFwidW5kZWZpbmVkXCIgJiYgbm9kZUlEcy5sZW5ndGggPiAwKSB7XG4gICAgICBwYXJhbXMubm9kZUlEcyA9IG5vZGVJRHNcbiAgICB9XG5cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uZ2V0UGVuZGluZ1ZhbGlkYXRvcnNcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHRcbiAgfVxuXG4gIC8qKlxuICAgKiBTYW1wbGVzIGBTaXplYCB2YWxpZGF0b3JzIGZyb20gdGhlIGN1cnJlbnQgdmFsaWRhdG9yIHNldC5cbiAgICpcbiAgICogQHBhcmFtIHNhbXBsZVNpemUgT2YgdGhlIHRvdGFsIHVuaXZlcnNlIG9mIHZhbGlkYXRvcnMsIHNlbGVjdCB0aGlzIG1hbnkgYXQgcmFuZG9tXG4gICAqIEBwYXJhbSBzdWJuZXRJRCBPcHRpb25hbC4gRWl0aGVyIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gb3IgYW5cbiAgICogY2I1OCBzZXJpYWxpemVkIHN0cmluZyBmb3IgdGhlIFN1Ym5ldElEIG9yIGl0cyBhbGlhcy5cbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYW4gYXJyYXkgb2YgdmFsaWRhdG9yXCJzIHN0YWtpbmdJRHMuXG4gICAqL1xuICBzYW1wbGVWYWxpZGF0b3JzID0gYXN5bmMgKFxuICAgIHNhbXBsZVNpemU6IG51bWJlcixcbiAgICBzdWJuZXRJRDogQnVmZmVyIHwgc3RyaW5nID0gdW5kZWZpbmVkXG4gICk6IFByb21pc2U8c3RyaW5nW10+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IFNhbXBsZVZhbGlkYXRvcnNQYXJhbXMgPSB7XG4gICAgICBzaXplOiBzYW1wbGVTaXplLnRvU3RyaW5nKClcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBzdWJuZXRJRCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgcGFyYW1zLnN1Ym5ldElEID0gc3VibmV0SURcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBzdWJuZXRJRCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgcGFyYW1zLnN1Ym5ldElEID0gYmludG9vbHMuY2I1OEVuY29kZShzdWJuZXRJRClcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLnNhbXBsZVZhbGlkYXRvcnNcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQudmFsaWRhdG9yc1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhIHZhbGlkYXRvciB0byB0aGUgUHJpbWFyeSBOZXR3b3JrLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIHVzZXJuYW1lIG9mIHRoZSBLZXlzdG9yZSB1c2VyXG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgb2YgdGhlIEtleXN0b3JlIHVzZXJcbiAgICogQHBhcmFtIG5vZGVJRCBUaGUgbm9kZSBJRCBvZiB0aGUgdmFsaWRhdG9yXG4gICAqIEBwYXJhbSBzdGFydFRpbWUgSmF2YXNjcmlwdCBEYXRlIG9iamVjdCBmb3IgdGhlIHN0YXJ0IHRpbWUgdG8gdmFsaWRhdGVcbiAgICogQHBhcmFtIGVuZFRpbWUgSmF2YXNjcmlwdCBEYXRlIG9iamVjdCBmb3IgdGhlIGVuZCB0aW1lIHRvIHZhbGlkYXRlXG4gICAqIEBwYXJhbSBzdGFrZUFtb3VudCBUaGUgYW1vdW50IG9mIG5BVkFYIHRoZSB2YWxpZGF0b3IgaXMgc3Rha2luZyBhc1xuICAgKiBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSByZXdhcmRBZGRyZXNzIFRoZSBhZGRyZXNzIHRoZSB2YWxpZGF0b3IgcmV3YXJkIHdpbGwgZ28gdG8sIGlmIHRoZXJlIGlzIG9uZS5cbiAgICogQHBhcmFtIGRlbGVnYXRpb25GZWVSYXRlIE9wdGlvbmFsLiBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59IGZvciB0aGUgcGVyY2VudCBmZWUgdGhpcyB2YWxpZGF0b3JcbiAgICogY2hhcmdlcyB3aGVuIG90aGVycyBkZWxlZ2F0ZSBzdGFrZSB0byB0aGVtLiBVcCB0byA0IGRlY2ltYWwgcGxhY2VzIGFsbG93ZWQgYWRkaXRpb25hbCBkZWNpbWFsIHBsYWNlcyBhcmUgaWdub3JlZC5cbiAgICogTXVzdCBiZSBiZXR3ZWVuIDAgYW5kIDEwMCwgaW5jbHVzaXZlLiBGb3IgZXhhbXBsZSwgaWYgZGVsZWdhdGlvbkZlZVJhdGUgaXMgMS4yMzQ1IGFuZCBzb21lb25lIGRlbGVnYXRlcyB0byB0aGlzXG4gICAqIHZhbGlkYXRvciwgdGhlbiB3aGVuIHRoZSBkZWxlZ2F0aW9uIHBlcmlvZCBpcyBvdmVyLCAxLjIzNDUlIG9mIHRoZSByZXdhcmQgZ29lcyB0byB0aGUgdmFsaWRhdG9yIGFuZCB0aGUgcmVzdCBnb2VzXG4gICAqIHRvIHRoZSBkZWxlZ2F0b3IuXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGEgYmFzZTU4IHN0cmluZyBvZiB0aGUgdW5zaWduZWQgdHJhbnNhY3Rpb24uXG4gICAqL1xuICBhZGRWYWxpZGF0b3IgPSBhc3luYyAoXG4gICAgdXNlcm5hbWU6IHN0cmluZyxcbiAgICBwYXNzd29yZDogc3RyaW5nLFxuICAgIG5vZGVJRDogc3RyaW5nLFxuICAgIHN0YXJ0VGltZTogRGF0ZSxcbiAgICBlbmRUaW1lOiBEYXRlLFxuICAgIHN0YWtlQW1vdW50OiBCTixcbiAgICByZXdhcmRBZGRyZXNzOiBzdHJpbmcsXG4gICAgZGVsZWdhdGlvbkZlZVJhdGU6IEJOID0gdW5kZWZpbmVkXG4gICk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBBZGRWYWxpZGF0b3JQYXJhbXMgPSB7XG4gICAgICB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkLFxuICAgICAgbm9kZUlELFxuICAgICAgc3RhcnRUaW1lOiBzdGFydFRpbWUuZ2V0VGltZSgpIC8gMTAwMCxcbiAgICAgIGVuZFRpbWU6IGVuZFRpbWUuZ2V0VGltZSgpIC8gMTAwMCxcbiAgICAgIHN0YWtlQW1vdW50OiBzdGFrZUFtb3VudC50b1N0cmluZygxMCksXG4gICAgICByZXdhcmRBZGRyZXNzXG4gICAgfVxuICAgIGlmICh0eXBlb2YgZGVsZWdhdGlvbkZlZVJhdGUgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHBhcmFtcy5kZWxlZ2F0aW9uRmVlUmF0ZSA9IGRlbGVnYXRpb25GZWVSYXRlLnRvU3RyaW5nKDEwKVxuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uYWRkVmFsaWRhdG9yXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SURcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgYSB2YWxpZGF0b3IgdG8gYSBTdWJuZXQgb3RoZXIgdGhhbiB0aGUgUHJpbWFyeSBOZXR3b3JrLiBUaGUgdmFsaWRhdG9yIG11c3QgdmFsaWRhdGUgdGhlIFByaW1hcnkgTmV0d29yayBmb3IgdGhlIGVudGlyZSBkdXJhdGlvbiB0aGV5IHZhbGlkYXRlIHRoaXMgU3VibmV0LlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIHVzZXJuYW1lIG9mIHRoZSBLZXlzdG9yZSB1c2VyXG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgb2YgdGhlIEtleXN0b3JlIHVzZXJcbiAgICogQHBhcmFtIG5vZGVJRCBUaGUgbm9kZSBJRCBvZiB0aGUgdmFsaWRhdG9yXG4gICAqIEBwYXJhbSBzdWJuZXRJRCBFaXRoZXIgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvciBhIGNiNTggc2VyaWFsaXplZCBzdHJpbmcgZm9yIHRoZSBTdWJuZXRJRCBvciBpdHMgYWxpYXMuXG4gICAqIEBwYXJhbSBzdGFydFRpbWUgSmF2YXNjcmlwdCBEYXRlIG9iamVjdCBmb3IgdGhlIHN0YXJ0IHRpbWUgdG8gdmFsaWRhdGVcbiAgICogQHBhcmFtIGVuZFRpbWUgSmF2YXNjcmlwdCBEYXRlIG9iamVjdCBmb3IgdGhlIGVuZCB0aW1lIHRvIHZhbGlkYXRlXG4gICAqIEBwYXJhbSB3ZWlnaHQgVGhlIHZhbGlkYXRvcuKAmXMgd2VpZ2h0IHVzZWQgZm9yIHNhbXBsaW5nXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIHRoZSB1bnNpZ25lZCB0cmFuc2FjdGlvbi4gSXQgbXVzdCBiZSBzaWduZWQgKHVzaW5nIHNpZ24pIGJ5IHRoZSBwcm9wZXIgbnVtYmVyIG9mIHRoZSBTdWJuZXTigJlzIGNvbnRyb2wga2V5cyBhbmQgYnkgdGhlIGtleSBvZiB0aGUgYWNjb3VudCBwYXlpbmcgdGhlIHRyYW5zYWN0aW9uIGZlZSBiZWZvcmUgaXQgY2FuIGJlIGlzc3VlZC5cbiAgICovXG4gIGFkZFN1Ym5ldFZhbGlkYXRvciA9IGFzeW5jIChcbiAgICB1c2VybmFtZTogc3RyaW5nLFxuICAgIHBhc3N3b3JkOiBzdHJpbmcsXG4gICAgbm9kZUlEOiBzdHJpbmcsXG4gICAgc3VibmV0SUQ6IEJ1ZmZlciB8IHN0cmluZyxcbiAgICBzdGFydFRpbWU6IERhdGUsXG4gICAgZW5kVGltZTogRGF0ZSxcbiAgICB3ZWlnaHQ6IG51bWJlclxuICApOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogYW55ID0ge1xuICAgICAgdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZCxcbiAgICAgIG5vZGVJRCxcbiAgICAgIHN0YXJ0VGltZTogc3RhcnRUaW1lLmdldFRpbWUoKSAvIDEwMDAsXG4gICAgICBlbmRUaW1lOiBlbmRUaW1lLmdldFRpbWUoKSAvIDEwMDAsXG4gICAgICB3ZWlnaHRcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBzdWJuZXRJRCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgcGFyYW1zLnN1Ym5ldElEID0gc3VibmV0SURcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBzdWJuZXRJRCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgcGFyYW1zLnN1Ym5ldElEID0gYmludG9vbHMuY2I1OEVuY29kZShzdWJuZXRJRClcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmFkZFN1Ym5ldFZhbGlkYXRvclwiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC50eElEXG4gIH1cblxuICAvKipcbiAgICogQWRkIGEgZGVsZWdhdG9yIHRvIHRoZSBQcmltYXJ5IE5ldHdvcmsuXG4gICAqXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgdXNlcm5hbWUgb2YgdGhlIEtleXN0b3JlIHVzZXJcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCBvZiB0aGUgS2V5c3RvcmUgdXNlclxuICAgKiBAcGFyYW0gbm9kZUlEIFRoZSBub2RlIElEIG9mIHRoZSBkZWxlZ2F0ZWVcbiAgICogQHBhcmFtIHN0YXJ0VGltZSBKYXZhc2NyaXB0IERhdGUgb2JqZWN0IGZvciB3aGVuIHRoZSBkZWxlZ2F0b3Igc3RhcnRzIGRlbGVnYXRpbmdcbiAgICogQHBhcmFtIGVuZFRpbWUgSmF2YXNjcmlwdCBEYXRlIG9iamVjdCBmb3Igd2hlbiB0aGUgZGVsZWdhdG9yIHN0YXJ0cyBkZWxlZ2F0aW5nXG4gICAqIEBwYXJhbSBzdGFrZUFtb3VudCBUaGUgYW1vdW50IG9mIG5BVkFYIHRoZSBkZWxlZ2F0b3IgaXMgc3Rha2luZyBhc1xuICAgKiBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSByZXdhcmRBZGRyZXNzIFRoZSBhZGRyZXNzIG9mIHRoZSBhY2NvdW50IHRoZSBzdGFrZWQgQVZBWCBhbmQgdmFsaWRhdGlvbiByZXdhcmRcbiAgICogKGlmIGFwcGxpY2FibGUpIGFyZSBzZW50IHRvIGF0IGVuZFRpbWVcbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYW4gYXJyYXkgb2YgdmFsaWRhdG9yXCJzIHN0YWtpbmdJRHMuXG4gICAqL1xuICBhZGREZWxlZ2F0b3IgPSBhc3luYyAoXG4gICAgdXNlcm5hbWU6IHN0cmluZyxcbiAgICBwYXNzd29yZDogc3RyaW5nLFxuICAgIG5vZGVJRDogc3RyaW5nLFxuICAgIHN0YXJ0VGltZTogRGF0ZSxcbiAgICBlbmRUaW1lOiBEYXRlLFxuICAgIHN0YWtlQW1vdW50OiBCTixcbiAgICByZXdhcmRBZGRyZXNzOiBzdHJpbmdcbiAgKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IEFkZERlbGVnYXRvclBhcmFtcyA9IHtcbiAgICAgIHVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmQsXG4gICAgICBub2RlSUQsXG4gICAgICBzdGFydFRpbWU6IHN0YXJ0VGltZS5nZXRUaW1lKCkgLyAxMDAwLFxuICAgICAgZW5kVGltZTogZW5kVGltZS5nZXRUaW1lKCkgLyAxMDAwLFxuICAgICAgc3Rha2VBbW91bnQ6IHN0YWtlQW1vdW50LnRvU3RyaW5nKDEwKSxcbiAgICAgIHJld2FyZEFkZHJlc3NcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmFkZERlbGVnYXRvclwiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC50eElEXG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIHRvIGNyZWF0ZSBhIG5ldyBTdWJuZXQuIFRoZSB1bnNpZ25lZCB0cmFuc2FjdGlvbiBtdXN0IGJlXG4gICAqIHNpZ25lZCB3aXRoIHRoZSBrZXkgb2YgdGhlIGFjY291bnQgcGF5aW5nIHRoZSB0cmFuc2FjdGlvbiBmZWUuIFRoZSBTdWJuZXTigJlzIElEIGlzIHRoZSBJRCBvZiB0aGUgdHJhbnNhY3Rpb24gdGhhdCBjcmVhdGVzIGl0IChpZSB0aGUgcmVzcG9uc2UgZnJvbSBpc3N1ZVR4IHdoZW4gaXNzdWluZyB0aGUgc2lnbmVkIHRyYW5zYWN0aW9uKS5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSB1c2VybmFtZSBvZiB0aGUgS2V5c3RvcmUgdXNlclxuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIG9mIHRoZSBLZXlzdG9yZSB1c2VyXG4gICAqIEBwYXJhbSBjb250cm9sS2V5cyBBcnJheSBvZiBwbGF0Zm9ybSBhZGRyZXNzZXMgYXMgc3RyaW5nc1xuICAgKiBAcGFyYW0gdGhyZXNob2xkIFRvIGFkZCBhIHZhbGlkYXRvciB0byB0aGlzIFN1Ym5ldCwgYSB0cmFuc2FjdGlvbiBtdXN0IGhhdmUgdGhyZXNob2xkXG4gICAqIHNpZ25hdHVyZXMsIHdoZXJlIGVhY2ggc2lnbmF0dXJlIGlzIGZyb20gYSBrZXkgd2hvc2UgYWRkcmVzcyBpcyBhbiBlbGVtZW50IG9mIGBjb250cm9sS2V5c2BcbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYSBzdHJpbmcgd2l0aCB0aGUgdW5zaWduZWQgdHJhbnNhY3Rpb24gZW5jb2RlZCBhcyBiYXNlNTguXG4gICAqL1xuICBjcmVhdGVTdWJuZXQgPSBhc3luYyAoXG4gICAgdXNlcm5hbWU6IHN0cmluZyxcbiAgICBwYXNzd29yZDogc3RyaW5nLFxuICAgIGNvbnRyb2xLZXlzOiBzdHJpbmdbXSxcbiAgICB0aHJlc2hvbGQ6IG51bWJlclxuICApOiBQcm9taXNlPHN0cmluZyB8IEVycm9yUmVzcG9uc2VPYmplY3Q+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IENyZWF0ZVN1Ym5ldFBhcmFtcyA9IHtcbiAgICAgIHVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmQsXG4gICAgICBjb250cm9sS2V5cyxcbiAgICAgIHRocmVzaG9sZFxuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uY3JlYXRlU3VibmV0XCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SURcbiAgICAgID8gcmVzcG9uc2UuZGF0YS5yZXN1bHQudHhJRFxuICAgICAgOiByZXNwb25zZS5kYXRhLnJlc3VsdFxuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgU3VibmV0IHRoYXQgdmFsaWRhdGVzIGEgZ2l2ZW4gYmxvY2tjaGFpbi5cbiAgICpcbiAgICogQHBhcmFtIGJsb2NrY2hhaW5JRCBFaXRoZXIgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvciBhIGNiNThcbiAgICogZW5jb2RlZCBzdHJpbmcgZm9yIHRoZSBibG9ja2NoYWluSUQgb3IgaXRzIGFsaWFzLlxuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhIHN0cmluZyBvZiB0aGUgc3VibmV0SUQgdGhhdCB2YWxpZGF0ZXMgdGhlIGJsb2NrY2hhaW4uXG4gICAqL1xuICB2YWxpZGF0ZWRCeSA9IGFzeW5jIChibG9ja2NoYWluSUQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBhbnkgPSB7XG4gICAgICBibG9ja2NoYWluSURcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLnZhbGlkYXRlZEJ5XCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnN1Ym5ldElEXG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBJRHMgb2YgdGhlIGJsb2NrY2hhaW5zIGEgU3VibmV0IHZhbGlkYXRlcy5cbiAgICpcbiAgICogQHBhcmFtIHN1Ym5ldElEIEVpdGhlciBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9yIGFuIEFWQVhcbiAgICogc2VyaWFsaXplZCBzdHJpbmcgZm9yIHRoZSBTdWJuZXRJRCBvciBpdHMgYWxpYXMuXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGFuIGFycmF5IG9mIGJsb2NrY2hhaW5JRHMgdGhlIHN1Ym5ldCB2YWxpZGF0ZXMuXG4gICAqL1xuICB2YWxpZGF0ZXMgPSBhc3luYyAoc3VibmV0SUQ6IEJ1ZmZlciB8IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IGFueSA9IHtcbiAgICAgIHN1Ym5ldElEXG4gICAgfVxuICAgIGlmICh0eXBlb2Ygc3VibmV0SUQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHBhcmFtcy5zdWJuZXRJRCA9IHN1Ym5ldElEXG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc3VibmV0SUQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHBhcmFtcy5zdWJuZXRJRCA9IGJpbnRvb2xzLmNiNThFbmNvZGUoc3VibmV0SUQpXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS52YWxpZGF0ZXNcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuYmxvY2tjaGFpbklEc1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhbGwgdGhlIGJsb2NrY2hhaW5zIHRoYXQgZXhpc3QgKGV4Y2x1ZGluZyB0aGUgUC1DaGFpbikuXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGFuIGFycmF5IG9mIG9iamVjdHMgY29udGFpbmluZyBmaWVsZHMgXCJpZFwiLCBcInN1Ym5ldElEXCIsIGFuZCBcInZtSURcIi5cbiAgICovXG4gIGdldEJsb2NrY2hhaW5zID0gYXN5bmMgKCk6IFByb21pc2U8QmxvY2tjaGFpbltdPiA9PiB7XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmdldEJsb2NrY2hhaW5zXCJcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LmJsb2NrY2hhaW5zXG4gIH1cblxuICAvKipcbiAgICogU2VuZCBBVkFYIGZyb20gYW4gYWNjb3VudCBvbiB0aGUgUC1DaGFpbiB0byBhbiBhZGRyZXNzIG9uIHRoZSBYLUNoYWluLiBUaGlzIHRyYW5zYWN0aW9uXG4gICAqIG11c3QgYmUgc2lnbmVkIHdpdGggdGhlIGtleSBvZiB0aGUgYWNjb3VudCB0aGF0IHRoZSBBVkFYIGlzIHNlbnQgZnJvbSBhbmQgd2hpY2ggcGF5cyB0aGVcbiAgICogdHJhbnNhY3Rpb24gZmVlLiBBZnRlciBpc3N1aW5nIHRoaXMgdHJhbnNhY3Rpb24sIHlvdSBtdXN0IGNhbGwgdGhlIFgtQ2hhaW7igJlzIGltcG9ydEFWQVhcbiAgICogbWV0aG9kIHRvIGNvbXBsZXRlIHRoZSB0cmFuc2Zlci5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSBLZXlzdG9yZSB1c2VyIHRoYXQgY29udHJvbHMgdGhlIGFjY291bnQgc3BlY2lmaWVkIGluIGB0b2BcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCBvZiB0aGUgS2V5c3RvcmUgdXNlclxuICAgKiBAcGFyYW0gdG8gVGhlIGFkZHJlc3Mgb24gdGhlIFgtQ2hhaW4gdG8gc2VuZCB0aGUgQVZBWCB0by4gRG8gbm90IGluY2x1ZGUgWC0gaW4gdGhlIGFkZHJlc3NcbiAgICogQHBhcmFtIGFtb3VudCBBbW91bnQgb2YgQVZBWCB0byBleHBvcnQgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiB0byBiZSBzaWduZWQgYnkgdGhlIGFjY291bnQgdGhlIHRoZSBBVkFYIGlzXG4gICAqIHNlbnQgZnJvbSBhbmQgcGF5cyB0aGUgdHJhbnNhY3Rpb24gZmVlLlxuICAgKi9cbiAgZXhwb3J0QVZBWCA9IGFzeW5jIChcbiAgICB1c2VybmFtZTogc3RyaW5nLFxuICAgIHBhc3N3b3JkOiBzdHJpbmcsXG4gICAgYW1vdW50OiBCTixcbiAgICB0bzogc3RyaW5nXG4gICk6IFByb21pc2U8c3RyaW5nIHwgRXJyb3JSZXNwb25zZU9iamVjdD4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogRXhwb3J0QVZBWFBhcmFtcyA9IHtcbiAgICAgIHVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmQsXG4gICAgICB0byxcbiAgICAgIGFtb3VudDogYW1vdW50LnRvU3RyaW5nKDEwKVxuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uZXhwb3J0QVZBWFwiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC50eElEXG4gICAgICA/IHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SURcbiAgICAgIDogcmVzcG9uc2UuZGF0YS5yZXN1bHRcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIEFWQVggZnJvbSBhbiBhY2NvdW50IG9uIHRoZSBQLUNoYWluIHRvIGFuIGFkZHJlc3Mgb24gdGhlIFgtQ2hhaW4uIFRoaXMgdHJhbnNhY3Rpb25cbiAgICogbXVzdCBiZSBzaWduZWQgd2l0aCB0aGUga2V5IG9mIHRoZSBhY2NvdW50IHRoYXQgdGhlIEFWQVggaXMgc2VudCBmcm9tIGFuZCB3aGljaCBwYXlzXG4gICAqIHRoZSB0cmFuc2FjdGlvbiBmZWUuIEFmdGVyIGlzc3VpbmcgdGhpcyB0cmFuc2FjdGlvbiwgeW91IG11c3QgY2FsbCB0aGUgWC1DaGFpbuKAmXNcbiAgICogaW1wb3J0QVZBWCBtZXRob2QgdG8gY29tcGxldGUgdGhlIHRyYW5zZmVyLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIEtleXN0b3JlIHVzZXIgdGhhdCBjb250cm9scyB0aGUgYWNjb3VudCBzcGVjaWZpZWQgaW4gYHRvYFxuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIG9mIHRoZSBLZXlzdG9yZSB1c2VyXG4gICAqIEBwYXJhbSB0byBUaGUgSUQgb2YgdGhlIGFjY291bnQgdGhlIEFWQVggaXMgc2VudCB0by4gVGhpcyBtdXN0IGJlIHRoZSBzYW1lIGFzIHRoZSB0b1xuICAgKiBhcmd1bWVudCBpbiB0aGUgY29ycmVzcG9uZGluZyBjYWxsIHRvIHRoZSBYLUNoYWlu4oCZcyBleHBvcnRBVkFYXG4gICAqIEBwYXJhbSBzb3VyY2VDaGFpbiBUaGUgY2hhaW5JRCB3aGVyZSB0aGUgZnVuZHMgYXJlIGNvbWluZyBmcm9tLlxuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhIHN0cmluZyBmb3IgdGhlIHRyYW5zYWN0aW9uLCB3aGljaCBzaG91bGQgYmUgc2VudCB0byB0aGUgbmV0d29ya1xuICAgKiBieSBjYWxsaW5nIGlzc3VlVHguXG4gICAqL1xuICBpbXBvcnRBVkFYID0gYXN5bmMgKFxuICAgIHVzZXJuYW1lOiBzdHJpbmcsXG4gICAgcGFzc3dvcmQ6IHN0cmluZyxcbiAgICB0bzogc3RyaW5nLFxuICAgIHNvdXJjZUNoYWluOiBzdHJpbmdcbiAgKTogUHJvbWlzZTxzdHJpbmcgfCBFcnJvclJlc3BvbnNlT2JqZWN0PiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBJbXBvcnRBVkFYUGFyYW1zID0ge1xuICAgICAgdG8sXG4gICAgICBzb3VyY2VDaGFpbixcbiAgICAgIHVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmRcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmltcG9ydEFWQVhcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQudHhJRFxuICAgICAgPyByZXNwb25zZS5kYXRhLnJlc3VsdC50eElEXG4gICAgICA6IHJlc3BvbnNlLmRhdGEucmVzdWx0XG4gIH1cblxuICAvKipcbiAgICogQ2FsbHMgdGhlIG5vZGUncyBpc3N1ZVR4IG1ldGhvZCBmcm9tIHRoZSBBUEkgYW5kIHJldHVybnMgdGhlIHJlc3VsdGluZyB0cmFuc2FjdGlvbiBJRCBhcyBhIHN0cmluZy5cbiAgICpcbiAgICogQHBhcmFtIHR4IEEgc3RyaW5nLCB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSwgb3IgW1tUeF1dIHJlcHJlc2VudGluZyBhIHRyYW5zYWN0aW9uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgUHJvbWlzZSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSB0cmFuc2FjdGlvbiBJRCBvZiB0aGUgcG9zdGVkIHRyYW5zYWN0aW9uLlxuICAgKi9cbiAgaXNzdWVUeCA9IGFzeW5jICh0eDogc3RyaW5nIHwgQnVmZmVyIHwgVHgpOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGxldCBUcmFuc2FjdGlvbiA9IFwiXCJcbiAgICBpZiAodHlwZW9mIHR4ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBUcmFuc2FjdGlvbiA9IHR4XG4gICAgfSBlbHNlIGlmICh0eCBpbnN0YW5jZW9mIEJ1ZmZlcikge1xuICAgICAgY29uc3QgdHhvYmo6IFR4ID0gbmV3IFR4KClcbiAgICAgIHR4b2JqLmZyb21CdWZmZXIodHgpXG4gICAgICBUcmFuc2FjdGlvbiA9IHR4b2JqLnRvU3RyaW5nSGV4KClcbiAgICB9IGVsc2UgaWYgKHR4IGluc3RhbmNlb2YgVHgpIHtcbiAgICAgIFRyYW5zYWN0aW9uID0gdHgudG9TdHJpbmdIZXgoKVxuICAgIH0gZWxzZSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IFRyYW5zYWN0aW9uRXJyb3IoXG4gICAgICAgIFwiRXJyb3IgLSBwbGF0Zm9ybS5pc3N1ZVR4OiBwcm92aWRlZCB0eCBpcyBub3QgZXhwZWN0ZWQgdHlwZSBvZiBzdHJpbmcsIEJ1ZmZlciwgb3IgVHhcIlxuICAgICAgKVxuICAgIH1cbiAgICBjb25zdCBwYXJhbXM6IGFueSA9IHtcbiAgICAgIHR4OiBUcmFuc2FjdGlvbi50b1N0cmluZygpLFxuICAgICAgZW5jb2Rpbmc6IFwiaGV4XCJcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmlzc3VlVHhcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQudHhJRFxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gdXBwZXIgYm91bmQgb24gdGhlIGFtb3VudCBvZiB0b2tlbnMgdGhhdCBleGlzdC4gTm90IG1vbm90b25pY2FsbHkgaW5jcmVhc2luZyBiZWNhdXNlIHRoaXMgbnVtYmVyIGNhbiBnbyBkb3duIGlmIGEgc3Rha2VyXCJzIHJld2FyZCBpcyBkZW5pZWQuXG4gICAqL1xuICBnZXRDdXJyZW50U3VwcGx5ID0gYXN5bmMgKCk6IFByb21pc2U8Qk4+ID0+IHtcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uZ2V0Q3VycmVudFN1cHBseVwiXG4gICAgKVxuICAgIHJldHVybiBuZXcgQk4ocmVzcG9uc2UuZGF0YS5yZXN1bHQuc3VwcGx5LCAxMClcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBoZWlnaHQgb2YgdGhlIHBsYXRmb3JtIGNoYWluLlxuICAgKi9cbiAgZ2V0SGVpZ2h0ID0gYXN5bmMgKCk6IFByb21pc2U8Qk4+ID0+IHtcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uZ2V0SGVpZ2h0XCJcbiAgICApXG4gICAgcmV0dXJuIG5ldyBCTihyZXNwb25zZS5kYXRhLnJlc3VsdC5oZWlnaHQsIDEwKVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1pbmltdW0gc3Rha2luZyBhbW91bnQuXG4gICAqXG4gICAqIEBwYXJhbSByZWZyZXNoIEEgYm9vbGVhbiB0byBieXBhc3MgdGhlIGxvY2FsIGNhY2hlZCB2YWx1ZSBvZiBNaW5pbXVtIFN0YWtlIEFtb3VudCwgcG9sbGluZyB0aGUgbm9kZSBpbnN0ZWFkLlxuICAgKi9cbiAgZ2V0TWluU3Rha2UgPSBhc3luYyAoXG4gICAgcmVmcmVzaDogYm9vbGVhbiA9IGZhbHNlXG4gICk6IFByb21pc2U8R2V0TWluU3Rha2VSZXNwb25zZT4gPT4ge1xuICAgIGlmIChcbiAgICAgIHJlZnJlc2ggIT09IHRydWUgJiZcbiAgICAgIHR5cGVvZiB0aGlzLm1pblZhbGlkYXRvclN0YWtlICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgICB0eXBlb2YgdGhpcy5taW5EZWxlZ2F0b3JTdGFrZSAhPT0gXCJ1bmRlZmluZWRcIlxuICAgICkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbWluVmFsaWRhdG9yU3Rha2U6IHRoaXMubWluVmFsaWRhdG9yU3Rha2UsXG4gICAgICAgIG1pbkRlbGVnYXRvclN0YWtlOiB0aGlzLm1pbkRlbGVnYXRvclN0YWtlXG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5nZXRNaW5TdGFrZVwiXG4gICAgKVxuICAgIHRoaXMubWluVmFsaWRhdG9yU3Rha2UgPSBuZXcgQk4ocmVzcG9uc2UuZGF0YS5yZXN1bHQubWluVmFsaWRhdG9yU3Rha2UsIDEwKVxuICAgIHRoaXMubWluRGVsZWdhdG9yU3Rha2UgPSBuZXcgQk4ocmVzcG9uc2UuZGF0YS5yZXN1bHQubWluRGVsZWdhdG9yU3Rha2UsIDEwKVxuICAgIHJldHVybiB7XG4gICAgICBtaW5WYWxpZGF0b3JTdGFrZTogdGhpcy5taW5WYWxpZGF0b3JTdGFrZSxcbiAgICAgIG1pbkRlbGVnYXRvclN0YWtlOiB0aGlzLm1pbkRlbGVnYXRvclN0YWtlXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIGdldFRvdGFsU3Rha2UoKSByZXR1cm5zIHRoZSB0b3RhbCBhbW91bnQgc3Rha2VkIG9uIHRoZSBQcmltYXJ5IE5ldHdvcmtcbiAgICpcbiAgICogQHJldHVybnMgQSBiaWcgbnVtYmVyIHJlcHJlc2VudGluZyB0b3RhbCBzdGFrZWQgYnkgdmFsaWRhdG9ycyBvbiB0aGUgcHJpbWFyeSBuZXR3b3JrXG4gICAqL1xuICBnZXRUb3RhbFN0YWtlID0gYXN5bmMgKCk6IFByb21pc2U8Qk4+ID0+IHtcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uZ2V0VG90YWxTdGFrZVwiXG4gICAgKVxuICAgIHJldHVybiBuZXcgQk4ocmVzcG9uc2UuZGF0YS5yZXN1bHQuc3Rha2UsIDEwKVxuICB9XG5cbiAgLyoqXG4gICAqIGdldE1heFN0YWtlQW1vdW50KCkgcmV0dXJucyB0aGUgbWF4aW11bSBhbW91bnQgb2YgbkFWQVggc3Rha2luZyB0byB0aGUgbmFtZWQgbm9kZSBkdXJpbmcgdGhlIHRpbWUgcGVyaW9kLlxuICAgKlxuICAgKiBAcGFyYW0gc3VibmV0SUQgQSBCdWZmZXIgb3IgY2I1OCBzdHJpbmcgcmVwcmVzZW50aW5nIHN1Ym5ldFxuICAgKiBAcGFyYW0gbm9kZUlEIEEgc3RyaW5nIHJlcHJlc2VudGluZyBJRCBvZiB0aGUgbm9kZSB3aG9zZSBzdGFrZSBhbW91bnQgaXMgcmVxdWlyZWQgZHVyaW5nIHRoZSBnaXZlbiBkdXJhdGlvblxuICAgKiBAcGFyYW0gc3RhcnRUaW1lIEEgYmlnIG51bWJlciBkZW5vdGluZyBzdGFydCB0aW1lIG9mIHRoZSBkdXJhdGlvbiBkdXJpbmcgd2hpY2ggc3Rha2UgYW1vdW50IG9mIHRoZSBub2RlIGlzIHJlcXVpcmVkLlxuICAgKiBAcGFyYW0gZW5kVGltZSBBIGJpZyBudW1iZXIgZGVub3RpbmcgZW5kIHRpbWUgb2YgdGhlIGR1cmF0aW9uIGR1cmluZyB3aGljaCBzdGFrZSBhbW91bnQgb2YgdGhlIG5vZGUgaXMgcmVxdWlyZWQuXG4gICAqIEByZXR1cm5zIEEgYmlnIG51bWJlciByZXByZXNlbnRpbmcgdG90YWwgc3Rha2VkIGJ5IHZhbGlkYXRvcnMgb24gdGhlIHByaW1hcnkgbmV0d29ya1xuICAgKi9cbiAgZ2V0TWF4U3Rha2VBbW91bnQgPSBhc3luYyAoXG4gICAgc3VibmV0SUQ6IHN0cmluZyB8IEJ1ZmZlcixcbiAgICBub2RlSUQ6IHN0cmluZyxcbiAgICBzdGFydFRpbWU6IEJOLFxuICAgIGVuZFRpbWU6IEJOXG4gICk6IFByb21pc2U8Qk4+ID0+IHtcbiAgICBjb25zdCBub3c6IEJOID0gVW5peE5vdygpXG4gICAgaWYgKHN0YXJ0VGltZS5ndChub3cpIHx8IGVuZFRpbWUubHRlKHN0YXJ0VGltZSkpIHtcbiAgICAgIHRocm93IG5ldyBUaW1lRXJyb3IoXG4gICAgICAgIFwiUGxhdGZvcm1WTUFQSS5nZXRNYXhTdGFrZUFtb3VudCAtLSBzdGFydFRpbWUgbXVzdCBiZSBpbiB0aGUgcGFzdCBhbmQgZW5kVGltZSBtdXN0IGNvbWUgYWZ0ZXIgc3RhcnRUaW1lXCJcbiAgICAgIClcbiAgICB9XG5cbiAgICBjb25zdCBwYXJhbXM6IEdldE1heFN0YWtlQW1vdW50UGFyYW1zID0ge1xuICAgICAgbm9kZUlEOiBub2RlSUQsXG4gICAgICBzdGFydFRpbWU6IHN0YXJ0VGltZS50b1N0cmluZygxMCksXG4gICAgICBlbmRUaW1lOiBlbmRUaW1lLnRvU3RyaW5nKDEwKVxuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygc3VibmV0SUQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHBhcmFtcy5zdWJuZXRJRCA9IHN1Ym5ldElEXG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc3VibmV0SUQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHBhcmFtcy5zdWJuZXRJRCA9IGJpbnRvb2xzLmNiNThFbmNvZGUoc3VibmV0SUQpXG4gICAgfVxuXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmdldE1heFN0YWtlQW1vdW50XCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIG5ldyBCTihyZXNwb25zZS5kYXRhLnJlc3VsdC5hbW91bnQsIDEwKVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIG1pbmltdW0gc3Rha2UgY2FjaGVkIGluIHRoaXMgY2xhc3MuXG4gICAqIEBwYXJhbSBtaW5WYWxpZGF0b3JTdGFrZSBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59IHRvIHNldCB0aGUgbWluaW11bSBzdGFrZSBhbW91bnQgY2FjaGVkIGluIHRoaXMgY2xhc3MuXG4gICAqIEBwYXJhbSBtaW5EZWxlZ2F0b3JTdGFrZSBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59IHRvIHNldCB0aGUgbWluaW11bSBkZWxlZ2F0aW9uIGFtb3VudCBjYWNoZWQgaW4gdGhpcyBjbGFzcy5cbiAgICovXG4gIHNldE1pblN0YWtlID0gKFxuICAgIG1pblZhbGlkYXRvclN0YWtlOiBCTiA9IHVuZGVmaW5lZCxcbiAgICBtaW5EZWxlZ2F0b3JTdGFrZTogQk4gPSB1bmRlZmluZWRcbiAgKTogdm9pZCA9PiB7XG4gICAgaWYgKHR5cGVvZiBtaW5WYWxpZGF0b3JTdGFrZSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhpcy5taW5WYWxpZGF0b3JTdGFrZSA9IG1pblZhbGlkYXRvclN0YWtlXG4gICAgfVxuICAgIGlmICh0eXBlb2YgbWluRGVsZWdhdG9yU3Rha2UgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHRoaXMubWluRGVsZWdhdG9yU3Rha2UgPSBtaW5EZWxlZ2F0b3JTdGFrZVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB0b3RhbCBhbW91bnQgc3Rha2VkIGZvciBhbiBhcnJheSBvZiBhZGRyZXNzZXMuXG4gICAqL1xuICBnZXRTdGFrZSA9IGFzeW5jIChcbiAgICBhZGRyZXNzZXM6IHN0cmluZ1tdLFxuICAgIGVuY29kaW5nOiBzdHJpbmcgPSBcImhleFwiXG4gICk6IFByb21pc2U8R2V0U3Rha2VSZXNwb25zZT4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogR2V0U3Rha2VQYXJhbXMgPSB7XG4gICAgICBhZGRyZXNzZXMsXG4gICAgICBlbmNvZGluZ1xuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uZ2V0U3Rha2VcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4ge1xuICAgICAgc3Rha2VkOiBuZXcgQk4ocmVzcG9uc2UuZGF0YS5yZXN1bHQuc3Rha2VkLCAxMCksXG4gICAgICBzdGFrZWRPdXRwdXRzOiByZXNwb25zZS5kYXRhLnJlc3VsdC5zdGFrZWRPdXRwdXRzLm1hcChcbiAgICAgICAgKHN0YWtlZE91dHB1dDogc3RyaW5nKTogVHJhbnNmZXJhYmxlT3V0cHV0ID0+IHtcbiAgICAgICAgICBjb25zdCB0cmFuc2ZlcmFibGVPdXRwdXQ6IFRyYW5zZmVyYWJsZU91dHB1dCA9XG4gICAgICAgICAgICBuZXcgVHJhbnNmZXJhYmxlT3V0cHV0KClcbiAgICAgICAgICBsZXQgYnVmOiBCdWZmZXJcbiAgICAgICAgICBpZiAoZW5jb2RpbmcgPT09IFwiY2I1OFwiKSB7XG4gICAgICAgICAgICBidWYgPSBiaW50b29scy5jYjU4RGVjb2RlKHN0YWtlZE91dHB1dClcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYnVmID0gQnVmZmVyLmZyb20oc3Rha2VkT3V0cHV0LnJlcGxhY2UoLzB4L2csIFwiXCIpLCBcImhleFwiKVxuICAgICAgICAgIH1cbiAgICAgICAgICB0cmFuc2ZlcmFibGVPdXRwdXQuZnJvbUJ1ZmZlcihidWYsIDIpXG4gICAgICAgICAgcmV0dXJuIHRyYW5zZmVyYWJsZU91dHB1dFxuICAgICAgICB9XG4gICAgICApXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhbGwgdGhlIHN1Ym5ldHMgdGhhdCBleGlzdC5cbiAgICpcbiAgICogQHBhcmFtIGlkcyBJRHMgb2YgdGhlIHN1Ym5ldHMgdG8gcmV0cmlldmUgaW5mb3JtYXRpb24gYWJvdXQuIElmIG9taXR0ZWQsIGdldHMgYWxsIHN1Ym5ldHNcbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYW4gYXJyYXkgb2Ygb2JqZWN0cyBjb250YWluaW5nIGZpZWxkcyBcImlkXCIsXG4gICAqIFwiY29udHJvbEtleXNcIiwgYW5kIFwidGhyZXNob2xkXCIuXG4gICAqL1xuICBnZXRTdWJuZXRzID0gYXN5bmMgKGlkczogc3RyaW5nW10gPSB1bmRlZmluZWQpOiBQcm9taXNlPFN1Ym5ldFtdPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBhbnkgPSB7fVxuICAgIGlmICh0eXBlb2YgaWRzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHBhcmFtcy5pZHMgPSBpZHNcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmdldFN1Ym5ldHNcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuc3VibmV0c1xuICB9XG5cbiAgLyoqXG4gICAqIEV4cG9ydHMgdGhlIHByaXZhdGUga2V5IGZvciBhbiBhZGRyZXNzLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIG5hbWUgb2YgdGhlIHVzZXIgd2l0aCB0aGUgcHJpdmF0ZSBrZXlcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCB1c2VkIHRvIGRlY3J5cHQgdGhlIHByaXZhdGUga2V5XG4gICAqIEBwYXJhbSBhZGRyZXNzIFRoZSBhZGRyZXNzIHdob3NlIHByaXZhdGUga2V5IHNob3VsZCBiZSBleHBvcnRlZFxuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIHdpdGggdGhlIGRlY3J5cHRlZCBwcml2YXRlIGtleSBhcyBzdG9yZSBpbiB0aGUgZGF0YWJhc2VcbiAgICovXG4gIGV4cG9ydEtleSA9IGFzeW5jIChcbiAgICB1c2VybmFtZTogc3RyaW5nLFxuICAgIHBhc3N3b3JkOiBzdHJpbmcsXG4gICAgYWRkcmVzczogc3RyaW5nXG4gICk6IFByb21pc2U8c3RyaW5nIHwgRXJyb3JSZXNwb25zZU9iamVjdD4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogRXhwb3J0S2V5UGFyYW1zID0ge1xuICAgICAgdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZCxcbiAgICAgIGFkZHJlc3NcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmV4cG9ydEtleVwiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5wcml2YXRlS2V5XG4gICAgICA/IHJlc3BvbnNlLmRhdGEucmVzdWx0LnByaXZhdGVLZXlcbiAgICAgIDogcmVzcG9uc2UuZGF0YS5yZXN1bHRcbiAgfVxuXG4gIC8qKlxuICAgKiBHaXZlIGEgdXNlciBjb250cm9sIG92ZXIgYW4gYWRkcmVzcyBieSBwcm92aWRpbmcgdGhlIHByaXZhdGUga2V5IHRoYXQgY29udHJvbHMgdGhlIGFkZHJlc3MuXG4gICAqXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgbmFtZSBvZiB0aGUgdXNlciB0byBzdG9yZSB0aGUgcHJpdmF0ZSBrZXlcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCB0aGF0IHVubG9ja3MgdGhlIHVzZXJcbiAgICogQHBhcmFtIHByaXZhdGVLZXkgQSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBwcml2YXRlIGtleSBpbiB0aGUgdm1cInMgZm9ybWF0XG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBhZGRyZXNzIGZvciB0aGUgaW1wb3J0ZWQgcHJpdmF0ZSBrZXkuXG4gICAqL1xuICBpbXBvcnRLZXkgPSBhc3luYyAoXG4gICAgdXNlcm5hbWU6IHN0cmluZyxcbiAgICBwYXNzd29yZDogc3RyaW5nLFxuICAgIHByaXZhdGVLZXk6IHN0cmluZ1xuICApOiBQcm9taXNlPHN0cmluZyB8IEVycm9yUmVzcG9uc2VPYmplY3Q+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IEltcG9ydEtleVBhcmFtcyA9IHtcbiAgICAgIHVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmQsXG4gICAgICBwcml2YXRlS2V5XG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5pbXBvcnRLZXlcIixcbiAgICAgIHBhcmFtc1xuICAgIClcblxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5hZGRyZXNzXG4gICAgICA/IHJlc3BvbnNlLmRhdGEucmVzdWx0LmFkZHJlc3NcbiAgICAgIDogcmVzcG9uc2UuZGF0YS5yZXN1bHRcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSB0cmVhbnNhY3Rpb24gZGF0YSBvZiBhIHByb3ZpZGVkIHRyYW5zYWN0aW9uIElEIGJ5IGNhbGxpbmcgdGhlIG5vZGUncyBgZ2V0VHhgIG1ldGhvZC5cbiAgICpcbiAgICogQHBhcmFtIHR4SUQgVGhlIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgdHJhbnNhY3Rpb24gSURcbiAgICogQHBhcmFtIGVuY29kaW5nIHNldHMgdGhlIGZvcm1hdCBvZiB0aGUgcmV0dXJuZWQgdHJhbnNhY3Rpb24uIENhbiBiZSwgXCJjYjU4XCIsIFwiaGV4XCIgb3IgXCJqc29uXCIuIERlZmF1bHRzIHRvIFwiY2I1OFwiLlxuICAgKlxuICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZSBzdHJpbmcgb3Igb2JqZWN0IGNvbnRhaW5pbmcgdGhlIGJ5dGVzIHJldHJpZXZlZCBmcm9tIHRoZSBub2RlXG4gICAqL1xuICBnZXRUeCA9IGFzeW5jIChcbiAgICB0eElEOiBzdHJpbmcsXG4gICAgZW5jb2Rpbmc6IHN0cmluZyA9IFwiaGV4XCJcbiAgKTogUHJvbWlzZTxzdHJpbmcgfCBvYmplY3Q+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IGFueSA9IHtcbiAgICAgIHR4SUQsXG4gICAgICBlbmNvZGluZ1xuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uZ2V0VHhcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQudHhcbiAgICAgID8gcmVzcG9uc2UuZGF0YS5yZXN1bHQudHhcbiAgICAgIDogcmVzcG9uc2UuZGF0YS5yZXN1bHRcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBzdGF0dXMgb2YgYSBwcm92aWRlZCB0cmFuc2FjdGlvbiBJRCBieSBjYWxsaW5nIHRoZSBub2RlJ3MgYGdldFR4U3RhdHVzYCBtZXRob2QuXG4gICAqXG4gICAqIEBwYXJhbSB0eGlkIFRoZSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIHRyYW5zYWN0aW9uIElEXG4gICAqIEBwYXJhbSBpbmNsdWRlUmVhc29uIFJldHVybiB0aGUgcmVhc29uIHR4IHdhcyBkcm9wcGVkLCBpZiBhcHBsaWNhYmxlLiBEZWZhdWx0cyB0byB0cnVlXG4gICAqXG4gICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlIHN0cmluZyBjb250YWluaW5nIHRoZSBzdGF0dXMgcmV0cmlldmVkIGZyb20gdGhlIG5vZGUgYW5kIHRoZSByZWFzb24gYSB0eCB3YXMgZHJvcHBlZCwgaWYgYXBwbGljYWJsZS5cbiAgICovXG4gIGdldFR4U3RhdHVzID0gYXN5bmMgKFxuICAgIHR4aWQ6IHN0cmluZyxcbiAgICBpbmNsdWRlUmVhc29uOiBib29sZWFuID0gdHJ1ZVxuICApOiBQcm9taXNlPHN0cmluZyB8IEdldFR4U3RhdHVzUmVzcG9uc2U+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IEdldFR4U3RhdHVzUGFyYW1zID0ge1xuICAgICAgdHhJRDogdHhpZCxcbiAgICAgIGluY2x1ZGVSZWFzb246IGluY2x1ZGVSZWFzb25cbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmdldFR4U3RhdHVzXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmVzIHRoZSBVVFhPcyByZWxhdGVkIHRvIHRoZSBhZGRyZXNzZXMgcHJvdmlkZWQgZnJvbSB0aGUgbm9kZSdzIGBnZXRVVFhPc2AgbWV0aG9kLlxuICAgKlxuICAgKiBAcGFyYW0gYWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBhcyBjYjU4IHN0cmluZ3Mgb3IgYWRkcmVzc2VzIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9c1xuICAgKiBAcGFyYW0gc291cmNlQ2hhaW4gQSBzdHJpbmcgZm9yIHRoZSBjaGFpbiB0byBsb29rIGZvciB0aGUgVVRYT1wicy4gRGVmYXVsdCBpcyB0byB1c2UgdGhpcyBjaGFpbiwgYnV0IGlmIGV4cG9ydGVkIFVUWE9zIGV4aXN0IGZyb20gb3RoZXIgY2hhaW5zLCB0aGlzIGNhbiB1c2VkIHRvIHB1bGwgdGhlbSBpbnN0ZWFkLlxuICAgKiBAcGFyYW0gbGltaXQgT3B0aW9uYWwuIFJldHVybnMgYXQgbW9zdCBbbGltaXRdIGFkZHJlc3Nlcy4gSWYgW2xpbWl0XSA9PSAwIG9yID4gW21heFVUWE9zVG9GZXRjaF0sIGZldGNoZXMgdXAgdG8gW21heFVUWE9zVG9GZXRjaF0uXG4gICAqIEBwYXJhbSBzdGFydEluZGV4IE9wdGlvbmFsLiBbU3RhcnRJbmRleF0gZGVmaW5lcyB3aGVyZSB0byBzdGFydCBmZXRjaGluZyBVVFhPcyAoZm9yIHBhZ2luYXRpb24uKVxuICAgKiBVVFhPcyBmZXRjaGVkIGFyZSBmcm9tIGFkZHJlc3NlcyBlcXVhbCB0byBvciBncmVhdGVyIHRoYW4gW1N0YXJ0SW5kZXguQWRkcmVzc11cbiAgICogRm9yIGFkZHJlc3MgW1N0YXJ0SW5kZXguQWRkcmVzc10sIG9ubHkgVVRYT3Mgd2l0aCBJRHMgZ3JlYXRlciB0aGFuIFtTdGFydEluZGV4LlV0eG9dIHdpbGwgYmUgcmV0dXJuZWQuXG4gICAqIEBwYXJhbSBwZXJzaXN0T3B0cyBPcHRpb25zIGF2YWlsYWJsZSB0byBwZXJzaXN0IHRoZXNlIFVUWE9zIGluIGxvY2FsIHN0b3JhZ2VcbiAgICogQHBhcmFtIGVuY29kaW5nIE9wdGlvbmFsLiAgaXMgdGhlIGVuY29kaW5nIGZvcm1hdCB0byB1c2UgZm9yIHRoZSBwYXlsb2FkIGFyZ3VtZW50LiBDYW4gYmUgZWl0aGVyIFwiY2I1OFwiIG9yIFwiaGV4XCIuIERlZmF1bHRzIHRvIFwiaGV4XCIuXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIHBlcnNpc3RPcHRzIGlzIG9wdGlvbmFsIGFuZCBtdXN0IGJlIG9mIHR5cGUgW1tQZXJzaXN0YW5jZU9wdGlvbnNdXVxuICAgKlxuICAgKi9cbiAgZ2V0VVRYT3MgPSBhc3luYyAoXG4gICAgYWRkcmVzc2VzOiBzdHJpbmdbXSB8IHN0cmluZyxcbiAgICBzb3VyY2VDaGFpbjogc3RyaW5nID0gdW5kZWZpbmVkLFxuICAgIGxpbWl0OiBudW1iZXIgPSAwLFxuICAgIHN0YXJ0SW5kZXg6IHsgYWRkcmVzczogc3RyaW5nOyB1dHhvOiBzdHJpbmcgfSA9IHVuZGVmaW5lZCxcbiAgICBwZXJzaXN0T3B0czogUGVyc2lzdGFuY2VPcHRpb25zID0gdW5kZWZpbmVkLFxuICAgIGVuY29kaW5nOiBzdHJpbmcgPSBcImhleFwiXG4gICk6IFByb21pc2U8R2V0VVRYT3NSZXNwb25zZT4gPT4ge1xuICAgIGlmICh0eXBlb2YgYWRkcmVzc2VzID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBhZGRyZXNzZXMgPSBbYWRkcmVzc2VzXVxuICAgIH1cblxuICAgIGNvbnN0IHBhcmFtczogR2V0VVRYT3NQYXJhbXMgPSB7XG4gICAgICBhZGRyZXNzZXM6IGFkZHJlc3NlcyxcbiAgICAgIGxpbWl0LFxuICAgICAgZW5jb2RpbmdcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBzdGFydEluZGV4ICE9PSBcInVuZGVmaW5lZFwiICYmIHN0YXJ0SW5kZXgpIHtcbiAgICAgIHBhcmFtcy5zdGFydEluZGV4ID0gc3RhcnRJbmRleFxuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygc291cmNlQ2hhaW4gIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHBhcmFtcy5zb3VyY2VDaGFpbiA9IHNvdXJjZUNoYWluXG4gICAgfVxuXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmdldFVUWE9zXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG5cbiAgICBjb25zdCB1dHhvczogVVRYT1NldCA9IG5ldyBVVFhPU2V0KClcbiAgICBsZXQgZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVzdWx0LnV0eG9zXG4gICAgaWYgKHBlcnNpc3RPcHRzICYmIHR5cGVvZiBwZXJzaXN0T3B0cyA9PT0gXCJvYmplY3RcIikge1xuICAgICAgaWYgKHRoaXMuZGIuaGFzKHBlcnNpc3RPcHRzLmdldE5hbWUoKSkpIHtcbiAgICAgICAgY29uc3Qgc2VsZkFycmF5OiBzdHJpbmdbXSA9IHRoaXMuZGIuZ2V0KHBlcnNpc3RPcHRzLmdldE5hbWUoKSlcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2VsZkFycmF5KSkge1xuICAgICAgICAgIHV0eG9zLmFkZEFycmF5KGRhdGEpXG4gICAgICAgICAgY29uc3Qgc2VsZjogVVRYT1NldCA9IG5ldyBVVFhPU2V0KClcbiAgICAgICAgICBzZWxmLmFkZEFycmF5KHNlbGZBcnJheSlcbiAgICAgICAgICBzZWxmLm1lcmdlQnlSdWxlKHV0eG9zLCBwZXJzaXN0T3B0cy5nZXRNZXJnZVJ1bGUoKSlcbiAgICAgICAgICBkYXRhID0gc2VsZi5nZXRBbGxVVFhPU3RyaW5ncygpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuZGIuc2V0KHBlcnNpc3RPcHRzLmdldE5hbWUoKSwgZGF0YSwgcGVyc2lzdE9wdHMuZ2V0T3ZlcndyaXRlKCkpXG4gICAgfVxuXG4gICAgaWYgKGRhdGEubGVuZ3RoID4gMCAmJiBkYXRhWzBdLnN1YnN0cmluZygwLCAyKSA9PT0gXCIweFwiKSB7XG4gICAgICBjb25zdCBjYjU4U3Ryczogc3RyaW5nW10gPSBbXVxuICAgICAgZGF0YS5mb3JFYWNoKChzdHI6IHN0cmluZyk6IHZvaWQgPT4ge1xuICAgICAgICBjYjU4U3Rycy5wdXNoKGJpbnRvb2xzLmNiNThFbmNvZGUoQnVmZmVyLmZyb20oc3RyLnNsaWNlKDIpLCBcImhleFwiKSkpXG4gICAgICB9KVxuXG4gICAgICB1dHhvcy5hZGRBcnJheShjYjU4U3RycywgZmFsc2UpXG4gICAgfSBlbHNlIHtcbiAgICAgIHV0eG9zLmFkZEFycmF5KGRhdGEsIGZhbHNlKVxuICAgIH1cbiAgICByZXNwb25zZS5kYXRhLnJlc3VsdC51dHhvcyA9IHV0eG9zXG4gICAgcmVzcG9uc2UuZGF0YS5yZXN1bHQubnVtRmV0Y2hlZCA9IHBhcnNlSW50KHJlc3BvbnNlLmRhdGEucmVzdWx0Lm51bUZldGNoZWQpXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0XG4gIH1cblxuICAvKipcbiAgICogZ2V0QWRkcmVzc1N0YXRlcygpIHJldHVybnMgYW4gNjQgYml0IGJpdG1hc2sgb2Ygc3RhdGVzIGFwcGxpZWQgdG8gYWRkcmVzc1xuICAgKlxuICAgKiBAcmV0dXJucyBBIGJpZyBudW1iZXIgcmVwcmVzZW50aW5nIHRoZSBzdGF0ZXMgYXBwbGllZCB0byBnaXZlbiBhZGRyZXNzXG4gICAqL1xuICBnZXRBZGRyZXNzU3RhdGVzID0gYXN5bmMgKGFkZHJlc3M6IHN0cmluZyk6IFByb21pc2U8Qk4+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IEFkZHJlc3NQYXJhbXMgPSB7XG4gICAgICBhZGRyZXNzOiBhZGRyZXNzXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5nZXRBZGRyZXNzU3RhdGVzXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIG5ldyBCTihyZXNwb25zZS5kYXRhLnJlc3VsdCwgMTApXG4gIH1cblxuICAvKipcbiAgICogZ2V0TXVsdGlzaWdBbGlhcygpIHJldHVybnMgYSBNdWx0aXNpZ0FsaWFzUmVwbHlcbiAgICpcbiAgICogQHJldHVybnMgQSBNdWx0aVNpZ0FsaWFzXG4gICAqL1xuICBnZXRNdWx0aXNpZ0FsaWFzID0gYXN5bmMgKGFkZHJlc3M6IHN0cmluZyk6IFByb21pc2U8TXVsdGlzaWdBbGlhc1JlcGx5PiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBBZGRyZXNzUGFyYW1zID0ge1xuICAgICAgYWRkcmVzczogYWRkcmVzc1xuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uZ2V0TXVsdGlzaWdBbGlhc1wiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdFxuICB9XG5cbiAgLyoqXG4gICAqIEhlbHBlciBmdW5jdGlvbiB3aGljaCBjcmVhdGVzIGFuIHVuc2lnbmVkIEltcG9ydCBUeC4gRm9yIG1vcmUgZ3JhbnVsYXIgY29udHJvbCwgeW91IG1heSBjcmVhdGUgeW91ciBvd25cbiAgICogW1tVbnNpZ25lZFR4XV0gbWFudWFsbHkgKHdpdGggdGhlaXIgY29ycmVzcG9uZGluZyBbW1RyYW5zZmVyYWJsZUlucHV0XV1zLCBbW1RyYW5zZmVyYWJsZU91dHB1dF1dcywgYW5kIFtbVHJhbnNmZXJPcGVyYXRpb25dXXMpLlxuICAgKlxuICAgKiBAcGFyYW0gdXR4b3NldCBBIHNldCBvZiBVVFhPcyB0aGF0IHRoZSB0cmFuc2FjdGlvbiBpcyBidWlsdCBvblxuICAgKiBAcGFyYW0gb3duZXJBZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIGltcG9ydFxuICAgKiBAcGFyYW0gc291cmNlQ2hhaW4gVGhlIGNoYWluaWQgZm9yIHdoZXJlIHRoZSBpbXBvcnQgaXMgY29taW5nIGZyb20uXG4gICAqIEBwYXJhbSB0b0FkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRvIHNlbmQgdGhlIGZ1bmRzXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBzZW5kIHRoZSBmdW5kcyBmcm9tIHRoZSBVVFhPcyBwcm92aWRlZFxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3NcbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIGxvY2t0aW1lIE9wdGlvbmFsLiBUaGUgbG9ja3RpbWUgZmllbGQgY3JlYXRlZCBpbiB0aGUgcmVzdWx0aW5nIG91dHB1dHNcbiAgICogQHBhcmFtIHRvVGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgVVRYT1xuICAgKiBAcGFyYW0gY2hhbmdlVGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgY2hhbmdlIFVUWE9cbiAgICpcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gKFtbVW5zaWduZWRUeF1dKSB3aGljaCBjb250YWlucyBhIFtbSW1wb3J0VHhdXS5cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogVGhpcyBoZWxwZXIgZXhpc3RzIGJlY2F1c2UgdGhlIGVuZHBvaW50IEFQSSBzaG91bGQgYmUgdGhlIHByaW1hcnkgcG9pbnQgb2YgZW50cnkgZm9yIG1vc3QgZnVuY3Rpb25hbGl0eS5cbiAgICovXG4gIGJ1aWxkSW1wb3J0VHggPSBhc3luYyAoXG4gICAgdXR4b3NldDogVVRYT1NldCxcbiAgICBvd25lckFkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgc291cmNlQ2hhaW46IEJ1ZmZlciB8IHN0cmluZyxcbiAgICB0b0FkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgZnJvbUFkZHJlc3NlczogRnJvbVR5cGUsXG4gICAgY2hhbmdlQWRkcmVzc2VzOiBzdHJpbmdbXSA9IHVuZGVmaW5lZCxcbiAgICBtZW1vOiBQYXlsb2FkQmFzZSB8IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBhc09mOiBCTiA9IFplcm9CTixcbiAgICBsb2NrdGltZTogQk4gPSBaZXJvQk4sXG4gICAgdG9UaHJlc2hvbGQ6IG51bWJlciA9IDEsXG4gICAgY2hhbmdlVGhyZXNob2xkOiBudW1iZXIgPSAxXG4gICk6IFByb21pc2U8VW5zaWduZWRUeD4gPT4ge1xuICAgIGNvbnN0IGNhbGxlciA9IFwiYnVpbGRJbXBvcnRUeFwiXG5cbiAgICBjb25zdCB0bzogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheUJ1ZmZlcih0b0FkZHJlc3NlcywgY2FsbGVyKVxuXG4gICAgY29uc3QgZnJvbVNpZ25lciA9IHRoaXMuX3BhcnNlRnJvbVNpZ25lcihmcm9tQWRkcmVzc2VzLCBjYWxsZXIpXG5cbiAgICBjb25zdCBjaGFuZ2U6IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXlCdWZmZXIoXG4gICAgICBjaGFuZ2VBZGRyZXNzZXMsXG4gICAgICBjYWxsZXJcbiAgICApXG5cbiAgICBsZXQgc3JjQ2hhaW46IHN0cmluZyA9IHVuZGVmaW5lZFxuXG4gICAgaWYgKHR5cGVvZiBzb3VyY2VDaGFpbiA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhyb3cgbmV3IENoYWluSWRFcnJvcihcbiAgICAgICAgXCJFcnJvciAtIFBsYXRmb3JtVk1BUEkuYnVpbGRJbXBvcnRUeDogU291cmNlIENoYWluSUQgaXMgdW5kZWZpbmVkLlwiXG4gICAgICApXG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc291cmNlQ2hhaW4gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHNyY0NoYWluID0gc291cmNlQ2hhaW5cbiAgICAgIHNvdXJjZUNoYWluID0gYmludG9vbHMuY2I1OERlY29kZShzb3VyY2VDaGFpbilcbiAgICB9IGVsc2UgaWYgKCEoc291cmNlQ2hhaW4gaW5zdGFuY2VvZiBCdWZmZXIpKSB7XG4gICAgICB0aHJvdyBuZXcgQ2hhaW5JZEVycm9yKFxuICAgICAgICBcIkVycm9yIC0gUGxhdGZvcm1WTUFQSS5idWlsZEltcG9ydFR4OiBJbnZhbGlkIGRlc3RpbmF0aW9uQ2hhaW4gdHlwZTogXCIgK1xuICAgICAgICAgIHR5cGVvZiBzb3VyY2VDaGFpblxuICAgICAgKVxuICAgIH1cbiAgICBjb25zdCBhdG9taWNVVFhPczogVVRYT1NldCA9IGF3YWl0IChcbiAgICAgIGF3YWl0IHRoaXMuZ2V0VVRYT3Mob3duZXJBZGRyZXNzZXMsIHNyY0NoYWluLCAwLCB1bmRlZmluZWQpXG4gICAgKS51dHhvc1xuICAgIGNvbnN0IGF2YXhBc3NldElEOiBCdWZmZXIgPSBhd2FpdCB0aGlzLmdldEFWQVhBc3NldElEKClcblxuICAgIGlmIChtZW1vIGluc3RhbmNlb2YgUGF5bG9hZEJhc2UpIHtcbiAgICAgIG1lbW8gPSBtZW1vLmdldFBheWxvYWQoKVxuICAgIH1cblxuICAgIGNvbnN0IGF0b21pY3M6IFVUWE9bXSA9IGF0b21pY1VUWE9zLmdldEFsbFVUWE9zKClcblxuICAgIGNvbnN0IGJ1aWx0VW5zaWduZWRUeDogVW5zaWduZWRUeCA9IGF3YWl0IHRoaXMuX2dldEJ1aWxkZXIoXG4gICAgICB1dHhvc2V0XG4gICAgKS5idWlsZEltcG9ydFR4KFxuICAgICAgdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpLFxuICAgICAgYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRCksXG4gICAgICB0byxcbiAgICAgIGZyb21TaWduZXIsXG4gICAgICBjaGFuZ2UsXG4gICAgICBhdG9taWNzLFxuICAgICAgc291cmNlQ2hhaW4sXG4gICAgICB0aGlzLmdldFR4RmVlKCksXG4gICAgICBhdmF4QXNzZXRJRCxcbiAgICAgIG1lbW8sXG4gICAgICBhc09mLFxuICAgICAgbG9ja3RpbWUsXG4gICAgICB0b1RocmVzaG9sZCxcbiAgICAgIGNoYW5nZVRocmVzaG9sZFxuICAgIClcblxuICAgIGlmICghKGF3YWl0IHRoaXMuY2hlY2tHb29zZUVnZyhidWlsdFVuc2lnbmVkVHgpKSkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBHb29zZUVnZ0NoZWNrRXJyb3IoXCJGYWlsZWQgR29vc2UgRWdnIENoZWNrXCIpXG4gICAgfVxuXG4gICAgcmV0dXJuIGJ1aWx0VW5zaWduZWRUeFxuICB9XG5cbiAgLyoqXG4gICAqIEhlbHBlciBmdW5jdGlvbiB3aGljaCBjcmVhdGVzIGFuIHVuc2lnbmVkIEV4cG9ydCBUeC4gRm9yIG1vcmUgZ3JhbnVsYXIgY29udHJvbCwgeW91IG1heSBjcmVhdGUgeW91ciBvd25cbiAgICogW1tVbnNpZ25lZFR4XV0gbWFudWFsbHkgKHdpdGggdGhlaXIgY29ycmVzcG9uZGluZyBbW1RyYW5zZmVyYWJsZUlucHV0XV1zLCBbW1RyYW5zZmVyYWJsZU91dHB1dF1dcywgYW5kIFtbVHJhbnNmZXJPcGVyYXRpb25dXXMpLlxuICAgKlxuICAgKiBAcGFyYW0gdXR4b3NldCBBIHNldCBvZiBVVFhPcyB0aGF0IHRoZSB0cmFuc2FjdGlvbiBpcyBidWlsdCBvblxuICAgKiBAcGFyYW0gYW1vdW50IFRoZSBhbW91bnQgYmVpbmcgZXhwb3J0ZWQgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gZGVzdGluYXRpb25DaGFpbiBUaGUgY2hhaW5pZCBmb3Igd2hlcmUgdGhlIGFzc2V0cyB3aWxsIGJlIHNlbnQuXG4gICAqIEBwYXJhbSB0b0FkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRvIHNlbmQgdGhlIGZ1bmRzXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBzZW5kIHRoZSBmdW5kcyBmcm9tIHRoZSBVVFhPcyBwcm92aWRlZFxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3NcbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIGxvY2t0aW1lIE9wdGlvbmFsLiBUaGUgbG9ja3RpbWUgZmllbGQgY3JlYXRlZCBpbiB0aGUgcmVzdWx0aW5nIG91dHB1dHNcbiAgICogQHBhcmFtIHRvVGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgVVRYT1xuICAgKiBAcGFyYW0gY2hhbmdlVGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgY2hhbmdlIFVUWE9cbiAgICpcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gKFtbVW5zaWduZWRUeF1dKSB3aGljaCBjb250YWlucyBhbiBbW0V4cG9ydFR4XV0uXG4gICAqL1xuICBidWlsZEV4cG9ydFR4ID0gYXN5bmMgKFxuICAgIHV0eG9zZXQ6IFVUWE9TZXQsXG4gICAgYW1vdW50OiBCTixcbiAgICBkZXN0aW5hdGlvbkNoYWluOiBCdWZmZXIgfCBzdHJpbmcsXG4gICAgdG9BZGRyZXNzZXM6IHN0cmluZ1tdLFxuICAgIGZyb21BZGRyZXNzZXM6IEZyb21UeXBlLFxuICAgIGNoYW5nZUFkZHJlc3Nlczogc3RyaW5nW10gPSB1bmRlZmluZWQsXG4gICAgbWVtbzogUGF5bG9hZEJhc2UgfCBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgYXNPZjogQk4gPSBaZXJvQk4sXG4gICAgbG9ja3RpbWU6IEJOID0gWmVyb0JOLFxuICAgIHRvVGhyZXNob2xkOiBudW1iZXIgPSAxLFxuICAgIGNoYW5nZVRocmVzaG9sZDogbnVtYmVyID0gMVxuICApOiBQcm9taXNlPFVuc2lnbmVkVHg+ID0+IHtcbiAgICBjb25zdCBjYWxsZXIgPSBcImJ1aWxkRXhwb3J0VHhcIlxuXG4gICAgbGV0IHByZWZpeGVzOiBvYmplY3QgPSB7fVxuICAgIHRvQWRkcmVzc2VzLm1hcCgoYTogc3RyaW5nKTogdm9pZCA9PiB7XG4gICAgICBwcmVmaXhlc1thLnNwbGl0KFwiLVwiKVswXV0gPSB0cnVlXG4gICAgfSlcbiAgICBpZiAoT2JqZWN0LmtleXMocHJlZml4ZXMpLmxlbmd0aCAhPT0gMSkge1xuICAgICAgdGhyb3cgbmV3IEFkZHJlc3NFcnJvcihcbiAgICAgICAgXCJFcnJvciAtIFBsYXRmb3JtVk1BUEkuYnVpbGRFeHBvcnRUeDogVG8gYWRkcmVzc2VzIG11c3QgaGF2ZSB0aGUgc2FtZSBjaGFpbklEIHByZWZpeC5cIlxuICAgICAgKVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgZGVzdGluYXRpb25DaGFpbiA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhyb3cgbmV3IENoYWluSWRFcnJvcihcbiAgICAgICAgXCJFcnJvciAtIFBsYXRmb3JtVk1BUEkuYnVpbGRFeHBvcnRUeDogRGVzdGluYXRpb24gQ2hhaW5JRCBpcyB1bmRlZmluZWQuXCJcbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBkZXN0aW5hdGlvbkNoYWluID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBkZXN0aW5hdGlvbkNoYWluID0gYmludG9vbHMuY2I1OERlY29kZShkZXN0aW5hdGlvbkNoYWluKSAvL1xuICAgIH0gZWxzZSBpZiAoIShkZXN0aW5hdGlvbkNoYWluIGluc3RhbmNlb2YgQnVmZmVyKSkge1xuICAgICAgdGhyb3cgbmV3IENoYWluSWRFcnJvcihcbiAgICAgICAgXCJFcnJvciAtIFBsYXRmb3JtVk1BUEkuYnVpbGRFeHBvcnRUeDogSW52YWxpZCBkZXN0aW5hdGlvbkNoYWluIHR5cGU6IFwiICtcbiAgICAgICAgICB0eXBlb2YgZGVzdGluYXRpb25DaGFpblxuICAgICAgKVxuICAgIH1cbiAgICBpZiAoZGVzdGluYXRpb25DaGFpbi5sZW5ndGggIT09IDMyKSB7XG4gICAgICB0aHJvdyBuZXcgQ2hhaW5JZEVycm9yKFxuICAgICAgICBcIkVycm9yIC0gUGxhdGZvcm1WTUFQSS5idWlsZEV4cG9ydFR4OiBEZXN0aW5hdGlvbiBDaGFpbklEIG11c3QgYmUgMzIgYnl0ZXMgaW4gbGVuZ3RoLlwiXG4gICAgICApXG4gICAgfVxuXG4gICAgbGV0IHRvOiBCdWZmZXJbXSA9IFtdXG4gICAgdG9BZGRyZXNzZXMubWFwKChhOiBzdHJpbmcpOiB2b2lkID0+IHtcbiAgICAgIHRvLnB1c2goYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKVxuICAgIH0pXG5cbiAgICBjb25zdCBmcm9tU2lnbmVyID0gdGhpcy5fcGFyc2VGcm9tU2lnbmVyKGZyb21BZGRyZXNzZXMsIGNhbGxlcilcblxuICAgIGNvbnN0IGNoYW5nZTogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheUJ1ZmZlcihcbiAgICAgIGNoYW5nZUFkZHJlc3NlcyxcbiAgICAgIGNhbGxlclxuICAgIClcblxuICAgIGlmIChtZW1vIGluc3RhbmNlb2YgUGF5bG9hZEJhc2UpIHtcbiAgICAgIG1lbW8gPSBtZW1vLmdldFBheWxvYWQoKVxuICAgIH1cblxuICAgIGNvbnN0IGF2YXhBc3NldElEOiBCdWZmZXIgPSBhd2FpdCB0aGlzLmdldEFWQVhBc3NldElEKClcblxuICAgIGNvbnN0IGJ1aWx0VW5zaWduZWRUeDogVW5zaWduZWRUeCA9IGF3YWl0IHRoaXMuX2dldEJ1aWxkZXIoXG4gICAgICB1dHhvc2V0XG4gICAgKS5idWlsZEV4cG9ydFR4KFxuICAgICAgdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpLFxuICAgICAgYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRCksXG4gICAgICBhbW91bnQsXG4gICAgICBhdmF4QXNzZXRJRCxcbiAgICAgIHRvLFxuICAgICAgZnJvbVNpZ25lcixcbiAgICAgIGRlc3RpbmF0aW9uQ2hhaW4sXG4gICAgICBjaGFuZ2UsXG4gICAgICB0aGlzLmdldFR4RmVlKCksXG4gICAgICBhdmF4QXNzZXRJRCxcbiAgICAgIG1lbW8sXG4gICAgICBhc09mLFxuICAgICAgbG9ja3RpbWUsXG4gICAgICB0b1RocmVzaG9sZCxcbiAgICAgIGNoYW5nZVRocmVzaG9sZFxuICAgIClcblxuICAgIGlmICghKGF3YWl0IHRoaXMuY2hlY2tHb29zZUVnZyhidWlsdFVuc2lnbmVkVHgpKSkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBHb29zZUVnZ0NoZWNrRXJyb3IoXCJGYWlsZWQgR29vc2UgRWdnIENoZWNrXCIpXG4gICAgfVxuXG4gICAgcmV0dXJuIGJ1aWx0VW5zaWduZWRUeFxuICB9XG5cbiAgLyoqXG4gICAqIEhlbHBlciBmdW5jdGlvbiB3aGljaCBjcmVhdGVzIGFuIHVuc2lnbmVkIFtbQWRkU3VibmV0VmFsaWRhdG9yVHhdXS4gRm9yIG1vcmUgZ3JhbnVsYXIgY29udHJvbCwgeW91IG1heSBjcmVhdGUgeW91ciBvd25cbiAgICogW1tVbnNpZ25lZFR4XV0gbWFudWFsbHkgYW5kIGltcG9ydCB0aGUgW1tBZGRTdWJuZXRWYWxpZGF0b3JUeF1dIGNsYXNzIGRpcmVjdGx5LlxuICAgKlxuICAgKiBAcGFyYW0gdXR4b3NldCBBIHNldCBvZiBVVFhPcyB0aGF0IHRoZSB0cmFuc2FjdGlvbiBpcyBidWlsdCBvbi5cbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHdobyBwYXlzIHRoZSBmZWVzIGluIEFWQVhcbiAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBBbiBhcnJheSBvZiBhZGRyZXNzZXMgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2hvIGdldHMgdGhlIGNoYW5nZSBsZWZ0b3ZlciBmcm9tIHRoZSBmZWUgcGF5bWVudFxuICAgKiBAcGFyYW0gbm9kZUlEIFRoZSBub2RlIElEIG9mIHRoZSB2YWxpZGF0b3IgYmVpbmcgYWRkZWQuXG4gICAqIEBwYXJhbSBzdGFydFRpbWUgVGhlIFVuaXggdGltZSB3aGVuIHRoZSB2YWxpZGF0b3Igc3RhcnRzIHZhbGlkYXRpbmcgdGhlIFByaW1hcnkgTmV0d29yay5cbiAgICogQHBhcmFtIGVuZFRpbWUgVGhlIFVuaXggdGltZSB3aGVuIHRoZSB2YWxpZGF0b3Igc3RvcHMgdmFsaWRhdGluZyB0aGUgUHJpbWFyeSBOZXR3b3JrIChhbmQgc3Rha2VkIEFWQVggaXMgcmV0dXJuZWQpLlxuICAgKiBAcGFyYW0gd2VpZ2h0IFRoZSBhbW91bnQgb2Ygd2VpZ2h0IGZvciB0aGlzIHN1Ym5ldCB2YWxpZGF0b3IuXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBzdWJuZXRBdXRoIE9wdGlvbmFsLiBBbiBBdXRoIHN0cnVjdCB3aGljaCBjb250YWlucyB0aGUgc3VibmV0IEF1dGggYW5kIHRoZSBzaWduZXJzLlxuICAgKiBAcGFyYW0gY2hhbmdlVGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgY2hhbmdlIFVUWE9cbiAgICpcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gY3JlYXRlZCBmcm9tIHRoZSBwYXNzZWQgaW4gcGFyYW1ldGVycy5cbiAgICovXG5cbiAgYnVpbGRBZGRTdWJuZXRWYWxpZGF0b3JUeCA9IGFzeW5jIChcbiAgICB1dHhvc2V0OiBVVFhPU2V0LFxuICAgIGZyb21BZGRyZXNzZXM6IEZyb21UeXBlLFxuICAgIGNoYW5nZUFkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgbm9kZUlEOiBzdHJpbmcsXG4gICAgc3RhcnRUaW1lOiBCTixcbiAgICBlbmRUaW1lOiBCTixcbiAgICB3ZWlnaHQ6IEJOLFxuICAgIHN1Ym5ldElEOiBzdHJpbmcsXG4gICAgbWVtbzogUGF5bG9hZEJhc2UgfCBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgYXNPZjogQk4gPSBaZXJvQk4sXG4gICAgc3VibmV0QXV0aDogQXV0aCA9IHsgYWRkcmVzc2VzOiBbXSwgdGhyZXNob2xkOiAwLCBzaWduZXI6IFtdIH0sXG4gICAgY2hhbmdlVGhyZXNob2xkOiBudW1iZXIgPSAxXG4gICk6IFByb21pc2U8VW5zaWduZWRUeD4gPT4ge1xuICAgIGNvbnN0IGNhbGxlciA9IFwiYnVpbGRBZGRTdWJuZXRWYWxpZGF0b3JUeFwiXG5cbiAgICBjb25zdCBmcm9tU2lnbmVyID0gdGhpcy5fcGFyc2VGcm9tU2lnbmVyKGZyb21BZGRyZXNzZXMsIGNhbGxlcilcblxuICAgIGNvbnN0IGNoYW5nZTogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheUJ1ZmZlcihcbiAgICAgIGNoYW5nZUFkZHJlc3NlcyxcbiAgICAgIGNhbGxlclxuICAgIClcblxuICAgIGlmIChtZW1vIGluc3RhbmNlb2YgUGF5bG9hZEJhc2UpIHtcbiAgICAgIG1lbW8gPSBtZW1vLmdldFBheWxvYWQoKVxuICAgIH1cblxuICAgIGNvbnN0IGF2YXhBc3NldElEOiBCdWZmZXIgPSBhd2FpdCB0aGlzLmdldEFWQVhBc3NldElEKClcblxuICAgIGNvbnN0IG5vdzogQk4gPSBVbml4Tm93KClcbiAgICBpZiAoc3RhcnRUaW1lLmx0KG5vdykgfHwgZW5kVGltZS5sdGUoc3RhcnRUaW1lKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBcIlBsYXRmb3JtVk1BUEkuYnVpbGRBZGRTdWJuZXRWYWxpZGF0b3JUeCAtLSBzdGFydFRpbWUgbXVzdCBiZSBpbiB0aGUgZnV0dXJlIGFuZCBlbmRUaW1lIG11c3QgY29tZSBhZnRlciBzdGFydFRpbWVcIlxuICAgICAgKVxuICAgIH1cblxuICAgIGNvbnN0IGJ1aWx0VW5zaWduZWRUeDogVW5zaWduZWRUeCA9IGF3YWl0IHRoaXMuX2dldEJ1aWxkZXIoXG4gICAgICB1dHhvc2V0XG4gICAgKS5idWlsZEFkZFN1Ym5ldFZhbGlkYXRvclR4KFxuICAgICAgdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpLFxuICAgICAgYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRCksXG4gICAgICBmcm9tU2lnbmVyLFxuICAgICAgY2hhbmdlLFxuICAgICAgTm9kZUlEU3RyaW5nVG9CdWZmZXIobm9kZUlEKSxcbiAgICAgIHN0YXJ0VGltZSxcbiAgICAgIGVuZFRpbWUsXG4gICAgICB3ZWlnaHQsXG4gICAgICBzdWJuZXRJRCxcbiAgICAgIHRoaXMuZ2V0RGVmYXVsdFR4RmVlKCksXG4gICAgICBhdmF4QXNzZXRJRCxcbiAgICAgIG1lbW8sXG4gICAgICBhc09mLFxuICAgICAgc3VibmV0QXV0aCxcbiAgICAgIGNoYW5nZVRocmVzaG9sZFxuICAgIClcblxuICAgIGlmICghKGF3YWl0IHRoaXMuY2hlY2tHb29zZUVnZyhidWlsdFVuc2lnbmVkVHgpKSkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCBHb29zZSBFZ2cgQ2hlY2tcIilcbiAgICB9XG5cbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4XG4gIH1cblxuICAvKipcbiAgICogSGVscGVyIGZ1bmN0aW9uIHdoaWNoIGNyZWF0ZXMgYW4gdW5zaWduZWQgW1tBZGREZWxlZ2F0b3JUeF1dLiBGb3IgbW9yZSBncmFudWxhciBjb250cm9sLCB5b3UgbWF5IGNyZWF0ZSB5b3VyIG93blxuICAgKiBbW1Vuc2lnbmVkVHhdXSBtYW51YWxseSBhbmQgaW1wb3J0IHRoZSBbW0FkZERlbGVnYXRvclR4XV0gY2xhc3MgZGlyZWN0bHkuXG4gICAqXG4gICAqIEBwYXJhbSB1dHhvc2V0IEEgc2V0IG9mIFVUWE9zIHRoYXQgdGhlIHRyYW5zYWN0aW9uIGlzIGJ1aWx0IG9uXG4gICAqIEBwYXJhbSB0b0FkZHJlc3NlcyBBbiBhcnJheSBvZiBhZGRyZXNzZXMgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2hvIHJlY2VpdmVkIHRoZSBzdGFrZWQgdG9rZW5zIGF0IHRoZSBlbmQgb2YgdGhlIHN0YWtpbmcgcGVyaW9kXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB3aG8gb3duIHRoZSBzdGFraW5nIFVUWE9zIHRoZSBmZWVzIGluIEFWQVhcbiAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBBbiBhcnJheSBvZiBhZGRyZXNzZXMgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2hvIGdldHMgdGhlIGNoYW5nZSBsZWZ0b3ZlciBmcm9tIHRoZSBmZWUgcGF5bWVudFxuICAgKiBAcGFyYW0gbm9kZUlEIFRoZSBub2RlIElEIG9mIHRoZSB2YWxpZGF0b3IgYmVpbmcgYWRkZWQuXG4gICAqIEBwYXJhbSBzdGFydFRpbWUgVGhlIFVuaXggdGltZSB3aGVuIHRoZSB2YWxpZGF0b3Igc3RhcnRzIHZhbGlkYXRpbmcgdGhlIFByaW1hcnkgTmV0d29yay5cbiAgICogQHBhcmFtIGVuZFRpbWUgVGhlIFVuaXggdGltZSB3aGVuIHRoZSB2YWxpZGF0b3Igc3RvcHMgdmFsaWRhdGluZyB0aGUgUHJpbWFyeSBOZXR3b3JrIChhbmQgc3Rha2VkIEFWQVggaXMgcmV0dXJuZWQpLlxuICAgKiBAcGFyYW0gc3Rha2VBbW91bnQgVGhlIGFtb3VudCBiZWluZyBkZWxlZ2F0ZWQgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gcmV3YXJkQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgd2hpY2ggd2lsbCByZWNpZXZlIHRoZSByZXdhcmRzIGZyb20gdGhlIGRlbGVnYXRlZCBzdGFrZS5cbiAgICogQHBhcmFtIHJld2FyZExvY2t0aW1lIE9wdGlvbmFsLiBUaGUgbG9ja3RpbWUgZmllbGQgY3JlYXRlZCBpbiB0aGUgcmVzdWx0aW5nIHJld2FyZCBvdXRwdXRzXG4gICAqIEBwYXJhbSByZXdhcmRUaHJlc2hvbGQgT3Bpb25hbC4gVGhlIG51bWJlciBvZiBzaWduYXR1cmVzIHJlcXVpcmVkIHRvIHNwZW5kIHRoZSBmdW5kcyBpbiB0aGUgcmVzdWx0YW50IHJld2FyZCBVVFhPLiBEZWZhdWx0IDEuXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSB0b1RocmVzaG9sZCBPcHRpb25hbC4gVGhlIG51bWJlciBvZiBzaWduYXR1cmVzIHJlcXVpcmVkIHRvIHNwZW5kIHRoZSBmdW5kcyBpbiB0aGUgcmVzdWx0YW50IFVUWE9cbiAgICogQHBhcmFtIGNoYW5nZVRocmVzaG9sZCBPcHRpb25hbC4gVGhlIG51bWJlciBvZiBzaWduYXR1cmVzIHJlcXVpcmVkIHRvIHNwZW5kIHRoZSBmdW5kcyBpbiB0aGUgcmVzdWx0YW50IGNoYW5nZSBVVFhPXG4gICAqXG4gICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIGNyZWF0ZWQgZnJvbSB0aGUgcGFzc2VkIGluIHBhcmFtZXRlcnMuXG4gICAqL1xuICBidWlsZEFkZERlbGVnYXRvclR4ID0gYXN5bmMgKFxuICAgIHV0eG9zZXQ6IFVUWE9TZXQsXG4gICAgdG9BZGRyZXNzZXM6IHN0cmluZ1tdLFxuICAgIGZyb21BZGRyZXNzZXM6IEZyb21UeXBlLFxuICAgIGNoYW5nZUFkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgbm9kZUlEOiBzdHJpbmcsXG4gICAgc3RhcnRUaW1lOiBCTixcbiAgICBlbmRUaW1lOiBCTixcbiAgICBzdGFrZUFtb3VudDogQk4sXG4gICAgcmV3YXJkQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICByZXdhcmRMb2NrdGltZTogQk4gPSBaZXJvQk4sXG4gICAgcmV3YXJkVGhyZXNob2xkOiBudW1iZXIgPSAxLFxuICAgIG1lbW86IFBheWxvYWRCYXNlIHwgQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGFzT2Y6IEJOID0gWmVyb0JOLFxuICAgIHRvVGhyZXNob2xkOiBudW1iZXIgPSAxLFxuICAgIGNoYW5nZVRocmVzaG9sZDogbnVtYmVyID0gMVxuICApOiBQcm9taXNlPFVuc2lnbmVkVHg+ID0+IHtcbiAgICBjb25zdCBjYWxsZXIgPSBcImJ1aWxkQWRkRGVsZWdhdG9yVHhcIlxuICAgIGNvbnN0IHRvOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5QnVmZmVyKHRvQWRkcmVzc2VzLCBjYWxsZXIpXG5cbiAgICBjb25zdCBmcm9tU2lnbmVyID0gdGhpcy5fcGFyc2VGcm9tU2lnbmVyKGZyb21BZGRyZXNzZXMsIGNhbGxlcilcblxuICAgIGNvbnN0IGNoYW5nZTogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheUJ1ZmZlcihcbiAgICAgIGNoYW5nZUFkZHJlc3NlcyxcbiAgICAgIGNhbGxlclxuICAgIClcbiAgICBjb25zdCByZXdhcmRzOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5QnVmZmVyKFxuICAgICAgcmV3YXJkQWRkcmVzc2VzLFxuICAgICAgY2FsbGVyXG4gICAgKVxuXG4gICAgaWYgKG1lbW8gaW5zdGFuY2VvZiBQYXlsb2FkQmFzZSkge1xuICAgICAgbWVtbyA9IG1lbW8uZ2V0UGF5bG9hZCgpXG4gICAgfVxuXG4gICAgY29uc3QgbWluU3Rha2U6IEJOID0gKGF3YWl0IHRoaXMuZ2V0TWluU3Rha2UoKSlbXCJtaW5EZWxlZ2F0b3JTdGFrZVwiXVxuICAgIGlmIChzdGFrZUFtb3VudC5sdChtaW5TdGFrZSkpIHtcbiAgICAgIHRocm93IG5ldyBTdGFrZUVycm9yKFxuICAgICAgICBcIlBsYXRmb3JtVk1BUEkuYnVpbGRBZGREZWxlZ2F0b3JUeCAtLSBzdGFrZSBhbW91bnQgbXVzdCBiZSBhdCBsZWFzdCBcIiArXG4gICAgICAgICAgbWluU3Rha2UudG9TdHJpbmcoMTApXG4gICAgICApXG4gICAgfVxuXG4gICAgY29uc3QgYXZheEFzc2V0SUQ6IEJ1ZmZlciA9IGF3YWl0IHRoaXMuZ2V0QVZBWEFzc2V0SUQoKVxuXG4gICAgY29uc3Qgbm93OiBCTiA9IFVuaXhOb3coKVxuICAgIGlmIChzdGFydFRpbWUubHQobm93KSB8fCBlbmRUaW1lLmx0ZShzdGFydFRpbWUpKSB7XG4gICAgICB0aHJvdyBuZXcgVGltZUVycm9yKFxuICAgICAgICBcIlBsYXRmb3JtVk1BUEkuYnVpbGRBZGREZWxlZ2F0b3JUeCAtLSBzdGFydFRpbWUgbXVzdCBiZSBpbiB0aGUgZnV0dXJlIGFuZCBlbmRUaW1lIG11c3QgY29tZSBhZnRlciBzdGFydFRpbWVcIlxuICAgICAgKVxuICAgIH1cblxuICAgIGlmICh0aGlzLmNvcmUuZ2V0TmV0d29yaygpLlAubG9ja01vZGVCb25kRGVwb3NpdCkge1xuICAgICAgdGhyb3cgbmV3IFVUWE9FcnJvcihcbiAgICAgICAgXCJQbGF0Zm9ybVZNQVBJLmJ1aWxkQWRkRGVsZWdhdG9yVHggLS0gbm90IHN1cHBvcnRlZCBpbiBsb2NrbW9kZUJvbmREZXBvc2l0XCJcbiAgICAgIClcbiAgICB9XG5cbiAgICBjb25zdCBidWlsdFVuc2lnbmVkVHg6IFVuc2lnbmVkVHggPSBhd2FpdCB0aGlzLl9nZXRCdWlsZGVyKFxuICAgICAgdXR4b3NldFxuICAgICkuYnVpbGRBZGREZWxlZ2F0b3JUeChcbiAgICAgIHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKSxcbiAgICAgIGJpbnRvb2xzLmNiNThEZWNvZGUodGhpcy5ibG9ja2NoYWluSUQpLFxuICAgICAgYXZheEFzc2V0SUQsXG4gICAgICB0byxcbiAgICAgIGZyb21TaWduZXIsXG4gICAgICBjaGFuZ2UsXG4gICAgICBOb2RlSURTdHJpbmdUb0J1ZmZlcihub2RlSUQpLFxuICAgICAgc3RhcnRUaW1lLFxuICAgICAgZW5kVGltZSxcbiAgICAgIHN0YWtlQW1vdW50LFxuICAgICAgcmV3YXJkTG9ja3RpbWUsXG4gICAgICByZXdhcmRUaHJlc2hvbGQsXG4gICAgICByZXdhcmRzLFxuICAgICAgWmVyb0JOLFxuICAgICAgYXZheEFzc2V0SUQsXG4gICAgICBtZW1vLFxuICAgICAgYXNPZixcbiAgICAgIHRvVGhyZXNob2xkLFxuICAgICAgY2hhbmdlVGhyZXNob2xkXG4gICAgKVxuXG4gICAgaWYgKCEoYXdhaXQgdGhpcy5jaGVja0dvb3NlRWdnKGJ1aWx0VW5zaWduZWRUeCkpKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEdvb3NlRWdnQ2hlY2tFcnJvcihcIkZhaWxlZCBHb29zZSBFZ2cgQ2hlY2tcIilcbiAgICB9XG5cbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4XG4gIH1cblxuICAvKipcbiAgICogSGVscGVyIGZ1bmN0aW9uIHdoaWNoIGNyZWF0ZXMgYW4gdW5zaWduZWQgW1tBZGRWYWxpZGF0b3JUeF1dLiBGb3IgbW9yZSBncmFudWxhciBjb250cm9sLCB5b3UgbWF5IGNyZWF0ZSB5b3VyIG93blxuICAgKiBbW1Vuc2lnbmVkVHhdXSBtYW51YWxseSBhbmQgaW1wb3J0IHRoZSBbW0FkZFZhbGlkYXRvclR4XV0gY2xhc3MgZGlyZWN0bHkuXG4gICAqXG4gICAqIEBwYXJhbSB1dHhvc2V0IEEgc2V0IG9mIFVUWE9zIHRoYXQgdGhlIHRyYW5zYWN0aW9uIGlzIGJ1aWx0IG9uXG4gICAqIEBwYXJhbSB0b0FkZHJlc3NlcyBBbiBhcnJheSBvZiBhZGRyZXNzZXMgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2hvIHJlY2VpdmVkIHRoZSBzdGFrZWQgdG9rZW5zIGF0IHRoZSBlbmQgb2YgdGhlIHN0YWtpbmcgcGVyaW9kXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB3aG8gb3duIHRoZSBzdGFraW5nIFVUWE9zIHRoZSBmZWVzIGluIEFWQVhcbiAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBBbiBhcnJheSBvZiBhZGRyZXNzZXMgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2hvIGdldHMgdGhlIGNoYW5nZSBsZWZ0b3ZlciBmcm9tIHRoZSBmZWUgcGF5bWVudFxuICAgKiBAcGFyYW0gbm9kZUlEIFRoZSBub2RlIElEIG9mIHRoZSB2YWxpZGF0b3IgYmVpbmcgYWRkZWQuXG4gICAqIEBwYXJhbSBzdGFydFRpbWUgVGhlIFVuaXggdGltZSB3aGVuIHRoZSB2YWxpZGF0b3Igc3RhcnRzIHZhbGlkYXRpbmcgdGhlIFByaW1hcnkgTmV0d29yay5cbiAgICogQHBhcmFtIGVuZFRpbWUgVGhlIFVuaXggdGltZSB3aGVuIHRoZSB2YWxpZGF0b3Igc3RvcHMgdmFsaWRhdGluZyB0aGUgUHJpbWFyeSBOZXR3b3JrIChhbmQgc3Rha2VkIEFWQVggaXMgcmV0dXJuZWQpLlxuICAgKiBAcGFyYW0gc3Rha2VBbW91bnQgVGhlIGFtb3VudCBiZWluZyBkZWxlZ2F0ZWQgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gcmV3YXJkQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgd2hpY2ggd2lsbCByZWNpZXZlIHRoZSByZXdhcmRzIGZyb20gdGhlIGRlbGVnYXRlZCBzdGFrZS5cbiAgICogQHBhcmFtIGRlbGVnYXRpb25GZWUgQSBudW1iZXIgZm9yIHRoZSBwZXJjZW50YWdlIG9mIHJld2FyZCB0byBiZSBnaXZlbiB0byB0aGUgdmFsaWRhdG9yIHdoZW4gc29tZW9uZSBkZWxlZ2F0ZXMgdG8gdGhlbS4gTXVzdCBiZSBiZXR3ZWVuIDAgYW5kIDEwMC5cbiAgICogQHBhcmFtIHJld2FyZExvY2t0aW1lIE9wdGlvbmFsLiBUaGUgbG9ja3RpbWUgZmllbGQgY3JlYXRlZCBpbiB0aGUgcmVzdWx0aW5nIHJld2FyZCBvdXRwdXRzXG4gICAqIEBwYXJhbSByZXdhcmRUaHJlc2hvbGQgT3Bpb25hbC4gVGhlIG51bWJlciBvZiBzaWduYXR1cmVzIHJlcXVpcmVkIHRvIHNwZW5kIHRoZSBmdW5kcyBpbiB0aGUgcmVzdWx0YW50IHJld2FyZCBVVFhPLiBEZWZhdWx0IDEuXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSB0b1RocmVzaG9sZCBPcHRpb25hbC4gVGhlIG51bWJlciBvZiBzaWduYXR1cmVzIHJlcXVpcmVkIHRvIHNwZW5kIHRoZSBmdW5kcyBpbiB0aGUgcmVzdWx0YW50IFVUWE9cbiAgICogQHBhcmFtIGNoYW5nZVRocmVzaG9sZCBPcHRpb25hbC4gVGhlIG51bWJlciBvZiBzaWduYXR1cmVzIHJlcXVpcmVkIHRvIHNwZW5kIHRoZSBmdW5kcyBpbiB0aGUgcmVzdWx0YW50IGNoYW5nZSBVVFhPXG4gICAqXG4gICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIGNyZWF0ZWQgZnJvbSB0aGUgcGFzc2VkIGluIHBhcmFtZXRlcnMuXG4gICAqL1xuICBidWlsZEFkZFZhbGlkYXRvclR4ID0gYXN5bmMgKFxuICAgIHV0eG9zZXQ6IFVUWE9TZXQsXG4gICAgdG9BZGRyZXNzZXM6IHN0cmluZ1tdLFxuICAgIGZyb21BZGRyZXNzZXM6IEZyb21UeXBlLFxuICAgIGNoYW5nZUFkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgbm9kZUlEOiBzdHJpbmcsXG4gICAgc3RhcnRUaW1lOiBCTixcbiAgICBlbmRUaW1lOiBCTixcbiAgICBzdGFrZUFtb3VudDogQk4sXG4gICAgcmV3YXJkQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICBkZWxlZ2F0aW9uRmVlOiBudW1iZXIsXG4gICAgcmV3YXJkTG9ja3RpbWU6IEJOID0gWmVyb0JOLFxuICAgIHJld2FyZFRocmVzaG9sZDogbnVtYmVyID0gMSxcbiAgICBtZW1vOiBQYXlsb2FkQmFzZSB8IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBhc09mOiBCTiA9IFplcm9CTixcbiAgICB0b1RocmVzaG9sZDogbnVtYmVyID0gMSxcbiAgICBjaGFuZ2VUaHJlc2hvbGQ6IG51bWJlciA9IDFcbiAgKTogUHJvbWlzZTxVbnNpZ25lZFR4PiA9PiB7XG4gICAgY29uc3QgY2FsbGVyID0gXCJidWlsZEFkZFZhbGlkYXRvclR4XCJcblxuICAgIGNvbnN0IHRvOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5QnVmZmVyKHRvQWRkcmVzc2VzLCBjYWxsZXIpXG5cbiAgICBjb25zdCBmcm9tU2lnbmVyID0gdGhpcy5fcGFyc2VGcm9tU2lnbmVyKGZyb21BZGRyZXNzZXMsIGNhbGxlcilcblxuICAgIGNvbnN0IGNoYW5nZTogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheUJ1ZmZlcihcbiAgICAgIGNoYW5nZUFkZHJlc3NlcyxcbiAgICAgIGNhbGxlclxuICAgIClcbiAgICBjb25zdCByZXdhcmRzOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5QnVmZmVyKFxuICAgICAgcmV3YXJkQWRkcmVzc2VzLFxuICAgICAgY2FsbGVyXG4gICAgKVxuXG4gICAgaWYgKG1lbW8gaW5zdGFuY2VvZiBQYXlsb2FkQmFzZSkge1xuICAgICAgbWVtbyA9IG1lbW8uZ2V0UGF5bG9hZCgpXG4gICAgfVxuXG4gICAgY29uc3QgbWluU3Rha2U6IEJOID0gKGF3YWl0IHRoaXMuZ2V0TWluU3Rha2UoKSlbXCJtaW5WYWxpZGF0b3JTdGFrZVwiXVxuICAgIGlmIChzdGFrZUFtb3VudC5sdChtaW5TdGFrZSkpIHtcbiAgICAgIHRocm93IG5ldyBTdGFrZUVycm9yKFxuICAgICAgICBcIlBsYXRmb3JtVk1BUEkuYnVpbGRBZGRWYWxpZGF0b3JUeCAtLSBzdGFrZSBhbW91bnQgbXVzdCBiZSBhdCBsZWFzdCBcIiArXG4gICAgICAgICAgbWluU3Rha2UudG9TdHJpbmcoMTApXG4gICAgICApXG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgdHlwZW9mIGRlbGVnYXRpb25GZWUgIT09IFwibnVtYmVyXCIgfHxcbiAgICAgIGRlbGVnYXRpb25GZWUgPiAxMDAgfHxcbiAgICAgIGRlbGVnYXRpb25GZWUgPCAwXG4gICAgKSB7XG4gICAgICB0aHJvdyBuZXcgRGVsZWdhdGlvbkZlZUVycm9yKFxuICAgICAgICBcIlBsYXRmb3JtVk1BUEkuYnVpbGRBZGRWYWxpZGF0b3JUeCAtLSBkZWxlZ2F0aW9uRmVlIG11c3QgYmUgYSBudW1iZXIgYmV0d2VlbiAwIGFuZCAxMDBcIlxuICAgICAgKVxuICAgIH1cblxuICAgIGNvbnN0IGF2YXhBc3NldElEOiBCdWZmZXIgPSBhd2FpdCB0aGlzLmdldEFWQVhBc3NldElEKClcblxuICAgIGNvbnN0IG5vdzogQk4gPSBVbml4Tm93KClcbiAgICBpZiAoc3RhcnRUaW1lLmx0KG5vdykgfHwgZW5kVGltZS5sdGUoc3RhcnRUaW1lKSkge1xuICAgICAgdGhyb3cgbmV3IFRpbWVFcnJvcihcbiAgICAgICAgXCJQbGF0Zm9ybVZNQVBJLmJ1aWxkQWRkVmFsaWRhdG9yVHggLS0gc3RhcnRUaW1lIG11c3QgYmUgaW4gdGhlIGZ1dHVyZSBhbmQgZW5kVGltZSBtdXN0IGNvbWUgYWZ0ZXIgc3RhcnRUaW1lXCJcbiAgICAgIClcbiAgICB9XG5cbiAgICBjb25zdCBidWlsdFVuc2lnbmVkVHg6IFVuc2lnbmVkVHggPSBhd2FpdCB0aGlzLl9nZXRCdWlsZGVyKFxuICAgICAgdXR4b3NldFxuICAgICkuYnVpbGRBZGRWYWxpZGF0b3JUeChcbiAgICAgIHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKSxcbiAgICAgIGJpbnRvb2xzLmNiNThEZWNvZGUodGhpcy5ibG9ja2NoYWluSUQpLFxuICAgICAgdG8sXG4gICAgICBmcm9tU2lnbmVyLFxuICAgICAgY2hhbmdlLFxuICAgICAgTm9kZUlEU3RyaW5nVG9CdWZmZXIobm9kZUlEKSxcbiAgICAgIHN0YXJ0VGltZSxcbiAgICAgIGVuZFRpbWUsXG4gICAgICBzdGFrZUFtb3VudCxcbiAgICAgIGF2YXhBc3NldElELFxuICAgICAgcmV3YXJkTG9ja3RpbWUsXG4gICAgICByZXdhcmRUaHJlc2hvbGQsXG4gICAgICByZXdhcmRzLFxuICAgICAgZGVsZWdhdGlvbkZlZSxcbiAgICAgIFplcm9CTixcbiAgICAgIGF2YXhBc3NldElELFxuICAgICAgbWVtbyxcbiAgICAgIGFzT2YsXG4gICAgICB0b1RocmVzaG9sZCxcbiAgICAgIGNoYW5nZVRocmVzaG9sZFxuICAgIClcblxuICAgIGlmICghKGF3YWl0IHRoaXMuY2hlY2tHb29zZUVnZyhidWlsdFVuc2lnbmVkVHgpKSkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBHb29zZUVnZ0NoZWNrRXJyb3IoXCJGYWlsZWQgR29vc2UgRWdnIENoZWNrXCIpXG4gICAgfVxuXG4gICAgcmV0dXJuIGJ1aWx0VW5zaWduZWRUeFxuICB9XG5cbiAgLyoqXG4gICAqIENsYXNzIHJlcHJlc2VudGluZyBhbiB1bnNpZ25lZCBbW0NyZWF0ZVN1Ym5ldFR4XV0gdHJhbnNhY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSB1dHhvc2V0IEEgc2V0IG9mIFVUWE9zIHRoYXQgdGhlIHRyYW5zYWN0aW9uIGlzIGJ1aWx0IG9uXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBzZW5kIHRoZSBmdW5kcyBmcm9tIHRoZSBVVFhPcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfVxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3NcbiAgICogQHBhcmFtIHN1Ym5ldE93bmVyQWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBmb3Igb3duZXJzIG9mIHRoZSBuZXcgc3VibmV0XG4gICAqIEBwYXJhbSBzdWJuZXRPd25lclRocmVzaG9sZCBBIG51bWJlciBpbmRpY2F0aW5nIHRoZSBhbW91bnQgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBhZGQgdmFsaWRhdG9ycyB0byBhIHN1Ym5ldFxuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xuICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gY2hhbmdlVGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgY2hhbmdlIFVUWE9cbiAgICpcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gY3JlYXRlZCBmcm9tIHRoZSBwYXNzZWQgaW4gcGFyYW1ldGVycy5cbiAgICovXG4gIGJ1aWxkQ3JlYXRlU3VibmV0VHggPSBhc3luYyAoXG4gICAgdXR4b3NldDogVVRYT1NldCxcbiAgICBmcm9tQWRkcmVzc2VzOiBGcm9tVHlwZSxcbiAgICBjaGFuZ2VBZGRyZXNzZXM6IHN0cmluZ1tdLFxuICAgIHN1Ym5ldE93bmVyQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICBzdWJuZXRPd25lclRocmVzaG9sZDogbnVtYmVyLFxuICAgIG1lbW86IFBheWxvYWRCYXNlIHwgQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGFzT2Y6IEJOID0gWmVyb0JOLFxuICAgIGNoYW5nZVRocmVzaG9sZDogbnVtYmVyID0gMVxuICApOiBQcm9taXNlPFVuc2lnbmVkVHg+ID0+IHtcbiAgICBjb25zdCBjYWxsZXIgPSBcImJ1aWxkQ3JlYXRlU3VibmV0VHhcIlxuXG4gICAgY29uc3QgZnJvbVNpZ25lciA9IHRoaXMuX3BhcnNlRnJvbVNpZ25lcihmcm9tQWRkcmVzc2VzLCBjYWxsZXIpXG5cbiAgICBjb25zdCBjaGFuZ2U6IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXlCdWZmZXIoXG4gICAgICBjaGFuZ2VBZGRyZXNzZXMsXG4gICAgICBjYWxsZXJcbiAgICApXG4gICAgY29uc3Qgb3duZXJzOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5QnVmZmVyKFxuICAgICAgc3VibmV0T3duZXJBZGRyZXNzZXMsXG4gICAgICBjYWxsZXJcbiAgICApXG5cbiAgICBpZiAobWVtbyBpbnN0YW5jZW9mIFBheWxvYWRCYXNlKSB7XG4gICAgICBtZW1vID0gbWVtby5nZXRQYXlsb2FkKClcbiAgICB9XG5cbiAgICBjb25zdCBhdmF4QXNzZXRJRDogQnVmZmVyID0gYXdhaXQgdGhpcy5nZXRBVkFYQXNzZXRJRCgpXG4gICAgY29uc3QgbmV0d29ya0lEOiBudW1iZXIgPSB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKClcbiAgICBjb25zdCBibG9ja2NoYWluSUQ6IEJ1ZmZlciA9IGJpbnRvb2xzLmNiNThEZWNvZGUodGhpcy5ibG9ja2NoYWluSUQpXG4gICAgY29uc3QgZmVlOiBCTiA9IHRoaXMuZ2V0Q3JlYXRlU3VibmV0VHhGZWUoKVxuXG4gICAgY29uc3QgYnVpbHRVbnNpZ25lZFR4OiBVbnNpZ25lZFR4ID0gYXdhaXQgdGhpcy5fZ2V0QnVpbGRlcihcbiAgICAgIHV0eG9zZXRcbiAgICApLmJ1aWxkQ3JlYXRlU3VibmV0VHgoXG4gICAgICBuZXR3b3JrSUQsXG4gICAgICBibG9ja2NoYWluSUQsXG4gICAgICBmcm9tU2lnbmVyLFxuICAgICAgY2hhbmdlLFxuICAgICAgb3duZXJzLFxuICAgICAgc3VibmV0T3duZXJUaHJlc2hvbGQsXG4gICAgICBmZWUsXG4gICAgICBhdmF4QXNzZXRJRCxcbiAgICAgIG1lbW8sXG4gICAgICBhc09mLFxuICAgICAgY2hhbmdlVGhyZXNob2xkXG4gICAgKVxuXG4gICAgaWYgKCEoYXdhaXQgdGhpcy5jaGVja0dvb3NlRWdnKGJ1aWx0VW5zaWduZWRUeCwgdGhpcy5nZXRDcmVhdGlvblR4RmVlKCkpKSkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBHb29zZUVnZ0NoZWNrRXJyb3IoXCJGYWlsZWQgR29vc2UgRWdnIENoZWNrXCIpXG4gICAgfVxuXG4gICAgcmV0dXJuIGJ1aWx0VW5zaWduZWRUeFxuICB9XG5cbiAgLyoqXG4gICAqIEJ1aWxkIGFuIHVuc2lnbmVkIFtbQ3JlYXRlQ2hhaW5UeF1dLlxuICAgKlxuICAgKiBAcGFyYW0gdXR4b3NldCBBIHNldCBvZiBVVFhPcyB0aGF0IHRoZSB0cmFuc2FjdGlvbiBpcyBidWlsdCBvblxuICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGJlaW5nIHVzZWQgdG8gc2VuZCB0aGUgZnVuZHMgZnJvbSB0aGUgVVRYT3Mge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1cbiAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRoYXQgY2FuIHNwZW5kIHRoZSBjaGFuZ2UgcmVtYWluaW5nIGZyb20gdGhlIHNwZW50IFVUWE9zXG4gICAqIEBwYXJhbSBzdWJuZXRJRCBPcHRpb25hbCBJRCBvZiB0aGUgU3VibmV0IHRoYXQgdmFsaWRhdGVzIHRoaXMgYmxvY2tjaGFpblxuICAgKiBAcGFyYW0gY2hhaW5OYW1lIE9wdGlvbmFsIEEgaHVtYW4gcmVhZGFibGUgbmFtZSBmb3IgdGhlIGNoYWluOyBuZWVkIG5vdCBiZSB1bmlxdWVcbiAgICogQHBhcmFtIHZtSUQgT3B0aW9uYWwgSUQgb2YgdGhlIFZNIHJ1bm5pbmcgb24gdGhlIG5ldyBjaGFpblxuICAgKiBAcGFyYW0gZnhJRHMgT3B0aW9uYWwgSURzIG9mIHRoZSBmZWF0dXJlIGV4dGVuc2lvbnMgcnVubmluZyBvbiB0aGUgbmV3IGNoYWluXG4gICAqIEBwYXJhbSBnZW5lc2lzRGF0YSBPcHRpb25hbCBCeXRlIHJlcHJlc2VudGF0aW9uIG9mIGdlbmVzaXMgc3RhdGUgb2YgdGhlIG5ldyBjaGFpblxuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xuICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gc3VibmV0QXV0aCBPcHRpb25hbC4gQW4gQXV0aCBzdHJ1Y3Qgd2hpY2ggY29udGFpbnMgdGhlIHN1Ym5ldCBBdXRoIGFuZCB0aGUgc2lnbmVycy5cbiAgICogQHBhcmFtIGNoYW5nZVRocmVzaG9sZCBPcHRpb25hbC4gVGhlIG51bWJlciBvZiBzaWduYXR1cmVzIHJlcXVpcmVkIHRvIHNwZW5kIHRoZSBmdW5kcyBpbiB0aGUgcmVzdWx0YW50IGNoYW5nZSBVVFhPXG4gICAqXG4gICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIGNyZWF0ZWQgZnJvbSB0aGUgcGFzc2VkIGluIHBhcmFtZXRlcnMuXG4gICAqL1xuICBidWlsZENyZWF0ZUNoYWluVHggPSBhc3luYyAoXG4gICAgdXR4b3NldDogVVRYT1NldCxcbiAgICBmcm9tQWRkcmVzc2VzOiBGcm9tVHlwZSxcbiAgICBjaGFuZ2VBZGRyZXNzZXM6IHN0cmluZ1tdLFxuICAgIHN1Ym5ldElEOiBzdHJpbmcgfCBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgY2hhaW5OYW1lOiBzdHJpbmcgPSB1bmRlZmluZWQsXG4gICAgdm1JRDogc3RyaW5nID0gdW5kZWZpbmVkLFxuICAgIGZ4SURzOiBzdHJpbmdbXSA9IHVuZGVmaW5lZCxcbiAgICBnZW5lc2lzRGF0YTogc3RyaW5nIHwgR2VuZXNpc0RhdGEgPSB1bmRlZmluZWQsXG4gICAgbWVtbzogUGF5bG9hZEJhc2UgfCBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgYXNPZjogQk4gPSBaZXJvQk4sXG4gICAgc3VibmV0QXV0aDogQXV0aCA9IHsgYWRkcmVzc2VzOiBbXSwgdGhyZXNob2xkOiAwLCBzaWduZXI6IFtdIH0sXG4gICAgY2hhbmdlVGhyZXNob2xkOiBudW1iZXIgPSAxXG4gICk6IFByb21pc2U8VW5zaWduZWRUeD4gPT4ge1xuICAgIGNvbnN0IGNhbGxlciA9IFwiYnVpbGRDcmVhdGVDaGFpblR4XCJcblxuICAgIGNvbnN0IGZyb21TaWduZXIgPSB0aGlzLl9wYXJzZUZyb21TaWduZXIoZnJvbUFkZHJlc3NlcywgY2FsbGVyKVxuXG4gICAgY29uc3QgY2hhbmdlOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5QnVmZmVyKFxuICAgICAgY2hhbmdlQWRkcmVzc2VzLFxuICAgICAgY2FsbGVyXG4gICAgKVxuXG4gICAgaWYgKG1lbW8gaW5zdGFuY2VvZiBQYXlsb2FkQmFzZSkge1xuICAgICAgbWVtbyA9IG1lbW8uZ2V0UGF5bG9hZCgpXG4gICAgfVxuXG4gICAgY29uc3QgYXZheEFzc2V0SUQ6IEJ1ZmZlciA9IGF3YWl0IHRoaXMuZ2V0QVZBWEFzc2V0SUQoKVxuICAgIGZ4SURzID0gZnhJRHMuc29ydCgpXG5cbiAgICBjb25zdCBuZXR3b3JrSUQ6IG51bWJlciA9IHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKVxuICAgIGNvbnN0IGJsb2NrY2hhaW5JRDogQnVmZmVyID0gYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRClcbiAgICBjb25zdCBmZWU6IEJOID0gdGhpcy5nZXRDcmVhdGVDaGFpblR4RmVlKClcblxuICAgIGNvbnN0IGJ1aWx0VW5zaWduZWRUeDogVW5zaWduZWRUeCA9IGF3YWl0IHRoaXMuX2dldEJ1aWxkZXIoXG4gICAgICB1dHhvc2V0XG4gICAgKS5idWlsZENyZWF0ZUNoYWluVHgoXG4gICAgICBuZXR3b3JrSUQsXG4gICAgICBibG9ja2NoYWluSUQsXG4gICAgICBmcm9tU2lnbmVyLFxuICAgICAgY2hhbmdlLFxuICAgICAgc3VibmV0SUQsXG4gICAgICBjaGFpbk5hbWUsXG4gICAgICB2bUlELFxuICAgICAgZnhJRHMsXG4gICAgICBnZW5lc2lzRGF0YSxcbiAgICAgIGZlZSxcbiAgICAgIGF2YXhBc3NldElELFxuICAgICAgbWVtbyxcbiAgICAgIGFzT2YsXG4gICAgICBzdWJuZXRBdXRoLFxuICAgICAgY2hhbmdlVGhyZXNob2xkXG4gICAgKVxuXG4gICAgaWYgKCEoYXdhaXQgdGhpcy5jaGVja0dvb3NlRWdnKGJ1aWx0VW5zaWduZWRUeCwgdGhpcy5nZXRDcmVhdGlvblR4RmVlKCkpKSkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBHb29zZUVnZ0NoZWNrRXJyb3IoXCJGYWlsZWQgR29vc2UgRWdnIENoZWNrXCIpXG4gICAgfVxuXG4gICAgcmV0dXJuIGJ1aWx0VW5zaWduZWRUeFxuICB9XG4gIC8qKlxuICAgKiBCdWlsZCBhbiB1bnNpZ25lZCBbW0FkZHJlc3NTdGF0ZVR4XV0uXG4gICAqXG4gICAqIEBwYXJhbSB1dHhvc2V0IEEgc2V0IG9mIFVUWE9zIHRoYXQgdGhlIHRyYW5zYWN0aW9uIGlzIGJ1aWx0IG9uXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBzZW5kIHRoZSBmdW5kcyBmcm9tIHRoZSBVVFhPcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfVxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3MuXG4gICAqIEBwYXJhbSBhZGRyZXNzIFRoZSBhZGRyZXNzIHRvIGFsdGVyIHN0YXRlLlxuICAgKiBAcGFyYW0gc3RhdGUgVGhlIHN0YXRlIHRvIHNldCBvciByZW1vdmUgb24gdGhlIGdpdmVuIGFkZHJlc3NcbiAgICogQHBhcmFtIHJlbW92ZSBPcHRpb25hbC4gRmxhZyBpZiBzdGF0ZSBzaG91bGQgYmUgYXBwbGllZCBvciByZW1vdmVkXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBjaGFuZ2VUaHJlc2hvbGQgT3B0aW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCBjaGFuZ2UgVVRYT1xuICAgKlxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCBBZGRyZXNzU3RhdGVUeCBjcmVhdGVkIGZyb20gdGhlIHBhc3NlZCBpbiBwYXJhbWV0ZXJzLlxuICAgKi9cbiAgYnVpbGRBZGRyZXNzU3RhdGVUeCA9IGFzeW5jIChcbiAgICB1dHhvc2V0OiBVVFhPU2V0LFxuICAgIGZyb21BZGRyZXNzZXM6IEZyb21UeXBlLFxuICAgIGNoYW5nZUFkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgYWRkcmVzczogc3RyaW5nIHwgQnVmZmVyLFxuICAgIHN0YXRlOiBudW1iZXIsXG4gICAgcmVtb3ZlOiBib29sZWFuID0gZmFsc2UsXG4gICAgbWVtbzogQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGFzT2Y6IEJOID0gWmVyb0JOLFxuICAgIGNoYW5nZVRocmVzaG9sZDogbnVtYmVyID0gMVxuICApOiBQcm9taXNlPFVuc2lnbmVkVHg+ID0+IHtcbiAgICBjb25zdCBjYWxsZXIgPSBcImJ1aWxkQWRkcmVzc1N0YXRlVHhcIlxuXG4gICAgY29uc3QgZnJvbVNpZ25lciA9IHRoaXMuX3BhcnNlRnJvbVNpZ25lcihmcm9tQWRkcmVzc2VzLCBjYWxsZXIpXG5cbiAgICBjb25zdCBjaGFuZ2U6IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXlCdWZmZXIoXG4gICAgICBjaGFuZ2VBZGRyZXNzZXMsXG4gICAgICBjYWxsZXJcbiAgICApXG4gICAgY29uc3QgYWRkcmVzc0J1ZiA9XG4gICAgICB0eXBlb2YgYWRkcmVzcyA9PT0gXCJzdHJpbmdcIiA/IHRoaXMucGFyc2VBZGRyZXNzKGFkZHJlc3MpIDogYWRkcmVzc1xuICAgIGlmIChtZW1vIGluc3RhbmNlb2YgUGF5bG9hZEJhc2UpIHtcbiAgICAgIG1lbW8gPSBtZW1vLmdldFBheWxvYWQoKVxuICAgIH1cblxuICAgIGNvbnN0IGF2YXhBc3NldElEOiBCdWZmZXIgPSBhd2FpdCB0aGlzLmdldEFWQVhBc3NldElEKClcbiAgICBjb25zdCBuZXR3b3JrSUQ6IG51bWJlciA9IHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKVxuICAgIGNvbnN0IGJsb2NrY2hhaW5JRDogQnVmZmVyID0gYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRClcbiAgICBjb25zdCBmZWU6IEJOID0gdGhpcy5nZXRUeEZlZSgpXG5cbiAgICBjb25zdCBidWlsdFVuc2lnbmVkVHg6IFVuc2lnbmVkVHggPSBhd2FpdCB0aGlzLl9nZXRCdWlsZGVyKFxuICAgICAgdXR4b3NldFxuICAgICkuYnVpbGRBZGRyZXNzU3RhdGVUeChcbiAgICAgIG5ldHdvcmtJRCxcbiAgICAgIGJsb2NrY2hhaW5JRCxcbiAgICAgIGZyb21TaWduZXIsXG4gICAgICBjaGFuZ2UsXG4gICAgICBhZGRyZXNzQnVmLFxuICAgICAgc3RhdGUsXG4gICAgICByZW1vdmUsXG4gICAgICBmZWUsXG4gICAgICBhdmF4QXNzZXRJRCxcbiAgICAgIG1lbW8sXG4gICAgICBhc09mLFxuICAgICAgY2hhbmdlVGhyZXNob2xkXG4gICAgKVxuXG4gICAgaWYgKCEoYXdhaXQgdGhpcy5jaGVja0dvb3NlRWdnKGJ1aWx0VW5zaWduZWRUeCwgdGhpcy5nZXRDcmVhdGlvblR4RmVlKCkpKSkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBHb29zZUVnZ0NoZWNrRXJyb3IoXCJGYWlsZWQgR29vc2UgRWdnIENoZWNrXCIpXG4gICAgfVxuXG4gICAgcmV0dXJuIGJ1aWx0VW5zaWduZWRUeFxuICB9XG5cbiAgLyoqXG4gICAqIEJ1aWxkIGFuIHVuc2lnbmVkIFtbUmVnaXN0ZXJOb2RlVHhdXS5cbiAgICpcbiAgICogQHBhcmFtIHV0eG9zZXQgQSBzZXQgb2YgVVRYT3MgdGhhdCB0aGUgdHJhbnNhY3Rpb24gaXMgYnVpbHQgb25cbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIHNlbmQgdGhlIGZ1bmRzIGZyb20gdGhlIFVUWE9zIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0aGF0IGNhbiBzcGVuZCB0aGUgY2hhbmdlIHJlbWFpbmluZyBmcm9tIHRoZSBzcGVudCBVVFhPc1xuICAgKiBAcGFyYW0gb2xkTm9kZUlEIE9wdGlvbmFsLiBJRCBvZiB0aGUgZXhpc3RpbmcgTm9kZUlEIHRvIHJlcGxhY2Ugb3IgcmVtb3ZlLlxuICAgKiBAcGFyYW0gbmV3Tm9kZUlEIE9wdGlvbmFsLiBJRCBvZiB0aGUgbmV3Tm9kSUQgdG8gcmVnaXN0ZXIgYWRkcmVzcy5cbiAgICogQHBhcmFtIGFkZHJlc3MgVGhlIGNvbnNvcnRpdW1NZW1iZXJBZGRyZXNzLCBzaW5nbGUgb3IgbXVsdGktc2lnLlxuICAgKiBAcGFyYW0gYWRkcmVzc0F1dGhzIEFuIGFycmF5IG9mIGluZGV4IGFuZCBhZGRyZXNzIHRvIHZlcmlmeSBvd25lcnNoaXAgb2YgYWRkcmVzcy5cbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIGNoYW5nZVRocmVzaG9sZCBPcHRpb25hbC4gVGhlIG51bWJlciBvZiBzaWduYXR1cmVzIHJlcXVpcmVkIHRvIHNwZW5kIHRoZSBmdW5kcyBpbiB0aGUgcmVzdWx0YW50IGNoYW5nZSBVVFhPXG4gICAqXG4gICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIGNyZWF0ZWQgZnJvbSB0aGUgcGFzc2VkIGluIHBhcmFtZXRlcnMuXG4gICAqL1xuICBidWlsZFJlZ2lzdGVyTm9kZVR4ID0gYXN5bmMgKFxuICAgIHV0eG9zZXQ6IFVUWE9TZXQsXG4gICAgZnJvbUFkZHJlc3NlczogRnJvbVR5cGUsXG4gICAgY2hhbmdlQWRkcmVzc2VzOiBzdHJpbmdbXSA9IHVuZGVmaW5lZCxcbiAgICBvbGROb2RlSUQ6IHN0cmluZyB8IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBuZXdOb2RlSUQ6IHN0cmluZyB8IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBhZGRyZXNzOiBzdHJpbmcgfCBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgYWRkcmVzc0F1dGhzOiBbbnVtYmVyLCBzdHJpbmcgfCBCdWZmZXJdW10gPSBbXSxcbiAgICBtZW1vOiBQYXlsb2FkQmFzZSB8IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBhc09mOiBCTiA9IFplcm9CTixcbiAgICBjaGFuZ2VUaHJlc2hvbGQ6IG51bWJlciA9IDFcbiAgKTogUHJvbWlzZTxVbnNpZ25lZFR4PiA9PiB7XG4gICAgY29uc3QgY2FsbGVyID0gXCJidWlsZFJlZ2lzdGVyTm9kZVR4XCJcblxuICAgIGNvbnN0IGZyb21TaWduZXIgPSB0aGlzLl9wYXJzZUZyb21TaWduZXIoZnJvbUFkZHJlc3NlcywgY2FsbGVyKVxuXG4gICAgY29uc3QgY2hhbmdlOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5QnVmZmVyKFxuICAgICAgY2hhbmdlQWRkcmVzc2VzLFxuICAgICAgY2FsbGVyXG4gICAgKVxuICAgIGNvbnN0IGFkZHJCdWYgPVxuICAgICAgdHlwZW9mIGFkZHJlc3MgPT09IFwic3RyaW5nXCIgPyB0aGlzLnBhcnNlQWRkcmVzcyhhZGRyZXNzKSA6IGFkZHJlc3NcblxuICAgIGlmIChtZW1vIGluc3RhbmNlb2YgUGF5bG9hZEJhc2UpIHtcbiAgICAgIG1lbW8gPSBtZW1vLmdldFBheWxvYWQoKVxuICAgIH1cbiAgICBjb25zdCBhdXRoOiBbbnVtYmVyLCBCdWZmZXJdW10gPSBbXVxuICAgIGFkZHJlc3NBdXRocy5mb3JFYWNoKChjKSA9PiB7XG4gICAgICBhdXRoLnB1c2goW1xuICAgICAgICBjWzBdLFxuICAgICAgICB0eXBlb2YgY1sxXSA9PT0gXCJzdHJpbmdcIiA/IHRoaXMucGFyc2VBZGRyZXNzKGNbMV0pIDogY1sxXVxuICAgICAgXSlcbiAgICB9KVxuXG4gICAgaWYgKHR5cGVvZiBvbGROb2RlSUQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIG9sZE5vZGVJRCA9IE5vZGVJRFN0cmluZ1RvQnVmZmVyKG9sZE5vZGVJRClcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIG5ld05vZGVJRCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgbmV3Tm9kZUlEID0gTm9kZUlEU3RyaW5nVG9CdWZmZXIobmV3Tm9kZUlEKVxuICAgIH1cblxuICAgIGNvbnN0IGF2YXhBc3NldElEOiBCdWZmZXIgPSBhd2FpdCB0aGlzLmdldEFWQVhBc3NldElEKClcbiAgICBjb25zdCBuZXR3b3JrSUQ6IG51bWJlciA9IHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKVxuICAgIGNvbnN0IGJsb2NrY2hhaW5JRDogQnVmZmVyID0gYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRClcbiAgICBjb25zdCBmZWU6IEJOID0gdGhpcy5nZXRUeEZlZSgpXG5cbiAgICBjb25zdCBidWlsdFVuc2lnbmVkVHg6IFVuc2lnbmVkVHggPSBhd2FpdCB0aGlzLl9nZXRCdWlsZGVyKFxuICAgICAgdXR4b3NldFxuICAgICkuYnVpbGRSZWdpc3Rlck5vZGVUeChcbiAgICAgIG5ldHdvcmtJRCxcbiAgICAgIGJsb2NrY2hhaW5JRCxcbiAgICAgIGZyb21TaWduZXIsXG4gICAgICBjaGFuZ2UsXG4gICAgICBvbGROb2RlSUQsXG4gICAgICBuZXdOb2RlSUQsXG4gICAgICBhZGRyQnVmLFxuICAgICAgYXV0aCxcbiAgICAgIGZlZSxcbiAgICAgIGF2YXhBc3NldElELFxuICAgICAgbWVtbyxcbiAgICAgIGFzT2YsXG4gICAgICBjaGFuZ2VUaHJlc2hvbGRcbiAgICApXG5cbiAgICBpZiAoIShhd2FpdCB0aGlzLmNoZWNrR29vc2VFZ2coYnVpbHRVbnNpZ25lZFR4LCB0aGlzLmdldENyZWF0aW9uVHhGZWUoKSkpKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEdvb3NlRWdnQ2hlY2tFcnJvcihcIkZhaWxlZCBHb29zZSBFZ2cgQ2hlY2tcIilcbiAgICB9XG5cbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4XG4gIH1cblxuICAvKipcbiAgICogQnVpbGQgYW4gdW5zaWduZWQgW1tEZXBvc2l0VHhdXS5cbiAgICpcbiAgICogQHBhcmFtIHV0eG9zZXQgQSBzZXQgb2YgVVRYT3MgdGhhdCB0aGUgdHJhbnNhY3Rpb24gaXMgYnVpbHQgb25cbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIHNlbmQgdGhlIGZ1bmRzIGZyb20gdGhlIFVUWE9zIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0aGF0IGNhbiBzcGVuZCB0aGUgY2hhbmdlIHJlbWFpbmluZyBmcm9tIHRoZSBzcGVudCBVVFhPcy5cbiAgICogQHBhcmFtIGRlcG9zaXRPZmZlcklEIElEIG9mIHRoZSBkZXBvc2l0IG9mZmVyLlxuICAgKiBAcGFyYW0gZGVwb3NpdER1cmF0aW9uIER1cmF0aW9uIG9mIHRoZSBkZXBvc2l0XG4gICAqIEBwYXJhbSByZXdhcmRzT3duZXIgT3B0aW9uYWwgVGhlIG93bmVycyBvZiB0aGUgcmV3YXJkLiBJZiBvbWl0dGVkLCBhbGwgaW5wdXRzIG11c3QgaGF2ZSB0aGUgc2FtZSBvd25lclxuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xuICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gY2hhbmdlVGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgY2hhbmdlIFVUWE9cbiAgICpcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gY3JlYXRlZCBmcm9tIHRoZSBwYXNzZWQgaW4gcGFyYW1ldGVycy5cbiAgICovXG4gIGJ1aWxkRGVwb3NpdFR4ID0gYXN5bmMgKFxuICAgIHV0eG9zZXQ6IFVUWE9TZXQsXG4gICAgZnJvbUFkZHJlc3NlczogRnJvbVR5cGUsXG4gICAgY2hhbmdlQWRkcmVzc2VzOiBzdHJpbmdbXSA9IHVuZGVmaW5lZCxcbiAgICBkZXBvc2l0T2ZmZXJJRDogc3RyaW5nIHwgQnVmZmVyLFxuICAgIGRlcG9zaXREdXJhdGlvbjogbnVtYmVyIHwgQnVmZmVyLFxuICAgIHJld2FyZHNPd25lcjogT3V0cHV0T3duZXJzID0gdW5kZWZpbmVkLFxuICAgIG1lbW86IFBheWxvYWRCYXNlIHwgQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGFzT2Y6IEJOID0gWmVyb0JOLFxuICAgIGFtb3VudFRvTG9jazogQk4sXG4gICAgY2hhbmdlVGhyZXNob2xkOiBudW1iZXIgPSAxXG4gICk6IFByb21pc2U8VW5zaWduZWRUeD4gPT4ge1xuICAgIGNvbnN0IGNhbGxlciA9IFwiYnVpbGRSZWdpc3Rlck5vZGVUeFwiXG5cbiAgICBjb25zdCBmcm9tU2lnbmVyID0gdGhpcy5fcGFyc2VGcm9tU2lnbmVyKGZyb21BZGRyZXNzZXMsIGNhbGxlcilcblxuICAgIGNvbnN0IGNoYW5nZTogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheUJ1ZmZlcihcbiAgICAgIGNoYW5nZUFkZHJlc3NlcyxcbiAgICAgIGNhbGxlclxuICAgIClcblxuICAgIGlmIChtZW1vIGluc3RhbmNlb2YgUGF5bG9hZEJhc2UpIHtcbiAgICAgIG1lbW8gPSBtZW1vLmdldFBheWxvYWQoKVxuICAgIH1cblxuICAgIGNvbnN0IGF2YXhBc3NldElEOiBCdWZmZXIgPSBhd2FpdCB0aGlzLmdldEFWQVhBc3NldElEKClcbiAgICBjb25zdCBuZXR3b3JrSUQ6IG51bWJlciA9IHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKVxuICAgIGNvbnN0IGJsb2NrY2hhaW5JRDogQnVmZmVyID0gYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRClcbiAgICBjb25zdCBmZWU6IEJOID0gdGhpcy5nZXRUeEZlZSgpXG5cbiAgICBjb25zdCBidWlsdFVuc2lnbmVkVHg6IFVuc2lnbmVkVHggPSBhd2FpdCB0aGlzLl9nZXRCdWlsZGVyKFxuICAgICAgdXR4b3NldFxuICAgICkuYnVpbGREZXBvc2l0VHgoXG4gICAgICBuZXR3b3JrSUQsXG4gICAgICBibG9ja2NoYWluSUQsXG4gICAgICBmcm9tU2lnbmVyLFxuICAgICAgY2hhbmdlLFxuICAgICAgZGVwb3NpdE9mZmVySUQsXG4gICAgICBkZXBvc2l0RHVyYXRpb24sXG4gICAgICByZXdhcmRzT3duZXIsXG4gICAgICBmZWUsXG4gICAgICBhdmF4QXNzZXRJRCxcbiAgICAgIG1lbW8sXG4gICAgICBhc09mLFxuICAgICAgYW1vdW50VG9Mb2NrLFxuICAgICAgY2hhbmdlVGhyZXNob2xkXG4gICAgKVxuXG4gICAgaWYgKCEoYXdhaXQgdGhpcy5jaGVja0dvb3NlRWdnKGJ1aWx0VW5zaWduZWRUeCwgdGhpcy5nZXRDcmVhdGlvblR4RmVlKCkpKSkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBHb29zZUVnZ0NoZWNrRXJyb3IoXCJGYWlsZWQgR29vc2UgRWdnIENoZWNrXCIpXG4gICAgfVxuXG4gICAgcmV0dXJuIGJ1aWx0VW5zaWduZWRUeFxuICB9XG5cbiAgLyoqXG4gICAqIEJ1aWxkIGFuIHVuc2lnbmVkIFtbVW5sb2NrRGVwb3NpdFR4XV0uXG4gICAqXG4gICAqIEBwYXJhbSB1dHhvc2V0IEEgc2V0IG9mIFVUWE9zIHRoYXQgdGhlIHRyYW5zYWN0aW9uIGlzIGJ1aWx0IG9uXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBzZW5kIHRoZSBmdW5kcyBmcm9tIHRoZSBVVFhPcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfVxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3MuXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBjaGFuZ2VUaHJlc2hvbGQgT3B0aW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCBjaGFuZ2UgVVRYT1xuICAgKlxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiBjcmVhdGVkIGZyb20gdGhlIHBhc3NlZCBpbiBwYXJhbWV0ZXJzLlxuICAgKi9cbiAgYnVpbGRVbmxvY2tEZXBvc2l0VHggPSBhc3luYyAoXG4gICAgdXR4b3NldDogVVRYT1NldCxcbiAgICBmcm9tQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICBjaGFuZ2VBZGRyZXNzZXM6IHN0cmluZ1tdID0gdW5kZWZpbmVkLFxuICAgIG1lbW86IFBheWxvYWRCYXNlIHwgQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGFzT2Y6IEJOID0gWmVyb0JOLFxuICAgIGFtb3VudFRvTG9jazogQk4sXG4gICAgY2hhbmdlVGhyZXNob2xkOiBudW1iZXIgPSAxXG4gICk6IFByb21pc2U8VW5zaWduZWRUeD4gPT4ge1xuICAgIGNvbnN0IGNhbGxlciA9IFwiYnVpbGRVbmxvY2tEZXBvc2l0VHhcIlxuICAgIGNvbnN0IGZyb21TaWduZXIgPSB0aGlzLl9wYXJzZUZyb21TaWduZXIoZnJvbUFkZHJlc3NlcywgY2FsbGVyKVxuICAgIGNvbnN0IGNoYW5nZTogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheUJ1ZmZlcihcbiAgICAgIGNoYW5nZUFkZHJlc3NlcyxcbiAgICAgIGNhbGxlclxuICAgIClcbiAgICBpZiAobWVtbyBpbnN0YW5jZW9mIFBheWxvYWRCYXNlKSB7XG4gICAgICBtZW1vID0gbWVtby5nZXRQYXlsb2FkKClcbiAgICB9XG5cbiAgICBjb25zdCBhdmF4QXNzZXRJRDogQnVmZmVyID0gYXdhaXQgdGhpcy5nZXRBVkFYQXNzZXRJRCgpXG4gICAgY29uc3QgbmV0d29ya0lEOiBudW1iZXIgPSB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKClcbiAgICBjb25zdCBibG9ja2NoYWluSUQ6IEJ1ZmZlciA9IGJpbnRvb2xzLmNiNThEZWNvZGUodGhpcy5ibG9ja2NoYWluSUQpXG4gICAgY29uc3QgZmVlOiBCTiA9IHRoaXMuZ2V0VHhGZWUoKVxuXG4gICAgY29uc3QgYnVpbHRVbnNpZ25lZFR4OiBVbnNpZ25lZFR4ID0gYXdhaXQgdGhpcy5fZ2V0QnVpbGRlcihcbiAgICAgIHV0eG9zZXRcbiAgICApLmJ1aWxkVW5sb2NrRGVwb3NpdFR4KFxuICAgICAgbmV0d29ya0lELFxuICAgICAgYmxvY2tjaGFpbklELFxuICAgICAgZnJvbVNpZ25lcixcbiAgICAgIGNoYW5nZSxcbiAgICAgIGZlZSxcbiAgICAgIGF2YXhBc3NldElELFxuICAgICAgbWVtbyxcbiAgICAgIGFzT2YsXG4gICAgICBjaGFuZ2VUaHJlc2hvbGRcbiAgICApXG5cbiAgICBpZiAoIShhd2FpdCB0aGlzLmNoZWNrR29vc2VFZ2coYnVpbHRVbnNpZ25lZFR4LCB0aGlzLmdldENyZWF0aW9uVHhGZWUoKSkpKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEdvb3NlRWdnQ2hlY2tFcnJvcihcIkZhaWxlZCBHb29zZSBFZ2cgQ2hlY2tcIilcbiAgICB9XG5cbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4XG4gIH1cblxuICAvKipcbiAgICogQnVpbGQgYW4gdW5zaWduZWQgW1tDbGFpbVR4XV0uXG4gICAqXG4gICAqIEBwYXJhbSB1dHhvc2V0IEEgc2V0IG9mIFVUWE9zIHRoYXQgdGhlIHRyYW5zYWN0aW9uIGlzIGJ1aWx0IG9uXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBzZW5kIHRoZSBmdW5kcyBmcm9tIHRoZSBVVFhPcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfVxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3MuXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBjaGFuZ2VUaHJlc2hvbGQgT3B0aW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCBjaGFuZ2UgVVRYT1xuICAgKiBAcGFyYW0gZGVwb3NpdFR4cyBUaGUgZGVwb3NpdCB0cmFuc2FjdGlvbnMgd2l0aCB3aGljaCB0aGUgY2xhaWJsYWJsZSByZXdhcmRzIGFyZSBhc3NvY2lhdGVkXG4gICAqIEBwYXJhbSBjbGFpbWFibGVPd25lcklEcyBUaGUgb3duZXJJRHMgb2YgdGhlIHJld2FyZHMgdG8gY2xhaW1cbiAgICogQHBhcmFtIGNsYWltZWRBbW91bnRzIFRoZSBhbW91bnRzIG9mIHRoZSByZXdhcmRzIHRvIGNsYWltXG4gICAqIEBwYXJhbSBjbGFpbVRvIFRoZSBhZGRyZXNzIHRvIGNsYWltZWQgcmV3YXJkcyB3aWxsIGJlIGRpcmVjdGVkIHRvXG4gICAqIEBwYXJhbSBjbGFpbWFibGVTaWduZXJzIFRoZSBzaWduZXJzIG9mIHRoZSBjbGFpbWFibGUgcmV3YXJkc1xuICAgKlxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiBjcmVhdGVkIGZyb20gdGhlIHBhc3NlZCBpbiBwYXJhbWV0ZXJzLlxuICAgKi9cbiAgYnVpbGRDbGFpbVR4ID0gYXN5bmMgKFxuICAgIHV0eG9zZXQ6IFVUWE9TZXQsXG4gICAgZnJvbUFkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgY2hhbmdlQWRkcmVzc2VzOiBzdHJpbmdbXSA9IHVuZGVmaW5lZCxcbiAgICBtZW1vOiBQYXlsb2FkQmFzZSB8IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBhc09mOiBCTiA9IFplcm9CTixcbiAgICBjaGFuZ2VUaHJlc2hvbGQ6IG51bWJlciA9IDEsXG4gICAgZGVwb3NpdFR4czogc3RyaW5nW10gfCBCdWZmZXJbXSxcbiAgICBjbGFpbWFibGVPd25lcklEczogc3RyaW5nW10gfCBCdWZmZXJbXSxcbiAgICBjbGFpbWVkQW1vdW50czogQk5bXSxcbiAgICBjbGFpbVRvOiBPdXRwdXRPd25lcnMsXG4gICAgY2xhaW1hYmxlU2lnbmVyczogW251bWJlciwgQnVmZmVyXVtdID0gW11cbiAgKTogUHJvbWlzZTxVbnNpZ25lZFR4PiA9PiB7XG4gICAgY29uc3QgY2FsbGVyID0gXCJidWlsZENsYWltVHhcIlxuICAgIGNvbnN0IGZyb21TaWduZXIgPSB0aGlzLl9wYXJzZUZyb21TaWduZXIoZnJvbUFkZHJlc3NlcywgY2FsbGVyKVxuICAgIGNvbnN0IGNoYW5nZTogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheUJ1ZmZlcihcbiAgICAgIGNoYW5nZUFkZHJlc3NlcyxcbiAgICAgIGNhbGxlclxuICAgIClcbiAgICBpZiAobWVtbyBpbnN0YW5jZW9mIFBheWxvYWRCYXNlKSB7XG4gICAgICBtZW1vID0gbWVtby5nZXRQYXlsb2FkKClcbiAgICB9XG5cbiAgICBjb25zdCBhdmF4QXNzZXRJRDogQnVmZmVyID0gYXdhaXQgdGhpcy5nZXRBVkFYQXNzZXRJRCgpXG4gICAgY29uc3QgbmV0d29ya0lEOiBudW1iZXIgPSB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKClcbiAgICBjb25zdCBibG9ja2NoYWluSUQ6IEJ1ZmZlciA9IGJpbnRvb2xzLmNiNThEZWNvZGUodGhpcy5ibG9ja2NoYWluSUQpXG4gICAgY29uc3QgZmVlOiBCTiA9IHRoaXMuZ2V0VHhGZWUoKVxuXG4gICAgY29uc3QgdW5zaWduZWRDbGFpbVR4OiBVbnNpZ25lZFR4ID0gYXdhaXQgdGhpcy5fZ2V0QnVpbGRlcihcbiAgICAgIHV0eG9zZXRcbiAgICApLmJ1aWxkQ2xhaW1UeChcbiAgICAgIG5ldHdvcmtJRCxcbiAgICAgIGJsb2NrY2hhaW5JRCxcbiAgICAgIGZyb21TaWduZXIsXG4gICAgICBjaGFuZ2UsXG4gICAgICBmZWUsXG4gICAgICBhdmF4QXNzZXRJRCxcbiAgICAgIG1lbW8sXG4gICAgICBhc09mLFxuICAgICAgY2hhbmdlVGhyZXNob2xkLFxuICAgICAgZGVwb3NpdFR4cyxcbiAgICAgIGNsYWltYWJsZU93bmVySURzLFxuICAgICAgY2xhaW1lZEFtb3VudHMsXG4gICAgICBjbGFpbVRvLFxuICAgICAgY2xhaW1hYmxlU2lnbmVyc1xuICAgIClcblxuICAgIGlmICghKGF3YWl0IHRoaXMuY2hlY2tHb29zZUVnZyh1bnNpZ25lZENsYWltVHgsIHRoaXMuZ2V0Q3JlYXRpb25UeEZlZSgpKSkpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgR29vc2VFZ2dDaGVja0Vycm9yKFwiRmFpbGVkIEdvb3NlIEVnZyBDaGVja1wiKVxuICAgIH1cblxuICAgIHJldHVybiB1bnNpZ25lZENsYWltVHhcbiAgfVxuXG4gIC8qKlxuICAgKiBAaWdub3JlXG4gICAqL1xuICBwcm90ZWN0ZWQgX2NsZWFuQWRkcmVzc0FycmF5KFxuICAgIGFkZHJlc3Nlczogc3RyaW5nW10gfCBCdWZmZXJbXSxcbiAgICBjYWxsZXI6IHN0cmluZ1xuICApOiBzdHJpbmdbXSB7XG4gICAgY29uc3QgYWRkcnM6IHN0cmluZ1tdID0gW11cbiAgICBjb25zdCBjaGFpbmlkOiBzdHJpbmcgPSB0aGlzLmdldEJsb2NrY2hhaW5BbGlhcygpXG4gICAgICA/IHRoaXMuZ2V0QmxvY2tjaGFpbkFsaWFzKClcbiAgICAgIDogdGhpcy5nZXRCbG9ja2NoYWluSUQoKVxuICAgIGlmIChhZGRyZXNzZXMgJiYgYWRkcmVzc2VzLmxlbmd0aCA+IDApIHtcbiAgICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBhZGRyZXNzZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHR5cGVvZiBhZGRyZXNzZXNbYCR7aX1gXSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIHR5cGVvZiB0aGlzLnBhcnNlQWRkcmVzcyhhZGRyZXNzZXNbYCR7aX1gXSBhcyBzdHJpbmcpID09PVxuICAgICAgICAgICAgXCJ1bmRlZmluZWRcIlxuICAgICAgICAgICkge1xuICAgICAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgICAgICAgIHRocm93IG5ldyBBZGRyZXNzRXJyb3IoYEVycm9yIC0gSW52YWxpZCBhZGRyZXNzIGZvcm1hdCAoJHtjYWxsZXJ9KWApXG4gICAgICAgICAgfVxuICAgICAgICAgIGFkZHJzLnB1c2goYWRkcmVzc2VzW2Ake2l9YF0gYXMgc3RyaW5nKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IGJlY2gzMjogU2VyaWFsaXplZFR5cGUgPSBcImJlY2gzMlwiXG4gICAgICAgICAgYWRkcnMucHVzaChcbiAgICAgICAgICAgIHNlcmlhbGl6YXRpb24uYnVmZmVyVG9UeXBlKFxuICAgICAgICAgICAgICBhZGRyZXNzZXNbYCR7aX1gXSBhcyBCdWZmZXIsXG4gICAgICAgICAgICAgIGJlY2gzMixcbiAgICAgICAgICAgICAgdGhpcy5jb3JlLmdldEhSUCgpLFxuICAgICAgICAgICAgICBjaGFpbmlkXG4gICAgICAgICAgICApXG4gICAgICAgICAgKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhZGRyc1xuICB9XG5cbiAgcHJvdGVjdGVkIF9jbGVhbkFkZHJlc3NBcnJheUJ1ZmZlcihcbiAgICBhZGRyZXNzZXM6IHN0cmluZ1tdIHwgQnVmZmVyW10sXG4gICAgY2FsbGVyOiBzdHJpbmdcbiAgKTogQnVmZmVyW10ge1xuICAgIHJldHVybiB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShhZGRyZXNzZXMsIGNhbGxlcikubWFwKFxuICAgICAgKGE6IHN0cmluZyk6IEJ1ZmZlciA9PiB7XG4gICAgICAgIHJldHVybiB0eXBlb2YgYSA9PT0gXCJ1bmRlZmluZWRcIlxuICAgICAgICAgID8gdW5kZWZpbmVkXG4gICAgICAgICAgOiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSlcbiAgICAgIH1cbiAgICApXG4gIH1cblxuICBwcm90ZWN0ZWQgX3BhcnNlRnJvbVNpZ25lcihmcm9tOiBGcm9tVHlwZSwgY2FsbGVyOiBzdHJpbmcpOiBGcm9tU2lnbmVyIHtcbiAgICBpZiAoZnJvbS5sZW5ndGggPiAwKSB7XG4gICAgICBpZiAodHlwZW9mIGZyb21bMF0gPT09IFwic3RyaW5nXCIpXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgZnJvbTogdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXlCdWZmZXIoZnJvbSBhcyBzdHJpbmdbXSwgY2FsbGVyKSxcbiAgICAgICAgICBzaWduZXI6IFtdXG4gICAgICAgIH1cbiAgICAgIGVsc2VcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBmcm9tOiB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheUJ1ZmZlcihmcm9tWzBdIGFzIHN0cmluZ1tdLCBjYWxsZXIpLFxuICAgICAgICAgIHNpZ25lcjpcbiAgICAgICAgICAgIGZyb20ubGVuZ3RoID4gMVxuICAgICAgICAgICAgICA/IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5QnVmZmVyKGZyb21bMV0gYXMgc3RyaW5nW10sIGNhbGxlcilcbiAgICAgICAgICAgICAgOiBbXVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7IGZyb206IFtdLCBzaWduZXI6IFtdIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUaGlzIGNsYXNzIHNob3VsZCBub3QgYmUgaW5zdGFudGlhdGVkIGRpcmVjdGx5LlxuICAgKiBJbnN0ZWFkIHVzZSB0aGUgW1tBdmFsYW5jaGUuYWRkQVBJXV0gbWV0aG9kLlxuICAgKlxuICAgKiBAcGFyYW0gY29yZSBBIHJlZmVyZW5jZSB0byB0aGUgQXZhbGFuY2hlIGNsYXNzXG4gICAqIEBwYXJhbSBiYXNlVVJMIERlZmF1bHRzIHRvIHRoZSBzdHJpbmcgXCIvZXh0L1BcIiBhcyB0aGUgcGF0aCB0byBibG9ja2NoYWluJ3MgYmFzZVVSTFxuICAgKi9cbiAgY29uc3RydWN0b3IoY29yZTogQXZhbGFuY2hlQ29yZSwgYmFzZVVSTDogc3RyaW5nID0gXCIvZXh0L2JjL1BcIikge1xuICAgIHN1cGVyKGNvcmUsIGJhc2VVUkwpXG4gICAgaWYgKGNvcmUuZ2V0TmV0d29yaygpKSB7XG4gICAgICB0aGlzLmJsb2NrY2hhaW5JRCA9IGNvcmUuZ2V0TmV0d29yaygpLlAuYmxvY2tjaGFpbklEXG4gICAgICB0aGlzLmtleWNoYWluID0gbmV3IEtleUNoYWluKGNvcmUuZ2V0SFJQKCksIGNvcmUuZ2V0TmV0d29yaygpLlAuYWxpYXMpXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIHRoZSBjdXJyZW50IHRpbWVzdGFtcCBvbiBjaGFpbi5cbiAgICovXG4gIGdldFRpbWVzdGFtcCA9IGFzeW5jICgpOiBQcm9taXNlPG51bWJlcj4gPT4ge1xuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5nZXRUaW1lc3RhbXBcIlxuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQudGltZXN0YW1wXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMgdGhlIFVUWE9zIHRoYXQgd2VyZSByZXdhcmRlZCBhZnRlciB0aGUgcHJvdmlkZWQgdHJhbnNhY3Rpb25cInMgc3Rha2luZyBvciBkZWxlZ2F0aW9uIHBlcmlvZCBlbmRlZC5cbiAgICovXG4gIGdldFJld2FyZFVUWE9zID0gYXN5bmMgKFxuICAgIHR4SUQ6IHN0cmluZyxcbiAgICBlbmNvZGluZz86IHN0cmluZ1xuICApOiBQcm9taXNlPEdldFJld2FyZFVUWE9zUmVzcG9uc2U+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IEdldFJld2FyZFVUWE9zUGFyYW1zID0ge1xuICAgICAgdHhJRCxcbiAgICAgIGVuY29kaW5nXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5nZXRSZXdhcmRVVFhPc1wiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdFxuICB9XG5cbiAgLyoqXG4gICAqIEdldCBibG9ja2NoYWlucyBjb25maWd1cmF0aW9uIChnZW5lc2lzKVxuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhbiBHZXRDb25maWd1cmF0aW9uUmVzcG9uc2VcbiAgICovXG4gIGdldENvbmZpZ3VyYXRpb24gPSBhc3luYyAoKTogUHJvbWlzZTxHZXRDb25maWd1cmF0aW9uUmVzcG9uc2U+ID0+IHtcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uZ2V0Q29uZmlndXJhdGlvblwiXG4gICAgKVxuICAgIGNvbnN0IHIgPSByZXNwb25zZS5kYXRhLnJlc3VsdFxuICAgIHJldHVybiB7XG4gICAgICBuZXR3b3JrSUQ6IHBhcnNlSW50KHIubmV0d29ya0lEKSxcbiAgICAgIGFzc2V0SUQ6IHIuYXNzZXRJRCxcbiAgICAgIGFzc2V0U3ltYm9sOiByLmFzc2V0U3ltYm9sLFxuICAgICAgaHJwOiByLmhycCxcbiAgICAgIGJsb2NrY2hhaW5zOiByLmJsb2NrY2hhaW5zLFxuICAgICAgbWluU3Rha2VEdXJhdGlvbjogbmV3IEJOKHIubWluU3Rha2VEdXJhdGlvbikuZGl2KE5hbm9CTikudG9OdW1iZXIoKSxcbiAgICAgIG1heFN0YWtlRHVyYXRpb246IG5ldyBCTihyLm1heFN0YWtlRHVyYXRpb24pLmRpdihOYW5vQk4pLnRvTnVtYmVyKCksXG4gICAgICBtaW5WYWxpZGF0b3JTdGFrZTogbmV3IEJOKHIubWluVmFsaWRhdG9yU3Rha2UpLFxuICAgICAgbWF4VmFsaWRhdG9yU3Rha2U6IG5ldyBCTihyLm1heFZhbGlkYXRvclN0YWtlKSxcbiAgICAgIG1pbkRlbGVnYXRpb25GZWU6IG5ldyBCTihyLm1pbkRlbGVnYXRpb25GZWUpLFxuICAgICAgbWluRGVsZWdhdG9yU3Rha2U6IG5ldyBCTihyLm1pbkRlbGVnYXRvclN0YWtlKSxcbiAgICAgIG1pbkNvbnN1bXB0aW9uUmF0ZTogcGFyc2VJbnQoci5taW5Db25zdW1wdGlvblJhdGUpIC8gcmV3YXJkUGVyY2VudERlbm9tLFxuICAgICAgbWF4Q29uc3VtcHRpb25SYXRlOiBwYXJzZUludChyLm1heENvbnN1bXB0aW9uUmF0ZSkgLyByZXdhcmRQZXJjZW50RGVub20sXG4gICAgICBzdXBwbHlDYXA6IG5ldyBCTihyLnN1cHBseUNhcCksXG4gICAgICB2ZXJpZnlOb2RlU2lnbmF0dXJlOiByLnZlcmlmeU5vZGVTaWduYXR1cmUgPz8gZmFsc2UsXG4gICAgICBsb2NrTW9kZUJvbmREZXBvc2l0OiByLmxvY2tNb2RlQm9uZERlcG9zaXQgPz8gZmFsc2VcbiAgICB9IGFzIEdldENvbmZpZ3VyYXRpb25SZXNwb25zZVxuICB9XG5cbiAgLyoqXG4gICAqIEdldCBibG9ja2NoYWlucyBjb25maWd1cmF0aW9uIChnZW5lc2lzKVxuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhbiBHZXRDb25maWd1cmF0aW9uUmVzcG9uc2VcbiAgICovXG4gIHNwZW5kID0gYXN5bmMgKFxuICAgIGZyb206IHN0cmluZ1tdIHwgc3RyaW5nLFxuICAgIHNpZ25lcjogc3RyaW5nW10gfCBzdHJpbmcsXG4gICAgdG86IHN0cmluZ1tdLFxuICAgIHRvVGhyZXNob2xkOiBudW1iZXIsXG4gICAgdG9Mb2NrVGltZTogQk4sXG4gICAgY2hhbmdlOiBzdHJpbmdbXSxcbiAgICBjaGFuZ2VUaHJlc2hvbGQ6IG51bWJlcixcbiAgICBsb2NrTW9kZTogTG9ja01vZGUsXG4gICAgYW1vdW50VG9Mb2NrOiBCTixcbiAgICBhbW91bnRUb0J1cm46IEJOLFxuICAgIGFzT2Y6IEJOLFxuICAgIGVuY29kaW5nPzogc3RyaW5nXG4gICk6IFByb21pc2U8U3BlbmRSZXBseT4gPT4ge1xuICAgIGlmICghW1wiVW5sb2NrZWRcIiwgXCJEZXBvc2l0XCIsIFwiQm9uZFwiXS5pbmNsdWRlcyhsb2NrTW9kZSkpIHtcbiAgICAgIHRocm93IG5ldyBQcm90b2NvbEVycm9yKFwiRXJyb3IgLS0gUGxhdGZvcm1BUEkuc3BlbmQ6IGludmFsaWQgbG9ja01vZGVcIilcbiAgICB9XG4gICAgY29uc3QgcGFyYW1zOiBTcGVuZFBhcmFtcyA9IHtcbiAgICAgIGZyb20sXG4gICAgICBzaWduZXIsXG4gICAgICB0bzpcbiAgICAgICAgdG8ubGVuZ3RoID4gMFxuICAgICAgICAgID8ge1xuICAgICAgICAgICAgICBsb2NrdGltZTogdG9Mb2NrVGltZS50b1N0cmluZygxMCksXG4gICAgICAgICAgICAgIHRocmVzaG9sZDogdG9UaHJlc2hvbGQsXG4gICAgICAgICAgICAgIGFkZHJlc3NlczogdG9cbiAgICAgICAgICAgIH1cbiAgICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgIGNoYW5nZTpcbiAgICAgICAgY2hhbmdlLmxlbmd0aCA+IDBcbiAgICAgICAgICA/IHsgbG9ja3RpbWU6IFwiMFwiLCB0aHJlc2hvbGQ6IGNoYW5nZVRocmVzaG9sZCwgYWRkcmVzc2VzOiBjaGFuZ2UgfVxuICAgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgbG9ja01vZGU6IGxvY2tNb2RlID09PSBcIlVubG9ja2VkXCIgPyAwIDogbG9ja01vZGUgPT09IFwiRGVwb3NpdFwiID8gMSA6IDIsXG4gICAgICBhbW91bnRUb0xvY2s6IGFtb3VudFRvTG9jay50b1N0cmluZygxMCksXG4gICAgICBhbW91bnRUb0J1cm46IGFtb3VudFRvQnVybi50b1N0cmluZygxMCksXG4gICAgICBhc09mOiBhc09mLnRvU3RyaW5nKDEwKSxcbiAgICAgIGVuY29kaW5nOiBlbmNvZGluZyA/PyBcImhleFwiXG4gICAgfVxuXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLnNwZW5kXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgY29uc3QgciA9IHJlc3BvbnNlLmRhdGEucmVzdWx0XG5cbiAgICAvLyBXZSBuZWVkIHRvIHVwZGF0ZSBzaWduYXR1cmUgaW5kZXggc291cmNlIGhlcmVcbiAgICBjb25zdCBpbnMgPSBUcmFuc2ZlcmFibGVJbnB1dC5mcm9tQXJyYXkoQnVmZmVyLmZyb20oci5pbnMuc2xpY2UoMiksIFwiaGV4XCIpKVxuICAgIGlucy5mb3JFYWNoKChlLCBpZHgpID0+XG4gICAgICBlLmdldFNpZ0lkeHMoKS5mb3JFYWNoKChzLCBzaWR4KSA9PiB7XG4gICAgICAgIHMuc2V0U291cmNlKGJpbnRvb2xzLmNiNThEZWNvZGUoci5zaWduZXJzW2Ake2lkeH1gXVtgJHtzaWR4fWBdKSlcbiAgICAgIH0pXG4gICAgKVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGlucyxcbiAgICAgIG91dDogVHJhbnNmZXJhYmxlT3V0cHV0LmZyb21BcnJheShCdWZmZXIuZnJvbShyLm91dHMuc2xpY2UoMiksIFwiaGV4XCIpKSxcbiAgICAgIG93bmVyczogci5vd25lcnNcbiAgICAgICAgPyBPdXRwdXRPd25lcnMuZnJvbUFycmF5KEJ1ZmZlci5mcm9tKHIub3duZXJzLnNsaWNlKDIpLCBcImhleFwiKSlcbiAgICAgICAgOiBbXVxuICAgIH1cbiAgfVxuXG4gIF9nZXRCdWlsZGVyID0gKHV0eG9TZXQ6IFVUWE9TZXQpOiBCdWlsZGVyID0+IHtcbiAgICBpZiAodGhpcy5jb3JlLmdldE5ldHdvcmsoKS5QLmxvY2tNb2RlQm9uZERlcG9zaXQpIHtcbiAgICAgIHJldHVybiBuZXcgQnVpbGRlcihuZXcgU3BlbmRlcih0aGlzKSwgdHJ1ZSlcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBCdWlsZGVyKHV0eG9TZXQsIGZhbHNlKVxuICB9XG59XG4iXX0=