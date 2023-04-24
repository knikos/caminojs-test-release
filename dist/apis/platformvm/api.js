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
            if (!offers.depositOffers)
                return [];
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
         * Returns deposits corresponding to requested txIDs.
         *
         * @param depositTxIDs A list of txIDs (cb58) to request deposits for.
         *
         * @returns Promise for a GetDepositsResponse object.
         */
        this.getDeposits = (depositTxIDs) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                depositTxIDs
            };
            const response = yield this.callMethod("platform.getDeposits", params);
            const deposits = response.data.result;
            if (!deposits.deposits)
                return { deposits: [], availableRewards: [], timestamp: common_1.ZeroBN };
            return {
                deposits: deposits.deposits.map((deposit) => {
                    return {
                        depositTxID: deposit.depositTxID,
                        depositOfferID: deposit.depositOfferID,
                        unlockedAmount: new bn_js_1.default(deposit.unlockedAmount),
                        claimedRewardAmount: new bn_js_1.default(deposit.claimedRewardAmount),
                        start: new bn_js_1.default(deposit.start),
                        duration: deposit.duration,
                        amount: new bn_js_1.default(deposit.amount),
                        rewardOwner: deposit.rewardOwner
                    };
                }),
                availableRewards: deposits.availableRewards.map((a) => new bn_js_1.default(a)),
                timestamp: new bn_js_1.default(deposits.timestamp)
            };
        });
        /**
         * List amounts that can be claimed: validator rewards, expired deposit rewards claimable at current time.
         *
         * @param owners RewardOwner of DepositTx or AddValidatorTx
         *
         * @returns Promise for an object containing the amounts that can be claimed.
         */
        this.getClaimables = (owners) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                Owners: owners
            };
            const response = yield this.callMethod("platform.getClaimables", params);
            const result = response.data.result;
            return {
                claimables: result.claimables.map((c) => {
                    return {
                        validatorRewards: new bn_js_1.default(result.validatorRewards),
                        expiredDepositRewards: new bn_js_1.default(result.expiredDepositRewards)
                    };
                })
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
         * Helper function which creates an unsigned transaction. For more granular control, you may create your own
         * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
         *
         * @param utxoset A set of UTXOs that the transaction is built on
         * @param amount The amount of AssetID to be spent in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}.
         * @param toAddresses The addresses to send the funds
         * @param fromAddresses The addresses being used to send the funds from the UTXOs provided
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
         * @param memo Optional CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param locktime Optional. The locktime field created in the resulting outputs
         * @param toThreshold Optional. The number of signatures required to spend the funds in the resultant UTXO
         * @param changeThreshold Optional. The number of signatures required to spend the funds in the resultant change UTXO
         *
         * @returns An unsigned transaction ([[UnsignedTx]]) which contains a [[BaseTx]].
         *
         * @remarks
         * This helper exists because the endpoint API should be the primary point of entry for most functionality.
         */
        this.buildBaseTx = (utxoset, amount, toAddresses, fromAddresses, changeAddresses, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)(), locktime = new bn_js_1.default(0), toThreshold = 1, changeThreshold = 1) => __awaiter(this, void 0, void 0, function* () {
            const caller = "buildBaseTx";
            const to = this._cleanAddressArrayBuffer(toAddresses, caller);
            const fromSigner = this._parseFromSigner(fromAddresses, caller);
            const change = this._cleanAddressArrayBuffer(changeAddresses, caller);
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const networkID = this.core.getNetworkID();
            const blockchainIDBuf = bintools.cb58Decode(this.blockchainID);
            const fee = this.getTxFee();
            const feeAssetID = yield this.getAVAXAssetID();
            const builtUnsignedTx = yield this._getBuilder(utxoset).buildBaseTx(networkID, blockchainIDBuf, amount, feeAssetID, to, fromSigner, change, fee, feeAssetID, memo, asOf, locktime, toThreshold, changeThreshold);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
                /* istanbul ignore next */
                new errors_2.GooseEggCheckError("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
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
         * @param claimAmounts The specification and authentication what and how much to claim
         * @param claimTo The address to claimed rewards will be directed to
         *
         * @returns An unsigned transaction created from the passed in parameters.
         */
        this.buildClaimTx = (utxoset, fromAddresses, changeAddresses = undefined, memo = undefined, asOf = common_1.ZeroBN, changeThreshold = 1, claimAmounts, claimTo = undefined) => __awaiter(this, void 0, void 0, function* () {
            const caller = "buildClaimTx";
            const fromSigner = this._parseFromSigner(fromAddresses, caller);
            const change = this._cleanAddressArrayBuffer(changeAddresses, caller);
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            if (claimAmounts.length === 0) {
                throw new Error("Must provide at least one claimAmount");
            }
            const avaxAssetID = yield this.getAVAXAssetID();
            const networkID = this.core.getNetworkID();
            const blockchainID = bintools.cb58Decode(this.blockchainID);
            const fee = this.getTxFee();
            const unsignedClaimTx = yield this._getBuilder(utxoset).buildClaimTx(networkID, blockchainID, fromSigner, change, fee, avaxAssetID, memo, asOf, changeThreshold, claimAmounts, claimTo);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvcGxhdGZvcm12bS9hcGkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7OztHQUdHO0FBQ0gsb0NBQWdDO0FBQ2hDLGtEQUFzQjtBQUV0Qix5Q0FLcUI7QUFFckIsK0NBSTJCO0FBQzNCLG9FQUEyQztBQUMzQyx5Q0FBcUM7QUFDckMscURBQStDO0FBQy9DLDJDQUFpRDtBQUNqRCw2QkFBcUM7QUFDckMsaURBQWlEO0FBQ2pELGlFQUEyRTtBQUMzRSwrQ0FBbUQ7QUFFbkQsK0NBUTJCO0FBK0MzQixxQ0FBNEM7QUFDNUMsdUNBQThDO0FBQzlDLHVDQUEyRDtBQUUzRCx1Q0FBK0Q7QUFFL0QsdUNBQW1DO0FBRW5DOztHQUVHO0FBQ0gsTUFBTSxRQUFRLEdBQWEsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUNqRCxNQUFNLGFBQWEsR0FBa0IscUJBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUVoRSxNQUFNLE1BQU0sR0FBRyxJQUFJLGVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQTtBQUNqQyxNQUFNLGtCQUFrQixHQUFHLE9BQU8sQ0FBQTtBQUlsQzs7Ozs7O0dBTUc7QUFDSCxNQUFhLGFBQWMsU0FBUSxnQkFBTztJQXE5RXhDOzs7Ozs7T0FNRztJQUNILFlBQVksSUFBbUIsRUFBRSxVQUFrQixXQUFXO1FBQzVELEtBQUssQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUE7UUE1OUV0Qjs7V0FFRztRQUNPLGFBQVEsR0FBYSxJQUFJLG1CQUFRLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFBO1FBRXpDLGlCQUFZLEdBQVcsRUFBRSxDQUFBO1FBRXpCLG9CQUFlLEdBQVcsU0FBUyxDQUFBO1FBRW5DLGdCQUFXLEdBQVcsU0FBUyxDQUFBO1FBRS9CLFVBQUssR0FBTyxTQUFTLENBQUE7UUFFckIsa0JBQWEsR0FBTyxTQUFTLENBQUE7UUFFN0Isc0JBQWlCLEdBQU8sU0FBUyxDQUFBO1FBRWpDLHNCQUFpQixHQUFPLFNBQVMsQ0FBQTtRQUUzQzs7OztXQUlHO1FBQ0gsdUJBQWtCLEdBQUcsR0FBVyxFQUFFO1lBQ2hDLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFBO1FBQ3ZDLENBQUMsQ0FBQTtRQUVEOzs7O1dBSUc7UUFDSCxlQUFVLEdBQUcsR0FBWSxFQUFFO1lBQ3pCLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQTtRQUMvQixDQUFDLENBQUE7UUFFRDs7OztXQUlHO1FBQ0gsb0JBQWUsR0FBRyxHQUFXLEVBQUUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFBO1FBRWpEOzs7O1dBSUc7UUFDSCxpQkFBWSxHQUFHLENBQUMsSUFBWSxFQUFVLEVBQUU7WUFDdEMsTUFBTSxLQUFLLEdBQVcsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUE7WUFDL0MsTUFBTSxZQUFZLEdBQVcsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFBO1lBQ25ELE9BQU8sUUFBUSxDQUFDLFlBQVksQ0FDMUIsSUFBSSxFQUNKLFlBQVksRUFDWixLQUFLLEVBQ0wsK0JBQW1CLENBQUMsYUFBYSxDQUNsQyxDQUFBO1FBQ0gsQ0FBQyxDQUFBO1FBRUQsc0JBQWlCLEdBQUcsQ0FBQyxPQUFlLEVBQVUsRUFBRTtZQUM5QyxNQUFNLE9BQU8sR0FBVyxJQUFJLENBQUMsa0JBQWtCLEVBQUU7Z0JBQy9DLENBQUMsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEVBQUU7Z0JBQzNCLENBQUMsQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUE7WUFDMUIsTUFBTSxJQUFJLEdBQW1CLFFBQVEsQ0FBQTtZQUNyQyxPQUFPLGFBQWEsQ0FBQyxZQUFZLENBQy9CLE9BQU8sRUFDUCxJQUFJLEVBQ0osSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFDbEIsT0FBTyxDQUNSLENBQUE7UUFDSCxDQUFDLENBQUE7UUFFRDs7Ozs7O1dBTUc7UUFDSCxtQkFBYyxHQUFHLENBQU8sVUFBbUIsS0FBSyxFQUFtQixFQUFFO1lBQ25FLElBQUksT0FBTyxJQUFJLENBQUMsV0FBVyxLQUFLLFdBQVcsSUFBSSxPQUFPLEVBQUU7Z0JBQ3RELElBQUksQ0FBQyxXQUFXLEdBQUcsUUFBUSxDQUFDLFVBQVUsQ0FDcEMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUNyQyxDQUFBO2FBQ0Y7WUFDRCxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUE7UUFDekIsQ0FBQyxDQUFBLENBQUE7UUFFRDs7Ozs7O1dBTUc7UUFDSCxtQkFBYyxHQUFHLENBQUMsV0FBNEIsRUFBRSxFQUFFO1lBQ2hELElBQUksT0FBTyxXQUFXLEtBQUssUUFBUSxFQUFFO2dCQUNuQyxXQUFXLEdBQUcsUUFBUSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsQ0FBQTthQUMvQztZQUNELElBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFBO1FBQ2hDLENBQUMsQ0FBQTtRQUVEOzs7O1dBSUc7UUFDSCxvQkFBZSxHQUFHLEdBQU8sRUFBRTtZQUN6QixPQUFPLElBQUksZUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQy9DLENBQUMsQ0FBQTtRQUVEOzs7O1dBSUc7UUFDSCxhQUFRLEdBQUcsR0FBTyxFQUFFO1lBQ2xCLElBQUksT0FBTyxJQUFJLENBQUMsS0FBSyxLQUFLLFdBQVcsRUFBRTtnQkFDckMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUE7YUFDcEM7WUFDRCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUE7UUFDbkIsQ0FBQyxDQUFBO1FBRUQ7Ozs7V0FJRztRQUNILHlCQUFvQixHQUFHLEdBQU8sRUFBRTs7WUFDOUIsT0FBTyxJQUFJLGVBQUUsQ0FBQyxNQUFBLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDLGNBQWMsbUNBQUksQ0FBQyxDQUFDLENBQUE7UUFDN0QsQ0FBQyxDQUFBO1FBRUQ7Ozs7V0FJRztRQUNILHdCQUFtQixHQUFHLEdBQU8sRUFBRTs7WUFDN0IsT0FBTyxJQUFJLGVBQUUsQ0FBQyxNQUFBLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDLGFBQWEsbUNBQUksQ0FBQyxDQUFDLENBQUE7UUFDNUQsQ0FBQyxDQUFBO1FBRUQ7Ozs7V0FJRztRQUNILGFBQVEsR0FBRyxDQUFDLEdBQU8sRUFBRSxFQUFFO1lBQ3JCLElBQUksQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFBO1FBQ2xCLENBQUMsQ0FBQTtRQUVEOzs7O1dBSUc7UUFDSCw0QkFBdUIsR0FBRyxHQUFPLEVBQUU7WUFDakMsT0FBTyxJQUFJLGVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQTtRQUN2RCxDQUFDLENBQUE7UUFFRDs7OztXQUlHO1FBQ0gscUJBQWdCLEdBQUcsR0FBTyxFQUFFO1lBQzFCLElBQUksT0FBTyxJQUFJLENBQUMsYUFBYSxLQUFLLFdBQVcsRUFBRTtnQkFDN0MsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQTthQUNwRDtZQUNELE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQTtRQUMzQixDQUFDLENBQUE7UUFFRDs7OztXQUlHO1FBQ0gscUJBQWdCLEdBQUcsQ0FBQyxHQUFPLEVBQUUsRUFBRTtZQUM3QixJQUFJLENBQUMsYUFBYSxHQUFHLEdBQUcsQ0FBQTtRQUMxQixDQUFDLENBQUE7UUFFRDs7OztXQUlHO1FBQ0gsYUFBUSxHQUFHLEdBQWEsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUE7UUFFeEM7O1dBRUc7UUFDSCxnQkFBVyxHQUFHLEdBQWEsRUFBRTtZQUMzQix1Q0FBdUM7WUFDdkMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUE7WUFDdkMsSUFBSSxLQUFLLEVBQUU7Z0JBQ1QsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLG1CQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQTthQUN4RDtpQkFBTTtnQkFDTCxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksbUJBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQTthQUNwRTtZQUNELE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQTtRQUN0QixDQUFDLENBQUE7UUFFRDs7Ozs7Ozs7O1dBU0c7UUFDSCxrQkFBYSxHQUFHLENBQ2QsR0FBZSxFQUNmLFdBQWUsZUFBTSxFQUNILEVBQUU7WUFDcEIsTUFBTSxXQUFXLEdBQVcsTUFBTSxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUE7WUFDdkQsSUFBSSxXQUFXLEdBQU8sUUFBUSxDQUFDLEVBQUUsQ0FBQyxlQUFNLENBQUM7Z0JBQ3ZDLENBQUMsQ0FBQyxRQUFRO2dCQUNWLENBQUMsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLFdBQVcsQ0FBQyxDQUFBO1lBQ25DLE1BQU0sR0FBRyxHQUFPLEdBQUcsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUE7WUFDeEMsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLG1CQUFPLENBQUMsR0FBRyxDQUFDLElBQUksZUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxFQUFFO2dCQUM1RCxPQUFPLElBQUksQ0FBQTthQUNaO2lCQUFNO2dCQUNMLE9BQU8sS0FBSyxDQUFBO2FBQ2I7UUFDSCxDQUFDLENBQUEsQ0FBQTtRQUVEOzs7O1dBSUc7UUFDSCxzQkFBaUIsR0FBRyxHQUEwQixFQUFFO1lBQzlDLE1BQU0sUUFBUSxHQUF3QixNQUFNLElBQUksQ0FBQyxVQUFVLENBQ3pELDRCQUE0QixDQUM3QixDQUFBO1lBQ0QsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUE7UUFDckMsQ0FBQyxDQUFBLENBQUE7UUFFRDs7Ozs7Ozs7Ozs7O1dBWUc7UUFDSCxxQkFBZ0IsR0FBRyxDQUNqQixRQUFnQixFQUNoQixRQUFnQixFQUNoQixXQUE0QixTQUFTLEVBQ3JDLElBQVksRUFDWixLQUFlLEVBQ2YsSUFBWSxFQUNaLE9BQWUsRUFDRSxFQUFFO1lBQ25CLE1BQU0sTUFBTSxHQUEyQjtnQkFDckMsUUFBUTtnQkFDUixRQUFRO2dCQUNSLEtBQUs7Z0JBQ0wsSUFBSTtnQkFDSixJQUFJO2dCQUNKLFdBQVcsRUFBRSxPQUFPO2FBQ3JCLENBQUE7WUFDRCxJQUFJLE9BQU8sUUFBUSxLQUFLLFFBQVEsRUFBRTtnQkFDaEMsTUFBTSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUE7YUFDM0I7aUJBQU0sSUFBSSxPQUFPLFFBQVEsS0FBSyxXQUFXLEVBQUU7Z0JBQzFDLE1BQU0sQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQTthQUNoRDtZQUNELE1BQU0sUUFBUSxHQUF3QixNQUFNLElBQUksQ0FBQyxVQUFVLENBQ3pELDJCQUEyQixFQUMzQixNQUFNLENBQ1AsQ0FBQTtZQUNELE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFBO1FBQ2xDLENBQUMsQ0FBQSxDQUFBO1FBRUQ7Ozs7OztXQU1HO1FBQ0gsd0JBQW1CLEdBQUcsQ0FBTyxZQUFvQixFQUFtQixFQUFFO1lBQ3BFLE1BQU0sTUFBTSxHQUFRO2dCQUNsQixZQUFZO2FBQ2IsQ0FBQTtZQUNELE1BQU0sUUFBUSxHQUF3QixNQUFNLElBQUksQ0FBQyxVQUFVLENBQ3pELDhCQUE4QixFQUM5QixNQUFNLENBQ1AsQ0FBQTtZQUNELE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFBO1FBQ3BDLENBQUMsQ0FBQSxDQUFBO1FBRUQ7Ozs7Ozs7V0FPRztRQUNILG9CQUFlLEdBQUcsQ0FDaEIsTUFBYyxFQUNkLFFBQWlCLEVBQ2lCLEVBQUU7WUFDcEMsTUFBTSxNQUFNLEdBQTBCO2dCQUNwQyxNQUFNO2FBQ1AsQ0FBQTtZQUNELElBQUksT0FBTyxRQUFRLEtBQUssV0FBVyxFQUFFO2dCQUNuQyxNQUFNLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQTthQUMzQjtZQUNELE1BQU0sUUFBUSxHQUF3QixNQUFNLElBQUksQ0FBQyxVQUFVLENBQ3pELDBCQUEwQixFQUMxQixNQUFNLENBQ1AsQ0FBQTtZQUNELE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUE7UUFDN0IsQ0FBQyxDQUFBLENBQUE7UUFFRDs7Ozs7OztXQU9HO1FBQ0gsa0JBQWEsR0FBRyxDQUNkLFFBQWdCLEVBQ2hCLFFBQWdCLEVBQ0MsRUFBRTtZQUNuQixNQUFNLE1BQU0sR0FBd0I7Z0JBQ2xDLFFBQVE7Z0JBQ1IsUUFBUTthQUNULENBQUE7WUFDRCxNQUFNLFFBQVEsR0FBd0IsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUN6RCx3QkFBd0IsRUFDeEIsTUFBTSxDQUNQLENBQUE7WUFDRCxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQTtRQUNyQyxDQUFDLENBQUEsQ0FBQTtRQUVEOzs7Ozs7V0FNRztRQUNILGVBQVUsR0FBRyxDQUFPLE1BR25CLEVBQStCLEVBQUU7O1lBQ2hDLElBQ0UsTUFBTSxDQUFDLE9BQU87Z0JBQ2QsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxXQUFXLEVBQ3hEO2dCQUNBLDBCQUEwQjtnQkFDMUIsTUFBTSxJQUFJLHFCQUFZLENBQ3BCLDBEQUEwRCxDQUMzRCxDQUFBO2FBQ0Y7WUFDRCxNQUFBLE1BQU0sQ0FBQyxTQUFTLDBDQUFFLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFO2dCQUNwQyxJQUFJLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsS0FBSyxXQUFXLEVBQUU7b0JBQ3JELDBCQUEwQjtvQkFDMUIsTUFBTSxJQUFJLHFCQUFZLENBQ3BCLDBEQUEwRCxDQUMzRCxDQUFBO2lCQUNGO1lBQ0gsQ0FBQyxDQUFDLENBQUE7WUFDRixNQUFNLFFBQVEsR0FBd0IsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUN6RCxxQkFBcUIsRUFDckIsTUFBTSxDQUNQLENBQUE7WUFFRCxNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQTtZQUVuQyxNQUFNLFNBQVMsR0FBRyxDQUFDLEtBQVksRUFBZSxFQUFFO2dCQUM5QyxJQUFJLElBQUksR0FBZ0IsRUFBRSxDQUFBO2dCQUMxQixLQUFLLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUM7b0JBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksZUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFBO2dCQUMvRCxPQUFPLElBQW1CLENBQUE7WUFDNUIsQ0FBQyxDQUFBO1lBRUQsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQyxtQkFBbUIsRUFBRTtnQkFDaEQsT0FBTztvQkFDTCxRQUFRLEVBQUUsU0FBUyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUM7b0JBQ3BDLGVBQWUsRUFBRSxTQUFTLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQztvQkFDbEQsYUFBYSxFQUFFLFNBQVMsQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDO29CQUM5QyxnQkFBZ0IsRUFBRSxTQUFTLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDO29CQUNwRCxzQkFBc0IsRUFBRSxTQUFTLENBQUMsTUFBTSxDQUFDLHNCQUFzQixDQUFDO29CQUNoRSxPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU87aUJBQ0YsQ0FBQTthQUN4QjtZQUNELE9BQU87Z0JBQ0wsT0FBTyxFQUFFLElBQUksZUFBRSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUM7Z0JBQy9CLFFBQVEsRUFBRSxJQUFJLGVBQUUsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDO2dCQUNqQyxlQUFlLEVBQUUsSUFBSSxlQUFFLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQztnQkFDL0Msa0JBQWtCLEVBQUUsSUFBSSxlQUFFLENBQUMsTUFBTSxDQUFDLGtCQUFrQixDQUFDO2dCQUNyRCxPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU87YUFDRixDQUFBO1FBQ3pCLENBQUMsQ0FBQSxDQUFBO1FBRUQ7Ozs7Ozs7V0FPRztRQUNILGtCQUFhLEdBQUcsQ0FDZCxRQUFnQixFQUNoQixRQUFnQixFQUNHLEVBQUU7WUFDckIsTUFBTSxNQUFNLEdBQXdCO2dCQUNsQyxRQUFRO2dCQUNSLFFBQVE7YUFDVCxDQUFBO1lBQ0QsTUFBTSxRQUFRLEdBQXdCLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FDekQsd0JBQXdCLEVBQ3hCLE1BQU0sQ0FDUCxDQUFBO1lBQ0QsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUE7UUFDdkMsQ0FBQyxDQUFBLENBQUE7UUFFRDs7Ozs7Ozs7O1dBU0c7UUFDSCx5QkFBb0IsR0FBRyxDQUNyQixXQUE0QixTQUFTLEVBQ3JDLFVBQW9CLFNBQVMsRUFDWixFQUFFO1lBQ25CLE1BQU0sTUFBTSxHQUErQixFQUFFLENBQUE7WUFDN0MsSUFBSSxPQUFPLFFBQVEsS0FBSyxRQUFRLEVBQUU7Z0JBQ2hDLE1BQU0sQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFBO2FBQzNCO2lCQUFNLElBQUksT0FBTyxRQUFRLEtBQUssV0FBVyxFQUFFO2dCQUMxQyxNQUFNLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUE7YUFDaEQ7WUFDRCxJQUFJLE9BQU8sT0FBTyxJQUFJLFdBQVcsSUFBSSxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtnQkFDdkQsTUFBTSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUE7YUFDekI7WUFDRCxNQUFNLFFBQVEsR0FBd0IsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUN6RCwrQkFBK0IsRUFDL0IsTUFBTSxDQUNQLENBQUE7WUFDRCxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFBO1FBQzdCLENBQUMsQ0FBQSxDQUFBO1FBRUQ7Ozs7OztXQU1HO1FBQ0gsNkJBQXdCLEdBQUcsQ0FBTyxPQUFlLEVBQW1CLEVBQUU7WUFDcEUsTUFBTSxNQUFNLEdBQUc7Z0JBQ2IsT0FBTzthQUNSLENBQUE7WUFDRCxNQUFNLFFBQVEsR0FBd0IsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUN6RCxtQ0FBbUMsRUFDbkMsTUFBTSxDQUNQLENBQUE7WUFDRCxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQTtRQUNyQyxDQUFDLENBQUEsQ0FBQTtRQUVEOzs7Ozs7V0FNRztRQUNILHdCQUFtQixHQUFHLENBQU8sTUFBZ0IsRUFBMkIsRUFBRTtZQUN4RSxNQUFNLE1BQU0sR0FBOEI7Z0JBQ3hDLE1BQU07YUFDUCxDQUFBO1lBQ0QsTUFBTSxRQUFRLEdBQXdCLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FDekQsOEJBQThCLEVBQzlCLE1BQU0sQ0FDUCxDQUFBO1lBRUQsTUFBTSxNQUFNLEdBQWdDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFBO1lBQ2hFLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYTtnQkFBRSxPQUFPLEVBQUUsQ0FBQTtZQUNwQyxPQUFPLE1BQU0sQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7Z0JBQ3hDLE9BQU87b0JBQ0wsRUFBRSxFQUFFLEtBQUssQ0FBQyxFQUFFO29CQUNaLHFCQUFxQixFQUFFLElBQUksZUFBRSxDQUFDLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQztvQkFDMUQsS0FBSyxFQUFFLElBQUksZUFBRSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUM7b0JBQzFCLEdBQUcsRUFBRSxJQUFJLGVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDO29CQUN0QixTQUFTLEVBQUUsSUFBSSxlQUFFLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQztvQkFDbEMsV0FBVyxFQUFFLEtBQUssQ0FBQyxXQUFXO29CQUM5QixXQUFXLEVBQUUsS0FBSyxDQUFDLFdBQVc7b0JBQzlCLG9CQUFvQixFQUFFLEtBQUssQ0FBQyxvQkFBb0I7b0JBQ2hELHVCQUF1QixFQUFFLEtBQUssQ0FBQyx1QkFBdUI7b0JBQ3RELElBQUksRUFBRSxLQUFLLENBQUMsSUFBSTtvQkFDaEIsS0FBSyxFQUFFLElBQUksZUFBRSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUM7aUJBQ1gsQ0FBQTtZQUNuQixDQUFDLENBQUMsQ0FBQTtRQUNKLENBQUMsQ0FBQSxDQUFBO1FBRUQ7Ozs7OztXQU1HO1FBQ0gsZ0JBQVcsR0FBRyxDQUNaLFlBQXNCLEVBQ1EsRUFBRTtZQUNoQyxNQUFNLE1BQU0sR0FBc0I7Z0JBQ2hDLFlBQVk7YUFDYixDQUFBO1lBQ0QsTUFBTSxRQUFRLEdBQXdCLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FDekQsc0JBQXNCLEVBQ3RCLE1BQU0sQ0FDUCxDQUFBO1lBRUQsTUFBTSxRQUFRLEdBQXdCLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFBO1lBQzFELElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUTtnQkFDcEIsT0FBTyxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsZ0JBQWdCLEVBQUUsRUFBRSxFQUFFLFNBQVMsRUFBRSxlQUFNLEVBQUUsQ0FBQTtZQUNsRSxPQUFPO2dCQUNMLFFBQVEsRUFBRSxRQUFRLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFO29CQUMxQyxPQUFPO3dCQUNMLFdBQVcsRUFBRSxPQUFPLENBQUMsV0FBVzt3QkFDaEMsY0FBYyxFQUFFLE9BQU8sQ0FBQyxjQUFjO3dCQUN0QyxjQUFjLEVBQUUsSUFBSSxlQUFFLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQzt3QkFDOUMsbUJBQW1CLEVBQUUsSUFBSSxlQUFFLENBQUMsT0FBTyxDQUFDLG1CQUFtQixDQUFDO3dCQUN4RCxLQUFLLEVBQUUsSUFBSSxlQUFFLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQzt3QkFDNUIsUUFBUSxFQUFFLE9BQU8sQ0FBQyxRQUFRO3dCQUMxQixNQUFNLEVBQUUsSUFBSSxlQUFFLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQzt3QkFDOUIsV0FBVyxFQUFFLE9BQU8sQ0FBQyxXQUFXO3FCQUNuQixDQUFBO2dCQUNqQixDQUFDLENBQUM7Z0JBQ0YsZ0JBQWdCLEVBQUUsUUFBUSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxlQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pFLFNBQVMsRUFBRSxJQUFJLGVBQUUsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDO2FBQ2YsQ0FBQTtRQUMxQixDQUFDLENBQUEsQ0FBQTtRQUVEOzs7Ozs7V0FNRztRQUNILGtCQUFhLEdBQUcsQ0FBTyxNQUFlLEVBQWtDLEVBQUU7WUFDeEUsTUFBTSxNQUFNLEdBQUc7Z0JBQ2IsTUFBTSxFQUFFLE1BQU07YUFDZixDQUFBO1lBQ0QsTUFBTSxRQUFRLEdBQXdCLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FDekQsd0JBQXdCLEVBQ3hCLE1BQU0sQ0FDUCxDQUFBO1lBQ0QsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUE7WUFFbkMsT0FBTztnQkFDTCxVQUFVLEVBQUUsTUFBTSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFNLEVBQUUsRUFBRTtvQkFDM0MsT0FBTzt3QkFDTCxnQkFBZ0IsRUFBRSxJQUFJLGVBQUUsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUM7d0JBQ2pELHFCQUFxQixFQUFFLElBQUksZUFBRSxDQUFDLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQztxQkFDL0MsQ0FBQTtnQkFDaEIsQ0FBQyxDQUFDO2FBQ3NCLENBQUE7UUFDNUIsQ0FBQyxDQUFBLENBQUE7UUFFRDs7Ozs7Ozs7O1dBU0c7UUFDSCx5QkFBb0IsR0FBRyxDQUNyQixXQUE0QixTQUFTLEVBQ3JDLFVBQW9CLFNBQVMsRUFDWixFQUFFO1lBQ25CLE1BQU0sTUFBTSxHQUErQixFQUFFLENBQUE7WUFDN0MsSUFBSSxPQUFPLFFBQVEsS0FBSyxRQUFRLEVBQUU7Z0JBQ2hDLE1BQU0sQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFBO2FBQzNCO2lCQUFNLElBQUksT0FBTyxRQUFRLEtBQUssV0FBVyxFQUFFO2dCQUMxQyxNQUFNLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUE7YUFDaEQ7WUFDRCxJQUFJLE9BQU8sT0FBTyxJQUFJLFdBQVcsSUFBSSxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtnQkFDdkQsTUFBTSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUE7YUFDekI7WUFFRCxNQUFNLFFBQVEsR0FBd0IsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUN6RCwrQkFBK0IsRUFDL0IsTUFBTSxDQUNQLENBQUE7WUFDRCxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFBO1FBQzdCLENBQUMsQ0FBQSxDQUFBO1FBRUQ7Ozs7Ozs7O1dBUUc7UUFDSCxxQkFBZ0IsR0FBRyxDQUNqQixVQUFrQixFQUNsQixXQUE0QixTQUFTLEVBQ2xCLEVBQUU7WUFDckIsTUFBTSxNQUFNLEdBQTJCO2dCQUNyQyxJQUFJLEVBQUUsVUFBVSxDQUFDLFFBQVEsRUFBRTthQUM1QixDQUFBO1lBQ0QsSUFBSSxPQUFPLFFBQVEsS0FBSyxRQUFRLEVBQUU7Z0JBQ2hDLE1BQU0sQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFBO2FBQzNCO2lCQUFNLElBQUksT0FBTyxRQUFRLEtBQUssV0FBVyxFQUFFO2dCQUMxQyxNQUFNLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUE7YUFDaEQ7WUFDRCxNQUFNLFFBQVEsR0FBd0IsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUN6RCwyQkFBMkIsRUFDM0IsTUFBTSxDQUNQLENBQUE7WUFDRCxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQTtRQUN4QyxDQUFDLENBQUEsQ0FBQTtRQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7V0FrQkc7UUFDSCxpQkFBWSxHQUFHLENBQ2IsUUFBZ0IsRUFDaEIsUUFBZ0IsRUFDaEIsTUFBYyxFQUNkLFNBQWUsRUFDZixPQUFhLEVBQ2IsV0FBZSxFQUNmLGFBQXFCLEVBQ3JCLG9CQUF3QixTQUFTLEVBQ2hCLEVBQUU7WUFDbkIsTUFBTSxNQUFNLEdBQXVCO2dCQUNqQyxRQUFRO2dCQUNSLFFBQVE7Z0JBQ1IsTUFBTTtnQkFDTixTQUFTLEVBQUUsU0FBUyxDQUFDLE9BQU8sRUFBRSxHQUFHLElBQUk7Z0JBQ3JDLE9BQU8sRUFBRSxPQUFPLENBQUMsT0FBTyxFQUFFLEdBQUcsSUFBSTtnQkFDakMsV0FBVyxFQUFFLFdBQVcsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUNyQyxhQUFhO2FBQ2QsQ0FBQTtZQUNELElBQUksT0FBTyxpQkFBaUIsS0FBSyxXQUFXLEVBQUU7Z0JBQzVDLE1BQU0sQ0FBQyxpQkFBaUIsR0FBRyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUE7YUFDMUQ7WUFDRCxNQUFNLFFBQVEsR0FBd0IsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUN6RCx1QkFBdUIsRUFDdkIsTUFBTSxDQUNQLENBQUE7WUFDRCxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQTtRQUNsQyxDQUFDLENBQUEsQ0FBQTtRQUVEOzs7Ozs7Ozs7Ozs7V0FZRztRQUNILHVCQUFrQixHQUFHLENBQ25CLFFBQWdCLEVBQ2hCLFFBQWdCLEVBQ2hCLE1BQWMsRUFDZCxRQUF5QixFQUN6QixTQUFlLEVBQ2YsT0FBYSxFQUNiLE1BQWMsRUFDRyxFQUFFO1lBQ25CLE1BQU0sTUFBTSxHQUFRO2dCQUNsQixRQUFRO2dCQUNSLFFBQVE7Z0JBQ1IsTUFBTTtnQkFDTixTQUFTLEVBQUUsU0FBUyxDQUFDLE9BQU8sRUFBRSxHQUFHLElBQUk7Z0JBQ3JDLE9BQU8sRUFBRSxPQUFPLENBQUMsT0FBTyxFQUFFLEdBQUcsSUFBSTtnQkFDakMsTUFBTTthQUNQLENBQUE7WUFDRCxJQUFJLE9BQU8sUUFBUSxLQUFLLFFBQVEsRUFBRTtnQkFDaEMsTUFBTSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUE7YUFDM0I7aUJBQU0sSUFBSSxPQUFPLFFBQVEsS0FBSyxXQUFXLEVBQUU7Z0JBQzFDLE1BQU0sQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQTthQUNoRDtZQUNELE1BQU0sUUFBUSxHQUF3QixNQUFNLElBQUksQ0FBQyxVQUFVLENBQ3pELDZCQUE2QixFQUM3QixNQUFNLENBQ1AsQ0FBQTtZQUNELE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFBO1FBQ2xDLENBQUMsQ0FBQSxDQUFBO1FBRUQ7Ozs7Ozs7Ozs7Ozs7O1dBY0c7UUFDSCxpQkFBWSxHQUFHLENBQ2IsUUFBZ0IsRUFDaEIsUUFBZ0IsRUFDaEIsTUFBYyxFQUNkLFNBQWUsRUFDZixPQUFhLEVBQ2IsV0FBZSxFQUNmLGFBQXFCLEVBQ0osRUFBRTtZQUNuQixNQUFNLE1BQU0sR0FBdUI7Z0JBQ2pDLFFBQVE7Z0JBQ1IsUUFBUTtnQkFDUixNQUFNO2dCQUNOLFNBQVMsRUFBRSxTQUFTLENBQUMsT0FBTyxFQUFFLEdBQUcsSUFBSTtnQkFDckMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxPQUFPLEVBQUUsR0FBRyxJQUFJO2dCQUNqQyxXQUFXLEVBQUUsV0FBVyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0JBQ3JDLGFBQWE7YUFDZCxDQUFBO1lBQ0QsTUFBTSxRQUFRLEdBQXdCLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FDekQsdUJBQXVCLEVBQ3ZCLE1BQU0sQ0FDUCxDQUFBO1lBQ0QsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUE7UUFDbEMsQ0FBQyxDQUFBLENBQUE7UUFFRDs7Ozs7Ozs7Ozs7V0FXRztRQUNILGlCQUFZLEdBQUcsQ0FDYixRQUFnQixFQUNoQixRQUFnQixFQUNoQixXQUFxQixFQUNyQixTQUFpQixFQUNzQixFQUFFO1lBQ3pDLE1BQU0sTUFBTSxHQUF1QjtnQkFDakMsUUFBUTtnQkFDUixRQUFRO2dCQUNSLFdBQVc7Z0JBQ1gsU0FBUzthQUNWLENBQUE7WUFDRCxNQUFNLFFBQVEsR0FBd0IsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUN6RCx1QkFBdUIsRUFDdkIsTUFBTSxDQUNQLENBQUE7WUFDRCxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUk7Z0JBQzlCLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJO2dCQUMzQixDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUE7UUFDMUIsQ0FBQyxDQUFBLENBQUE7UUFFRDs7Ozs7OztXQU9HO1FBQ0gsZ0JBQVcsR0FBRyxDQUFPLFlBQW9CLEVBQW1CLEVBQUU7WUFDNUQsTUFBTSxNQUFNLEdBQVE7Z0JBQ2xCLFlBQVk7YUFDYixDQUFBO1lBQ0QsTUFBTSxRQUFRLEdBQXdCLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FDekQsc0JBQXNCLEVBQ3RCLE1BQU0sQ0FDUCxDQUFBO1lBQ0QsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUE7UUFDdEMsQ0FBQyxDQUFBLENBQUE7UUFFRDs7Ozs7OztXQU9HO1FBQ0gsY0FBUyxHQUFHLENBQU8sUUFBeUIsRUFBcUIsRUFBRTtZQUNqRSxNQUFNLE1BQU0sR0FBUTtnQkFDbEIsUUFBUTthQUNULENBQUE7WUFDRCxJQUFJLE9BQU8sUUFBUSxLQUFLLFFBQVEsRUFBRTtnQkFDaEMsTUFBTSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUE7YUFDM0I7aUJBQU0sSUFBSSxPQUFPLFFBQVEsS0FBSyxXQUFXLEVBQUU7Z0JBQzFDLE1BQU0sQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQTthQUNoRDtZQUNELE1BQU0sUUFBUSxHQUF3QixNQUFNLElBQUksQ0FBQyxVQUFVLENBQ3pELG9CQUFvQixFQUNwQixNQUFNLENBQ1AsQ0FBQTtZQUNELE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFBO1FBQzNDLENBQUMsQ0FBQSxDQUFBO1FBRUQ7Ozs7V0FJRztRQUNILG1CQUFjLEdBQUcsR0FBZ0MsRUFBRTtZQUNqRCxNQUFNLFFBQVEsR0FBd0IsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUN6RCx5QkFBeUIsQ0FDMUIsQ0FBQTtZQUNELE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFBO1FBQ3pDLENBQUMsQ0FBQSxDQUFBO1FBRUQ7Ozs7Ozs7Ozs7Ozs7V0FhRztRQUNILGVBQVUsR0FBRyxDQUNYLFFBQWdCLEVBQ2hCLFFBQWdCLEVBQ2hCLE1BQVUsRUFDVixFQUFVLEVBQzZCLEVBQUU7WUFDekMsTUFBTSxNQUFNLEdBQXFCO2dCQUMvQixRQUFRO2dCQUNSLFFBQVE7Z0JBQ1IsRUFBRTtnQkFDRixNQUFNLEVBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7YUFDNUIsQ0FBQTtZQUNELE1BQU0sUUFBUSxHQUF3QixNQUFNLElBQUksQ0FBQyxVQUFVLENBQ3pELHFCQUFxQixFQUNyQixNQUFNLENBQ1AsQ0FBQTtZQUNELE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSTtnQkFDOUIsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUk7Z0JBQzNCLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQTtRQUMxQixDQUFDLENBQUEsQ0FBQTtRQUVEOzs7Ozs7Ozs7Ozs7OztXQWNHO1FBQ0gsZUFBVSxHQUFHLENBQ1gsUUFBZ0IsRUFDaEIsUUFBZ0IsRUFDaEIsRUFBVSxFQUNWLFdBQW1CLEVBQ29CLEVBQUU7WUFDekMsTUFBTSxNQUFNLEdBQXFCO2dCQUMvQixFQUFFO2dCQUNGLFdBQVc7Z0JBQ1gsUUFBUTtnQkFDUixRQUFRO2FBQ1QsQ0FBQTtZQUNELE1BQU0sUUFBUSxHQUF3QixNQUFNLElBQUksQ0FBQyxVQUFVLENBQ3pELHFCQUFxQixFQUNyQixNQUFNLENBQ1AsQ0FBQTtZQUNELE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSTtnQkFDOUIsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUk7Z0JBQzNCLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQTtRQUMxQixDQUFDLENBQUEsQ0FBQTtRQUVEOzs7Ozs7V0FNRztRQUNILFlBQU8sR0FBRyxDQUFPLEVBQXdCLEVBQW1CLEVBQUU7WUFDNUQsSUFBSSxXQUFXLEdBQUcsRUFBRSxDQUFBO1lBQ3BCLElBQUksT0FBTyxFQUFFLEtBQUssUUFBUSxFQUFFO2dCQUMxQixXQUFXLEdBQUcsRUFBRSxDQUFBO2FBQ2pCO2lCQUFNLElBQUksRUFBRSxZQUFZLGVBQU0sRUFBRTtnQkFDL0IsTUFBTSxLQUFLLEdBQU8sSUFBSSxPQUFFLEVBQUUsQ0FBQTtnQkFDMUIsS0FBSyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQTtnQkFDcEIsV0FBVyxHQUFHLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQTthQUNsQztpQkFBTSxJQUFJLEVBQUUsWUFBWSxPQUFFLEVBQUU7Z0JBQzNCLFdBQVcsR0FBRyxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUE7YUFDL0I7aUJBQU07Z0JBQ0wsMEJBQTBCO2dCQUMxQixNQUFNLElBQUkseUJBQWdCLENBQ3hCLHFGQUFxRixDQUN0RixDQUFBO2FBQ0Y7WUFDRCxNQUFNLE1BQU0sR0FBUTtnQkFDbEIsRUFBRSxFQUFFLFdBQVcsQ0FBQyxRQUFRLEVBQUU7Z0JBQzFCLFFBQVEsRUFBRSxLQUFLO2FBQ2hCLENBQUE7WUFDRCxNQUFNLFFBQVEsR0FBd0IsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUN6RCxrQkFBa0IsRUFDbEIsTUFBTSxDQUNQLENBQUE7WUFDRCxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQTtRQUNsQyxDQUFDLENBQUEsQ0FBQTtRQUVEOztXQUVHO1FBQ0gscUJBQWdCLEdBQUcsR0FBc0IsRUFBRTtZQUN6QyxNQUFNLFFBQVEsR0FBd0IsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUN6RCwyQkFBMkIsQ0FDNUIsQ0FBQTtZQUNELE9BQU8sSUFBSSxlQUFFLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFBO1FBQ2hELENBQUMsQ0FBQSxDQUFBO1FBRUQ7O1dBRUc7UUFDSCxjQUFTLEdBQUcsR0FBc0IsRUFBRTtZQUNsQyxNQUFNLFFBQVEsR0FBd0IsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUN6RCxvQkFBb0IsQ0FDckIsQ0FBQTtZQUNELE9BQU8sSUFBSSxlQUFFLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFBO1FBQ2hELENBQUMsQ0FBQSxDQUFBO1FBRUQ7Ozs7V0FJRztRQUNILGdCQUFXLEdBQUcsQ0FDWixVQUFtQixLQUFLLEVBQ00sRUFBRTtZQUNoQyxJQUNFLE9BQU8sS0FBSyxJQUFJO2dCQUNoQixPQUFPLElBQUksQ0FBQyxpQkFBaUIsS0FBSyxXQUFXO2dCQUM3QyxPQUFPLElBQUksQ0FBQyxpQkFBaUIsS0FBSyxXQUFXLEVBQzdDO2dCQUNBLE9BQU87b0JBQ0wsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLGlCQUFpQjtvQkFDekMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLGlCQUFpQjtpQkFDMUMsQ0FBQTthQUNGO1lBQ0QsTUFBTSxRQUFRLEdBQXdCLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FDekQsc0JBQXNCLENBQ3ZCLENBQUE7WUFDRCxJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxlQUFFLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsaUJBQWlCLEVBQUUsRUFBRSxDQUFDLENBQUE7WUFDM0UsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksZUFBRSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLGlCQUFpQixFQUFFLEVBQUUsQ0FBQyxDQUFBO1lBQzNFLE9BQU87Z0JBQ0wsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLGlCQUFpQjtnQkFDekMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLGlCQUFpQjthQUMxQyxDQUFBO1FBQ0gsQ0FBQyxDQUFBLENBQUE7UUFFRDs7OztXQUlHO1FBQ0gsa0JBQWEsR0FBRyxHQUFzQixFQUFFO1lBQ3RDLE1BQU0sUUFBUSxHQUF3QixNQUFNLElBQUksQ0FBQyxVQUFVLENBQ3pELHdCQUF3QixDQUN6QixDQUFBO1lBQ0QsT0FBTyxJQUFJLGVBQUUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUE7UUFDL0MsQ0FBQyxDQUFBLENBQUE7UUFFRDs7Ozs7Ozs7V0FRRztRQUNILHNCQUFpQixHQUFHLENBQ2xCLFFBQXlCLEVBQ3pCLE1BQWMsRUFDZCxTQUFhLEVBQ2IsT0FBVyxFQUNFLEVBQUU7WUFDZixNQUFNLEdBQUcsR0FBTyxJQUFBLHlCQUFPLEdBQUUsQ0FBQTtZQUN6QixJQUFJLFNBQVMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRTtnQkFDL0MsTUFBTSxJQUFJLGtCQUFTLENBQ2pCLHdHQUF3RyxDQUN6RyxDQUFBO2FBQ0Y7WUFFRCxNQUFNLE1BQU0sR0FBNEI7Z0JBQ3RDLE1BQU0sRUFBRSxNQUFNO2dCQUNkLFNBQVMsRUFBRSxTQUFTLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDakMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2FBQzlCLENBQUE7WUFFRCxJQUFJLE9BQU8sUUFBUSxLQUFLLFFBQVEsRUFBRTtnQkFDaEMsTUFBTSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUE7YUFDM0I7aUJBQU0sSUFBSSxPQUFPLFFBQVEsS0FBSyxXQUFXLEVBQUU7Z0JBQzFDLE1BQU0sQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQTthQUNoRDtZQUVELE1BQU0sUUFBUSxHQUF3QixNQUFNLElBQUksQ0FBQyxVQUFVLENBQ3pELDRCQUE0QixFQUM1QixNQUFNLENBQ1AsQ0FBQTtZQUNELE9BQU8sSUFBSSxlQUFFLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFBO1FBQ2hELENBQUMsQ0FBQSxDQUFBO1FBRUQ7Ozs7V0FJRztRQUNILGdCQUFXLEdBQUcsQ0FDWixvQkFBd0IsU0FBUyxFQUNqQyxvQkFBd0IsU0FBUyxFQUMzQixFQUFFO1lBQ1IsSUFBSSxPQUFPLGlCQUFpQixLQUFLLFdBQVcsRUFBRTtnQkFDNUMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLGlCQUFpQixDQUFBO2FBQzNDO1lBQ0QsSUFBSSxPQUFPLGlCQUFpQixLQUFLLFdBQVcsRUFBRTtnQkFDNUMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLGlCQUFpQixDQUFBO2FBQzNDO1FBQ0gsQ0FBQyxDQUFBO1FBRUQ7O1dBRUc7UUFDSCxhQUFRLEdBQUcsQ0FDVCxTQUFtQixFQUNuQixXQUFtQixLQUFLLEVBQ0csRUFBRTtZQUM3QixNQUFNLE1BQU0sR0FBbUI7Z0JBQzdCLFNBQVM7Z0JBQ1QsUUFBUTthQUNULENBQUE7WUFDRCxNQUFNLFFBQVEsR0FBd0IsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUN6RCxtQkFBbUIsRUFDbkIsTUFBTSxDQUNQLENBQUE7WUFDRCxPQUFPO2dCQUNMLE1BQU0sRUFBRSxJQUFJLGVBQUUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO2dCQUMvQyxhQUFhLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FDbkQsQ0FBQyxZQUFvQixFQUFzQixFQUFFO29CQUMzQyxNQUFNLGtCQUFrQixHQUN0QixJQUFJLDRCQUFrQixFQUFFLENBQUE7b0JBQzFCLElBQUksR0FBVyxDQUFBO29CQUNmLElBQUksUUFBUSxLQUFLLE1BQU0sRUFBRTt3QkFDdkIsR0FBRyxHQUFHLFFBQVEsQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLENBQUE7cUJBQ3hDO3lCQUFNO3dCQUNMLEdBQUcsR0FBRyxlQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFBO3FCQUMxRDtvQkFDRCxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFBO29CQUNyQyxPQUFPLGtCQUFrQixDQUFBO2dCQUMzQixDQUFDLENBQ0Y7YUFDRixDQUFBO1FBQ0gsQ0FBQyxDQUFBLENBQUE7UUFFRDs7Ozs7OztXQU9HO1FBQ0gsZUFBVSxHQUFHLENBQU8sTUFBZ0IsU0FBUyxFQUFxQixFQUFFO1lBQ2xFLE1BQU0sTUFBTSxHQUFRLEVBQUUsQ0FBQTtZQUN0QixJQUFJLE9BQU8sR0FBRyxLQUFLLFNBQVMsRUFBRTtnQkFDNUIsTUFBTSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUE7YUFDakI7WUFDRCxNQUFNLFFBQVEsR0FBd0IsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUN6RCxxQkFBcUIsRUFDckIsTUFBTSxDQUNQLENBQUE7WUFDRCxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQTtRQUNyQyxDQUFDLENBQUEsQ0FBQTtRQUVEOzs7Ozs7OztXQVFHO1FBQ0gsY0FBUyxHQUFHLENBQ1YsUUFBZ0IsRUFDaEIsUUFBZ0IsRUFDaEIsT0FBZSxFQUN3QixFQUFFO1lBQ3pDLE1BQU0sTUFBTSxHQUFvQjtnQkFDOUIsUUFBUTtnQkFDUixRQUFRO2dCQUNSLE9BQU87YUFDUixDQUFBO1lBQ0QsTUFBTSxRQUFRLEdBQXdCLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FDekQsb0JBQW9CLEVBQ3BCLE1BQU0sQ0FDUCxDQUFBO1lBQ0QsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVO2dCQUNwQyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVTtnQkFDakMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFBO1FBQzFCLENBQUMsQ0FBQSxDQUFBO1FBRUQ7Ozs7Ozs7O1dBUUc7UUFDSCxjQUFTLEdBQUcsQ0FDVixRQUFnQixFQUNoQixRQUFnQixFQUNoQixVQUFrQixFQUNxQixFQUFFO1lBQ3pDLE1BQU0sTUFBTSxHQUFvQjtnQkFDOUIsUUFBUTtnQkFDUixRQUFRO2dCQUNSLFVBQVU7YUFDWCxDQUFBO1lBQ0QsTUFBTSxRQUFRLEdBQXdCLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FDekQsb0JBQW9CLEVBQ3BCLE1BQU0sQ0FDUCxDQUFBO1lBRUQsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPO2dCQUNqQyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTztnQkFDOUIsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFBO1FBQzFCLENBQUMsQ0FBQSxDQUFBO1FBRUQ7Ozs7Ozs7V0FPRztRQUNILFVBQUssR0FBRyxDQUNOLElBQVksRUFDWixXQUFtQixLQUFLLEVBQ0UsRUFBRTtZQUM1QixNQUFNLE1BQU0sR0FBUTtnQkFDbEIsSUFBSTtnQkFDSixRQUFRO2FBQ1QsQ0FBQTtZQUNELE1BQU0sUUFBUSxHQUF3QixNQUFNLElBQUksQ0FBQyxVQUFVLENBQ3pELGdCQUFnQixFQUNoQixNQUFNLENBQ1AsQ0FBQTtZQUNELE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDNUIsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7Z0JBQ3pCLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQTtRQUMxQixDQUFDLENBQUEsQ0FBQTtRQUVEOzs7Ozs7O1dBT0c7UUFDSCxnQkFBVyxHQUFHLENBQ1osSUFBWSxFQUNaLGdCQUF5QixJQUFJLEVBQ1UsRUFBRTtZQUN6QyxNQUFNLE1BQU0sR0FBc0I7Z0JBQ2hDLElBQUksRUFBRSxJQUFJO2dCQUNWLGFBQWEsRUFBRSxhQUFhO2FBQzdCLENBQUE7WUFDRCxNQUFNLFFBQVEsR0FBd0IsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUN6RCxzQkFBc0IsRUFDdEIsTUFBTSxDQUNQLENBQUE7WUFDRCxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFBO1FBQzdCLENBQUMsQ0FBQSxDQUFBO1FBRUQ7Ozs7Ozs7Ozs7Ozs7OztXQWVHO1FBQ0gsYUFBUSxHQUFHLENBQ1QsU0FBNEIsRUFDNUIsY0FBc0IsU0FBUyxFQUMvQixRQUFnQixDQUFDLEVBQ2pCLGFBQWdELFNBQVMsRUFDekQsY0FBa0MsU0FBUyxFQUMzQyxXQUFtQixLQUFLLEVBQ0csRUFBRTtZQUM3QixJQUFJLE9BQU8sU0FBUyxLQUFLLFFBQVEsRUFBRTtnQkFDakMsU0FBUyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUE7YUFDeEI7WUFFRCxNQUFNLE1BQU0sR0FBbUI7Z0JBQzdCLFNBQVMsRUFBRSxTQUFTO2dCQUNwQixLQUFLO2dCQUNMLFFBQVE7YUFDVCxDQUFBO1lBQ0QsSUFBSSxPQUFPLFVBQVUsS0FBSyxXQUFXLElBQUksVUFBVSxFQUFFO2dCQUNuRCxNQUFNLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQTthQUMvQjtZQUVELElBQUksT0FBTyxXQUFXLEtBQUssV0FBVyxFQUFFO2dCQUN0QyxNQUFNLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQTthQUNqQztZQUVELE1BQU0sUUFBUSxHQUF3QixNQUFNLElBQUksQ0FBQyxVQUFVLENBQ3pELG1CQUFtQixFQUNuQixNQUFNLENBQ1AsQ0FBQTtZQUVELE1BQU0sS0FBSyxHQUFZLElBQUksZUFBTyxFQUFFLENBQUE7WUFDcEMsSUFBSSxJQUFJLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFBO1lBQ3JDLElBQUksV0FBVyxJQUFJLE9BQU8sV0FBVyxLQUFLLFFBQVEsRUFBRTtnQkFDbEQsSUFBSSxJQUFJLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUMsRUFBRTtvQkFDdEMsTUFBTSxTQUFTLEdBQWEsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUE7b0JBQzlELElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRTt3QkFDNUIsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQTt3QkFDcEIsTUFBTSxJQUFJLEdBQVksSUFBSSxlQUFPLEVBQUUsQ0FBQTt3QkFDbkMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQTt3QkFDeEIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsV0FBVyxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUE7d0JBQ25ELElBQUksR0FBRyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQTtxQkFDaEM7aUJBQ0Y7Z0JBQ0QsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxXQUFXLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQTthQUNyRTtZQUVELElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssSUFBSSxFQUFFO2dCQUN2RCxNQUFNLFFBQVEsR0FBYSxFQUFFLENBQUE7Z0JBQzdCLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFXLEVBQVEsRUFBRTtvQkFDakMsUUFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLGVBQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUE7Z0JBQ3RFLENBQUMsQ0FBQyxDQUFBO2dCQUVGLEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFBO2FBQ2hDO2lCQUFNO2dCQUNMLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFBO2FBQzVCO1lBQ0QsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQTtZQUNsQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFBO1lBQzNFLE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUE7UUFDN0IsQ0FBQyxDQUFBLENBQUE7UUFFRDs7OztXQUlHO1FBQ0gscUJBQWdCLEdBQUcsQ0FBTyxPQUFlLEVBQWUsRUFBRTtZQUN4RCxNQUFNLE1BQU0sR0FBa0I7Z0JBQzVCLE9BQU8sRUFBRSxPQUFPO2FBQ2pCLENBQUE7WUFDRCxNQUFNLFFBQVEsR0FBd0IsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUN6RCwyQkFBMkIsRUFDM0IsTUFBTSxDQUNQLENBQUE7WUFDRCxPQUFPLElBQUksZUFBRSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFBO1FBQ3pDLENBQUMsQ0FBQSxDQUFBO1FBRUQ7Ozs7V0FJRztRQUNILHFCQUFnQixHQUFHLENBQU8sT0FBZSxFQUErQixFQUFFO1lBQ3hFLE1BQU0sTUFBTSxHQUFrQjtnQkFDNUIsT0FBTyxFQUFFLE9BQU87YUFDakIsQ0FBQTtZQUNELE1BQU0sUUFBUSxHQUF3QixNQUFNLElBQUksQ0FBQyxVQUFVLENBQ3pELDJCQUEyQixFQUMzQixNQUFNLENBQ1AsQ0FBQTtZQUNELE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUE7UUFDN0IsQ0FBQyxDQUFBLENBQUE7UUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7OztXQW1CRztRQUNILGdCQUFXLEdBQUcsQ0FDWixPQUFnQixFQUNoQixNQUFVLEVBQ1YsV0FBcUIsRUFDckIsYUFBdUIsRUFDdkIsZUFBeUIsRUFDekIsT0FBNkIsU0FBUyxFQUN0QyxPQUFXLElBQUEseUJBQU8sR0FBRSxFQUNwQixXQUFlLElBQUksZUFBRSxDQUFDLENBQUMsQ0FBQyxFQUN4QixjQUFzQixDQUFDLEVBQ3ZCLGtCQUEwQixDQUFDLEVBQ04sRUFBRTtZQUN2QixNQUFNLE1BQU0sR0FBVyxhQUFhLENBQUE7WUFDcEMsTUFBTSxFQUFFLEdBQWEsSUFBSSxDQUFDLHdCQUF3QixDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsQ0FBQTtZQUN2RSxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsYUFBYSxFQUFFLE1BQU0sQ0FBQyxDQUFBO1lBQy9ELE1BQU0sTUFBTSxHQUFhLElBQUksQ0FBQyx3QkFBd0IsQ0FDcEQsZUFBZSxFQUNmLE1BQU0sQ0FDUCxDQUFBO1lBRUQsSUFBSSxJQUFJLFlBQVkscUJBQVcsRUFBRTtnQkFDL0IsSUFBSSxHQUFHLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQTthQUN6QjtZQUNELE1BQU0sU0FBUyxHQUFXLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUE7WUFDbEQsTUFBTSxlQUFlLEdBQVcsUUFBUSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUE7WUFDdEUsTUFBTSxHQUFHLEdBQU8sSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFBO1lBQy9CLE1BQU0sVUFBVSxHQUFXLE1BQU0sSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFBO1lBRXRELE1BQU0sZUFBZSxHQUFlLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FDeEQsT0FBTyxDQUNSLENBQUMsV0FBVyxDQUNYLFNBQVMsRUFDVCxlQUFlLEVBQ2YsTUFBTSxFQUNOLFVBQVUsRUFDVixFQUFFLEVBQ0YsVUFBVSxFQUNWLE1BQU0sRUFDTixHQUFHLEVBQ0gsVUFBVSxFQUNWLElBQUksRUFDSixJQUFJLEVBQ0osUUFBUSxFQUNSLFdBQVcsRUFDWCxlQUFlLENBQ2hCLENBQUE7WUFFRCxJQUFJLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsZUFBZSxDQUFDLENBQUMsRUFBRTtnQkFDaEQsMEJBQTBCO2dCQUMxQixJQUFJLDJCQUFrQixDQUFDLHdCQUF3QixDQUFDLENBQUE7YUFDakQ7WUFFRCxPQUFPLGVBQWUsQ0FBQTtRQUN4QixDQUFDLENBQUEsQ0FBQTtRQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztXQW9CRztRQUNILGtCQUFhLEdBQUcsQ0FDZCxPQUFnQixFQUNoQixjQUF3QixFQUN4QixXQUE0QixFQUM1QixXQUFxQixFQUNyQixhQUF1QixFQUN2QixrQkFBNEIsU0FBUyxFQUNyQyxPQUE2QixTQUFTLEVBQ3RDLE9BQVcsZUFBTSxFQUNqQixXQUFlLGVBQU0sRUFDckIsY0FBc0IsQ0FBQyxFQUN2QixrQkFBMEIsQ0FBQyxFQUNOLEVBQUU7WUFDdkIsTUFBTSxNQUFNLEdBQUcsZUFBZSxDQUFBO1lBRTlCLE1BQU0sRUFBRSxHQUFhLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLENBQUE7WUFFdkUsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGFBQWEsRUFBRSxNQUFNLENBQUMsQ0FBQTtZQUUvRCxNQUFNLE1BQU0sR0FBYSxJQUFJLENBQUMsd0JBQXdCLENBQ3BELGVBQWUsRUFDZixNQUFNLENBQ1AsQ0FBQTtZQUVELElBQUksUUFBUSxHQUFXLFNBQVMsQ0FBQTtZQUVoQyxJQUFJLE9BQU8sV0FBVyxLQUFLLFdBQVcsRUFBRTtnQkFDdEMsTUFBTSxJQUFJLHFCQUFZLENBQ3BCLG1FQUFtRSxDQUNwRSxDQUFBO2FBQ0Y7aUJBQU0sSUFBSSxPQUFPLFdBQVcsS0FBSyxRQUFRLEVBQUU7Z0JBQzFDLFFBQVEsR0FBRyxXQUFXLENBQUE7Z0JBQ3RCLFdBQVcsR0FBRyxRQUFRLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFBO2FBQy9DO2lCQUFNLElBQUksQ0FBQyxDQUFDLFdBQVcsWUFBWSxlQUFNLENBQUMsRUFBRTtnQkFDM0MsTUFBTSxJQUFJLHFCQUFZLENBQ3BCLHNFQUFzRTtvQkFDcEUsT0FBTyxXQUFXLENBQ3JCLENBQUE7YUFDRjtZQUNELE1BQU0sV0FBVyxHQUFZLE1BQU0sQ0FDakMsTUFBTSxJQUFJLENBQUMsUUFBUSxDQUFDLGNBQWMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUM1RCxDQUFDLEtBQUssQ0FBQTtZQUNQLE1BQU0sV0FBVyxHQUFXLE1BQU0sSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFBO1lBRXZELElBQUksSUFBSSxZQUFZLHFCQUFXLEVBQUU7Z0JBQy9CLElBQUksR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUE7YUFDekI7WUFFRCxNQUFNLE9BQU8sR0FBVyxXQUFXLENBQUMsV0FBVyxFQUFFLENBQUE7WUFFakQsTUFBTSxlQUFlLEdBQWUsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUN4RCxPQUFPLENBQ1IsQ0FBQyxhQUFhLENBQ2IsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsRUFDeEIsUUFBUSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQ3RDLEVBQUUsRUFDRixVQUFVLEVBQ1YsTUFBTSxFQUNOLE9BQU8sRUFDUCxXQUFXLEVBQ1gsSUFBSSxDQUFDLFFBQVEsRUFBRSxFQUNmLFdBQVcsRUFDWCxJQUFJLEVBQ0osSUFBSSxFQUNKLFFBQVEsRUFDUixXQUFXLEVBQ1gsZUFBZSxDQUNoQixDQUFBO1lBRUQsSUFBSSxDQUFDLENBQUMsTUFBTSxJQUFJLENBQUMsYUFBYSxDQUFDLGVBQWUsQ0FBQyxDQUFDLEVBQUU7Z0JBQ2hELDBCQUEwQjtnQkFDMUIsTUFBTSxJQUFJLDJCQUFrQixDQUFDLHdCQUF3QixDQUFDLENBQUE7YUFDdkQ7WUFFRCxPQUFPLGVBQWUsQ0FBQTtRQUN4QixDQUFDLENBQUEsQ0FBQTtRQUVEOzs7Ozs7Ozs7Ozs7Ozs7OztXQWlCRztRQUNILGtCQUFhLEdBQUcsQ0FDZCxPQUFnQixFQUNoQixNQUFVLEVBQ1YsZ0JBQWlDLEVBQ2pDLFdBQXFCLEVBQ3JCLGFBQXVCLEVBQ3ZCLGtCQUE0QixTQUFTLEVBQ3JDLE9BQTZCLFNBQVMsRUFDdEMsT0FBVyxlQUFNLEVBQ2pCLFdBQWUsZUFBTSxFQUNyQixjQUFzQixDQUFDLEVBQ3ZCLGtCQUEwQixDQUFDLEVBQ04sRUFBRTtZQUN2QixNQUFNLE1BQU0sR0FBRyxlQUFlLENBQUE7WUFFOUIsSUFBSSxRQUFRLEdBQVcsRUFBRSxDQUFBO1lBQ3pCLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFTLEVBQVEsRUFBRTtnQkFDbEMsUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUE7WUFDbEMsQ0FBQyxDQUFDLENBQUE7WUFDRixJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtnQkFDdEMsTUFBTSxJQUFJLHFCQUFZLENBQ3BCLHNGQUFzRixDQUN2RixDQUFBO2FBQ0Y7WUFFRCxJQUFJLE9BQU8sZ0JBQWdCLEtBQUssV0FBVyxFQUFFO2dCQUMzQyxNQUFNLElBQUkscUJBQVksQ0FDcEIsd0VBQXdFLENBQ3pFLENBQUE7YUFDRjtpQkFBTSxJQUFJLE9BQU8sZ0JBQWdCLEtBQUssUUFBUSxFQUFFO2dCQUMvQyxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsVUFBVSxDQUFDLGdCQUFnQixDQUFDLENBQUEsQ0FBQyxFQUFFO2FBQzVEO2lCQUFNLElBQUksQ0FBQyxDQUFDLGdCQUFnQixZQUFZLGVBQU0sQ0FBQyxFQUFFO2dCQUNoRCxNQUFNLElBQUkscUJBQVksQ0FDcEIsc0VBQXNFO29CQUNwRSxPQUFPLGdCQUFnQixDQUMxQixDQUFBO2FBQ0Y7WUFDRCxJQUFJLGdCQUFnQixDQUFDLE1BQU0sS0FBSyxFQUFFLEVBQUU7Z0JBQ2xDLE1BQU0sSUFBSSxxQkFBWSxDQUNwQixzRkFBc0YsQ0FDdkYsQ0FBQTthQUNGO1lBRUQsSUFBSSxFQUFFLEdBQWEsRUFBRSxDQUFBO1lBQ3JCLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFTLEVBQVEsRUFBRTtnQkFDbEMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7WUFDdEMsQ0FBQyxDQUFDLENBQUE7WUFFRixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsYUFBYSxFQUFFLE1BQU0sQ0FBQyxDQUFBO1lBRS9ELE1BQU0sTUFBTSxHQUFhLElBQUksQ0FBQyx3QkFBd0IsQ0FDcEQsZUFBZSxFQUNmLE1BQU0sQ0FDUCxDQUFBO1lBRUQsSUFBSSxJQUFJLFlBQVkscUJBQVcsRUFBRTtnQkFDL0IsSUFBSSxHQUFHLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQTthQUN6QjtZQUVELE1BQU0sV0FBVyxHQUFXLE1BQU0sSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFBO1lBRXZELE1BQU0sZUFBZSxHQUFlLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FDeEQsT0FBTyxDQUNSLENBQUMsYUFBYSxDQUNiLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLEVBQ3hCLFFBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUN0QyxNQUFNLEVBQ04sV0FBVyxFQUNYLEVBQUUsRUFDRixVQUFVLEVBQ1YsZ0JBQWdCLEVBQ2hCLE1BQU0sRUFDTixJQUFJLENBQUMsUUFBUSxFQUFFLEVBQ2YsV0FBVyxFQUNYLElBQUksRUFDSixJQUFJLEVBQ0osUUFBUSxFQUNSLFdBQVcsRUFDWCxlQUFlLENBQ2hCLENBQUE7WUFFRCxJQUFJLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsZUFBZSxDQUFDLENBQUMsRUFBRTtnQkFDaEQsMEJBQTBCO2dCQUMxQixNQUFNLElBQUksMkJBQWtCLENBQUMsd0JBQXdCLENBQUMsQ0FBQTthQUN2RDtZQUVELE9BQU8sZUFBZSxDQUFBO1FBQ3hCLENBQUMsQ0FBQSxDQUFBO1FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7O1dBaUJHO1FBRUgsOEJBQXlCLEdBQUcsQ0FDMUIsT0FBZ0IsRUFDaEIsYUFBdUIsRUFDdkIsZUFBeUIsRUFDekIsTUFBYyxFQUNkLFNBQWEsRUFDYixPQUFXLEVBQ1gsTUFBVSxFQUNWLFFBQWdCLEVBQ2hCLE9BQTZCLFNBQVMsRUFDdEMsT0FBVyxlQUFNLEVBQ2pCLGFBQW1CLEVBQUUsU0FBUyxFQUFFLEVBQUUsRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFDOUQsa0JBQTBCLENBQUMsRUFDTixFQUFFO1lBQ3ZCLE1BQU0sTUFBTSxHQUFHLDJCQUEyQixDQUFBO1lBRTFDLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFhLEVBQUUsTUFBTSxDQUFDLENBQUE7WUFFL0QsTUFBTSxNQUFNLEdBQWEsSUFBSSxDQUFDLHdCQUF3QixDQUNwRCxlQUFlLEVBQ2YsTUFBTSxDQUNQLENBQUE7WUFFRCxJQUFJLElBQUksWUFBWSxxQkFBVyxFQUFFO2dCQUMvQixJQUFJLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFBO2FBQ3pCO1lBRUQsTUFBTSxXQUFXLEdBQVcsTUFBTSxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUE7WUFFdkQsTUFBTSxHQUFHLEdBQU8sSUFBQSx5QkFBTyxHQUFFLENBQUE7WUFDekIsSUFBSSxTQUFTLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUU7Z0JBQy9DLE1BQU0sSUFBSSxLQUFLLENBQ2Isa0hBQWtILENBQ25ILENBQUE7YUFDRjtZQUVELE1BQU0sZUFBZSxHQUFlLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FDeEQsT0FBTyxDQUNSLENBQUMseUJBQXlCLENBQ3pCLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLEVBQ3hCLFFBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUN0QyxVQUFVLEVBQ1YsTUFBTSxFQUNOLElBQUEsc0NBQW9CLEVBQUMsTUFBTSxDQUFDLEVBQzVCLFNBQVMsRUFDVCxPQUFPLEVBQ1AsTUFBTSxFQUNOLFFBQVEsRUFDUixJQUFJLENBQUMsZUFBZSxFQUFFLEVBQ3RCLFdBQVcsRUFDWCxJQUFJLEVBQ0osSUFBSSxFQUNKLFVBQVUsRUFDVixlQUFlLENBQ2hCLENBQUE7WUFFRCxJQUFJLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsZUFBZSxDQUFDLENBQUMsRUFBRTtnQkFDaEQsMEJBQTBCO2dCQUMxQixNQUFNLElBQUksS0FBSyxDQUFDLHdCQUF3QixDQUFDLENBQUE7YUFDMUM7WUFFRCxPQUFPLGVBQWUsQ0FBQTtRQUN4QixDQUFDLENBQUEsQ0FBQTtRQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7V0FxQkc7UUFDSCx3QkFBbUIsR0FBRyxDQUNwQixPQUFnQixFQUNoQixXQUFxQixFQUNyQixhQUF1QixFQUN2QixlQUF5QixFQUN6QixNQUFjLEVBQ2QsU0FBYSxFQUNiLE9BQVcsRUFDWCxXQUFlLEVBQ2YsZUFBeUIsRUFDekIsaUJBQXFCLGVBQU0sRUFDM0Isa0JBQTBCLENBQUMsRUFDM0IsT0FBNkIsU0FBUyxFQUN0QyxPQUFXLGVBQU0sRUFDakIsY0FBc0IsQ0FBQyxFQUN2QixrQkFBMEIsQ0FBQyxFQUNOLEVBQUU7WUFDdkIsTUFBTSxNQUFNLEdBQUcscUJBQXFCLENBQUE7WUFDcEMsTUFBTSxFQUFFLEdBQWEsSUFBSSxDQUFDLHdCQUF3QixDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsQ0FBQTtZQUV2RSxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsYUFBYSxFQUFFLE1BQU0sQ0FBQyxDQUFBO1lBRS9ELE1BQU0sTUFBTSxHQUFhLElBQUksQ0FBQyx3QkFBd0IsQ0FDcEQsZUFBZSxFQUNmLE1BQU0sQ0FDUCxDQUFBO1lBQ0QsTUFBTSxPQUFPLEdBQWEsSUFBSSxDQUFDLHdCQUF3QixDQUNyRCxlQUFlLEVBQ2YsTUFBTSxDQUNQLENBQUE7WUFFRCxJQUFJLElBQUksWUFBWSxxQkFBVyxFQUFFO2dCQUMvQixJQUFJLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFBO2FBQ3pCO1lBRUQsTUFBTSxRQUFRLEdBQU8sQ0FBQyxNQUFNLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLENBQUE7WUFDcEUsSUFBSSxXQUFXLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFO2dCQUM1QixNQUFNLElBQUksbUJBQVUsQ0FDbEIscUVBQXFFO29CQUNuRSxRQUFRLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUN4QixDQUFBO2FBQ0Y7WUFFRCxNQUFNLFdBQVcsR0FBVyxNQUFNLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQTtZQUV2RCxNQUFNLEdBQUcsR0FBTyxJQUFBLHlCQUFPLEdBQUUsQ0FBQTtZQUN6QixJQUFJLFNBQVMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRTtnQkFDL0MsTUFBTSxJQUFJLGtCQUFTLENBQ2pCLDRHQUE0RyxDQUM3RyxDQUFBO2FBQ0Y7WUFFRCxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDLG1CQUFtQixFQUFFO2dCQUNoRCxNQUFNLElBQUksa0JBQVMsQ0FDakIsMkVBQTJFLENBQzVFLENBQUE7YUFDRjtZQUVELE1BQU0sZUFBZSxHQUFlLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FDeEQsT0FBTyxDQUNSLENBQUMsbUJBQW1CLENBQ25CLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLEVBQ3hCLFFBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUN0QyxXQUFXLEVBQ1gsRUFBRSxFQUNGLFVBQVUsRUFDVixNQUFNLEVBQ04sSUFBQSxzQ0FBb0IsRUFBQyxNQUFNLENBQUMsRUFDNUIsU0FBUyxFQUNULE9BQU8sRUFDUCxXQUFXLEVBQ1gsY0FBYyxFQUNkLGVBQWUsRUFDZixPQUFPLEVBQ1AsZUFBTSxFQUNOLFdBQVcsRUFDWCxJQUFJLEVBQ0osSUFBSSxFQUNKLFdBQVcsRUFDWCxlQUFlLENBQ2hCLENBQUE7WUFFRCxJQUFJLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsZUFBZSxDQUFDLENBQUMsRUFBRTtnQkFDaEQsMEJBQTBCO2dCQUMxQixNQUFNLElBQUksMkJBQWtCLENBQUMsd0JBQXdCLENBQUMsQ0FBQTthQUN2RDtZQUVELE9BQU8sZUFBZSxDQUFBO1FBQ3hCLENBQUMsQ0FBQSxDQUFBO1FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7V0FzQkc7UUFDSCx3QkFBbUIsR0FBRyxDQUNwQixPQUFnQixFQUNoQixXQUFxQixFQUNyQixhQUF1QixFQUN2QixlQUF5QixFQUN6QixNQUFjLEVBQ2QsU0FBYSxFQUNiLE9BQVcsRUFDWCxXQUFlLEVBQ2YsZUFBeUIsRUFDekIsYUFBcUIsRUFDckIsaUJBQXFCLGVBQU0sRUFDM0Isa0JBQTBCLENBQUMsRUFDM0IsT0FBNkIsU0FBUyxFQUN0QyxPQUFXLGVBQU0sRUFDakIsY0FBc0IsQ0FBQyxFQUN2QixrQkFBMEIsQ0FBQyxFQUNOLEVBQUU7WUFDdkIsTUFBTSxNQUFNLEdBQUcscUJBQXFCLENBQUE7WUFFcEMsTUFBTSxFQUFFLEdBQWEsSUFBSSxDQUFDLHdCQUF3QixDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsQ0FBQTtZQUV2RSxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsYUFBYSxFQUFFLE1BQU0sQ0FBQyxDQUFBO1lBRS9ELE1BQU0sTUFBTSxHQUFhLElBQUksQ0FBQyx3QkFBd0IsQ0FDcEQsZUFBZSxFQUNmLE1BQU0sQ0FDUCxDQUFBO1lBQ0QsTUFBTSxPQUFPLEdBQWEsSUFBSSxDQUFDLHdCQUF3QixDQUNyRCxlQUFlLEVBQ2YsTUFBTSxDQUNQLENBQUE7WUFFRCxJQUFJLElBQUksWUFBWSxxQkFBVyxFQUFFO2dCQUMvQixJQUFJLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFBO2FBQ3pCO1lBRUQsTUFBTSxRQUFRLEdBQU8sQ0FBQyxNQUFNLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLENBQUE7WUFDcEUsSUFBSSxXQUFXLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFO2dCQUM1QixNQUFNLElBQUksbUJBQVUsQ0FDbEIscUVBQXFFO29CQUNuRSxRQUFRLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUN4QixDQUFBO2FBQ0Y7WUFFRCxJQUNFLE9BQU8sYUFBYSxLQUFLLFFBQVE7Z0JBQ2pDLGFBQWEsR0FBRyxHQUFHO2dCQUNuQixhQUFhLEdBQUcsQ0FBQyxFQUNqQjtnQkFDQSxNQUFNLElBQUksMkJBQWtCLENBQzFCLHVGQUF1RixDQUN4RixDQUFBO2FBQ0Y7WUFFRCxNQUFNLFdBQVcsR0FBVyxNQUFNLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQTtZQUV2RCxNQUFNLEdBQUcsR0FBTyxJQUFBLHlCQUFPLEdBQUUsQ0FBQTtZQUN6QixJQUFJLFNBQVMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRTtnQkFDL0MsTUFBTSxJQUFJLGtCQUFTLENBQ2pCLDRHQUE0RyxDQUM3RyxDQUFBO2FBQ0Y7WUFFRCxNQUFNLGVBQWUsR0FBZSxNQUFNLElBQUksQ0FBQyxXQUFXLENBQ3hELE9BQU8sQ0FDUixDQUFDLG1CQUFtQixDQUNuQixJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxFQUN4QixRQUFRLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsRUFDdEMsRUFBRSxFQUNGLFVBQVUsRUFDVixNQUFNLEVBQ04sSUFBQSxzQ0FBb0IsRUFBQyxNQUFNLENBQUMsRUFDNUIsU0FBUyxFQUNULE9BQU8sRUFDUCxXQUFXLEVBQ1gsV0FBVyxFQUNYLGNBQWMsRUFDZCxlQUFlLEVBQ2YsT0FBTyxFQUNQLGFBQWEsRUFDYixlQUFNLEVBQ04sV0FBVyxFQUNYLElBQUksRUFDSixJQUFJLEVBQ0osV0FBVyxFQUNYLGVBQWUsQ0FDaEIsQ0FBQTtZQUVELElBQUksQ0FBQyxDQUFDLE1BQU0sSUFBSSxDQUFDLGFBQWEsQ0FBQyxlQUFlLENBQUMsQ0FBQyxFQUFFO2dCQUNoRCwwQkFBMEI7Z0JBQzFCLE1BQU0sSUFBSSwyQkFBa0IsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFBO2FBQ3ZEO1lBRUQsT0FBTyxlQUFlLENBQUE7UUFDeEIsQ0FBQyxDQUFBLENBQUE7UUFFRDs7Ozs7Ozs7Ozs7OztXQWFHO1FBQ0gsd0JBQW1CLEdBQUcsQ0FDcEIsT0FBZ0IsRUFDaEIsYUFBdUIsRUFDdkIsZUFBeUIsRUFDekIsb0JBQThCLEVBQzlCLG9CQUE0QixFQUM1QixPQUE2QixTQUFTLEVBQ3RDLE9BQVcsZUFBTSxFQUNqQixrQkFBMEIsQ0FBQyxFQUNOLEVBQUU7WUFDdkIsTUFBTSxNQUFNLEdBQUcscUJBQXFCLENBQUE7WUFFcEMsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGFBQWEsRUFBRSxNQUFNLENBQUMsQ0FBQTtZQUUvRCxNQUFNLE1BQU0sR0FBYSxJQUFJLENBQUMsd0JBQXdCLENBQ3BELGVBQWUsRUFDZixNQUFNLENBQ1AsQ0FBQTtZQUNELE1BQU0sTUFBTSxHQUFhLElBQUksQ0FBQyx3QkFBd0IsQ0FDcEQsb0JBQW9CLEVBQ3BCLE1BQU0sQ0FDUCxDQUFBO1lBRUQsSUFBSSxJQUFJLFlBQVkscUJBQVcsRUFBRTtnQkFDL0IsSUFBSSxHQUFHLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQTthQUN6QjtZQUVELE1BQU0sV0FBVyxHQUFXLE1BQU0sSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFBO1lBQ3ZELE1BQU0sU0FBUyxHQUFXLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUE7WUFDbEQsTUFBTSxZQUFZLEdBQVcsUUFBUSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUE7WUFDbkUsTUFBTSxHQUFHLEdBQU8sSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUE7WUFFM0MsTUFBTSxlQUFlLEdBQWUsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUN4RCxPQUFPLENBQ1IsQ0FBQyxtQkFBbUIsQ0FDbkIsU0FBUyxFQUNULFlBQVksRUFDWixVQUFVLEVBQ1YsTUFBTSxFQUNOLE1BQU0sRUFDTixvQkFBb0IsRUFDcEIsR0FBRyxFQUNILFdBQVcsRUFDWCxJQUFJLEVBQ0osSUFBSSxFQUNKLGVBQWUsQ0FDaEIsQ0FBQTtZQUVELElBQUksQ0FBQyxDQUFDLE1BQU0sSUFBSSxDQUFDLGFBQWEsQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUMsQ0FBQyxFQUFFO2dCQUN6RSwwQkFBMEI7Z0JBQzFCLE1BQU0sSUFBSSwyQkFBa0IsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFBO2FBQ3ZEO1lBRUQsT0FBTyxlQUFlLENBQUE7UUFDeEIsQ0FBQyxDQUFBLENBQUE7UUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7V0FpQkc7UUFDSCx1QkFBa0IsR0FBRyxDQUNuQixPQUFnQixFQUNoQixhQUF1QixFQUN2QixlQUF5QixFQUN6QixXQUE0QixTQUFTLEVBQ3JDLFlBQW9CLFNBQVMsRUFDN0IsT0FBZSxTQUFTLEVBQ3hCLFFBQWtCLFNBQVMsRUFDM0IsY0FBb0MsU0FBUyxFQUM3QyxPQUE2QixTQUFTLEVBQ3RDLE9BQVcsZUFBTSxFQUNqQixhQUFtQixFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQzlELGtCQUEwQixDQUFDLEVBQ04sRUFBRTtZQUN2QixNQUFNLE1BQU0sR0FBRyxvQkFBb0IsQ0FBQTtZQUVuQyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsYUFBYSxFQUFFLE1BQU0sQ0FBQyxDQUFBO1lBRS9ELE1BQU0sTUFBTSxHQUFhLElBQUksQ0FBQyx3QkFBd0IsQ0FDcEQsZUFBZSxFQUNmLE1BQU0sQ0FDUCxDQUFBO1lBRUQsSUFBSSxJQUFJLFlBQVkscUJBQVcsRUFBRTtnQkFDL0IsSUFBSSxHQUFHLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQTthQUN6QjtZQUVELE1BQU0sV0FBVyxHQUFXLE1BQU0sSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFBO1lBQ3ZELEtBQUssR0FBRyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUE7WUFFcEIsTUFBTSxTQUFTLEdBQVcsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQTtZQUNsRCxNQUFNLFlBQVksR0FBVyxRQUFRLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQTtZQUNuRSxNQUFNLEdBQUcsR0FBTyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQTtZQUUxQyxNQUFNLGVBQWUsR0FBZSxNQUFNLElBQUksQ0FBQyxXQUFXLENBQ3hELE9BQU8sQ0FDUixDQUFDLGtCQUFrQixDQUNsQixTQUFTLEVBQ1QsWUFBWSxFQUNaLFVBQVUsRUFDVixNQUFNLEVBQ04sUUFBUSxFQUNSLFNBQVMsRUFDVCxJQUFJLEVBQ0osS0FBSyxFQUNMLFdBQVcsRUFDWCxHQUFHLEVBQ0gsV0FBVyxFQUNYLElBQUksRUFDSixJQUFJLEVBQ0osVUFBVSxFQUNWLGVBQWUsQ0FDaEIsQ0FBQTtZQUVELElBQUksQ0FBQyxDQUFDLE1BQU0sSUFBSSxDQUFDLGFBQWEsQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUMsQ0FBQyxFQUFFO2dCQUN6RSwwQkFBMEI7Z0JBQzFCLE1BQU0sSUFBSSwyQkFBa0IsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFBO2FBQ3ZEO1lBRUQsT0FBTyxlQUFlLENBQUE7UUFDeEIsQ0FBQyxDQUFBLENBQUE7UUFDRDs7Ozs7Ozs7Ozs7Ozs7V0FjRztRQUNILHdCQUFtQixHQUFHLENBQ3BCLE9BQWdCLEVBQ2hCLGFBQXVCLEVBQ3ZCLGVBQXlCLEVBQ3pCLE9BQXdCLEVBQ3hCLEtBQWEsRUFDYixTQUFrQixLQUFLLEVBQ3ZCLE9BQWUsU0FBUyxFQUN4QixPQUFXLGVBQU0sRUFDakIsa0JBQTBCLENBQUMsRUFDTixFQUFFO1lBQ3ZCLE1BQU0sTUFBTSxHQUFHLHFCQUFxQixDQUFBO1lBRXBDLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFhLEVBQUUsTUFBTSxDQUFDLENBQUE7WUFFL0QsTUFBTSxNQUFNLEdBQWEsSUFBSSxDQUFDLHdCQUF3QixDQUNwRCxlQUFlLEVBQ2YsTUFBTSxDQUNQLENBQUE7WUFDRCxNQUFNLFVBQVUsR0FDZCxPQUFPLE9BQU8sS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQTtZQUNwRSxJQUFJLElBQUksWUFBWSxxQkFBVyxFQUFFO2dCQUMvQixJQUFJLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFBO2FBQ3pCO1lBRUQsTUFBTSxXQUFXLEdBQVcsTUFBTSxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUE7WUFDdkQsTUFBTSxTQUFTLEdBQVcsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQTtZQUNsRCxNQUFNLFlBQVksR0FBVyxRQUFRLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQTtZQUNuRSxNQUFNLEdBQUcsR0FBTyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUE7WUFFL0IsTUFBTSxlQUFlLEdBQWUsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUN4RCxPQUFPLENBQ1IsQ0FBQyxtQkFBbUIsQ0FDbkIsU0FBUyxFQUNULFlBQVksRUFDWixVQUFVLEVBQ1YsTUFBTSxFQUNOLFVBQVUsRUFDVixLQUFLLEVBQ0wsTUFBTSxFQUNOLEdBQUcsRUFDSCxXQUFXLEVBQ1gsSUFBSSxFQUNKLElBQUksRUFDSixlQUFlLENBQ2hCLENBQUE7WUFFRCxJQUFJLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLENBQUMsRUFBRTtnQkFDekUsMEJBQTBCO2dCQUMxQixNQUFNLElBQUksMkJBQWtCLENBQUMsd0JBQXdCLENBQUMsQ0FBQTthQUN2RDtZQUVELE9BQU8sZUFBZSxDQUFBO1FBQ3hCLENBQUMsQ0FBQSxDQUFBO1FBRUQ7Ozs7Ozs7Ozs7Ozs7OztXQWVHO1FBQ0gsd0JBQW1CLEdBQUcsQ0FDcEIsT0FBZ0IsRUFDaEIsYUFBdUIsRUFDdkIsa0JBQTRCLFNBQVMsRUFDckMsWUFBNkIsU0FBUyxFQUN0QyxZQUE2QixTQUFTLEVBQ3RDLFVBQTJCLFNBQVMsRUFDcEMsZUFBNEMsRUFBRSxFQUM5QyxPQUE2QixTQUFTLEVBQ3RDLE9BQVcsZUFBTSxFQUNqQixrQkFBMEIsQ0FBQyxFQUNOLEVBQUU7WUFDdkIsTUFBTSxNQUFNLEdBQUcscUJBQXFCLENBQUE7WUFFcEMsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGFBQWEsRUFBRSxNQUFNLENBQUMsQ0FBQTtZQUUvRCxNQUFNLE1BQU0sR0FBYSxJQUFJLENBQUMsd0JBQXdCLENBQ3BELGVBQWUsRUFDZixNQUFNLENBQ1AsQ0FBQTtZQUNELE1BQU0sT0FBTyxHQUNYLE9BQU8sT0FBTyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFBO1lBRXBFLElBQUksSUFBSSxZQUFZLHFCQUFXLEVBQUU7Z0JBQy9CLElBQUksR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUE7YUFDekI7WUFDRCxNQUFNLElBQUksR0FBdUIsRUFBRSxDQUFBO1lBQ25DLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRTtnQkFDekIsSUFBSSxDQUFDLElBQUksQ0FBQztvQkFDUixDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNKLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFDMUQsQ0FBQyxDQUFBO1lBQ0osQ0FBQyxDQUFDLENBQUE7WUFFRixJQUFJLE9BQU8sU0FBUyxLQUFLLFFBQVEsRUFBRTtnQkFDakMsU0FBUyxHQUFHLElBQUEsc0NBQW9CLEVBQUMsU0FBUyxDQUFDLENBQUE7YUFDNUM7WUFFRCxJQUFJLE9BQU8sU0FBUyxLQUFLLFFBQVEsRUFBRTtnQkFDakMsU0FBUyxHQUFHLElBQUEsc0NBQW9CLEVBQUMsU0FBUyxDQUFDLENBQUE7YUFDNUM7WUFFRCxNQUFNLFdBQVcsR0FBVyxNQUFNLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQTtZQUN2RCxNQUFNLFNBQVMsR0FBVyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFBO1lBQ2xELE1BQU0sWUFBWSxHQUFXLFFBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFBO1lBQ25FLE1BQU0sR0FBRyxHQUFPLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQTtZQUUvQixNQUFNLGVBQWUsR0FBZSxNQUFNLElBQUksQ0FBQyxXQUFXLENBQ3hELE9BQU8sQ0FDUixDQUFDLG1CQUFtQixDQUNuQixTQUFTLEVBQ1QsWUFBWSxFQUNaLFVBQVUsRUFDVixNQUFNLEVBQ04sU0FBUyxFQUNULFNBQVMsRUFDVCxPQUFPLEVBQ1AsSUFBSSxFQUNKLEdBQUcsRUFDSCxXQUFXLEVBQ1gsSUFBSSxFQUNKLElBQUksRUFDSixlQUFlLENBQ2hCLENBQUE7WUFFRCxJQUFJLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLENBQUMsRUFBRTtnQkFDekUsMEJBQTBCO2dCQUMxQixNQUFNLElBQUksMkJBQWtCLENBQUMsd0JBQXdCLENBQUMsQ0FBQTthQUN2RDtZQUVELE9BQU8sZUFBZSxDQUFBO1FBQ3hCLENBQUMsQ0FBQSxDQUFBO1FBRUQ7Ozs7Ozs7Ozs7Ozs7O1dBY0c7UUFDSCxtQkFBYyxHQUFHLENBQ2YsT0FBZ0IsRUFDaEIsYUFBdUIsRUFDdkIsa0JBQTRCLFNBQVMsRUFDckMsY0FBK0IsRUFDL0IsZUFBZ0MsRUFDaEMsZUFBNkIsU0FBUyxFQUN0QyxPQUE2QixTQUFTLEVBQ3RDLE9BQVcsZUFBTSxFQUNqQixZQUFnQixFQUNoQixrQkFBMEIsQ0FBQyxFQUNOLEVBQUU7WUFDdkIsTUFBTSxNQUFNLEdBQUcscUJBQXFCLENBQUE7WUFFcEMsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGFBQWEsRUFBRSxNQUFNLENBQUMsQ0FBQTtZQUUvRCxNQUFNLE1BQU0sR0FBYSxJQUFJLENBQUMsd0JBQXdCLENBQ3BELGVBQWUsRUFDZixNQUFNLENBQ1AsQ0FBQTtZQUVELElBQUksSUFBSSxZQUFZLHFCQUFXLEVBQUU7Z0JBQy9CLElBQUksR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUE7YUFDekI7WUFFRCxNQUFNLFdBQVcsR0FBVyxNQUFNLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQTtZQUN2RCxNQUFNLFNBQVMsR0FBVyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFBO1lBQ2xELE1BQU0sWUFBWSxHQUFXLFFBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFBO1lBQ25FLE1BQU0sR0FBRyxHQUFPLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQTtZQUUvQixNQUFNLGVBQWUsR0FBZSxNQUFNLElBQUksQ0FBQyxXQUFXLENBQ3hELE9BQU8sQ0FDUixDQUFDLGNBQWMsQ0FDZCxTQUFTLEVBQ1QsWUFBWSxFQUNaLFVBQVUsRUFDVixNQUFNLEVBQ04sY0FBYyxFQUNkLGVBQWUsRUFDZixZQUFZLEVBQ1osR0FBRyxFQUNILFdBQVcsRUFDWCxJQUFJLEVBQ0osSUFBSSxFQUNKLFlBQVksRUFDWixlQUFlLENBQ2hCLENBQUE7WUFFRCxJQUFJLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLENBQUMsRUFBRTtnQkFDekUsMEJBQTBCO2dCQUMxQixNQUFNLElBQUksMkJBQWtCLENBQUMsd0JBQXdCLENBQUMsQ0FBQTthQUN2RDtZQUVELE9BQU8sZUFBZSxDQUFBO1FBQ3hCLENBQUMsQ0FBQSxDQUFBO1FBRUQ7Ozs7Ozs7Ozs7O1dBV0c7UUFDSCx5QkFBb0IsR0FBRyxDQUNyQixPQUFnQixFQUNoQixhQUF1QixFQUN2QixrQkFBNEIsU0FBUyxFQUNyQyxPQUE2QixTQUFTLEVBQ3RDLE9BQVcsZUFBTSxFQUNqQixZQUFnQixFQUNoQixrQkFBMEIsQ0FBQyxFQUNOLEVBQUU7WUFDdkIsTUFBTSxNQUFNLEdBQUcsc0JBQXNCLENBQUE7WUFDckMsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGFBQWEsRUFBRSxNQUFNLENBQUMsQ0FBQTtZQUMvRCxNQUFNLE1BQU0sR0FBYSxJQUFJLENBQUMsd0JBQXdCLENBQ3BELGVBQWUsRUFDZixNQUFNLENBQ1AsQ0FBQTtZQUNELElBQUksSUFBSSxZQUFZLHFCQUFXLEVBQUU7Z0JBQy9CLElBQUksR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUE7YUFDekI7WUFFRCxNQUFNLFdBQVcsR0FBVyxNQUFNLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQTtZQUN2RCxNQUFNLFNBQVMsR0FBVyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFBO1lBQ2xELE1BQU0sWUFBWSxHQUFXLFFBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFBO1lBQ25FLE1BQU0sR0FBRyxHQUFPLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQTtZQUUvQixNQUFNLGVBQWUsR0FBZSxNQUFNLElBQUksQ0FBQyxXQUFXLENBQ3hELE9BQU8sQ0FDUixDQUFDLG9CQUFvQixDQUNwQixTQUFTLEVBQ1QsWUFBWSxFQUNaLFVBQVUsRUFDVixNQUFNLEVBQ04sR0FBRyxFQUNILFdBQVcsRUFDWCxJQUFJLEVBQ0osSUFBSSxFQUNKLGVBQWUsQ0FDaEIsQ0FBQTtZQUVELElBQUksQ0FBQyxDQUFDLE1BQU0sSUFBSSxDQUFDLGFBQWEsQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUMsQ0FBQyxFQUFFO2dCQUN6RSwwQkFBMEI7Z0JBQzFCLE1BQU0sSUFBSSwyQkFBa0IsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFBO2FBQ3ZEO1lBRUQsT0FBTyxlQUFlLENBQUE7UUFDeEIsQ0FBQyxDQUFBLENBQUE7UUFFRDs7Ozs7Ozs7Ozs7OztXQWFHO1FBQ0gsaUJBQVksR0FBRyxDQUNiLE9BQWdCLEVBQ2hCLGFBQXVCLEVBQ3ZCLGtCQUE0QixTQUFTLEVBQ3JDLE9BQTZCLFNBQVMsRUFDdEMsT0FBVyxlQUFNLEVBQ2pCLGtCQUEwQixDQUFDLEVBQzNCLFlBQWlDLEVBQ2pDLFVBQXdCLFNBQVMsRUFDWixFQUFFO1lBQ3ZCLE1BQU0sTUFBTSxHQUFHLGNBQWMsQ0FBQTtZQUM3QixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsYUFBYSxFQUFFLE1BQU0sQ0FBQyxDQUFBO1lBQy9ELE1BQU0sTUFBTSxHQUFhLElBQUksQ0FBQyx3QkFBd0IsQ0FDcEQsZUFBZSxFQUNmLE1BQU0sQ0FDUCxDQUFBO1lBQ0QsSUFBSSxJQUFJLFlBQVkscUJBQVcsRUFBRTtnQkFDL0IsSUFBSSxHQUFHLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQTthQUN6QjtZQUNELElBQUksWUFBWSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7Z0JBQzdCLE1BQU0sSUFBSSxLQUFLLENBQUMsdUNBQXVDLENBQUMsQ0FBQTthQUN6RDtZQUNELE1BQU0sV0FBVyxHQUFXLE1BQU0sSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFBO1lBQ3ZELE1BQU0sU0FBUyxHQUFXLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUE7WUFDbEQsTUFBTSxZQUFZLEdBQVcsUUFBUSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUE7WUFDbkUsTUFBTSxHQUFHLEdBQU8sSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFBO1lBRS9CLE1BQU0sZUFBZSxHQUFlLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FDeEQsT0FBTyxDQUNSLENBQUMsWUFBWSxDQUNaLFNBQVMsRUFDVCxZQUFZLEVBQ1osVUFBVSxFQUNWLE1BQU0sRUFDTixHQUFHLEVBQ0gsV0FBVyxFQUNYLElBQUksRUFDSixJQUFJLEVBQ0osZUFBZSxFQUNmLFlBQVksRUFDWixPQUFPLENBQ1IsQ0FBQTtZQUVELElBQUksQ0FBQyxDQUFDLE1BQU0sSUFBSSxDQUFDLGFBQWEsQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUMsQ0FBQyxFQUFFO2dCQUN6RSwwQkFBMEI7Z0JBQzFCLE1BQU0sSUFBSSwyQkFBa0IsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFBO2FBQ3ZEO1lBRUQsT0FBTyxlQUFlLENBQUE7UUFDeEIsQ0FBQyxDQUFBLENBQUE7UUF1RkQ7O1dBRUc7UUFDSCxpQkFBWSxHQUFHLEdBQTBCLEVBQUU7WUFDekMsTUFBTSxRQUFRLEdBQXdCLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FDekQsdUJBQXVCLENBQ3hCLENBQUE7WUFDRCxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQTtRQUN2QyxDQUFDLENBQUEsQ0FBQTtRQUVEOztXQUVHO1FBQ0gsbUJBQWMsR0FBRyxDQUNmLElBQVksRUFDWixRQUFpQixFQUNnQixFQUFFO1lBQ25DLE1BQU0sTUFBTSxHQUF5QjtnQkFDbkMsSUFBSTtnQkFDSixRQUFRO2FBQ1QsQ0FBQTtZQUNELE1BQU0sUUFBUSxHQUF3QixNQUFNLElBQUksQ0FBQyxVQUFVLENBQ3pELHlCQUF5QixFQUN6QixNQUFNLENBQ1AsQ0FBQTtZQUNELE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUE7UUFDN0IsQ0FBQyxDQUFBLENBQUE7UUFFRDs7OztXQUlHO1FBQ0gscUJBQWdCLEdBQUcsR0FBNEMsRUFBRTs7WUFDL0QsTUFBTSxRQUFRLEdBQXdCLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FDekQsMkJBQTJCLENBQzVCLENBQUE7WUFDRCxNQUFNLENBQUMsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQTtZQUM5QixPQUFPO2dCQUNMLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztnQkFDaEMsT0FBTyxFQUFFLENBQUMsQ0FBQyxPQUFPO2dCQUNsQixXQUFXLEVBQUUsQ0FBQyxDQUFDLFdBQVc7Z0JBQzFCLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRztnQkFDVixXQUFXLEVBQUUsQ0FBQyxDQUFDLFdBQVc7Z0JBQzFCLGdCQUFnQixFQUFFLElBQUksZUFBRSxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxRQUFRLEVBQUU7Z0JBQ25FLGdCQUFnQixFQUFFLElBQUksZUFBRSxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxRQUFRLEVBQUU7Z0JBQ25FLGlCQUFpQixFQUFFLElBQUksZUFBRSxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQztnQkFDOUMsaUJBQWlCLEVBQUUsSUFBSSxlQUFFLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDO2dCQUM5QyxnQkFBZ0IsRUFBRSxJQUFJLGVBQUUsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUM7Z0JBQzVDLGlCQUFpQixFQUFFLElBQUksZUFBRSxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQztnQkFDOUMsa0JBQWtCLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLGtCQUFrQjtnQkFDdkUsa0JBQWtCLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLGtCQUFrQjtnQkFDdkUsU0FBUyxFQUFFLElBQUksZUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7Z0JBQzlCLG1CQUFtQixFQUFFLE1BQUEsQ0FBQyxDQUFDLG1CQUFtQixtQ0FBSSxLQUFLO2dCQUNuRCxtQkFBbUIsRUFBRSxNQUFBLENBQUMsQ0FBQyxtQkFBbUIsbUNBQUksS0FBSzthQUN4QixDQUFBO1FBQy9CLENBQUMsQ0FBQSxDQUFBO1FBRUQ7Ozs7V0FJRztRQUNILFVBQUssR0FBRyxDQUNOLElBQXVCLEVBQ3ZCLE1BQXlCLEVBQ3pCLEVBQVksRUFDWixXQUFtQixFQUNuQixVQUFjLEVBQ2QsTUFBZ0IsRUFDaEIsZUFBdUIsRUFDdkIsUUFBa0IsRUFDbEIsWUFBZ0IsRUFDaEIsWUFBZ0IsRUFDaEIsSUFBUSxFQUNSLFFBQWlCLEVBQ0ksRUFBRTtZQUN2QixJQUFJLENBQUMsQ0FBQyxVQUFVLEVBQUUsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDdkQsTUFBTSxJQUFJLHNCQUFhLENBQUMsOENBQThDLENBQUMsQ0FBQTthQUN4RTtZQUNELE1BQU0sTUFBTSxHQUFnQjtnQkFDMUIsSUFBSTtnQkFDSixNQUFNO2dCQUNOLEVBQUUsRUFDQSxFQUFFLENBQUMsTUFBTSxHQUFHLENBQUM7b0JBQ1gsQ0FBQyxDQUFDO3dCQUNFLFFBQVEsRUFBRSxVQUFVLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQzt3QkFDakMsU0FBUyxFQUFFLFdBQVc7d0JBQ3RCLFNBQVMsRUFBRSxFQUFFO3FCQUNkO29CQUNILENBQUMsQ0FBQyxTQUFTO2dCQUNmLE1BQU0sRUFDSixNQUFNLENBQUMsTUFBTSxHQUFHLENBQUM7b0JBQ2YsQ0FBQyxDQUFDLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRSxTQUFTLEVBQUUsZUFBZSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUU7b0JBQ2xFLENBQUMsQ0FBQyxTQUFTO2dCQUNmLFFBQVEsRUFBRSxRQUFRLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdEUsWUFBWSxFQUFFLFlBQVksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUN2QyxZQUFZLEVBQUUsWUFBWSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZDLElBQUksRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDdkIsUUFBUSxFQUFFLFFBQVEsYUFBUixRQUFRLGNBQVIsUUFBUSxHQUFJLEtBQUs7YUFDNUIsQ0FBQTtZQUVELE1BQU0sUUFBUSxHQUF3QixNQUFNLElBQUksQ0FBQyxVQUFVLENBQ3pELGdCQUFnQixFQUNoQixNQUFNLENBQ1AsQ0FBQTtZQUNELE1BQU0sQ0FBQyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFBO1lBRTlCLGdEQUFnRDtZQUNoRCxNQUFNLEdBQUcsR0FBRywwQkFBaUIsQ0FBQyxTQUFTLENBQUMsZUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFBO1lBQzNFLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FDckIsQ0FBQyxDQUFDLFVBQVUsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRTtnQkFDakMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7WUFDbEUsQ0FBQyxDQUFDLENBQ0gsQ0FBQTtZQUVELE9BQU87Z0JBQ0wsR0FBRztnQkFDSCxHQUFHLEVBQUUsNEJBQWtCLENBQUMsU0FBUyxDQUFDLGVBQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3RFLE1BQU0sRUFBRSxDQUFDLENBQUMsTUFBTTtvQkFDZCxDQUFDLENBQUMscUJBQVksQ0FBQyxTQUFTLENBQUMsZUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztvQkFDL0QsQ0FBQyxDQUFDLEVBQUU7YUFDUCxDQUFBO1FBQ0gsQ0FBQyxDQUFBLENBQUE7UUFFRCxnQkFBVyxHQUFHLENBQUMsT0FBZ0IsRUFBVyxFQUFFO1lBQzFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUMsbUJBQW1CLEVBQUU7Z0JBQ2hELE9BQU8sSUFBSSxpQkFBTyxDQUFDLElBQUksaUJBQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQTthQUM1QztZQUNELE9BQU8sSUFBSSxpQkFBTyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUNwQyxDQUFDLENBQUE7UUF4SUMsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLEVBQUU7WUFDckIsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQTtZQUNwRCxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksbUJBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQTtTQUN2RTtJQUNILENBQUM7SUFuRkQ7O09BRUc7SUFDTyxrQkFBa0IsQ0FDMUIsU0FBOEIsRUFDOUIsTUFBYztRQUVkLE1BQU0sS0FBSyxHQUFhLEVBQUUsQ0FBQTtRQUMxQixNQUFNLE9BQU8sR0FBVyxJQUFJLENBQUMsa0JBQWtCLEVBQUU7WUFDL0MsQ0FBQyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsRUFBRTtZQUMzQixDQUFDLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFBO1FBQzFCLElBQUksU0FBUyxJQUFJLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQ3JDLEtBQUssSUFBSSxDQUFDLEdBQVcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUNqRCxJQUFJLE9BQU8sU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsS0FBSyxRQUFRLEVBQUU7b0JBQ3pDLElBQ0UsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFXLENBQUM7d0JBQ3JELFdBQVcsRUFDWDt3QkFDQSwwQkFBMEI7d0JBQzFCLE1BQU0sSUFBSSxxQkFBWSxDQUFDLG1DQUFtQyxNQUFNLEdBQUcsQ0FBQyxDQUFBO3FCQUNyRTtvQkFDRCxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFXLENBQUMsQ0FBQTtpQkFDeEM7cUJBQU07b0JBQ0wsTUFBTSxNQUFNLEdBQW1CLFFBQVEsQ0FBQTtvQkFDdkMsS0FBSyxDQUFDLElBQUksQ0FDUixhQUFhLENBQUMsWUFBWSxDQUN4QixTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBVyxFQUMzQixNQUFNLEVBQ04sSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFDbEIsT0FBTyxDQUNSLENBQ0YsQ0FBQTtpQkFDRjthQUNGO1NBQ0Y7UUFDRCxPQUFPLEtBQUssQ0FBQTtJQUNkLENBQUM7SUFFUyx3QkFBd0IsQ0FDaEMsU0FBOEIsRUFDOUIsTUFBYztRQUVkLE9BQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQ25ELENBQUMsQ0FBUyxFQUFVLEVBQUU7WUFDcEIsT0FBTyxPQUFPLENBQUMsS0FBSyxXQUFXO2dCQUM3QixDQUFDLENBQUMsU0FBUztnQkFDWCxDQUFDLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUNqQyxDQUFDLENBQ0YsQ0FBQTtJQUNILENBQUM7SUFFUyxnQkFBZ0IsQ0FBQyxJQUFjLEVBQUUsTUFBYztRQUN2RCxJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQ25CLElBQUksT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssUUFBUTtnQkFDN0IsT0FBTztvQkFDTCxJQUFJLEVBQUUsSUFBSSxDQUFDLHdCQUF3QixDQUFDLElBQWdCLEVBQUUsTUFBTSxDQUFDO29CQUM3RCxNQUFNLEVBQUUsRUFBRTtpQkFDWCxDQUFBOztnQkFFRCxPQUFPO29CQUNMLElBQUksRUFBRSxJQUFJLENBQUMsd0JBQXdCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBYSxFQUFFLE1BQU0sQ0FBQztvQkFDaEUsTUFBTSxFQUNKLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQzt3QkFDYixDQUFDLENBQUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLElBQUksQ0FBQyxDQUFDLENBQWEsRUFBRSxNQUFNLENBQUM7d0JBQzVELENBQUMsQ0FBQyxFQUFFO2lCQUNULENBQUE7U0FDSjtRQUNELE9BQU8sRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsQ0FBQTtJQUNqQyxDQUFDO0NBb0pGO0FBdm1GRCxzQ0F1bUZDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgQVBJLVBsYXRmb3JtVk1cbiAqL1xuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcImJ1ZmZlci9cIlxuaW1wb3J0IEJOIGZyb20gXCJibi5qc1wiXG5pbXBvcnQgQXZhbGFuY2hlQ29yZSBmcm9tIFwiLi4vLi4vY2FtaW5vXCJcbmltcG9ydCB7XG4gIEpSUENBUEksXG4gIE91dHB1dE93bmVycyxcbiAgUmVxdWVzdFJlc3BvbnNlRGF0YSxcbiAgWmVyb0JOXG59IGZyb20gXCIuLi8uLi9jb21tb25cIlxuXG5pbXBvcnQge1xuICBFcnJvclJlc3BvbnNlT2JqZWN0LFxuICBQcm90b2NvbEVycm9yLFxuICBVVFhPRXJyb3Jcbn0gZnJvbSBcIi4uLy4uL3V0aWxzL2Vycm9yc1wiXG5pbXBvcnQgQmluVG9vbHMgZnJvbSBcIi4uLy4uL3V0aWxzL2JpbnRvb2xzXCJcbmltcG9ydCB7IEtleUNoYWluIH0gZnJvbSBcIi4va2V5Y2hhaW5cIlxuaW1wb3J0IHsgT05FQVZBWCB9IGZyb20gXCIuLi8uLi91dGlscy9jb25zdGFudHNcIlxuaW1wb3J0IHsgUGxhdGZvcm1WTUNvbnN0YW50cyB9IGZyb20gXCIuL2NvbnN0YW50c1wiXG5pbXBvcnQgeyBVbnNpZ25lZFR4LCBUeCB9IGZyb20gXCIuL3R4XCJcbmltcG9ydCB7IFBheWxvYWRCYXNlIH0gZnJvbSBcIi4uLy4uL3V0aWxzL3BheWxvYWRcIlxuaW1wb3J0IHsgVW5peE5vdywgTm9kZUlEU3RyaW5nVG9CdWZmZXIgfSBmcm9tIFwiLi4vLi4vdXRpbHMvaGVscGVyZnVuY3Rpb25zXCJcbmltcG9ydCB7IFVUWE8sIFVUWE9TZXQgfSBmcm9tIFwiLi4vcGxhdGZvcm12bS91dHhvc1wiXG5pbXBvcnQgeyBQZXJzaXN0YW5jZU9wdGlvbnMgfSBmcm9tIFwiLi4vLi4vdXRpbHMvcGVyc2lzdGVuY2VvcHRpb25zXCJcbmltcG9ydCB7XG4gIEFkZHJlc3NFcnJvcixcbiAgVHJhbnNhY3Rpb25FcnJvcixcbiAgQ2hhaW5JZEVycm9yLFxuICBHb29zZUVnZ0NoZWNrRXJyb3IsXG4gIFRpbWVFcnJvcixcbiAgU3Rha2VFcnJvcixcbiAgRGVsZWdhdGlvbkZlZUVycm9yXG59IGZyb20gXCIuLi8uLi91dGlscy9lcnJvcnNcIlxuaW1wb3J0IHtcbiAgQVBJRGVwb3NpdCxcbiAgQmFsYW5jZURpY3QsXG4gIENsYWltYWJsZSxcbiAgQ2xhaW1BbW91bnRQYXJhbXMsXG4gIERlcG9zaXRPZmZlcixcbiAgR2V0Q3VycmVudFZhbGlkYXRvcnNQYXJhbXMsXG4gIEdldFBlbmRpbmdWYWxpZGF0b3JzUGFyYW1zLFxuICBHZXRSZXdhcmRVVFhPc1BhcmFtcyxcbiAgR2V0UmV3YXJkVVRYT3NSZXNwb25zZSxcbiAgR2V0U3Rha2VQYXJhbXMsXG4gIEdldFN0YWtlUmVzcG9uc2UsXG4gIEdldENvbmZpZ3VyYXRpb25SZXNwb25zZSxcbiAgU3VibmV0LFxuICBHZXRWYWxpZGF0b3JzQXRQYXJhbXMsXG4gIEdldFZhbGlkYXRvcnNBdFJlc3BvbnNlLFxuICBDcmVhdGVBZGRyZXNzUGFyYW1zLFxuICBHZXRVVFhPc1BhcmFtcyxcbiAgR2V0QmFsYW5jZVJlc3BvbnNlLFxuICBHZXRVVFhPc1Jlc3BvbnNlLFxuICBMaXN0QWRkcmVzc2VzUGFyYW1zLFxuICBTYW1wbGVWYWxpZGF0b3JzUGFyYW1zLFxuICBBZGRWYWxpZGF0b3JQYXJhbXMsXG4gIEFkZERlbGVnYXRvclBhcmFtcyxcbiAgQ3JlYXRlU3VibmV0UGFyYW1zLFxuICBFeHBvcnRBVkFYUGFyYW1zLFxuICBFeHBvcnRLZXlQYXJhbXMsXG4gIEltcG9ydEtleVBhcmFtcyxcbiAgSW1wb3J0QVZBWFBhcmFtcyxcbiAgQ3JlYXRlQmxvY2tjaGFpblBhcmFtcyxcbiAgQmxvY2tjaGFpbixcbiAgR2V0VHhTdGF0dXNQYXJhbXMsXG4gIEdldFR4U3RhdHVzUmVzcG9uc2UsXG4gIEdldE1pblN0YWtlUmVzcG9uc2UsXG4gIEdldE1heFN0YWtlQW1vdW50UGFyYW1zLFxuICBTcGVuZFBhcmFtcyxcbiAgU3BlbmRSZXBseSxcbiAgQWRkcmVzc1BhcmFtcyxcbiAgTXVsdGlzaWdBbGlhc1JlcGx5LFxuICBHZXRDbGFpbWFibGVzUmVzcG9uc2UsXG4gIEdldEFsbERlcG9zaXRPZmZlcnNQYXJhbXMsXG4gIEdldEFsbERlcG9zaXRPZmZlcnNSZXNwb25zZSxcbiAgR2V0RGVwb3NpdHNQYXJhbXMsXG4gIEdldERlcG9zaXRzUmVzcG9uc2UsXG4gIE93bmVyXG59IGZyb20gXCIuL2ludGVyZmFjZXNcIlxuaW1wb3J0IHsgVHJhbnNmZXJhYmxlSW5wdXQgfSBmcm9tIFwiLi9pbnB1dHNcIlxuaW1wb3J0IHsgVHJhbnNmZXJhYmxlT3V0cHV0IH0gZnJvbSBcIi4vb3V0cHV0c1wiXG5pbXBvcnQgeyBTZXJpYWxpemF0aW9uLCBTZXJpYWxpemVkVHlwZSB9IGZyb20gXCIuLi8uLi91dGlsc1wiXG5pbXBvcnQgeyBHZW5lc2lzRGF0YSB9IGZyb20gXCIuLi9hdm1cIlxuaW1wb3J0IHsgQXV0aCwgTG9ja01vZGUsIEJ1aWxkZXIsIEZyb21TaWduZXIgfSBmcm9tIFwiLi9idWlsZGVyXCJcbmltcG9ydCB7IE5ldHdvcmsgfSBmcm9tIFwiLi4vLi4vdXRpbHMvbmV0d29ya3NcIlxuaW1wb3J0IHsgU3BlbmRlciB9IGZyb20gXCIuL3NwZW5kZXJcIlxuXG4vKipcbiAqIEBpZ25vcmVcbiAqL1xuY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKVxuY29uc3Qgc2VyaWFsaXphdGlvbjogU2VyaWFsaXphdGlvbiA9IFNlcmlhbGl6YXRpb24uZ2V0SW5zdGFuY2UoKVxuXG5jb25zdCBOYW5vQk4gPSBuZXcgQk4oMTAwMDAwMDAwMClcbmNvbnN0IHJld2FyZFBlcmNlbnREZW5vbSA9IDEwMDAwMDBcblxudHlwZSBGcm9tVHlwZSA9IFN0cmluZ1tdIHwgU3RyaW5nW11bXVxuXG4vKipcbiAqIENsYXNzIGZvciBpbnRlcmFjdGluZyB3aXRoIGEgbm9kZSdzIFBsYXRmb3JtVk1BUElcbiAqXG4gKiBAY2F0ZWdvcnkgUlBDQVBJc1xuICpcbiAqIEByZW1hcmtzIFRoaXMgZXh0ZW5kcyB0aGUgW1tKUlBDQVBJXV0gY2xhc3MuIFRoaXMgY2xhc3Mgc2hvdWxkIG5vdCBiZSBkaXJlY3RseSBjYWxsZWQuIEluc3RlYWQsIHVzZSB0aGUgW1tBdmFsYW5jaGUuYWRkQVBJXV0gZnVuY3Rpb24gdG8gcmVnaXN0ZXIgdGhpcyBpbnRlcmZhY2Ugd2l0aCBBdmFsYW5jaGUuXG4gKi9cbmV4cG9ydCBjbGFzcyBQbGF0Zm9ybVZNQVBJIGV4dGVuZHMgSlJQQ0FQSSB7XG4gIC8qKlxuICAgKiBAaWdub3JlXG4gICAqL1xuICBwcm90ZWN0ZWQga2V5Y2hhaW46IEtleUNoYWluID0gbmV3IEtleUNoYWluKFwiXCIsIFwiXCIpXG5cbiAgcHJvdGVjdGVkIGJsb2NrY2hhaW5JRDogc3RyaW5nID0gXCJcIlxuXG4gIHByb3RlY3RlZCBibG9ja2NoYWluQWxpYXM6IHN0cmluZyA9IHVuZGVmaW5lZFxuXG4gIHByb3RlY3RlZCBBVkFYQXNzZXRJRDogQnVmZmVyID0gdW5kZWZpbmVkXG5cbiAgcHJvdGVjdGVkIHR4RmVlOiBCTiA9IHVuZGVmaW5lZFxuXG4gIHByb3RlY3RlZCBjcmVhdGlvblR4RmVlOiBCTiA9IHVuZGVmaW5lZFxuXG4gIHByb3RlY3RlZCBtaW5WYWxpZGF0b3JTdGFrZTogQk4gPSB1bmRlZmluZWRcblxuICBwcm90ZWN0ZWQgbWluRGVsZWdhdG9yU3Rha2U6IEJOID0gdW5kZWZpbmVkXG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGFsaWFzIGZvciB0aGUgYmxvY2tjaGFpbklEIGlmIGl0IGV4aXN0cywgb3RoZXJ3aXNlIHJldHVybnMgYHVuZGVmaW5lZGAuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBhbGlhcyBmb3IgdGhlIGJsb2NrY2hhaW5JRFxuICAgKi9cbiAgZ2V0QmxvY2tjaGFpbkFsaWFzID0gKCk6IHN0cmluZyA9PiB7XG4gICAgcmV0dXJuIHRoaXMuY29yZS5nZXROZXR3b3JrKCkuUC5hbGlhc1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnQgbmV0d29yaywgZmV0Y2hlZCB2aWEgYXZhbGFuY2hlLmZldGNoTmV0d29ya1NldHRpbmdzLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgY3VycmVudCBOZXR3b3JrXG4gICAqL1xuICBnZXROZXR3b3JrID0gKCk6IE5ldHdvcmsgPT4ge1xuICAgIHJldHVybiB0aGlzLmNvcmUuZ2V0TmV0d29yaygpXG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgYmxvY2tjaGFpbklEIGFuZCByZXR1cm5zIGl0LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgYmxvY2tjaGFpbklEXG4gICAqL1xuICBnZXRCbG9ja2NoYWluSUQgPSAoKTogc3RyaW5nID0+IHRoaXMuYmxvY2tjaGFpbklEXG5cbiAgLyoqXG4gICAqIFRha2VzIGFuIGFkZHJlc3Mgc3RyaW5nIGFuZCByZXR1cm5zIGl0cyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRhdGlvbiBpZiB2YWxpZC5cbiAgICpcbiAgICogQHJldHVybnMgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBmb3IgdGhlIGFkZHJlc3MgaWYgdmFsaWQsIHVuZGVmaW5lZCBpZiBub3QgdmFsaWQuXG4gICAqL1xuICBwYXJzZUFkZHJlc3MgPSAoYWRkcjogc3RyaW5nKTogQnVmZmVyID0+IHtcbiAgICBjb25zdCBhbGlhczogc3RyaW5nID0gdGhpcy5nZXRCbG9ja2NoYWluQWxpYXMoKVxuICAgIGNvbnN0IGJsb2NrY2hhaW5JRDogc3RyaW5nID0gdGhpcy5nZXRCbG9ja2NoYWluSUQoKVxuICAgIHJldHVybiBiaW50b29scy5wYXJzZUFkZHJlc3MoXG4gICAgICBhZGRyLFxuICAgICAgYmxvY2tjaGFpbklELFxuICAgICAgYWxpYXMsXG4gICAgICBQbGF0Zm9ybVZNQ29uc3RhbnRzLkFERFJFU1NMRU5HVEhcbiAgICApXG4gIH1cblxuICBhZGRyZXNzRnJvbUJ1ZmZlciA9IChhZGRyZXNzOiBCdWZmZXIpOiBzdHJpbmcgPT4ge1xuICAgIGNvbnN0IGNoYWluaWQ6IHN0cmluZyA9IHRoaXMuZ2V0QmxvY2tjaGFpbkFsaWFzKClcbiAgICAgID8gdGhpcy5nZXRCbG9ja2NoYWluQWxpYXMoKVxuICAgICAgOiB0aGlzLmdldEJsb2NrY2hhaW5JRCgpXG4gICAgY29uc3QgdHlwZTogU2VyaWFsaXplZFR5cGUgPSBcImJlY2gzMlwiXG4gICAgcmV0dXJuIHNlcmlhbGl6YXRpb24uYnVmZmVyVG9UeXBlKFxuICAgICAgYWRkcmVzcyxcbiAgICAgIHR5cGUsXG4gICAgICB0aGlzLmNvcmUuZ2V0SFJQKCksXG4gICAgICBjaGFpbmlkXG4gICAgKVxuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoZXMgdGhlIEFWQVggQXNzZXRJRCBhbmQgcmV0dXJucyBpdCBpbiBhIFByb21pc2UuXG4gICAqXG4gICAqIEBwYXJhbSByZWZyZXNoIFRoaXMgZnVuY3Rpb24gY2FjaGVzIHRoZSByZXNwb25zZS4gUmVmcmVzaCA9IHRydWUgd2lsbCBidXN0IHRoZSBjYWNoZS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHRoZSBwcm92aWRlZCBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBBVkFYIEFzc2V0SURcbiAgICovXG4gIGdldEFWQVhBc3NldElEID0gYXN5bmMgKHJlZnJlc2g6IGJvb2xlYW4gPSBmYWxzZSk6IFByb21pc2U8QnVmZmVyPiA9PiB7XG4gICAgaWYgKHR5cGVvZiB0aGlzLkFWQVhBc3NldElEID09PSBcInVuZGVmaW5lZFwiIHx8IHJlZnJlc2gpIHtcbiAgICAgIHRoaXMuQVZBWEFzc2V0SUQgPSBiaW50b29scy5jYjU4RGVjb2RlKFxuICAgICAgICB0aGlzLmNvcmUuZ2V0TmV0d29yaygpLlguYXZheEFzc2V0SURcbiAgICAgIClcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuQVZBWEFzc2V0SURcbiAgfVxuXG4gIC8qKlxuICAgKiBPdmVycmlkZXMgdGhlIGRlZmF1bHRzIGFuZCBzZXRzIHRoZSBjYWNoZSB0byBhIHNwZWNpZmljIEFWQVggQXNzZXRJRFxuICAgKlxuICAgKiBAcGFyYW0gYXZheEFzc2V0SUQgQSBjYjU4IHN0cmluZyBvciBCdWZmZXIgcmVwcmVzZW50aW5nIHRoZSBBVkFYIEFzc2V0SURcbiAgICpcbiAgICogQHJldHVybnMgVGhlIHRoZSBwcm92aWRlZCBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBBVkFYIEFzc2V0SURcbiAgICovXG4gIHNldEFWQVhBc3NldElEID0gKGF2YXhBc3NldElEOiBzdHJpbmcgfCBCdWZmZXIpID0+IHtcbiAgICBpZiAodHlwZW9mIGF2YXhBc3NldElEID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBhdmF4QXNzZXRJRCA9IGJpbnRvb2xzLmNiNThEZWNvZGUoYXZheEFzc2V0SUQpXG4gICAgfVxuICAgIHRoaXMuQVZBWEFzc2V0SUQgPSBhdmF4QXNzZXRJRFxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGRlZmF1bHQgdHggZmVlIGZvciB0aGlzIGNoYWluLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgZGVmYXVsdCB0eCBmZWUgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKi9cbiAgZ2V0RGVmYXVsdFR4RmVlID0gKCk6IEJOID0+IHtcbiAgICByZXR1cm4gbmV3IEJOKHRoaXMuY29yZS5nZXROZXR3b3JrKCkuUC50eEZlZSlcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB0eCBmZWUgZm9yIHRoaXMgY2hhaW4uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSB0eCBmZWUgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKi9cbiAgZ2V0VHhGZWUgPSAoKTogQk4gPT4ge1xuICAgIGlmICh0eXBlb2YgdGhpcy50eEZlZSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhpcy50eEZlZSA9IHRoaXMuZ2V0RGVmYXVsdFR4RmVlKClcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMudHhGZWVcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBDcmVhdGVTdWJuZXRUeCBmZWUuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBDcmVhdGVTdWJuZXRUeCBmZWUgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKi9cbiAgZ2V0Q3JlYXRlU3VibmV0VHhGZWUgPSAoKTogQk4gPT4ge1xuICAgIHJldHVybiBuZXcgQk4odGhpcy5jb3JlLmdldE5ldHdvcmsoKS5QLmNyZWF0ZVN1Ym5ldFR4ID8/IDApXG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgQ3JlYXRlQ2hhaW5UeCBmZWUuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBDcmVhdGVDaGFpblR4IGZlZSBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqL1xuICBnZXRDcmVhdGVDaGFpblR4RmVlID0gKCk6IEJOID0+IHtcbiAgICByZXR1cm4gbmV3IEJOKHRoaXMuY29yZS5nZXROZXR3b3JrKCkuUC5jcmVhdGVDaGFpblR4ID8/IDApXG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdHggZmVlIGZvciB0aGlzIGNoYWluLlxuICAgKlxuICAgKiBAcGFyYW0gZmVlIFRoZSB0eCBmZWUgYW1vdW50IHRvIHNldCBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKi9cbiAgc2V0VHhGZWUgPSAoZmVlOiBCTikgPT4ge1xuICAgIHRoaXMudHhGZWUgPSBmZWVcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBkZWZhdWx0IGNyZWF0aW9uIGZlZSBmb3IgdGhpcyBjaGFpbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGRlZmF1bHQgY3JlYXRpb24gZmVlIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICovXG4gIGdldERlZmF1bHRDcmVhdGlvblR4RmVlID0gKCk6IEJOID0+IHtcbiAgICByZXR1cm4gbmV3IEJOKHRoaXMuY29yZS5nZXROZXR3b3JrKCkuUC5jcmVhdGlvblR4RmVlKVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGNyZWF0aW9uIGZlZSBmb3IgdGhpcyBjaGFpbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGNyZWF0aW9uIGZlZSBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqL1xuICBnZXRDcmVhdGlvblR4RmVlID0gKCk6IEJOID0+IHtcbiAgICBpZiAodHlwZW9mIHRoaXMuY3JlYXRpb25UeEZlZSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhpcy5jcmVhdGlvblR4RmVlID0gdGhpcy5nZXREZWZhdWx0Q3JlYXRpb25UeEZlZSgpXG4gICAgfVxuICAgIHJldHVybiB0aGlzLmNyZWF0aW9uVHhGZWVcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBjcmVhdGlvbiBmZWUgZm9yIHRoaXMgY2hhaW4uXG4gICAqXG4gICAqIEBwYXJhbSBmZWUgVGhlIGNyZWF0aW9uIGZlZSBhbW91bnQgdG8gc2V0IGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqL1xuICBzZXRDcmVhdGlvblR4RmVlID0gKGZlZTogQk4pID0+IHtcbiAgICB0aGlzLmNyZWF0aW9uVHhGZWUgPSBmZWVcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGEgcmVmZXJlbmNlIHRvIHRoZSBrZXljaGFpbiBmb3IgdGhpcyBjbGFzcy5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGluc3RhbmNlIG9mIFtbXV0gZm9yIHRoaXMgY2xhc3NcbiAgICovXG4gIGtleUNoYWluID0gKCk6IEtleUNoYWluID0+IHRoaXMua2V5Y2hhaW5cblxuICAvKipcbiAgICogQGlnbm9yZVxuICAgKi9cbiAgbmV3S2V5Q2hhaW4gPSAoKTogS2V5Q2hhaW4gPT4ge1xuICAgIC8vIHdhcm5pbmcsIG92ZXJ3cml0ZXMgdGhlIG9sZCBrZXljaGFpblxuICAgIGNvbnN0IGFsaWFzID0gdGhpcy5nZXRCbG9ja2NoYWluQWxpYXMoKVxuICAgIGlmIChhbGlhcykge1xuICAgICAgdGhpcy5rZXljaGFpbiA9IG5ldyBLZXlDaGFpbih0aGlzLmNvcmUuZ2V0SFJQKCksIGFsaWFzKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmtleWNoYWluID0gbmV3IEtleUNoYWluKHRoaXMuY29yZS5nZXRIUlAoKSwgdGhpcy5ibG9ja2NoYWluSUQpXG4gICAgfVxuICAgIHJldHVybiB0aGlzLmtleWNoYWluXG4gIH1cblxuICAvKipcbiAgICogSGVscGVyIGZ1bmN0aW9uIHdoaWNoIGRldGVybWluZXMgaWYgYSB0eCBpcyBhIGdvb3NlIGVnZyB0cmFuc2FjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHV0eCBBbiBVbnNpZ25lZFR4XG4gICAqXG4gICAqIEByZXR1cm5zIGJvb2xlYW4gdHJ1ZSBpZiBwYXNzZXMgZ29vc2UgZWdnIHRlc3QgYW5kIGZhbHNlIGlmIGZhaWxzLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBBIFwiR29vc2UgRWdnIFRyYW5zYWN0aW9uXCIgaXMgd2hlbiB0aGUgZmVlIGZhciBleGNlZWRzIGEgcmVhc29uYWJsZSBhbW91bnRcbiAgICovXG4gIGNoZWNrR29vc2VFZ2cgPSBhc3luYyAoXG4gICAgdXR4OiBVbnNpZ25lZFR4LFxuICAgIG91dFRvdGFsOiBCTiA9IFplcm9CTlxuICApOiBQcm9taXNlPGJvb2xlYW4+ID0+IHtcbiAgICBjb25zdCBhdmF4QXNzZXRJRDogQnVmZmVyID0gYXdhaXQgdGhpcy5nZXRBVkFYQXNzZXRJRCgpXG4gICAgbGV0IG91dHB1dFRvdGFsOiBCTiA9IG91dFRvdGFsLmd0KFplcm9CTilcbiAgICAgID8gb3V0VG90YWxcbiAgICAgIDogdXR4LmdldE91dHB1dFRvdGFsKGF2YXhBc3NldElEKVxuICAgIGNvbnN0IGZlZTogQk4gPSB1dHguZ2V0QnVybihhdmF4QXNzZXRJRClcbiAgICBpZiAoZmVlLmx0ZShPTkVBVkFYLm11bChuZXcgQk4oMTApKSkgfHwgZmVlLmx0ZShvdXRwdXRUb3RhbCkpIHtcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgYW4gYXNzZXRJRCBmb3IgYSBzdWJuZXRcInMgc3Rha2luZyBhc3NzZXQuXG4gICAqXG4gICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlIHN0cmluZyB3aXRoIGNiNTggZW5jb2RlZCB2YWx1ZSBvZiB0aGUgYXNzZXRJRC5cbiAgICovXG4gIGdldFN0YWtpbmdBc3NldElEID0gYXN5bmMgKCk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmdldFN0YWtpbmdBc3NldElEXCJcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LmFzc2V0SURcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGJsb2NrY2hhaW4uXG4gICAqXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgdXNlcm5hbWUgb2YgdGhlIEtleXN0b3JlIHVzZXIgdGhhdCBjb250cm9scyB0aGUgbmV3IGFjY291bnRcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCBvZiB0aGUgS2V5c3RvcmUgdXNlciB0aGF0IGNvbnRyb2xzIHRoZSBuZXcgYWNjb3VudFxuICAgKiBAcGFyYW0gc3VibmV0SUQgT3B0aW9uYWwuIEVpdGhlciBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9yIGFuIGNiNTggc2VyaWFsaXplZCBzdHJpbmcgZm9yIHRoZSBTdWJuZXRJRCBvciBpdHMgYWxpYXMuXG4gICAqIEBwYXJhbSB2bUlEIFRoZSBJRCBvZiB0aGUgVmlydHVhbCBNYWNoaW5lIHRoZSBibG9ja2NoYWluIHJ1bnMuIENhbiBhbHNvIGJlIGFuIGFsaWFzIG9mIHRoZSBWaXJ0dWFsIE1hY2hpbmUuXG4gICAqIEBwYXJhbSBmeElEcyBUaGUgaWRzIG9mIHRoZSBGWHMgdGhlIFZNIGlzIHJ1bm5pbmcuXG4gICAqIEBwYXJhbSBuYW1lIEEgaHVtYW4tcmVhZGFibGUgbmFtZSBmb3IgdGhlIG5ldyBibG9ja2NoYWluXG4gICAqIEBwYXJhbSBnZW5lc2lzIFRoZSBiYXNlIDU4ICh3aXRoIGNoZWNrc3VtKSByZXByZXNlbnRhdGlvbiBvZiB0aGUgZ2VuZXNpcyBzdGF0ZSBvZiB0aGUgbmV3IGJsb2NrY2hhaW4uIFZpcnR1YWwgTWFjaGluZXMgc2hvdWxkIGhhdmUgYSBzdGF0aWMgQVBJIG1ldGhvZCBuYW1lZCBidWlsZEdlbmVzaXMgdGhhdCBjYW4gYmUgdXNlZCB0byBnZW5lcmF0ZSBnZW5lc2lzRGF0YS5cbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgdGhlIHVuc2lnbmVkIHRyYW5zYWN0aW9uIHRvIGNyZWF0ZSB0aGlzIGJsb2NrY2hhaW4uIE11c3QgYmUgc2lnbmVkIGJ5IGEgc3VmZmljaWVudCBudW1iZXIgb2YgdGhlIFN1Ym5ldOKAmXMgY29udHJvbCBrZXlzIGFuZCBieSB0aGUgYWNjb3VudCBwYXlpbmcgdGhlIHRyYW5zYWN0aW9uIGZlZS5cbiAgICovXG4gIGNyZWF0ZUJsb2NrY2hhaW4gPSBhc3luYyAoXG4gICAgdXNlcm5hbWU6IHN0cmluZyxcbiAgICBwYXNzd29yZDogc3RyaW5nLFxuICAgIHN1Ym5ldElEOiBCdWZmZXIgfCBzdHJpbmcgPSB1bmRlZmluZWQsXG4gICAgdm1JRDogc3RyaW5nLFxuICAgIGZ4SURzOiBudW1iZXJbXSxcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgZ2VuZXNpczogc3RyaW5nXG4gICk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBDcmVhdGVCbG9ja2NoYWluUGFyYW1zID0ge1xuICAgICAgdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZCxcbiAgICAgIGZ4SURzLFxuICAgICAgdm1JRCxcbiAgICAgIG5hbWUsXG4gICAgICBnZW5lc2lzRGF0YTogZ2VuZXNpc1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHN1Ym5ldElEID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBwYXJhbXMuc3VibmV0SUQgPSBzdWJuZXRJRFxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHN1Ym5ldElEICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBwYXJhbXMuc3VibmV0SUQgPSBiaW50b29scy5jYjU4RW5jb2RlKHN1Ym5ldElEKVxuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uY3JlYXRlQmxvY2tjaGFpblwiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC50eElEXG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgc3RhdHVzIG9mIGEgYmxvY2tjaGFpbi5cbiAgICpcbiAgICogQHBhcmFtIGJsb2NrY2hhaW5JRCBUaGUgYmxvY2tjaGFpbklEIHJlcXVlc3RpbmcgYSBzdGF0dXMgdXBkYXRlXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGEgc3RyaW5nIG9mIG9uZSBvZjogXCJWYWxpZGF0aW5nXCIsIFwiQ3JlYXRlZFwiLCBcIlByZWZlcnJlZFwiLCBcIlVua25vd25cIi5cbiAgICovXG4gIGdldEJsb2NrY2hhaW5TdGF0dXMgPSBhc3luYyAoYmxvY2tjaGFpbklEOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogYW55ID0ge1xuICAgICAgYmxvY2tjaGFpbklEXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5nZXRCbG9ja2NoYWluU3RhdHVzXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnN0YXR1c1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgdmFsaWRhdG9ycyBhbmQgdGhlaXIgd2VpZ2h0cyBvZiBhIHN1Ym5ldCBvciB0aGUgUHJpbWFyeSBOZXR3b3JrIGF0IGEgZ2l2ZW4gUC1DaGFpbiBoZWlnaHQuXG4gICAqXG4gICAqIEBwYXJhbSBoZWlnaHQgVGhlIFAtQ2hhaW4gaGVpZ2h0IHRvIGdldCB0aGUgdmFsaWRhdG9yIHNldCBhdC5cbiAgICogQHBhcmFtIHN1Ym5ldElEIE9wdGlvbmFsLiBBIGNiNTggc2VyaWFsaXplZCBzdHJpbmcgZm9yIHRoZSBTdWJuZXRJRCBvciBpdHMgYWxpYXMuXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgR2V0VmFsaWRhdG9yc0F0UmVzcG9uc2VcbiAgICovXG4gIGdldFZhbGlkYXRvcnNBdCA9IGFzeW5jIChcbiAgICBoZWlnaHQ6IG51bWJlcixcbiAgICBzdWJuZXRJRD86IHN0cmluZ1xuICApOiBQcm9taXNlPEdldFZhbGlkYXRvcnNBdFJlc3BvbnNlPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBHZXRWYWxpZGF0b3JzQXRQYXJhbXMgPSB7XG4gICAgICBoZWlnaHRcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBzdWJuZXRJRCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgcGFyYW1zLnN1Ym5ldElEID0gc3VibmV0SURcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmdldFZhbGlkYXRvcnNBdFwiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdFxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhbiBhZGRyZXNzIGluIHRoZSBub2RlJ3Mga2V5c3RvcmUuXG4gICAqXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgdXNlcm5hbWUgb2YgdGhlIEtleXN0b3JlIHVzZXIgdGhhdCBjb250cm9scyB0aGUgbmV3IGFjY291bnRcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCBvZiB0aGUgS2V5c3RvcmUgdXNlciB0aGF0IGNvbnRyb2xzIHRoZSBuZXcgYWNjb3VudFxuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhIHN0cmluZyBvZiB0aGUgbmV3bHkgY3JlYXRlZCBhY2NvdW50IGFkZHJlc3MuXG4gICAqL1xuICBjcmVhdGVBZGRyZXNzID0gYXN5bmMgKFxuICAgIHVzZXJuYW1lOiBzdHJpbmcsXG4gICAgcGFzc3dvcmQ6IHN0cmluZ1xuICApOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogQ3JlYXRlQWRkcmVzc1BhcmFtcyA9IHtcbiAgICAgIHVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmRcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmNyZWF0ZUFkZHJlc3NcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuYWRkcmVzc1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGJhbGFuY2Ugb2YgYSBwYXJ0aWN1bGFyIGFzc2V0LlxuICAgKlxuICAgKiBAcGFyYW0gYWRkcmVzcyBUaGUgYWRkcmVzcyB0byBwdWxsIHRoZSBhc3NldCBiYWxhbmNlIGZyb21cbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSB3aXRoIHRoZSBiYWxhbmNlIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0gb24gdGhlIHByb3ZpZGVkIGFkZHJlc3MuXG4gICAqL1xuICBnZXRCYWxhbmNlID0gYXN5bmMgKHBhcmFtczoge1xuICAgIGFkZHJlc3M/OiBzdHJpbmdcbiAgICBhZGRyZXNzZXM/OiBzdHJpbmdbXVxuICB9KTogUHJvbWlzZTxHZXRCYWxhbmNlUmVzcG9uc2U+ID0+IHtcbiAgICBpZiAoXG4gICAgICBwYXJhbXMuYWRkcmVzcyAmJlxuICAgICAgdHlwZW9mIHRoaXMucGFyc2VBZGRyZXNzKHBhcmFtcy5hZGRyZXNzKSA9PT0gXCJ1bmRlZmluZWRcIlxuICAgICkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBBZGRyZXNzRXJyb3IoXG4gICAgICAgIFwiRXJyb3IgLSBQbGF0Zm9ybVZNQVBJLmdldEJhbGFuY2U6IEludmFsaWQgYWRkcmVzcyBmb3JtYXRcIlxuICAgICAgKVxuICAgIH1cbiAgICBwYXJhbXMuYWRkcmVzc2VzPy5mb3JFYWNoKChhZGRyZXNzKSA9PiB7XG4gICAgICBpZiAodHlwZW9mIHRoaXMucGFyc2VBZGRyZXNzKGFkZHJlc3MpID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICAgIHRocm93IG5ldyBBZGRyZXNzRXJyb3IoXG4gICAgICAgICAgXCJFcnJvciAtIFBsYXRmb3JtVk1BUEkuZ2V0QmFsYW5jZTogSW52YWxpZCBhZGRyZXNzIGZvcm1hdFwiXG4gICAgICAgIClcbiAgICAgIH1cbiAgICB9KVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5nZXRCYWxhbmNlXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG5cbiAgICBjb25zdCByZXN1bHQgPSByZXNwb25zZS5kYXRhLnJlc3VsdFxuXG4gICAgY29uc3QgcGFyc2VEaWN0ID0gKGlucHV0OiBhbnlbXSk6IEJhbGFuY2VEaWN0ID0+IHtcbiAgICAgIGxldCBkaWN0OiBCYWxhbmNlRGljdCA9IHt9XG4gICAgICBmb3IgKGNvbnN0IFtrLCB2XSBvZiBPYmplY3QuZW50cmllcyhpbnB1dCkpIGRpY3Rba10gPSBuZXcgQk4odilcbiAgICAgIHJldHVybiBkaWN0IGFzIEJhbGFuY2VEaWN0XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuY29yZS5nZXROZXR3b3JrKCkuUC5sb2NrTW9kZUJvbmREZXBvc2l0KSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBiYWxhbmNlczogcGFyc2VEaWN0KHJlc3VsdC5iYWxhbmNlcyksXG4gICAgICAgIHVubG9ja2VkT3V0cHV0czogcGFyc2VEaWN0KHJlc3VsdC51bmxvY2tlZE91dHB1dHMpLFxuICAgICAgICBib25kZWRPdXRwdXRzOiBwYXJzZURpY3QocmVzdWx0LmJvbmRlZE91dHB1dHMpLFxuICAgICAgICBkZXBvc2l0ZWRPdXRwdXRzOiBwYXJzZURpY3QocmVzdWx0LmRlcG9zaXRlZE91dHB1dHMpLFxuICAgICAgICBib25kZWREZXBvc2l0ZWRPdXRwdXRzOiBwYXJzZURpY3QocmVzdWx0LmJvbmRlZERlcG9zaXRlZE91dHB1dHMpLFxuICAgICAgICB1dHhvSURzOiByZXN1bHQudXR4b0lEc1xuICAgICAgfSBhcyBHZXRCYWxhbmNlUmVzcG9uc2VcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIGJhbGFuY2U6IG5ldyBCTihyZXN1bHQuYmFsYW5jZSksXG4gICAgICB1bmxvY2tlZDogbmV3IEJOKHJlc3VsdC51bmxvY2tlZCksXG4gICAgICBsb2NrZWRTdGFrZWFibGU6IG5ldyBCTihyZXN1bHQubG9ja2VkU3Rha2VhYmxlKSxcbiAgICAgIGxvY2tlZE5vdFN0YWtlYWJsZTogbmV3IEJOKHJlc3VsdC5sb2NrZWROb3RTdGFrZWFibGUpLFxuICAgICAgdXR4b0lEczogcmVzdWx0LnV0eG9JRHNcbiAgICB9IGFzIEdldEJhbGFuY2VSZXNwb25zZVxuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgdGhlIGFkZHJlc3NlcyBjb250cm9sbGVkIGJ5IHRoZSB1c2VyLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIHVzZXJuYW1lIG9mIHRoZSBLZXlzdG9yZSB1c2VyXG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgb2YgdGhlIEtleXN0b3JlIHVzZXJcbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYW4gYXJyYXkgb2YgYWRkcmVzc2VzLlxuICAgKi9cbiAgbGlzdEFkZHJlc3NlcyA9IGFzeW5jIChcbiAgICB1c2VybmFtZTogc3RyaW5nLFxuICAgIHBhc3N3b3JkOiBzdHJpbmdcbiAgKTogUHJvbWlzZTxzdHJpbmdbXT4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogTGlzdEFkZHJlc3Nlc1BhcmFtcyA9IHtcbiAgICAgIHVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmRcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmxpc3RBZGRyZXNzZXNcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuYWRkcmVzc2VzXG4gIH1cblxuICAvKipcbiAgICogTGlzdHMgdGhlIHNldCBvZiBjdXJyZW50IHZhbGlkYXRvcnMuXG4gICAqXG4gICAqIEBwYXJhbSBzdWJuZXRJRCBPcHRpb25hbC4gRWl0aGVyIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gb3IgYW5cbiAgICogY2I1OCBzZXJpYWxpemVkIHN0cmluZyBmb3IgdGhlIFN1Ym5ldElEIG9yIGl0cyBhbGlhcy5cbiAgICogQHBhcmFtIG5vZGVJRHMgT3B0aW9uYWwuIEFuIGFycmF5IG9mIHN0cmluZ3NcbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYW4gYXJyYXkgb2YgdmFsaWRhdG9ycyB0aGF0IGFyZSBjdXJyZW50bHkgc3Rha2luZywgc2VlOiB7QGxpbmsgaHR0cHM6Ly9kb2NzLmF2YXgubmV0d29yay92MS4wL2VuL2FwaS9wbGF0Zm9ybS8jcGxhdGZvcm1nZXRjdXJyZW50dmFsaWRhdG9yc3xwbGF0Zm9ybS5nZXRDdXJyZW50VmFsaWRhdG9ycyBkb2N1bWVudGF0aW9ufS5cbiAgICpcbiAgICovXG4gIGdldEN1cnJlbnRWYWxpZGF0b3JzID0gYXN5bmMgKFxuICAgIHN1Ym5ldElEOiBCdWZmZXIgfCBzdHJpbmcgPSB1bmRlZmluZWQsXG4gICAgbm9kZUlEczogc3RyaW5nW10gPSB1bmRlZmluZWRcbiAgKTogUHJvbWlzZTxvYmplY3Q+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IEdldEN1cnJlbnRWYWxpZGF0b3JzUGFyYW1zID0ge31cbiAgICBpZiAodHlwZW9mIHN1Ym5ldElEID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBwYXJhbXMuc3VibmV0SUQgPSBzdWJuZXRJRFxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHN1Ym5ldElEICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBwYXJhbXMuc3VibmV0SUQgPSBiaW50b29scy5jYjU4RW5jb2RlKHN1Ym5ldElEKVxuICAgIH1cbiAgICBpZiAodHlwZW9mIG5vZGVJRHMgIT0gXCJ1bmRlZmluZWRcIiAmJiBub2RlSURzLmxlbmd0aCA+IDApIHtcbiAgICAgIHBhcmFtcy5ub2RlSURzID0gbm9kZUlEc1xuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uZ2V0Q3VycmVudFZhbGlkYXRvcnNcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHRcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHJlcXVlc3QgdGhhdCBpbiBhZGRyZXNzIGZpZWxkIGFjY2VwdHMgZWl0aGVyIGEgbm9kZUlEIChhbmQgcmV0dXJucyBhIGJlY2gzMiBhZGRyZXNzIGlmIGl0IGV4aXN0cyksIG9yIGEgYmVjaDMyIGFkZHJlc3MgKGFuZCByZXR1cm5zIGEgTm9kZUlEIGlmIGl0IGV4aXN0cykuXG4gICAqXG4gICAqIEBwYXJhbSBhZGRyZXNzIEEgbm9kZUlEIG9yIGEgYmVjaDMyIGFkZHJlc3NcbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYSBzdHJpbmcgY29udGFpbmluZyBiZWNoMzIgYWRkcmVzcyB0aGF0IGlzIHRoZSBub2RlIG93bmVyIG9yIG5vZGVJRCB0aGF0IHRoZSBhZGRyZXNzIHBhc3NlZCBpcyBhbiBvd25lciBvZi5cbiAgICovXG4gIGdldFJlZ2lzdGVyZWRTaG9ydElETGluayA9IGFzeW5jIChhZGRyZXNzOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGNvbnN0IHBhcmFtcyA9IHtcbiAgICAgIGFkZHJlc3NcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmdldFJlZ2lzdGVyZWRTaG9ydElETGlua1wiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5hZGRyZXNzXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhY3RpdmUgb3IgaW5hY3RpdmUgZGVwb3NpdCBvZmZlcnMuXG4gICAqXG4gICAqIEBwYXJhbSBhY3RpdmUgQSBib29sZWFuIGluZGljYXRpbmcgd2hldGhlciB0byByZXR1cm4gYWN0aXZlIG9yIGluYWN0aXZlIGRlcG9zaXQgb2ZmZXJzLlxuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhIGxpc3QgY29udGFpbmluZyBkZXBvc2l0IG9mZmVycy5cbiAgICovXG4gIGdldEFsbERlcG9zaXRPZmZlcnMgPSBhc3luYyAoYWN0aXZlPzogYm9vbGVhbik6IFByb21pc2U8RGVwb3NpdE9mZmVyW10+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IEdldEFsbERlcG9zaXRPZmZlcnNQYXJhbXMgPSB7XG4gICAgICBhY3RpdmVcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmdldEFsbERlcG9zaXRPZmZlcnNcIixcbiAgICAgIHBhcmFtc1xuICAgIClcblxuICAgIGNvbnN0IG9mZmVyczogR2V0QWxsRGVwb3NpdE9mZmVyc1Jlc3BvbnNlID0gcmVzcG9uc2UuZGF0YS5yZXN1bHRcbiAgICBpZiAoIW9mZmVycy5kZXBvc2l0T2ZmZXJzKSByZXR1cm4gW11cbiAgICByZXR1cm4gb2ZmZXJzLmRlcG9zaXRPZmZlcnMubWFwKChvZmZlcikgPT4ge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgaWQ6IG9mZmVyLmlkLFxuICAgICAgICBpbnRlcmVzdFJhdGVOb21pbmF0b3I6IG5ldyBCTihvZmZlci5pbnRlcmVzdFJhdGVOb21pbmF0b3IpLFxuICAgICAgICBzdGFydDogbmV3IEJOKG9mZmVyLnN0YXJ0KSxcbiAgICAgICAgZW5kOiBuZXcgQk4ob2ZmZXIuZW5kKSxcbiAgICAgICAgbWluQW1vdW50OiBuZXcgQk4ob2ZmZXIubWluQW1vdW50KSxcbiAgICAgICAgbWluRHVyYXRpb246IG9mZmVyLm1pbkR1cmF0aW9uLFxuICAgICAgICBtYXhEdXJhdGlvbjogb2ZmZXIubWF4RHVyYXRpb24sXG4gICAgICAgIHVubG9ja1BlcmlvZER1cmF0aW9uOiBvZmZlci51bmxvY2tQZXJpb2REdXJhdGlvbixcbiAgICAgICAgbm9SZXdhcmRzUGVyaW9kRHVyYXRpb246IG9mZmVyLm5vUmV3YXJkc1BlcmlvZER1cmF0aW9uLFxuICAgICAgICBtZW1vOiBvZmZlci5tZW1vLFxuICAgICAgICBmbGFnczogbmV3IEJOKG9mZmVyLmZsYWdzKVxuICAgICAgfSBhcyBEZXBvc2l0T2ZmZXJcbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgZGVwb3NpdHMgY29ycmVzcG9uZGluZyB0byByZXF1ZXN0ZWQgdHhJRHMuXG4gICAqXG4gICAqIEBwYXJhbSBkZXBvc2l0VHhJRHMgQSBsaXN0IG9mIHR4SURzIChjYjU4KSB0byByZXF1ZXN0IGRlcG9zaXRzIGZvci5cbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYSBHZXREZXBvc2l0c1Jlc3BvbnNlIG9iamVjdC5cbiAgICovXG4gIGdldERlcG9zaXRzID0gYXN5bmMgKFxuICAgIGRlcG9zaXRUeElEczogc3RyaW5nW11cbiAgKTogUHJvbWlzZTxHZXREZXBvc2l0c1Jlc3BvbnNlPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBHZXREZXBvc2l0c1BhcmFtcyA9IHtcbiAgICAgIGRlcG9zaXRUeElEc1xuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uZ2V0RGVwb3NpdHNcIixcbiAgICAgIHBhcmFtc1xuICAgIClcblxuICAgIGNvbnN0IGRlcG9zaXRzOiBHZXREZXBvc2l0c1Jlc3BvbnNlID0gcmVzcG9uc2UuZGF0YS5yZXN1bHRcbiAgICBpZiAoIWRlcG9zaXRzLmRlcG9zaXRzKVxuICAgICAgcmV0dXJuIHsgZGVwb3NpdHM6IFtdLCBhdmFpbGFibGVSZXdhcmRzOiBbXSwgdGltZXN0YW1wOiBaZXJvQk4gfVxuICAgIHJldHVybiB7XG4gICAgICBkZXBvc2l0czogZGVwb3NpdHMuZGVwb3NpdHMubWFwKChkZXBvc2l0KSA9PiB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgZGVwb3NpdFR4SUQ6IGRlcG9zaXQuZGVwb3NpdFR4SUQsXG4gICAgICAgICAgZGVwb3NpdE9mZmVySUQ6IGRlcG9zaXQuZGVwb3NpdE9mZmVySUQsXG4gICAgICAgICAgdW5sb2NrZWRBbW91bnQ6IG5ldyBCTihkZXBvc2l0LnVubG9ja2VkQW1vdW50KSxcbiAgICAgICAgICBjbGFpbWVkUmV3YXJkQW1vdW50OiBuZXcgQk4oZGVwb3NpdC5jbGFpbWVkUmV3YXJkQW1vdW50KSxcbiAgICAgICAgICBzdGFydDogbmV3IEJOKGRlcG9zaXQuc3RhcnQpLFxuICAgICAgICAgIGR1cmF0aW9uOiBkZXBvc2l0LmR1cmF0aW9uLFxuICAgICAgICAgIGFtb3VudDogbmV3IEJOKGRlcG9zaXQuYW1vdW50KSxcbiAgICAgICAgICByZXdhcmRPd25lcjogZGVwb3NpdC5yZXdhcmRPd25lclxuICAgICAgICB9IGFzIEFQSURlcG9zaXRcbiAgICAgIH0pLFxuICAgICAgYXZhaWxhYmxlUmV3YXJkczogZGVwb3NpdHMuYXZhaWxhYmxlUmV3YXJkcy5tYXAoKGEpID0+IG5ldyBCTihhKSksXG4gICAgICB0aW1lc3RhbXA6IG5ldyBCTihkZXBvc2l0cy50aW1lc3RhbXApXG4gICAgfSBhcyBHZXREZXBvc2l0c1Jlc3BvbnNlXG4gIH1cblxuICAvKipcbiAgICogTGlzdCBhbW91bnRzIHRoYXQgY2FuIGJlIGNsYWltZWQ6IHZhbGlkYXRvciByZXdhcmRzLCBleHBpcmVkIGRlcG9zaXQgcmV3YXJkcyBjbGFpbWFibGUgYXQgY3VycmVudCB0aW1lLlxuICAgKlxuICAgKiBAcGFyYW0gb3duZXJzIFJld2FyZE93bmVyIG9mIERlcG9zaXRUeCBvciBBZGRWYWxpZGF0b3JUeFxuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhbiBvYmplY3QgY29udGFpbmluZyB0aGUgYW1vdW50cyB0aGF0IGNhbiBiZSBjbGFpbWVkLlxuICAgKi9cbiAgZ2V0Q2xhaW1hYmxlcyA9IGFzeW5jIChvd25lcnM6IE93bmVyW10pOiBQcm9taXNlPEdldENsYWltYWJsZXNSZXNwb25zZT4gPT4ge1xuICAgIGNvbnN0IHBhcmFtcyA9IHtcbiAgICAgIE93bmVyczogb3duZXJzXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5nZXRDbGFpbWFibGVzXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgY29uc3QgcmVzdWx0ID0gcmVzcG9uc2UuZGF0YS5yZXN1bHRcblxuICAgIHJldHVybiB7XG4gICAgICBjbGFpbWFibGVzOiByZXN1bHQuY2xhaW1hYmxlcy5tYXAoKGM6IGFueSkgPT4ge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHZhbGlkYXRvclJld2FyZHM6IG5ldyBCTihyZXN1bHQudmFsaWRhdG9yUmV3YXJkcyksXG4gICAgICAgICAgZXhwaXJlZERlcG9zaXRSZXdhcmRzOiBuZXcgQk4ocmVzdWx0LmV4cGlyZWREZXBvc2l0UmV3YXJkcylcbiAgICAgICAgfSBhcyBDbGFpbWFibGVcbiAgICAgIH0pXG4gICAgfSBhcyBHZXRDbGFpbWFibGVzUmVzcG9uc2VcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0cyB0aGUgc2V0IG9mIHBlbmRpbmcgdmFsaWRhdG9ycy5cbiAgICpcbiAgICogQHBhcmFtIHN1Ym5ldElEIE9wdGlvbmFsLiBFaXRoZXIgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfVxuICAgKiBvciBhIGNiNTggc2VyaWFsaXplZCBzdHJpbmcgZm9yIHRoZSBTdWJuZXRJRCBvciBpdHMgYWxpYXMuXG4gICAqIEBwYXJhbSBub2RlSURzIE9wdGlvbmFsLiBBbiBhcnJheSBvZiBzdHJpbmdzXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGFuIGFycmF5IG9mIHZhbGlkYXRvcnMgdGhhdCBhcmUgcGVuZGluZyBzdGFraW5nLCBzZWU6IHtAbGluayBodHRwczovL2RvY3MuYXZheC5uZXR3b3JrL3YxLjAvZW4vYXBpL3BsYXRmb3JtLyNwbGF0Zm9ybWdldHBlbmRpbmd2YWxpZGF0b3JzfHBsYXRmb3JtLmdldFBlbmRpbmdWYWxpZGF0b3JzIGRvY3VtZW50YXRpb259LlxuICAgKlxuICAgKi9cbiAgZ2V0UGVuZGluZ1ZhbGlkYXRvcnMgPSBhc3luYyAoXG4gICAgc3VibmV0SUQ6IEJ1ZmZlciB8IHN0cmluZyA9IHVuZGVmaW5lZCxcbiAgICBub2RlSURzOiBzdHJpbmdbXSA9IHVuZGVmaW5lZFxuICApOiBQcm9taXNlPG9iamVjdD4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogR2V0UGVuZGluZ1ZhbGlkYXRvcnNQYXJhbXMgPSB7fVxuICAgIGlmICh0eXBlb2Ygc3VibmV0SUQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHBhcmFtcy5zdWJuZXRJRCA9IHN1Ym5ldElEXG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc3VibmV0SUQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHBhcmFtcy5zdWJuZXRJRCA9IGJpbnRvb2xzLmNiNThFbmNvZGUoc3VibmV0SUQpXG4gICAgfVxuICAgIGlmICh0eXBlb2Ygbm9kZUlEcyAhPSBcInVuZGVmaW5lZFwiICYmIG5vZGVJRHMubGVuZ3RoID4gMCkge1xuICAgICAgcGFyYW1zLm5vZGVJRHMgPSBub2RlSURzXG4gICAgfVxuXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmdldFBlbmRpbmdWYWxpZGF0b3JzXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0XG4gIH1cblxuICAvKipcbiAgICogU2FtcGxlcyBgU2l6ZWAgdmFsaWRhdG9ycyBmcm9tIHRoZSBjdXJyZW50IHZhbGlkYXRvciBzZXQuXG4gICAqXG4gICAqIEBwYXJhbSBzYW1wbGVTaXplIE9mIHRoZSB0b3RhbCB1bml2ZXJzZSBvZiB2YWxpZGF0b3JzLCBzZWxlY3QgdGhpcyBtYW55IGF0IHJhbmRvbVxuICAgKiBAcGFyYW0gc3VibmV0SUQgT3B0aW9uYWwuIEVpdGhlciBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9yIGFuXG4gICAqIGNiNTggc2VyaWFsaXplZCBzdHJpbmcgZm9yIHRoZSBTdWJuZXRJRCBvciBpdHMgYWxpYXMuXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGFuIGFycmF5IG9mIHZhbGlkYXRvclwicyBzdGFraW5nSURzLlxuICAgKi9cbiAgc2FtcGxlVmFsaWRhdG9ycyA9IGFzeW5jIChcbiAgICBzYW1wbGVTaXplOiBudW1iZXIsXG4gICAgc3VibmV0SUQ6IEJ1ZmZlciB8IHN0cmluZyA9IHVuZGVmaW5lZFxuICApOiBQcm9taXNlPHN0cmluZ1tdPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBTYW1wbGVWYWxpZGF0b3JzUGFyYW1zID0ge1xuICAgICAgc2l6ZTogc2FtcGxlU2l6ZS50b1N0cmluZygpXG4gICAgfVxuICAgIGlmICh0eXBlb2Ygc3VibmV0SUQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHBhcmFtcy5zdWJuZXRJRCA9IHN1Ym5ldElEXG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc3VibmV0SUQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHBhcmFtcy5zdWJuZXRJRCA9IGJpbnRvb2xzLmNiNThFbmNvZGUoc3VibmV0SUQpXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5zYW1wbGVWYWxpZGF0b3JzXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnZhbGlkYXRvcnNcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgYSB2YWxpZGF0b3IgdG8gdGhlIFByaW1hcnkgTmV0d29yay5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSB1c2VybmFtZSBvZiB0aGUgS2V5c3RvcmUgdXNlclxuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIG9mIHRoZSBLZXlzdG9yZSB1c2VyXG4gICAqIEBwYXJhbSBub2RlSUQgVGhlIG5vZGUgSUQgb2YgdGhlIHZhbGlkYXRvclxuICAgKiBAcGFyYW0gc3RhcnRUaW1lIEphdmFzY3JpcHQgRGF0ZSBvYmplY3QgZm9yIHRoZSBzdGFydCB0aW1lIHRvIHZhbGlkYXRlXG4gICAqIEBwYXJhbSBlbmRUaW1lIEphdmFzY3JpcHQgRGF0ZSBvYmplY3QgZm9yIHRoZSBlbmQgdGltZSB0byB2YWxpZGF0ZVxuICAgKiBAcGFyYW0gc3Rha2VBbW91bnQgVGhlIGFtb3VudCBvZiBuQVZBWCB0aGUgdmFsaWRhdG9yIGlzIHN0YWtpbmcgYXNcbiAgICogYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gcmV3YXJkQWRkcmVzcyBUaGUgYWRkcmVzcyB0aGUgdmFsaWRhdG9yIHJld2FyZCB3aWxsIGdvIHRvLCBpZiB0aGVyZSBpcyBvbmUuXG4gICAqIEBwYXJhbSBkZWxlZ2F0aW9uRmVlUmF0ZSBPcHRpb25hbC4gQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfSBmb3IgdGhlIHBlcmNlbnQgZmVlIHRoaXMgdmFsaWRhdG9yXG4gICAqIGNoYXJnZXMgd2hlbiBvdGhlcnMgZGVsZWdhdGUgc3Rha2UgdG8gdGhlbS4gVXAgdG8gNCBkZWNpbWFsIHBsYWNlcyBhbGxvd2VkIGFkZGl0aW9uYWwgZGVjaW1hbCBwbGFjZXMgYXJlIGlnbm9yZWQuXG4gICAqIE11c3QgYmUgYmV0d2VlbiAwIGFuZCAxMDAsIGluY2x1c2l2ZS4gRm9yIGV4YW1wbGUsIGlmIGRlbGVnYXRpb25GZWVSYXRlIGlzIDEuMjM0NSBhbmQgc29tZW9uZSBkZWxlZ2F0ZXMgdG8gdGhpc1xuICAgKiB2YWxpZGF0b3IsIHRoZW4gd2hlbiB0aGUgZGVsZWdhdGlvbiBwZXJpb2QgaXMgb3ZlciwgMS4yMzQ1JSBvZiB0aGUgcmV3YXJkIGdvZXMgdG8gdGhlIHZhbGlkYXRvciBhbmQgdGhlIHJlc3QgZ29lc1xuICAgKiB0byB0aGUgZGVsZWdhdG9yLlxuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhIGJhc2U1OCBzdHJpbmcgb2YgdGhlIHVuc2lnbmVkIHRyYW5zYWN0aW9uLlxuICAgKi9cbiAgYWRkVmFsaWRhdG9yID0gYXN5bmMgKFxuICAgIHVzZXJuYW1lOiBzdHJpbmcsXG4gICAgcGFzc3dvcmQ6IHN0cmluZyxcbiAgICBub2RlSUQ6IHN0cmluZyxcbiAgICBzdGFydFRpbWU6IERhdGUsXG4gICAgZW5kVGltZTogRGF0ZSxcbiAgICBzdGFrZUFtb3VudDogQk4sXG4gICAgcmV3YXJkQWRkcmVzczogc3RyaW5nLFxuICAgIGRlbGVnYXRpb25GZWVSYXRlOiBCTiA9IHVuZGVmaW5lZFxuICApOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogQWRkVmFsaWRhdG9yUGFyYW1zID0ge1xuICAgICAgdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZCxcbiAgICAgIG5vZGVJRCxcbiAgICAgIHN0YXJ0VGltZTogc3RhcnRUaW1lLmdldFRpbWUoKSAvIDEwMDAsXG4gICAgICBlbmRUaW1lOiBlbmRUaW1lLmdldFRpbWUoKSAvIDEwMDAsXG4gICAgICBzdGFrZUFtb3VudDogc3Rha2VBbW91bnQudG9TdHJpbmcoMTApLFxuICAgICAgcmV3YXJkQWRkcmVzc1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGRlbGVnYXRpb25GZWVSYXRlICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBwYXJhbXMuZGVsZWdhdGlvbkZlZVJhdGUgPSBkZWxlZ2F0aW9uRmVlUmF0ZS50b1N0cmluZygxMClcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmFkZFZhbGlkYXRvclwiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC50eElEXG4gIH1cblxuICAvKipcbiAgICogQWRkIGEgdmFsaWRhdG9yIHRvIGEgU3VibmV0IG90aGVyIHRoYW4gdGhlIFByaW1hcnkgTmV0d29yay4gVGhlIHZhbGlkYXRvciBtdXN0IHZhbGlkYXRlIHRoZSBQcmltYXJ5IE5ldHdvcmsgZm9yIHRoZSBlbnRpcmUgZHVyYXRpb24gdGhleSB2YWxpZGF0ZSB0aGlzIFN1Ym5ldC5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSB1c2VybmFtZSBvZiB0aGUgS2V5c3RvcmUgdXNlclxuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIG9mIHRoZSBLZXlzdG9yZSB1c2VyXG4gICAqIEBwYXJhbSBub2RlSUQgVGhlIG5vZGUgSUQgb2YgdGhlIHZhbGlkYXRvclxuICAgKiBAcGFyYW0gc3VibmV0SUQgRWl0aGVyIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gb3IgYSBjYjU4IHNlcmlhbGl6ZWQgc3RyaW5nIGZvciB0aGUgU3VibmV0SUQgb3IgaXRzIGFsaWFzLlxuICAgKiBAcGFyYW0gc3RhcnRUaW1lIEphdmFzY3JpcHQgRGF0ZSBvYmplY3QgZm9yIHRoZSBzdGFydCB0aW1lIHRvIHZhbGlkYXRlXG4gICAqIEBwYXJhbSBlbmRUaW1lIEphdmFzY3JpcHQgRGF0ZSBvYmplY3QgZm9yIHRoZSBlbmQgdGltZSB0byB2YWxpZGF0ZVxuICAgKiBAcGFyYW0gd2VpZ2h0IFRoZSB2YWxpZGF0b3LigJlzIHdlaWdodCB1c2VkIGZvciBzYW1wbGluZ1xuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciB0aGUgdW5zaWduZWQgdHJhbnNhY3Rpb24uIEl0IG11c3QgYmUgc2lnbmVkICh1c2luZyBzaWduKSBieSB0aGUgcHJvcGVyIG51bWJlciBvZiB0aGUgU3VibmV04oCZcyBjb250cm9sIGtleXMgYW5kIGJ5IHRoZSBrZXkgb2YgdGhlIGFjY291bnQgcGF5aW5nIHRoZSB0cmFuc2FjdGlvbiBmZWUgYmVmb3JlIGl0IGNhbiBiZSBpc3N1ZWQuXG4gICAqL1xuICBhZGRTdWJuZXRWYWxpZGF0b3IgPSBhc3luYyAoXG4gICAgdXNlcm5hbWU6IHN0cmluZyxcbiAgICBwYXNzd29yZDogc3RyaW5nLFxuICAgIG5vZGVJRDogc3RyaW5nLFxuICAgIHN1Ym5ldElEOiBCdWZmZXIgfCBzdHJpbmcsXG4gICAgc3RhcnRUaW1lOiBEYXRlLFxuICAgIGVuZFRpbWU6IERhdGUsXG4gICAgd2VpZ2h0OiBudW1iZXJcbiAgKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IGFueSA9IHtcbiAgICAgIHVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmQsXG4gICAgICBub2RlSUQsXG4gICAgICBzdGFydFRpbWU6IHN0YXJ0VGltZS5nZXRUaW1lKCkgLyAxMDAwLFxuICAgICAgZW5kVGltZTogZW5kVGltZS5nZXRUaW1lKCkgLyAxMDAwLFxuICAgICAgd2VpZ2h0XG4gICAgfVxuICAgIGlmICh0eXBlb2Ygc3VibmV0SUQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHBhcmFtcy5zdWJuZXRJRCA9IHN1Ym5ldElEXG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc3VibmV0SUQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHBhcmFtcy5zdWJuZXRJRCA9IGJpbnRvb2xzLmNiNThFbmNvZGUoc3VibmV0SUQpXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5hZGRTdWJuZXRWYWxpZGF0b3JcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQudHhJRFxuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhIGRlbGVnYXRvciB0byB0aGUgUHJpbWFyeSBOZXR3b3JrLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIHVzZXJuYW1lIG9mIHRoZSBLZXlzdG9yZSB1c2VyXG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgb2YgdGhlIEtleXN0b3JlIHVzZXJcbiAgICogQHBhcmFtIG5vZGVJRCBUaGUgbm9kZSBJRCBvZiB0aGUgZGVsZWdhdGVlXG4gICAqIEBwYXJhbSBzdGFydFRpbWUgSmF2YXNjcmlwdCBEYXRlIG9iamVjdCBmb3Igd2hlbiB0aGUgZGVsZWdhdG9yIHN0YXJ0cyBkZWxlZ2F0aW5nXG4gICAqIEBwYXJhbSBlbmRUaW1lIEphdmFzY3JpcHQgRGF0ZSBvYmplY3QgZm9yIHdoZW4gdGhlIGRlbGVnYXRvciBzdGFydHMgZGVsZWdhdGluZ1xuICAgKiBAcGFyYW0gc3Rha2VBbW91bnQgVGhlIGFtb3VudCBvZiBuQVZBWCB0aGUgZGVsZWdhdG9yIGlzIHN0YWtpbmcgYXNcbiAgICogYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gcmV3YXJkQWRkcmVzcyBUaGUgYWRkcmVzcyBvZiB0aGUgYWNjb3VudCB0aGUgc3Rha2VkIEFWQVggYW5kIHZhbGlkYXRpb24gcmV3YXJkXG4gICAqIChpZiBhcHBsaWNhYmxlKSBhcmUgc2VudCB0byBhdCBlbmRUaW1lXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGFuIGFycmF5IG9mIHZhbGlkYXRvclwicyBzdGFraW5nSURzLlxuICAgKi9cbiAgYWRkRGVsZWdhdG9yID0gYXN5bmMgKFxuICAgIHVzZXJuYW1lOiBzdHJpbmcsXG4gICAgcGFzc3dvcmQ6IHN0cmluZyxcbiAgICBub2RlSUQ6IHN0cmluZyxcbiAgICBzdGFydFRpbWU6IERhdGUsXG4gICAgZW5kVGltZTogRGF0ZSxcbiAgICBzdGFrZUFtb3VudDogQk4sXG4gICAgcmV3YXJkQWRkcmVzczogc3RyaW5nXG4gICk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBBZGREZWxlZ2F0b3JQYXJhbXMgPSB7XG4gICAgICB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkLFxuICAgICAgbm9kZUlELFxuICAgICAgc3RhcnRUaW1lOiBzdGFydFRpbWUuZ2V0VGltZSgpIC8gMTAwMCxcbiAgICAgIGVuZFRpbWU6IGVuZFRpbWUuZ2V0VGltZSgpIC8gMTAwMCxcbiAgICAgIHN0YWtlQW1vdW50OiBzdGFrZUFtb3VudC50b1N0cmluZygxMCksXG4gICAgICByZXdhcmRBZGRyZXNzXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5hZGREZWxlZ2F0b3JcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQudHhJRFxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiB0byBjcmVhdGUgYSBuZXcgU3VibmV0LiBUaGUgdW5zaWduZWQgdHJhbnNhY3Rpb24gbXVzdCBiZVxuICAgKiBzaWduZWQgd2l0aCB0aGUga2V5IG9mIHRoZSBhY2NvdW50IHBheWluZyB0aGUgdHJhbnNhY3Rpb24gZmVlLiBUaGUgU3VibmV04oCZcyBJRCBpcyB0aGUgSUQgb2YgdGhlIHRyYW5zYWN0aW9uIHRoYXQgY3JlYXRlcyBpdCAoaWUgdGhlIHJlc3BvbnNlIGZyb20gaXNzdWVUeCB3aGVuIGlzc3VpbmcgdGhlIHNpZ25lZCB0cmFuc2FjdGlvbikuXG4gICAqXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgdXNlcm5hbWUgb2YgdGhlIEtleXN0b3JlIHVzZXJcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCBvZiB0aGUgS2V5c3RvcmUgdXNlclxuICAgKiBAcGFyYW0gY29udHJvbEtleXMgQXJyYXkgb2YgcGxhdGZvcm0gYWRkcmVzc2VzIGFzIHN0cmluZ3NcbiAgICogQHBhcmFtIHRocmVzaG9sZCBUbyBhZGQgYSB2YWxpZGF0b3IgdG8gdGhpcyBTdWJuZXQsIGEgdHJhbnNhY3Rpb24gbXVzdCBoYXZlIHRocmVzaG9sZFxuICAgKiBzaWduYXR1cmVzLCB3aGVyZSBlYWNoIHNpZ25hdHVyZSBpcyBmcm9tIGEga2V5IHdob3NlIGFkZHJlc3MgaXMgYW4gZWxlbWVudCBvZiBgY29udHJvbEtleXNgXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGEgc3RyaW5nIHdpdGggdGhlIHVuc2lnbmVkIHRyYW5zYWN0aW9uIGVuY29kZWQgYXMgYmFzZTU4LlxuICAgKi9cbiAgY3JlYXRlU3VibmV0ID0gYXN5bmMgKFxuICAgIHVzZXJuYW1lOiBzdHJpbmcsXG4gICAgcGFzc3dvcmQ6IHN0cmluZyxcbiAgICBjb250cm9sS2V5czogc3RyaW5nW10sXG4gICAgdGhyZXNob2xkOiBudW1iZXJcbiAgKTogUHJvbWlzZTxzdHJpbmcgfCBFcnJvclJlc3BvbnNlT2JqZWN0PiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBDcmVhdGVTdWJuZXRQYXJhbXMgPSB7XG4gICAgICB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkLFxuICAgICAgY29udHJvbEtleXMsXG4gICAgICB0aHJlc2hvbGRcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmNyZWF0ZVN1Ym5ldFwiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC50eElEXG4gICAgICA/IHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SURcbiAgICAgIDogcmVzcG9uc2UuZGF0YS5yZXN1bHRcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIFN1Ym5ldCB0aGF0IHZhbGlkYXRlcyBhIGdpdmVuIGJsb2NrY2hhaW4uXG4gICAqXG4gICAqIEBwYXJhbSBibG9ja2NoYWluSUQgRWl0aGVyIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gb3IgYSBjYjU4XG4gICAqIGVuY29kZWQgc3RyaW5nIGZvciB0aGUgYmxvY2tjaGFpbklEIG9yIGl0cyBhbGlhcy5cbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYSBzdHJpbmcgb2YgdGhlIHN1Ym5ldElEIHRoYXQgdmFsaWRhdGVzIHRoZSBibG9ja2NoYWluLlxuICAgKi9cbiAgdmFsaWRhdGVkQnkgPSBhc3luYyAoYmxvY2tjaGFpbklEOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogYW55ID0ge1xuICAgICAgYmxvY2tjaGFpbklEXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS52YWxpZGF0ZWRCeVwiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5zdWJuZXRJRFxuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgSURzIG9mIHRoZSBibG9ja2NoYWlucyBhIFN1Ym5ldCB2YWxpZGF0ZXMuXG4gICAqXG4gICAqIEBwYXJhbSBzdWJuZXRJRCBFaXRoZXIgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvciBhbiBBVkFYXG4gICAqIHNlcmlhbGl6ZWQgc3RyaW5nIGZvciB0aGUgU3VibmV0SUQgb3IgaXRzIGFsaWFzLlxuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhbiBhcnJheSBvZiBibG9ja2NoYWluSURzIHRoZSBzdWJuZXQgdmFsaWRhdGVzLlxuICAgKi9cbiAgdmFsaWRhdGVzID0gYXN5bmMgKHN1Ym5ldElEOiBCdWZmZXIgfCBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBhbnkgPSB7XG4gICAgICBzdWJuZXRJRFxuICAgIH1cbiAgICBpZiAodHlwZW9mIHN1Ym5ldElEID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBwYXJhbXMuc3VibmV0SUQgPSBzdWJuZXRJRFxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHN1Ym5ldElEICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBwYXJhbXMuc3VibmV0SUQgPSBiaW50b29scy5jYjU4RW5jb2RlKHN1Ym5ldElEKVxuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0udmFsaWRhdGVzXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LmJsb2NrY2hhaW5JRHNcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYWxsIHRoZSBibG9ja2NoYWlucyB0aGF0IGV4aXN0IChleGNsdWRpbmcgdGhlIFAtQ2hhaW4pLlxuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhbiBhcnJheSBvZiBvYmplY3RzIGNvbnRhaW5pbmcgZmllbGRzIFwiaWRcIiwgXCJzdWJuZXRJRFwiLCBhbmQgXCJ2bUlEXCIuXG4gICAqL1xuICBnZXRCbG9ja2NoYWlucyA9IGFzeW5jICgpOiBQcm9taXNlPEJsb2NrY2hhaW5bXT4gPT4ge1xuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5nZXRCbG9ja2NoYWluc1wiXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5ibG9ja2NoYWluc1xuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgQVZBWCBmcm9tIGFuIGFjY291bnQgb24gdGhlIFAtQ2hhaW4gdG8gYW4gYWRkcmVzcyBvbiB0aGUgWC1DaGFpbi4gVGhpcyB0cmFuc2FjdGlvblxuICAgKiBtdXN0IGJlIHNpZ25lZCB3aXRoIHRoZSBrZXkgb2YgdGhlIGFjY291bnQgdGhhdCB0aGUgQVZBWCBpcyBzZW50IGZyb20gYW5kIHdoaWNoIHBheXMgdGhlXG4gICAqIHRyYW5zYWN0aW9uIGZlZS4gQWZ0ZXIgaXNzdWluZyB0aGlzIHRyYW5zYWN0aW9uLCB5b3UgbXVzdCBjYWxsIHRoZSBYLUNoYWlu4oCZcyBpbXBvcnRBVkFYXG4gICAqIG1ldGhvZCB0byBjb21wbGV0ZSB0aGUgdHJhbnNmZXIuXG4gICAqXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgS2V5c3RvcmUgdXNlciB0aGF0IGNvbnRyb2xzIHRoZSBhY2NvdW50IHNwZWNpZmllZCBpbiBgdG9gXG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgb2YgdGhlIEtleXN0b3JlIHVzZXJcbiAgICogQHBhcmFtIHRvIFRoZSBhZGRyZXNzIG9uIHRoZSBYLUNoYWluIHRvIHNlbmQgdGhlIEFWQVggdG8uIERvIG5vdCBpbmNsdWRlIFgtIGluIHRoZSBhZGRyZXNzXG4gICAqIEBwYXJhbSBhbW91bnQgQW1vdW50IG9mIEFWQVggdG8gZXhwb3J0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gdG8gYmUgc2lnbmVkIGJ5IHRoZSBhY2NvdW50IHRoZSB0aGUgQVZBWCBpc1xuICAgKiBzZW50IGZyb20gYW5kIHBheXMgdGhlIHRyYW5zYWN0aW9uIGZlZS5cbiAgICovXG4gIGV4cG9ydEFWQVggPSBhc3luYyAoXG4gICAgdXNlcm5hbWU6IHN0cmluZyxcbiAgICBwYXNzd29yZDogc3RyaW5nLFxuICAgIGFtb3VudDogQk4sXG4gICAgdG86IHN0cmluZ1xuICApOiBQcm9taXNlPHN0cmluZyB8IEVycm9yUmVzcG9uc2VPYmplY3Q+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IEV4cG9ydEFWQVhQYXJhbXMgPSB7XG4gICAgICB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkLFxuICAgICAgdG8sXG4gICAgICBhbW91bnQ6IGFtb3VudC50b1N0cmluZygxMClcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmV4cG9ydEFWQVhcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQudHhJRFxuICAgICAgPyByZXNwb25zZS5kYXRhLnJlc3VsdC50eElEXG4gICAgICA6IHJlc3BvbnNlLmRhdGEucmVzdWx0XG4gIH1cblxuICAvKipcbiAgICogU2VuZCBBVkFYIGZyb20gYW4gYWNjb3VudCBvbiB0aGUgUC1DaGFpbiB0byBhbiBhZGRyZXNzIG9uIHRoZSBYLUNoYWluLiBUaGlzIHRyYW5zYWN0aW9uXG4gICAqIG11c3QgYmUgc2lnbmVkIHdpdGggdGhlIGtleSBvZiB0aGUgYWNjb3VudCB0aGF0IHRoZSBBVkFYIGlzIHNlbnQgZnJvbSBhbmQgd2hpY2ggcGF5c1xuICAgKiB0aGUgdHJhbnNhY3Rpb24gZmVlLiBBZnRlciBpc3N1aW5nIHRoaXMgdHJhbnNhY3Rpb24sIHlvdSBtdXN0IGNhbGwgdGhlIFgtQ2hhaW7igJlzXG4gICAqIGltcG9ydEFWQVggbWV0aG9kIHRvIGNvbXBsZXRlIHRoZSB0cmFuc2Zlci5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSBLZXlzdG9yZSB1c2VyIHRoYXQgY29udHJvbHMgdGhlIGFjY291bnQgc3BlY2lmaWVkIGluIGB0b2BcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCBvZiB0aGUgS2V5c3RvcmUgdXNlclxuICAgKiBAcGFyYW0gdG8gVGhlIElEIG9mIHRoZSBhY2NvdW50IHRoZSBBVkFYIGlzIHNlbnQgdG8uIFRoaXMgbXVzdCBiZSB0aGUgc2FtZSBhcyB0aGUgdG9cbiAgICogYXJndW1lbnQgaW4gdGhlIGNvcnJlc3BvbmRpbmcgY2FsbCB0byB0aGUgWC1DaGFpbuKAmXMgZXhwb3J0QVZBWFxuICAgKiBAcGFyYW0gc291cmNlQ2hhaW4gVGhlIGNoYWluSUQgd2hlcmUgdGhlIGZ1bmRzIGFyZSBjb21pbmcgZnJvbS5cbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYSBzdHJpbmcgZm9yIHRoZSB0cmFuc2FjdGlvbiwgd2hpY2ggc2hvdWxkIGJlIHNlbnQgdG8gdGhlIG5ldHdvcmtcbiAgICogYnkgY2FsbGluZyBpc3N1ZVR4LlxuICAgKi9cbiAgaW1wb3J0QVZBWCA9IGFzeW5jIChcbiAgICB1c2VybmFtZTogc3RyaW5nLFxuICAgIHBhc3N3b3JkOiBzdHJpbmcsXG4gICAgdG86IHN0cmluZyxcbiAgICBzb3VyY2VDaGFpbjogc3RyaW5nXG4gICk6IFByb21pc2U8c3RyaW5nIHwgRXJyb3JSZXNwb25zZU9iamVjdD4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogSW1wb3J0QVZBWFBhcmFtcyA9IHtcbiAgICAgIHRvLFxuICAgICAgc291cmNlQ2hhaW4sXG4gICAgICB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5pbXBvcnRBVkFYXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SURcbiAgICAgID8gcmVzcG9uc2UuZGF0YS5yZXN1bHQudHhJRFxuICAgICAgOiByZXNwb25zZS5kYXRhLnJlc3VsdFxuICB9XG5cbiAgLyoqXG4gICAqIENhbGxzIHRoZSBub2RlJ3MgaXNzdWVUeCBtZXRob2QgZnJvbSB0aGUgQVBJIGFuZCByZXR1cm5zIHRoZSByZXN1bHRpbmcgdHJhbnNhY3Rpb24gSUQgYXMgYSBzdHJpbmcuXG4gICAqXG4gICAqIEBwYXJhbSB0eCBBIHN0cmluZywge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0sIG9yIFtbVHhdXSByZXByZXNlbnRpbmcgYSB0cmFuc2FjdGlvblxuICAgKlxuICAgKiBAcmV0dXJucyBBIFByb21pc2Ugc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgdHJhbnNhY3Rpb24gSUQgb2YgdGhlIHBvc3RlZCB0cmFuc2FjdGlvbi5cbiAgICovXG4gIGlzc3VlVHggPSBhc3luYyAodHg6IHN0cmluZyB8IEJ1ZmZlciB8IFR4KTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBsZXQgVHJhbnNhY3Rpb24gPSBcIlwiXG4gICAgaWYgKHR5cGVvZiB0eCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgVHJhbnNhY3Rpb24gPSB0eFxuICAgIH0gZWxzZSBpZiAodHggaW5zdGFuY2VvZiBCdWZmZXIpIHtcbiAgICAgIGNvbnN0IHR4b2JqOiBUeCA9IG5ldyBUeCgpXG4gICAgICB0eG9iai5mcm9tQnVmZmVyKHR4KVxuICAgICAgVHJhbnNhY3Rpb24gPSB0eG9iai50b1N0cmluZ0hleCgpXG4gICAgfSBlbHNlIGlmICh0eCBpbnN0YW5jZW9mIFR4KSB7XG4gICAgICBUcmFuc2FjdGlvbiA9IHR4LnRvU3RyaW5nSGV4KClcbiAgICB9IGVsc2Uge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBUcmFuc2FjdGlvbkVycm9yKFxuICAgICAgICBcIkVycm9yIC0gcGxhdGZvcm0uaXNzdWVUeDogcHJvdmlkZWQgdHggaXMgbm90IGV4cGVjdGVkIHR5cGUgb2Ygc3RyaW5nLCBCdWZmZXIsIG9yIFR4XCJcbiAgICAgIClcbiAgICB9XG4gICAgY29uc3QgcGFyYW1zOiBhbnkgPSB7XG4gICAgICB0eDogVHJhbnNhY3Rpb24udG9TdHJpbmcoKSxcbiAgICAgIGVuY29kaW5nOiBcImhleFwiXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5pc3N1ZVR4XCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SURcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIHVwcGVyIGJvdW5kIG9uIHRoZSBhbW91bnQgb2YgdG9rZW5zIHRoYXQgZXhpc3QuIE5vdCBtb25vdG9uaWNhbGx5IGluY3JlYXNpbmcgYmVjYXVzZSB0aGlzIG51bWJlciBjYW4gZ28gZG93biBpZiBhIHN0YWtlclwicyByZXdhcmQgaXMgZGVuaWVkLlxuICAgKi9cbiAgZ2V0Q3VycmVudFN1cHBseSA9IGFzeW5jICgpOiBQcm9taXNlPEJOPiA9PiB7XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmdldEN1cnJlbnRTdXBwbHlcIlxuICAgIClcbiAgICByZXR1cm4gbmV3IEJOKHJlc3BvbnNlLmRhdGEucmVzdWx0LnN1cHBseSwgMTApXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgaGVpZ2h0IG9mIHRoZSBwbGF0Zm9ybSBjaGFpbi5cbiAgICovXG4gIGdldEhlaWdodCA9IGFzeW5jICgpOiBQcm9taXNlPEJOPiA9PiB7XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmdldEhlaWdodFwiXG4gICAgKVxuICAgIHJldHVybiBuZXcgQk4ocmVzcG9uc2UuZGF0YS5yZXN1bHQuaGVpZ2h0LCAxMClcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBtaW5pbXVtIHN0YWtpbmcgYW1vdW50LlxuICAgKlxuICAgKiBAcGFyYW0gcmVmcmVzaCBBIGJvb2xlYW4gdG8gYnlwYXNzIHRoZSBsb2NhbCBjYWNoZWQgdmFsdWUgb2YgTWluaW11bSBTdGFrZSBBbW91bnQsIHBvbGxpbmcgdGhlIG5vZGUgaW5zdGVhZC5cbiAgICovXG4gIGdldE1pblN0YWtlID0gYXN5bmMgKFxuICAgIHJlZnJlc2g6IGJvb2xlYW4gPSBmYWxzZVxuICApOiBQcm9taXNlPEdldE1pblN0YWtlUmVzcG9uc2U+ID0+IHtcbiAgICBpZiAoXG4gICAgICByZWZyZXNoICE9PSB0cnVlICYmXG4gICAgICB0eXBlb2YgdGhpcy5taW5WYWxpZGF0b3JTdGFrZSAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgICAgdHlwZW9mIHRoaXMubWluRGVsZWdhdG9yU3Rha2UgIT09IFwidW5kZWZpbmVkXCJcbiAgICApIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIG1pblZhbGlkYXRvclN0YWtlOiB0aGlzLm1pblZhbGlkYXRvclN0YWtlLFxuICAgICAgICBtaW5EZWxlZ2F0b3JTdGFrZTogdGhpcy5taW5EZWxlZ2F0b3JTdGFrZVxuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uZ2V0TWluU3Rha2VcIlxuICAgIClcbiAgICB0aGlzLm1pblZhbGlkYXRvclN0YWtlID0gbmV3IEJOKHJlc3BvbnNlLmRhdGEucmVzdWx0Lm1pblZhbGlkYXRvclN0YWtlLCAxMClcbiAgICB0aGlzLm1pbkRlbGVnYXRvclN0YWtlID0gbmV3IEJOKHJlc3BvbnNlLmRhdGEucmVzdWx0Lm1pbkRlbGVnYXRvclN0YWtlLCAxMClcbiAgICByZXR1cm4ge1xuICAgICAgbWluVmFsaWRhdG9yU3Rha2U6IHRoaXMubWluVmFsaWRhdG9yU3Rha2UsXG4gICAgICBtaW5EZWxlZ2F0b3JTdGFrZTogdGhpcy5taW5EZWxlZ2F0b3JTdGFrZVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBnZXRUb3RhbFN0YWtlKCkgcmV0dXJucyB0aGUgdG90YWwgYW1vdW50IHN0YWtlZCBvbiB0aGUgUHJpbWFyeSBOZXR3b3JrXG4gICAqXG4gICAqIEByZXR1cm5zIEEgYmlnIG51bWJlciByZXByZXNlbnRpbmcgdG90YWwgc3Rha2VkIGJ5IHZhbGlkYXRvcnMgb24gdGhlIHByaW1hcnkgbmV0d29ya1xuICAgKi9cbiAgZ2V0VG90YWxTdGFrZSA9IGFzeW5jICgpOiBQcm9taXNlPEJOPiA9PiB7XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmdldFRvdGFsU3Rha2VcIlxuICAgIClcbiAgICByZXR1cm4gbmV3IEJOKHJlc3BvbnNlLmRhdGEucmVzdWx0LnN0YWtlLCAxMClcbiAgfVxuXG4gIC8qKlxuICAgKiBnZXRNYXhTdGFrZUFtb3VudCgpIHJldHVybnMgdGhlIG1heGltdW0gYW1vdW50IG9mIG5BVkFYIHN0YWtpbmcgdG8gdGhlIG5hbWVkIG5vZGUgZHVyaW5nIHRoZSB0aW1lIHBlcmlvZC5cbiAgICpcbiAgICogQHBhcmFtIHN1Ym5ldElEIEEgQnVmZmVyIG9yIGNiNTggc3RyaW5nIHJlcHJlc2VudGluZyBzdWJuZXRcbiAgICogQHBhcmFtIG5vZGVJRCBBIHN0cmluZyByZXByZXNlbnRpbmcgSUQgb2YgdGhlIG5vZGUgd2hvc2Ugc3Rha2UgYW1vdW50IGlzIHJlcXVpcmVkIGR1cmluZyB0aGUgZ2l2ZW4gZHVyYXRpb25cbiAgICogQHBhcmFtIHN0YXJ0VGltZSBBIGJpZyBudW1iZXIgZGVub3Rpbmcgc3RhcnQgdGltZSBvZiB0aGUgZHVyYXRpb24gZHVyaW5nIHdoaWNoIHN0YWtlIGFtb3VudCBvZiB0aGUgbm9kZSBpcyByZXF1aXJlZC5cbiAgICogQHBhcmFtIGVuZFRpbWUgQSBiaWcgbnVtYmVyIGRlbm90aW5nIGVuZCB0aW1lIG9mIHRoZSBkdXJhdGlvbiBkdXJpbmcgd2hpY2ggc3Rha2UgYW1vdW50IG9mIHRoZSBub2RlIGlzIHJlcXVpcmVkLlxuICAgKiBAcmV0dXJucyBBIGJpZyBudW1iZXIgcmVwcmVzZW50aW5nIHRvdGFsIHN0YWtlZCBieSB2YWxpZGF0b3JzIG9uIHRoZSBwcmltYXJ5IG5ldHdvcmtcbiAgICovXG4gIGdldE1heFN0YWtlQW1vdW50ID0gYXN5bmMgKFxuICAgIHN1Ym5ldElEOiBzdHJpbmcgfCBCdWZmZXIsXG4gICAgbm9kZUlEOiBzdHJpbmcsXG4gICAgc3RhcnRUaW1lOiBCTixcbiAgICBlbmRUaW1lOiBCTlxuICApOiBQcm9taXNlPEJOPiA9PiB7XG4gICAgY29uc3Qgbm93OiBCTiA9IFVuaXhOb3coKVxuICAgIGlmIChzdGFydFRpbWUuZ3Qobm93KSB8fCBlbmRUaW1lLmx0ZShzdGFydFRpbWUpKSB7XG4gICAgICB0aHJvdyBuZXcgVGltZUVycm9yKFxuICAgICAgICBcIlBsYXRmb3JtVk1BUEkuZ2V0TWF4U3Rha2VBbW91bnQgLS0gc3RhcnRUaW1lIG11c3QgYmUgaW4gdGhlIHBhc3QgYW5kIGVuZFRpbWUgbXVzdCBjb21lIGFmdGVyIHN0YXJ0VGltZVwiXG4gICAgICApXG4gICAgfVxuXG4gICAgY29uc3QgcGFyYW1zOiBHZXRNYXhTdGFrZUFtb3VudFBhcmFtcyA9IHtcbiAgICAgIG5vZGVJRDogbm9kZUlELFxuICAgICAgc3RhcnRUaW1lOiBzdGFydFRpbWUudG9TdHJpbmcoMTApLFxuICAgICAgZW5kVGltZTogZW5kVGltZS50b1N0cmluZygxMClcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHN1Ym5ldElEID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBwYXJhbXMuc3VibmV0SUQgPSBzdWJuZXRJRFxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHN1Ym5ldElEICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBwYXJhbXMuc3VibmV0SUQgPSBiaW50b29scy5jYjU4RW5jb2RlKHN1Ym5ldElEKVxuICAgIH1cblxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5nZXRNYXhTdGFrZUFtb3VudFwiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiBuZXcgQk4ocmVzcG9uc2UuZGF0YS5yZXN1bHQuYW1vdW50LCAxMClcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBtaW5pbXVtIHN0YWtlIGNhY2hlZCBpbiB0aGlzIGNsYXNzLlxuICAgKiBAcGFyYW0gbWluVmFsaWRhdG9yU3Rha2UgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfSB0byBzZXQgdGhlIG1pbmltdW0gc3Rha2UgYW1vdW50IGNhY2hlZCBpbiB0aGlzIGNsYXNzLlxuICAgKiBAcGFyYW0gbWluRGVsZWdhdG9yU3Rha2UgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfSB0byBzZXQgdGhlIG1pbmltdW0gZGVsZWdhdGlvbiBhbW91bnQgY2FjaGVkIGluIHRoaXMgY2xhc3MuXG4gICAqL1xuICBzZXRNaW5TdGFrZSA9IChcbiAgICBtaW5WYWxpZGF0b3JTdGFrZTogQk4gPSB1bmRlZmluZWQsXG4gICAgbWluRGVsZWdhdG9yU3Rha2U6IEJOID0gdW5kZWZpbmVkXG4gICk6IHZvaWQgPT4ge1xuICAgIGlmICh0eXBlb2YgbWluVmFsaWRhdG9yU3Rha2UgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHRoaXMubWluVmFsaWRhdG9yU3Rha2UgPSBtaW5WYWxpZGF0b3JTdGFrZVxuICAgIH1cbiAgICBpZiAodHlwZW9mIG1pbkRlbGVnYXRvclN0YWtlICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aGlzLm1pbkRlbGVnYXRvclN0YWtlID0gbWluRGVsZWdhdG9yU3Rha2VcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdG90YWwgYW1vdW50IHN0YWtlZCBmb3IgYW4gYXJyYXkgb2YgYWRkcmVzc2VzLlxuICAgKi9cbiAgZ2V0U3Rha2UgPSBhc3luYyAoXG4gICAgYWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICBlbmNvZGluZzogc3RyaW5nID0gXCJoZXhcIlxuICApOiBQcm9taXNlPEdldFN0YWtlUmVzcG9uc2U+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IEdldFN0YWtlUGFyYW1zID0ge1xuICAgICAgYWRkcmVzc2VzLFxuICAgICAgZW5jb2RpbmdcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmdldFN0YWtlXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YWtlZDogbmV3IEJOKHJlc3BvbnNlLmRhdGEucmVzdWx0LnN0YWtlZCwgMTApLFxuICAgICAgc3Rha2VkT3V0cHV0czogcmVzcG9uc2UuZGF0YS5yZXN1bHQuc3Rha2VkT3V0cHV0cy5tYXAoXG4gICAgICAgIChzdGFrZWRPdXRwdXQ6IHN0cmluZyk6IFRyYW5zZmVyYWJsZU91dHB1dCA9PiB7XG4gICAgICAgICAgY29uc3QgdHJhbnNmZXJhYmxlT3V0cHV0OiBUcmFuc2ZlcmFibGVPdXRwdXQgPVxuICAgICAgICAgICAgbmV3IFRyYW5zZmVyYWJsZU91dHB1dCgpXG4gICAgICAgICAgbGV0IGJ1ZjogQnVmZmVyXG4gICAgICAgICAgaWYgKGVuY29kaW5nID09PSBcImNiNThcIikge1xuICAgICAgICAgICAgYnVmID0gYmludG9vbHMuY2I1OERlY29kZShzdGFrZWRPdXRwdXQpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGJ1ZiA9IEJ1ZmZlci5mcm9tKHN0YWtlZE91dHB1dC5yZXBsYWNlKC8weC9nLCBcIlwiKSwgXCJoZXhcIilcbiAgICAgICAgICB9XG4gICAgICAgICAgdHJhbnNmZXJhYmxlT3V0cHV0LmZyb21CdWZmZXIoYnVmLCAyKVxuICAgICAgICAgIHJldHVybiB0cmFuc2ZlcmFibGVPdXRwdXRcbiAgICAgICAgfVxuICAgICAgKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYWxsIHRoZSBzdWJuZXRzIHRoYXQgZXhpc3QuXG4gICAqXG4gICAqIEBwYXJhbSBpZHMgSURzIG9mIHRoZSBzdWJuZXRzIHRvIHJldHJpZXZlIGluZm9ybWF0aW9uIGFib3V0LiBJZiBvbWl0dGVkLCBnZXRzIGFsbCBzdWJuZXRzXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGFuIGFycmF5IG9mIG9iamVjdHMgY29udGFpbmluZyBmaWVsZHMgXCJpZFwiLFxuICAgKiBcImNvbnRyb2xLZXlzXCIsIGFuZCBcInRocmVzaG9sZFwiLlxuICAgKi9cbiAgZ2V0U3VibmV0cyA9IGFzeW5jIChpZHM6IHN0cmluZ1tdID0gdW5kZWZpbmVkKTogUHJvbWlzZTxTdWJuZXRbXT4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogYW55ID0ge31cbiAgICBpZiAodHlwZW9mIGlkcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBwYXJhbXMuaWRzID0gaWRzXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5nZXRTdWJuZXRzXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnN1Ym5ldHNcbiAgfVxuXG4gIC8qKlxuICAgKiBFeHBvcnRzIHRoZSBwcml2YXRlIGtleSBmb3IgYW4gYWRkcmVzcy5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSBuYW1lIG9mIHRoZSB1c2VyIHdpdGggdGhlIHByaXZhdGUga2V5XG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgdXNlZCB0byBkZWNyeXB0IHRoZSBwcml2YXRlIGtleVxuICAgKiBAcGFyYW0gYWRkcmVzcyBUaGUgYWRkcmVzcyB3aG9zZSBwcml2YXRlIGtleSBzaG91bGQgYmUgZXhwb3J0ZWRcbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSB3aXRoIHRoZSBkZWNyeXB0ZWQgcHJpdmF0ZSBrZXkgYXMgc3RvcmUgaW4gdGhlIGRhdGFiYXNlXG4gICAqL1xuICBleHBvcnRLZXkgPSBhc3luYyAoXG4gICAgdXNlcm5hbWU6IHN0cmluZyxcbiAgICBwYXNzd29yZDogc3RyaW5nLFxuICAgIGFkZHJlc3M6IHN0cmluZ1xuICApOiBQcm9taXNlPHN0cmluZyB8IEVycm9yUmVzcG9uc2VPYmplY3Q+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IEV4cG9ydEtleVBhcmFtcyA9IHtcbiAgICAgIHVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmQsXG4gICAgICBhZGRyZXNzXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5leHBvcnRLZXlcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQucHJpdmF0ZUtleVxuICAgICAgPyByZXNwb25zZS5kYXRhLnJlc3VsdC5wcml2YXRlS2V5XG4gICAgICA6IHJlc3BvbnNlLmRhdGEucmVzdWx0XG4gIH1cblxuICAvKipcbiAgICogR2l2ZSBhIHVzZXIgY29udHJvbCBvdmVyIGFuIGFkZHJlc3MgYnkgcHJvdmlkaW5nIHRoZSBwcml2YXRlIGtleSB0aGF0IGNvbnRyb2xzIHRoZSBhZGRyZXNzLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIG5hbWUgb2YgdGhlIHVzZXIgdG8gc3RvcmUgdGhlIHByaXZhdGUga2V5XG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgdGhhdCB1bmxvY2tzIHRoZSB1c2VyXG4gICAqIEBwYXJhbSBwcml2YXRlS2V5IEEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgcHJpdmF0ZSBrZXkgaW4gdGhlIHZtXCJzIGZvcm1hdFxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgYWRkcmVzcyBmb3IgdGhlIGltcG9ydGVkIHByaXZhdGUga2V5LlxuICAgKi9cbiAgaW1wb3J0S2V5ID0gYXN5bmMgKFxuICAgIHVzZXJuYW1lOiBzdHJpbmcsXG4gICAgcGFzc3dvcmQ6IHN0cmluZyxcbiAgICBwcml2YXRlS2V5OiBzdHJpbmdcbiAgKTogUHJvbWlzZTxzdHJpbmcgfCBFcnJvclJlc3BvbnNlT2JqZWN0PiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBJbXBvcnRLZXlQYXJhbXMgPSB7XG4gICAgICB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkLFxuICAgICAgcHJpdmF0ZUtleVxuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uaW1wb3J0S2V5XCIsXG4gICAgICBwYXJhbXNcbiAgICApXG5cbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuYWRkcmVzc1xuICAgICAgPyByZXNwb25zZS5kYXRhLnJlc3VsdC5hZGRyZXNzXG4gICAgICA6IHJlc3BvbnNlLmRhdGEucmVzdWx0XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgdHJlYW5zYWN0aW9uIGRhdGEgb2YgYSBwcm92aWRlZCB0cmFuc2FjdGlvbiBJRCBieSBjYWxsaW5nIHRoZSBub2RlJ3MgYGdldFR4YCBtZXRob2QuXG4gICAqXG4gICAqIEBwYXJhbSB0eElEIFRoZSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIHRyYW5zYWN0aW9uIElEXG4gICAqIEBwYXJhbSBlbmNvZGluZyBzZXRzIHRoZSBmb3JtYXQgb2YgdGhlIHJldHVybmVkIHRyYW5zYWN0aW9uLiBDYW4gYmUsIFwiY2I1OFwiLCBcImhleFwiIG9yIFwianNvblwiLiBEZWZhdWx0cyB0byBcImNiNThcIi5cbiAgICpcbiAgICogQHJldHVybnMgUmV0dXJucyBhIFByb21pc2Ugc3RyaW5nIG9yIG9iamVjdCBjb250YWluaW5nIHRoZSBieXRlcyByZXRyaWV2ZWQgZnJvbSB0aGUgbm9kZVxuICAgKi9cbiAgZ2V0VHggPSBhc3luYyAoXG4gICAgdHhJRDogc3RyaW5nLFxuICAgIGVuY29kaW5nOiBzdHJpbmcgPSBcImhleFwiXG4gICk6IFByb21pc2U8c3RyaW5nIHwgb2JqZWN0PiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBhbnkgPSB7XG4gICAgICB0eElELFxuICAgICAgZW5jb2RpbmdcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmdldFR4XCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4XG4gICAgICA/IHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4XG4gICAgICA6IHJlc3BvbnNlLmRhdGEucmVzdWx0XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgc3RhdHVzIG9mIGEgcHJvdmlkZWQgdHJhbnNhY3Rpb24gSUQgYnkgY2FsbGluZyB0aGUgbm9kZSdzIGBnZXRUeFN0YXR1c2AgbWV0aG9kLlxuICAgKlxuICAgKiBAcGFyYW0gdHhpZCBUaGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB0cmFuc2FjdGlvbiBJRFxuICAgKiBAcGFyYW0gaW5jbHVkZVJlYXNvbiBSZXR1cm4gdGhlIHJlYXNvbiB0eCB3YXMgZHJvcHBlZCwgaWYgYXBwbGljYWJsZS4gRGVmYXVsdHMgdG8gdHJ1ZVxuICAgKlxuICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZSBzdHJpbmcgY29udGFpbmluZyB0aGUgc3RhdHVzIHJldHJpZXZlZCBmcm9tIHRoZSBub2RlIGFuZCB0aGUgcmVhc29uIGEgdHggd2FzIGRyb3BwZWQsIGlmIGFwcGxpY2FibGUuXG4gICAqL1xuICBnZXRUeFN0YXR1cyA9IGFzeW5jIChcbiAgICB0eGlkOiBzdHJpbmcsXG4gICAgaW5jbHVkZVJlYXNvbjogYm9vbGVhbiA9IHRydWVcbiAgKTogUHJvbWlzZTxzdHJpbmcgfCBHZXRUeFN0YXR1c1Jlc3BvbnNlPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBHZXRUeFN0YXR1c1BhcmFtcyA9IHtcbiAgICAgIHR4SUQ6IHR4aWQsXG4gICAgICBpbmNsdWRlUmVhc29uOiBpbmNsdWRlUmVhc29uXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5nZXRUeFN0YXR1c1wiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdFxuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyB0aGUgVVRYT3MgcmVsYXRlZCB0byB0aGUgYWRkcmVzc2VzIHByb3ZpZGVkIGZyb20gdGhlIG5vZGUncyBgZ2V0VVRYT3NgIG1ldGhvZC5cbiAgICpcbiAgICogQHBhcmFtIGFkZHJlc3NlcyBBbiBhcnJheSBvZiBhZGRyZXNzZXMgYXMgY2I1OCBzdHJpbmdzIG9yIGFkZHJlc3NlcyBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfXNcbiAgICogQHBhcmFtIHNvdXJjZUNoYWluIEEgc3RyaW5nIGZvciB0aGUgY2hhaW4gdG8gbG9vayBmb3IgdGhlIFVUWE9cInMuIERlZmF1bHQgaXMgdG8gdXNlIHRoaXMgY2hhaW4sIGJ1dCBpZiBleHBvcnRlZCBVVFhPcyBleGlzdCBmcm9tIG90aGVyIGNoYWlucywgdGhpcyBjYW4gdXNlZCB0byBwdWxsIHRoZW0gaW5zdGVhZC5cbiAgICogQHBhcmFtIGxpbWl0IE9wdGlvbmFsLiBSZXR1cm5zIGF0IG1vc3QgW2xpbWl0XSBhZGRyZXNzZXMuIElmIFtsaW1pdF0gPT0gMCBvciA+IFttYXhVVFhPc1RvRmV0Y2hdLCBmZXRjaGVzIHVwIHRvIFttYXhVVFhPc1RvRmV0Y2hdLlxuICAgKiBAcGFyYW0gc3RhcnRJbmRleCBPcHRpb25hbC4gW1N0YXJ0SW5kZXhdIGRlZmluZXMgd2hlcmUgdG8gc3RhcnQgZmV0Y2hpbmcgVVRYT3MgKGZvciBwYWdpbmF0aW9uLilcbiAgICogVVRYT3MgZmV0Y2hlZCBhcmUgZnJvbSBhZGRyZXNzZXMgZXF1YWwgdG8gb3IgZ3JlYXRlciB0aGFuIFtTdGFydEluZGV4LkFkZHJlc3NdXG4gICAqIEZvciBhZGRyZXNzIFtTdGFydEluZGV4LkFkZHJlc3NdLCBvbmx5IFVUWE9zIHdpdGggSURzIGdyZWF0ZXIgdGhhbiBbU3RhcnRJbmRleC5VdHhvXSB3aWxsIGJlIHJldHVybmVkLlxuICAgKiBAcGFyYW0gcGVyc2lzdE9wdHMgT3B0aW9ucyBhdmFpbGFibGUgdG8gcGVyc2lzdCB0aGVzZSBVVFhPcyBpbiBsb2NhbCBzdG9yYWdlXG4gICAqIEBwYXJhbSBlbmNvZGluZyBPcHRpb25hbC4gIGlzIHRoZSBlbmNvZGluZyBmb3JtYXQgdG8gdXNlIGZvciB0aGUgcGF5bG9hZCBhcmd1bWVudC4gQ2FuIGJlIGVpdGhlciBcImNiNThcIiBvciBcImhleFwiLiBEZWZhdWx0cyB0byBcImhleFwiLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBwZXJzaXN0T3B0cyBpcyBvcHRpb25hbCBhbmQgbXVzdCBiZSBvZiB0eXBlIFtbUGVyc2lzdGFuY2VPcHRpb25zXV1cbiAgICpcbiAgICovXG4gIGdldFVUWE9zID0gYXN5bmMgKFxuICAgIGFkZHJlc3Nlczogc3RyaW5nW10gfCBzdHJpbmcsXG4gICAgc291cmNlQ2hhaW46IHN0cmluZyA9IHVuZGVmaW5lZCxcbiAgICBsaW1pdDogbnVtYmVyID0gMCxcbiAgICBzdGFydEluZGV4OiB7IGFkZHJlc3M6IHN0cmluZzsgdXR4bzogc3RyaW5nIH0gPSB1bmRlZmluZWQsXG4gICAgcGVyc2lzdE9wdHM6IFBlcnNpc3RhbmNlT3B0aW9ucyA9IHVuZGVmaW5lZCxcbiAgICBlbmNvZGluZzogc3RyaW5nID0gXCJoZXhcIlxuICApOiBQcm9taXNlPEdldFVUWE9zUmVzcG9uc2U+ID0+IHtcbiAgICBpZiAodHlwZW9mIGFkZHJlc3NlcyA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgYWRkcmVzc2VzID0gW2FkZHJlc3Nlc11cbiAgICB9XG5cbiAgICBjb25zdCBwYXJhbXM6IEdldFVUWE9zUGFyYW1zID0ge1xuICAgICAgYWRkcmVzc2VzOiBhZGRyZXNzZXMsXG4gICAgICBsaW1pdCxcbiAgICAgIGVuY29kaW5nXG4gICAgfVxuICAgIGlmICh0eXBlb2Ygc3RhcnRJbmRleCAhPT0gXCJ1bmRlZmluZWRcIiAmJiBzdGFydEluZGV4KSB7XG4gICAgICBwYXJhbXMuc3RhcnRJbmRleCA9IHN0YXJ0SW5kZXhcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHNvdXJjZUNoYWluICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBwYXJhbXMuc291cmNlQ2hhaW4gPSBzb3VyY2VDaGFpblxuICAgIH1cblxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5nZXRVVFhPc1wiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuXG4gICAgY29uc3QgdXR4b3M6IFVUWE9TZXQgPSBuZXcgVVRYT1NldCgpXG4gICAgbGV0IGRhdGEgPSByZXNwb25zZS5kYXRhLnJlc3VsdC51dHhvc1xuICAgIGlmIChwZXJzaXN0T3B0cyAmJiB0eXBlb2YgcGVyc2lzdE9wdHMgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgIGlmICh0aGlzLmRiLmhhcyhwZXJzaXN0T3B0cy5nZXROYW1lKCkpKSB7XG4gICAgICAgIGNvbnN0IHNlbGZBcnJheTogc3RyaW5nW10gPSB0aGlzLmRiLmdldChwZXJzaXN0T3B0cy5nZXROYW1lKCkpXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHNlbGZBcnJheSkpIHtcbiAgICAgICAgICB1dHhvcy5hZGRBcnJheShkYXRhKVxuICAgICAgICAgIGNvbnN0IHNlbGY6IFVUWE9TZXQgPSBuZXcgVVRYT1NldCgpXG4gICAgICAgICAgc2VsZi5hZGRBcnJheShzZWxmQXJyYXkpXG4gICAgICAgICAgc2VsZi5tZXJnZUJ5UnVsZSh1dHhvcywgcGVyc2lzdE9wdHMuZ2V0TWVyZ2VSdWxlKCkpXG4gICAgICAgICAgZGF0YSA9IHNlbGYuZ2V0QWxsVVRYT1N0cmluZ3MoKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLmRiLnNldChwZXJzaXN0T3B0cy5nZXROYW1lKCksIGRhdGEsIHBlcnNpc3RPcHRzLmdldE92ZXJ3cml0ZSgpKVxuICAgIH1cblxuICAgIGlmIChkYXRhLmxlbmd0aCA+IDAgJiYgZGF0YVswXS5zdWJzdHJpbmcoMCwgMikgPT09IFwiMHhcIikge1xuICAgICAgY29uc3QgY2I1OFN0cnM6IHN0cmluZ1tdID0gW11cbiAgICAgIGRhdGEuZm9yRWFjaCgoc3RyOiBzdHJpbmcpOiB2b2lkID0+IHtcbiAgICAgICAgY2I1OFN0cnMucHVzaChiaW50b29scy5jYjU4RW5jb2RlKEJ1ZmZlci5mcm9tKHN0ci5zbGljZSgyKSwgXCJoZXhcIikpKVxuICAgICAgfSlcblxuICAgICAgdXR4b3MuYWRkQXJyYXkoY2I1OFN0cnMsIGZhbHNlKVxuICAgIH0gZWxzZSB7XG4gICAgICB1dHhvcy5hZGRBcnJheShkYXRhLCBmYWxzZSlcbiAgICB9XG4gICAgcmVzcG9uc2UuZGF0YS5yZXN1bHQudXR4b3MgPSB1dHhvc1xuICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0Lm51bUZldGNoZWQgPSBwYXJzZUludChyZXNwb25zZS5kYXRhLnJlc3VsdC5udW1GZXRjaGVkKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdFxuICB9XG5cbiAgLyoqXG4gICAqIGdldEFkZHJlc3NTdGF0ZXMoKSByZXR1cm5zIGFuIDY0IGJpdCBiaXRtYXNrIG9mIHN0YXRlcyBhcHBsaWVkIHRvIGFkZHJlc3NcbiAgICpcbiAgICogQHJldHVybnMgQSBiaWcgbnVtYmVyIHJlcHJlc2VudGluZyB0aGUgc3RhdGVzIGFwcGxpZWQgdG8gZ2l2ZW4gYWRkcmVzc1xuICAgKi9cbiAgZ2V0QWRkcmVzc1N0YXRlcyA9IGFzeW5jIChhZGRyZXNzOiBzdHJpbmcpOiBQcm9taXNlPEJOPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBBZGRyZXNzUGFyYW1zID0ge1xuICAgICAgYWRkcmVzczogYWRkcmVzc1xuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uZ2V0QWRkcmVzc1N0YXRlc1wiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiBuZXcgQk4ocmVzcG9uc2UuZGF0YS5yZXN1bHQsIDEwKVxuICB9XG5cbiAgLyoqXG4gICAqIGdldE11bHRpc2lnQWxpYXMoKSByZXR1cm5zIGEgTXVsdGlzaWdBbGlhc1JlcGx5XG4gICAqXG4gICAqIEByZXR1cm5zIEEgTXVsdGlTaWdBbGlhc1xuICAgKi9cbiAgZ2V0TXVsdGlzaWdBbGlhcyA9IGFzeW5jIChhZGRyZXNzOiBzdHJpbmcpOiBQcm9taXNlPE11bHRpc2lnQWxpYXNSZXBseT4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogQWRkcmVzc1BhcmFtcyA9IHtcbiAgICAgIGFkZHJlc3M6IGFkZHJlc3NcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmdldE11bHRpc2lnQWxpYXNcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHRcbiAgfVxuXG4gIC8qKlxuICAgKiBIZWxwZXIgZnVuY3Rpb24gd2hpY2ggY3JlYXRlcyBhbiB1bnNpZ25lZCB0cmFuc2FjdGlvbi4gRm9yIG1vcmUgZ3JhbnVsYXIgY29udHJvbCwgeW91IG1heSBjcmVhdGUgeW91ciBvd25cbiAgICogW1tVbnNpZ25lZFR4XV0gbWFudWFsbHkgKHdpdGggdGhlaXIgY29ycmVzcG9uZGluZyBbW1RyYW5zZmVyYWJsZUlucHV0XV1zLCBbW1RyYW5zZmVyYWJsZU91dHB1dF1dcywgYW5kIFtbVHJhbnNmZXJPcGVyYXRpb25dXXMpLlxuICAgKlxuICAgKiBAcGFyYW0gdXR4b3NldCBBIHNldCBvZiBVVFhPcyB0aGF0IHRoZSB0cmFuc2FjdGlvbiBpcyBidWlsdCBvblxuICAgKiBAcGFyYW0gYW1vdW50IFRoZSBhbW91bnQgb2YgQXNzZXRJRCB0byBiZSBzcGVudCBpbiBpdHMgc21hbGxlc3QgZGVub21pbmF0aW9uLCByZXByZXNlbnRlZCBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfS5cbiAgICogQHBhcmFtIHRvQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdG8gc2VuZCB0aGUgZnVuZHNcbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIHNlbmQgdGhlIGZ1bmRzIGZyb20gdGhlIFVUWE9zIHByb3ZpZGVkXG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0aGF0IGNhbiBzcGVuZCB0aGUgY2hhbmdlIHJlbWFpbmluZyBmcm9tIHRoZSBzcGVudCBVVFhPc1xuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCBDQjU4IEJ1ZmZlciBvciBTdHJpbmcgd2hpY2ggY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIGxvY2t0aW1lIE9wdGlvbmFsLiBUaGUgbG9ja3RpbWUgZmllbGQgY3JlYXRlZCBpbiB0aGUgcmVzdWx0aW5nIG91dHB1dHNcbiAgICogQHBhcmFtIHRvVGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgVVRYT1xuICAgKiBAcGFyYW0gY2hhbmdlVGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgY2hhbmdlIFVUWE9cbiAgICpcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gKFtbVW5zaWduZWRUeF1dKSB3aGljaCBjb250YWlucyBhIFtbQmFzZVR4XV0uXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgaGVscGVyIGV4aXN0cyBiZWNhdXNlIHRoZSBlbmRwb2ludCBBUEkgc2hvdWxkIGJlIHRoZSBwcmltYXJ5IHBvaW50IG9mIGVudHJ5IGZvciBtb3N0IGZ1bmN0aW9uYWxpdHkuXG4gICAqL1xuICBidWlsZEJhc2VUeCA9IGFzeW5jIChcbiAgICB1dHhvc2V0OiBVVFhPU2V0LFxuICAgIGFtb3VudDogQk4sXG4gICAgdG9BZGRyZXNzZXM6IHN0cmluZ1tdLFxuICAgIGZyb21BZGRyZXNzZXM6IEZyb21UeXBlLFxuICAgIGNoYW5nZUFkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgbWVtbzogUGF5bG9hZEJhc2UgfCBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgYXNPZjogQk4gPSBVbml4Tm93KCksXG4gICAgbG9ja3RpbWU6IEJOID0gbmV3IEJOKDApLFxuICAgIHRvVGhyZXNob2xkOiBudW1iZXIgPSAxLFxuICAgIGNoYW5nZVRocmVzaG9sZDogbnVtYmVyID0gMVxuICApOiBQcm9taXNlPFVuc2lnbmVkVHg+ID0+IHtcbiAgICBjb25zdCBjYWxsZXI6IHN0cmluZyA9IFwiYnVpbGRCYXNlVHhcIlxuICAgIGNvbnN0IHRvOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5QnVmZmVyKHRvQWRkcmVzc2VzLCBjYWxsZXIpXG4gICAgY29uc3QgZnJvbVNpZ25lciA9IHRoaXMuX3BhcnNlRnJvbVNpZ25lcihmcm9tQWRkcmVzc2VzLCBjYWxsZXIpXG4gICAgY29uc3QgY2hhbmdlOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5QnVmZmVyKFxuICAgICAgY2hhbmdlQWRkcmVzc2VzLFxuICAgICAgY2FsbGVyXG4gICAgKVxuXG4gICAgaWYgKG1lbW8gaW5zdGFuY2VvZiBQYXlsb2FkQmFzZSkge1xuICAgICAgbWVtbyA9IG1lbW8uZ2V0UGF5bG9hZCgpXG4gICAgfVxuICAgIGNvbnN0IG5ldHdvcmtJRDogbnVtYmVyID0gdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpXG4gICAgY29uc3QgYmxvY2tjaGFpbklEQnVmOiBCdWZmZXIgPSBiaW50b29scy5jYjU4RGVjb2RlKHRoaXMuYmxvY2tjaGFpbklEKVxuICAgIGNvbnN0IGZlZTogQk4gPSB0aGlzLmdldFR4RmVlKClcbiAgICBjb25zdCBmZWVBc3NldElEOiBCdWZmZXIgPSBhd2FpdCB0aGlzLmdldEFWQVhBc3NldElEKClcblxuICAgIGNvbnN0IGJ1aWx0VW5zaWduZWRUeDogVW5zaWduZWRUeCA9IGF3YWl0IHRoaXMuX2dldEJ1aWxkZXIoXG4gICAgICB1dHhvc2V0XG4gICAgKS5idWlsZEJhc2VUeChcbiAgICAgIG5ldHdvcmtJRCxcbiAgICAgIGJsb2NrY2hhaW5JREJ1ZixcbiAgICAgIGFtb3VudCxcbiAgICAgIGZlZUFzc2V0SUQsXG4gICAgICB0byxcbiAgICAgIGZyb21TaWduZXIsXG4gICAgICBjaGFuZ2UsXG4gICAgICBmZWUsXG4gICAgICBmZWVBc3NldElELFxuICAgICAgbWVtbyxcbiAgICAgIGFzT2YsXG4gICAgICBsb2NrdGltZSxcbiAgICAgIHRvVGhyZXNob2xkLFxuICAgICAgY2hhbmdlVGhyZXNob2xkXG4gICAgKVxuXG4gICAgaWYgKCEoYXdhaXQgdGhpcy5jaGVja0dvb3NlRWdnKGJ1aWx0VW5zaWduZWRUeCkpKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgbmV3IEdvb3NlRWdnQ2hlY2tFcnJvcihcIkZhaWxlZCBHb29zZSBFZ2cgQ2hlY2tcIilcbiAgICB9XG5cbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4XG4gIH1cblxuICAvKipcbiAgICogSGVscGVyIGZ1bmN0aW9uIHdoaWNoIGNyZWF0ZXMgYW4gdW5zaWduZWQgSW1wb3J0IFR4LiBGb3IgbW9yZSBncmFudWxhciBjb250cm9sLCB5b3UgbWF5IGNyZWF0ZSB5b3VyIG93blxuICAgKiBbW1Vuc2lnbmVkVHhdXSBtYW51YWxseSAod2l0aCB0aGVpciBjb3JyZXNwb25kaW5nIFtbVHJhbnNmZXJhYmxlSW5wdXRdXXMsIFtbVHJhbnNmZXJhYmxlT3V0cHV0XV1zLCBhbmQgW1tUcmFuc2Zlck9wZXJhdGlvbl1dcykuXG4gICAqXG4gICAqIEBwYXJhbSB1dHhvc2V0IEEgc2V0IG9mIFVUWE9zIHRoYXQgdGhlIHRyYW5zYWN0aW9uIGlzIGJ1aWx0IG9uXG4gICAqIEBwYXJhbSBvd25lckFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGJlaW5nIHVzZWQgdG8gaW1wb3J0XG4gICAqIEBwYXJhbSBzb3VyY2VDaGFpbiBUaGUgY2hhaW5pZCBmb3Igd2hlcmUgdGhlIGltcG9ydCBpcyBjb21pbmcgZnJvbS5cbiAgICogQHBhcmFtIHRvQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdG8gc2VuZCB0aGUgZnVuZHNcbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIHNlbmQgdGhlIGZ1bmRzIGZyb20gdGhlIFVUWE9zIHByb3ZpZGVkXG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0aGF0IGNhbiBzcGVuZCB0aGUgY2hhbmdlIHJlbWFpbmluZyBmcm9tIHRoZSBzcGVudCBVVFhPc1xuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xuICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gbG9ja3RpbWUgT3B0aW9uYWwuIFRoZSBsb2NrdGltZSBmaWVsZCBjcmVhdGVkIGluIHRoZSByZXN1bHRpbmcgb3V0cHV0c1xuICAgKiBAcGFyYW0gdG9UaHJlc2hvbGQgT3B0aW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCBVVFhPXG4gICAqIEBwYXJhbSBjaGFuZ2VUaHJlc2hvbGQgT3B0aW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCBjaGFuZ2UgVVRYT1xuICAgKlxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiAoW1tVbnNpZ25lZFR4XV0pIHdoaWNoIGNvbnRhaW5zIGEgW1tJbXBvcnRUeF1dLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBUaGlzIGhlbHBlciBleGlzdHMgYmVjYXVzZSB0aGUgZW5kcG9pbnQgQVBJIHNob3VsZCBiZSB0aGUgcHJpbWFyeSBwb2ludCBvZiBlbnRyeSBmb3IgbW9zdCBmdW5jdGlvbmFsaXR5LlxuICAgKi9cbiAgYnVpbGRJbXBvcnRUeCA9IGFzeW5jIChcbiAgICB1dHhvc2V0OiBVVFhPU2V0LFxuICAgIG93bmVyQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICBzb3VyY2VDaGFpbjogQnVmZmVyIHwgc3RyaW5nLFxuICAgIHRvQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICBmcm9tQWRkcmVzc2VzOiBGcm9tVHlwZSxcbiAgICBjaGFuZ2VBZGRyZXNzZXM6IHN0cmluZ1tdID0gdW5kZWZpbmVkLFxuICAgIG1lbW86IFBheWxvYWRCYXNlIHwgQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGFzT2Y6IEJOID0gWmVyb0JOLFxuICAgIGxvY2t0aW1lOiBCTiA9IFplcm9CTixcbiAgICB0b1RocmVzaG9sZDogbnVtYmVyID0gMSxcbiAgICBjaGFuZ2VUaHJlc2hvbGQ6IG51bWJlciA9IDFcbiAgKTogUHJvbWlzZTxVbnNpZ25lZFR4PiA9PiB7XG4gICAgY29uc3QgY2FsbGVyID0gXCJidWlsZEltcG9ydFR4XCJcblxuICAgIGNvbnN0IHRvOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5QnVmZmVyKHRvQWRkcmVzc2VzLCBjYWxsZXIpXG5cbiAgICBjb25zdCBmcm9tU2lnbmVyID0gdGhpcy5fcGFyc2VGcm9tU2lnbmVyKGZyb21BZGRyZXNzZXMsIGNhbGxlcilcblxuICAgIGNvbnN0IGNoYW5nZTogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheUJ1ZmZlcihcbiAgICAgIGNoYW5nZUFkZHJlc3NlcyxcbiAgICAgIGNhbGxlclxuICAgIClcblxuICAgIGxldCBzcmNDaGFpbjogc3RyaW5nID0gdW5kZWZpbmVkXG5cbiAgICBpZiAodHlwZW9mIHNvdXJjZUNoYWluID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aHJvdyBuZXcgQ2hhaW5JZEVycm9yKFxuICAgICAgICBcIkVycm9yIC0gUGxhdGZvcm1WTUFQSS5idWlsZEltcG9ydFR4OiBTb3VyY2UgQ2hhaW5JRCBpcyB1bmRlZmluZWQuXCJcbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBzb3VyY2VDaGFpbiA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgc3JjQ2hhaW4gPSBzb3VyY2VDaGFpblxuICAgICAgc291cmNlQ2hhaW4gPSBiaW50b29scy5jYjU4RGVjb2RlKHNvdXJjZUNoYWluKVxuICAgIH0gZWxzZSBpZiAoIShzb3VyY2VDaGFpbiBpbnN0YW5jZW9mIEJ1ZmZlcikpIHtcbiAgICAgIHRocm93IG5ldyBDaGFpbklkRXJyb3IoXG4gICAgICAgIFwiRXJyb3IgLSBQbGF0Zm9ybVZNQVBJLmJ1aWxkSW1wb3J0VHg6IEludmFsaWQgZGVzdGluYXRpb25DaGFpbiB0eXBlOiBcIiArXG4gICAgICAgICAgdHlwZW9mIHNvdXJjZUNoYWluXG4gICAgICApXG4gICAgfVxuICAgIGNvbnN0IGF0b21pY1VUWE9zOiBVVFhPU2V0ID0gYXdhaXQgKFxuICAgICAgYXdhaXQgdGhpcy5nZXRVVFhPcyhvd25lckFkZHJlc3Nlcywgc3JjQ2hhaW4sIDAsIHVuZGVmaW5lZClcbiAgICApLnV0eG9zXG4gICAgY29uc3QgYXZheEFzc2V0SUQ6IEJ1ZmZlciA9IGF3YWl0IHRoaXMuZ2V0QVZBWEFzc2V0SUQoKVxuXG4gICAgaWYgKG1lbW8gaW5zdGFuY2VvZiBQYXlsb2FkQmFzZSkge1xuICAgICAgbWVtbyA9IG1lbW8uZ2V0UGF5bG9hZCgpXG4gICAgfVxuXG4gICAgY29uc3QgYXRvbWljczogVVRYT1tdID0gYXRvbWljVVRYT3MuZ2V0QWxsVVRYT3MoKVxuXG4gICAgY29uc3QgYnVpbHRVbnNpZ25lZFR4OiBVbnNpZ25lZFR4ID0gYXdhaXQgdGhpcy5fZ2V0QnVpbGRlcihcbiAgICAgIHV0eG9zZXRcbiAgICApLmJ1aWxkSW1wb3J0VHgoXG4gICAgICB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCksXG4gICAgICBiaW50b29scy5jYjU4RGVjb2RlKHRoaXMuYmxvY2tjaGFpbklEKSxcbiAgICAgIHRvLFxuICAgICAgZnJvbVNpZ25lcixcbiAgICAgIGNoYW5nZSxcbiAgICAgIGF0b21pY3MsXG4gICAgICBzb3VyY2VDaGFpbixcbiAgICAgIHRoaXMuZ2V0VHhGZWUoKSxcbiAgICAgIGF2YXhBc3NldElELFxuICAgICAgbWVtbyxcbiAgICAgIGFzT2YsXG4gICAgICBsb2NrdGltZSxcbiAgICAgIHRvVGhyZXNob2xkLFxuICAgICAgY2hhbmdlVGhyZXNob2xkXG4gICAgKVxuXG4gICAgaWYgKCEoYXdhaXQgdGhpcy5jaGVja0dvb3NlRWdnKGJ1aWx0VW5zaWduZWRUeCkpKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEdvb3NlRWdnQ2hlY2tFcnJvcihcIkZhaWxlZCBHb29zZSBFZ2cgQ2hlY2tcIilcbiAgICB9XG5cbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4XG4gIH1cblxuICAvKipcbiAgICogSGVscGVyIGZ1bmN0aW9uIHdoaWNoIGNyZWF0ZXMgYW4gdW5zaWduZWQgRXhwb3J0IFR4LiBGb3IgbW9yZSBncmFudWxhciBjb250cm9sLCB5b3UgbWF5IGNyZWF0ZSB5b3VyIG93blxuICAgKiBbW1Vuc2lnbmVkVHhdXSBtYW51YWxseSAod2l0aCB0aGVpciBjb3JyZXNwb25kaW5nIFtbVHJhbnNmZXJhYmxlSW5wdXRdXXMsIFtbVHJhbnNmZXJhYmxlT3V0cHV0XV1zLCBhbmQgW1tUcmFuc2Zlck9wZXJhdGlvbl1dcykuXG4gICAqXG4gICAqIEBwYXJhbSB1dHhvc2V0IEEgc2V0IG9mIFVUWE9zIHRoYXQgdGhlIHRyYW5zYWN0aW9uIGlzIGJ1aWx0IG9uXG4gICAqIEBwYXJhbSBhbW91bnQgVGhlIGFtb3VudCBiZWluZyBleHBvcnRlZCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBkZXN0aW5hdGlvbkNoYWluIFRoZSBjaGFpbmlkIGZvciB3aGVyZSB0aGUgYXNzZXRzIHdpbGwgYmUgc2VudC5cbiAgICogQHBhcmFtIHRvQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdG8gc2VuZCB0aGUgZnVuZHNcbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIHNlbmQgdGhlIGZ1bmRzIGZyb20gdGhlIFVUWE9zIHByb3ZpZGVkXG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0aGF0IGNhbiBzcGVuZCB0aGUgY2hhbmdlIHJlbWFpbmluZyBmcm9tIHRoZSBzcGVudCBVVFhPc1xuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xuICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gbG9ja3RpbWUgT3B0aW9uYWwuIFRoZSBsb2NrdGltZSBmaWVsZCBjcmVhdGVkIGluIHRoZSByZXN1bHRpbmcgb3V0cHV0c1xuICAgKiBAcGFyYW0gdG9UaHJlc2hvbGQgT3B0aW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCBVVFhPXG4gICAqIEBwYXJhbSBjaGFuZ2VUaHJlc2hvbGQgT3B0aW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCBjaGFuZ2UgVVRYT1xuICAgKlxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiAoW1tVbnNpZ25lZFR4XV0pIHdoaWNoIGNvbnRhaW5zIGFuIFtbRXhwb3J0VHhdXS5cbiAgICovXG4gIGJ1aWxkRXhwb3J0VHggPSBhc3luYyAoXG4gICAgdXR4b3NldDogVVRYT1NldCxcbiAgICBhbW91bnQ6IEJOLFxuICAgIGRlc3RpbmF0aW9uQ2hhaW46IEJ1ZmZlciB8IHN0cmluZyxcbiAgICB0b0FkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgZnJvbUFkZHJlc3NlczogRnJvbVR5cGUsXG4gICAgY2hhbmdlQWRkcmVzc2VzOiBzdHJpbmdbXSA9IHVuZGVmaW5lZCxcbiAgICBtZW1vOiBQYXlsb2FkQmFzZSB8IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBhc09mOiBCTiA9IFplcm9CTixcbiAgICBsb2NrdGltZTogQk4gPSBaZXJvQk4sXG4gICAgdG9UaHJlc2hvbGQ6IG51bWJlciA9IDEsXG4gICAgY2hhbmdlVGhyZXNob2xkOiBudW1iZXIgPSAxXG4gICk6IFByb21pc2U8VW5zaWduZWRUeD4gPT4ge1xuICAgIGNvbnN0IGNhbGxlciA9IFwiYnVpbGRFeHBvcnRUeFwiXG5cbiAgICBsZXQgcHJlZml4ZXM6IG9iamVjdCA9IHt9XG4gICAgdG9BZGRyZXNzZXMubWFwKChhOiBzdHJpbmcpOiB2b2lkID0+IHtcbiAgICAgIHByZWZpeGVzW2Euc3BsaXQoXCItXCIpWzBdXSA9IHRydWVcbiAgICB9KVxuICAgIGlmIChPYmplY3Qua2V5cyhwcmVmaXhlcykubGVuZ3RoICE9PSAxKSB7XG4gICAgICB0aHJvdyBuZXcgQWRkcmVzc0Vycm9yKFxuICAgICAgICBcIkVycm9yIC0gUGxhdGZvcm1WTUFQSS5idWlsZEV4cG9ydFR4OiBUbyBhZGRyZXNzZXMgbXVzdCBoYXZlIHRoZSBzYW1lIGNoYWluSUQgcHJlZml4LlwiXG4gICAgICApXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBkZXN0aW5hdGlvbkNoYWluID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aHJvdyBuZXcgQ2hhaW5JZEVycm9yKFxuICAgICAgICBcIkVycm9yIC0gUGxhdGZvcm1WTUFQSS5idWlsZEV4cG9ydFR4OiBEZXN0aW5hdGlvbiBDaGFpbklEIGlzIHVuZGVmaW5lZC5cIlxuICAgICAgKVxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGRlc3RpbmF0aW9uQ2hhaW4gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIGRlc3RpbmF0aW9uQ2hhaW4gPSBiaW50b29scy5jYjU4RGVjb2RlKGRlc3RpbmF0aW9uQ2hhaW4pIC8vXG4gICAgfSBlbHNlIGlmICghKGRlc3RpbmF0aW9uQ2hhaW4gaW5zdGFuY2VvZiBCdWZmZXIpKSB7XG4gICAgICB0aHJvdyBuZXcgQ2hhaW5JZEVycm9yKFxuICAgICAgICBcIkVycm9yIC0gUGxhdGZvcm1WTUFQSS5idWlsZEV4cG9ydFR4OiBJbnZhbGlkIGRlc3RpbmF0aW9uQ2hhaW4gdHlwZTogXCIgK1xuICAgICAgICAgIHR5cGVvZiBkZXN0aW5hdGlvbkNoYWluXG4gICAgICApXG4gICAgfVxuICAgIGlmIChkZXN0aW5hdGlvbkNoYWluLmxlbmd0aCAhPT0gMzIpIHtcbiAgICAgIHRocm93IG5ldyBDaGFpbklkRXJyb3IoXG4gICAgICAgIFwiRXJyb3IgLSBQbGF0Zm9ybVZNQVBJLmJ1aWxkRXhwb3J0VHg6IERlc3RpbmF0aW9uIENoYWluSUQgbXVzdCBiZSAzMiBieXRlcyBpbiBsZW5ndGguXCJcbiAgICAgIClcbiAgICB9XG5cbiAgICBsZXQgdG86IEJ1ZmZlcltdID0gW11cbiAgICB0b0FkZHJlc3Nlcy5tYXAoKGE6IHN0cmluZyk6IHZvaWQgPT4ge1xuICAgICAgdG8ucHVzaChiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpXG4gICAgfSlcblxuICAgIGNvbnN0IGZyb21TaWduZXIgPSB0aGlzLl9wYXJzZUZyb21TaWduZXIoZnJvbUFkZHJlc3NlcywgY2FsbGVyKVxuXG4gICAgY29uc3QgY2hhbmdlOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5QnVmZmVyKFxuICAgICAgY2hhbmdlQWRkcmVzc2VzLFxuICAgICAgY2FsbGVyXG4gICAgKVxuXG4gICAgaWYgKG1lbW8gaW5zdGFuY2VvZiBQYXlsb2FkQmFzZSkge1xuICAgICAgbWVtbyA9IG1lbW8uZ2V0UGF5bG9hZCgpXG4gICAgfVxuXG4gICAgY29uc3QgYXZheEFzc2V0SUQ6IEJ1ZmZlciA9IGF3YWl0IHRoaXMuZ2V0QVZBWEFzc2V0SUQoKVxuXG4gICAgY29uc3QgYnVpbHRVbnNpZ25lZFR4OiBVbnNpZ25lZFR4ID0gYXdhaXQgdGhpcy5fZ2V0QnVpbGRlcihcbiAgICAgIHV0eG9zZXRcbiAgICApLmJ1aWxkRXhwb3J0VHgoXG4gICAgICB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCksXG4gICAgICBiaW50b29scy5jYjU4RGVjb2RlKHRoaXMuYmxvY2tjaGFpbklEKSxcbiAgICAgIGFtb3VudCxcbiAgICAgIGF2YXhBc3NldElELFxuICAgICAgdG8sXG4gICAgICBmcm9tU2lnbmVyLFxuICAgICAgZGVzdGluYXRpb25DaGFpbixcbiAgICAgIGNoYW5nZSxcbiAgICAgIHRoaXMuZ2V0VHhGZWUoKSxcbiAgICAgIGF2YXhBc3NldElELFxuICAgICAgbWVtbyxcbiAgICAgIGFzT2YsXG4gICAgICBsb2NrdGltZSxcbiAgICAgIHRvVGhyZXNob2xkLFxuICAgICAgY2hhbmdlVGhyZXNob2xkXG4gICAgKVxuXG4gICAgaWYgKCEoYXdhaXQgdGhpcy5jaGVja0dvb3NlRWdnKGJ1aWx0VW5zaWduZWRUeCkpKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEdvb3NlRWdnQ2hlY2tFcnJvcihcIkZhaWxlZCBHb29zZSBFZ2cgQ2hlY2tcIilcbiAgICB9XG5cbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4XG4gIH1cblxuICAvKipcbiAgICogSGVscGVyIGZ1bmN0aW9uIHdoaWNoIGNyZWF0ZXMgYW4gdW5zaWduZWQgW1tBZGRTdWJuZXRWYWxpZGF0b3JUeF1dLiBGb3IgbW9yZSBncmFudWxhciBjb250cm9sLCB5b3UgbWF5IGNyZWF0ZSB5b3VyIG93blxuICAgKiBbW1Vuc2lnbmVkVHhdXSBtYW51YWxseSBhbmQgaW1wb3J0IHRoZSBbW0FkZFN1Ym5ldFZhbGlkYXRvclR4XV0gY2xhc3MgZGlyZWN0bHkuXG4gICAqXG4gICAqIEBwYXJhbSB1dHhvc2V0IEEgc2V0IG9mIFVUWE9zIHRoYXQgdGhlIHRyYW5zYWN0aW9uIGlzIGJ1aWx0IG9uLlxuICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBBbiBhcnJheSBvZiBhZGRyZXNzZXMgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2hvIHBheXMgdGhlIGZlZXMgaW4gQVZBWFxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB3aG8gZ2V0cyB0aGUgY2hhbmdlIGxlZnRvdmVyIGZyb20gdGhlIGZlZSBwYXltZW50XG4gICAqIEBwYXJhbSBub2RlSUQgVGhlIG5vZGUgSUQgb2YgdGhlIHZhbGlkYXRvciBiZWluZyBhZGRlZC5cbiAgICogQHBhcmFtIHN0YXJ0VGltZSBUaGUgVW5peCB0aW1lIHdoZW4gdGhlIHZhbGlkYXRvciBzdGFydHMgdmFsaWRhdGluZyB0aGUgUHJpbWFyeSBOZXR3b3JrLlxuICAgKiBAcGFyYW0gZW5kVGltZSBUaGUgVW5peCB0aW1lIHdoZW4gdGhlIHZhbGlkYXRvciBzdG9wcyB2YWxpZGF0aW5nIHRoZSBQcmltYXJ5IE5ldHdvcmsgKGFuZCBzdGFrZWQgQVZBWCBpcyByZXR1cm5lZCkuXG4gICAqIEBwYXJhbSB3ZWlnaHQgVGhlIGFtb3VudCBvZiB3ZWlnaHQgZm9yIHRoaXMgc3VibmV0IHZhbGlkYXRvci5cbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIHN1Ym5ldEF1dGggT3B0aW9uYWwuIEFuIEF1dGggc3RydWN0IHdoaWNoIGNvbnRhaW5zIHRoZSBzdWJuZXQgQXV0aCBhbmQgdGhlIHNpZ25lcnMuXG4gICAqIEBwYXJhbSBjaGFuZ2VUaHJlc2hvbGQgT3B0aW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCBjaGFuZ2UgVVRYT1xuICAgKlxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiBjcmVhdGVkIGZyb20gdGhlIHBhc3NlZCBpbiBwYXJhbWV0ZXJzLlxuICAgKi9cblxuICBidWlsZEFkZFN1Ym5ldFZhbGlkYXRvclR4ID0gYXN5bmMgKFxuICAgIHV0eG9zZXQ6IFVUWE9TZXQsXG4gICAgZnJvbUFkZHJlc3NlczogRnJvbVR5cGUsXG4gICAgY2hhbmdlQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICBub2RlSUQ6IHN0cmluZyxcbiAgICBzdGFydFRpbWU6IEJOLFxuICAgIGVuZFRpbWU6IEJOLFxuICAgIHdlaWdodDogQk4sXG4gICAgc3VibmV0SUQ6IHN0cmluZyxcbiAgICBtZW1vOiBQYXlsb2FkQmFzZSB8IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBhc09mOiBCTiA9IFplcm9CTixcbiAgICBzdWJuZXRBdXRoOiBBdXRoID0geyBhZGRyZXNzZXM6IFtdLCB0aHJlc2hvbGQ6IDAsIHNpZ25lcjogW10gfSxcbiAgICBjaGFuZ2VUaHJlc2hvbGQ6IG51bWJlciA9IDFcbiAgKTogUHJvbWlzZTxVbnNpZ25lZFR4PiA9PiB7XG4gICAgY29uc3QgY2FsbGVyID0gXCJidWlsZEFkZFN1Ym5ldFZhbGlkYXRvclR4XCJcblxuICAgIGNvbnN0IGZyb21TaWduZXIgPSB0aGlzLl9wYXJzZUZyb21TaWduZXIoZnJvbUFkZHJlc3NlcywgY2FsbGVyKVxuXG4gICAgY29uc3QgY2hhbmdlOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5QnVmZmVyKFxuICAgICAgY2hhbmdlQWRkcmVzc2VzLFxuICAgICAgY2FsbGVyXG4gICAgKVxuXG4gICAgaWYgKG1lbW8gaW5zdGFuY2VvZiBQYXlsb2FkQmFzZSkge1xuICAgICAgbWVtbyA9IG1lbW8uZ2V0UGF5bG9hZCgpXG4gICAgfVxuXG4gICAgY29uc3QgYXZheEFzc2V0SUQ6IEJ1ZmZlciA9IGF3YWl0IHRoaXMuZ2V0QVZBWEFzc2V0SUQoKVxuXG4gICAgY29uc3Qgbm93OiBCTiA9IFVuaXhOb3coKVxuICAgIGlmIChzdGFydFRpbWUubHQobm93KSB8fCBlbmRUaW1lLmx0ZShzdGFydFRpbWUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIFwiUGxhdGZvcm1WTUFQSS5idWlsZEFkZFN1Ym5ldFZhbGlkYXRvclR4IC0tIHN0YXJ0VGltZSBtdXN0IGJlIGluIHRoZSBmdXR1cmUgYW5kIGVuZFRpbWUgbXVzdCBjb21lIGFmdGVyIHN0YXJ0VGltZVwiXG4gICAgICApXG4gICAgfVxuXG4gICAgY29uc3QgYnVpbHRVbnNpZ25lZFR4OiBVbnNpZ25lZFR4ID0gYXdhaXQgdGhpcy5fZ2V0QnVpbGRlcihcbiAgICAgIHV0eG9zZXRcbiAgICApLmJ1aWxkQWRkU3VibmV0VmFsaWRhdG9yVHgoXG4gICAgICB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCksXG4gICAgICBiaW50b29scy5jYjU4RGVjb2RlKHRoaXMuYmxvY2tjaGFpbklEKSxcbiAgICAgIGZyb21TaWduZXIsXG4gICAgICBjaGFuZ2UsXG4gICAgICBOb2RlSURTdHJpbmdUb0J1ZmZlcihub2RlSUQpLFxuICAgICAgc3RhcnRUaW1lLFxuICAgICAgZW5kVGltZSxcbiAgICAgIHdlaWdodCxcbiAgICAgIHN1Ym5ldElELFxuICAgICAgdGhpcy5nZXREZWZhdWx0VHhGZWUoKSxcbiAgICAgIGF2YXhBc3NldElELFxuICAgICAgbWVtbyxcbiAgICAgIGFzT2YsXG4gICAgICBzdWJuZXRBdXRoLFxuICAgICAgY2hhbmdlVGhyZXNob2xkXG4gICAgKVxuXG4gICAgaWYgKCEoYXdhaXQgdGhpcy5jaGVja0dvb3NlRWdnKGJ1aWx0VW5zaWduZWRUeCkpKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRmFpbGVkIEdvb3NlIEVnZyBDaGVja1wiKVxuICAgIH1cblxuICAgIHJldHVybiBidWlsdFVuc2lnbmVkVHhcbiAgfVxuXG4gIC8qKlxuICAgKiBIZWxwZXIgZnVuY3Rpb24gd2hpY2ggY3JlYXRlcyBhbiB1bnNpZ25lZCBbW0FkZERlbGVnYXRvclR4XV0uIEZvciBtb3JlIGdyYW51bGFyIGNvbnRyb2wsIHlvdSBtYXkgY3JlYXRlIHlvdXIgb3duXG4gICAqIFtbVW5zaWduZWRUeF1dIG1hbnVhbGx5IGFuZCBpbXBvcnQgdGhlIFtbQWRkRGVsZWdhdG9yVHhdXSBjbGFzcyBkaXJlY3RseS5cbiAgICpcbiAgICogQHBhcmFtIHV0eG9zZXQgQSBzZXQgb2YgVVRYT3MgdGhhdCB0aGUgdHJhbnNhY3Rpb24gaXMgYnVpbHQgb25cbiAgICogQHBhcmFtIHRvQWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB3aG8gcmVjZWl2ZWQgdGhlIHN0YWtlZCB0b2tlbnMgYXQgdGhlIGVuZCBvZiB0aGUgc3Rha2luZyBwZXJpb2RcbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHdobyBvd24gdGhlIHN0YWtpbmcgVVRYT3MgdGhlIGZlZXMgaW4gQVZBWFxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB3aG8gZ2V0cyB0aGUgY2hhbmdlIGxlZnRvdmVyIGZyb20gdGhlIGZlZSBwYXltZW50XG4gICAqIEBwYXJhbSBub2RlSUQgVGhlIG5vZGUgSUQgb2YgdGhlIHZhbGlkYXRvciBiZWluZyBhZGRlZC5cbiAgICogQHBhcmFtIHN0YXJ0VGltZSBUaGUgVW5peCB0aW1lIHdoZW4gdGhlIHZhbGlkYXRvciBzdGFydHMgdmFsaWRhdGluZyB0aGUgUHJpbWFyeSBOZXR3b3JrLlxuICAgKiBAcGFyYW0gZW5kVGltZSBUaGUgVW5peCB0aW1lIHdoZW4gdGhlIHZhbGlkYXRvciBzdG9wcyB2YWxpZGF0aW5nIHRoZSBQcmltYXJ5IE5ldHdvcmsgKGFuZCBzdGFrZWQgQVZBWCBpcyByZXR1cm5lZCkuXG4gICAqIEBwYXJhbSBzdGFrZUFtb3VudCBUaGUgYW1vdW50IGJlaW5nIGRlbGVnYXRlZCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSByZXdhcmRBZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB3aGljaCB3aWxsIHJlY2lldmUgdGhlIHJld2FyZHMgZnJvbSB0aGUgZGVsZWdhdGVkIHN0YWtlLlxuICAgKiBAcGFyYW0gcmV3YXJkTG9ja3RpbWUgT3B0aW9uYWwuIFRoZSBsb2NrdGltZSBmaWVsZCBjcmVhdGVkIGluIHRoZSByZXN1bHRpbmcgcmV3YXJkIG91dHB1dHNcbiAgICogQHBhcmFtIHJld2FyZFRocmVzaG9sZCBPcGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgcmV3YXJkIFVUWE8uIERlZmF1bHQgMS5cbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIHRvVGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgVVRYT1xuICAgKiBAcGFyYW0gY2hhbmdlVGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgY2hhbmdlIFVUWE9cbiAgICpcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gY3JlYXRlZCBmcm9tIHRoZSBwYXNzZWQgaW4gcGFyYW1ldGVycy5cbiAgICovXG4gIGJ1aWxkQWRkRGVsZWdhdG9yVHggPSBhc3luYyAoXG4gICAgdXR4b3NldDogVVRYT1NldCxcbiAgICB0b0FkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgZnJvbUFkZHJlc3NlczogRnJvbVR5cGUsXG4gICAgY2hhbmdlQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICBub2RlSUQ6IHN0cmluZyxcbiAgICBzdGFydFRpbWU6IEJOLFxuICAgIGVuZFRpbWU6IEJOLFxuICAgIHN0YWtlQW1vdW50OiBCTixcbiAgICByZXdhcmRBZGRyZXNzZXM6IHN0cmluZ1tdLFxuICAgIHJld2FyZExvY2t0aW1lOiBCTiA9IFplcm9CTixcbiAgICByZXdhcmRUaHJlc2hvbGQ6IG51bWJlciA9IDEsXG4gICAgbWVtbzogUGF5bG9hZEJhc2UgfCBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgYXNPZjogQk4gPSBaZXJvQk4sXG4gICAgdG9UaHJlc2hvbGQ6IG51bWJlciA9IDEsXG4gICAgY2hhbmdlVGhyZXNob2xkOiBudW1iZXIgPSAxXG4gICk6IFByb21pc2U8VW5zaWduZWRUeD4gPT4ge1xuICAgIGNvbnN0IGNhbGxlciA9IFwiYnVpbGRBZGREZWxlZ2F0b3JUeFwiXG4gICAgY29uc3QgdG86IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXlCdWZmZXIodG9BZGRyZXNzZXMsIGNhbGxlcilcblxuICAgIGNvbnN0IGZyb21TaWduZXIgPSB0aGlzLl9wYXJzZUZyb21TaWduZXIoZnJvbUFkZHJlc3NlcywgY2FsbGVyKVxuXG4gICAgY29uc3QgY2hhbmdlOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5QnVmZmVyKFxuICAgICAgY2hhbmdlQWRkcmVzc2VzLFxuICAgICAgY2FsbGVyXG4gICAgKVxuICAgIGNvbnN0IHJld2FyZHM6IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXlCdWZmZXIoXG4gICAgICByZXdhcmRBZGRyZXNzZXMsXG4gICAgICBjYWxsZXJcbiAgICApXG5cbiAgICBpZiAobWVtbyBpbnN0YW5jZW9mIFBheWxvYWRCYXNlKSB7XG4gICAgICBtZW1vID0gbWVtby5nZXRQYXlsb2FkKClcbiAgICB9XG5cbiAgICBjb25zdCBtaW5TdGFrZTogQk4gPSAoYXdhaXQgdGhpcy5nZXRNaW5TdGFrZSgpKVtcIm1pbkRlbGVnYXRvclN0YWtlXCJdXG4gICAgaWYgKHN0YWtlQW1vdW50Lmx0KG1pblN0YWtlKSkge1xuICAgICAgdGhyb3cgbmV3IFN0YWtlRXJyb3IoXG4gICAgICAgIFwiUGxhdGZvcm1WTUFQSS5idWlsZEFkZERlbGVnYXRvclR4IC0tIHN0YWtlIGFtb3VudCBtdXN0IGJlIGF0IGxlYXN0IFwiICtcbiAgICAgICAgICBtaW5TdGFrZS50b1N0cmluZygxMClcbiAgICAgIClcbiAgICB9XG5cbiAgICBjb25zdCBhdmF4QXNzZXRJRDogQnVmZmVyID0gYXdhaXQgdGhpcy5nZXRBVkFYQXNzZXRJRCgpXG5cbiAgICBjb25zdCBub3c6IEJOID0gVW5peE5vdygpXG4gICAgaWYgKHN0YXJ0VGltZS5sdChub3cpIHx8IGVuZFRpbWUubHRlKHN0YXJ0VGltZSkpIHtcbiAgICAgIHRocm93IG5ldyBUaW1lRXJyb3IoXG4gICAgICAgIFwiUGxhdGZvcm1WTUFQSS5idWlsZEFkZERlbGVnYXRvclR4IC0tIHN0YXJ0VGltZSBtdXN0IGJlIGluIHRoZSBmdXR1cmUgYW5kIGVuZFRpbWUgbXVzdCBjb21lIGFmdGVyIHN0YXJ0VGltZVwiXG4gICAgICApXG4gICAgfVxuXG4gICAgaWYgKHRoaXMuY29yZS5nZXROZXR3b3JrKCkuUC5sb2NrTW9kZUJvbmREZXBvc2l0KSB7XG4gICAgICB0aHJvdyBuZXcgVVRYT0Vycm9yKFxuICAgICAgICBcIlBsYXRmb3JtVk1BUEkuYnVpbGRBZGREZWxlZ2F0b3JUeCAtLSBub3Qgc3VwcG9ydGVkIGluIGxvY2ttb2RlQm9uZERlcG9zaXRcIlxuICAgICAgKVxuICAgIH1cblxuICAgIGNvbnN0IGJ1aWx0VW5zaWduZWRUeDogVW5zaWduZWRUeCA9IGF3YWl0IHRoaXMuX2dldEJ1aWxkZXIoXG4gICAgICB1dHhvc2V0XG4gICAgKS5idWlsZEFkZERlbGVnYXRvclR4KFxuICAgICAgdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpLFxuICAgICAgYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRCksXG4gICAgICBhdmF4QXNzZXRJRCxcbiAgICAgIHRvLFxuICAgICAgZnJvbVNpZ25lcixcbiAgICAgIGNoYW5nZSxcbiAgICAgIE5vZGVJRFN0cmluZ1RvQnVmZmVyKG5vZGVJRCksXG4gICAgICBzdGFydFRpbWUsXG4gICAgICBlbmRUaW1lLFxuICAgICAgc3Rha2VBbW91bnQsXG4gICAgICByZXdhcmRMb2NrdGltZSxcbiAgICAgIHJld2FyZFRocmVzaG9sZCxcbiAgICAgIHJld2FyZHMsXG4gICAgICBaZXJvQk4sXG4gICAgICBhdmF4QXNzZXRJRCxcbiAgICAgIG1lbW8sXG4gICAgICBhc09mLFxuICAgICAgdG9UaHJlc2hvbGQsXG4gICAgICBjaGFuZ2VUaHJlc2hvbGRcbiAgICApXG5cbiAgICBpZiAoIShhd2FpdCB0aGlzLmNoZWNrR29vc2VFZ2coYnVpbHRVbnNpZ25lZFR4KSkpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgR29vc2VFZ2dDaGVja0Vycm9yKFwiRmFpbGVkIEdvb3NlIEVnZyBDaGVja1wiKVxuICAgIH1cblxuICAgIHJldHVybiBidWlsdFVuc2lnbmVkVHhcbiAgfVxuXG4gIC8qKlxuICAgKiBIZWxwZXIgZnVuY3Rpb24gd2hpY2ggY3JlYXRlcyBhbiB1bnNpZ25lZCBbW0FkZFZhbGlkYXRvclR4XV0uIEZvciBtb3JlIGdyYW51bGFyIGNvbnRyb2wsIHlvdSBtYXkgY3JlYXRlIHlvdXIgb3duXG4gICAqIFtbVW5zaWduZWRUeF1dIG1hbnVhbGx5IGFuZCBpbXBvcnQgdGhlIFtbQWRkVmFsaWRhdG9yVHhdXSBjbGFzcyBkaXJlY3RseS5cbiAgICpcbiAgICogQHBhcmFtIHV0eG9zZXQgQSBzZXQgb2YgVVRYT3MgdGhhdCB0aGUgdHJhbnNhY3Rpb24gaXMgYnVpbHQgb25cbiAgICogQHBhcmFtIHRvQWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB3aG8gcmVjZWl2ZWQgdGhlIHN0YWtlZCB0b2tlbnMgYXQgdGhlIGVuZCBvZiB0aGUgc3Rha2luZyBwZXJpb2RcbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHdobyBvd24gdGhlIHN0YWtpbmcgVVRYT3MgdGhlIGZlZXMgaW4gQVZBWFxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB3aG8gZ2V0cyB0aGUgY2hhbmdlIGxlZnRvdmVyIGZyb20gdGhlIGZlZSBwYXltZW50XG4gICAqIEBwYXJhbSBub2RlSUQgVGhlIG5vZGUgSUQgb2YgdGhlIHZhbGlkYXRvciBiZWluZyBhZGRlZC5cbiAgICogQHBhcmFtIHN0YXJ0VGltZSBUaGUgVW5peCB0aW1lIHdoZW4gdGhlIHZhbGlkYXRvciBzdGFydHMgdmFsaWRhdGluZyB0aGUgUHJpbWFyeSBOZXR3b3JrLlxuICAgKiBAcGFyYW0gZW5kVGltZSBUaGUgVW5peCB0aW1lIHdoZW4gdGhlIHZhbGlkYXRvciBzdG9wcyB2YWxpZGF0aW5nIHRoZSBQcmltYXJ5IE5ldHdvcmsgKGFuZCBzdGFrZWQgQVZBWCBpcyByZXR1cm5lZCkuXG4gICAqIEBwYXJhbSBzdGFrZUFtb3VudCBUaGUgYW1vdW50IGJlaW5nIGRlbGVnYXRlZCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSByZXdhcmRBZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB3aGljaCB3aWxsIHJlY2lldmUgdGhlIHJld2FyZHMgZnJvbSB0aGUgZGVsZWdhdGVkIHN0YWtlLlxuICAgKiBAcGFyYW0gZGVsZWdhdGlvbkZlZSBBIG51bWJlciBmb3IgdGhlIHBlcmNlbnRhZ2Ugb2YgcmV3YXJkIHRvIGJlIGdpdmVuIHRvIHRoZSB2YWxpZGF0b3Igd2hlbiBzb21lb25lIGRlbGVnYXRlcyB0byB0aGVtLiBNdXN0IGJlIGJldHdlZW4gMCBhbmQgMTAwLlxuICAgKiBAcGFyYW0gcmV3YXJkTG9ja3RpbWUgT3B0aW9uYWwuIFRoZSBsb2NrdGltZSBmaWVsZCBjcmVhdGVkIGluIHRoZSByZXN1bHRpbmcgcmV3YXJkIG91dHB1dHNcbiAgICogQHBhcmFtIHJld2FyZFRocmVzaG9sZCBPcGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgcmV3YXJkIFVUWE8uIERlZmF1bHQgMS5cbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIHRvVGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgVVRYT1xuICAgKiBAcGFyYW0gY2hhbmdlVGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgY2hhbmdlIFVUWE9cbiAgICpcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gY3JlYXRlZCBmcm9tIHRoZSBwYXNzZWQgaW4gcGFyYW1ldGVycy5cbiAgICovXG4gIGJ1aWxkQWRkVmFsaWRhdG9yVHggPSBhc3luYyAoXG4gICAgdXR4b3NldDogVVRYT1NldCxcbiAgICB0b0FkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgZnJvbUFkZHJlc3NlczogRnJvbVR5cGUsXG4gICAgY2hhbmdlQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICBub2RlSUQ6IHN0cmluZyxcbiAgICBzdGFydFRpbWU6IEJOLFxuICAgIGVuZFRpbWU6IEJOLFxuICAgIHN0YWtlQW1vdW50OiBCTixcbiAgICByZXdhcmRBZGRyZXNzZXM6IHN0cmluZ1tdLFxuICAgIGRlbGVnYXRpb25GZWU6IG51bWJlcixcbiAgICByZXdhcmRMb2NrdGltZTogQk4gPSBaZXJvQk4sXG4gICAgcmV3YXJkVGhyZXNob2xkOiBudW1iZXIgPSAxLFxuICAgIG1lbW86IFBheWxvYWRCYXNlIHwgQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGFzT2Y6IEJOID0gWmVyb0JOLFxuICAgIHRvVGhyZXNob2xkOiBudW1iZXIgPSAxLFxuICAgIGNoYW5nZVRocmVzaG9sZDogbnVtYmVyID0gMVxuICApOiBQcm9taXNlPFVuc2lnbmVkVHg+ID0+IHtcbiAgICBjb25zdCBjYWxsZXIgPSBcImJ1aWxkQWRkVmFsaWRhdG9yVHhcIlxuXG4gICAgY29uc3QgdG86IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXlCdWZmZXIodG9BZGRyZXNzZXMsIGNhbGxlcilcblxuICAgIGNvbnN0IGZyb21TaWduZXIgPSB0aGlzLl9wYXJzZUZyb21TaWduZXIoZnJvbUFkZHJlc3NlcywgY2FsbGVyKVxuXG4gICAgY29uc3QgY2hhbmdlOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5QnVmZmVyKFxuICAgICAgY2hhbmdlQWRkcmVzc2VzLFxuICAgICAgY2FsbGVyXG4gICAgKVxuICAgIGNvbnN0IHJld2FyZHM6IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXlCdWZmZXIoXG4gICAgICByZXdhcmRBZGRyZXNzZXMsXG4gICAgICBjYWxsZXJcbiAgICApXG5cbiAgICBpZiAobWVtbyBpbnN0YW5jZW9mIFBheWxvYWRCYXNlKSB7XG4gICAgICBtZW1vID0gbWVtby5nZXRQYXlsb2FkKClcbiAgICB9XG5cbiAgICBjb25zdCBtaW5TdGFrZTogQk4gPSAoYXdhaXQgdGhpcy5nZXRNaW5TdGFrZSgpKVtcIm1pblZhbGlkYXRvclN0YWtlXCJdXG4gICAgaWYgKHN0YWtlQW1vdW50Lmx0KG1pblN0YWtlKSkge1xuICAgICAgdGhyb3cgbmV3IFN0YWtlRXJyb3IoXG4gICAgICAgIFwiUGxhdGZvcm1WTUFQSS5idWlsZEFkZFZhbGlkYXRvclR4IC0tIHN0YWtlIGFtb3VudCBtdXN0IGJlIGF0IGxlYXN0IFwiICtcbiAgICAgICAgICBtaW5TdGFrZS50b1N0cmluZygxMClcbiAgICAgIClcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICB0eXBlb2YgZGVsZWdhdGlvbkZlZSAhPT0gXCJudW1iZXJcIiB8fFxuICAgICAgZGVsZWdhdGlvbkZlZSA+IDEwMCB8fFxuICAgICAgZGVsZWdhdGlvbkZlZSA8IDBcbiAgICApIHtcbiAgICAgIHRocm93IG5ldyBEZWxlZ2F0aW9uRmVlRXJyb3IoXG4gICAgICAgIFwiUGxhdGZvcm1WTUFQSS5idWlsZEFkZFZhbGlkYXRvclR4IC0tIGRlbGVnYXRpb25GZWUgbXVzdCBiZSBhIG51bWJlciBiZXR3ZWVuIDAgYW5kIDEwMFwiXG4gICAgICApXG4gICAgfVxuXG4gICAgY29uc3QgYXZheEFzc2V0SUQ6IEJ1ZmZlciA9IGF3YWl0IHRoaXMuZ2V0QVZBWEFzc2V0SUQoKVxuXG4gICAgY29uc3Qgbm93OiBCTiA9IFVuaXhOb3coKVxuICAgIGlmIChzdGFydFRpbWUubHQobm93KSB8fCBlbmRUaW1lLmx0ZShzdGFydFRpbWUpKSB7XG4gICAgICB0aHJvdyBuZXcgVGltZUVycm9yKFxuICAgICAgICBcIlBsYXRmb3JtVk1BUEkuYnVpbGRBZGRWYWxpZGF0b3JUeCAtLSBzdGFydFRpbWUgbXVzdCBiZSBpbiB0aGUgZnV0dXJlIGFuZCBlbmRUaW1lIG11c3QgY29tZSBhZnRlciBzdGFydFRpbWVcIlxuICAgICAgKVxuICAgIH1cblxuICAgIGNvbnN0IGJ1aWx0VW5zaWduZWRUeDogVW5zaWduZWRUeCA9IGF3YWl0IHRoaXMuX2dldEJ1aWxkZXIoXG4gICAgICB1dHhvc2V0XG4gICAgKS5idWlsZEFkZFZhbGlkYXRvclR4KFxuICAgICAgdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpLFxuICAgICAgYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRCksXG4gICAgICB0byxcbiAgICAgIGZyb21TaWduZXIsXG4gICAgICBjaGFuZ2UsXG4gICAgICBOb2RlSURTdHJpbmdUb0J1ZmZlcihub2RlSUQpLFxuICAgICAgc3RhcnRUaW1lLFxuICAgICAgZW5kVGltZSxcbiAgICAgIHN0YWtlQW1vdW50LFxuICAgICAgYXZheEFzc2V0SUQsXG4gICAgICByZXdhcmRMb2NrdGltZSxcbiAgICAgIHJld2FyZFRocmVzaG9sZCxcbiAgICAgIHJld2FyZHMsXG4gICAgICBkZWxlZ2F0aW9uRmVlLFxuICAgICAgWmVyb0JOLFxuICAgICAgYXZheEFzc2V0SUQsXG4gICAgICBtZW1vLFxuICAgICAgYXNPZixcbiAgICAgIHRvVGhyZXNob2xkLFxuICAgICAgY2hhbmdlVGhyZXNob2xkXG4gICAgKVxuXG4gICAgaWYgKCEoYXdhaXQgdGhpcy5jaGVja0dvb3NlRWdnKGJ1aWx0VW5zaWduZWRUeCkpKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEdvb3NlRWdnQ2hlY2tFcnJvcihcIkZhaWxlZCBHb29zZSBFZ2cgQ2hlY2tcIilcbiAgICB9XG5cbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4XG4gIH1cblxuICAvKipcbiAgICogQ2xhc3MgcmVwcmVzZW50aW5nIGFuIHVuc2lnbmVkIFtbQ3JlYXRlU3VibmV0VHhdXSB0cmFuc2FjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHV0eG9zZXQgQSBzZXQgb2YgVVRYT3MgdGhhdCB0aGUgdHJhbnNhY3Rpb24gaXMgYnVpbHQgb25cbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIHNlbmQgdGhlIGZ1bmRzIGZyb20gdGhlIFVUWE9zIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0aGF0IGNhbiBzcGVuZCB0aGUgY2hhbmdlIHJlbWFpbmluZyBmcm9tIHRoZSBzcGVudCBVVFhPc1xuICAgKiBAcGFyYW0gc3VibmV0T3duZXJBZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGZvciBvd25lcnMgb2YgdGhlIG5ldyBzdWJuZXRcbiAgICogQHBhcmFtIHN1Ym5ldE93bmVyVGhyZXNob2xkIEEgbnVtYmVyIGluZGljYXRpbmcgdGhlIGFtb3VudCBvZiBzaWduYXR1cmVzIHJlcXVpcmVkIHRvIGFkZCB2YWxpZGF0b3JzIHRvIGEgc3VibmV0XG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBjaGFuZ2VUaHJlc2hvbGQgT3B0aW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCBjaGFuZ2UgVVRYT1xuICAgKlxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiBjcmVhdGVkIGZyb20gdGhlIHBhc3NlZCBpbiBwYXJhbWV0ZXJzLlxuICAgKi9cbiAgYnVpbGRDcmVhdGVTdWJuZXRUeCA9IGFzeW5jIChcbiAgICB1dHhvc2V0OiBVVFhPU2V0LFxuICAgIGZyb21BZGRyZXNzZXM6IEZyb21UeXBlLFxuICAgIGNoYW5nZUFkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgc3VibmV0T3duZXJBZGRyZXNzZXM6IHN0cmluZ1tdLFxuICAgIHN1Ym5ldE93bmVyVGhyZXNob2xkOiBudW1iZXIsXG4gICAgbWVtbzogUGF5bG9hZEJhc2UgfCBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgYXNPZjogQk4gPSBaZXJvQk4sXG4gICAgY2hhbmdlVGhyZXNob2xkOiBudW1iZXIgPSAxXG4gICk6IFByb21pc2U8VW5zaWduZWRUeD4gPT4ge1xuICAgIGNvbnN0IGNhbGxlciA9IFwiYnVpbGRDcmVhdGVTdWJuZXRUeFwiXG5cbiAgICBjb25zdCBmcm9tU2lnbmVyID0gdGhpcy5fcGFyc2VGcm9tU2lnbmVyKGZyb21BZGRyZXNzZXMsIGNhbGxlcilcblxuICAgIGNvbnN0IGNoYW5nZTogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheUJ1ZmZlcihcbiAgICAgIGNoYW5nZUFkZHJlc3NlcyxcbiAgICAgIGNhbGxlclxuICAgIClcbiAgICBjb25zdCBvd25lcnM6IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXlCdWZmZXIoXG4gICAgICBzdWJuZXRPd25lckFkZHJlc3NlcyxcbiAgICAgIGNhbGxlclxuICAgIClcblxuICAgIGlmIChtZW1vIGluc3RhbmNlb2YgUGF5bG9hZEJhc2UpIHtcbiAgICAgIG1lbW8gPSBtZW1vLmdldFBheWxvYWQoKVxuICAgIH1cblxuICAgIGNvbnN0IGF2YXhBc3NldElEOiBCdWZmZXIgPSBhd2FpdCB0aGlzLmdldEFWQVhBc3NldElEKClcbiAgICBjb25zdCBuZXR3b3JrSUQ6IG51bWJlciA9IHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKVxuICAgIGNvbnN0IGJsb2NrY2hhaW5JRDogQnVmZmVyID0gYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRClcbiAgICBjb25zdCBmZWU6IEJOID0gdGhpcy5nZXRDcmVhdGVTdWJuZXRUeEZlZSgpXG5cbiAgICBjb25zdCBidWlsdFVuc2lnbmVkVHg6IFVuc2lnbmVkVHggPSBhd2FpdCB0aGlzLl9nZXRCdWlsZGVyKFxuICAgICAgdXR4b3NldFxuICAgICkuYnVpbGRDcmVhdGVTdWJuZXRUeChcbiAgICAgIG5ldHdvcmtJRCxcbiAgICAgIGJsb2NrY2hhaW5JRCxcbiAgICAgIGZyb21TaWduZXIsXG4gICAgICBjaGFuZ2UsXG4gICAgICBvd25lcnMsXG4gICAgICBzdWJuZXRPd25lclRocmVzaG9sZCxcbiAgICAgIGZlZSxcbiAgICAgIGF2YXhBc3NldElELFxuICAgICAgbWVtbyxcbiAgICAgIGFzT2YsXG4gICAgICBjaGFuZ2VUaHJlc2hvbGRcbiAgICApXG5cbiAgICBpZiAoIShhd2FpdCB0aGlzLmNoZWNrR29vc2VFZ2coYnVpbHRVbnNpZ25lZFR4LCB0aGlzLmdldENyZWF0aW9uVHhGZWUoKSkpKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEdvb3NlRWdnQ2hlY2tFcnJvcihcIkZhaWxlZCBHb29zZSBFZ2cgQ2hlY2tcIilcbiAgICB9XG5cbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4XG4gIH1cblxuICAvKipcbiAgICogQnVpbGQgYW4gdW5zaWduZWQgW1tDcmVhdGVDaGFpblR4XV0uXG4gICAqXG4gICAqIEBwYXJhbSB1dHhvc2V0IEEgc2V0IG9mIFVUWE9zIHRoYXQgdGhlIHRyYW5zYWN0aW9uIGlzIGJ1aWx0IG9uXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBzZW5kIHRoZSBmdW5kcyBmcm9tIHRoZSBVVFhPcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfVxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3NcbiAgICogQHBhcmFtIHN1Ym5ldElEIE9wdGlvbmFsIElEIG9mIHRoZSBTdWJuZXQgdGhhdCB2YWxpZGF0ZXMgdGhpcyBibG9ja2NoYWluXG4gICAqIEBwYXJhbSBjaGFpbk5hbWUgT3B0aW9uYWwgQSBodW1hbiByZWFkYWJsZSBuYW1lIGZvciB0aGUgY2hhaW47IG5lZWQgbm90IGJlIHVuaXF1ZVxuICAgKiBAcGFyYW0gdm1JRCBPcHRpb25hbCBJRCBvZiB0aGUgVk0gcnVubmluZyBvbiB0aGUgbmV3IGNoYWluXG4gICAqIEBwYXJhbSBmeElEcyBPcHRpb25hbCBJRHMgb2YgdGhlIGZlYXR1cmUgZXh0ZW5zaW9ucyBydW5uaW5nIG9uIHRoZSBuZXcgY2hhaW5cbiAgICogQHBhcmFtIGdlbmVzaXNEYXRhIE9wdGlvbmFsIEJ5dGUgcmVwcmVzZW50YXRpb24gb2YgZ2VuZXNpcyBzdGF0ZSBvZiB0aGUgbmV3IGNoYWluXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBzdWJuZXRBdXRoIE9wdGlvbmFsLiBBbiBBdXRoIHN0cnVjdCB3aGljaCBjb250YWlucyB0aGUgc3VibmV0IEF1dGggYW5kIHRoZSBzaWduZXJzLlxuICAgKiBAcGFyYW0gY2hhbmdlVGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgY2hhbmdlIFVUWE9cbiAgICpcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gY3JlYXRlZCBmcm9tIHRoZSBwYXNzZWQgaW4gcGFyYW1ldGVycy5cbiAgICovXG4gIGJ1aWxkQ3JlYXRlQ2hhaW5UeCA9IGFzeW5jIChcbiAgICB1dHhvc2V0OiBVVFhPU2V0LFxuICAgIGZyb21BZGRyZXNzZXM6IEZyb21UeXBlLFxuICAgIGNoYW5nZUFkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgc3VibmV0SUQ6IHN0cmluZyB8IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBjaGFpbk5hbWU6IHN0cmluZyA9IHVuZGVmaW5lZCxcbiAgICB2bUlEOiBzdHJpbmcgPSB1bmRlZmluZWQsXG4gICAgZnhJRHM6IHN0cmluZ1tdID0gdW5kZWZpbmVkLFxuICAgIGdlbmVzaXNEYXRhOiBzdHJpbmcgfCBHZW5lc2lzRGF0YSA9IHVuZGVmaW5lZCxcbiAgICBtZW1vOiBQYXlsb2FkQmFzZSB8IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBhc09mOiBCTiA9IFplcm9CTixcbiAgICBzdWJuZXRBdXRoOiBBdXRoID0geyBhZGRyZXNzZXM6IFtdLCB0aHJlc2hvbGQ6IDAsIHNpZ25lcjogW10gfSxcbiAgICBjaGFuZ2VUaHJlc2hvbGQ6IG51bWJlciA9IDFcbiAgKTogUHJvbWlzZTxVbnNpZ25lZFR4PiA9PiB7XG4gICAgY29uc3QgY2FsbGVyID0gXCJidWlsZENyZWF0ZUNoYWluVHhcIlxuXG4gICAgY29uc3QgZnJvbVNpZ25lciA9IHRoaXMuX3BhcnNlRnJvbVNpZ25lcihmcm9tQWRkcmVzc2VzLCBjYWxsZXIpXG5cbiAgICBjb25zdCBjaGFuZ2U6IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXlCdWZmZXIoXG4gICAgICBjaGFuZ2VBZGRyZXNzZXMsXG4gICAgICBjYWxsZXJcbiAgICApXG5cbiAgICBpZiAobWVtbyBpbnN0YW5jZW9mIFBheWxvYWRCYXNlKSB7XG4gICAgICBtZW1vID0gbWVtby5nZXRQYXlsb2FkKClcbiAgICB9XG5cbiAgICBjb25zdCBhdmF4QXNzZXRJRDogQnVmZmVyID0gYXdhaXQgdGhpcy5nZXRBVkFYQXNzZXRJRCgpXG4gICAgZnhJRHMgPSBmeElEcy5zb3J0KClcblxuICAgIGNvbnN0IG5ldHdvcmtJRDogbnVtYmVyID0gdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpXG4gICAgY29uc3QgYmxvY2tjaGFpbklEOiBCdWZmZXIgPSBiaW50b29scy5jYjU4RGVjb2RlKHRoaXMuYmxvY2tjaGFpbklEKVxuICAgIGNvbnN0IGZlZTogQk4gPSB0aGlzLmdldENyZWF0ZUNoYWluVHhGZWUoKVxuXG4gICAgY29uc3QgYnVpbHRVbnNpZ25lZFR4OiBVbnNpZ25lZFR4ID0gYXdhaXQgdGhpcy5fZ2V0QnVpbGRlcihcbiAgICAgIHV0eG9zZXRcbiAgICApLmJ1aWxkQ3JlYXRlQ2hhaW5UeChcbiAgICAgIG5ldHdvcmtJRCxcbiAgICAgIGJsb2NrY2hhaW5JRCxcbiAgICAgIGZyb21TaWduZXIsXG4gICAgICBjaGFuZ2UsXG4gICAgICBzdWJuZXRJRCxcbiAgICAgIGNoYWluTmFtZSxcbiAgICAgIHZtSUQsXG4gICAgICBmeElEcyxcbiAgICAgIGdlbmVzaXNEYXRhLFxuICAgICAgZmVlLFxuICAgICAgYXZheEFzc2V0SUQsXG4gICAgICBtZW1vLFxuICAgICAgYXNPZixcbiAgICAgIHN1Ym5ldEF1dGgsXG4gICAgICBjaGFuZ2VUaHJlc2hvbGRcbiAgICApXG5cbiAgICBpZiAoIShhd2FpdCB0aGlzLmNoZWNrR29vc2VFZ2coYnVpbHRVbnNpZ25lZFR4LCB0aGlzLmdldENyZWF0aW9uVHhGZWUoKSkpKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEdvb3NlRWdnQ2hlY2tFcnJvcihcIkZhaWxlZCBHb29zZSBFZ2cgQ2hlY2tcIilcbiAgICB9XG5cbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4XG4gIH1cbiAgLyoqXG4gICAqIEJ1aWxkIGFuIHVuc2lnbmVkIFtbQWRkcmVzc1N0YXRlVHhdXS5cbiAgICpcbiAgICogQHBhcmFtIHV0eG9zZXQgQSBzZXQgb2YgVVRYT3MgdGhhdCB0aGUgdHJhbnNhY3Rpb24gaXMgYnVpbHQgb25cbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIHNlbmQgdGhlIGZ1bmRzIGZyb20gdGhlIFVUWE9zIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0aGF0IGNhbiBzcGVuZCB0aGUgY2hhbmdlIHJlbWFpbmluZyBmcm9tIHRoZSBzcGVudCBVVFhPcy5cbiAgICogQHBhcmFtIGFkZHJlc3MgVGhlIGFkZHJlc3MgdG8gYWx0ZXIgc3RhdGUuXG4gICAqIEBwYXJhbSBzdGF0ZSBUaGUgc3RhdGUgdG8gc2V0IG9yIHJlbW92ZSBvbiB0aGUgZ2l2ZW4gYWRkcmVzc1xuICAgKiBAcGFyYW0gcmVtb3ZlIE9wdGlvbmFsLiBGbGFnIGlmIHN0YXRlIHNob3VsZCBiZSBhcHBsaWVkIG9yIHJlbW92ZWRcbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIGNoYW5nZVRocmVzaG9sZCBPcHRpb25hbC4gVGhlIG51bWJlciBvZiBzaWduYXR1cmVzIHJlcXVpcmVkIHRvIHNwZW5kIHRoZSBmdW5kcyBpbiB0aGUgcmVzdWx0YW50IGNoYW5nZSBVVFhPXG4gICAqXG4gICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIEFkZHJlc3NTdGF0ZVR4IGNyZWF0ZWQgZnJvbSB0aGUgcGFzc2VkIGluIHBhcmFtZXRlcnMuXG4gICAqL1xuICBidWlsZEFkZHJlc3NTdGF0ZVR4ID0gYXN5bmMgKFxuICAgIHV0eG9zZXQ6IFVUWE9TZXQsXG4gICAgZnJvbUFkZHJlc3NlczogRnJvbVR5cGUsXG4gICAgY2hhbmdlQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICBhZGRyZXNzOiBzdHJpbmcgfCBCdWZmZXIsXG4gICAgc3RhdGU6IG51bWJlcixcbiAgICByZW1vdmU6IGJvb2xlYW4gPSBmYWxzZSxcbiAgICBtZW1vOiBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgYXNPZjogQk4gPSBaZXJvQk4sXG4gICAgY2hhbmdlVGhyZXNob2xkOiBudW1iZXIgPSAxXG4gICk6IFByb21pc2U8VW5zaWduZWRUeD4gPT4ge1xuICAgIGNvbnN0IGNhbGxlciA9IFwiYnVpbGRBZGRyZXNzU3RhdGVUeFwiXG5cbiAgICBjb25zdCBmcm9tU2lnbmVyID0gdGhpcy5fcGFyc2VGcm9tU2lnbmVyKGZyb21BZGRyZXNzZXMsIGNhbGxlcilcblxuICAgIGNvbnN0IGNoYW5nZTogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheUJ1ZmZlcihcbiAgICAgIGNoYW5nZUFkZHJlc3NlcyxcbiAgICAgIGNhbGxlclxuICAgIClcbiAgICBjb25zdCBhZGRyZXNzQnVmID1cbiAgICAgIHR5cGVvZiBhZGRyZXNzID09PSBcInN0cmluZ1wiID8gdGhpcy5wYXJzZUFkZHJlc3MoYWRkcmVzcykgOiBhZGRyZXNzXG4gICAgaWYgKG1lbW8gaW5zdGFuY2VvZiBQYXlsb2FkQmFzZSkge1xuICAgICAgbWVtbyA9IG1lbW8uZ2V0UGF5bG9hZCgpXG4gICAgfVxuXG4gICAgY29uc3QgYXZheEFzc2V0SUQ6IEJ1ZmZlciA9IGF3YWl0IHRoaXMuZ2V0QVZBWEFzc2V0SUQoKVxuICAgIGNvbnN0IG5ldHdvcmtJRDogbnVtYmVyID0gdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpXG4gICAgY29uc3QgYmxvY2tjaGFpbklEOiBCdWZmZXIgPSBiaW50b29scy5jYjU4RGVjb2RlKHRoaXMuYmxvY2tjaGFpbklEKVxuICAgIGNvbnN0IGZlZTogQk4gPSB0aGlzLmdldFR4RmVlKClcblxuICAgIGNvbnN0IGJ1aWx0VW5zaWduZWRUeDogVW5zaWduZWRUeCA9IGF3YWl0IHRoaXMuX2dldEJ1aWxkZXIoXG4gICAgICB1dHhvc2V0XG4gICAgKS5idWlsZEFkZHJlc3NTdGF0ZVR4KFxuICAgICAgbmV0d29ya0lELFxuICAgICAgYmxvY2tjaGFpbklELFxuICAgICAgZnJvbVNpZ25lcixcbiAgICAgIGNoYW5nZSxcbiAgICAgIGFkZHJlc3NCdWYsXG4gICAgICBzdGF0ZSxcbiAgICAgIHJlbW92ZSxcbiAgICAgIGZlZSxcbiAgICAgIGF2YXhBc3NldElELFxuICAgICAgbWVtbyxcbiAgICAgIGFzT2YsXG4gICAgICBjaGFuZ2VUaHJlc2hvbGRcbiAgICApXG5cbiAgICBpZiAoIShhd2FpdCB0aGlzLmNoZWNrR29vc2VFZ2coYnVpbHRVbnNpZ25lZFR4LCB0aGlzLmdldENyZWF0aW9uVHhGZWUoKSkpKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEdvb3NlRWdnQ2hlY2tFcnJvcihcIkZhaWxlZCBHb29zZSBFZ2cgQ2hlY2tcIilcbiAgICB9XG5cbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4XG4gIH1cblxuICAvKipcbiAgICogQnVpbGQgYW4gdW5zaWduZWQgW1tSZWdpc3Rlck5vZGVUeF1dLlxuICAgKlxuICAgKiBAcGFyYW0gdXR4b3NldCBBIHNldCBvZiBVVFhPcyB0aGF0IHRoZSB0cmFuc2FjdGlvbiBpcyBidWlsdCBvblxuICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGJlaW5nIHVzZWQgdG8gc2VuZCB0aGUgZnVuZHMgZnJvbSB0aGUgVVRYT3Mge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1cbiAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRoYXQgY2FuIHNwZW5kIHRoZSBjaGFuZ2UgcmVtYWluaW5nIGZyb20gdGhlIHNwZW50IFVUWE9zXG4gICAqIEBwYXJhbSBvbGROb2RlSUQgT3B0aW9uYWwuIElEIG9mIHRoZSBleGlzdGluZyBOb2RlSUQgdG8gcmVwbGFjZSBvciByZW1vdmUuXG4gICAqIEBwYXJhbSBuZXdOb2RlSUQgT3B0aW9uYWwuIElEIG9mIHRoZSBuZXdOb2RJRCB0byByZWdpc3RlciBhZGRyZXNzLlxuICAgKiBAcGFyYW0gYWRkcmVzcyBUaGUgY29uc29ydGl1bU1lbWJlckFkZHJlc3MsIHNpbmdsZSBvciBtdWx0aS1zaWcuXG4gICAqIEBwYXJhbSBhZGRyZXNzQXV0aHMgQW4gYXJyYXkgb2YgaW5kZXggYW5kIGFkZHJlc3MgdG8gdmVyaWZ5IG93bmVyc2hpcCBvZiBhZGRyZXNzLlxuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xuICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gY2hhbmdlVGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgY2hhbmdlIFVUWE9cbiAgICpcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gY3JlYXRlZCBmcm9tIHRoZSBwYXNzZWQgaW4gcGFyYW1ldGVycy5cbiAgICovXG4gIGJ1aWxkUmVnaXN0ZXJOb2RlVHggPSBhc3luYyAoXG4gICAgdXR4b3NldDogVVRYT1NldCxcbiAgICBmcm9tQWRkcmVzc2VzOiBGcm9tVHlwZSxcbiAgICBjaGFuZ2VBZGRyZXNzZXM6IHN0cmluZ1tdID0gdW5kZWZpbmVkLFxuICAgIG9sZE5vZGVJRDogc3RyaW5nIHwgQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIG5ld05vZGVJRDogc3RyaW5nIHwgQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGFkZHJlc3M6IHN0cmluZyB8IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBhZGRyZXNzQXV0aHM6IFtudW1iZXIsIHN0cmluZyB8IEJ1ZmZlcl1bXSA9IFtdLFxuICAgIG1lbW86IFBheWxvYWRCYXNlIHwgQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGFzT2Y6IEJOID0gWmVyb0JOLFxuICAgIGNoYW5nZVRocmVzaG9sZDogbnVtYmVyID0gMVxuICApOiBQcm9taXNlPFVuc2lnbmVkVHg+ID0+IHtcbiAgICBjb25zdCBjYWxsZXIgPSBcImJ1aWxkUmVnaXN0ZXJOb2RlVHhcIlxuXG4gICAgY29uc3QgZnJvbVNpZ25lciA9IHRoaXMuX3BhcnNlRnJvbVNpZ25lcihmcm9tQWRkcmVzc2VzLCBjYWxsZXIpXG5cbiAgICBjb25zdCBjaGFuZ2U6IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXlCdWZmZXIoXG4gICAgICBjaGFuZ2VBZGRyZXNzZXMsXG4gICAgICBjYWxsZXJcbiAgICApXG4gICAgY29uc3QgYWRkckJ1ZiA9XG4gICAgICB0eXBlb2YgYWRkcmVzcyA9PT0gXCJzdHJpbmdcIiA/IHRoaXMucGFyc2VBZGRyZXNzKGFkZHJlc3MpIDogYWRkcmVzc1xuXG4gICAgaWYgKG1lbW8gaW5zdGFuY2VvZiBQYXlsb2FkQmFzZSkge1xuICAgICAgbWVtbyA9IG1lbW8uZ2V0UGF5bG9hZCgpXG4gICAgfVxuICAgIGNvbnN0IGF1dGg6IFtudW1iZXIsIEJ1ZmZlcl1bXSA9IFtdXG4gICAgYWRkcmVzc0F1dGhzLmZvckVhY2goKGMpID0+IHtcbiAgICAgIGF1dGgucHVzaChbXG4gICAgICAgIGNbMF0sXG4gICAgICAgIHR5cGVvZiBjWzFdID09PSBcInN0cmluZ1wiID8gdGhpcy5wYXJzZUFkZHJlc3MoY1sxXSkgOiBjWzFdXG4gICAgICBdKVxuICAgIH0pXG5cbiAgICBpZiAodHlwZW9mIG9sZE5vZGVJRCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgb2xkTm9kZUlEID0gTm9kZUlEU3RyaW5nVG9CdWZmZXIob2xkTm9kZUlEKVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgbmV3Tm9kZUlEID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBuZXdOb2RlSUQgPSBOb2RlSURTdHJpbmdUb0J1ZmZlcihuZXdOb2RlSUQpXG4gICAgfVxuXG4gICAgY29uc3QgYXZheEFzc2V0SUQ6IEJ1ZmZlciA9IGF3YWl0IHRoaXMuZ2V0QVZBWEFzc2V0SUQoKVxuICAgIGNvbnN0IG5ldHdvcmtJRDogbnVtYmVyID0gdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpXG4gICAgY29uc3QgYmxvY2tjaGFpbklEOiBCdWZmZXIgPSBiaW50b29scy5jYjU4RGVjb2RlKHRoaXMuYmxvY2tjaGFpbklEKVxuICAgIGNvbnN0IGZlZTogQk4gPSB0aGlzLmdldFR4RmVlKClcblxuICAgIGNvbnN0IGJ1aWx0VW5zaWduZWRUeDogVW5zaWduZWRUeCA9IGF3YWl0IHRoaXMuX2dldEJ1aWxkZXIoXG4gICAgICB1dHhvc2V0XG4gICAgKS5idWlsZFJlZ2lzdGVyTm9kZVR4KFxuICAgICAgbmV0d29ya0lELFxuICAgICAgYmxvY2tjaGFpbklELFxuICAgICAgZnJvbVNpZ25lcixcbiAgICAgIGNoYW5nZSxcbiAgICAgIG9sZE5vZGVJRCxcbiAgICAgIG5ld05vZGVJRCxcbiAgICAgIGFkZHJCdWYsXG4gICAgICBhdXRoLFxuICAgICAgZmVlLFxuICAgICAgYXZheEFzc2V0SUQsXG4gICAgICBtZW1vLFxuICAgICAgYXNPZixcbiAgICAgIGNoYW5nZVRocmVzaG9sZFxuICAgIClcblxuICAgIGlmICghKGF3YWl0IHRoaXMuY2hlY2tHb29zZUVnZyhidWlsdFVuc2lnbmVkVHgsIHRoaXMuZ2V0Q3JlYXRpb25UeEZlZSgpKSkpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgR29vc2VFZ2dDaGVja0Vycm9yKFwiRmFpbGVkIEdvb3NlIEVnZyBDaGVja1wiKVxuICAgIH1cblxuICAgIHJldHVybiBidWlsdFVuc2lnbmVkVHhcbiAgfVxuXG4gIC8qKlxuICAgKiBCdWlsZCBhbiB1bnNpZ25lZCBbW0RlcG9zaXRUeF1dLlxuICAgKlxuICAgKiBAcGFyYW0gdXR4b3NldCBBIHNldCBvZiBVVFhPcyB0aGF0IHRoZSB0cmFuc2FjdGlvbiBpcyBidWlsdCBvblxuICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGJlaW5nIHVzZWQgdG8gc2VuZCB0aGUgZnVuZHMgZnJvbSB0aGUgVVRYT3Mge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1cbiAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRoYXQgY2FuIHNwZW5kIHRoZSBjaGFuZ2UgcmVtYWluaW5nIGZyb20gdGhlIHNwZW50IFVUWE9zLlxuICAgKiBAcGFyYW0gZGVwb3NpdE9mZmVySUQgSUQgb2YgdGhlIGRlcG9zaXQgb2ZmZXIuXG4gICAqIEBwYXJhbSBkZXBvc2l0RHVyYXRpb24gRHVyYXRpb24gb2YgdGhlIGRlcG9zaXRcbiAgICogQHBhcmFtIHJld2FyZHNPd25lciBPcHRpb25hbCBUaGUgb3duZXJzIG9mIHRoZSByZXdhcmQuIElmIG9taXR0ZWQsIGFsbCBpbnB1dHMgbXVzdCBoYXZlIHRoZSBzYW1lIG93bmVyXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBjaGFuZ2VUaHJlc2hvbGQgT3B0aW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCBjaGFuZ2UgVVRYT1xuICAgKlxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiBjcmVhdGVkIGZyb20gdGhlIHBhc3NlZCBpbiBwYXJhbWV0ZXJzLlxuICAgKi9cbiAgYnVpbGREZXBvc2l0VHggPSBhc3luYyAoXG4gICAgdXR4b3NldDogVVRYT1NldCxcbiAgICBmcm9tQWRkcmVzc2VzOiBGcm9tVHlwZSxcbiAgICBjaGFuZ2VBZGRyZXNzZXM6IHN0cmluZ1tdID0gdW5kZWZpbmVkLFxuICAgIGRlcG9zaXRPZmZlcklEOiBzdHJpbmcgfCBCdWZmZXIsXG4gICAgZGVwb3NpdER1cmF0aW9uOiBudW1iZXIgfCBCdWZmZXIsXG4gICAgcmV3YXJkc093bmVyOiBPdXRwdXRPd25lcnMgPSB1bmRlZmluZWQsXG4gICAgbWVtbzogUGF5bG9hZEJhc2UgfCBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgYXNPZjogQk4gPSBaZXJvQk4sXG4gICAgYW1vdW50VG9Mb2NrOiBCTixcbiAgICBjaGFuZ2VUaHJlc2hvbGQ6IG51bWJlciA9IDFcbiAgKTogUHJvbWlzZTxVbnNpZ25lZFR4PiA9PiB7XG4gICAgY29uc3QgY2FsbGVyID0gXCJidWlsZFJlZ2lzdGVyTm9kZVR4XCJcblxuICAgIGNvbnN0IGZyb21TaWduZXIgPSB0aGlzLl9wYXJzZUZyb21TaWduZXIoZnJvbUFkZHJlc3NlcywgY2FsbGVyKVxuXG4gICAgY29uc3QgY2hhbmdlOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5QnVmZmVyKFxuICAgICAgY2hhbmdlQWRkcmVzc2VzLFxuICAgICAgY2FsbGVyXG4gICAgKVxuXG4gICAgaWYgKG1lbW8gaW5zdGFuY2VvZiBQYXlsb2FkQmFzZSkge1xuICAgICAgbWVtbyA9IG1lbW8uZ2V0UGF5bG9hZCgpXG4gICAgfVxuXG4gICAgY29uc3QgYXZheEFzc2V0SUQ6IEJ1ZmZlciA9IGF3YWl0IHRoaXMuZ2V0QVZBWEFzc2V0SUQoKVxuICAgIGNvbnN0IG5ldHdvcmtJRDogbnVtYmVyID0gdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpXG4gICAgY29uc3QgYmxvY2tjaGFpbklEOiBCdWZmZXIgPSBiaW50b29scy5jYjU4RGVjb2RlKHRoaXMuYmxvY2tjaGFpbklEKVxuICAgIGNvbnN0IGZlZTogQk4gPSB0aGlzLmdldFR4RmVlKClcblxuICAgIGNvbnN0IGJ1aWx0VW5zaWduZWRUeDogVW5zaWduZWRUeCA9IGF3YWl0IHRoaXMuX2dldEJ1aWxkZXIoXG4gICAgICB1dHhvc2V0XG4gICAgKS5idWlsZERlcG9zaXRUeChcbiAgICAgIG5ldHdvcmtJRCxcbiAgICAgIGJsb2NrY2hhaW5JRCxcbiAgICAgIGZyb21TaWduZXIsXG4gICAgICBjaGFuZ2UsXG4gICAgICBkZXBvc2l0T2ZmZXJJRCxcbiAgICAgIGRlcG9zaXREdXJhdGlvbixcbiAgICAgIHJld2FyZHNPd25lcixcbiAgICAgIGZlZSxcbiAgICAgIGF2YXhBc3NldElELFxuICAgICAgbWVtbyxcbiAgICAgIGFzT2YsXG4gICAgICBhbW91bnRUb0xvY2ssXG4gICAgICBjaGFuZ2VUaHJlc2hvbGRcbiAgICApXG5cbiAgICBpZiAoIShhd2FpdCB0aGlzLmNoZWNrR29vc2VFZ2coYnVpbHRVbnNpZ25lZFR4LCB0aGlzLmdldENyZWF0aW9uVHhGZWUoKSkpKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEdvb3NlRWdnQ2hlY2tFcnJvcihcIkZhaWxlZCBHb29zZSBFZ2cgQ2hlY2tcIilcbiAgICB9XG5cbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4XG4gIH1cblxuICAvKipcbiAgICogQnVpbGQgYW4gdW5zaWduZWQgW1tVbmxvY2tEZXBvc2l0VHhdXS5cbiAgICpcbiAgICogQHBhcmFtIHV0eG9zZXQgQSBzZXQgb2YgVVRYT3MgdGhhdCB0aGUgdHJhbnNhY3Rpb24gaXMgYnVpbHQgb25cbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIHNlbmQgdGhlIGZ1bmRzIGZyb20gdGhlIFVUWE9zIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0aGF0IGNhbiBzcGVuZCB0aGUgY2hhbmdlIHJlbWFpbmluZyBmcm9tIHRoZSBzcGVudCBVVFhPcy5cbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIGNoYW5nZVRocmVzaG9sZCBPcHRpb25hbC4gVGhlIG51bWJlciBvZiBzaWduYXR1cmVzIHJlcXVpcmVkIHRvIHNwZW5kIHRoZSBmdW5kcyBpbiB0aGUgcmVzdWx0YW50IGNoYW5nZSBVVFhPXG4gICAqXG4gICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIGNyZWF0ZWQgZnJvbSB0aGUgcGFzc2VkIGluIHBhcmFtZXRlcnMuXG4gICAqL1xuICBidWlsZFVubG9ja0RlcG9zaXRUeCA9IGFzeW5jIChcbiAgICB1dHhvc2V0OiBVVFhPU2V0LFxuICAgIGZyb21BZGRyZXNzZXM6IHN0cmluZ1tdLFxuICAgIGNoYW5nZUFkZHJlc3Nlczogc3RyaW5nW10gPSB1bmRlZmluZWQsXG4gICAgbWVtbzogUGF5bG9hZEJhc2UgfCBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgYXNPZjogQk4gPSBaZXJvQk4sXG4gICAgYW1vdW50VG9Mb2NrOiBCTixcbiAgICBjaGFuZ2VUaHJlc2hvbGQ6IG51bWJlciA9IDFcbiAgKTogUHJvbWlzZTxVbnNpZ25lZFR4PiA9PiB7XG4gICAgY29uc3QgY2FsbGVyID0gXCJidWlsZFVubG9ja0RlcG9zaXRUeFwiXG4gICAgY29uc3QgZnJvbVNpZ25lciA9IHRoaXMuX3BhcnNlRnJvbVNpZ25lcihmcm9tQWRkcmVzc2VzLCBjYWxsZXIpXG4gICAgY29uc3QgY2hhbmdlOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5QnVmZmVyKFxuICAgICAgY2hhbmdlQWRkcmVzc2VzLFxuICAgICAgY2FsbGVyXG4gICAgKVxuICAgIGlmIChtZW1vIGluc3RhbmNlb2YgUGF5bG9hZEJhc2UpIHtcbiAgICAgIG1lbW8gPSBtZW1vLmdldFBheWxvYWQoKVxuICAgIH1cblxuICAgIGNvbnN0IGF2YXhBc3NldElEOiBCdWZmZXIgPSBhd2FpdCB0aGlzLmdldEFWQVhBc3NldElEKClcbiAgICBjb25zdCBuZXR3b3JrSUQ6IG51bWJlciA9IHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKVxuICAgIGNvbnN0IGJsb2NrY2hhaW5JRDogQnVmZmVyID0gYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRClcbiAgICBjb25zdCBmZWU6IEJOID0gdGhpcy5nZXRUeEZlZSgpXG5cbiAgICBjb25zdCBidWlsdFVuc2lnbmVkVHg6IFVuc2lnbmVkVHggPSBhd2FpdCB0aGlzLl9nZXRCdWlsZGVyKFxuICAgICAgdXR4b3NldFxuICAgICkuYnVpbGRVbmxvY2tEZXBvc2l0VHgoXG4gICAgICBuZXR3b3JrSUQsXG4gICAgICBibG9ja2NoYWluSUQsXG4gICAgICBmcm9tU2lnbmVyLFxuICAgICAgY2hhbmdlLFxuICAgICAgZmVlLFxuICAgICAgYXZheEFzc2V0SUQsXG4gICAgICBtZW1vLFxuICAgICAgYXNPZixcbiAgICAgIGNoYW5nZVRocmVzaG9sZFxuICAgIClcblxuICAgIGlmICghKGF3YWl0IHRoaXMuY2hlY2tHb29zZUVnZyhidWlsdFVuc2lnbmVkVHgsIHRoaXMuZ2V0Q3JlYXRpb25UeEZlZSgpKSkpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgR29vc2VFZ2dDaGVja0Vycm9yKFwiRmFpbGVkIEdvb3NlIEVnZyBDaGVja1wiKVxuICAgIH1cblxuICAgIHJldHVybiBidWlsdFVuc2lnbmVkVHhcbiAgfVxuXG4gIC8qKlxuICAgKiBCdWlsZCBhbiB1bnNpZ25lZCBbW0NsYWltVHhdXS5cbiAgICpcbiAgICogQHBhcmFtIHV0eG9zZXQgQSBzZXQgb2YgVVRYT3MgdGhhdCB0aGUgdHJhbnNhY3Rpb24gaXMgYnVpbHQgb25cbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIHNlbmQgdGhlIGZ1bmRzIGZyb20gdGhlIFVUWE9zIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0aGF0IGNhbiBzcGVuZCB0aGUgY2hhbmdlIHJlbWFpbmluZyBmcm9tIHRoZSBzcGVudCBVVFhPcy5cbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIGNoYW5nZVRocmVzaG9sZCBPcHRpb25hbC4gVGhlIG51bWJlciBvZiBzaWduYXR1cmVzIHJlcXVpcmVkIHRvIHNwZW5kIHRoZSBmdW5kcyBpbiB0aGUgcmVzdWx0YW50IGNoYW5nZSBVVFhPXG4gICAqIEBwYXJhbSBjbGFpbUFtb3VudHMgVGhlIHNwZWNpZmljYXRpb24gYW5kIGF1dGhlbnRpY2F0aW9uIHdoYXQgYW5kIGhvdyBtdWNoIHRvIGNsYWltXG4gICAqIEBwYXJhbSBjbGFpbVRvIFRoZSBhZGRyZXNzIHRvIGNsYWltZWQgcmV3YXJkcyB3aWxsIGJlIGRpcmVjdGVkIHRvXG4gICAqXG4gICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIGNyZWF0ZWQgZnJvbSB0aGUgcGFzc2VkIGluIHBhcmFtZXRlcnMuXG4gICAqL1xuICBidWlsZENsYWltVHggPSBhc3luYyAoXG4gICAgdXR4b3NldDogVVRYT1NldCxcbiAgICBmcm9tQWRkcmVzc2VzOiBGcm9tVHlwZSxcbiAgICBjaGFuZ2VBZGRyZXNzZXM6IHN0cmluZ1tdID0gdW5kZWZpbmVkLFxuICAgIG1lbW86IFBheWxvYWRCYXNlIHwgQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGFzT2Y6IEJOID0gWmVyb0JOLFxuICAgIGNoYW5nZVRocmVzaG9sZDogbnVtYmVyID0gMSxcbiAgICBjbGFpbUFtb3VudHM6IENsYWltQW1vdW50UGFyYW1zW10sXG4gICAgY2xhaW1UbzogT3V0cHV0T3duZXJzID0gdW5kZWZpbmVkXG4gICk6IFByb21pc2U8VW5zaWduZWRUeD4gPT4ge1xuICAgIGNvbnN0IGNhbGxlciA9IFwiYnVpbGRDbGFpbVR4XCJcbiAgICBjb25zdCBmcm9tU2lnbmVyID0gdGhpcy5fcGFyc2VGcm9tU2lnbmVyKGZyb21BZGRyZXNzZXMsIGNhbGxlcilcbiAgICBjb25zdCBjaGFuZ2U6IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXlCdWZmZXIoXG4gICAgICBjaGFuZ2VBZGRyZXNzZXMsXG4gICAgICBjYWxsZXJcbiAgICApXG4gICAgaWYgKG1lbW8gaW5zdGFuY2VvZiBQYXlsb2FkQmFzZSkge1xuICAgICAgbWVtbyA9IG1lbW8uZ2V0UGF5bG9hZCgpXG4gICAgfVxuICAgIGlmIChjbGFpbUFtb3VudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNdXN0IHByb3ZpZGUgYXQgbGVhc3Qgb25lIGNsYWltQW1vdW50XCIpXG4gICAgfVxuICAgIGNvbnN0IGF2YXhBc3NldElEOiBCdWZmZXIgPSBhd2FpdCB0aGlzLmdldEFWQVhBc3NldElEKClcbiAgICBjb25zdCBuZXR3b3JrSUQ6IG51bWJlciA9IHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKVxuICAgIGNvbnN0IGJsb2NrY2hhaW5JRDogQnVmZmVyID0gYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRClcbiAgICBjb25zdCBmZWU6IEJOID0gdGhpcy5nZXRUeEZlZSgpXG5cbiAgICBjb25zdCB1bnNpZ25lZENsYWltVHg6IFVuc2lnbmVkVHggPSBhd2FpdCB0aGlzLl9nZXRCdWlsZGVyKFxuICAgICAgdXR4b3NldFxuICAgICkuYnVpbGRDbGFpbVR4KFxuICAgICAgbmV0d29ya0lELFxuICAgICAgYmxvY2tjaGFpbklELFxuICAgICAgZnJvbVNpZ25lcixcbiAgICAgIGNoYW5nZSxcbiAgICAgIGZlZSxcbiAgICAgIGF2YXhBc3NldElELFxuICAgICAgbWVtbyxcbiAgICAgIGFzT2YsXG4gICAgICBjaGFuZ2VUaHJlc2hvbGQsXG4gICAgICBjbGFpbUFtb3VudHMsXG4gICAgICBjbGFpbVRvXG4gICAgKVxuXG4gICAgaWYgKCEoYXdhaXQgdGhpcy5jaGVja0dvb3NlRWdnKHVuc2lnbmVkQ2xhaW1UeCwgdGhpcy5nZXRDcmVhdGlvblR4RmVlKCkpKSkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBHb29zZUVnZ0NoZWNrRXJyb3IoXCJGYWlsZWQgR29vc2UgRWdnIENoZWNrXCIpXG4gICAgfVxuXG4gICAgcmV0dXJuIHVuc2lnbmVkQ2xhaW1UeFxuICB9XG5cbiAgLyoqXG4gICAqIEBpZ25vcmVcbiAgICovXG4gIHByb3RlY3RlZCBfY2xlYW5BZGRyZXNzQXJyYXkoXG4gICAgYWRkcmVzc2VzOiBzdHJpbmdbXSB8IEJ1ZmZlcltdLFxuICAgIGNhbGxlcjogc3RyaW5nXG4gICk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBhZGRyczogc3RyaW5nW10gPSBbXVxuICAgIGNvbnN0IGNoYWluaWQ6IHN0cmluZyA9IHRoaXMuZ2V0QmxvY2tjaGFpbkFsaWFzKClcbiAgICAgID8gdGhpcy5nZXRCbG9ja2NoYWluQWxpYXMoKVxuICAgICAgOiB0aGlzLmdldEJsb2NrY2hhaW5JRCgpXG4gICAgaWYgKGFkZHJlc3NlcyAmJiBhZGRyZXNzZXMubGVuZ3RoID4gMCkge1xuICAgICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IGFkZHJlc3Nlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAodHlwZW9mIGFkZHJlc3Nlc1tgJHtpfWBdID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgdHlwZW9mIHRoaXMucGFyc2VBZGRyZXNzKGFkZHJlc3Nlc1tgJHtpfWBdIGFzIHN0cmluZykgPT09XG4gICAgICAgICAgICBcInVuZGVmaW5lZFwiXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICAgICAgdGhyb3cgbmV3IEFkZHJlc3NFcnJvcihgRXJyb3IgLSBJbnZhbGlkIGFkZHJlc3MgZm9ybWF0ICgke2NhbGxlcn0pYClcbiAgICAgICAgICB9XG4gICAgICAgICAgYWRkcnMucHVzaChhZGRyZXNzZXNbYCR7aX1gXSBhcyBzdHJpbmcpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3QgYmVjaDMyOiBTZXJpYWxpemVkVHlwZSA9IFwiYmVjaDMyXCJcbiAgICAgICAgICBhZGRycy5wdXNoKFxuICAgICAgICAgICAgc2VyaWFsaXphdGlvbi5idWZmZXJUb1R5cGUoXG4gICAgICAgICAgICAgIGFkZHJlc3Nlc1tgJHtpfWBdIGFzIEJ1ZmZlcixcbiAgICAgICAgICAgICAgYmVjaDMyLFxuICAgICAgICAgICAgICB0aGlzLmNvcmUuZ2V0SFJQKCksXG4gICAgICAgICAgICAgIGNoYWluaWRcbiAgICAgICAgICAgIClcbiAgICAgICAgICApXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGFkZHJzXG4gIH1cblxuICBwcm90ZWN0ZWQgX2NsZWFuQWRkcmVzc0FycmF5QnVmZmVyKFxuICAgIGFkZHJlc3Nlczogc3RyaW5nW10gfCBCdWZmZXJbXSxcbiAgICBjYWxsZXI6IHN0cmluZ1xuICApOiBCdWZmZXJbXSB7XG4gICAgcmV0dXJuIHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KGFkZHJlc3NlcywgY2FsbGVyKS5tYXAoXG4gICAgICAoYTogc3RyaW5nKTogQnVmZmVyID0+IHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBhID09PSBcInVuZGVmaW5lZFwiXG4gICAgICAgICAgPyB1bmRlZmluZWRcbiAgICAgICAgICA6IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKVxuICAgICAgfVxuICAgIClcbiAgfVxuXG4gIHByb3RlY3RlZCBfcGFyc2VGcm9tU2lnbmVyKGZyb206IEZyb21UeXBlLCBjYWxsZXI6IHN0cmluZyk6IEZyb21TaWduZXIge1xuICAgIGlmIChmcm9tLmxlbmd0aCA+IDApIHtcbiAgICAgIGlmICh0eXBlb2YgZnJvbVswXSA9PT0gXCJzdHJpbmdcIilcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBmcm9tOiB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheUJ1ZmZlcihmcm9tIGFzIHN0cmluZ1tdLCBjYWxsZXIpLFxuICAgICAgICAgIHNpZ25lcjogW11cbiAgICAgICAgfVxuICAgICAgZWxzZVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGZyb206IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5QnVmZmVyKGZyb21bMF0gYXMgc3RyaW5nW10sIGNhbGxlciksXG4gICAgICAgICAgc2lnbmVyOlxuICAgICAgICAgICAgZnJvbS5sZW5ndGggPiAxXG4gICAgICAgICAgICAgID8gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXlCdWZmZXIoZnJvbVsxXSBhcyBzdHJpbmdbXSwgY2FsbGVyKVxuICAgICAgICAgICAgICA6IFtdXG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHsgZnJvbTogW10sIHNpZ25lcjogW10gfVxuICB9XG5cbiAgLyoqXG4gICAqIFRoaXMgY2xhc3Mgc2hvdWxkIG5vdCBiZSBpbnN0YW50aWF0ZWQgZGlyZWN0bHkuXG4gICAqIEluc3RlYWQgdXNlIHRoZSBbW0F2YWxhbmNoZS5hZGRBUEldXSBtZXRob2QuXG4gICAqXG4gICAqIEBwYXJhbSBjb3JlIEEgcmVmZXJlbmNlIHRvIHRoZSBBdmFsYW5jaGUgY2xhc3NcbiAgICogQHBhcmFtIGJhc2VVUkwgRGVmYXVsdHMgdG8gdGhlIHN0cmluZyBcIi9leHQvUFwiIGFzIHRoZSBwYXRoIHRvIGJsb2NrY2hhaW4ncyBiYXNlVVJMXG4gICAqL1xuICBjb25zdHJ1Y3Rvcihjb3JlOiBBdmFsYW5jaGVDb3JlLCBiYXNlVVJMOiBzdHJpbmcgPSBcIi9leHQvYmMvUFwiKSB7XG4gICAgc3VwZXIoY29yZSwgYmFzZVVSTClcbiAgICBpZiAoY29yZS5nZXROZXR3b3JrKCkpIHtcbiAgICAgIHRoaXMuYmxvY2tjaGFpbklEID0gY29yZS5nZXROZXR3b3JrKCkuUC5ibG9ja2NoYWluSURcbiAgICAgIHRoaXMua2V5Y2hhaW4gPSBuZXcgS2V5Q2hhaW4oY29yZS5nZXRIUlAoKSwgY29yZS5nZXROZXR3b3JrKCkuUC5hbGlhcylcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMgdGhlIGN1cnJlbnQgdGltZXN0YW1wIG9uIGNoYWluLlxuICAgKi9cbiAgZ2V0VGltZXN0YW1wID0gYXN5bmMgKCk6IFByb21pc2U8bnVtYmVyPiA9PiB7XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmdldFRpbWVzdGFtcFwiXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC50aW1lc3RhbXBcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJucyB0aGUgVVRYT3MgdGhhdCB3ZXJlIHJld2FyZGVkIGFmdGVyIHRoZSBwcm92aWRlZCB0cmFuc2FjdGlvblwicyBzdGFraW5nIG9yIGRlbGVnYXRpb24gcGVyaW9kIGVuZGVkLlxuICAgKi9cbiAgZ2V0UmV3YXJkVVRYT3MgPSBhc3luYyAoXG4gICAgdHhJRDogc3RyaW5nLFxuICAgIGVuY29kaW5nPzogc3RyaW5nXG4gICk6IFByb21pc2U8R2V0UmV3YXJkVVRYT3NSZXNwb25zZT4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogR2V0UmV3YXJkVVRYT3NQYXJhbXMgPSB7XG4gICAgICB0eElELFxuICAgICAgZW5jb2RpbmdcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmdldFJld2FyZFVUWE9zXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0XG4gIH1cblxuICAvKipcbiAgICogR2V0IGJsb2NrY2hhaW5zIGNvbmZpZ3VyYXRpb24gKGdlbmVzaXMpXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGFuIEdldENvbmZpZ3VyYXRpb25SZXNwb25zZVxuICAgKi9cbiAgZ2V0Q29uZmlndXJhdGlvbiA9IGFzeW5jICgpOiBQcm9taXNlPEdldENvbmZpZ3VyYXRpb25SZXNwb25zZT4gPT4ge1xuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5nZXRDb25maWd1cmF0aW9uXCJcbiAgICApXG4gICAgY29uc3QgciA9IHJlc3BvbnNlLmRhdGEucmVzdWx0XG4gICAgcmV0dXJuIHtcbiAgICAgIG5ldHdvcmtJRDogcGFyc2VJbnQoci5uZXR3b3JrSUQpLFxuICAgICAgYXNzZXRJRDogci5hc3NldElELFxuICAgICAgYXNzZXRTeW1ib2w6IHIuYXNzZXRTeW1ib2wsXG4gICAgICBocnA6IHIuaHJwLFxuICAgICAgYmxvY2tjaGFpbnM6IHIuYmxvY2tjaGFpbnMsXG4gICAgICBtaW5TdGFrZUR1cmF0aW9uOiBuZXcgQk4oci5taW5TdGFrZUR1cmF0aW9uKS5kaXYoTmFub0JOKS50b051bWJlcigpLFxuICAgICAgbWF4U3Rha2VEdXJhdGlvbjogbmV3IEJOKHIubWF4U3Rha2VEdXJhdGlvbikuZGl2KE5hbm9CTikudG9OdW1iZXIoKSxcbiAgICAgIG1pblZhbGlkYXRvclN0YWtlOiBuZXcgQk4oci5taW5WYWxpZGF0b3JTdGFrZSksXG4gICAgICBtYXhWYWxpZGF0b3JTdGFrZTogbmV3IEJOKHIubWF4VmFsaWRhdG9yU3Rha2UpLFxuICAgICAgbWluRGVsZWdhdGlvbkZlZTogbmV3IEJOKHIubWluRGVsZWdhdGlvbkZlZSksXG4gICAgICBtaW5EZWxlZ2F0b3JTdGFrZTogbmV3IEJOKHIubWluRGVsZWdhdG9yU3Rha2UpLFxuICAgICAgbWluQ29uc3VtcHRpb25SYXRlOiBwYXJzZUludChyLm1pbkNvbnN1bXB0aW9uUmF0ZSkgLyByZXdhcmRQZXJjZW50RGVub20sXG4gICAgICBtYXhDb25zdW1wdGlvblJhdGU6IHBhcnNlSW50KHIubWF4Q29uc3VtcHRpb25SYXRlKSAvIHJld2FyZFBlcmNlbnREZW5vbSxcbiAgICAgIHN1cHBseUNhcDogbmV3IEJOKHIuc3VwcGx5Q2FwKSxcbiAgICAgIHZlcmlmeU5vZGVTaWduYXR1cmU6IHIudmVyaWZ5Tm9kZVNpZ25hdHVyZSA/PyBmYWxzZSxcbiAgICAgIGxvY2tNb2RlQm9uZERlcG9zaXQ6IHIubG9ja01vZGVCb25kRGVwb3NpdCA/PyBmYWxzZVxuICAgIH0gYXMgR2V0Q29uZmlndXJhdGlvblJlc3BvbnNlXG4gIH1cblxuICAvKipcbiAgICogR2V0IGJsb2NrY2hhaW5zIGNvbmZpZ3VyYXRpb24gKGdlbmVzaXMpXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGFuIEdldENvbmZpZ3VyYXRpb25SZXNwb25zZVxuICAgKi9cbiAgc3BlbmQgPSBhc3luYyAoXG4gICAgZnJvbTogc3RyaW5nW10gfCBzdHJpbmcsXG4gICAgc2lnbmVyOiBzdHJpbmdbXSB8IHN0cmluZyxcbiAgICB0bzogc3RyaW5nW10sXG4gICAgdG9UaHJlc2hvbGQ6IG51bWJlcixcbiAgICB0b0xvY2tUaW1lOiBCTixcbiAgICBjaGFuZ2U6IHN0cmluZ1tdLFxuICAgIGNoYW5nZVRocmVzaG9sZDogbnVtYmVyLFxuICAgIGxvY2tNb2RlOiBMb2NrTW9kZSxcbiAgICBhbW91bnRUb0xvY2s6IEJOLFxuICAgIGFtb3VudFRvQnVybjogQk4sXG4gICAgYXNPZjogQk4sXG4gICAgZW5jb2Rpbmc/OiBzdHJpbmdcbiAgKTogUHJvbWlzZTxTcGVuZFJlcGx5PiA9PiB7XG4gICAgaWYgKCFbXCJVbmxvY2tlZFwiLCBcIkRlcG9zaXRcIiwgXCJCb25kXCJdLmluY2x1ZGVzKGxvY2tNb2RlKSkge1xuICAgICAgdGhyb3cgbmV3IFByb3RvY29sRXJyb3IoXCJFcnJvciAtLSBQbGF0Zm9ybUFQSS5zcGVuZDogaW52YWxpZCBsb2NrTW9kZVwiKVxuICAgIH1cbiAgICBjb25zdCBwYXJhbXM6IFNwZW5kUGFyYW1zID0ge1xuICAgICAgZnJvbSxcbiAgICAgIHNpZ25lcixcbiAgICAgIHRvOlxuICAgICAgICB0by5sZW5ndGggPiAwXG4gICAgICAgICAgPyB7XG4gICAgICAgICAgICAgIGxvY2t0aW1lOiB0b0xvY2tUaW1lLnRvU3RyaW5nKDEwKSxcbiAgICAgICAgICAgICAgdGhyZXNob2xkOiB0b1RocmVzaG9sZCxcbiAgICAgICAgICAgICAgYWRkcmVzc2VzOiB0b1xuICAgICAgICAgICAgfVxuICAgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgY2hhbmdlOlxuICAgICAgICBjaGFuZ2UubGVuZ3RoID4gMFxuICAgICAgICAgID8geyBsb2NrdGltZTogXCIwXCIsIHRocmVzaG9sZDogY2hhbmdlVGhyZXNob2xkLCBhZGRyZXNzZXM6IGNoYW5nZSB9XG4gICAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgICBsb2NrTW9kZTogbG9ja01vZGUgPT09IFwiVW5sb2NrZWRcIiA/IDAgOiBsb2NrTW9kZSA9PT0gXCJEZXBvc2l0XCIgPyAxIDogMixcbiAgICAgIGFtb3VudFRvTG9jazogYW1vdW50VG9Mb2NrLnRvU3RyaW5nKDEwKSxcbiAgICAgIGFtb3VudFRvQnVybjogYW1vdW50VG9CdXJuLnRvU3RyaW5nKDEwKSxcbiAgICAgIGFzT2Y6IGFzT2YudG9TdHJpbmcoMTApLFxuICAgICAgZW5jb2Rpbmc6IGVuY29kaW5nID8/IFwiaGV4XCJcbiAgICB9XG5cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uc3BlbmRcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICBjb25zdCByID0gcmVzcG9uc2UuZGF0YS5yZXN1bHRcblxuICAgIC8vIFdlIG5lZWQgdG8gdXBkYXRlIHNpZ25hdHVyZSBpbmRleCBzb3VyY2UgaGVyZVxuICAgIGNvbnN0IGlucyA9IFRyYW5zZmVyYWJsZUlucHV0LmZyb21BcnJheShCdWZmZXIuZnJvbShyLmlucy5zbGljZSgyKSwgXCJoZXhcIikpXG4gICAgaW5zLmZvckVhY2goKGUsIGlkeCkgPT5cbiAgICAgIGUuZ2V0U2lnSWR4cygpLmZvckVhY2goKHMsIHNpZHgpID0+IHtcbiAgICAgICAgcy5zZXRTb3VyY2UoYmludG9vbHMuY2I1OERlY29kZShyLnNpZ25lcnNbYCR7aWR4fWBdW2Ake3NpZHh9YF0pKVxuICAgICAgfSlcbiAgICApXG5cbiAgICByZXR1cm4ge1xuICAgICAgaW5zLFxuICAgICAgb3V0OiBUcmFuc2ZlcmFibGVPdXRwdXQuZnJvbUFycmF5KEJ1ZmZlci5mcm9tKHIub3V0cy5zbGljZSgyKSwgXCJoZXhcIikpLFxuICAgICAgb3duZXJzOiByLm93bmVyc1xuICAgICAgICA/IE91dHB1dE93bmVycy5mcm9tQXJyYXkoQnVmZmVyLmZyb20oci5vd25lcnMuc2xpY2UoMiksIFwiaGV4XCIpKVxuICAgICAgICA6IFtdXG4gICAgfVxuICB9XG5cbiAgX2dldEJ1aWxkZXIgPSAodXR4b1NldDogVVRYT1NldCk6IEJ1aWxkZXIgPT4ge1xuICAgIGlmICh0aGlzLmNvcmUuZ2V0TmV0d29yaygpLlAubG9ja01vZGVCb25kRGVwb3NpdCkge1xuICAgICAgcmV0dXJuIG5ldyBCdWlsZGVyKG5ldyBTcGVuZGVyKHRoaXMpLCB0cnVlKVxuICAgIH1cbiAgICByZXR1cm4gbmV3IEJ1aWxkZXIodXR4b1NldCwgZmFsc2UpXG4gIH1cbn1cbiJdfQ==