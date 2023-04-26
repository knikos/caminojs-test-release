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
                        rewardOwner: {
                            locktime: new bn_js_1.default(deposit.rewardOwner.locktime),
                            threshold: new bn_js_1.default(deposit.rewardOwner.threshold).toNumber(),
                            addresses: deposit.rewardOwner.addresses
                        }
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
                        validatorRewards: new bn_js_1.default(c.validatorRewards),
                        expiredDepositRewards: new bn_js_1.default(c.expiredDepositRewards)
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
            return {
                memo: response.data.result.memo,
                locktime: new bn_js_1.default(response.data.result.locktime),
                threshold: new bn_js_1.default(response.data.result.threshold).toNumber(),
                addresses: response.data.result.addresses
            };
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
                throw new errors_2.StakeError(`PlatformVMAPI.${caller} -- stake amount must be at least ` +
                    minStake.toString(10));
            }
            if (typeof delegationFee !== "number" ||
                delegationFee > 100 ||
                delegationFee < 0) {
                throw new errors_2.DelegationFeeError(`PlatformVMAPI.${caller} -- delegationFee must be a number between 0 and 100`);
            }
            const avaxAssetID = yield this.getAVAXAssetID();
            const now = (0, helperfunctions_1.UnixNow)();
            if (startTime.lt(now) || endTime.lte(startTime)) {
                throw new errors_2.TimeError(`PlatformVMAPI.${caller} -- startTime must be in the future and endTime must come after startTime`);
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
         * Helper function which creates an unsigned [[CaminoAddValidatorTx]]. For more granular control, you may create your own
         * [[UnsignedTx]] manually and import the [[CaminoAddValidatorTx]] class directly.
         *
         * @param utxoset A set of UTXOs that the transaction is built on
         * @param toAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who received the staked tokens at the end of the staking period
         * @param fromAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who own the staking UTXOs the fees in AVAX
         * @param changeAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who gets the change leftover from the fee payment
         * @param nodeID The node ID of the validator being added.
         * @param nodeOwner The address and signature indices of the registered nodeId owner.
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
        this.buildCaminoAddValidatorTx = (utxoset, toAddresses, fromAddresses, changeAddresses, nodeID, nodeOwner, startTime, endTime, stakeAmount, rewardAddresses, rewardLocktime = common_1.ZeroBN, rewardThreshold = 1, memo = undefined, asOf = common_1.ZeroBN, toThreshold = 1, changeThreshold = 1) => __awaiter(this, void 0, void 0, function* () {
            const caller = "buildCaminoAddValidatorTx";
            const to = this._cleanAddressArrayBuffer(toAddresses, caller);
            const fromSigner = this._parseFromSigner(fromAddresses, caller);
            const change = this._cleanAddressArrayBuffer(changeAddresses, caller);
            const rewards = this._cleanAddressArrayBuffer(rewardAddresses, caller);
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const minStake = (yield this.getMinStake())["minValidatorStake"];
            if (stakeAmount.lt(minStake)) {
                throw new errors_2.StakeError(`PlatformVMAPI.${caller} -- stake amount must be at least ` +
                    minStake.toString(10));
            }
            const avaxAssetID = yield this.getAVAXAssetID();
            const now = (0, helperfunctions_1.UnixNow)();
            if (startTime.lt(now) || endTime.lte(startTime)) {
                throw new errors_2.TimeError(`PlatformVMAPI.${caller} -- startTime must be in the future and endTime must come after startTime`);
            }
            const auth = {
                address: this.parseAddress(nodeOwner.address),
                auth: []
            };
            nodeOwner.auth.forEach((o) => {
                auth.auth.push([o[0], this.parseAddress(o[1])]);
            });
            const builtUnsignedTx = yield this._getBuilder(utxoset).buildCaminoAddValidatorTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), to, fromSigner, change, (0, helperfunctions_1.NodeIDStringToBuffer)(nodeID), auth, startTime, endTime, stakeAmount, avaxAssetID, rewards, rewardLocktime, rewardThreshold, memo, asOf, toThreshold, changeThreshold);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvcGxhdGZvcm12bS9hcGkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7OztHQUdHO0FBQ0gsb0NBQWdDO0FBQ2hDLGtEQUFzQjtBQUV0Qix5Q0FLcUI7QUFFckIsK0NBSTJCO0FBQzNCLG9FQUEyQztBQUMzQyx5Q0FBcUM7QUFDckMscURBQStDO0FBQy9DLDJDQUFpRDtBQUNqRCw2QkFBcUM7QUFDckMsaURBQWlEO0FBQ2pELGlFQUEyRTtBQUMzRSwrQ0FBbUQ7QUFFbkQsK0NBUTJCO0FBZ0QzQixxQ0FBNEM7QUFDNUMsdUNBQThDO0FBQzlDLHVDQUEyRDtBQUUzRCx1Q0FBMEU7QUFFMUUsdUNBQW1DO0FBRW5DOztHQUVHO0FBQ0gsTUFBTSxRQUFRLEdBQWEsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUNqRCxNQUFNLGFBQWEsR0FBa0IscUJBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUVoRSxNQUFNLE1BQU0sR0FBRyxJQUFJLGVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQTtBQUNqQyxNQUFNLGtCQUFrQixHQUFHLE9BQU8sQ0FBQTtBQVFsQzs7Ozs7O0dBTUc7QUFDSCxNQUFhLGFBQWMsU0FBUSxnQkFBTztJQXFsRnhDOzs7Ozs7T0FNRztJQUNILFlBQVksSUFBbUIsRUFBRSxVQUFrQixXQUFXO1FBQzVELEtBQUssQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUE7UUE1bEZ0Qjs7V0FFRztRQUNPLGFBQVEsR0FBYSxJQUFJLG1CQUFRLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFBO1FBRXpDLGlCQUFZLEdBQVcsRUFBRSxDQUFBO1FBRXpCLG9CQUFlLEdBQVcsU0FBUyxDQUFBO1FBRW5DLGdCQUFXLEdBQVcsU0FBUyxDQUFBO1FBRS9CLFVBQUssR0FBTyxTQUFTLENBQUE7UUFFckIsa0JBQWEsR0FBTyxT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QTtRQUNqQyxDQUFDLENBQ0YsQ0FBQTtJQUNILENBQUM7SUFFUyxnQkFBZ0IsQ0FBQyxJQUFjLEVBQUUsTUFBYztRQUN2RCxJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQ25CLElBQUksT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssUUFBUTtnQkFDN0IsT0FBTztvQkFDTCxJQUFJLEVBQUUsSUFBSSxDQUFDLHdCQUF3QixDQUFDLElBQWdCLEVBQUUsTUFBTSxDQUFDO29CQUM3RCxNQUFNLEVBQUUsRUFBRTtpQkFDWCxDQUFBOztnQkFFRCxPQUFPO29CQUNMLElBQUksRUFBRSxJQUFJLENBQUMsd0JBQXdCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBYSxFQUFFLE1BQU0sQ0FBQztvQkFDaEUsTUFBTSxFQUNKLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQzt3QkFDYixDQUFDLENBQUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLElBQUksQ0FBQyxDQUFDLENBQWEsRUFBRSxNQUFNLENBQUM7d0JBQzVELENBQUMsQ0FBQyxFQUFFO2lCQUNULENBQUE7U0FDSjtRQUNELE9BQU8sRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsQ0FBQTtJQUNqQyxDQUFDO0NBb0pGO0FBdnVGRCxzQ0F1dUZDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgQVBJLVBsYXRmb3JtVk1cbiAqL1xuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcImJ1ZmZlci9cIlxuaW1wb3J0IEJOIGZyb20gXCJibi5qc1wiXG5pbXBvcnQgQXZhbGFuY2hlQ29yZSBmcm9tIFwiLi4vLi4vY2FtaW5vXCJcbmltcG9ydCB7XG4gIEpSUENBUEksXG4gIE91dHB1dE93bmVycyxcbiAgUmVxdWVzdFJlc3BvbnNlRGF0YSxcbiAgWmVyb0JOXG59IGZyb20gXCIuLi8uLi9jb21tb25cIlxuXG5pbXBvcnQge1xuICBFcnJvclJlc3BvbnNlT2JqZWN0LFxuICBQcm90b2NvbEVycm9yLFxuICBVVFhPRXJyb3Jcbn0gZnJvbSBcIi4uLy4uL3V0aWxzL2Vycm9yc1wiXG5pbXBvcnQgQmluVG9vbHMgZnJvbSBcIi4uLy4uL3V0aWxzL2JpbnRvb2xzXCJcbmltcG9ydCB7IEtleUNoYWluIH0gZnJvbSBcIi4va2V5Y2hhaW5cIlxuaW1wb3J0IHsgT05FQVZBWCB9IGZyb20gXCIuLi8uLi91dGlscy9jb25zdGFudHNcIlxuaW1wb3J0IHsgUGxhdGZvcm1WTUNvbnN0YW50cyB9IGZyb20gXCIuL2NvbnN0YW50c1wiXG5pbXBvcnQgeyBVbnNpZ25lZFR4LCBUeCB9IGZyb20gXCIuL3R4XCJcbmltcG9ydCB7IFBheWxvYWRCYXNlIH0gZnJvbSBcIi4uLy4uL3V0aWxzL3BheWxvYWRcIlxuaW1wb3J0IHsgVW5peE5vdywgTm9kZUlEU3RyaW5nVG9CdWZmZXIgfSBmcm9tIFwiLi4vLi4vdXRpbHMvaGVscGVyZnVuY3Rpb25zXCJcbmltcG9ydCB7IFVUWE8sIFVUWE9TZXQgfSBmcm9tIFwiLi4vcGxhdGZvcm12bS91dHhvc1wiXG5pbXBvcnQgeyBQZXJzaXN0YW5jZU9wdGlvbnMgfSBmcm9tIFwiLi4vLi4vdXRpbHMvcGVyc2lzdGVuY2VvcHRpb25zXCJcbmltcG9ydCB7XG4gIEFkZHJlc3NFcnJvcixcbiAgVHJhbnNhY3Rpb25FcnJvcixcbiAgQ2hhaW5JZEVycm9yLFxuICBHb29zZUVnZ0NoZWNrRXJyb3IsXG4gIFRpbWVFcnJvcixcbiAgU3Rha2VFcnJvcixcbiAgRGVsZWdhdGlvbkZlZUVycm9yXG59IGZyb20gXCIuLi8uLi91dGlscy9lcnJvcnNcIlxuaW1wb3J0IHtcbiAgQVBJRGVwb3NpdCxcbiAgQmFsYW5jZURpY3QsXG4gIENsYWltYWJsZSxcbiAgQ2xhaW1BbW91bnRQYXJhbXMsXG4gIERlcG9zaXRPZmZlcixcbiAgR2V0Q3VycmVudFZhbGlkYXRvcnNQYXJhbXMsXG4gIEdldFBlbmRpbmdWYWxpZGF0b3JzUGFyYW1zLFxuICBHZXRSZXdhcmRVVFhPc1BhcmFtcyxcbiAgR2V0UmV3YXJkVVRYT3NSZXNwb25zZSxcbiAgR2V0U3Rha2VQYXJhbXMsXG4gIEdldFN0YWtlUmVzcG9uc2UsXG4gIEdldENvbmZpZ3VyYXRpb25SZXNwb25zZSxcbiAgU3VibmV0LFxuICBHZXRWYWxpZGF0b3JzQXRQYXJhbXMsXG4gIEdldFZhbGlkYXRvcnNBdFJlc3BvbnNlLFxuICBDcmVhdGVBZGRyZXNzUGFyYW1zLFxuICBHZXRVVFhPc1BhcmFtcyxcbiAgR2V0QmFsYW5jZVJlc3BvbnNlLFxuICBHZXRVVFhPc1Jlc3BvbnNlLFxuICBMaXN0QWRkcmVzc2VzUGFyYW1zLFxuICBTYW1wbGVWYWxpZGF0b3JzUGFyYW1zLFxuICBBZGRWYWxpZGF0b3JQYXJhbXMsXG4gIEFkZERlbGVnYXRvclBhcmFtcyxcbiAgQ3JlYXRlU3VibmV0UGFyYW1zLFxuICBFeHBvcnRBVkFYUGFyYW1zLFxuICBFeHBvcnRLZXlQYXJhbXMsXG4gIEltcG9ydEtleVBhcmFtcyxcbiAgSW1wb3J0QVZBWFBhcmFtcyxcbiAgQ3JlYXRlQmxvY2tjaGFpblBhcmFtcyxcbiAgQmxvY2tjaGFpbixcbiAgR2V0VHhTdGF0dXNQYXJhbXMsXG4gIEdldFR4U3RhdHVzUmVzcG9uc2UsXG4gIEdldE1pblN0YWtlUmVzcG9uc2UsXG4gIEdldE1heFN0YWtlQW1vdW50UGFyYW1zLFxuICBTcGVuZFBhcmFtcyxcbiAgU3BlbmRSZXBseSxcbiAgQWRkcmVzc1BhcmFtcyxcbiAgTXVsdGlzaWdBbGlhc1JlcGx5LFxuICBHZXRDbGFpbWFibGVzUmVzcG9uc2UsXG4gIEdldEFsbERlcG9zaXRPZmZlcnNQYXJhbXMsXG4gIEdldEFsbERlcG9zaXRPZmZlcnNSZXNwb25zZSxcbiAgR2V0RGVwb3NpdHNQYXJhbXMsXG4gIEdldERlcG9zaXRzUmVzcG9uc2UsXG4gIE93bmVyLFxuICBPd25lclBhcmFtXG59IGZyb20gXCIuL2ludGVyZmFjZXNcIlxuaW1wb3J0IHsgVHJhbnNmZXJhYmxlSW5wdXQgfSBmcm9tIFwiLi9pbnB1dHNcIlxuaW1wb3J0IHsgVHJhbnNmZXJhYmxlT3V0cHV0IH0gZnJvbSBcIi4vb3V0cHV0c1wiXG5pbXBvcnQgeyBTZXJpYWxpemF0aW9uLCBTZXJpYWxpemVkVHlwZSB9IGZyb20gXCIuLi8uLi91dGlsc1wiXG5pbXBvcnQgeyBHZW5lc2lzRGF0YSB9IGZyb20gXCIuLi9hdm1cIlxuaW1wb3J0IHsgQXV0aCwgTG9ja01vZGUsIEJ1aWxkZXIsIEZyb21TaWduZXIsIE5vZGVPd25lciB9IGZyb20gXCIuL2J1aWxkZXJcIlxuaW1wb3J0IHsgTmV0d29yayB9IGZyb20gXCIuLi8uLi91dGlscy9uZXR3b3Jrc1wiXG5pbXBvcnQgeyBTcGVuZGVyIH0gZnJvbSBcIi4vc3BlbmRlclwiXG5cbi8qKlxuICogQGlnbm9yZVxuICovXG5jb25zdCBiaW50b29sczogQmluVG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpXG5jb25zdCBzZXJpYWxpemF0aW9uOiBTZXJpYWxpemF0aW9uID0gU2VyaWFsaXphdGlvbi5nZXRJbnN0YW5jZSgpXG5cbmNvbnN0IE5hbm9CTiA9IG5ldyBCTigxMDAwMDAwMDAwKVxuY29uc3QgcmV3YXJkUGVyY2VudERlbm9tID0gMTAwMDAwMFxuXG50eXBlIEZyb21UeXBlID0gU3RyaW5nW10gfCBTdHJpbmdbXVtdXG50eXBlIE5vZGVPd25lclR5cGUgPSB7XG4gIGFkZHJlc3M6IHN0cmluZ1xuICBhdXRoOiBbbnVtYmVyLCBzdHJpbmddW11cbn1cblxuLyoqXG4gKiBDbGFzcyBmb3IgaW50ZXJhY3Rpbmcgd2l0aCBhIG5vZGUncyBQbGF0Zm9ybVZNQVBJXG4gKlxuICogQGNhdGVnb3J5IFJQQ0FQSXNcbiAqXG4gKiBAcmVtYXJrcyBUaGlzIGV4dGVuZHMgdGhlIFtbSlJQQ0FQSV1dIGNsYXNzLiBUaGlzIGNsYXNzIHNob3VsZCBub3QgYmUgZGlyZWN0bHkgY2FsbGVkLiBJbnN0ZWFkLCB1c2UgdGhlIFtbQXZhbGFuY2hlLmFkZEFQSV1dIGZ1bmN0aW9uIHRvIHJlZ2lzdGVyIHRoaXMgaW50ZXJmYWNlIHdpdGggQXZhbGFuY2hlLlxuICovXG5leHBvcnQgY2xhc3MgUGxhdGZvcm1WTUFQSSBleHRlbmRzIEpSUENBUEkge1xuICAvKipcbiAgICogQGlnbm9yZVxuICAgKi9cbiAgcHJvdGVjdGVkIGtleWNoYWluOiBLZXlDaGFpbiA9IG5ldyBLZXlDaGFpbihcIlwiLCBcIlwiKVxuXG4gIHByb3RlY3RlZCBibG9ja2NoYWluSUQ6IHN0cmluZyA9IFwiXCJcblxuICBwcm90ZWN0ZWQgYmxvY2tjaGFpbkFsaWFzOiBzdHJpbmcgPSB1bmRlZmluZWRcblxuICBwcm90ZWN0ZWQgQVZBWEFzc2V0SUQ6IEJ1ZmZlciA9IHVuZGVmaW5lZFxuXG4gIHByb3RlY3RlZCB0eEZlZTogQk4gPSB1bmRlZmluZWRcblxuICBwcm90ZWN0ZWQgY3JlYXRpb25UeEZlZTogQk4gPSB1bmRlZmluZWRcblxuICBwcm90ZWN0ZWQgbWluVmFsaWRhdG9yU3Rha2U6IEJOID0gdW5kZWZpbmVkXG5cbiAgcHJvdGVjdGVkIG1pbkRlbGVnYXRvclN0YWtlOiBCTiA9IHVuZGVmaW5lZFxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBhbGlhcyBmb3IgdGhlIGJsb2NrY2hhaW5JRCBpZiBpdCBleGlzdHMsIG90aGVyd2lzZSByZXR1cm5zIGB1bmRlZmluZWRgLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgYWxpYXMgZm9yIHRoZSBibG9ja2NoYWluSURcbiAgICovXG4gIGdldEJsb2NrY2hhaW5BbGlhcyA9ICgpOiBzdHJpbmcgPT4ge1xuICAgIHJldHVybiB0aGlzLmNvcmUuZ2V0TmV0d29yaygpLlAuYWxpYXNcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjdXJyZW50IG5ldHdvcmssIGZldGNoZWQgdmlhIGF2YWxhbmNoZS5mZXRjaE5ldHdvcmtTZXR0aW5ncy5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGN1cnJlbnQgTmV0d29ya1xuICAgKi9cbiAgZ2V0TmV0d29yayA9ICgpOiBOZXR3b3JrID0+IHtcbiAgICByZXR1cm4gdGhpcy5jb3JlLmdldE5ldHdvcmsoKVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGJsb2NrY2hhaW5JRCBhbmQgcmV0dXJucyBpdC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGJsb2NrY2hhaW5JRFxuICAgKi9cbiAgZ2V0QmxvY2tjaGFpbklEID0gKCk6IHN0cmluZyA9PiB0aGlzLmJsb2NrY2hhaW5JRFxuXG4gIC8qKlxuICAgKiBUYWtlcyBhbiBhZGRyZXNzIHN0cmluZyBhbmQgcmV0dXJucyBpdHMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50YXRpb24gaWYgdmFsaWQuXG4gICAqXG4gICAqIEByZXR1cm5zIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gZm9yIHRoZSBhZGRyZXNzIGlmIHZhbGlkLCB1bmRlZmluZWQgaWYgbm90IHZhbGlkLlxuICAgKi9cbiAgcGFyc2VBZGRyZXNzID0gKGFkZHI6IHN0cmluZyk6IEJ1ZmZlciA9PiB7XG4gICAgY29uc3QgYWxpYXM6IHN0cmluZyA9IHRoaXMuZ2V0QmxvY2tjaGFpbkFsaWFzKClcbiAgICBjb25zdCBibG9ja2NoYWluSUQ6IHN0cmluZyA9IHRoaXMuZ2V0QmxvY2tjaGFpbklEKClcbiAgICByZXR1cm4gYmludG9vbHMucGFyc2VBZGRyZXNzKFxuICAgICAgYWRkcixcbiAgICAgIGJsb2NrY2hhaW5JRCxcbiAgICAgIGFsaWFzLFxuICAgICAgUGxhdGZvcm1WTUNvbnN0YW50cy5BRERSRVNTTEVOR1RIXG4gICAgKVxuICB9XG5cbiAgYWRkcmVzc0Zyb21CdWZmZXIgPSAoYWRkcmVzczogQnVmZmVyKTogc3RyaW5nID0+IHtcbiAgICBjb25zdCBjaGFpbmlkOiBzdHJpbmcgPSB0aGlzLmdldEJsb2NrY2hhaW5BbGlhcygpXG4gICAgICA/IHRoaXMuZ2V0QmxvY2tjaGFpbkFsaWFzKClcbiAgICAgIDogdGhpcy5nZXRCbG9ja2NoYWluSUQoKVxuICAgIGNvbnN0IHR5cGU6IFNlcmlhbGl6ZWRUeXBlID0gXCJiZWNoMzJcIlxuICAgIHJldHVybiBzZXJpYWxpemF0aW9uLmJ1ZmZlclRvVHlwZShcbiAgICAgIGFkZHJlc3MsXG4gICAgICB0eXBlLFxuICAgICAgdGhpcy5jb3JlLmdldEhSUCgpLFxuICAgICAgY2hhaW5pZFxuICAgIClcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaGVzIHRoZSBBVkFYIEFzc2V0SUQgYW5kIHJldHVybnMgaXQgaW4gYSBQcm9taXNlLlxuICAgKlxuICAgKiBAcGFyYW0gcmVmcmVzaCBUaGlzIGZ1bmN0aW9uIGNhY2hlcyB0aGUgcmVzcG9uc2UuIFJlZnJlc2ggPSB0cnVlIHdpbGwgYnVzdCB0aGUgY2FjaGUuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSB0aGUgcHJvdmlkZWQgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgQVZBWCBBc3NldElEXG4gICAqL1xuICBnZXRBVkFYQXNzZXRJRCA9IGFzeW5jIChyZWZyZXNoOiBib29sZWFuID0gZmFsc2UpOiBQcm9taXNlPEJ1ZmZlcj4gPT4ge1xuICAgIGlmICh0eXBlb2YgdGhpcy5BVkFYQXNzZXRJRCA9PT0gXCJ1bmRlZmluZWRcIiB8fCByZWZyZXNoKSB7XG4gICAgICB0aGlzLkFWQVhBc3NldElEID0gYmludG9vbHMuY2I1OERlY29kZShcbiAgICAgICAgdGhpcy5jb3JlLmdldE5ldHdvcmsoKS5YLmF2YXhBc3NldElEXG4gICAgICApXG4gICAgfVxuICAgIHJldHVybiB0aGlzLkFWQVhBc3NldElEXG4gIH1cblxuICAvKipcbiAgICogT3ZlcnJpZGVzIHRoZSBkZWZhdWx0cyBhbmQgc2V0cyB0aGUgY2FjaGUgdG8gYSBzcGVjaWZpYyBBVkFYIEFzc2V0SURcbiAgICpcbiAgICogQHBhcmFtIGF2YXhBc3NldElEIEEgY2I1OCBzdHJpbmcgb3IgQnVmZmVyIHJlcHJlc2VudGluZyB0aGUgQVZBWCBBc3NldElEXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSB0aGUgcHJvdmlkZWQgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgQVZBWCBBc3NldElEXG4gICAqL1xuICBzZXRBVkFYQXNzZXRJRCA9IChhdmF4QXNzZXRJRDogc3RyaW5nIHwgQnVmZmVyKSA9PiB7XG4gICAgaWYgKHR5cGVvZiBhdmF4QXNzZXRJRCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgYXZheEFzc2V0SUQgPSBiaW50b29scy5jYjU4RGVjb2RlKGF2YXhBc3NldElEKVxuICAgIH1cbiAgICB0aGlzLkFWQVhBc3NldElEID0gYXZheEFzc2V0SURcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBkZWZhdWx0IHR4IGZlZSBmb3IgdGhpcyBjaGFpbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGRlZmF1bHQgdHggZmVlIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICovXG4gIGdldERlZmF1bHRUeEZlZSA9ICgpOiBCTiA9PiB7XG4gICAgcmV0dXJuIG5ldyBCTih0aGlzLmNvcmUuZ2V0TmV0d29yaygpLlAudHhGZWUpXG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdHggZmVlIGZvciB0aGlzIGNoYWluLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgdHggZmVlIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICovXG4gIGdldFR4RmVlID0gKCk6IEJOID0+IHtcbiAgICBpZiAodHlwZW9mIHRoaXMudHhGZWUgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHRoaXMudHhGZWUgPSB0aGlzLmdldERlZmF1bHRUeEZlZSgpXG4gICAgfVxuICAgIHJldHVybiB0aGlzLnR4RmVlXG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgQ3JlYXRlU3VibmV0VHggZmVlLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgQ3JlYXRlU3VibmV0VHggZmVlIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICovXG4gIGdldENyZWF0ZVN1Ym5ldFR4RmVlID0gKCk6IEJOID0+IHtcbiAgICByZXR1cm4gbmV3IEJOKHRoaXMuY29yZS5nZXROZXR3b3JrKCkuUC5jcmVhdGVTdWJuZXRUeCA/PyAwKVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIENyZWF0ZUNoYWluVHggZmVlLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgQ3JlYXRlQ2hhaW5UeCBmZWUgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKi9cbiAgZ2V0Q3JlYXRlQ2hhaW5UeEZlZSA9ICgpOiBCTiA9PiB7XG4gICAgcmV0dXJuIG5ldyBCTih0aGlzLmNvcmUuZ2V0TmV0d29yaygpLlAuY3JlYXRlQ2hhaW5UeCA/PyAwKVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHR4IGZlZSBmb3IgdGhpcyBjaGFpbi5cbiAgICpcbiAgICogQHBhcmFtIGZlZSBUaGUgdHggZmVlIGFtb3VudCB0byBzZXQgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICovXG4gIHNldFR4RmVlID0gKGZlZTogQk4pID0+IHtcbiAgICB0aGlzLnR4RmVlID0gZmVlXG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZGVmYXVsdCBjcmVhdGlvbiBmZWUgZm9yIHRoaXMgY2hhaW4uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBkZWZhdWx0IGNyZWF0aW9uIGZlZSBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqL1xuICBnZXREZWZhdWx0Q3JlYXRpb25UeEZlZSA9ICgpOiBCTiA9PiB7XG4gICAgcmV0dXJuIG5ldyBCTih0aGlzLmNvcmUuZ2V0TmV0d29yaygpLlAuY3JlYXRpb25UeEZlZSlcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjcmVhdGlvbiBmZWUgZm9yIHRoaXMgY2hhaW4uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBjcmVhdGlvbiBmZWUgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKi9cbiAgZ2V0Q3JlYXRpb25UeEZlZSA9ICgpOiBCTiA9PiB7XG4gICAgaWYgKHR5cGVvZiB0aGlzLmNyZWF0aW9uVHhGZWUgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHRoaXMuY3JlYXRpb25UeEZlZSA9IHRoaXMuZ2V0RGVmYXVsdENyZWF0aW9uVHhGZWUoKVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5jcmVhdGlvblR4RmVlXG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgY3JlYXRpb24gZmVlIGZvciB0aGlzIGNoYWluLlxuICAgKlxuICAgKiBAcGFyYW0gZmVlIFRoZSBjcmVhdGlvbiBmZWUgYW1vdW50IHRvIHNldCBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKi9cbiAgc2V0Q3JlYXRpb25UeEZlZSA9IChmZWU6IEJOKSA9PiB7XG4gICAgdGhpcy5jcmVhdGlvblR4RmVlID0gZmVlXG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhIHJlZmVyZW5jZSB0byB0aGUga2V5Y2hhaW4gZm9yIHRoaXMgY2xhc3MuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBpbnN0YW5jZSBvZiBbW11dIGZvciB0aGlzIGNsYXNzXG4gICAqL1xuICBrZXlDaGFpbiA9ICgpOiBLZXlDaGFpbiA9PiB0aGlzLmtleWNoYWluXG5cbiAgLyoqXG4gICAqIEBpZ25vcmVcbiAgICovXG4gIG5ld0tleUNoYWluID0gKCk6IEtleUNoYWluID0+IHtcbiAgICAvLyB3YXJuaW5nLCBvdmVyd3JpdGVzIHRoZSBvbGQga2V5Y2hhaW5cbiAgICBjb25zdCBhbGlhcyA9IHRoaXMuZ2V0QmxvY2tjaGFpbkFsaWFzKClcbiAgICBpZiAoYWxpYXMpIHtcbiAgICAgIHRoaXMua2V5Y2hhaW4gPSBuZXcgS2V5Q2hhaW4odGhpcy5jb3JlLmdldEhSUCgpLCBhbGlhcylcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5rZXljaGFpbiA9IG5ldyBLZXlDaGFpbih0aGlzLmNvcmUuZ2V0SFJQKCksIHRoaXMuYmxvY2tjaGFpbklEKVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5rZXljaGFpblxuICB9XG5cbiAgLyoqXG4gICAqIEhlbHBlciBmdW5jdGlvbiB3aGljaCBkZXRlcm1pbmVzIGlmIGEgdHggaXMgYSBnb29zZSBlZ2cgdHJhbnNhY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSB1dHggQW4gVW5zaWduZWRUeFxuICAgKlxuICAgKiBAcmV0dXJucyBib29sZWFuIHRydWUgaWYgcGFzc2VzIGdvb3NlIGVnZyB0ZXN0IGFuZCBmYWxzZSBpZiBmYWlscy5cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogQSBcIkdvb3NlIEVnZyBUcmFuc2FjdGlvblwiIGlzIHdoZW4gdGhlIGZlZSBmYXIgZXhjZWVkcyBhIHJlYXNvbmFibGUgYW1vdW50XG4gICAqL1xuICBjaGVja0dvb3NlRWdnID0gYXN5bmMgKFxuICAgIHV0eDogVW5zaWduZWRUeCxcbiAgICBvdXRUb3RhbDogQk4gPSBaZXJvQk5cbiAgKTogUHJvbWlzZTxib29sZWFuPiA9PiB7XG4gICAgY29uc3QgYXZheEFzc2V0SUQ6IEJ1ZmZlciA9IGF3YWl0IHRoaXMuZ2V0QVZBWEFzc2V0SUQoKVxuICAgIGxldCBvdXRwdXRUb3RhbDogQk4gPSBvdXRUb3RhbC5ndChaZXJvQk4pXG4gICAgICA/IG91dFRvdGFsXG4gICAgICA6IHV0eC5nZXRPdXRwdXRUb3RhbChhdmF4QXNzZXRJRClcbiAgICBjb25zdCBmZWU6IEJOID0gdXR4LmdldEJ1cm4oYXZheEFzc2V0SUQpXG4gICAgaWYgKGZlZS5sdGUoT05FQVZBWC5tdWwobmV3IEJOKDEwKSkpIHx8IGZlZS5sdGUob3V0cHV0VG90YWwpKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmVzIGFuIGFzc2V0SUQgZm9yIGEgc3VibmV0XCJzIHN0YWtpbmcgYXNzc2V0LlxuICAgKlxuICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZSBzdHJpbmcgd2l0aCBjYjU4IGVuY29kZWQgdmFsdWUgb2YgdGhlIGFzc2V0SUQuXG4gICAqL1xuICBnZXRTdGFraW5nQXNzZXRJRCA9IGFzeW5jICgpOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5nZXRTdGFraW5nQXNzZXRJRFwiXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5hc3NldElEXG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBibG9ja2NoYWluLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIHVzZXJuYW1lIG9mIHRoZSBLZXlzdG9yZSB1c2VyIHRoYXQgY29udHJvbHMgdGhlIG5ldyBhY2NvdW50XG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgb2YgdGhlIEtleXN0b3JlIHVzZXIgdGhhdCBjb250cm9scyB0aGUgbmV3IGFjY291bnRcbiAgICogQHBhcmFtIHN1Ym5ldElEIE9wdGlvbmFsLiBFaXRoZXIgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvciBhbiBjYjU4IHNlcmlhbGl6ZWQgc3RyaW5nIGZvciB0aGUgU3VibmV0SUQgb3IgaXRzIGFsaWFzLlxuICAgKiBAcGFyYW0gdm1JRCBUaGUgSUQgb2YgdGhlIFZpcnR1YWwgTWFjaGluZSB0aGUgYmxvY2tjaGFpbiBydW5zLiBDYW4gYWxzbyBiZSBhbiBhbGlhcyBvZiB0aGUgVmlydHVhbCBNYWNoaW5lLlxuICAgKiBAcGFyYW0gZnhJRHMgVGhlIGlkcyBvZiB0aGUgRlhzIHRoZSBWTSBpcyBydW5uaW5nLlxuICAgKiBAcGFyYW0gbmFtZSBBIGh1bWFuLXJlYWRhYmxlIG5hbWUgZm9yIHRoZSBuZXcgYmxvY2tjaGFpblxuICAgKiBAcGFyYW0gZ2VuZXNpcyBUaGUgYmFzZSA1OCAod2l0aCBjaGVja3N1bSkgcmVwcmVzZW50YXRpb24gb2YgdGhlIGdlbmVzaXMgc3RhdGUgb2YgdGhlIG5ldyBibG9ja2NoYWluLiBWaXJ0dWFsIE1hY2hpbmVzIHNob3VsZCBoYXZlIGEgc3RhdGljIEFQSSBtZXRob2QgbmFtZWQgYnVpbGRHZW5lc2lzIHRoYXQgY2FuIGJlIHVzZWQgdG8gZ2VuZXJhdGUgZ2VuZXNpc0RhdGEuXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIHRoZSB1bnNpZ25lZCB0cmFuc2FjdGlvbiB0byBjcmVhdGUgdGhpcyBibG9ja2NoYWluLiBNdXN0IGJlIHNpZ25lZCBieSBhIHN1ZmZpY2llbnQgbnVtYmVyIG9mIHRoZSBTdWJuZXTigJlzIGNvbnRyb2wga2V5cyBhbmQgYnkgdGhlIGFjY291bnQgcGF5aW5nIHRoZSB0cmFuc2FjdGlvbiBmZWUuXG4gICAqL1xuICBjcmVhdGVCbG9ja2NoYWluID0gYXN5bmMgKFxuICAgIHVzZXJuYW1lOiBzdHJpbmcsXG4gICAgcGFzc3dvcmQ6IHN0cmluZyxcbiAgICBzdWJuZXRJRDogQnVmZmVyIHwgc3RyaW5nID0gdW5kZWZpbmVkLFxuICAgIHZtSUQ6IHN0cmluZyxcbiAgICBmeElEczogbnVtYmVyW10sXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGdlbmVzaXM6IHN0cmluZ1xuICApOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogQ3JlYXRlQmxvY2tjaGFpblBhcmFtcyA9IHtcbiAgICAgIHVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmQsXG4gICAgICBmeElEcyxcbiAgICAgIHZtSUQsXG4gICAgICBuYW1lLFxuICAgICAgZ2VuZXNpc0RhdGE6IGdlbmVzaXNcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBzdWJuZXRJRCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgcGFyYW1zLnN1Ym5ldElEID0gc3VibmV0SURcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBzdWJuZXRJRCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgcGFyYW1zLnN1Ym5ldElEID0gYmludG9vbHMuY2I1OEVuY29kZShzdWJuZXRJRClcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmNyZWF0ZUJsb2NrY2hhaW5cIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQudHhJRFxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHN0YXR1cyBvZiBhIGJsb2NrY2hhaW4uXG4gICAqXG4gICAqIEBwYXJhbSBibG9ja2NoYWluSUQgVGhlIGJsb2NrY2hhaW5JRCByZXF1ZXN0aW5nIGEgc3RhdHVzIHVwZGF0ZVxuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhIHN0cmluZyBvZiBvbmUgb2Y6IFwiVmFsaWRhdGluZ1wiLCBcIkNyZWF0ZWRcIiwgXCJQcmVmZXJyZWRcIiwgXCJVbmtub3duXCIuXG4gICAqL1xuICBnZXRCbG9ja2NoYWluU3RhdHVzID0gYXN5bmMgKGJsb2NrY2hhaW5JRDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IGFueSA9IHtcbiAgICAgIGJsb2NrY2hhaW5JRFxuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uZ2V0QmxvY2tjaGFpblN0YXR1c1wiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5zdGF0dXNcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIHZhbGlkYXRvcnMgYW5kIHRoZWlyIHdlaWdodHMgb2YgYSBzdWJuZXQgb3IgdGhlIFByaW1hcnkgTmV0d29yayBhdCBhIGdpdmVuIFAtQ2hhaW4gaGVpZ2h0LlxuICAgKlxuICAgKiBAcGFyYW0gaGVpZ2h0IFRoZSBQLUNoYWluIGhlaWdodCB0byBnZXQgdGhlIHZhbGlkYXRvciBzZXQgYXQuXG4gICAqIEBwYXJhbSBzdWJuZXRJRCBPcHRpb25hbC4gQSBjYjU4IHNlcmlhbGl6ZWQgc3RyaW5nIGZvciB0aGUgU3VibmV0SUQgb3IgaXRzIGFsaWFzLlxuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIEdldFZhbGlkYXRvcnNBdFJlc3BvbnNlXG4gICAqL1xuICBnZXRWYWxpZGF0b3JzQXQgPSBhc3luYyAoXG4gICAgaGVpZ2h0OiBudW1iZXIsXG4gICAgc3VibmV0SUQ/OiBzdHJpbmdcbiAgKTogUHJvbWlzZTxHZXRWYWxpZGF0b3JzQXRSZXNwb25zZT4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogR2V0VmFsaWRhdG9yc0F0UGFyYW1zID0ge1xuICAgICAgaGVpZ2h0XG4gICAgfVxuICAgIGlmICh0eXBlb2Ygc3VibmV0SUQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHBhcmFtcy5zdWJuZXRJRCA9IHN1Ym5ldElEXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5nZXRWYWxpZGF0b3JzQXRcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHRcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYW4gYWRkcmVzcyBpbiB0aGUgbm9kZSdzIGtleXN0b3JlLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIHVzZXJuYW1lIG9mIHRoZSBLZXlzdG9yZSB1c2VyIHRoYXQgY29udHJvbHMgdGhlIG5ldyBhY2NvdW50XG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgb2YgdGhlIEtleXN0b3JlIHVzZXIgdGhhdCBjb250cm9scyB0aGUgbmV3IGFjY291bnRcbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYSBzdHJpbmcgb2YgdGhlIG5ld2x5IGNyZWF0ZWQgYWNjb3VudCBhZGRyZXNzLlxuICAgKi9cbiAgY3JlYXRlQWRkcmVzcyA9IGFzeW5jIChcbiAgICB1c2VybmFtZTogc3RyaW5nLFxuICAgIHBhc3N3b3JkOiBzdHJpbmdcbiAgKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IENyZWF0ZUFkZHJlc3NQYXJhbXMgPSB7XG4gICAgICB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5jcmVhdGVBZGRyZXNzXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LmFkZHJlc3NcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBiYWxhbmNlIG9mIGEgcGFydGljdWxhciBhc3NldC5cbiAgICpcbiAgICogQHBhcmFtIGFkZHJlc3MgVGhlIGFkZHJlc3MgdG8gcHVsbCB0aGUgYXNzZXQgYmFsYW5jZSBmcm9tXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2Ugd2l0aCB0aGUgYmFsYW5jZSBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59IG9uIHRoZSBwcm92aWRlZCBhZGRyZXNzLlxuICAgKi9cbiAgZ2V0QmFsYW5jZSA9IGFzeW5jIChwYXJhbXM6IHtcbiAgICBhZGRyZXNzPzogc3RyaW5nXG4gICAgYWRkcmVzc2VzPzogc3RyaW5nW11cbiAgfSk6IFByb21pc2U8R2V0QmFsYW5jZVJlc3BvbnNlPiA9PiB7XG4gICAgaWYgKFxuICAgICAgcGFyYW1zLmFkZHJlc3MgJiZcbiAgICAgIHR5cGVvZiB0aGlzLnBhcnNlQWRkcmVzcyhwYXJhbXMuYWRkcmVzcykgPT09IFwidW5kZWZpbmVkXCJcbiAgICApIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgQWRkcmVzc0Vycm9yKFxuICAgICAgICBcIkVycm9yIC0gUGxhdGZvcm1WTUFQSS5nZXRCYWxhbmNlOiBJbnZhbGlkIGFkZHJlc3MgZm9ybWF0XCJcbiAgICAgIClcbiAgICB9XG4gICAgcGFyYW1zLmFkZHJlc3Nlcz8uZm9yRWFjaCgoYWRkcmVzcykgPT4ge1xuICAgICAgaWYgKHR5cGVvZiB0aGlzLnBhcnNlQWRkcmVzcyhhZGRyZXNzKSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICB0aHJvdyBuZXcgQWRkcmVzc0Vycm9yKFxuICAgICAgICAgIFwiRXJyb3IgLSBQbGF0Zm9ybVZNQVBJLmdldEJhbGFuY2U6IEludmFsaWQgYWRkcmVzcyBmb3JtYXRcIlxuICAgICAgICApXG4gICAgICB9XG4gICAgfSlcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uZ2V0QmFsYW5jZVwiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuXG4gICAgY29uc3QgcmVzdWx0ID0gcmVzcG9uc2UuZGF0YS5yZXN1bHRcblxuICAgIGNvbnN0IHBhcnNlRGljdCA9IChpbnB1dDogYW55W10pOiBCYWxhbmNlRGljdCA9PiB7XG4gICAgICBsZXQgZGljdDogQmFsYW5jZURpY3QgPSB7fVxuICAgICAgZm9yIChjb25zdCBbaywgdl0gb2YgT2JqZWN0LmVudHJpZXMoaW5wdXQpKSBkaWN0W2tdID0gbmV3IEJOKHYpXG4gICAgICByZXR1cm4gZGljdCBhcyBCYWxhbmNlRGljdFxuICAgIH1cblxuICAgIGlmICh0aGlzLmNvcmUuZ2V0TmV0d29yaygpLlAubG9ja01vZGVCb25kRGVwb3NpdCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgYmFsYW5jZXM6IHBhcnNlRGljdChyZXN1bHQuYmFsYW5jZXMpLFxuICAgICAgICB1bmxvY2tlZE91dHB1dHM6IHBhcnNlRGljdChyZXN1bHQudW5sb2NrZWRPdXRwdXRzKSxcbiAgICAgICAgYm9uZGVkT3V0cHV0czogcGFyc2VEaWN0KHJlc3VsdC5ib25kZWRPdXRwdXRzKSxcbiAgICAgICAgZGVwb3NpdGVkT3V0cHV0czogcGFyc2VEaWN0KHJlc3VsdC5kZXBvc2l0ZWRPdXRwdXRzKSxcbiAgICAgICAgYm9uZGVkRGVwb3NpdGVkT3V0cHV0czogcGFyc2VEaWN0KHJlc3VsdC5ib25kZWREZXBvc2l0ZWRPdXRwdXRzKSxcbiAgICAgICAgdXR4b0lEczogcmVzdWx0LnV0eG9JRHNcbiAgICAgIH0gYXMgR2V0QmFsYW5jZVJlc3BvbnNlXG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBiYWxhbmNlOiBuZXcgQk4ocmVzdWx0LmJhbGFuY2UpLFxuICAgICAgdW5sb2NrZWQ6IG5ldyBCTihyZXN1bHQudW5sb2NrZWQpLFxuICAgICAgbG9ja2VkU3Rha2VhYmxlOiBuZXcgQk4ocmVzdWx0LmxvY2tlZFN0YWtlYWJsZSksXG4gICAgICBsb2NrZWROb3RTdGFrZWFibGU6IG5ldyBCTihyZXN1bHQubG9ja2VkTm90U3Rha2VhYmxlKSxcbiAgICAgIHV0eG9JRHM6IHJlc3VsdC51dHhvSURzXG4gICAgfSBhcyBHZXRCYWxhbmNlUmVzcG9uc2VcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IHRoZSBhZGRyZXNzZXMgY29udHJvbGxlZCBieSB0aGUgdXNlci5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSB1c2VybmFtZSBvZiB0aGUgS2V5c3RvcmUgdXNlclxuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIG9mIHRoZSBLZXlzdG9yZSB1c2VyXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGFuIGFycmF5IG9mIGFkZHJlc3Nlcy5cbiAgICovXG4gIGxpc3RBZGRyZXNzZXMgPSBhc3luYyAoXG4gICAgdXNlcm5hbWU6IHN0cmluZyxcbiAgICBwYXNzd29yZDogc3RyaW5nXG4gICk6IFByb21pc2U8c3RyaW5nW10+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IExpc3RBZGRyZXNzZXNQYXJhbXMgPSB7XG4gICAgICB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5saXN0QWRkcmVzc2VzXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LmFkZHJlc3Nlc1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3RzIHRoZSBzZXQgb2YgY3VycmVudCB2YWxpZGF0b3JzLlxuICAgKlxuICAgKiBAcGFyYW0gc3VibmV0SUQgT3B0aW9uYWwuIEVpdGhlciBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9yIGFuXG4gICAqIGNiNTggc2VyaWFsaXplZCBzdHJpbmcgZm9yIHRoZSBTdWJuZXRJRCBvciBpdHMgYWxpYXMuXG4gICAqIEBwYXJhbSBub2RlSURzIE9wdGlvbmFsLiBBbiBhcnJheSBvZiBzdHJpbmdzXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGFuIGFycmF5IG9mIHZhbGlkYXRvcnMgdGhhdCBhcmUgY3VycmVudGx5IHN0YWtpbmcsIHNlZToge0BsaW5rIGh0dHBzOi8vZG9jcy5hdmF4Lm5ldHdvcmsvdjEuMC9lbi9hcGkvcGxhdGZvcm0vI3BsYXRmb3JtZ2V0Y3VycmVudHZhbGlkYXRvcnN8cGxhdGZvcm0uZ2V0Q3VycmVudFZhbGlkYXRvcnMgZG9jdW1lbnRhdGlvbn0uXG4gICAqXG4gICAqL1xuICBnZXRDdXJyZW50VmFsaWRhdG9ycyA9IGFzeW5jIChcbiAgICBzdWJuZXRJRDogQnVmZmVyIHwgc3RyaW5nID0gdW5kZWZpbmVkLFxuICAgIG5vZGVJRHM6IHN0cmluZ1tdID0gdW5kZWZpbmVkXG4gICk6IFByb21pc2U8b2JqZWN0PiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBHZXRDdXJyZW50VmFsaWRhdG9yc1BhcmFtcyA9IHt9XG4gICAgaWYgKHR5cGVvZiBzdWJuZXRJRCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgcGFyYW1zLnN1Ym5ldElEID0gc3VibmV0SURcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBzdWJuZXRJRCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgcGFyYW1zLnN1Ym5ldElEID0gYmludG9vbHMuY2I1OEVuY29kZShzdWJuZXRJRClcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBub2RlSURzICE9IFwidW5kZWZpbmVkXCIgJiYgbm9kZUlEcy5sZW5ndGggPiAwKSB7XG4gICAgICBwYXJhbXMubm9kZUlEcyA9IG5vZGVJRHNcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmdldEN1cnJlbnRWYWxpZGF0b3JzXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0XG4gIH1cblxuICAvKipcbiAgICogQSByZXF1ZXN0IHRoYXQgaW4gYWRkcmVzcyBmaWVsZCBhY2NlcHRzIGVpdGhlciBhIG5vZGVJRCAoYW5kIHJldHVybnMgYSBiZWNoMzIgYWRkcmVzcyBpZiBpdCBleGlzdHMpLCBvciBhIGJlY2gzMiBhZGRyZXNzIChhbmQgcmV0dXJucyBhIE5vZGVJRCBpZiBpdCBleGlzdHMpLlxuICAgKlxuICAgKiBAcGFyYW0gYWRkcmVzcyBBIG5vZGVJRCBvciBhIGJlY2gzMiBhZGRyZXNzXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGEgc3RyaW5nIGNvbnRhaW5pbmcgYmVjaDMyIGFkZHJlc3MgdGhhdCBpcyB0aGUgbm9kZSBvd25lciBvciBub2RlSUQgdGhhdCB0aGUgYWRkcmVzcyBwYXNzZWQgaXMgYW4gb3duZXIgb2YuXG4gICAqL1xuICBnZXRSZWdpc3RlcmVkU2hvcnRJRExpbmsgPSBhc3luYyAoYWRkcmVzczogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBjb25zdCBwYXJhbXMgPSB7XG4gICAgICBhZGRyZXNzXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5nZXRSZWdpc3RlcmVkU2hvcnRJRExpbmtcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuYWRkcmVzc1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYWN0aXZlIG9yIGluYWN0aXZlIGRlcG9zaXQgb2ZmZXJzLlxuICAgKlxuICAgKiBAcGFyYW0gYWN0aXZlIEEgYm9vbGVhbiBpbmRpY2F0aW5nIHdoZXRoZXIgdG8gcmV0dXJuIGFjdGl2ZSBvciBpbmFjdGl2ZSBkZXBvc2l0IG9mZmVycy5cbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYSBsaXN0IGNvbnRhaW5pbmcgZGVwb3NpdCBvZmZlcnMuXG4gICAqL1xuICBnZXRBbGxEZXBvc2l0T2ZmZXJzID0gYXN5bmMgKGFjdGl2ZT86IGJvb2xlYW4pOiBQcm9taXNlPERlcG9zaXRPZmZlcltdPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBHZXRBbGxEZXBvc2l0T2ZmZXJzUGFyYW1zID0ge1xuICAgICAgYWN0aXZlXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5nZXRBbGxEZXBvc2l0T2ZmZXJzXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG5cbiAgICBjb25zdCBvZmZlcnM6IEdldEFsbERlcG9zaXRPZmZlcnNSZXNwb25zZSA9IHJlc3BvbnNlLmRhdGEucmVzdWx0XG4gICAgaWYgKCFvZmZlcnMuZGVwb3NpdE9mZmVycykgcmV0dXJuIFtdXG4gICAgcmV0dXJuIG9mZmVycy5kZXBvc2l0T2ZmZXJzLm1hcCgob2ZmZXIpID0+IHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGlkOiBvZmZlci5pZCxcbiAgICAgICAgaW50ZXJlc3RSYXRlTm9taW5hdG9yOiBuZXcgQk4ob2ZmZXIuaW50ZXJlc3RSYXRlTm9taW5hdG9yKSxcbiAgICAgICAgc3RhcnQ6IG5ldyBCTihvZmZlci5zdGFydCksXG4gICAgICAgIGVuZDogbmV3IEJOKG9mZmVyLmVuZCksXG4gICAgICAgIG1pbkFtb3VudDogbmV3IEJOKG9mZmVyLm1pbkFtb3VudCksXG4gICAgICAgIG1pbkR1cmF0aW9uOiBvZmZlci5taW5EdXJhdGlvbixcbiAgICAgICAgbWF4RHVyYXRpb246IG9mZmVyLm1heER1cmF0aW9uLFxuICAgICAgICB1bmxvY2tQZXJpb2REdXJhdGlvbjogb2ZmZXIudW5sb2NrUGVyaW9kRHVyYXRpb24sXG4gICAgICAgIG5vUmV3YXJkc1BlcmlvZER1cmF0aW9uOiBvZmZlci5ub1Jld2FyZHNQZXJpb2REdXJhdGlvbixcbiAgICAgICAgbWVtbzogb2ZmZXIubWVtbyxcbiAgICAgICAgZmxhZ3M6IG5ldyBCTihvZmZlci5mbGFncylcbiAgICAgIH0gYXMgRGVwb3NpdE9mZmVyXG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGRlcG9zaXRzIGNvcnJlc3BvbmRpbmcgdG8gcmVxdWVzdGVkIHR4SURzLlxuICAgKlxuICAgKiBAcGFyYW0gZGVwb3NpdFR4SURzIEEgbGlzdCBvZiB0eElEcyAoY2I1OCkgdG8gcmVxdWVzdCBkZXBvc2l0cyBmb3IuXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGEgR2V0RGVwb3NpdHNSZXNwb25zZSBvYmplY3QuXG4gICAqL1xuICBnZXREZXBvc2l0cyA9IGFzeW5jIChcbiAgICBkZXBvc2l0VHhJRHM6IHN0cmluZ1tdXG4gICk6IFByb21pc2U8R2V0RGVwb3NpdHNSZXNwb25zZT4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogR2V0RGVwb3NpdHNQYXJhbXMgPSB7XG4gICAgICBkZXBvc2l0VHhJRHNcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmdldERlcG9zaXRzXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG5cbiAgICBjb25zdCBkZXBvc2l0czogR2V0RGVwb3NpdHNSZXNwb25zZSA9IHJlc3BvbnNlLmRhdGEucmVzdWx0XG4gICAgaWYgKCFkZXBvc2l0cy5kZXBvc2l0cylcbiAgICAgIHJldHVybiB7IGRlcG9zaXRzOiBbXSwgYXZhaWxhYmxlUmV3YXJkczogW10sIHRpbWVzdGFtcDogWmVyb0JOIH1cbiAgICByZXR1cm4ge1xuICAgICAgZGVwb3NpdHM6IGRlcG9zaXRzLmRlcG9zaXRzLm1hcCgoZGVwb3NpdCkgPT4ge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGRlcG9zaXRUeElEOiBkZXBvc2l0LmRlcG9zaXRUeElELFxuICAgICAgICAgIGRlcG9zaXRPZmZlcklEOiBkZXBvc2l0LmRlcG9zaXRPZmZlcklELFxuICAgICAgICAgIHVubG9ja2VkQW1vdW50OiBuZXcgQk4oZGVwb3NpdC51bmxvY2tlZEFtb3VudCksXG4gICAgICAgICAgY2xhaW1lZFJld2FyZEFtb3VudDogbmV3IEJOKGRlcG9zaXQuY2xhaW1lZFJld2FyZEFtb3VudCksXG4gICAgICAgICAgc3RhcnQ6IG5ldyBCTihkZXBvc2l0LnN0YXJ0KSxcbiAgICAgICAgICBkdXJhdGlvbjogZGVwb3NpdC5kdXJhdGlvbixcbiAgICAgICAgICBhbW91bnQ6IG5ldyBCTihkZXBvc2l0LmFtb3VudCksXG4gICAgICAgICAgcmV3YXJkT3duZXI6IHtcbiAgICAgICAgICAgIGxvY2t0aW1lOiBuZXcgQk4oZGVwb3NpdC5yZXdhcmRPd25lci5sb2NrdGltZSksXG4gICAgICAgICAgICB0aHJlc2hvbGQ6IG5ldyBCTihkZXBvc2l0LnJld2FyZE93bmVyLnRocmVzaG9sZCkudG9OdW1iZXIoKSxcbiAgICAgICAgICAgIGFkZHJlc3NlczogZGVwb3NpdC5yZXdhcmRPd25lci5hZGRyZXNzZXNcbiAgICAgICAgICB9IGFzIE93bmVyXG4gICAgICAgIH0gYXMgQVBJRGVwb3NpdFxuICAgICAgfSksXG4gICAgICBhdmFpbGFibGVSZXdhcmRzOiBkZXBvc2l0cy5hdmFpbGFibGVSZXdhcmRzLm1hcCgoYSkgPT4gbmV3IEJOKGEpKSxcbiAgICAgIHRpbWVzdGFtcDogbmV3IEJOKGRlcG9zaXRzLnRpbWVzdGFtcClcbiAgICB9IGFzIEdldERlcG9zaXRzUmVzcG9uc2VcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IGFtb3VudHMgdGhhdCBjYW4gYmUgY2xhaW1lZDogdmFsaWRhdG9yIHJld2FyZHMsIGV4cGlyZWQgZGVwb3NpdCByZXdhcmRzIGNsYWltYWJsZSBhdCBjdXJyZW50IHRpbWUuXG4gICAqXG4gICAqIEBwYXJhbSBvd25lcnMgUmV3YXJkT3duZXIgb2YgRGVwb3NpdFR4IG9yIEFkZFZhbGlkYXRvclR4XG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGFuIG9iamVjdCBjb250YWluaW5nIHRoZSBhbW91bnRzIHRoYXQgY2FuIGJlIGNsYWltZWQuXG4gICAqL1xuICBnZXRDbGFpbWFibGVzID0gYXN5bmMgKFxuICAgIG93bmVyczogT3duZXJQYXJhbVtdXG4gICk6IFByb21pc2U8R2V0Q2xhaW1hYmxlc1Jlc3BvbnNlPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zID0ge1xuICAgICAgT3duZXJzOiBvd25lcnNcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmdldENsYWltYWJsZXNcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICBjb25zdCByZXN1bHQgPSByZXNwb25zZS5kYXRhLnJlc3VsdFxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNsYWltYWJsZXM6IHJlc3VsdC5jbGFpbWFibGVzLm1hcCgoYzogYW55KSA9PiB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdmFsaWRhdG9yUmV3YXJkczogbmV3IEJOKGMudmFsaWRhdG9yUmV3YXJkcyksXG4gICAgICAgICAgZXhwaXJlZERlcG9zaXRSZXdhcmRzOiBuZXcgQk4oYy5leHBpcmVkRGVwb3NpdFJld2FyZHMpXG4gICAgICAgIH0gYXMgQ2xhaW1hYmxlXG4gICAgICB9KVxuICAgIH0gYXMgR2V0Q2xhaW1hYmxlc1Jlc3BvbnNlXG4gIH1cblxuICAvKipcbiAgICogTGlzdHMgdGhlIHNldCBvZiBwZW5kaW5nIHZhbGlkYXRvcnMuXG4gICAqXG4gICAqIEBwYXJhbSBzdWJuZXRJRCBPcHRpb25hbC4gRWl0aGVyIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1cbiAgICogb3IgYSBjYjU4IHNlcmlhbGl6ZWQgc3RyaW5nIGZvciB0aGUgU3VibmV0SUQgb3IgaXRzIGFsaWFzLlxuICAgKiBAcGFyYW0gbm9kZUlEcyBPcHRpb25hbC4gQW4gYXJyYXkgb2Ygc3RyaW5nc1xuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhbiBhcnJheSBvZiB2YWxpZGF0b3JzIHRoYXQgYXJlIHBlbmRpbmcgc3Rha2luZywgc2VlOiB7QGxpbmsgaHR0cHM6Ly9kb2NzLmF2YXgubmV0d29yay92MS4wL2VuL2FwaS9wbGF0Zm9ybS8jcGxhdGZvcm1nZXRwZW5kaW5ndmFsaWRhdG9yc3xwbGF0Zm9ybS5nZXRQZW5kaW5nVmFsaWRhdG9ycyBkb2N1bWVudGF0aW9ufS5cbiAgICpcbiAgICovXG4gIGdldFBlbmRpbmdWYWxpZGF0b3JzID0gYXN5bmMgKFxuICAgIHN1Ym5ldElEOiBCdWZmZXIgfCBzdHJpbmcgPSB1bmRlZmluZWQsXG4gICAgbm9kZUlEczogc3RyaW5nW10gPSB1bmRlZmluZWRcbiAgKTogUHJvbWlzZTxvYmplY3Q+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IEdldFBlbmRpbmdWYWxpZGF0b3JzUGFyYW1zID0ge31cbiAgICBpZiAodHlwZW9mIHN1Ym5ldElEID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBwYXJhbXMuc3VibmV0SUQgPSBzdWJuZXRJRFxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHN1Ym5ldElEICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBwYXJhbXMuc3VibmV0SUQgPSBiaW50b29scy5jYjU4RW5jb2RlKHN1Ym5ldElEKVxuICAgIH1cbiAgICBpZiAodHlwZW9mIG5vZGVJRHMgIT0gXCJ1bmRlZmluZWRcIiAmJiBub2RlSURzLmxlbmd0aCA+IDApIHtcbiAgICAgIHBhcmFtcy5ub2RlSURzID0gbm9kZUlEc1xuICAgIH1cblxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5nZXRQZW5kaW5nVmFsaWRhdG9yc1wiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdFxuICB9XG5cbiAgLyoqXG4gICAqIFNhbXBsZXMgYFNpemVgIHZhbGlkYXRvcnMgZnJvbSB0aGUgY3VycmVudCB2YWxpZGF0b3Igc2V0LlxuICAgKlxuICAgKiBAcGFyYW0gc2FtcGxlU2l6ZSBPZiB0aGUgdG90YWwgdW5pdmVyc2Ugb2YgdmFsaWRhdG9ycywgc2VsZWN0IHRoaXMgbWFueSBhdCByYW5kb21cbiAgICogQHBhcmFtIHN1Ym5ldElEIE9wdGlvbmFsLiBFaXRoZXIgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvciBhblxuICAgKiBjYjU4IHNlcmlhbGl6ZWQgc3RyaW5nIGZvciB0aGUgU3VibmV0SUQgb3IgaXRzIGFsaWFzLlxuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhbiBhcnJheSBvZiB2YWxpZGF0b3JcInMgc3Rha2luZ0lEcy5cbiAgICovXG4gIHNhbXBsZVZhbGlkYXRvcnMgPSBhc3luYyAoXG4gICAgc2FtcGxlU2l6ZTogbnVtYmVyLFxuICAgIHN1Ym5ldElEOiBCdWZmZXIgfCBzdHJpbmcgPSB1bmRlZmluZWRcbiAgKTogUHJvbWlzZTxzdHJpbmdbXT4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogU2FtcGxlVmFsaWRhdG9yc1BhcmFtcyA9IHtcbiAgICAgIHNpemU6IHNhbXBsZVNpemUudG9TdHJpbmcoKVxuICAgIH1cbiAgICBpZiAodHlwZW9mIHN1Ym5ldElEID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBwYXJhbXMuc3VibmV0SUQgPSBzdWJuZXRJRFxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHN1Ym5ldElEICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBwYXJhbXMuc3VibmV0SUQgPSBiaW50b29scy5jYjU4RW5jb2RlKHN1Ym5ldElEKVxuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uc2FtcGxlVmFsaWRhdG9yc1wiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC52YWxpZGF0b3JzXG4gIH1cblxuICAvKipcbiAgICogQWRkIGEgdmFsaWRhdG9yIHRvIHRoZSBQcmltYXJ5IE5ldHdvcmsuXG4gICAqXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgdXNlcm5hbWUgb2YgdGhlIEtleXN0b3JlIHVzZXJcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCBvZiB0aGUgS2V5c3RvcmUgdXNlclxuICAgKiBAcGFyYW0gbm9kZUlEIFRoZSBub2RlIElEIG9mIHRoZSB2YWxpZGF0b3JcbiAgICogQHBhcmFtIHN0YXJ0VGltZSBKYXZhc2NyaXB0IERhdGUgb2JqZWN0IGZvciB0aGUgc3RhcnQgdGltZSB0byB2YWxpZGF0ZVxuICAgKiBAcGFyYW0gZW5kVGltZSBKYXZhc2NyaXB0IERhdGUgb2JqZWN0IGZvciB0aGUgZW5kIHRpbWUgdG8gdmFsaWRhdGVcbiAgICogQHBhcmFtIHN0YWtlQW1vdW50IFRoZSBhbW91bnQgb2YgbkFWQVggdGhlIHZhbGlkYXRvciBpcyBzdGFraW5nIGFzXG4gICAqIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIHJld2FyZEFkZHJlc3MgVGhlIGFkZHJlc3MgdGhlIHZhbGlkYXRvciByZXdhcmQgd2lsbCBnbyB0bywgaWYgdGhlcmUgaXMgb25lLlxuICAgKiBAcGFyYW0gZGVsZWdhdGlvbkZlZVJhdGUgT3B0aW9uYWwuIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0gZm9yIHRoZSBwZXJjZW50IGZlZSB0aGlzIHZhbGlkYXRvclxuICAgKiBjaGFyZ2VzIHdoZW4gb3RoZXJzIGRlbGVnYXRlIHN0YWtlIHRvIHRoZW0uIFVwIHRvIDQgZGVjaW1hbCBwbGFjZXMgYWxsb3dlZCBhZGRpdGlvbmFsIGRlY2ltYWwgcGxhY2VzIGFyZSBpZ25vcmVkLlxuICAgKiBNdXN0IGJlIGJldHdlZW4gMCBhbmQgMTAwLCBpbmNsdXNpdmUuIEZvciBleGFtcGxlLCBpZiBkZWxlZ2F0aW9uRmVlUmF0ZSBpcyAxLjIzNDUgYW5kIHNvbWVvbmUgZGVsZWdhdGVzIHRvIHRoaXNcbiAgICogdmFsaWRhdG9yLCB0aGVuIHdoZW4gdGhlIGRlbGVnYXRpb24gcGVyaW9kIGlzIG92ZXIsIDEuMjM0NSUgb2YgdGhlIHJld2FyZCBnb2VzIHRvIHRoZSB2YWxpZGF0b3IgYW5kIHRoZSByZXN0IGdvZXNcbiAgICogdG8gdGhlIGRlbGVnYXRvci5cbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYSBiYXNlNTggc3RyaW5nIG9mIHRoZSB1bnNpZ25lZCB0cmFuc2FjdGlvbi5cbiAgICovXG4gIGFkZFZhbGlkYXRvciA9IGFzeW5jIChcbiAgICB1c2VybmFtZTogc3RyaW5nLFxuICAgIHBhc3N3b3JkOiBzdHJpbmcsXG4gICAgbm9kZUlEOiBzdHJpbmcsXG4gICAgc3RhcnRUaW1lOiBEYXRlLFxuICAgIGVuZFRpbWU6IERhdGUsXG4gICAgc3Rha2VBbW91bnQ6IEJOLFxuICAgIHJld2FyZEFkZHJlc3M6IHN0cmluZyxcbiAgICBkZWxlZ2F0aW9uRmVlUmF0ZTogQk4gPSB1bmRlZmluZWRcbiAgKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IEFkZFZhbGlkYXRvclBhcmFtcyA9IHtcbiAgICAgIHVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmQsXG4gICAgICBub2RlSUQsXG4gICAgICBzdGFydFRpbWU6IHN0YXJ0VGltZS5nZXRUaW1lKCkgLyAxMDAwLFxuICAgICAgZW5kVGltZTogZW5kVGltZS5nZXRUaW1lKCkgLyAxMDAwLFxuICAgICAgc3Rha2VBbW91bnQ6IHN0YWtlQW1vdW50LnRvU3RyaW5nKDEwKSxcbiAgICAgIHJld2FyZEFkZHJlc3NcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBkZWxlZ2F0aW9uRmVlUmF0ZSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgcGFyYW1zLmRlbGVnYXRpb25GZWVSYXRlID0gZGVsZWdhdGlvbkZlZVJhdGUudG9TdHJpbmcoMTApXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5hZGRWYWxpZGF0b3JcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQudHhJRFxuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhIHZhbGlkYXRvciB0byBhIFN1Ym5ldCBvdGhlciB0aGFuIHRoZSBQcmltYXJ5IE5ldHdvcmsuIFRoZSB2YWxpZGF0b3IgbXVzdCB2YWxpZGF0ZSB0aGUgUHJpbWFyeSBOZXR3b3JrIGZvciB0aGUgZW50aXJlIGR1cmF0aW9uIHRoZXkgdmFsaWRhdGUgdGhpcyBTdWJuZXQuXG4gICAqXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgdXNlcm5hbWUgb2YgdGhlIEtleXN0b3JlIHVzZXJcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCBvZiB0aGUgS2V5c3RvcmUgdXNlclxuICAgKiBAcGFyYW0gbm9kZUlEIFRoZSBub2RlIElEIG9mIHRoZSB2YWxpZGF0b3JcbiAgICogQHBhcmFtIHN1Ym5ldElEIEVpdGhlciBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9yIGEgY2I1OCBzZXJpYWxpemVkIHN0cmluZyBmb3IgdGhlIFN1Ym5ldElEIG9yIGl0cyBhbGlhcy5cbiAgICogQHBhcmFtIHN0YXJ0VGltZSBKYXZhc2NyaXB0IERhdGUgb2JqZWN0IGZvciB0aGUgc3RhcnQgdGltZSB0byB2YWxpZGF0ZVxuICAgKiBAcGFyYW0gZW5kVGltZSBKYXZhc2NyaXB0IERhdGUgb2JqZWN0IGZvciB0aGUgZW5kIHRpbWUgdG8gdmFsaWRhdGVcbiAgICogQHBhcmFtIHdlaWdodCBUaGUgdmFsaWRhdG9y4oCZcyB3ZWlnaHQgdXNlZCBmb3Igc2FtcGxpbmdcbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgdGhlIHVuc2lnbmVkIHRyYW5zYWN0aW9uLiBJdCBtdXN0IGJlIHNpZ25lZCAodXNpbmcgc2lnbikgYnkgdGhlIHByb3BlciBudW1iZXIgb2YgdGhlIFN1Ym5ldOKAmXMgY29udHJvbCBrZXlzIGFuZCBieSB0aGUga2V5IG9mIHRoZSBhY2NvdW50IHBheWluZyB0aGUgdHJhbnNhY3Rpb24gZmVlIGJlZm9yZSBpdCBjYW4gYmUgaXNzdWVkLlxuICAgKi9cbiAgYWRkU3VibmV0VmFsaWRhdG9yID0gYXN5bmMgKFxuICAgIHVzZXJuYW1lOiBzdHJpbmcsXG4gICAgcGFzc3dvcmQ6IHN0cmluZyxcbiAgICBub2RlSUQ6IHN0cmluZyxcbiAgICBzdWJuZXRJRDogQnVmZmVyIHwgc3RyaW5nLFxuICAgIHN0YXJ0VGltZTogRGF0ZSxcbiAgICBlbmRUaW1lOiBEYXRlLFxuICAgIHdlaWdodDogbnVtYmVyXG4gICk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBhbnkgPSB7XG4gICAgICB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkLFxuICAgICAgbm9kZUlELFxuICAgICAgc3RhcnRUaW1lOiBzdGFydFRpbWUuZ2V0VGltZSgpIC8gMTAwMCxcbiAgICAgIGVuZFRpbWU6IGVuZFRpbWUuZ2V0VGltZSgpIC8gMTAwMCxcbiAgICAgIHdlaWdodFxuICAgIH1cbiAgICBpZiAodHlwZW9mIHN1Ym5ldElEID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBwYXJhbXMuc3VibmV0SUQgPSBzdWJuZXRJRFxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHN1Ym5ldElEICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBwYXJhbXMuc3VibmV0SUQgPSBiaW50b29scy5jYjU4RW5jb2RlKHN1Ym5ldElEKVxuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uYWRkU3VibmV0VmFsaWRhdG9yXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SURcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgYSBkZWxlZ2F0b3IgdG8gdGhlIFByaW1hcnkgTmV0d29yay5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSB1c2VybmFtZSBvZiB0aGUgS2V5c3RvcmUgdXNlclxuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIG9mIHRoZSBLZXlzdG9yZSB1c2VyXG4gICAqIEBwYXJhbSBub2RlSUQgVGhlIG5vZGUgSUQgb2YgdGhlIGRlbGVnYXRlZVxuICAgKiBAcGFyYW0gc3RhcnRUaW1lIEphdmFzY3JpcHQgRGF0ZSBvYmplY3QgZm9yIHdoZW4gdGhlIGRlbGVnYXRvciBzdGFydHMgZGVsZWdhdGluZ1xuICAgKiBAcGFyYW0gZW5kVGltZSBKYXZhc2NyaXB0IERhdGUgb2JqZWN0IGZvciB3aGVuIHRoZSBkZWxlZ2F0b3Igc3RhcnRzIGRlbGVnYXRpbmdcbiAgICogQHBhcmFtIHN0YWtlQW1vdW50IFRoZSBhbW91bnQgb2YgbkFWQVggdGhlIGRlbGVnYXRvciBpcyBzdGFraW5nIGFzXG4gICAqIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIHJld2FyZEFkZHJlc3MgVGhlIGFkZHJlc3Mgb2YgdGhlIGFjY291bnQgdGhlIHN0YWtlZCBBVkFYIGFuZCB2YWxpZGF0aW9uIHJld2FyZFxuICAgKiAoaWYgYXBwbGljYWJsZSkgYXJlIHNlbnQgdG8gYXQgZW5kVGltZVxuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhbiBhcnJheSBvZiB2YWxpZGF0b3JcInMgc3Rha2luZ0lEcy5cbiAgICovXG4gIGFkZERlbGVnYXRvciA9IGFzeW5jIChcbiAgICB1c2VybmFtZTogc3RyaW5nLFxuICAgIHBhc3N3b3JkOiBzdHJpbmcsXG4gICAgbm9kZUlEOiBzdHJpbmcsXG4gICAgc3RhcnRUaW1lOiBEYXRlLFxuICAgIGVuZFRpbWU6IERhdGUsXG4gICAgc3Rha2VBbW91bnQ6IEJOLFxuICAgIHJld2FyZEFkZHJlc3M6IHN0cmluZ1xuICApOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogQWRkRGVsZWdhdG9yUGFyYW1zID0ge1xuICAgICAgdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZCxcbiAgICAgIG5vZGVJRCxcbiAgICAgIHN0YXJ0VGltZTogc3RhcnRUaW1lLmdldFRpbWUoKSAvIDEwMDAsXG4gICAgICBlbmRUaW1lOiBlbmRUaW1lLmdldFRpbWUoKSAvIDEwMDAsXG4gICAgICBzdGFrZUFtb3VudDogc3Rha2VBbW91bnQudG9TdHJpbmcoMTApLFxuICAgICAgcmV3YXJkQWRkcmVzc1xuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uYWRkRGVsZWdhdG9yXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SURcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gdG8gY3JlYXRlIGEgbmV3IFN1Ym5ldC4gVGhlIHVuc2lnbmVkIHRyYW5zYWN0aW9uIG11c3QgYmVcbiAgICogc2lnbmVkIHdpdGggdGhlIGtleSBvZiB0aGUgYWNjb3VudCBwYXlpbmcgdGhlIHRyYW5zYWN0aW9uIGZlZS4gVGhlIFN1Ym5ldOKAmXMgSUQgaXMgdGhlIElEIG9mIHRoZSB0cmFuc2FjdGlvbiB0aGF0IGNyZWF0ZXMgaXQgKGllIHRoZSByZXNwb25zZSBmcm9tIGlzc3VlVHggd2hlbiBpc3N1aW5nIHRoZSBzaWduZWQgdHJhbnNhY3Rpb24pLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIHVzZXJuYW1lIG9mIHRoZSBLZXlzdG9yZSB1c2VyXG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgb2YgdGhlIEtleXN0b3JlIHVzZXJcbiAgICogQHBhcmFtIGNvbnRyb2xLZXlzIEFycmF5IG9mIHBsYXRmb3JtIGFkZHJlc3NlcyBhcyBzdHJpbmdzXG4gICAqIEBwYXJhbSB0aHJlc2hvbGQgVG8gYWRkIGEgdmFsaWRhdG9yIHRvIHRoaXMgU3VibmV0LCBhIHRyYW5zYWN0aW9uIG11c3QgaGF2ZSB0aHJlc2hvbGRcbiAgICogc2lnbmF0dXJlcywgd2hlcmUgZWFjaCBzaWduYXR1cmUgaXMgZnJvbSBhIGtleSB3aG9zZSBhZGRyZXNzIGlzIGFuIGVsZW1lbnQgb2YgYGNvbnRyb2xLZXlzYFxuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhIHN0cmluZyB3aXRoIHRoZSB1bnNpZ25lZCB0cmFuc2FjdGlvbiBlbmNvZGVkIGFzIGJhc2U1OC5cbiAgICovXG4gIGNyZWF0ZVN1Ym5ldCA9IGFzeW5jIChcbiAgICB1c2VybmFtZTogc3RyaW5nLFxuICAgIHBhc3N3b3JkOiBzdHJpbmcsXG4gICAgY29udHJvbEtleXM6IHN0cmluZ1tdLFxuICAgIHRocmVzaG9sZDogbnVtYmVyXG4gICk6IFByb21pc2U8c3RyaW5nIHwgRXJyb3JSZXNwb25zZU9iamVjdD4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogQ3JlYXRlU3VibmV0UGFyYW1zID0ge1xuICAgICAgdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZCxcbiAgICAgIGNvbnRyb2xLZXlzLFxuICAgICAgdGhyZXNob2xkXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5jcmVhdGVTdWJuZXRcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQudHhJRFxuICAgICAgPyByZXNwb25zZS5kYXRhLnJlc3VsdC50eElEXG4gICAgICA6IHJlc3BvbnNlLmRhdGEucmVzdWx0XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBTdWJuZXQgdGhhdCB2YWxpZGF0ZXMgYSBnaXZlbiBibG9ja2NoYWluLlxuICAgKlxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbklEIEVpdGhlciBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9yIGEgY2I1OFxuICAgKiBlbmNvZGVkIHN0cmluZyBmb3IgdGhlIGJsb2NrY2hhaW5JRCBvciBpdHMgYWxpYXMuXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGEgc3RyaW5nIG9mIHRoZSBzdWJuZXRJRCB0aGF0IHZhbGlkYXRlcyB0aGUgYmxvY2tjaGFpbi5cbiAgICovXG4gIHZhbGlkYXRlZEJ5ID0gYXN5bmMgKGJsb2NrY2hhaW5JRDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IGFueSA9IHtcbiAgICAgIGJsb2NrY2hhaW5JRFxuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0udmFsaWRhdGVkQnlcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuc3VibmV0SURcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIElEcyBvZiB0aGUgYmxvY2tjaGFpbnMgYSBTdWJuZXQgdmFsaWRhdGVzLlxuICAgKlxuICAgKiBAcGFyYW0gc3VibmV0SUQgRWl0aGVyIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gb3IgYW4gQVZBWFxuICAgKiBzZXJpYWxpemVkIHN0cmluZyBmb3IgdGhlIFN1Ym5ldElEIG9yIGl0cyBhbGlhcy5cbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYW4gYXJyYXkgb2YgYmxvY2tjaGFpbklEcyB0aGUgc3VibmV0IHZhbGlkYXRlcy5cbiAgICovXG4gIHZhbGlkYXRlcyA9IGFzeW5jIChzdWJuZXRJRDogQnVmZmVyIHwgc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogYW55ID0ge1xuICAgICAgc3VibmV0SURcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBzdWJuZXRJRCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgcGFyYW1zLnN1Ym5ldElEID0gc3VibmV0SURcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBzdWJuZXRJRCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgcGFyYW1zLnN1Ym5ldElEID0gYmludG9vbHMuY2I1OEVuY29kZShzdWJuZXRJRClcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLnZhbGlkYXRlc1wiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5ibG9ja2NoYWluSURzXG4gIH1cblxuICAvKipcbiAgICogR2V0IGFsbCB0aGUgYmxvY2tjaGFpbnMgdGhhdCBleGlzdCAoZXhjbHVkaW5nIHRoZSBQLUNoYWluKS5cbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYW4gYXJyYXkgb2Ygb2JqZWN0cyBjb250YWluaW5nIGZpZWxkcyBcImlkXCIsIFwic3VibmV0SURcIiwgYW5kIFwidm1JRFwiLlxuICAgKi9cbiAgZ2V0QmxvY2tjaGFpbnMgPSBhc3luYyAoKTogUHJvbWlzZTxCbG9ja2NoYWluW10+ID0+IHtcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uZ2V0QmxvY2tjaGFpbnNcIlxuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuYmxvY2tjaGFpbnNcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIEFWQVggZnJvbSBhbiBhY2NvdW50IG9uIHRoZSBQLUNoYWluIHRvIGFuIGFkZHJlc3Mgb24gdGhlIFgtQ2hhaW4uIFRoaXMgdHJhbnNhY3Rpb25cbiAgICogbXVzdCBiZSBzaWduZWQgd2l0aCB0aGUga2V5IG9mIHRoZSBhY2NvdW50IHRoYXQgdGhlIEFWQVggaXMgc2VudCBmcm9tIGFuZCB3aGljaCBwYXlzIHRoZVxuICAgKiB0cmFuc2FjdGlvbiBmZWUuIEFmdGVyIGlzc3VpbmcgdGhpcyB0cmFuc2FjdGlvbiwgeW91IG11c3QgY2FsbCB0aGUgWC1DaGFpbuKAmXMgaW1wb3J0QVZBWFxuICAgKiBtZXRob2QgdG8gY29tcGxldGUgdGhlIHRyYW5zZmVyLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIEtleXN0b3JlIHVzZXIgdGhhdCBjb250cm9scyB0aGUgYWNjb3VudCBzcGVjaWZpZWQgaW4gYHRvYFxuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIG9mIHRoZSBLZXlzdG9yZSB1c2VyXG4gICAqIEBwYXJhbSB0byBUaGUgYWRkcmVzcyBvbiB0aGUgWC1DaGFpbiB0byBzZW5kIHRoZSBBVkFYIHRvLiBEbyBub3QgaW5jbHVkZSBYLSBpbiB0aGUgYWRkcmVzc1xuICAgKiBAcGFyYW0gYW1vdW50IEFtb3VudCBvZiBBVkFYIHRvIGV4cG9ydCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIHRvIGJlIHNpZ25lZCBieSB0aGUgYWNjb3VudCB0aGUgdGhlIEFWQVggaXNcbiAgICogc2VudCBmcm9tIGFuZCBwYXlzIHRoZSB0cmFuc2FjdGlvbiBmZWUuXG4gICAqL1xuICBleHBvcnRBVkFYID0gYXN5bmMgKFxuICAgIHVzZXJuYW1lOiBzdHJpbmcsXG4gICAgcGFzc3dvcmQ6IHN0cmluZyxcbiAgICBhbW91bnQ6IEJOLFxuICAgIHRvOiBzdHJpbmdcbiAgKTogUHJvbWlzZTxzdHJpbmcgfCBFcnJvclJlc3BvbnNlT2JqZWN0PiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBFeHBvcnRBVkFYUGFyYW1zID0ge1xuICAgICAgdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZCxcbiAgICAgIHRvLFxuICAgICAgYW1vdW50OiBhbW91bnQudG9TdHJpbmcoMTApXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5leHBvcnRBVkFYXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SURcbiAgICAgID8gcmVzcG9uc2UuZGF0YS5yZXN1bHQudHhJRFxuICAgICAgOiByZXNwb25zZS5kYXRhLnJlc3VsdFxuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgQVZBWCBmcm9tIGFuIGFjY291bnQgb24gdGhlIFAtQ2hhaW4gdG8gYW4gYWRkcmVzcyBvbiB0aGUgWC1DaGFpbi4gVGhpcyB0cmFuc2FjdGlvblxuICAgKiBtdXN0IGJlIHNpZ25lZCB3aXRoIHRoZSBrZXkgb2YgdGhlIGFjY291bnQgdGhhdCB0aGUgQVZBWCBpcyBzZW50IGZyb20gYW5kIHdoaWNoIHBheXNcbiAgICogdGhlIHRyYW5zYWN0aW9uIGZlZS4gQWZ0ZXIgaXNzdWluZyB0aGlzIHRyYW5zYWN0aW9uLCB5b3UgbXVzdCBjYWxsIHRoZSBYLUNoYWlu4oCZc1xuICAgKiBpbXBvcnRBVkFYIG1ldGhvZCB0byBjb21wbGV0ZSB0aGUgdHJhbnNmZXIuXG4gICAqXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgS2V5c3RvcmUgdXNlciB0aGF0IGNvbnRyb2xzIHRoZSBhY2NvdW50IHNwZWNpZmllZCBpbiBgdG9gXG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgb2YgdGhlIEtleXN0b3JlIHVzZXJcbiAgICogQHBhcmFtIHRvIFRoZSBJRCBvZiB0aGUgYWNjb3VudCB0aGUgQVZBWCBpcyBzZW50IHRvLiBUaGlzIG11c3QgYmUgdGhlIHNhbWUgYXMgdGhlIHRvXG4gICAqIGFyZ3VtZW50IGluIHRoZSBjb3JyZXNwb25kaW5nIGNhbGwgdG8gdGhlIFgtQ2hhaW7igJlzIGV4cG9ydEFWQVhcbiAgICogQHBhcmFtIHNvdXJjZUNoYWluIFRoZSBjaGFpbklEIHdoZXJlIHRoZSBmdW5kcyBhcmUgY29taW5nIGZyb20uXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGEgc3RyaW5nIGZvciB0aGUgdHJhbnNhY3Rpb24sIHdoaWNoIHNob3VsZCBiZSBzZW50IHRvIHRoZSBuZXR3b3JrXG4gICAqIGJ5IGNhbGxpbmcgaXNzdWVUeC5cbiAgICovXG4gIGltcG9ydEFWQVggPSBhc3luYyAoXG4gICAgdXNlcm5hbWU6IHN0cmluZyxcbiAgICBwYXNzd29yZDogc3RyaW5nLFxuICAgIHRvOiBzdHJpbmcsXG4gICAgc291cmNlQ2hhaW46IHN0cmluZ1xuICApOiBQcm9taXNlPHN0cmluZyB8IEVycm9yUmVzcG9uc2VPYmplY3Q+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IEltcG9ydEFWQVhQYXJhbXMgPSB7XG4gICAgICB0byxcbiAgICAgIHNvdXJjZUNoYWluLFxuICAgICAgdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZFxuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uaW1wb3J0QVZBWFwiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC50eElEXG4gICAgICA/IHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SURcbiAgICAgIDogcmVzcG9uc2UuZGF0YS5yZXN1bHRcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxscyB0aGUgbm9kZSdzIGlzc3VlVHggbWV0aG9kIGZyb20gdGhlIEFQSSBhbmQgcmV0dXJucyB0aGUgcmVzdWx0aW5nIHRyYW5zYWN0aW9uIElEIGFzIGEgc3RyaW5nLlxuICAgKlxuICAgKiBAcGFyYW0gdHggQSBzdHJpbmcsIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9LCBvciBbW1R4XV0gcmVwcmVzZW50aW5nIGEgdHJhbnNhY3Rpb25cbiAgICpcbiAgICogQHJldHVybnMgQSBQcm9taXNlIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHRyYW5zYWN0aW9uIElEIG9mIHRoZSBwb3N0ZWQgdHJhbnNhY3Rpb24uXG4gICAqL1xuICBpc3N1ZVR4ID0gYXN5bmMgKHR4OiBzdHJpbmcgfCBCdWZmZXIgfCBUeCk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgbGV0IFRyYW5zYWN0aW9uID0gXCJcIlxuICAgIGlmICh0eXBlb2YgdHggPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIFRyYW5zYWN0aW9uID0gdHhcbiAgICB9IGVsc2UgaWYgKHR4IGluc3RhbmNlb2YgQnVmZmVyKSB7XG4gICAgICBjb25zdCB0eG9iajogVHggPSBuZXcgVHgoKVxuICAgICAgdHhvYmouZnJvbUJ1ZmZlcih0eClcbiAgICAgIFRyYW5zYWN0aW9uID0gdHhvYmoudG9TdHJpbmdIZXgoKVxuICAgIH0gZWxzZSBpZiAodHggaW5zdGFuY2VvZiBUeCkge1xuICAgICAgVHJhbnNhY3Rpb24gPSB0eC50b1N0cmluZ0hleCgpXG4gICAgfSBlbHNlIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgVHJhbnNhY3Rpb25FcnJvcihcbiAgICAgICAgXCJFcnJvciAtIHBsYXRmb3JtLmlzc3VlVHg6IHByb3ZpZGVkIHR4IGlzIG5vdCBleHBlY3RlZCB0eXBlIG9mIHN0cmluZywgQnVmZmVyLCBvciBUeFwiXG4gICAgICApXG4gICAgfVxuICAgIGNvbnN0IHBhcmFtczogYW55ID0ge1xuICAgICAgdHg6IFRyYW5zYWN0aW9uLnRvU3RyaW5nKCksXG4gICAgICBlbmNvZGluZzogXCJoZXhcIlxuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uaXNzdWVUeFwiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC50eElEXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbiB1cHBlciBib3VuZCBvbiB0aGUgYW1vdW50IG9mIHRva2VucyB0aGF0IGV4aXN0LiBOb3QgbW9ub3RvbmljYWxseSBpbmNyZWFzaW5nIGJlY2F1c2UgdGhpcyBudW1iZXIgY2FuIGdvIGRvd24gaWYgYSBzdGFrZXJcInMgcmV3YXJkIGlzIGRlbmllZC5cbiAgICovXG4gIGdldEN1cnJlbnRTdXBwbHkgPSBhc3luYyAoKTogUHJvbWlzZTxCTj4gPT4ge1xuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5nZXRDdXJyZW50U3VwcGx5XCJcbiAgICApXG4gICAgcmV0dXJuIG5ldyBCTihyZXNwb25zZS5kYXRhLnJlc3VsdC5zdXBwbHksIDEwKVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGhlaWdodCBvZiB0aGUgcGxhdGZvcm0gY2hhaW4uXG4gICAqL1xuICBnZXRIZWlnaHQgPSBhc3luYyAoKTogUHJvbWlzZTxCTj4gPT4ge1xuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5nZXRIZWlnaHRcIlxuICAgIClcbiAgICByZXR1cm4gbmV3IEJOKHJlc3BvbnNlLmRhdGEucmVzdWx0LmhlaWdodCwgMTApXG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbWluaW11bSBzdGFraW5nIGFtb3VudC5cbiAgICpcbiAgICogQHBhcmFtIHJlZnJlc2ggQSBib29sZWFuIHRvIGJ5cGFzcyB0aGUgbG9jYWwgY2FjaGVkIHZhbHVlIG9mIE1pbmltdW0gU3Rha2UgQW1vdW50LCBwb2xsaW5nIHRoZSBub2RlIGluc3RlYWQuXG4gICAqL1xuICBnZXRNaW5TdGFrZSA9IGFzeW5jIChcbiAgICByZWZyZXNoOiBib29sZWFuID0gZmFsc2VcbiAgKTogUHJvbWlzZTxHZXRNaW5TdGFrZVJlc3BvbnNlPiA9PiB7XG4gICAgaWYgKFxuICAgICAgcmVmcmVzaCAhPT0gdHJ1ZSAmJlxuICAgICAgdHlwZW9mIHRoaXMubWluVmFsaWRhdG9yU3Rha2UgIT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICAgIHR5cGVvZiB0aGlzLm1pbkRlbGVnYXRvclN0YWtlICE9PSBcInVuZGVmaW5lZFwiXG4gICAgKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBtaW5WYWxpZGF0b3JTdGFrZTogdGhpcy5taW5WYWxpZGF0b3JTdGFrZSxcbiAgICAgICAgbWluRGVsZWdhdG9yU3Rha2U6IHRoaXMubWluRGVsZWdhdG9yU3Rha2VcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmdldE1pblN0YWtlXCJcbiAgICApXG4gICAgdGhpcy5taW5WYWxpZGF0b3JTdGFrZSA9IG5ldyBCTihyZXNwb25zZS5kYXRhLnJlc3VsdC5taW5WYWxpZGF0b3JTdGFrZSwgMTApXG4gICAgdGhpcy5taW5EZWxlZ2F0b3JTdGFrZSA9IG5ldyBCTihyZXNwb25zZS5kYXRhLnJlc3VsdC5taW5EZWxlZ2F0b3JTdGFrZSwgMTApXG4gICAgcmV0dXJuIHtcbiAgICAgIG1pblZhbGlkYXRvclN0YWtlOiB0aGlzLm1pblZhbGlkYXRvclN0YWtlLFxuICAgICAgbWluRGVsZWdhdG9yU3Rha2U6IHRoaXMubWluRGVsZWdhdG9yU3Rha2VcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogZ2V0VG90YWxTdGFrZSgpIHJldHVybnMgdGhlIHRvdGFsIGFtb3VudCBzdGFrZWQgb24gdGhlIFByaW1hcnkgTmV0d29ya1xuICAgKlxuICAgKiBAcmV0dXJucyBBIGJpZyBudW1iZXIgcmVwcmVzZW50aW5nIHRvdGFsIHN0YWtlZCBieSB2YWxpZGF0b3JzIG9uIHRoZSBwcmltYXJ5IG5ldHdvcmtcbiAgICovXG4gIGdldFRvdGFsU3Rha2UgPSBhc3luYyAoKTogUHJvbWlzZTxCTj4gPT4ge1xuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5nZXRUb3RhbFN0YWtlXCJcbiAgICApXG4gICAgcmV0dXJuIG5ldyBCTihyZXNwb25zZS5kYXRhLnJlc3VsdC5zdGFrZSwgMTApXG4gIH1cblxuICAvKipcbiAgICogZ2V0TWF4U3Rha2VBbW91bnQoKSByZXR1cm5zIHRoZSBtYXhpbXVtIGFtb3VudCBvZiBuQVZBWCBzdGFraW5nIHRvIHRoZSBuYW1lZCBub2RlIGR1cmluZyB0aGUgdGltZSBwZXJpb2QuXG4gICAqXG4gICAqIEBwYXJhbSBzdWJuZXRJRCBBIEJ1ZmZlciBvciBjYjU4IHN0cmluZyByZXByZXNlbnRpbmcgc3VibmV0XG4gICAqIEBwYXJhbSBub2RlSUQgQSBzdHJpbmcgcmVwcmVzZW50aW5nIElEIG9mIHRoZSBub2RlIHdob3NlIHN0YWtlIGFtb3VudCBpcyByZXF1aXJlZCBkdXJpbmcgdGhlIGdpdmVuIGR1cmF0aW9uXG4gICAqIEBwYXJhbSBzdGFydFRpbWUgQSBiaWcgbnVtYmVyIGRlbm90aW5nIHN0YXJ0IHRpbWUgb2YgdGhlIGR1cmF0aW9uIGR1cmluZyB3aGljaCBzdGFrZSBhbW91bnQgb2YgdGhlIG5vZGUgaXMgcmVxdWlyZWQuXG4gICAqIEBwYXJhbSBlbmRUaW1lIEEgYmlnIG51bWJlciBkZW5vdGluZyBlbmQgdGltZSBvZiB0aGUgZHVyYXRpb24gZHVyaW5nIHdoaWNoIHN0YWtlIGFtb3VudCBvZiB0aGUgbm9kZSBpcyByZXF1aXJlZC5cbiAgICogQHJldHVybnMgQSBiaWcgbnVtYmVyIHJlcHJlc2VudGluZyB0b3RhbCBzdGFrZWQgYnkgdmFsaWRhdG9ycyBvbiB0aGUgcHJpbWFyeSBuZXR3b3JrXG4gICAqL1xuICBnZXRNYXhTdGFrZUFtb3VudCA9IGFzeW5jIChcbiAgICBzdWJuZXRJRDogc3RyaW5nIHwgQnVmZmVyLFxuICAgIG5vZGVJRDogc3RyaW5nLFxuICAgIHN0YXJ0VGltZTogQk4sXG4gICAgZW5kVGltZTogQk5cbiAgKTogUHJvbWlzZTxCTj4gPT4ge1xuICAgIGNvbnN0IG5vdzogQk4gPSBVbml4Tm93KClcbiAgICBpZiAoc3RhcnRUaW1lLmd0KG5vdykgfHwgZW5kVGltZS5sdGUoc3RhcnRUaW1lKSkge1xuICAgICAgdGhyb3cgbmV3IFRpbWVFcnJvcihcbiAgICAgICAgXCJQbGF0Zm9ybVZNQVBJLmdldE1heFN0YWtlQW1vdW50IC0tIHN0YXJ0VGltZSBtdXN0IGJlIGluIHRoZSBwYXN0IGFuZCBlbmRUaW1lIG11c3QgY29tZSBhZnRlciBzdGFydFRpbWVcIlxuICAgICAgKVxuICAgIH1cblxuICAgIGNvbnN0IHBhcmFtczogR2V0TWF4U3Rha2VBbW91bnRQYXJhbXMgPSB7XG4gICAgICBub2RlSUQ6IG5vZGVJRCxcbiAgICAgIHN0YXJ0VGltZTogc3RhcnRUaW1lLnRvU3RyaW5nKDEwKSxcbiAgICAgIGVuZFRpbWU6IGVuZFRpbWUudG9TdHJpbmcoMTApXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBzdWJuZXRJRCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgcGFyYW1zLnN1Ym5ldElEID0gc3VibmV0SURcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBzdWJuZXRJRCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgcGFyYW1zLnN1Ym5ldElEID0gYmludG9vbHMuY2I1OEVuY29kZShzdWJuZXRJRClcbiAgICB9XG5cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uZ2V0TWF4U3Rha2VBbW91bnRcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gbmV3IEJOKHJlc3BvbnNlLmRhdGEucmVzdWx0LmFtb3VudCwgMTApXG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgbWluaW11bSBzdGFrZSBjYWNoZWQgaW4gdGhpcyBjbGFzcy5cbiAgICogQHBhcmFtIG1pblZhbGlkYXRvclN0YWtlIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0gdG8gc2V0IHRoZSBtaW5pbXVtIHN0YWtlIGFtb3VudCBjYWNoZWQgaW4gdGhpcyBjbGFzcy5cbiAgICogQHBhcmFtIG1pbkRlbGVnYXRvclN0YWtlIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0gdG8gc2V0IHRoZSBtaW5pbXVtIGRlbGVnYXRpb24gYW1vdW50IGNhY2hlZCBpbiB0aGlzIGNsYXNzLlxuICAgKi9cbiAgc2V0TWluU3Rha2UgPSAoXG4gICAgbWluVmFsaWRhdG9yU3Rha2U6IEJOID0gdW5kZWZpbmVkLFxuICAgIG1pbkRlbGVnYXRvclN0YWtlOiBCTiA9IHVuZGVmaW5lZFxuICApOiB2b2lkID0+IHtcbiAgICBpZiAodHlwZW9mIG1pblZhbGlkYXRvclN0YWtlICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aGlzLm1pblZhbGlkYXRvclN0YWtlID0gbWluVmFsaWRhdG9yU3Rha2VcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBtaW5EZWxlZ2F0b3JTdGFrZSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhpcy5taW5EZWxlZ2F0b3JTdGFrZSA9IG1pbkRlbGVnYXRvclN0YWtlXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHRvdGFsIGFtb3VudCBzdGFrZWQgZm9yIGFuIGFycmF5IG9mIGFkZHJlc3Nlcy5cbiAgICovXG4gIGdldFN0YWtlID0gYXN5bmMgKFxuICAgIGFkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgZW5jb2Rpbmc6IHN0cmluZyA9IFwiaGV4XCJcbiAgKTogUHJvbWlzZTxHZXRTdGFrZVJlc3BvbnNlPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBHZXRTdGFrZVBhcmFtcyA9IHtcbiAgICAgIGFkZHJlc3NlcyxcbiAgICAgIGVuY29kaW5nXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5nZXRTdGFrZVwiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiB7XG4gICAgICBzdGFrZWQ6IG5ldyBCTihyZXNwb25zZS5kYXRhLnJlc3VsdC5zdGFrZWQsIDEwKSxcbiAgICAgIHN0YWtlZE91dHB1dHM6IHJlc3BvbnNlLmRhdGEucmVzdWx0LnN0YWtlZE91dHB1dHMubWFwKFxuICAgICAgICAoc3Rha2VkT3V0cHV0OiBzdHJpbmcpOiBUcmFuc2ZlcmFibGVPdXRwdXQgPT4ge1xuICAgICAgICAgIGNvbnN0IHRyYW5zZmVyYWJsZU91dHB1dDogVHJhbnNmZXJhYmxlT3V0cHV0ID1cbiAgICAgICAgICAgIG5ldyBUcmFuc2ZlcmFibGVPdXRwdXQoKVxuICAgICAgICAgIGxldCBidWY6IEJ1ZmZlclxuICAgICAgICAgIGlmIChlbmNvZGluZyA9PT0gXCJjYjU4XCIpIHtcbiAgICAgICAgICAgIGJ1ZiA9IGJpbnRvb2xzLmNiNThEZWNvZGUoc3Rha2VkT3V0cHV0KVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBidWYgPSBCdWZmZXIuZnJvbShzdGFrZWRPdXRwdXQucmVwbGFjZSgvMHgvZywgXCJcIiksIFwiaGV4XCIpXG4gICAgICAgICAgfVxuICAgICAgICAgIHRyYW5zZmVyYWJsZU91dHB1dC5mcm9tQnVmZmVyKGJ1ZiwgMilcbiAgICAgICAgICByZXR1cm4gdHJhbnNmZXJhYmxlT3V0cHV0XG4gICAgICAgIH1cbiAgICAgIClcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0IGFsbCB0aGUgc3VibmV0cyB0aGF0IGV4aXN0LlxuICAgKlxuICAgKiBAcGFyYW0gaWRzIElEcyBvZiB0aGUgc3VibmV0cyB0byByZXRyaWV2ZSBpbmZvcm1hdGlvbiBhYm91dC4gSWYgb21pdHRlZCwgZ2V0cyBhbGwgc3VibmV0c1xuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhbiBhcnJheSBvZiBvYmplY3RzIGNvbnRhaW5pbmcgZmllbGRzIFwiaWRcIixcbiAgICogXCJjb250cm9sS2V5c1wiLCBhbmQgXCJ0aHJlc2hvbGRcIi5cbiAgICovXG4gIGdldFN1Ym5ldHMgPSBhc3luYyAoaWRzOiBzdHJpbmdbXSA9IHVuZGVmaW5lZCk6IFByb21pc2U8U3VibmV0W10+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IGFueSA9IHt9XG4gICAgaWYgKHR5cGVvZiBpZHMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcGFyYW1zLmlkcyA9IGlkc1xuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uZ2V0U3VibmV0c1wiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5zdWJuZXRzXG4gIH1cblxuICAvKipcbiAgICogRXhwb3J0cyB0aGUgcHJpdmF0ZSBrZXkgZm9yIGFuIGFkZHJlc3MuXG4gICAqXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgbmFtZSBvZiB0aGUgdXNlciB3aXRoIHRoZSBwcml2YXRlIGtleVxuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIHVzZWQgdG8gZGVjcnlwdCB0aGUgcHJpdmF0ZSBrZXlcbiAgICogQHBhcmFtIGFkZHJlc3MgVGhlIGFkZHJlc3Mgd2hvc2UgcHJpdmF0ZSBrZXkgc2hvdWxkIGJlIGV4cG9ydGVkXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2Ugd2l0aCB0aGUgZGVjcnlwdGVkIHByaXZhdGUga2V5IGFzIHN0b3JlIGluIHRoZSBkYXRhYmFzZVxuICAgKi9cbiAgZXhwb3J0S2V5ID0gYXN5bmMgKFxuICAgIHVzZXJuYW1lOiBzdHJpbmcsXG4gICAgcGFzc3dvcmQ6IHN0cmluZyxcbiAgICBhZGRyZXNzOiBzdHJpbmdcbiAgKTogUHJvbWlzZTxzdHJpbmcgfCBFcnJvclJlc3BvbnNlT2JqZWN0PiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBFeHBvcnRLZXlQYXJhbXMgPSB7XG4gICAgICB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkLFxuICAgICAgYWRkcmVzc1xuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uZXhwb3J0S2V5XCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnByaXZhdGVLZXlcbiAgICAgID8gcmVzcG9uc2UuZGF0YS5yZXN1bHQucHJpdmF0ZUtleVxuICAgICAgOiByZXNwb25zZS5kYXRhLnJlc3VsdFxuICB9XG5cbiAgLyoqXG4gICAqIEdpdmUgYSB1c2VyIGNvbnRyb2wgb3ZlciBhbiBhZGRyZXNzIGJ5IHByb3ZpZGluZyB0aGUgcHJpdmF0ZSBrZXkgdGhhdCBjb250cm9scyB0aGUgYWRkcmVzcy5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSBuYW1lIG9mIHRoZSB1c2VyIHRvIHN0b3JlIHRoZSBwcml2YXRlIGtleVxuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIHRoYXQgdW5sb2NrcyB0aGUgdXNlclxuICAgKiBAcGFyYW0gcHJpdmF0ZUtleSBBIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHByaXZhdGUga2V5IGluIHRoZSB2bVwicyBmb3JtYXRcbiAgICpcbiAgICogQHJldHVybnMgVGhlIGFkZHJlc3MgZm9yIHRoZSBpbXBvcnRlZCBwcml2YXRlIGtleS5cbiAgICovXG4gIGltcG9ydEtleSA9IGFzeW5jIChcbiAgICB1c2VybmFtZTogc3RyaW5nLFxuICAgIHBhc3N3b3JkOiBzdHJpbmcsXG4gICAgcHJpdmF0ZUtleTogc3RyaW5nXG4gICk6IFByb21pc2U8c3RyaW5nIHwgRXJyb3JSZXNwb25zZU9iamVjdD4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogSW1wb3J0S2V5UGFyYW1zID0ge1xuICAgICAgdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZCxcbiAgICAgIHByaXZhdGVLZXlcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmltcG9ydEtleVwiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LmFkZHJlc3NcbiAgICAgID8gcmVzcG9uc2UuZGF0YS5yZXN1bHQuYWRkcmVzc1xuICAgICAgOiByZXNwb25zZS5kYXRhLnJlc3VsdFxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHRyZWFuc2FjdGlvbiBkYXRhIG9mIGEgcHJvdmlkZWQgdHJhbnNhY3Rpb24gSUQgYnkgY2FsbGluZyB0aGUgbm9kZSdzIGBnZXRUeGAgbWV0aG9kLlxuICAgKlxuICAgKiBAcGFyYW0gdHhJRCBUaGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB0cmFuc2FjdGlvbiBJRFxuICAgKiBAcGFyYW0gZW5jb2Rpbmcgc2V0cyB0aGUgZm9ybWF0IG9mIHRoZSByZXR1cm5lZCB0cmFuc2FjdGlvbi4gQ2FuIGJlLCBcImNiNThcIiwgXCJoZXhcIiBvciBcImpzb25cIi4gRGVmYXVsdHMgdG8gXCJjYjU4XCIuXG4gICAqXG4gICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlIHN0cmluZyBvciBvYmplY3QgY29udGFpbmluZyB0aGUgYnl0ZXMgcmV0cmlldmVkIGZyb20gdGhlIG5vZGVcbiAgICovXG4gIGdldFR4ID0gYXN5bmMgKFxuICAgIHR4SUQ6IHN0cmluZyxcbiAgICBlbmNvZGluZzogc3RyaW5nID0gXCJoZXhcIlxuICApOiBQcm9taXNlPHN0cmluZyB8IG9iamVjdD4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogYW55ID0ge1xuICAgICAgdHhJRCxcbiAgICAgIGVuY29kaW5nXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5nZXRUeFwiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC50eFxuICAgICAgPyByZXNwb25zZS5kYXRhLnJlc3VsdC50eFxuICAgICAgOiByZXNwb25zZS5kYXRhLnJlc3VsdFxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHN0YXR1cyBvZiBhIHByb3ZpZGVkIHRyYW5zYWN0aW9uIElEIGJ5IGNhbGxpbmcgdGhlIG5vZGUncyBgZ2V0VHhTdGF0dXNgIG1ldGhvZC5cbiAgICpcbiAgICogQHBhcmFtIHR4aWQgVGhlIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgdHJhbnNhY3Rpb24gSURcbiAgICogQHBhcmFtIGluY2x1ZGVSZWFzb24gUmV0dXJuIHRoZSByZWFzb24gdHggd2FzIGRyb3BwZWQsIGlmIGFwcGxpY2FibGUuIERlZmF1bHRzIHRvIHRydWVcbiAgICpcbiAgICogQHJldHVybnMgUmV0dXJucyBhIFByb21pc2Ugc3RyaW5nIGNvbnRhaW5pbmcgdGhlIHN0YXR1cyByZXRyaWV2ZWQgZnJvbSB0aGUgbm9kZSBhbmQgdGhlIHJlYXNvbiBhIHR4IHdhcyBkcm9wcGVkLCBpZiBhcHBsaWNhYmxlLlxuICAgKi9cbiAgZ2V0VHhTdGF0dXMgPSBhc3luYyAoXG4gICAgdHhpZDogc3RyaW5nLFxuICAgIGluY2x1ZGVSZWFzb246IGJvb2xlYW4gPSB0cnVlXG4gICk6IFByb21pc2U8c3RyaW5nIHwgR2V0VHhTdGF0dXNSZXNwb25zZT4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogR2V0VHhTdGF0dXNQYXJhbXMgPSB7XG4gICAgICB0eElEOiB0eGlkLFxuICAgICAgaW5jbHVkZVJlYXNvbjogaW5jbHVkZVJlYXNvblxuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uZ2V0VHhTdGF0dXNcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHRcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgdGhlIFVUWE9zIHJlbGF0ZWQgdG8gdGhlIGFkZHJlc3NlcyBwcm92aWRlZCBmcm9tIHRoZSBub2RlJ3MgYGdldFVUWE9zYCBtZXRob2QuXG4gICAqXG4gICAqIEBwYXJhbSBhZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGFzIGNiNTggc3RyaW5ncyBvciBhZGRyZXNzZXMgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1zXG4gICAqIEBwYXJhbSBzb3VyY2VDaGFpbiBBIHN0cmluZyBmb3IgdGhlIGNoYWluIHRvIGxvb2sgZm9yIHRoZSBVVFhPXCJzLiBEZWZhdWx0IGlzIHRvIHVzZSB0aGlzIGNoYWluLCBidXQgaWYgZXhwb3J0ZWQgVVRYT3MgZXhpc3QgZnJvbSBvdGhlciBjaGFpbnMsIHRoaXMgY2FuIHVzZWQgdG8gcHVsbCB0aGVtIGluc3RlYWQuXG4gICAqIEBwYXJhbSBsaW1pdCBPcHRpb25hbC4gUmV0dXJucyBhdCBtb3N0IFtsaW1pdF0gYWRkcmVzc2VzLiBJZiBbbGltaXRdID09IDAgb3IgPiBbbWF4VVRYT3NUb0ZldGNoXSwgZmV0Y2hlcyB1cCB0byBbbWF4VVRYT3NUb0ZldGNoXS5cbiAgICogQHBhcmFtIHN0YXJ0SW5kZXggT3B0aW9uYWwuIFtTdGFydEluZGV4XSBkZWZpbmVzIHdoZXJlIHRvIHN0YXJ0IGZldGNoaW5nIFVUWE9zIChmb3IgcGFnaW5hdGlvbi4pXG4gICAqIFVUWE9zIGZldGNoZWQgYXJlIGZyb20gYWRkcmVzc2VzIGVxdWFsIHRvIG9yIGdyZWF0ZXIgdGhhbiBbU3RhcnRJbmRleC5BZGRyZXNzXVxuICAgKiBGb3IgYWRkcmVzcyBbU3RhcnRJbmRleC5BZGRyZXNzXSwgb25seSBVVFhPcyB3aXRoIElEcyBncmVhdGVyIHRoYW4gW1N0YXJ0SW5kZXguVXR4b10gd2lsbCBiZSByZXR1cm5lZC5cbiAgICogQHBhcmFtIHBlcnNpc3RPcHRzIE9wdGlvbnMgYXZhaWxhYmxlIHRvIHBlcnNpc3QgdGhlc2UgVVRYT3MgaW4gbG9jYWwgc3RvcmFnZVxuICAgKiBAcGFyYW0gZW5jb2RpbmcgT3B0aW9uYWwuICBpcyB0aGUgZW5jb2RpbmcgZm9ybWF0IHRvIHVzZSBmb3IgdGhlIHBheWxvYWQgYXJndW1lbnQuIENhbiBiZSBlaXRoZXIgXCJjYjU4XCIgb3IgXCJoZXhcIi4gRGVmYXVsdHMgdG8gXCJoZXhcIi5cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogcGVyc2lzdE9wdHMgaXMgb3B0aW9uYWwgYW5kIG11c3QgYmUgb2YgdHlwZSBbW1BlcnNpc3RhbmNlT3B0aW9uc11dXG4gICAqXG4gICAqL1xuICBnZXRVVFhPcyA9IGFzeW5jIChcbiAgICBhZGRyZXNzZXM6IHN0cmluZ1tdIHwgc3RyaW5nLFxuICAgIHNvdXJjZUNoYWluOiBzdHJpbmcgPSB1bmRlZmluZWQsXG4gICAgbGltaXQ6IG51bWJlciA9IDAsXG4gICAgc3RhcnRJbmRleDogeyBhZGRyZXNzOiBzdHJpbmc7IHV0eG86IHN0cmluZyB9ID0gdW5kZWZpbmVkLFxuICAgIHBlcnNpc3RPcHRzOiBQZXJzaXN0YW5jZU9wdGlvbnMgPSB1bmRlZmluZWQsXG4gICAgZW5jb2Rpbmc6IHN0cmluZyA9IFwiaGV4XCJcbiAgKTogUHJvbWlzZTxHZXRVVFhPc1Jlc3BvbnNlPiA9PiB7XG4gICAgaWYgKHR5cGVvZiBhZGRyZXNzZXMgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIGFkZHJlc3NlcyA9IFthZGRyZXNzZXNdXG4gICAgfVxuXG4gICAgY29uc3QgcGFyYW1zOiBHZXRVVFhPc1BhcmFtcyA9IHtcbiAgICAgIGFkZHJlc3NlczogYWRkcmVzc2VzLFxuICAgICAgbGltaXQsXG4gICAgICBlbmNvZGluZ1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHN0YXJ0SW5kZXggIT09IFwidW5kZWZpbmVkXCIgJiYgc3RhcnRJbmRleCkge1xuICAgICAgcGFyYW1zLnN0YXJ0SW5kZXggPSBzdGFydEluZGV4XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBzb3VyY2VDaGFpbiAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgcGFyYW1zLnNvdXJjZUNoYWluID0gc291cmNlQ2hhaW5cbiAgICB9XG5cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uZ2V0VVRYT3NcIixcbiAgICAgIHBhcmFtc1xuICAgIClcblxuICAgIGNvbnN0IHV0eG9zOiBVVFhPU2V0ID0gbmV3IFVUWE9TZXQoKVxuICAgIGxldCBkYXRhID0gcmVzcG9uc2UuZGF0YS5yZXN1bHQudXR4b3NcbiAgICBpZiAocGVyc2lzdE9wdHMgJiYgdHlwZW9mIHBlcnNpc3RPcHRzID09PSBcIm9iamVjdFwiKSB7XG4gICAgICBpZiAodGhpcy5kYi5oYXMocGVyc2lzdE9wdHMuZ2V0TmFtZSgpKSkge1xuICAgICAgICBjb25zdCBzZWxmQXJyYXk6IHN0cmluZ1tdID0gdGhpcy5kYi5nZXQocGVyc2lzdE9wdHMuZ2V0TmFtZSgpKVxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzZWxmQXJyYXkpKSB7XG4gICAgICAgICAgdXR4b3MuYWRkQXJyYXkoZGF0YSlcbiAgICAgICAgICBjb25zdCBzZWxmOiBVVFhPU2V0ID0gbmV3IFVUWE9TZXQoKVxuICAgICAgICAgIHNlbGYuYWRkQXJyYXkoc2VsZkFycmF5KVxuICAgICAgICAgIHNlbGYubWVyZ2VCeVJ1bGUodXR4b3MsIHBlcnNpc3RPcHRzLmdldE1lcmdlUnVsZSgpKVxuICAgICAgICAgIGRhdGEgPSBzZWxmLmdldEFsbFVUWE9TdHJpbmdzKClcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5kYi5zZXQocGVyc2lzdE9wdHMuZ2V0TmFtZSgpLCBkYXRhLCBwZXJzaXN0T3B0cy5nZXRPdmVyd3JpdGUoKSlcbiAgICB9XG5cbiAgICBpZiAoZGF0YS5sZW5ndGggPiAwICYmIGRhdGFbMF0uc3Vic3RyaW5nKDAsIDIpID09PSBcIjB4XCIpIHtcbiAgICAgIGNvbnN0IGNiNThTdHJzOiBzdHJpbmdbXSA9IFtdXG4gICAgICBkYXRhLmZvckVhY2goKHN0cjogc3RyaW5nKTogdm9pZCA9PiB7XG4gICAgICAgIGNiNThTdHJzLnB1c2goYmludG9vbHMuY2I1OEVuY29kZShCdWZmZXIuZnJvbShzdHIuc2xpY2UoMiksIFwiaGV4XCIpKSlcbiAgICAgIH0pXG5cbiAgICAgIHV0eG9zLmFkZEFycmF5KGNiNThTdHJzLCBmYWxzZSlcbiAgICB9IGVsc2Uge1xuICAgICAgdXR4b3MuYWRkQXJyYXkoZGF0YSwgZmFsc2UpXG4gICAgfVxuICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0LnV0eG9zID0gdXR4b3NcbiAgICByZXNwb25zZS5kYXRhLnJlc3VsdC5udW1GZXRjaGVkID0gcGFyc2VJbnQocmVzcG9uc2UuZGF0YS5yZXN1bHQubnVtRmV0Y2hlZClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHRcbiAgfVxuXG4gIC8qKlxuICAgKiBnZXRBZGRyZXNzU3RhdGVzKCkgcmV0dXJucyBhbiA2NCBiaXQgYml0bWFzayBvZiBzdGF0ZXMgYXBwbGllZCB0byBhZGRyZXNzXG4gICAqXG4gICAqIEByZXR1cm5zIEEgYmlnIG51bWJlciByZXByZXNlbnRpbmcgdGhlIHN0YXRlcyBhcHBsaWVkIHRvIGdpdmVuIGFkZHJlc3NcbiAgICovXG4gIGdldEFkZHJlc3NTdGF0ZXMgPSBhc3luYyAoYWRkcmVzczogc3RyaW5nKTogUHJvbWlzZTxCTj4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogQWRkcmVzc1BhcmFtcyA9IHtcbiAgICAgIGFkZHJlc3M6IGFkZHJlc3NcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmdldEFkZHJlc3NTdGF0ZXNcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gbmV3IEJOKHJlc3BvbnNlLmRhdGEucmVzdWx0LCAxMClcbiAgfVxuXG4gIC8qKlxuICAgKiBnZXRNdWx0aXNpZ0FsaWFzKCkgcmV0dXJucyBhIE11bHRpc2lnQWxpYXNSZXBseVxuICAgKlxuICAgKiBAcmV0dXJucyBBIE11bHRpU2lnQWxpYXNcbiAgICovXG4gIGdldE11bHRpc2lnQWxpYXMgPSBhc3luYyAoYWRkcmVzczogc3RyaW5nKTogUHJvbWlzZTxNdWx0aXNpZ0FsaWFzUmVwbHk+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IEFkZHJlc3NQYXJhbXMgPSB7XG4gICAgICBhZGRyZXNzOiBhZGRyZXNzXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5nZXRNdWx0aXNpZ0FsaWFzXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHtcbiAgICAgIG1lbW86IHJlc3BvbnNlLmRhdGEucmVzdWx0Lm1lbW8sXG4gICAgICBsb2NrdGltZTogbmV3IEJOKHJlc3BvbnNlLmRhdGEucmVzdWx0LmxvY2t0aW1lKSxcbiAgICAgIHRocmVzaG9sZDogbmV3IEJOKHJlc3BvbnNlLmRhdGEucmVzdWx0LnRocmVzaG9sZCkudG9OdW1iZXIoKSxcbiAgICAgIGFkZHJlc3NlczogcmVzcG9uc2UuZGF0YS5yZXN1bHQuYWRkcmVzc2VzXG4gICAgfSBhcyBNdWx0aXNpZ0FsaWFzUmVwbHlcbiAgfVxuXG4gIC8qKlxuICAgKiBIZWxwZXIgZnVuY3Rpb24gd2hpY2ggY3JlYXRlcyBhbiB1bnNpZ25lZCB0cmFuc2FjdGlvbi4gRm9yIG1vcmUgZ3JhbnVsYXIgY29udHJvbCwgeW91IG1heSBjcmVhdGUgeW91ciBvd25cbiAgICogW1tVbnNpZ25lZFR4XV0gbWFudWFsbHkgKHdpdGggdGhlaXIgY29ycmVzcG9uZGluZyBbW1RyYW5zZmVyYWJsZUlucHV0XV1zLCBbW1RyYW5zZmVyYWJsZU91dHB1dF1dcywgYW5kIFtbVHJhbnNmZXJPcGVyYXRpb25dXXMpLlxuICAgKlxuICAgKiBAcGFyYW0gdXR4b3NldCBBIHNldCBvZiBVVFhPcyB0aGF0IHRoZSB0cmFuc2FjdGlvbiBpcyBidWlsdCBvblxuICAgKiBAcGFyYW0gYW1vdW50IFRoZSBhbW91bnQgb2YgQXNzZXRJRCB0byBiZSBzcGVudCBpbiBpdHMgc21hbGxlc3QgZGVub21pbmF0aW9uLCByZXByZXNlbnRlZCBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfS5cbiAgICogQHBhcmFtIHRvQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdG8gc2VuZCB0aGUgZnVuZHNcbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIHNlbmQgdGhlIGZ1bmRzIGZyb20gdGhlIFVUWE9zIHByb3ZpZGVkXG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0aGF0IGNhbiBzcGVuZCB0aGUgY2hhbmdlIHJlbWFpbmluZyBmcm9tIHRoZSBzcGVudCBVVFhPc1xuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCBDQjU4IEJ1ZmZlciBvciBTdHJpbmcgd2hpY2ggY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIGxvY2t0aW1lIE9wdGlvbmFsLiBUaGUgbG9ja3RpbWUgZmllbGQgY3JlYXRlZCBpbiB0aGUgcmVzdWx0aW5nIG91dHB1dHNcbiAgICogQHBhcmFtIHRvVGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgVVRYT1xuICAgKiBAcGFyYW0gY2hhbmdlVGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgY2hhbmdlIFVUWE9cbiAgICpcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gKFtbVW5zaWduZWRUeF1dKSB3aGljaCBjb250YWlucyBhIFtbQmFzZVR4XV0uXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgaGVscGVyIGV4aXN0cyBiZWNhdXNlIHRoZSBlbmRwb2ludCBBUEkgc2hvdWxkIGJlIHRoZSBwcmltYXJ5IHBvaW50IG9mIGVudHJ5IGZvciBtb3N0IGZ1bmN0aW9uYWxpdHkuXG4gICAqL1xuICBidWlsZEJhc2VUeCA9IGFzeW5jIChcbiAgICB1dHhvc2V0OiBVVFhPU2V0LFxuICAgIGFtb3VudDogQk4sXG4gICAgdG9BZGRyZXNzZXM6IHN0cmluZ1tdLFxuICAgIGZyb21BZGRyZXNzZXM6IEZyb21UeXBlLFxuICAgIGNoYW5nZUFkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgbWVtbzogUGF5bG9hZEJhc2UgfCBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgYXNPZjogQk4gPSBVbml4Tm93KCksXG4gICAgbG9ja3RpbWU6IEJOID0gbmV3IEJOKDApLFxuICAgIHRvVGhyZXNob2xkOiBudW1iZXIgPSAxLFxuICAgIGNoYW5nZVRocmVzaG9sZDogbnVtYmVyID0gMVxuICApOiBQcm9taXNlPFVuc2lnbmVkVHg+ID0+IHtcbiAgICBjb25zdCBjYWxsZXI6IHN0cmluZyA9IFwiYnVpbGRCYXNlVHhcIlxuICAgIGNvbnN0IHRvOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5QnVmZmVyKHRvQWRkcmVzc2VzLCBjYWxsZXIpXG4gICAgY29uc3QgZnJvbVNpZ25lciA9IHRoaXMuX3BhcnNlRnJvbVNpZ25lcihmcm9tQWRkcmVzc2VzLCBjYWxsZXIpXG4gICAgY29uc3QgY2hhbmdlOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5QnVmZmVyKFxuICAgICAgY2hhbmdlQWRkcmVzc2VzLFxuICAgICAgY2FsbGVyXG4gICAgKVxuXG4gICAgaWYgKG1lbW8gaW5zdGFuY2VvZiBQYXlsb2FkQmFzZSkge1xuICAgICAgbWVtbyA9IG1lbW8uZ2V0UGF5bG9hZCgpXG4gICAgfVxuICAgIGNvbnN0IG5ldHdvcmtJRDogbnVtYmVyID0gdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpXG4gICAgY29uc3QgYmxvY2tjaGFpbklEQnVmOiBCdWZmZXIgPSBiaW50b29scy5jYjU4RGVjb2RlKHRoaXMuYmxvY2tjaGFpbklEKVxuICAgIGNvbnN0IGZlZTogQk4gPSB0aGlzLmdldFR4RmVlKClcbiAgICBjb25zdCBmZWVBc3NldElEOiBCdWZmZXIgPSBhd2FpdCB0aGlzLmdldEFWQVhBc3NldElEKClcblxuICAgIGNvbnN0IGJ1aWx0VW5zaWduZWRUeDogVW5zaWduZWRUeCA9IGF3YWl0IHRoaXMuX2dldEJ1aWxkZXIoXG4gICAgICB1dHhvc2V0XG4gICAgKS5idWlsZEJhc2VUeChcbiAgICAgIG5ldHdvcmtJRCxcbiAgICAgIGJsb2NrY2hhaW5JREJ1ZixcbiAgICAgIGFtb3VudCxcbiAgICAgIGZlZUFzc2V0SUQsXG4gICAgICB0byxcbiAgICAgIGZyb21TaWduZXIsXG4gICAgICBjaGFuZ2UsXG4gICAgICBmZWUsXG4gICAgICBmZWVBc3NldElELFxuICAgICAgbWVtbyxcbiAgICAgIGFzT2YsXG4gICAgICBsb2NrdGltZSxcbiAgICAgIHRvVGhyZXNob2xkLFxuICAgICAgY2hhbmdlVGhyZXNob2xkXG4gICAgKVxuXG4gICAgaWYgKCEoYXdhaXQgdGhpcy5jaGVja0dvb3NlRWdnKGJ1aWx0VW5zaWduZWRUeCkpKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgbmV3IEdvb3NlRWdnQ2hlY2tFcnJvcihcIkZhaWxlZCBHb29zZSBFZ2cgQ2hlY2tcIilcbiAgICB9XG5cbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4XG4gIH1cblxuICAvKipcbiAgICogSGVscGVyIGZ1bmN0aW9uIHdoaWNoIGNyZWF0ZXMgYW4gdW5zaWduZWQgSW1wb3J0IFR4LiBGb3IgbW9yZSBncmFudWxhciBjb250cm9sLCB5b3UgbWF5IGNyZWF0ZSB5b3VyIG93blxuICAgKiBbW1Vuc2lnbmVkVHhdXSBtYW51YWxseSAod2l0aCB0aGVpciBjb3JyZXNwb25kaW5nIFtbVHJhbnNmZXJhYmxlSW5wdXRdXXMsIFtbVHJhbnNmZXJhYmxlT3V0cHV0XV1zLCBhbmQgW1tUcmFuc2Zlck9wZXJhdGlvbl1dcykuXG4gICAqXG4gICAqIEBwYXJhbSB1dHhvc2V0IEEgc2V0IG9mIFVUWE9zIHRoYXQgdGhlIHRyYW5zYWN0aW9uIGlzIGJ1aWx0IG9uXG4gICAqIEBwYXJhbSBvd25lckFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGJlaW5nIHVzZWQgdG8gaW1wb3J0XG4gICAqIEBwYXJhbSBzb3VyY2VDaGFpbiBUaGUgY2hhaW5pZCBmb3Igd2hlcmUgdGhlIGltcG9ydCBpcyBjb21pbmcgZnJvbS5cbiAgICogQHBhcmFtIHRvQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdG8gc2VuZCB0aGUgZnVuZHNcbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIHNlbmQgdGhlIGZ1bmRzIGZyb20gdGhlIFVUWE9zIHByb3ZpZGVkXG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0aGF0IGNhbiBzcGVuZCB0aGUgY2hhbmdlIHJlbWFpbmluZyBmcm9tIHRoZSBzcGVudCBVVFhPc1xuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xuICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gbG9ja3RpbWUgT3B0aW9uYWwuIFRoZSBsb2NrdGltZSBmaWVsZCBjcmVhdGVkIGluIHRoZSByZXN1bHRpbmcgb3V0cHV0c1xuICAgKiBAcGFyYW0gdG9UaHJlc2hvbGQgT3B0aW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCBVVFhPXG4gICAqIEBwYXJhbSBjaGFuZ2VUaHJlc2hvbGQgT3B0aW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCBjaGFuZ2UgVVRYT1xuICAgKlxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiAoW1tVbnNpZ25lZFR4XV0pIHdoaWNoIGNvbnRhaW5zIGEgW1tJbXBvcnRUeF1dLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBUaGlzIGhlbHBlciBleGlzdHMgYmVjYXVzZSB0aGUgZW5kcG9pbnQgQVBJIHNob3VsZCBiZSB0aGUgcHJpbWFyeSBwb2ludCBvZiBlbnRyeSBmb3IgbW9zdCBmdW5jdGlvbmFsaXR5LlxuICAgKi9cbiAgYnVpbGRJbXBvcnRUeCA9IGFzeW5jIChcbiAgICB1dHhvc2V0OiBVVFhPU2V0LFxuICAgIG93bmVyQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICBzb3VyY2VDaGFpbjogQnVmZmVyIHwgc3RyaW5nLFxuICAgIHRvQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICBmcm9tQWRkcmVzc2VzOiBGcm9tVHlwZSxcbiAgICBjaGFuZ2VBZGRyZXNzZXM6IHN0cmluZ1tdID0gdW5kZWZpbmVkLFxuICAgIG1lbW86IFBheWxvYWRCYXNlIHwgQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGFzT2Y6IEJOID0gWmVyb0JOLFxuICAgIGxvY2t0aW1lOiBCTiA9IFplcm9CTixcbiAgICB0b1RocmVzaG9sZDogbnVtYmVyID0gMSxcbiAgICBjaGFuZ2VUaHJlc2hvbGQ6IG51bWJlciA9IDFcbiAgKTogUHJvbWlzZTxVbnNpZ25lZFR4PiA9PiB7XG4gICAgY29uc3QgY2FsbGVyID0gXCJidWlsZEltcG9ydFR4XCJcblxuICAgIGNvbnN0IHRvOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5QnVmZmVyKHRvQWRkcmVzc2VzLCBjYWxsZXIpXG5cbiAgICBjb25zdCBmcm9tU2lnbmVyID0gdGhpcy5fcGFyc2VGcm9tU2lnbmVyKGZyb21BZGRyZXNzZXMsIGNhbGxlcilcblxuICAgIGNvbnN0IGNoYW5nZTogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheUJ1ZmZlcihcbiAgICAgIGNoYW5nZUFkZHJlc3NlcyxcbiAgICAgIGNhbGxlclxuICAgIClcblxuICAgIGxldCBzcmNDaGFpbjogc3RyaW5nID0gdW5kZWZpbmVkXG5cbiAgICBpZiAodHlwZW9mIHNvdXJjZUNoYWluID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aHJvdyBuZXcgQ2hhaW5JZEVycm9yKFxuICAgICAgICBcIkVycm9yIC0gUGxhdGZvcm1WTUFQSS5idWlsZEltcG9ydFR4OiBTb3VyY2UgQ2hhaW5JRCBpcyB1bmRlZmluZWQuXCJcbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBzb3VyY2VDaGFpbiA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgc3JjQ2hhaW4gPSBzb3VyY2VDaGFpblxuICAgICAgc291cmNlQ2hhaW4gPSBiaW50b29scy5jYjU4RGVjb2RlKHNvdXJjZUNoYWluKVxuICAgIH0gZWxzZSBpZiAoIShzb3VyY2VDaGFpbiBpbnN0YW5jZW9mIEJ1ZmZlcikpIHtcbiAgICAgIHRocm93IG5ldyBDaGFpbklkRXJyb3IoXG4gICAgICAgIFwiRXJyb3IgLSBQbGF0Zm9ybVZNQVBJLmJ1aWxkSW1wb3J0VHg6IEludmFsaWQgZGVzdGluYXRpb25DaGFpbiB0eXBlOiBcIiArXG4gICAgICAgICAgdHlwZW9mIHNvdXJjZUNoYWluXG4gICAgICApXG4gICAgfVxuICAgIGNvbnN0IGF0b21pY1VUWE9zOiBVVFhPU2V0ID0gYXdhaXQgKFxuICAgICAgYXdhaXQgdGhpcy5nZXRVVFhPcyhvd25lckFkZHJlc3Nlcywgc3JjQ2hhaW4sIDAsIHVuZGVmaW5lZClcbiAgICApLnV0eG9zXG4gICAgY29uc3QgYXZheEFzc2V0SUQ6IEJ1ZmZlciA9IGF3YWl0IHRoaXMuZ2V0QVZBWEFzc2V0SUQoKVxuXG4gICAgaWYgKG1lbW8gaW5zdGFuY2VvZiBQYXlsb2FkQmFzZSkge1xuICAgICAgbWVtbyA9IG1lbW8uZ2V0UGF5bG9hZCgpXG4gICAgfVxuXG4gICAgY29uc3QgYXRvbWljczogVVRYT1tdID0gYXRvbWljVVRYT3MuZ2V0QWxsVVRYT3MoKVxuXG4gICAgY29uc3QgYnVpbHRVbnNpZ25lZFR4OiBVbnNpZ25lZFR4ID0gYXdhaXQgdGhpcy5fZ2V0QnVpbGRlcihcbiAgICAgIHV0eG9zZXRcbiAgICApLmJ1aWxkSW1wb3J0VHgoXG4gICAgICB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCksXG4gICAgICBiaW50b29scy5jYjU4RGVjb2RlKHRoaXMuYmxvY2tjaGFpbklEKSxcbiAgICAgIHRvLFxuICAgICAgZnJvbVNpZ25lcixcbiAgICAgIGNoYW5nZSxcbiAgICAgIGF0b21pY3MsXG4gICAgICBzb3VyY2VDaGFpbixcbiAgICAgIHRoaXMuZ2V0VHhGZWUoKSxcbiAgICAgIGF2YXhBc3NldElELFxuICAgICAgbWVtbyxcbiAgICAgIGFzT2YsXG4gICAgICBsb2NrdGltZSxcbiAgICAgIHRvVGhyZXNob2xkLFxuICAgICAgY2hhbmdlVGhyZXNob2xkXG4gICAgKVxuXG4gICAgaWYgKCEoYXdhaXQgdGhpcy5jaGVja0dvb3NlRWdnKGJ1aWx0VW5zaWduZWRUeCkpKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEdvb3NlRWdnQ2hlY2tFcnJvcihcIkZhaWxlZCBHb29zZSBFZ2cgQ2hlY2tcIilcbiAgICB9XG5cbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4XG4gIH1cblxuICAvKipcbiAgICogSGVscGVyIGZ1bmN0aW9uIHdoaWNoIGNyZWF0ZXMgYW4gdW5zaWduZWQgRXhwb3J0IFR4LiBGb3IgbW9yZSBncmFudWxhciBjb250cm9sLCB5b3UgbWF5IGNyZWF0ZSB5b3VyIG93blxuICAgKiBbW1Vuc2lnbmVkVHhdXSBtYW51YWxseSAod2l0aCB0aGVpciBjb3JyZXNwb25kaW5nIFtbVHJhbnNmZXJhYmxlSW5wdXRdXXMsIFtbVHJhbnNmZXJhYmxlT3V0cHV0XV1zLCBhbmQgW1tUcmFuc2Zlck9wZXJhdGlvbl1dcykuXG4gICAqXG4gICAqIEBwYXJhbSB1dHhvc2V0IEEgc2V0IG9mIFVUWE9zIHRoYXQgdGhlIHRyYW5zYWN0aW9uIGlzIGJ1aWx0IG9uXG4gICAqIEBwYXJhbSBhbW91bnQgVGhlIGFtb3VudCBiZWluZyBleHBvcnRlZCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBkZXN0aW5hdGlvbkNoYWluIFRoZSBjaGFpbmlkIGZvciB3aGVyZSB0aGUgYXNzZXRzIHdpbGwgYmUgc2VudC5cbiAgICogQHBhcmFtIHRvQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdG8gc2VuZCB0aGUgZnVuZHNcbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIHNlbmQgdGhlIGZ1bmRzIGZyb20gdGhlIFVUWE9zIHByb3ZpZGVkXG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0aGF0IGNhbiBzcGVuZCB0aGUgY2hhbmdlIHJlbWFpbmluZyBmcm9tIHRoZSBzcGVudCBVVFhPc1xuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xuICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gbG9ja3RpbWUgT3B0aW9uYWwuIFRoZSBsb2NrdGltZSBmaWVsZCBjcmVhdGVkIGluIHRoZSByZXN1bHRpbmcgb3V0cHV0c1xuICAgKiBAcGFyYW0gdG9UaHJlc2hvbGQgT3B0aW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCBVVFhPXG4gICAqIEBwYXJhbSBjaGFuZ2VUaHJlc2hvbGQgT3B0aW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCBjaGFuZ2UgVVRYT1xuICAgKlxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiAoW1tVbnNpZ25lZFR4XV0pIHdoaWNoIGNvbnRhaW5zIGFuIFtbRXhwb3J0VHhdXS5cbiAgICovXG4gIGJ1aWxkRXhwb3J0VHggPSBhc3luYyAoXG4gICAgdXR4b3NldDogVVRYT1NldCxcbiAgICBhbW91bnQ6IEJOLFxuICAgIGRlc3RpbmF0aW9uQ2hhaW46IEJ1ZmZlciB8IHN0cmluZyxcbiAgICB0b0FkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgZnJvbUFkZHJlc3NlczogRnJvbVR5cGUsXG4gICAgY2hhbmdlQWRkcmVzc2VzOiBzdHJpbmdbXSA9IHVuZGVmaW5lZCxcbiAgICBtZW1vOiBQYXlsb2FkQmFzZSB8IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBhc09mOiBCTiA9IFplcm9CTixcbiAgICBsb2NrdGltZTogQk4gPSBaZXJvQk4sXG4gICAgdG9UaHJlc2hvbGQ6IG51bWJlciA9IDEsXG4gICAgY2hhbmdlVGhyZXNob2xkOiBudW1iZXIgPSAxXG4gICk6IFByb21pc2U8VW5zaWduZWRUeD4gPT4ge1xuICAgIGNvbnN0IGNhbGxlciA9IFwiYnVpbGRFeHBvcnRUeFwiXG5cbiAgICBsZXQgcHJlZml4ZXM6IG9iamVjdCA9IHt9XG4gICAgdG9BZGRyZXNzZXMubWFwKChhOiBzdHJpbmcpOiB2b2lkID0+IHtcbiAgICAgIHByZWZpeGVzW2Euc3BsaXQoXCItXCIpWzBdXSA9IHRydWVcbiAgICB9KVxuICAgIGlmIChPYmplY3Qua2V5cyhwcmVmaXhlcykubGVuZ3RoICE9PSAxKSB7XG4gICAgICB0aHJvdyBuZXcgQWRkcmVzc0Vycm9yKFxuICAgICAgICBcIkVycm9yIC0gUGxhdGZvcm1WTUFQSS5idWlsZEV4cG9ydFR4OiBUbyBhZGRyZXNzZXMgbXVzdCBoYXZlIHRoZSBzYW1lIGNoYWluSUQgcHJlZml4LlwiXG4gICAgICApXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBkZXN0aW5hdGlvbkNoYWluID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aHJvdyBuZXcgQ2hhaW5JZEVycm9yKFxuICAgICAgICBcIkVycm9yIC0gUGxhdGZvcm1WTUFQSS5idWlsZEV4cG9ydFR4OiBEZXN0aW5hdGlvbiBDaGFpbklEIGlzIHVuZGVmaW5lZC5cIlxuICAgICAgKVxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGRlc3RpbmF0aW9uQ2hhaW4gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIGRlc3RpbmF0aW9uQ2hhaW4gPSBiaW50b29scy5jYjU4RGVjb2RlKGRlc3RpbmF0aW9uQ2hhaW4pIC8vXG4gICAgfSBlbHNlIGlmICghKGRlc3RpbmF0aW9uQ2hhaW4gaW5zdGFuY2VvZiBCdWZmZXIpKSB7XG4gICAgICB0aHJvdyBuZXcgQ2hhaW5JZEVycm9yKFxuICAgICAgICBcIkVycm9yIC0gUGxhdGZvcm1WTUFQSS5idWlsZEV4cG9ydFR4OiBJbnZhbGlkIGRlc3RpbmF0aW9uQ2hhaW4gdHlwZTogXCIgK1xuICAgICAgICAgIHR5cGVvZiBkZXN0aW5hdGlvbkNoYWluXG4gICAgICApXG4gICAgfVxuICAgIGlmIChkZXN0aW5hdGlvbkNoYWluLmxlbmd0aCAhPT0gMzIpIHtcbiAgICAgIHRocm93IG5ldyBDaGFpbklkRXJyb3IoXG4gICAgICAgIFwiRXJyb3IgLSBQbGF0Zm9ybVZNQVBJLmJ1aWxkRXhwb3J0VHg6IERlc3RpbmF0aW9uIENoYWluSUQgbXVzdCBiZSAzMiBieXRlcyBpbiBsZW5ndGguXCJcbiAgICAgIClcbiAgICB9XG5cbiAgICBsZXQgdG86IEJ1ZmZlcltdID0gW11cbiAgICB0b0FkZHJlc3Nlcy5tYXAoKGE6IHN0cmluZyk6IHZvaWQgPT4ge1xuICAgICAgdG8ucHVzaChiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpXG4gICAgfSlcblxuICAgIGNvbnN0IGZyb21TaWduZXIgPSB0aGlzLl9wYXJzZUZyb21TaWduZXIoZnJvbUFkZHJlc3NlcywgY2FsbGVyKVxuXG4gICAgY29uc3QgY2hhbmdlOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5QnVmZmVyKFxuICAgICAgY2hhbmdlQWRkcmVzc2VzLFxuICAgICAgY2FsbGVyXG4gICAgKVxuXG4gICAgaWYgKG1lbW8gaW5zdGFuY2VvZiBQYXlsb2FkQmFzZSkge1xuICAgICAgbWVtbyA9IG1lbW8uZ2V0UGF5bG9hZCgpXG4gICAgfVxuXG4gICAgY29uc3QgYXZheEFzc2V0SUQ6IEJ1ZmZlciA9IGF3YWl0IHRoaXMuZ2V0QVZBWEFzc2V0SUQoKVxuXG4gICAgY29uc3QgYnVpbHRVbnNpZ25lZFR4OiBVbnNpZ25lZFR4ID0gYXdhaXQgdGhpcy5fZ2V0QnVpbGRlcihcbiAgICAgIHV0eG9zZXRcbiAgICApLmJ1aWxkRXhwb3J0VHgoXG4gICAgICB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCksXG4gICAgICBiaW50b29scy5jYjU4RGVjb2RlKHRoaXMuYmxvY2tjaGFpbklEKSxcbiAgICAgIGFtb3VudCxcbiAgICAgIGF2YXhBc3NldElELFxuICAgICAgdG8sXG4gICAgICBmcm9tU2lnbmVyLFxuICAgICAgZGVzdGluYXRpb25DaGFpbixcbiAgICAgIGNoYW5nZSxcbiAgICAgIHRoaXMuZ2V0VHhGZWUoKSxcbiAgICAgIGF2YXhBc3NldElELFxuICAgICAgbWVtbyxcbiAgICAgIGFzT2YsXG4gICAgICBsb2NrdGltZSxcbiAgICAgIHRvVGhyZXNob2xkLFxuICAgICAgY2hhbmdlVGhyZXNob2xkXG4gICAgKVxuXG4gICAgaWYgKCEoYXdhaXQgdGhpcy5jaGVja0dvb3NlRWdnKGJ1aWx0VW5zaWduZWRUeCkpKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEdvb3NlRWdnQ2hlY2tFcnJvcihcIkZhaWxlZCBHb29zZSBFZ2cgQ2hlY2tcIilcbiAgICB9XG5cbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4XG4gIH1cblxuICAvKipcbiAgICogSGVscGVyIGZ1bmN0aW9uIHdoaWNoIGNyZWF0ZXMgYW4gdW5zaWduZWQgW1tBZGRTdWJuZXRWYWxpZGF0b3JUeF1dLiBGb3IgbW9yZSBncmFudWxhciBjb250cm9sLCB5b3UgbWF5IGNyZWF0ZSB5b3VyIG93blxuICAgKiBbW1Vuc2lnbmVkVHhdXSBtYW51YWxseSBhbmQgaW1wb3J0IHRoZSBbW0FkZFN1Ym5ldFZhbGlkYXRvclR4XV0gY2xhc3MgZGlyZWN0bHkuXG4gICAqXG4gICAqIEBwYXJhbSB1dHhvc2V0IEEgc2V0IG9mIFVUWE9zIHRoYXQgdGhlIHRyYW5zYWN0aW9uIGlzIGJ1aWx0IG9uLlxuICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBBbiBhcnJheSBvZiBhZGRyZXNzZXMgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2hvIHBheXMgdGhlIGZlZXMgaW4gQVZBWFxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB3aG8gZ2V0cyB0aGUgY2hhbmdlIGxlZnRvdmVyIGZyb20gdGhlIGZlZSBwYXltZW50XG4gICAqIEBwYXJhbSBub2RlSUQgVGhlIG5vZGUgSUQgb2YgdGhlIHZhbGlkYXRvciBiZWluZyBhZGRlZC5cbiAgICogQHBhcmFtIHN0YXJ0VGltZSBUaGUgVW5peCB0aW1lIHdoZW4gdGhlIHZhbGlkYXRvciBzdGFydHMgdmFsaWRhdGluZyB0aGUgUHJpbWFyeSBOZXR3b3JrLlxuICAgKiBAcGFyYW0gZW5kVGltZSBUaGUgVW5peCB0aW1lIHdoZW4gdGhlIHZhbGlkYXRvciBzdG9wcyB2YWxpZGF0aW5nIHRoZSBQcmltYXJ5IE5ldHdvcmsgKGFuZCBzdGFrZWQgQVZBWCBpcyByZXR1cm5lZCkuXG4gICAqIEBwYXJhbSB3ZWlnaHQgVGhlIGFtb3VudCBvZiB3ZWlnaHQgZm9yIHRoaXMgc3VibmV0IHZhbGlkYXRvci5cbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIHN1Ym5ldEF1dGggT3B0aW9uYWwuIEFuIEF1dGggc3RydWN0IHdoaWNoIGNvbnRhaW5zIHRoZSBzdWJuZXQgQXV0aCBhbmQgdGhlIHNpZ25lcnMuXG4gICAqIEBwYXJhbSBjaGFuZ2VUaHJlc2hvbGQgT3B0aW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCBjaGFuZ2UgVVRYT1xuICAgKlxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiBjcmVhdGVkIGZyb20gdGhlIHBhc3NlZCBpbiBwYXJhbWV0ZXJzLlxuICAgKi9cblxuICBidWlsZEFkZFN1Ym5ldFZhbGlkYXRvclR4ID0gYXN5bmMgKFxuICAgIHV0eG9zZXQ6IFVUWE9TZXQsXG4gICAgZnJvbUFkZHJlc3NlczogRnJvbVR5cGUsXG4gICAgY2hhbmdlQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICBub2RlSUQ6IHN0cmluZyxcbiAgICBzdGFydFRpbWU6IEJOLFxuICAgIGVuZFRpbWU6IEJOLFxuICAgIHdlaWdodDogQk4sXG4gICAgc3VibmV0SUQ6IHN0cmluZyxcbiAgICBtZW1vOiBQYXlsb2FkQmFzZSB8IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBhc09mOiBCTiA9IFplcm9CTixcbiAgICBzdWJuZXRBdXRoOiBBdXRoID0geyBhZGRyZXNzZXM6IFtdLCB0aHJlc2hvbGQ6IDAsIHNpZ25lcjogW10gfSxcbiAgICBjaGFuZ2VUaHJlc2hvbGQ6IG51bWJlciA9IDFcbiAgKTogUHJvbWlzZTxVbnNpZ25lZFR4PiA9PiB7XG4gICAgY29uc3QgY2FsbGVyID0gXCJidWlsZEFkZFN1Ym5ldFZhbGlkYXRvclR4XCJcblxuICAgIGNvbnN0IGZyb21TaWduZXIgPSB0aGlzLl9wYXJzZUZyb21TaWduZXIoZnJvbUFkZHJlc3NlcywgY2FsbGVyKVxuXG4gICAgY29uc3QgY2hhbmdlOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5QnVmZmVyKFxuICAgICAgY2hhbmdlQWRkcmVzc2VzLFxuICAgICAgY2FsbGVyXG4gICAgKVxuXG4gICAgaWYgKG1lbW8gaW5zdGFuY2VvZiBQYXlsb2FkQmFzZSkge1xuICAgICAgbWVtbyA9IG1lbW8uZ2V0UGF5bG9hZCgpXG4gICAgfVxuXG4gICAgY29uc3QgYXZheEFzc2V0SUQ6IEJ1ZmZlciA9IGF3YWl0IHRoaXMuZ2V0QVZBWEFzc2V0SUQoKVxuXG4gICAgY29uc3Qgbm93OiBCTiA9IFVuaXhOb3coKVxuICAgIGlmIChzdGFydFRpbWUubHQobm93KSB8fCBlbmRUaW1lLmx0ZShzdGFydFRpbWUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIFwiUGxhdGZvcm1WTUFQSS5idWlsZEFkZFN1Ym5ldFZhbGlkYXRvclR4IC0tIHN0YXJ0VGltZSBtdXN0IGJlIGluIHRoZSBmdXR1cmUgYW5kIGVuZFRpbWUgbXVzdCBjb21lIGFmdGVyIHN0YXJ0VGltZVwiXG4gICAgICApXG4gICAgfVxuXG4gICAgY29uc3QgYnVpbHRVbnNpZ25lZFR4OiBVbnNpZ25lZFR4ID0gYXdhaXQgdGhpcy5fZ2V0QnVpbGRlcihcbiAgICAgIHV0eG9zZXRcbiAgICApLmJ1aWxkQWRkU3VibmV0VmFsaWRhdG9yVHgoXG4gICAgICB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCksXG4gICAgICBiaW50b29scy5jYjU4RGVjb2RlKHRoaXMuYmxvY2tjaGFpbklEKSxcbiAgICAgIGZyb21TaWduZXIsXG4gICAgICBjaGFuZ2UsXG4gICAgICBOb2RlSURTdHJpbmdUb0J1ZmZlcihub2RlSUQpLFxuICAgICAgc3RhcnRUaW1lLFxuICAgICAgZW5kVGltZSxcbiAgICAgIHdlaWdodCxcbiAgICAgIHN1Ym5ldElELFxuICAgICAgdGhpcy5nZXREZWZhdWx0VHhGZWUoKSxcbiAgICAgIGF2YXhBc3NldElELFxuICAgICAgbWVtbyxcbiAgICAgIGFzT2YsXG4gICAgICBzdWJuZXRBdXRoLFxuICAgICAgY2hhbmdlVGhyZXNob2xkXG4gICAgKVxuXG4gICAgaWYgKCEoYXdhaXQgdGhpcy5jaGVja0dvb3NlRWdnKGJ1aWx0VW5zaWduZWRUeCkpKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRmFpbGVkIEdvb3NlIEVnZyBDaGVja1wiKVxuICAgIH1cblxuICAgIHJldHVybiBidWlsdFVuc2lnbmVkVHhcbiAgfVxuXG4gIC8qKlxuICAgKiBIZWxwZXIgZnVuY3Rpb24gd2hpY2ggY3JlYXRlcyBhbiB1bnNpZ25lZCBbW0FkZERlbGVnYXRvclR4XV0uIEZvciBtb3JlIGdyYW51bGFyIGNvbnRyb2wsIHlvdSBtYXkgY3JlYXRlIHlvdXIgb3duXG4gICAqIFtbVW5zaWduZWRUeF1dIG1hbnVhbGx5IGFuZCBpbXBvcnQgdGhlIFtbQWRkRGVsZWdhdG9yVHhdXSBjbGFzcyBkaXJlY3RseS5cbiAgICpcbiAgICogQHBhcmFtIHV0eG9zZXQgQSBzZXQgb2YgVVRYT3MgdGhhdCB0aGUgdHJhbnNhY3Rpb24gaXMgYnVpbHQgb25cbiAgICogQHBhcmFtIHRvQWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB3aG8gcmVjZWl2ZWQgdGhlIHN0YWtlZCB0b2tlbnMgYXQgdGhlIGVuZCBvZiB0aGUgc3Rha2luZyBwZXJpb2RcbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHdobyBvd24gdGhlIHN0YWtpbmcgVVRYT3MgdGhlIGZlZXMgaW4gQVZBWFxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB3aG8gZ2V0cyB0aGUgY2hhbmdlIGxlZnRvdmVyIGZyb20gdGhlIGZlZSBwYXltZW50XG4gICAqIEBwYXJhbSBub2RlSUQgVGhlIG5vZGUgSUQgb2YgdGhlIHZhbGlkYXRvciBiZWluZyBhZGRlZC5cbiAgICogQHBhcmFtIHN0YXJ0VGltZSBUaGUgVW5peCB0aW1lIHdoZW4gdGhlIHZhbGlkYXRvciBzdGFydHMgdmFsaWRhdGluZyB0aGUgUHJpbWFyeSBOZXR3b3JrLlxuICAgKiBAcGFyYW0gZW5kVGltZSBUaGUgVW5peCB0aW1lIHdoZW4gdGhlIHZhbGlkYXRvciBzdG9wcyB2YWxpZGF0aW5nIHRoZSBQcmltYXJ5IE5ldHdvcmsgKGFuZCBzdGFrZWQgQVZBWCBpcyByZXR1cm5lZCkuXG4gICAqIEBwYXJhbSBzdGFrZUFtb3VudCBUaGUgYW1vdW50IGJlaW5nIGRlbGVnYXRlZCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSByZXdhcmRBZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB3aGljaCB3aWxsIHJlY2lldmUgdGhlIHJld2FyZHMgZnJvbSB0aGUgZGVsZWdhdGVkIHN0YWtlLlxuICAgKiBAcGFyYW0gcmV3YXJkTG9ja3RpbWUgT3B0aW9uYWwuIFRoZSBsb2NrdGltZSBmaWVsZCBjcmVhdGVkIGluIHRoZSByZXN1bHRpbmcgcmV3YXJkIG91dHB1dHNcbiAgICogQHBhcmFtIHJld2FyZFRocmVzaG9sZCBPcGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgcmV3YXJkIFVUWE8uIERlZmF1bHQgMS5cbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIHRvVGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgVVRYT1xuICAgKiBAcGFyYW0gY2hhbmdlVGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgY2hhbmdlIFVUWE9cbiAgICpcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gY3JlYXRlZCBmcm9tIHRoZSBwYXNzZWQgaW4gcGFyYW1ldGVycy5cbiAgICovXG4gIGJ1aWxkQWRkRGVsZWdhdG9yVHggPSBhc3luYyAoXG4gICAgdXR4b3NldDogVVRYT1NldCxcbiAgICB0b0FkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgZnJvbUFkZHJlc3NlczogRnJvbVR5cGUsXG4gICAgY2hhbmdlQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICBub2RlSUQ6IHN0cmluZyxcbiAgICBzdGFydFRpbWU6IEJOLFxuICAgIGVuZFRpbWU6IEJOLFxuICAgIHN0YWtlQW1vdW50OiBCTixcbiAgICByZXdhcmRBZGRyZXNzZXM6IHN0cmluZ1tdLFxuICAgIHJld2FyZExvY2t0aW1lOiBCTiA9IFplcm9CTixcbiAgICByZXdhcmRUaHJlc2hvbGQ6IG51bWJlciA9IDEsXG4gICAgbWVtbzogUGF5bG9hZEJhc2UgfCBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgYXNPZjogQk4gPSBaZXJvQk4sXG4gICAgdG9UaHJlc2hvbGQ6IG51bWJlciA9IDEsXG4gICAgY2hhbmdlVGhyZXNob2xkOiBudW1iZXIgPSAxXG4gICk6IFByb21pc2U8VW5zaWduZWRUeD4gPT4ge1xuICAgIGNvbnN0IGNhbGxlciA9IFwiYnVpbGRBZGREZWxlZ2F0b3JUeFwiXG4gICAgY29uc3QgdG86IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXlCdWZmZXIodG9BZGRyZXNzZXMsIGNhbGxlcilcblxuICAgIGNvbnN0IGZyb21TaWduZXIgPSB0aGlzLl9wYXJzZUZyb21TaWduZXIoZnJvbUFkZHJlc3NlcywgY2FsbGVyKVxuXG4gICAgY29uc3QgY2hhbmdlOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5QnVmZmVyKFxuICAgICAgY2hhbmdlQWRkcmVzc2VzLFxuICAgICAgY2FsbGVyXG4gICAgKVxuICAgIGNvbnN0IHJld2FyZHM6IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXlCdWZmZXIoXG4gICAgICByZXdhcmRBZGRyZXNzZXMsXG4gICAgICBjYWxsZXJcbiAgICApXG5cbiAgICBpZiAobWVtbyBpbnN0YW5jZW9mIFBheWxvYWRCYXNlKSB7XG4gICAgICBtZW1vID0gbWVtby5nZXRQYXlsb2FkKClcbiAgICB9XG5cbiAgICBjb25zdCBtaW5TdGFrZTogQk4gPSAoYXdhaXQgdGhpcy5nZXRNaW5TdGFrZSgpKVtcIm1pbkRlbGVnYXRvclN0YWtlXCJdXG4gICAgaWYgKHN0YWtlQW1vdW50Lmx0KG1pblN0YWtlKSkge1xuICAgICAgdGhyb3cgbmV3IFN0YWtlRXJyb3IoXG4gICAgICAgIFwiUGxhdGZvcm1WTUFQSS5idWlsZEFkZERlbGVnYXRvclR4IC0tIHN0YWtlIGFtb3VudCBtdXN0IGJlIGF0IGxlYXN0IFwiICtcbiAgICAgICAgICBtaW5TdGFrZS50b1N0cmluZygxMClcbiAgICAgIClcbiAgICB9XG5cbiAgICBjb25zdCBhdmF4QXNzZXRJRDogQnVmZmVyID0gYXdhaXQgdGhpcy5nZXRBVkFYQXNzZXRJRCgpXG5cbiAgICBjb25zdCBub3c6IEJOID0gVW5peE5vdygpXG4gICAgaWYgKHN0YXJ0VGltZS5sdChub3cpIHx8IGVuZFRpbWUubHRlKHN0YXJ0VGltZSkpIHtcbiAgICAgIHRocm93IG5ldyBUaW1lRXJyb3IoXG4gICAgICAgIFwiUGxhdGZvcm1WTUFQSS5idWlsZEFkZERlbGVnYXRvclR4IC0tIHN0YXJ0VGltZSBtdXN0IGJlIGluIHRoZSBmdXR1cmUgYW5kIGVuZFRpbWUgbXVzdCBjb21lIGFmdGVyIHN0YXJ0VGltZVwiXG4gICAgICApXG4gICAgfVxuXG4gICAgaWYgKHRoaXMuY29yZS5nZXROZXR3b3JrKCkuUC5sb2NrTW9kZUJvbmREZXBvc2l0KSB7XG4gICAgICB0aHJvdyBuZXcgVVRYT0Vycm9yKFxuICAgICAgICBcIlBsYXRmb3JtVk1BUEkuYnVpbGRBZGREZWxlZ2F0b3JUeCAtLSBub3Qgc3VwcG9ydGVkIGluIGxvY2ttb2RlQm9uZERlcG9zaXRcIlxuICAgICAgKVxuICAgIH1cblxuICAgIGNvbnN0IGJ1aWx0VW5zaWduZWRUeDogVW5zaWduZWRUeCA9IGF3YWl0IHRoaXMuX2dldEJ1aWxkZXIoXG4gICAgICB1dHhvc2V0XG4gICAgKS5idWlsZEFkZERlbGVnYXRvclR4KFxuICAgICAgdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpLFxuICAgICAgYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRCksXG4gICAgICBhdmF4QXNzZXRJRCxcbiAgICAgIHRvLFxuICAgICAgZnJvbVNpZ25lcixcbiAgICAgIGNoYW5nZSxcbiAgICAgIE5vZGVJRFN0cmluZ1RvQnVmZmVyKG5vZGVJRCksXG4gICAgICBzdGFydFRpbWUsXG4gICAgICBlbmRUaW1lLFxuICAgICAgc3Rha2VBbW91bnQsXG4gICAgICByZXdhcmRMb2NrdGltZSxcbiAgICAgIHJld2FyZFRocmVzaG9sZCxcbiAgICAgIHJld2FyZHMsXG4gICAgICBaZXJvQk4sXG4gICAgICBhdmF4QXNzZXRJRCxcbiAgICAgIG1lbW8sXG4gICAgICBhc09mLFxuICAgICAgdG9UaHJlc2hvbGQsXG4gICAgICBjaGFuZ2VUaHJlc2hvbGRcbiAgICApXG5cbiAgICBpZiAoIShhd2FpdCB0aGlzLmNoZWNrR29vc2VFZ2coYnVpbHRVbnNpZ25lZFR4KSkpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgR29vc2VFZ2dDaGVja0Vycm9yKFwiRmFpbGVkIEdvb3NlIEVnZyBDaGVja1wiKVxuICAgIH1cblxuICAgIHJldHVybiBidWlsdFVuc2lnbmVkVHhcbiAgfVxuXG4gIC8qKlxuICAgKiBIZWxwZXIgZnVuY3Rpb24gd2hpY2ggY3JlYXRlcyBhbiB1bnNpZ25lZCBbW0FkZFZhbGlkYXRvclR4XV0uIEZvciBtb3JlIGdyYW51bGFyIGNvbnRyb2wsIHlvdSBtYXkgY3JlYXRlIHlvdXIgb3duXG4gICAqIFtbVW5zaWduZWRUeF1dIG1hbnVhbGx5IGFuZCBpbXBvcnQgdGhlIFtbQWRkVmFsaWRhdG9yVHhdXSBjbGFzcyBkaXJlY3RseS5cbiAgICpcbiAgICogQHBhcmFtIHV0eG9zZXQgQSBzZXQgb2YgVVRYT3MgdGhhdCB0aGUgdHJhbnNhY3Rpb24gaXMgYnVpbHQgb25cbiAgICogQHBhcmFtIHRvQWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB3aG8gcmVjZWl2ZWQgdGhlIHN0YWtlZCB0b2tlbnMgYXQgdGhlIGVuZCBvZiB0aGUgc3Rha2luZyBwZXJpb2RcbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHdobyBvd24gdGhlIHN0YWtpbmcgVVRYT3MgdGhlIGZlZXMgaW4gQVZBWFxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB3aG8gZ2V0cyB0aGUgY2hhbmdlIGxlZnRvdmVyIGZyb20gdGhlIGZlZSBwYXltZW50XG4gICAqIEBwYXJhbSBub2RlSUQgVGhlIG5vZGUgSUQgb2YgdGhlIHZhbGlkYXRvciBiZWluZyBhZGRlZC5cbiAgICogQHBhcmFtIHN0YXJ0VGltZSBUaGUgVW5peCB0aW1lIHdoZW4gdGhlIHZhbGlkYXRvciBzdGFydHMgdmFsaWRhdGluZyB0aGUgUHJpbWFyeSBOZXR3b3JrLlxuICAgKiBAcGFyYW0gZW5kVGltZSBUaGUgVW5peCB0aW1lIHdoZW4gdGhlIHZhbGlkYXRvciBzdG9wcyB2YWxpZGF0aW5nIHRoZSBQcmltYXJ5IE5ldHdvcmsgKGFuZCBzdGFrZWQgQVZBWCBpcyByZXR1cm5lZCkuXG4gICAqIEBwYXJhbSBzdGFrZUFtb3VudCBUaGUgYW1vdW50IGJlaW5nIGRlbGVnYXRlZCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSByZXdhcmRBZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB3aGljaCB3aWxsIHJlY2lldmUgdGhlIHJld2FyZHMgZnJvbSB0aGUgZGVsZWdhdGVkIHN0YWtlLlxuICAgKiBAcGFyYW0gZGVsZWdhdGlvbkZlZSBBIG51bWJlciBmb3IgdGhlIHBlcmNlbnRhZ2Ugb2YgcmV3YXJkIHRvIGJlIGdpdmVuIHRvIHRoZSB2YWxpZGF0b3Igd2hlbiBzb21lb25lIGRlbGVnYXRlcyB0byB0aGVtLiBNdXN0IGJlIGJldHdlZW4gMCBhbmQgMTAwLlxuICAgKiBAcGFyYW0gcmV3YXJkTG9ja3RpbWUgT3B0aW9uYWwuIFRoZSBsb2NrdGltZSBmaWVsZCBjcmVhdGVkIGluIHRoZSByZXN1bHRpbmcgcmV3YXJkIG91dHB1dHNcbiAgICogQHBhcmFtIHJld2FyZFRocmVzaG9sZCBPcGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgcmV3YXJkIFVUWE8uIERlZmF1bHQgMS5cbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIHRvVGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgVVRYT1xuICAgKiBAcGFyYW0gY2hhbmdlVGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgY2hhbmdlIFVUWE9cbiAgICpcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gY3JlYXRlZCBmcm9tIHRoZSBwYXNzZWQgaW4gcGFyYW1ldGVycy5cbiAgICovXG4gIGJ1aWxkQWRkVmFsaWRhdG9yVHggPSBhc3luYyAoXG4gICAgdXR4b3NldDogVVRYT1NldCxcbiAgICB0b0FkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgZnJvbUFkZHJlc3NlczogRnJvbVR5cGUsXG4gICAgY2hhbmdlQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICBub2RlSUQ6IHN0cmluZyxcbiAgICBzdGFydFRpbWU6IEJOLFxuICAgIGVuZFRpbWU6IEJOLFxuICAgIHN0YWtlQW1vdW50OiBCTixcbiAgICByZXdhcmRBZGRyZXNzZXM6IHN0cmluZ1tdLFxuICAgIGRlbGVnYXRpb25GZWU6IG51bWJlcixcbiAgICByZXdhcmRMb2NrdGltZTogQk4gPSBaZXJvQk4sXG4gICAgcmV3YXJkVGhyZXNob2xkOiBudW1iZXIgPSAxLFxuICAgIG1lbW86IFBheWxvYWRCYXNlIHwgQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGFzT2Y6IEJOID0gWmVyb0JOLFxuICAgIHRvVGhyZXNob2xkOiBudW1iZXIgPSAxLFxuICAgIGNoYW5nZVRocmVzaG9sZDogbnVtYmVyID0gMVxuICApOiBQcm9taXNlPFVuc2lnbmVkVHg+ID0+IHtcbiAgICBjb25zdCBjYWxsZXIgPSBcImJ1aWxkQWRkVmFsaWRhdG9yVHhcIlxuXG4gICAgY29uc3QgdG86IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXlCdWZmZXIodG9BZGRyZXNzZXMsIGNhbGxlcilcblxuICAgIGNvbnN0IGZyb21TaWduZXIgPSB0aGlzLl9wYXJzZUZyb21TaWduZXIoZnJvbUFkZHJlc3NlcywgY2FsbGVyKVxuXG4gICAgY29uc3QgY2hhbmdlOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5QnVmZmVyKFxuICAgICAgY2hhbmdlQWRkcmVzc2VzLFxuICAgICAgY2FsbGVyXG4gICAgKVxuICAgIGNvbnN0IHJld2FyZHM6IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXlCdWZmZXIoXG4gICAgICByZXdhcmRBZGRyZXNzZXMsXG4gICAgICBjYWxsZXJcbiAgICApXG5cbiAgICBpZiAobWVtbyBpbnN0YW5jZW9mIFBheWxvYWRCYXNlKSB7XG4gICAgICBtZW1vID0gbWVtby5nZXRQYXlsb2FkKClcbiAgICB9XG5cbiAgICBjb25zdCBtaW5TdGFrZTogQk4gPSAoYXdhaXQgdGhpcy5nZXRNaW5TdGFrZSgpKVtcIm1pblZhbGlkYXRvclN0YWtlXCJdXG4gICAgaWYgKHN0YWtlQW1vdW50Lmx0KG1pblN0YWtlKSkge1xuICAgICAgdGhyb3cgbmV3IFN0YWtlRXJyb3IoXG4gICAgICAgIGBQbGF0Zm9ybVZNQVBJLiR7Y2FsbGVyfSAtLSBzdGFrZSBhbW91bnQgbXVzdCBiZSBhdCBsZWFzdCBgICtcbiAgICAgICAgICBtaW5TdGFrZS50b1N0cmluZygxMClcbiAgICAgIClcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICB0eXBlb2YgZGVsZWdhdGlvbkZlZSAhPT0gXCJudW1iZXJcIiB8fFxuICAgICAgZGVsZWdhdGlvbkZlZSA+IDEwMCB8fFxuICAgICAgZGVsZWdhdGlvbkZlZSA8IDBcbiAgICApIHtcbiAgICAgIHRocm93IG5ldyBEZWxlZ2F0aW9uRmVlRXJyb3IoXG4gICAgICAgIGBQbGF0Zm9ybVZNQVBJLiR7Y2FsbGVyfSAtLSBkZWxlZ2F0aW9uRmVlIG11c3QgYmUgYSBudW1iZXIgYmV0d2VlbiAwIGFuZCAxMDBgXG4gICAgICApXG4gICAgfVxuXG4gICAgY29uc3QgYXZheEFzc2V0SUQ6IEJ1ZmZlciA9IGF3YWl0IHRoaXMuZ2V0QVZBWEFzc2V0SUQoKVxuXG4gICAgY29uc3Qgbm93OiBCTiA9IFVuaXhOb3coKVxuICAgIGlmIChzdGFydFRpbWUubHQobm93KSB8fCBlbmRUaW1lLmx0ZShzdGFydFRpbWUpKSB7XG4gICAgICB0aHJvdyBuZXcgVGltZUVycm9yKFxuICAgICAgICBgUGxhdGZvcm1WTUFQSS4ke2NhbGxlcn0gLS0gc3RhcnRUaW1lIG11c3QgYmUgaW4gdGhlIGZ1dHVyZSBhbmQgZW5kVGltZSBtdXN0IGNvbWUgYWZ0ZXIgc3RhcnRUaW1lYFxuICAgICAgKVxuICAgIH1cblxuICAgIGNvbnN0IGJ1aWx0VW5zaWduZWRUeDogVW5zaWduZWRUeCA9IGF3YWl0IHRoaXMuX2dldEJ1aWxkZXIoXG4gICAgICB1dHhvc2V0XG4gICAgKS5idWlsZEFkZFZhbGlkYXRvclR4KFxuICAgICAgdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpLFxuICAgICAgYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRCksXG4gICAgICB0byxcbiAgICAgIGZyb21TaWduZXIsXG4gICAgICBjaGFuZ2UsXG4gICAgICBOb2RlSURTdHJpbmdUb0J1ZmZlcihub2RlSUQpLFxuICAgICAgc3RhcnRUaW1lLFxuICAgICAgZW5kVGltZSxcbiAgICAgIHN0YWtlQW1vdW50LFxuICAgICAgYXZheEFzc2V0SUQsXG4gICAgICByZXdhcmRMb2NrdGltZSxcbiAgICAgIHJld2FyZFRocmVzaG9sZCxcbiAgICAgIHJld2FyZHMsXG4gICAgICBkZWxlZ2F0aW9uRmVlLFxuICAgICAgWmVyb0JOLFxuICAgICAgYXZheEFzc2V0SUQsXG4gICAgICBtZW1vLFxuICAgICAgYXNPZixcbiAgICAgIHRvVGhyZXNob2xkLFxuICAgICAgY2hhbmdlVGhyZXNob2xkXG4gICAgKVxuXG4gICAgaWYgKCEoYXdhaXQgdGhpcy5jaGVja0dvb3NlRWdnKGJ1aWx0VW5zaWduZWRUeCkpKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEdvb3NlRWdnQ2hlY2tFcnJvcihcIkZhaWxlZCBHb29zZSBFZ2cgQ2hlY2tcIilcbiAgICB9XG5cbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4XG4gIH1cblxuICAvKipcbiAgICogQ2xhc3MgcmVwcmVzZW50aW5nIGFuIHVuc2lnbmVkIFtbQ3JlYXRlU3VibmV0VHhdXSB0cmFuc2FjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHV0eG9zZXQgQSBzZXQgb2YgVVRYT3MgdGhhdCB0aGUgdHJhbnNhY3Rpb24gaXMgYnVpbHQgb25cbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIHNlbmQgdGhlIGZ1bmRzIGZyb20gdGhlIFVUWE9zIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0aGF0IGNhbiBzcGVuZCB0aGUgY2hhbmdlIHJlbWFpbmluZyBmcm9tIHRoZSBzcGVudCBVVFhPc1xuICAgKiBAcGFyYW0gc3VibmV0T3duZXJBZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGZvciBvd25lcnMgb2YgdGhlIG5ldyBzdWJuZXRcbiAgICogQHBhcmFtIHN1Ym5ldE93bmVyVGhyZXNob2xkIEEgbnVtYmVyIGluZGljYXRpbmcgdGhlIGFtb3VudCBvZiBzaWduYXR1cmVzIHJlcXVpcmVkIHRvIGFkZCB2YWxpZGF0b3JzIHRvIGEgc3VibmV0XG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBjaGFuZ2VUaHJlc2hvbGQgT3B0aW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCBjaGFuZ2UgVVRYT1xuICAgKlxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiBjcmVhdGVkIGZyb20gdGhlIHBhc3NlZCBpbiBwYXJhbWV0ZXJzLlxuICAgKi9cbiAgYnVpbGRDcmVhdGVTdWJuZXRUeCA9IGFzeW5jIChcbiAgICB1dHhvc2V0OiBVVFhPU2V0LFxuICAgIGZyb21BZGRyZXNzZXM6IEZyb21UeXBlLFxuICAgIGNoYW5nZUFkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgc3VibmV0T3duZXJBZGRyZXNzZXM6IHN0cmluZ1tdLFxuICAgIHN1Ym5ldE93bmVyVGhyZXNob2xkOiBudW1iZXIsXG4gICAgbWVtbzogUGF5bG9hZEJhc2UgfCBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgYXNPZjogQk4gPSBaZXJvQk4sXG4gICAgY2hhbmdlVGhyZXNob2xkOiBudW1iZXIgPSAxXG4gICk6IFByb21pc2U8VW5zaWduZWRUeD4gPT4ge1xuICAgIGNvbnN0IGNhbGxlciA9IFwiYnVpbGRDcmVhdGVTdWJuZXRUeFwiXG5cbiAgICBjb25zdCBmcm9tU2lnbmVyID0gdGhpcy5fcGFyc2VGcm9tU2lnbmVyKGZyb21BZGRyZXNzZXMsIGNhbGxlcilcblxuICAgIGNvbnN0IGNoYW5nZTogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheUJ1ZmZlcihcbiAgICAgIGNoYW5nZUFkZHJlc3NlcyxcbiAgICAgIGNhbGxlclxuICAgIClcbiAgICBjb25zdCBvd25lcnM6IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXlCdWZmZXIoXG4gICAgICBzdWJuZXRPd25lckFkZHJlc3NlcyxcbiAgICAgIGNhbGxlclxuICAgIClcblxuICAgIGlmIChtZW1vIGluc3RhbmNlb2YgUGF5bG9hZEJhc2UpIHtcbiAgICAgIG1lbW8gPSBtZW1vLmdldFBheWxvYWQoKVxuICAgIH1cblxuICAgIGNvbnN0IGF2YXhBc3NldElEOiBCdWZmZXIgPSBhd2FpdCB0aGlzLmdldEFWQVhBc3NldElEKClcbiAgICBjb25zdCBuZXR3b3JrSUQ6IG51bWJlciA9IHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKVxuICAgIGNvbnN0IGJsb2NrY2hhaW5JRDogQnVmZmVyID0gYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRClcbiAgICBjb25zdCBmZWU6IEJOID0gdGhpcy5nZXRDcmVhdGVTdWJuZXRUeEZlZSgpXG5cbiAgICBjb25zdCBidWlsdFVuc2lnbmVkVHg6IFVuc2lnbmVkVHggPSBhd2FpdCB0aGlzLl9nZXRCdWlsZGVyKFxuICAgICAgdXR4b3NldFxuICAgICkuYnVpbGRDcmVhdGVTdWJuZXRUeChcbiAgICAgIG5ldHdvcmtJRCxcbiAgICAgIGJsb2NrY2hhaW5JRCxcbiAgICAgIGZyb21TaWduZXIsXG4gICAgICBjaGFuZ2UsXG4gICAgICBvd25lcnMsXG4gICAgICBzdWJuZXRPd25lclRocmVzaG9sZCxcbiAgICAgIGZlZSxcbiAgICAgIGF2YXhBc3NldElELFxuICAgICAgbWVtbyxcbiAgICAgIGFzT2YsXG4gICAgICBjaGFuZ2VUaHJlc2hvbGRcbiAgICApXG5cbiAgICBpZiAoIShhd2FpdCB0aGlzLmNoZWNrR29vc2VFZ2coYnVpbHRVbnNpZ25lZFR4LCB0aGlzLmdldENyZWF0aW9uVHhGZWUoKSkpKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEdvb3NlRWdnQ2hlY2tFcnJvcihcIkZhaWxlZCBHb29zZSBFZ2cgQ2hlY2tcIilcbiAgICB9XG5cbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4XG4gIH1cblxuICAvKipcbiAgICogQnVpbGQgYW4gdW5zaWduZWQgW1tDcmVhdGVDaGFpblR4XV0uXG4gICAqXG4gICAqIEBwYXJhbSB1dHhvc2V0IEEgc2V0IG9mIFVUWE9zIHRoYXQgdGhlIHRyYW5zYWN0aW9uIGlzIGJ1aWx0IG9uXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBzZW5kIHRoZSBmdW5kcyBmcm9tIHRoZSBVVFhPcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfVxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3NcbiAgICogQHBhcmFtIHN1Ym5ldElEIE9wdGlvbmFsIElEIG9mIHRoZSBTdWJuZXQgdGhhdCB2YWxpZGF0ZXMgdGhpcyBibG9ja2NoYWluXG4gICAqIEBwYXJhbSBjaGFpbk5hbWUgT3B0aW9uYWwgQSBodW1hbiByZWFkYWJsZSBuYW1lIGZvciB0aGUgY2hhaW47IG5lZWQgbm90IGJlIHVuaXF1ZVxuICAgKiBAcGFyYW0gdm1JRCBPcHRpb25hbCBJRCBvZiB0aGUgVk0gcnVubmluZyBvbiB0aGUgbmV3IGNoYWluXG4gICAqIEBwYXJhbSBmeElEcyBPcHRpb25hbCBJRHMgb2YgdGhlIGZlYXR1cmUgZXh0ZW5zaW9ucyBydW5uaW5nIG9uIHRoZSBuZXcgY2hhaW5cbiAgICogQHBhcmFtIGdlbmVzaXNEYXRhIE9wdGlvbmFsIEJ5dGUgcmVwcmVzZW50YXRpb24gb2YgZ2VuZXNpcyBzdGF0ZSBvZiB0aGUgbmV3IGNoYWluXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBzdWJuZXRBdXRoIE9wdGlvbmFsLiBBbiBBdXRoIHN0cnVjdCB3aGljaCBjb250YWlucyB0aGUgc3VibmV0IEF1dGggYW5kIHRoZSBzaWduZXJzLlxuICAgKiBAcGFyYW0gY2hhbmdlVGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgY2hhbmdlIFVUWE9cbiAgICpcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gY3JlYXRlZCBmcm9tIHRoZSBwYXNzZWQgaW4gcGFyYW1ldGVycy5cbiAgICovXG4gIGJ1aWxkQ3JlYXRlQ2hhaW5UeCA9IGFzeW5jIChcbiAgICB1dHhvc2V0OiBVVFhPU2V0LFxuICAgIGZyb21BZGRyZXNzZXM6IEZyb21UeXBlLFxuICAgIGNoYW5nZUFkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgc3VibmV0SUQ6IHN0cmluZyB8IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBjaGFpbk5hbWU6IHN0cmluZyA9IHVuZGVmaW5lZCxcbiAgICB2bUlEOiBzdHJpbmcgPSB1bmRlZmluZWQsXG4gICAgZnhJRHM6IHN0cmluZ1tdID0gdW5kZWZpbmVkLFxuICAgIGdlbmVzaXNEYXRhOiBzdHJpbmcgfCBHZW5lc2lzRGF0YSA9IHVuZGVmaW5lZCxcbiAgICBtZW1vOiBQYXlsb2FkQmFzZSB8IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBhc09mOiBCTiA9IFplcm9CTixcbiAgICBzdWJuZXRBdXRoOiBBdXRoID0geyBhZGRyZXNzZXM6IFtdLCB0aHJlc2hvbGQ6IDAsIHNpZ25lcjogW10gfSxcbiAgICBjaGFuZ2VUaHJlc2hvbGQ6IG51bWJlciA9IDFcbiAgKTogUHJvbWlzZTxVbnNpZ25lZFR4PiA9PiB7XG4gICAgY29uc3QgY2FsbGVyID0gXCJidWlsZENyZWF0ZUNoYWluVHhcIlxuXG4gICAgY29uc3QgZnJvbVNpZ25lciA9IHRoaXMuX3BhcnNlRnJvbVNpZ25lcihmcm9tQWRkcmVzc2VzLCBjYWxsZXIpXG5cbiAgICBjb25zdCBjaGFuZ2U6IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXlCdWZmZXIoXG4gICAgICBjaGFuZ2VBZGRyZXNzZXMsXG4gICAgICBjYWxsZXJcbiAgICApXG5cbiAgICBpZiAobWVtbyBpbnN0YW5jZW9mIFBheWxvYWRCYXNlKSB7XG4gICAgICBtZW1vID0gbWVtby5nZXRQYXlsb2FkKClcbiAgICB9XG5cbiAgICBjb25zdCBhdmF4QXNzZXRJRDogQnVmZmVyID0gYXdhaXQgdGhpcy5nZXRBVkFYQXNzZXRJRCgpXG4gICAgZnhJRHMgPSBmeElEcy5zb3J0KClcblxuICAgIGNvbnN0IG5ldHdvcmtJRDogbnVtYmVyID0gdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpXG4gICAgY29uc3QgYmxvY2tjaGFpbklEOiBCdWZmZXIgPSBiaW50b29scy5jYjU4RGVjb2RlKHRoaXMuYmxvY2tjaGFpbklEKVxuICAgIGNvbnN0IGZlZTogQk4gPSB0aGlzLmdldENyZWF0ZUNoYWluVHhGZWUoKVxuXG4gICAgY29uc3QgYnVpbHRVbnNpZ25lZFR4OiBVbnNpZ25lZFR4ID0gYXdhaXQgdGhpcy5fZ2V0QnVpbGRlcihcbiAgICAgIHV0eG9zZXRcbiAgICApLmJ1aWxkQ3JlYXRlQ2hhaW5UeChcbiAgICAgIG5ldHdvcmtJRCxcbiAgICAgIGJsb2NrY2hhaW5JRCxcbiAgICAgIGZyb21TaWduZXIsXG4gICAgICBjaGFuZ2UsXG4gICAgICBzdWJuZXRJRCxcbiAgICAgIGNoYWluTmFtZSxcbiAgICAgIHZtSUQsXG4gICAgICBmeElEcyxcbiAgICAgIGdlbmVzaXNEYXRhLFxuICAgICAgZmVlLFxuICAgICAgYXZheEFzc2V0SUQsXG4gICAgICBtZW1vLFxuICAgICAgYXNPZixcbiAgICAgIHN1Ym5ldEF1dGgsXG4gICAgICBjaGFuZ2VUaHJlc2hvbGRcbiAgICApXG5cbiAgICBpZiAoIShhd2FpdCB0aGlzLmNoZWNrR29vc2VFZ2coYnVpbHRVbnNpZ25lZFR4LCB0aGlzLmdldENyZWF0aW9uVHhGZWUoKSkpKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEdvb3NlRWdnQ2hlY2tFcnJvcihcIkZhaWxlZCBHb29zZSBFZ2cgQ2hlY2tcIilcbiAgICB9XG5cbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4XG4gIH1cblxuICAvKipcbiAgICogSGVscGVyIGZ1bmN0aW9uIHdoaWNoIGNyZWF0ZXMgYW4gdW5zaWduZWQgW1tDYW1pbm9BZGRWYWxpZGF0b3JUeF1dLiBGb3IgbW9yZSBncmFudWxhciBjb250cm9sLCB5b3UgbWF5IGNyZWF0ZSB5b3VyIG93blxuICAgKiBbW1Vuc2lnbmVkVHhdXSBtYW51YWxseSBhbmQgaW1wb3J0IHRoZSBbW0NhbWlub0FkZFZhbGlkYXRvclR4XV0gY2xhc3MgZGlyZWN0bHkuXG4gICAqXG4gICAqIEBwYXJhbSB1dHhvc2V0IEEgc2V0IG9mIFVUWE9zIHRoYXQgdGhlIHRyYW5zYWN0aW9uIGlzIGJ1aWx0IG9uXG4gICAqIEBwYXJhbSB0b0FkZHJlc3NlcyBBbiBhcnJheSBvZiBhZGRyZXNzZXMgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2hvIHJlY2VpdmVkIHRoZSBzdGFrZWQgdG9rZW5zIGF0IHRoZSBlbmQgb2YgdGhlIHN0YWtpbmcgcGVyaW9kXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB3aG8gb3duIHRoZSBzdGFraW5nIFVUWE9zIHRoZSBmZWVzIGluIEFWQVhcbiAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBBbiBhcnJheSBvZiBhZGRyZXNzZXMgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2hvIGdldHMgdGhlIGNoYW5nZSBsZWZ0b3ZlciBmcm9tIHRoZSBmZWUgcGF5bWVudFxuICAgKiBAcGFyYW0gbm9kZUlEIFRoZSBub2RlIElEIG9mIHRoZSB2YWxpZGF0b3IgYmVpbmcgYWRkZWQuXG4gICAqIEBwYXJhbSBub2RlT3duZXIgVGhlIGFkZHJlc3MgYW5kIHNpZ25hdHVyZSBpbmRpY2VzIG9mIHRoZSByZWdpc3RlcmVkIG5vZGVJZCBvd25lci5cbiAgICogQHBhcmFtIHN0YXJ0VGltZSBUaGUgVW5peCB0aW1lIHdoZW4gdGhlIHZhbGlkYXRvciBzdGFydHMgdmFsaWRhdGluZyB0aGUgUHJpbWFyeSBOZXR3b3JrLlxuICAgKiBAcGFyYW0gZW5kVGltZSBUaGUgVW5peCB0aW1lIHdoZW4gdGhlIHZhbGlkYXRvciBzdG9wcyB2YWxpZGF0aW5nIHRoZSBQcmltYXJ5IE5ldHdvcmsgKGFuZCBzdGFrZWQgQVZBWCBpcyByZXR1cm5lZCkuXG4gICAqIEBwYXJhbSBzdGFrZUFtb3VudCBUaGUgYW1vdW50IGJlaW5nIGRlbGVnYXRlZCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSByZXdhcmRBZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB3aGljaCB3aWxsIHJlY2lldmUgdGhlIHJld2FyZHMgZnJvbSB0aGUgZGVsZWdhdGVkIHN0YWtlLlxuICAgKiBAcGFyYW0gcmV3YXJkTG9ja3RpbWUgT3B0aW9uYWwuIFRoZSBsb2NrdGltZSBmaWVsZCBjcmVhdGVkIGluIHRoZSByZXN1bHRpbmcgcmV3YXJkIG91dHB1dHNcbiAgICogQHBhcmFtIHJld2FyZFRocmVzaG9sZCBPcGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgcmV3YXJkIFVUWE8uIERlZmF1bHQgMS5cbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIHRvVGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgVVRYT1xuICAgKiBAcGFyYW0gY2hhbmdlVGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgY2hhbmdlIFVUWE9cbiAgICpcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gY3JlYXRlZCBmcm9tIHRoZSBwYXNzZWQgaW4gcGFyYW1ldGVycy5cbiAgICovXG4gIGJ1aWxkQ2FtaW5vQWRkVmFsaWRhdG9yVHggPSBhc3luYyAoXG4gICAgdXR4b3NldDogVVRYT1NldCxcbiAgICB0b0FkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgZnJvbUFkZHJlc3NlczogRnJvbVR5cGUsXG4gICAgY2hhbmdlQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICBub2RlSUQ6IHN0cmluZyxcbiAgICBub2RlT3duZXI6IE5vZGVPd25lclR5cGUsXG4gICAgc3RhcnRUaW1lOiBCTixcbiAgICBlbmRUaW1lOiBCTixcbiAgICBzdGFrZUFtb3VudDogQk4sXG4gICAgcmV3YXJkQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICByZXdhcmRMb2NrdGltZTogQk4gPSBaZXJvQk4sXG4gICAgcmV3YXJkVGhyZXNob2xkOiBudW1iZXIgPSAxLFxuICAgIG1lbW86IFBheWxvYWRCYXNlIHwgQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGFzT2Y6IEJOID0gWmVyb0JOLFxuICAgIHRvVGhyZXNob2xkOiBudW1iZXIgPSAxLFxuICAgIGNoYW5nZVRocmVzaG9sZDogbnVtYmVyID0gMVxuICApOiBQcm9taXNlPFVuc2lnbmVkVHg+ID0+IHtcbiAgICBjb25zdCBjYWxsZXIgPSBcImJ1aWxkQ2FtaW5vQWRkVmFsaWRhdG9yVHhcIlxuXG4gICAgY29uc3QgdG86IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXlCdWZmZXIodG9BZGRyZXNzZXMsIGNhbGxlcilcblxuICAgIGNvbnN0IGZyb21TaWduZXIgPSB0aGlzLl9wYXJzZUZyb21TaWduZXIoZnJvbUFkZHJlc3NlcywgY2FsbGVyKVxuXG4gICAgY29uc3QgY2hhbmdlOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5QnVmZmVyKFxuICAgICAgY2hhbmdlQWRkcmVzc2VzLFxuICAgICAgY2FsbGVyXG4gICAgKVxuICAgIGNvbnN0IHJld2FyZHM6IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXlCdWZmZXIoXG4gICAgICByZXdhcmRBZGRyZXNzZXMsXG4gICAgICBjYWxsZXJcbiAgICApXG5cbiAgICBpZiAobWVtbyBpbnN0YW5jZW9mIFBheWxvYWRCYXNlKSB7XG4gICAgICBtZW1vID0gbWVtby5nZXRQYXlsb2FkKClcbiAgICB9XG5cbiAgICBjb25zdCBtaW5TdGFrZTogQk4gPSAoYXdhaXQgdGhpcy5nZXRNaW5TdGFrZSgpKVtcIm1pblZhbGlkYXRvclN0YWtlXCJdXG4gICAgaWYgKHN0YWtlQW1vdW50Lmx0KG1pblN0YWtlKSkge1xuICAgICAgdGhyb3cgbmV3IFN0YWtlRXJyb3IoXG4gICAgICAgIGBQbGF0Zm9ybVZNQVBJLiR7Y2FsbGVyfSAtLSBzdGFrZSBhbW91bnQgbXVzdCBiZSBhdCBsZWFzdCBgICtcbiAgICAgICAgICBtaW5TdGFrZS50b1N0cmluZygxMClcbiAgICAgIClcbiAgICB9XG5cbiAgICBjb25zdCBhdmF4QXNzZXRJRDogQnVmZmVyID0gYXdhaXQgdGhpcy5nZXRBVkFYQXNzZXRJRCgpXG5cbiAgICBjb25zdCBub3c6IEJOID0gVW5peE5vdygpXG4gICAgaWYgKHN0YXJ0VGltZS5sdChub3cpIHx8IGVuZFRpbWUubHRlKHN0YXJ0VGltZSkpIHtcbiAgICAgIHRocm93IG5ldyBUaW1lRXJyb3IoXG4gICAgICAgIGBQbGF0Zm9ybVZNQVBJLiR7Y2FsbGVyfSAtLSBzdGFydFRpbWUgbXVzdCBiZSBpbiB0aGUgZnV0dXJlIGFuZCBlbmRUaW1lIG11c3QgY29tZSBhZnRlciBzdGFydFRpbWVgXG4gICAgICApXG4gICAgfVxuXG4gICAgY29uc3QgYXV0aDogTm9kZU93bmVyID0ge1xuICAgICAgYWRkcmVzczogdGhpcy5wYXJzZUFkZHJlc3Mobm9kZU93bmVyLmFkZHJlc3MpLFxuICAgICAgYXV0aDogW11cbiAgICB9XG4gICAgbm9kZU93bmVyLmF1dGguZm9yRWFjaCgobykgPT4ge1xuICAgICAgYXV0aC5hdXRoLnB1c2goW29bMF0sIHRoaXMucGFyc2VBZGRyZXNzKG9bMV0pXSlcbiAgICB9KVxuXG4gICAgY29uc3QgYnVpbHRVbnNpZ25lZFR4OiBVbnNpZ25lZFR4ID0gYXdhaXQgdGhpcy5fZ2V0QnVpbGRlcihcbiAgICAgIHV0eG9zZXRcbiAgICApLmJ1aWxkQ2FtaW5vQWRkVmFsaWRhdG9yVHgoXG4gICAgICB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCksXG4gICAgICBiaW50b29scy5jYjU4RGVjb2RlKHRoaXMuYmxvY2tjaGFpbklEKSxcbiAgICAgIHRvLFxuICAgICAgZnJvbVNpZ25lcixcbiAgICAgIGNoYW5nZSxcbiAgICAgIE5vZGVJRFN0cmluZ1RvQnVmZmVyKG5vZGVJRCksXG4gICAgICBhdXRoLFxuICAgICAgc3RhcnRUaW1lLFxuICAgICAgZW5kVGltZSxcbiAgICAgIHN0YWtlQW1vdW50LFxuICAgICAgYXZheEFzc2V0SUQsXG4gICAgICByZXdhcmRzLFxuICAgICAgcmV3YXJkTG9ja3RpbWUsXG4gICAgICByZXdhcmRUaHJlc2hvbGQsXG4gICAgICBtZW1vLFxuICAgICAgYXNPZixcbiAgICAgIHRvVGhyZXNob2xkLFxuICAgICAgY2hhbmdlVGhyZXNob2xkXG4gICAgKVxuXG4gICAgaWYgKCEoYXdhaXQgdGhpcy5jaGVja0dvb3NlRWdnKGJ1aWx0VW5zaWduZWRUeCkpKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEdvb3NlRWdnQ2hlY2tFcnJvcihcIkZhaWxlZCBHb29zZSBFZ2cgQ2hlY2tcIilcbiAgICB9XG5cbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4XG4gIH1cblxuICAvKipcbiAgICogQnVpbGQgYW4gdW5zaWduZWQgW1tBZGRyZXNzU3RhdGVUeF1dLlxuICAgKlxuICAgKiBAcGFyYW0gdXR4b3NldCBBIHNldCBvZiBVVFhPcyB0aGF0IHRoZSB0cmFuc2FjdGlvbiBpcyBidWlsdCBvblxuICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGJlaW5nIHVzZWQgdG8gc2VuZCB0aGUgZnVuZHMgZnJvbSB0aGUgVVRYT3Mge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1cbiAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRoYXQgY2FuIHNwZW5kIHRoZSBjaGFuZ2UgcmVtYWluaW5nIGZyb20gdGhlIHNwZW50IFVUWE9zLlxuICAgKiBAcGFyYW0gYWRkcmVzcyBUaGUgYWRkcmVzcyB0byBhbHRlciBzdGF0ZS5cbiAgICogQHBhcmFtIHN0YXRlIFRoZSBzdGF0ZSB0byBzZXQgb3IgcmVtb3ZlIG9uIHRoZSBnaXZlbiBhZGRyZXNzXG4gICAqIEBwYXJhbSByZW1vdmUgT3B0aW9uYWwuIEZsYWcgaWYgc3RhdGUgc2hvdWxkIGJlIGFwcGxpZWQgb3IgcmVtb3ZlZFxuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xuICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gY2hhbmdlVGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgY2hhbmdlIFVUWE9cbiAgICpcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgQWRkcmVzc1N0YXRlVHggY3JlYXRlZCBmcm9tIHRoZSBwYXNzZWQgaW4gcGFyYW1ldGVycy5cbiAgICovXG4gIGJ1aWxkQWRkcmVzc1N0YXRlVHggPSBhc3luYyAoXG4gICAgdXR4b3NldDogVVRYT1NldCxcbiAgICBmcm9tQWRkcmVzc2VzOiBGcm9tVHlwZSxcbiAgICBjaGFuZ2VBZGRyZXNzZXM6IHN0cmluZ1tdLFxuICAgIGFkZHJlc3M6IHN0cmluZyB8IEJ1ZmZlcixcbiAgICBzdGF0ZTogbnVtYmVyLFxuICAgIHJlbW92ZTogYm9vbGVhbiA9IGZhbHNlLFxuICAgIG1lbW86IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBhc09mOiBCTiA9IFplcm9CTixcbiAgICBjaGFuZ2VUaHJlc2hvbGQ6IG51bWJlciA9IDFcbiAgKTogUHJvbWlzZTxVbnNpZ25lZFR4PiA9PiB7XG4gICAgY29uc3QgY2FsbGVyID0gXCJidWlsZEFkZHJlc3NTdGF0ZVR4XCJcblxuICAgIGNvbnN0IGZyb21TaWduZXIgPSB0aGlzLl9wYXJzZUZyb21TaWduZXIoZnJvbUFkZHJlc3NlcywgY2FsbGVyKVxuXG4gICAgY29uc3QgY2hhbmdlOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5QnVmZmVyKFxuICAgICAgY2hhbmdlQWRkcmVzc2VzLFxuICAgICAgY2FsbGVyXG4gICAgKVxuICAgIGNvbnN0IGFkZHJlc3NCdWYgPVxuICAgICAgdHlwZW9mIGFkZHJlc3MgPT09IFwic3RyaW5nXCIgPyB0aGlzLnBhcnNlQWRkcmVzcyhhZGRyZXNzKSA6IGFkZHJlc3NcbiAgICBpZiAobWVtbyBpbnN0YW5jZW9mIFBheWxvYWRCYXNlKSB7XG4gICAgICBtZW1vID0gbWVtby5nZXRQYXlsb2FkKClcbiAgICB9XG5cbiAgICBjb25zdCBhdmF4QXNzZXRJRDogQnVmZmVyID0gYXdhaXQgdGhpcy5nZXRBVkFYQXNzZXRJRCgpXG4gICAgY29uc3QgbmV0d29ya0lEOiBudW1iZXIgPSB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKClcbiAgICBjb25zdCBibG9ja2NoYWluSUQ6IEJ1ZmZlciA9IGJpbnRvb2xzLmNiNThEZWNvZGUodGhpcy5ibG9ja2NoYWluSUQpXG4gICAgY29uc3QgZmVlOiBCTiA9IHRoaXMuZ2V0VHhGZWUoKVxuXG4gICAgY29uc3QgYnVpbHRVbnNpZ25lZFR4OiBVbnNpZ25lZFR4ID0gYXdhaXQgdGhpcy5fZ2V0QnVpbGRlcihcbiAgICAgIHV0eG9zZXRcbiAgICApLmJ1aWxkQWRkcmVzc1N0YXRlVHgoXG4gICAgICBuZXR3b3JrSUQsXG4gICAgICBibG9ja2NoYWluSUQsXG4gICAgICBmcm9tU2lnbmVyLFxuICAgICAgY2hhbmdlLFxuICAgICAgYWRkcmVzc0J1ZixcbiAgICAgIHN0YXRlLFxuICAgICAgcmVtb3ZlLFxuICAgICAgZmVlLFxuICAgICAgYXZheEFzc2V0SUQsXG4gICAgICBtZW1vLFxuICAgICAgYXNPZixcbiAgICAgIGNoYW5nZVRocmVzaG9sZFxuICAgIClcblxuICAgIGlmICghKGF3YWl0IHRoaXMuY2hlY2tHb29zZUVnZyhidWlsdFVuc2lnbmVkVHgsIHRoaXMuZ2V0Q3JlYXRpb25UeEZlZSgpKSkpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgR29vc2VFZ2dDaGVja0Vycm9yKFwiRmFpbGVkIEdvb3NlIEVnZyBDaGVja1wiKVxuICAgIH1cblxuICAgIHJldHVybiBidWlsdFVuc2lnbmVkVHhcbiAgfVxuXG4gIC8qKlxuICAgKiBCdWlsZCBhbiB1bnNpZ25lZCBbW1JlZ2lzdGVyTm9kZVR4XV0uXG4gICAqXG4gICAqIEBwYXJhbSB1dHhvc2V0IEEgc2V0IG9mIFVUWE9zIHRoYXQgdGhlIHRyYW5zYWN0aW9uIGlzIGJ1aWx0IG9uXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBzZW5kIHRoZSBmdW5kcyBmcm9tIHRoZSBVVFhPcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfVxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3NcbiAgICogQHBhcmFtIG9sZE5vZGVJRCBPcHRpb25hbC4gSUQgb2YgdGhlIGV4aXN0aW5nIE5vZGVJRCB0byByZXBsYWNlIG9yIHJlbW92ZS5cbiAgICogQHBhcmFtIG5ld05vZGVJRCBPcHRpb25hbC4gSUQgb2YgdGhlIG5ld05vZElEIHRvIHJlZ2lzdGVyIGFkZHJlc3MuXG4gICAqIEBwYXJhbSBhZGRyZXNzIFRoZSBjb25zb3J0aXVtTWVtYmVyQWRkcmVzcywgc2luZ2xlIG9yIG11bHRpLXNpZy5cbiAgICogQHBhcmFtIGFkZHJlc3NBdXRocyBBbiBhcnJheSBvZiBpbmRleCBhbmQgYWRkcmVzcyB0byB2ZXJpZnkgb3duZXJzaGlwIG9mIGFkZHJlc3MuXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBjaGFuZ2VUaHJlc2hvbGQgT3B0aW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCBjaGFuZ2UgVVRYT1xuICAgKlxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiBjcmVhdGVkIGZyb20gdGhlIHBhc3NlZCBpbiBwYXJhbWV0ZXJzLlxuICAgKi9cbiAgYnVpbGRSZWdpc3Rlck5vZGVUeCA9IGFzeW5jIChcbiAgICB1dHhvc2V0OiBVVFhPU2V0LFxuICAgIGZyb21BZGRyZXNzZXM6IEZyb21UeXBlLFxuICAgIGNoYW5nZUFkZHJlc3Nlczogc3RyaW5nW10gPSB1bmRlZmluZWQsXG4gICAgb2xkTm9kZUlEOiBzdHJpbmcgfCBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgbmV3Tm9kZUlEOiBzdHJpbmcgfCBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgYWRkcmVzczogc3RyaW5nIHwgQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGFkZHJlc3NBdXRoczogW251bWJlciwgc3RyaW5nIHwgQnVmZmVyXVtdID0gW10sXG4gICAgbWVtbzogUGF5bG9hZEJhc2UgfCBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgYXNPZjogQk4gPSBaZXJvQk4sXG4gICAgY2hhbmdlVGhyZXNob2xkOiBudW1iZXIgPSAxXG4gICk6IFByb21pc2U8VW5zaWduZWRUeD4gPT4ge1xuICAgIGNvbnN0IGNhbGxlciA9IFwiYnVpbGRSZWdpc3Rlck5vZGVUeFwiXG5cbiAgICBjb25zdCBmcm9tU2lnbmVyID0gdGhpcy5fcGFyc2VGcm9tU2lnbmVyKGZyb21BZGRyZXNzZXMsIGNhbGxlcilcblxuICAgIGNvbnN0IGNoYW5nZTogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheUJ1ZmZlcihcbiAgICAgIGNoYW5nZUFkZHJlc3NlcyxcbiAgICAgIGNhbGxlclxuICAgIClcbiAgICBjb25zdCBhZGRyQnVmID1cbiAgICAgIHR5cGVvZiBhZGRyZXNzID09PSBcInN0cmluZ1wiID8gdGhpcy5wYXJzZUFkZHJlc3MoYWRkcmVzcykgOiBhZGRyZXNzXG5cbiAgICBpZiAobWVtbyBpbnN0YW5jZW9mIFBheWxvYWRCYXNlKSB7XG4gICAgICBtZW1vID0gbWVtby5nZXRQYXlsb2FkKClcbiAgICB9XG4gICAgY29uc3QgYXV0aDogW251bWJlciwgQnVmZmVyXVtdID0gW11cbiAgICBhZGRyZXNzQXV0aHMuZm9yRWFjaCgoYykgPT4ge1xuICAgICAgYXV0aC5wdXNoKFtcbiAgICAgICAgY1swXSxcbiAgICAgICAgdHlwZW9mIGNbMV0gPT09IFwic3RyaW5nXCIgPyB0aGlzLnBhcnNlQWRkcmVzcyhjWzFdKSA6IGNbMV1cbiAgICAgIF0pXG4gICAgfSlcblxuICAgIGlmICh0eXBlb2Ygb2xkTm9kZUlEID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBvbGROb2RlSUQgPSBOb2RlSURTdHJpbmdUb0J1ZmZlcihvbGROb2RlSUQpXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBuZXdOb2RlSUQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIG5ld05vZGVJRCA9IE5vZGVJRFN0cmluZ1RvQnVmZmVyKG5ld05vZGVJRClcbiAgICB9XG5cbiAgICBjb25zdCBhdmF4QXNzZXRJRDogQnVmZmVyID0gYXdhaXQgdGhpcy5nZXRBVkFYQXNzZXRJRCgpXG4gICAgY29uc3QgbmV0d29ya0lEOiBudW1iZXIgPSB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKClcbiAgICBjb25zdCBibG9ja2NoYWluSUQ6IEJ1ZmZlciA9IGJpbnRvb2xzLmNiNThEZWNvZGUodGhpcy5ibG9ja2NoYWluSUQpXG4gICAgY29uc3QgZmVlOiBCTiA9IHRoaXMuZ2V0VHhGZWUoKVxuXG4gICAgY29uc3QgYnVpbHRVbnNpZ25lZFR4OiBVbnNpZ25lZFR4ID0gYXdhaXQgdGhpcy5fZ2V0QnVpbGRlcihcbiAgICAgIHV0eG9zZXRcbiAgICApLmJ1aWxkUmVnaXN0ZXJOb2RlVHgoXG4gICAgICBuZXR3b3JrSUQsXG4gICAgICBibG9ja2NoYWluSUQsXG4gICAgICBmcm9tU2lnbmVyLFxuICAgICAgY2hhbmdlLFxuICAgICAgb2xkTm9kZUlELFxuICAgICAgbmV3Tm9kZUlELFxuICAgICAgYWRkckJ1ZixcbiAgICAgIGF1dGgsXG4gICAgICBmZWUsXG4gICAgICBhdmF4QXNzZXRJRCxcbiAgICAgIG1lbW8sXG4gICAgICBhc09mLFxuICAgICAgY2hhbmdlVGhyZXNob2xkXG4gICAgKVxuXG4gICAgaWYgKCEoYXdhaXQgdGhpcy5jaGVja0dvb3NlRWdnKGJ1aWx0VW5zaWduZWRUeCwgdGhpcy5nZXRDcmVhdGlvblR4RmVlKCkpKSkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBHb29zZUVnZ0NoZWNrRXJyb3IoXCJGYWlsZWQgR29vc2UgRWdnIENoZWNrXCIpXG4gICAgfVxuXG4gICAgcmV0dXJuIGJ1aWx0VW5zaWduZWRUeFxuICB9XG5cbiAgLyoqXG4gICAqIEJ1aWxkIGFuIHVuc2lnbmVkIFtbRGVwb3NpdFR4XV0uXG4gICAqXG4gICAqIEBwYXJhbSB1dHhvc2V0IEEgc2V0IG9mIFVUWE9zIHRoYXQgdGhlIHRyYW5zYWN0aW9uIGlzIGJ1aWx0IG9uXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBzZW5kIHRoZSBmdW5kcyBmcm9tIHRoZSBVVFhPcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfVxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3MuXG4gICAqIEBwYXJhbSBkZXBvc2l0T2ZmZXJJRCBJRCBvZiB0aGUgZGVwb3NpdCBvZmZlci5cbiAgICogQHBhcmFtIGRlcG9zaXREdXJhdGlvbiBEdXJhdGlvbiBvZiB0aGUgZGVwb3NpdFxuICAgKiBAcGFyYW0gcmV3YXJkc093bmVyIE9wdGlvbmFsIFRoZSBvd25lcnMgb2YgdGhlIHJld2FyZC4gSWYgb21pdHRlZCwgYWxsIGlucHV0cyBtdXN0IGhhdmUgdGhlIHNhbWUgb3duZXJcbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIGNoYW5nZVRocmVzaG9sZCBPcHRpb25hbC4gVGhlIG51bWJlciBvZiBzaWduYXR1cmVzIHJlcXVpcmVkIHRvIHNwZW5kIHRoZSBmdW5kcyBpbiB0aGUgcmVzdWx0YW50IGNoYW5nZSBVVFhPXG4gICAqXG4gICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIGNyZWF0ZWQgZnJvbSB0aGUgcGFzc2VkIGluIHBhcmFtZXRlcnMuXG4gICAqL1xuICBidWlsZERlcG9zaXRUeCA9IGFzeW5jIChcbiAgICB1dHhvc2V0OiBVVFhPU2V0LFxuICAgIGZyb21BZGRyZXNzZXM6IEZyb21UeXBlLFxuICAgIGNoYW5nZUFkZHJlc3Nlczogc3RyaW5nW10gPSB1bmRlZmluZWQsXG4gICAgZGVwb3NpdE9mZmVySUQ6IHN0cmluZyB8IEJ1ZmZlcixcbiAgICBkZXBvc2l0RHVyYXRpb246IG51bWJlciB8IEJ1ZmZlcixcbiAgICByZXdhcmRzT3duZXI6IE91dHB1dE93bmVycyA9IHVuZGVmaW5lZCxcbiAgICBtZW1vOiBQYXlsb2FkQmFzZSB8IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBhc09mOiBCTiA9IFplcm9CTixcbiAgICBhbW91bnRUb0xvY2s6IEJOLFxuICAgIGNoYW5nZVRocmVzaG9sZDogbnVtYmVyID0gMVxuICApOiBQcm9taXNlPFVuc2lnbmVkVHg+ID0+IHtcbiAgICBjb25zdCBjYWxsZXIgPSBcImJ1aWxkUmVnaXN0ZXJOb2RlVHhcIlxuXG4gICAgY29uc3QgZnJvbVNpZ25lciA9IHRoaXMuX3BhcnNlRnJvbVNpZ25lcihmcm9tQWRkcmVzc2VzLCBjYWxsZXIpXG5cbiAgICBjb25zdCBjaGFuZ2U6IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXlCdWZmZXIoXG4gICAgICBjaGFuZ2VBZGRyZXNzZXMsXG4gICAgICBjYWxsZXJcbiAgICApXG5cbiAgICBpZiAobWVtbyBpbnN0YW5jZW9mIFBheWxvYWRCYXNlKSB7XG4gICAgICBtZW1vID0gbWVtby5nZXRQYXlsb2FkKClcbiAgICB9XG5cbiAgICBjb25zdCBhdmF4QXNzZXRJRDogQnVmZmVyID0gYXdhaXQgdGhpcy5nZXRBVkFYQXNzZXRJRCgpXG4gICAgY29uc3QgbmV0d29ya0lEOiBudW1iZXIgPSB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKClcbiAgICBjb25zdCBibG9ja2NoYWluSUQ6IEJ1ZmZlciA9IGJpbnRvb2xzLmNiNThEZWNvZGUodGhpcy5ibG9ja2NoYWluSUQpXG4gICAgY29uc3QgZmVlOiBCTiA9IHRoaXMuZ2V0VHhGZWUoKVxuXG4gICAgY29uc3QgYnVpbHRVbnNpZ25lZFR4OiBVbnNpZ25lZFR4ID0gYXdhaXQgdGhpcy5fZ2V0QnVpbGRlcihcbiAgICAgIHV0eG9zZXRcbiAgICApLmJ1aWxkRGVwb3NpdFR4KFxuICAgICAgbmV0d29ya0lELFxuICAgICAgYmxvY2tjaGFpbklELFxuICAgICAgZnJvbVNpZ25lcixcbiAgICAgIGNoYW5nZSxcbiAgICAgIGRlcG9zaXRPZmZlcklELFxuICAgICAgZGVwb3NpdER1cmF0aW9uLFxuICAgICAgcmV3YXJkc093bmVyLFxuICAgICAgZmVlLFxuICAgICAgYXZheEFzc2V0SUQsXG4gICAgICBtZW1vLFxuICAgICAgYXNPZixcbiAgICAgIGFtb3VudFRvTG9jayxcbiAgICAgIGNoYW5nZVRocmVzaG9sZFxuICAgIClcblxuICAgIGlmICghKGF3YWl0IHRoaXMuY2hlY2tHb29zZUVnZyhidWlsdFVuc2lnbmVkVHgsIHRoaXMuZ2V0Q3JlYXRpb25UeEZlZSgpKSkpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgR29vc2VFZ2dDaGVja0Vycm9yKFwiRmFpbGVkIEdvb3NlIEVnZyBDaGVja1wiKVxuICAgIH1cblxuICAgIHJldHVybiBidWlsdFVuc2lnbmVkVHhcbiAgfVxuXG4gIC8qKlxuICAgKiBCdWlsZCBhbiB1bnNpZ25lZCBbW1VubG9ja0RlcG9zaXRUeF1dLlxuICAgKlxuICAgKiBAcGFyYW0gdXR4b3NldCBBIHNldCBvZiBVVFhPcyB0aGF0IHRoZSB0cmFuc2FjdGlvbiBpcyBidWlsdCBvblxuICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGJlaW5nIHVzZWQgdG8gc2VuZCB0aGUgZnVuZHMgZnJvbSB0aGUgVVRYT3Mge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1cbiAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRoYXQgY2FuIHNwZW5kIHRoZSBjaGFuZ2UgcmVtYWluaW5nIGZyb20gdGhlIHNwZW50IFVUWE9zLlxuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xuICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gY2hhbmdlVGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgY2hhbmdlIFVUWE9cbiAgICpcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gY3JlYXRlZCBmcm9tIHRoZSBwYXNzZWQgaW4gcGFyYW1ldGVycy5cbiAgICovXG4gIGJ1aWxkVW5sb2NrRGVwb3NpdFR4ID0gYXN5bmMgKFxuICAgIHV0eG9zZXQ6IFVUWE9TZXQsXG4gICAgZnJvbUFkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgY2hhbmdlQWRkcmVzc2VzOiBzdHJpbmdbXSA9IHVuZGVmaW5lZCxcbiAgICBtZW1vOiBQYXlsb2FkQmFzZSB8IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBhc09mOiBCTiA9IFplcm9CTixcbiAgICBhbW91bnRUb0xvY2s6IEJOLFxuICAgIGNoYW5nZVRocmVzaG9sZDogbnVtYmVyID0gMVxuICApOiBQcm9taXNlPFVuc2lnbmVkVHg+ID0+IHtcbiAgICBjb25zdCBjYWxsZXIgPSBcImJ1aWxkVW5sb2NrRGVwb3NpdFR4XCJcbiAgICBjb25zdCBmcm9tU2lnbmVyID0gdGhpcy5fcGFyc2VGcm9tU2lnbmVyKGZyb21BZGRyZXNzZXMsIGNhbGxlcilcbiAgICBjb25zdCBjaGFuZ2U6IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXlCdWZmZXIoXG4gICAgICBjaGFuZ2VBZGRyZXNzZXMsXG4gICAgICBjYWxsZXJcbiAgICApXG4gICAgaWYgKG1lbW8gaW5zdGFuY2VvZiBQYXlsb2FkQmFzZSkge1xuICAgICAgbWVtbyA9IG1lbW8uZ2V0UGF5bG9hZCgpXG4gICAgfVxuXG4gICAgY29uc3QgYXZheEFzc2V0SUQ6IEJ1ZmZlciA9IGF3YWl0IHRoaXMuZ2V0QVZBWEFzc2V0SUQoKVxuICAgIGNvbnN0IG5ldHdvcmtJRDogbnVtYmVyID0gdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpXG4gICAgY29uc3QgYmxvY2tjaGFpbklEOiBCdWZmZXIgPSBiaW50b29scy5jYjU4RGVjb2RlKHRoaXMuYmxvY2tjaGFpbklEKVxuICAgIGNvbnN0IGZlZTogQk4gPSB0aGlzLmdldFR4RmVlKClcblxuICAgIGNvbnN0IGJ1aWx0VW5zaWduZWRUeDogVW5zaWduZWRUeCA9IGF3YWl0IHRoaXMuX2dldEJ1aWxkZXIoXG4gICAgICB1dHhvc2V0XG4gICAgKS5idWlsZFVubG9ja0RlcG9zaXRUeChcbiAgICAgIG5ldHdvcmtJRCxcbiAgICAgIGJsb2NrY2hhaW5JRCxcbiAgICAgIGZyb21TaWduZXIsXG4gICAgICBjaGFuZ2UsXG4gICAgICBmZWUsXG4gICAgICBhdmF4QXNzZXRJRCxcbiAgICAgIG1lbW8sXG4gICAgICBhc09mLFxuICAgICAgY2hhbmdlVGhyZXNob2xkXG4gICAgKVxuXG4gICAgaWYgKCEoYXdhaXQgdGhpcy5jaGVja0dvb3NlRWdnKGJ1aWx0VW5zaWduZWRUeCwgdGhpcy5nZXRDcmVhdGlvblR4RmVlKCkpKSkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBHb29zZUVnZ0NoZWNrRXJyb3IoXCJGYWlsZWQgR29vc2UgRWdnIENoZWNrXCIpXG4gICAgfVxuXG4gICAgcmV0dXJuIGJ1aWx0VW5zaWduZWRUeFxuICB9XG5cbiAgLyoqXG4gICAqIEJ1aWxkIGFuIHVuc2lnbmVkIFtbQ2xhaW1UeF1dLlxuICAgKlxuICAgKiBAcGFyYW0gdXR4b3NldCBBIHNldCBvZiBVVFhPcyB0aGF0IHRoZSB0cmFuc2FjdGlvbiBpcyBidWlsdCBvblxuICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGJlaW5nIHVzZWQgdG8gc2VuZCB0aGUgZnVuZHMgZnJvbSB0aGUgVVRYT3Mge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1cbiAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRoYXQgY2FuIHNwZW5kIHRoZSBjaGFuZ2UgcmVtYWluaW5nIGZyb20gdGhlIHNwZW50IFVUWE9zLlxuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xuICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gY2hhbmdlVGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgY2hhbmdlIFVUWE9cbiAgICogQHBhcmFtIGNsYWltQW1vdW50cyBUaGUgc3BlY2lmaWNhdGlvbiBhbmQgYXV0aGVudGljYXRpb24gd2hhdCBhbmQgaG93IG11Y2ggdG8gY2xhaW1cbiAgICogQHBhcmFtIGNsYWltVG8gVGhlIGFkZHJlc3MgdG8gY2xhaW1lZCByZXdhcmRzIHdpbGwgYmUgZGlyZWN0ZWQgdG9cbiAgICpcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gY3JlYXRlZCBmcm9tIHRoZSBwYXNzZWQgaW4gcGFyYW1ldGVycy5cbiAgICovXG4gIGJ1aWxkQ2xhaW1UeCA9IGFzeW5jIChcbiAgICB1dHhvc2V0OiBVVFhPU2V0LFxuICAgIGZyb21BZGRyZXNzZXM6IEZyb21UeXBlLFxuICAgIGNoYW5nZUFkZHJlc3Nlczogc3RyaW5nW10gPSB1bmRlZmluZWQsXG4gICAgbWVtbzogUGF5bG9hZEJhc2UgfCBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgYXNPZjogQk4gPSBaZXJvQk4sXG4gICAgY2hhbmdlVGhyZXNob2xkOiBudW1iZXIgPSAxLFxuICAgIGNsYWltQW1vdW50czogQ2xhaW1BbW91bnRQYXJhbXNbXSxcbiAgICBjbGFpbVRvOiBPdXRwdXRPd25lcnMgPSB1bmRlZmluZWRcbiAgKTogUHJvbWlzZTxVbnNpZ25lZFR4PiA9PiB7XG4gICAgY29uc3QgY2FsbGVyID0gXCJidWlsZENsYWltVHhcIlxuICAgIGNvbnN0IGZyb21TaWduZXIgPSB0aGlzLl9wYXJzZUZyb21TaWduZXIoZnJvbUFkZHJlc3NlcywgY2FsbGVyKVxuICAgIGNvbnN0IGNoYW5nZTogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheUJ1ZmZlcihcbiAgICAgIGNoYW5nZUFkZHJlc3NlcyxcbiAgICAgIGNhbGxlclxuICAgIClcbiAgICBpZiAobWVtbyBpbnN0YW5jZW9mIFBheWxvYWRCYXNlKSB7XG4gICAgICBtZW1vID0gbWVtby5nZXRQYXlsb2FkKClcbiAgICB9XG4gICAgaWYgKGNsYWltQW1vdW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk11c3QgcHJvdmlkZSBhdCBsZWFzdCBvbmUgY2xhaW1BbW91bnRcIilcbiAgICB9XG4gICAgY29uc3QgYXZheEFzc2V0SUQ6IEJ1ZmZlciA9IGF3YWl0IHRoaXMuZ2V0QVZBWEFzc2V0SUQoKVxuICAgIGNvbnN0IG5ldHdvcmtJRDogbnVtYmVyID0gdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpXG4gICAgY29uc3QgYmxvY2tjaGFpbklEOiBCdWZmZXIgPSBiaW50b29scy5jYjU4RGVjb2RlKHRoaXMuYmxvY2tjaGFpbklEKVxuICAgIGNvbnN0IGZlZTogQk4gPSB0aGlzLmdldFR4RmVlKClcblxuICAgIGNvbnN0IHVuc2lnbmVkQ2xhaW1UeDogVW5zaWduZWRUeCA9IGF3YWl0IHRoaXMuX2dldEJ1aWxkZXIoXG4gICAgICB1dHhvc2V0XG4gICAgKS5idWlsZENsYWltVHgoXG4gICAgICBuZXR3b3JrSUQsXG4gICAgICBibG9ja2NoYWluSUQsXG4gICAgICBmcm9tU2lnbmVyLFxuICAgICAgY2hhbmdlLFxuICAgICAgZmVlLFxuICAgICAgYXZheEFzc2V0SUQsXG4gICAgICBtZW1vLFxuICAgICAgYXNPZixcbiAgICAgIGNoYW5nZVRocmVzaG9sZCxcbiAgICAgIGNsYWltQW1vdW50cyxcbiAgICAgIGNsYWltVG9cbiAgICApXG5cbiAgICBpZiAoIShhd2FpdCB0aGlzLmNoZWNrR29vc2VFZ2codW5zaWduZWRDbGFpbVR4LCB0aGlzLmdldENyZWF0aW9uVHhGZWUoKSkpKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEdvb3NlRWdnQ2hlY2tFcnJvcihcIkZhaWxlZCBHb29zZSBFZ2cgQ2hlY2tcIilcbiAgICB9XG5cbiAgICByZXR1cm4gdW5zaWduZWRDbGFpbVR4XG4gIH1cblxuICAvKipcbiAgICogQGlnbm9yZVxuICAgKi9cbiAgcHJvdGVjdGVkIF9jbGVhbkFkZHJlc3NBcnJheShcbiAgICBhZGRyZXNzZXM6IHN0cmluZ1tdIHwgQnVmZmVyW10sXG4gICAgY2FsbGVyOiBzdHJpbmdcbiAgKTogc3RyaW5nW10ge1xuICAgIGNvbnN0IGFkZHJzOiBzdHJpbmdbXSA9IFtdXG4gICAgY29uc3QgY2hhaW5pZDogc3RyaW5nID0gdGhpcy5nZXRCbG9ja2NoYWluQWxpYXMoKVxuICAgICAgPyB0aGlzLmdldEJsb2NrY2hhaW5BbGlhcygpXG4gICAgICA6IHRoaXMuZ2V0QmxvY2tjaGFpbklEKClcbiAgICBpZiAoYWRkcmVzc2VzICYmIGFkZHJlc3Nlcy5sZW5ndGggPiAwKSB7XG4gICAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgYWRkcmVzc2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgYWRkcmVzc2VzW2Ake2l9YF0gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICB0eXBlb2YgdGhpcy5wYXJzZUFkZHJlc3MoYWRkcmVzc2VzW2Ake2l9YF0gYXMgc3RyaW5nKSA9PT1cbiAgICAgICAgICAgIFwidW5kZWZpbmVkXCJcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICAgICAgICB0aHJvdyBuZXcgQWRkcmVzc0Vycm9yKGBFcnJvciAtIEludmFsaWQgYWRkcmVzcyBmb3JtYXQgKCR7Y2FsbGVyfSlgKVxuICAgICAgICAgIH1cbiAgICAgICAgICBhZGRycy5wdXNoKGFkZHJlc3Nlc1tgJHtpfWBdIGFzIHN0cmluZylcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBiZWNoMzI6IFNlcmlhbGl6ZWRUeXBlID0gXCJiZWNoMzJcIlxuICAgICAgICAgIGFkZHJzLnB1c2goXG4gICAgICAgICAgICBzZXJpYWxpemF0aW9uLmJ1ZmZlclRvVHlwZShcbiAgICAgICAgICAgICAgYWRkcmVzc2VzW2Ake2l9YF0gYXMgQnVmZmVyLFxuICAgICAgICAgICAgICBiZWNoMzIsXG4gICAgICAgICAgICAgIHRoaXMuY29yZS5nZXRIUlAoKSxcbiAgICAgICAgICAgICAgY2hhaW5pZFxuICAgICAgICAgICAgKVxuICAgICAgICAgIClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYWRkcnNcbiAgfVxuXG4gIHByb3RlY3RlZCBfY2xlYW5BZGRyZXNzQXJyYXlCdWZmZXIoXG4gICAgYWRkcmVzc2VzOiBzdHJpbmdbXSB8IEJ1ZmZlcltdLFxuICAgIGNhbGxlcjogc3RyaW5nXG4gICk6IEJ1ZmZlcltdIHtcbiAgICByZXR1cm4gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoYWRkcmVzc2VzLCBjYWxsZXIpLm1hcChcbiAgICAgIChhOiBzdHJpbmcpOiBCdWZmZXIgPT4ge1xuICAgICAgICByZXR1cm4gdHlwZW9mIGEgPT09IFwidW5kZWZpbmVkXCJcbiAgICAgICAgICA/IHVuZGVmaW5lZFxuICAgICAgICAgIDogYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpXG4gICAgICB9XG4gICAgKVxuICB9XG5cbiAgcHJvdGVjdGVkIF9wYXJzZUZyb21TaWduZXIoZnJvbTogRnJvbVR5cGUsIGNhbGxlcjogc3RyaW5nKTogRnJvbVNpZ25lciB7XG4gICAgaWYgKGZyb20ubGVuZ3RoID4gMCkge1xuICAgICAgaWYgKHR5cGVvZiBmcm9tWzBdID09PSBcInN0cmluZ1wiKVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGZyb206IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5QnVmZmVyKGZyb20gYXMgc3RyaW5nW10sIGNhbGxlciksXG4gICAgICAgICAgc2lnbmVyOiBbXVxuICAgICAgICB9XG4gICAgICBlbHNlXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgZnJvbTogdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXlCdWZmZXIoZnJvbVswXSBhcyBzdHJpbmdbXSwgY2FsbGVyKSxcbiAgICAgICAgICBzaWduZXI6XG4gICAgICAgICAgICBmcm9tLmxlbmd0aCA+IDFcbiAgICAgICAgICAgICAgPyB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheUJ1ZmZlcihmcm9tWzFdIGFzIHN0cmluZ1tdLCBjYWxsZXIpXG4gICAgICAgICAgICAgIDogW11cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4geyBmcm9tOiBbXSwgc2lnbmVyOiBbXSB9XG4gIH1cblxuICAvKipcbiAgICogVGhpcyBjbGFzcyBzaG91bGQgbm90IGJlIGluc3RhbnRpYXRlZCBkaXJlY3RseS5cbiAgICogSW5zdGVhZCB1c2UgdGhlIFtbQXZhbGFuY2hlLmFkZEFQSV1dIG1ldGhvZC5cbiAgICpcbiAgICogQHBhcmFtIGNvcmUgQSByZWZlcmVuY2UgdG8gdGhlIEF2YWxhbmNoZSBjbGFzc1xuICAgKiBAcGFyYW0gYmFzZVVSTCBEZWZhdWx0cyB0byB0aGUgc3RyaW5nIFwiL2V4dC9QXCIgYXMgdGhlIHBhdGggdG8gYmxvY2tjaGFpbidzIGJhc2VVUkxcbiAgICovXG4gIGNvbnN0cnVjdG9yKGNvcmU6IEF2YWxhbmNoZUNvcmUsIGJhc2VVUkw6IHN0cmluZyA9IFwiL2V4dC9iYy9QXCIpIHtcbiAgICBzdXBlcihjb3JlLCBiYXNlVVJMKVxuICAgIGlmIChjb3JlLmdldE5ldHdvcmsoKSkge1xuICAgICAgdGhpcy5ibG9ja2NoYWluSUQgPSBjb3JlLmdldE5ldHdvcmsoKS5QLmJsb2NrY2hhaW5JRFxuICAgICAgdGhpcy5rZXljaGFpbiA9IG5ldyBLZXlDaGFpbihjb3JlLmdldEhSUCgpLCBjb3JlLmdldE5ldHdvcmsoKS5QLmFsaWFzKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJucyB0aGUgY3VycmVudCB0aW1lc3RhbXAgb24gY2hhaW4uXG4gICAqL1xuICBnZXRUaW1lc3RhbXAgPSBhc3luYyAoKTogUHJvbWlzZTxudW1iZXI+ID0+IHtcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uZ2V0VGltZXN0YW1wXCJcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnRpbWVzdGFtcFxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIHRoZSBVVFhPcyB0aGF0IHdlcmUgcmV3YXJkZWQgYWZ0ZXIgdGhlIHByb3ZpZGVkIHRyYW5zYWN0aW9uXCJzIHN0YWtpbmcgb3IgZGVsZWdhdGlvbiBwZXJpb2QgZW5kZWQuXG4gICAqL1xuICBnZXRSZXdhcmRVVFhPcyA9IGFzeW5jIChcbiAgICB0eElEOiBzdHJpbmcsXG4gICAgZW5jb2Rpbmc/OiBzdHJpbmdcbiAgKTogUHJvbWlzZTxHZXRSZXdhcmRVVFhPc1Jlc3BvbnNlPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBHZXRSZXdhcmRVVFhPc1BhcmFtcyA9IHtcbiAgICAgIHR4SUQsXG4gICAgICBlbmNvZGluZ1xuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uZ2V0UmV3YXJkVVRYT3NcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHRcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYmxvY2tjaGFpbnMgY29uZmlndXJhdGlvbiAoZ2VuZXNpcylcbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYW4gR2V0Q29uZmlndXJhdGlvblJlc3BvbnNlXG4gICAqL1xuICBnZXRDb25maWd1cmF0aW9uID0gYXN5bmMgKCk6IFByb21pc2U8R2V0Q29uZmlndXJhdGlvblJlc3BvbnNlPiA9PiB7XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmdldENvbmZpZ3VyYXRpb25cIlxuICAgIClcbiAgICBjb25zdCByID0gcmVzcG9uc2UuZGF0YS5yZXN1bHRcbiAgICByZXR1cm4ge1xuICAgICAgbmV0d29ya0lEOiBwYXJzZUludChyLm5ldHdvcmtJRCksXG4gICAgICBhc3NldElEOiByLmFzc2V0SUQsXG4gICAgICBhc3NldFN5bWJvbDogci5hc3NldFN5bWJvbCxcbiAgICAgIGhycDogci5ocnAsXG4gICAgICBibG9ja2NoYWluczogci5ibG9ja2NoYWlucyxcbiAgICAgIG1pblN0YWtlRHVyYXRpb246IG5ldyBCTihyLm1pblN0YWtlRHVyYXRpb24pLmRpdihOYW5vQk4pLnRvTnVtYmVyKCksXG4gICAgICBtYXhTdGFrZUR1cmF0aW9uOiBuZXcgQk4oci5tYXhTdGFrZUR1cmF0aW9uKS5kaXYoTmFub0JOKS50b051bWJlcigpLFxuICAgICAgbWluVmFsaWRhdG9yU3Rha2U6IG5ldyBCTihyLm1pblZhbGlkYXRvclN0YWtlKSxcbiAgICAgIG1heFZhbGlkYXRvclN0YWtlOiBuZXcgQk4oci5tYXhWYWxpZGF0b3JTdGFrZSksXG4gICAgICBtaW5EZWxlZ2F0aW9uRmVlOiBuZXcgQk4oci5taW5EZWxlZ2F0aW9uRmVlKSxcbiAgICAgIG1pbkRlbGVnYXRvclN0YWtlOiBuZXcgQk4oci5taW5EZWxlZ2F0b3JTdGFrZSksXG4gICAgICBtaW5Db25zdW1wdGlvblJhdGU6IHBhcnNlSW50KHIubWluQ29uc3VtcHRpb25SYXRlKSAvIHJld2FyZFBlcmNlbnREZW5vbSxcbiAgICAgIG1heENvbnN1bXB0aW9uUmF0ZTogcGFyc2VJbnQoci5tYXhDb25zdW1wdGlvblJhdGUpIC8gcmV3YXJkUGVyY2VudERlbm9tLFxuICAgICAgc3VwcGx5Q2FwOiBuZXcgQk4oci5zdXBwbHlDYXApLFxuICAgICAgdmVyaWZ5Tm9kZVNpZ25hdHVyZTogci52ZXJpZnlOb2RlU2lnbmF0dXJlID8/IGZhbHNlLFxuICAgICAgbG9ja01vZGVCb25kRGVwb3NpdDogci5sb2NrTW9kZUJvbmREZXBvc2l0ID8/IGZhbHNlXG4gICAgfSBhcyBHZXRDb25maWd1cmF0aW9uUmVzcG9uc2VcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYmxvY2tjaGFpbnMgY29uZmlndXJhdGlvbiAoZ2VuZXNpcylcbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYW4gR2V0Q29uZmlndXJhdGlvblJlc3BvbnNlXG4gICAqL1xuICBzcGVuZCA9IGFzeW5jIChcbiAgICBmcm9tOiBzdHJpbmdbXSB8IHN0cmluZyxcbiAgICBzaWduZXI6IHN0cmluZ1tdIHwgc3RyaW5nLFxuICAgIHRvOiBzdHJpbmdbXSxcbiAgICB0b1RocmVzaG9sZDogbnVtYmVyLFxuICAgIHRvTG9ja1RpbWU6IEJOLFxuICAgIGNoYW5nZTogc3RyaW5nW10sXG4gICAgY2hhbmdlVGhyZXNob2xkOiBudW1iZXIsXG4gICAgbG9ja01vZGU6IExvY2tNb2RlLFxuICAgIGFtb3VudFRvTG9jazogQk4sXG4gICAgYW1vdW50VG9CdXJuOiBCTixcbiAgICBhc09mOiBCTixcbiAgICBlbmNvZGluZz86IHN0cmluZ1xuICApOiBQcm9taXNlPFNwZW5kUmVwbHk+ID0+IHtcbiAgICBpZiAoIVtcIlVubG9ja2VkXCIsIFwiRGVwb3NpdFwiLCBcIkJvbmRcIl0uaW5jbHVkZXMobG9ja01vZGUpKSB7XG4gICAgICB0aHJvdyBuZXcgUHJvdG9jb2xFcnJvcihcIkVycm9yIC0tIFBsYXRmb3JtQVBJLnNwZW5kOiBpbnZhbGlkIGxvY2tNb2RlXCIpXG4gICAgfVxuICAgIGNvbnN0IHBhcmFtczogU3BlbmRQYXJhbXMgPSB7XG4gICAgICBmcm9tLFxuICAgICAgc2lnbmVyLFxuICAgICAgdG86XG4gICAgICAgIHRvLmxlbmd0aCA+IDBcbiAgICAgICAgICA/IHtcbiAgICAgICAgICAgICAgbG9ja3RpbWU6IHRvTG9ja1RpbWUudG9TdHJpbmcoMTApLFxuICAgICAgICAgICAgICB0aHJlc2hvbGQ6IHRvVGhyZXNob2xkLFxuICAgICAgICAgICAgICBhZGRyZXNzZXM6IHRvXG4gICAgICAgICAgICB9XG4gICAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgICBjaGFuZ2U6XG4gICAgICAgIGNoYW5nZS5sZW5ndGggPiAwXG4gICAgICAgICAgPyB7IGxvY2t0aW1lOiBcIjBcIiwgdGhyZXNob2xkOiBjaGFuZ2VUaHJlc2hvbGQsIGFkZHJlc3NlczogY2hhbmdlIH1cbiAgICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgIGxvY2tNb2RlOiBsb2NrTW9kZSA9PT0gXCJVbmxvY2tlZFwiID8gMCA6IGxvY2tNb2RlID09PSBcIkRlcG9zaXRcIiA/IDEgOiAyLFxuICAgICAgYW1vdW50VG9Mb2NrOiBhbW91bnRUb0xvY2sudG9TdHJpbmcoMTApLFxuICAgICAgYW1vdW50VG9CdXJuOiBhbW91bnRUb0J1cm4udG9TdHJpbmcoMTApLFxuICAgICAgYXNPZjogYXNPZi50b1N0cmluZygxMCksXG4gICAgICBlbmNvZGluZzogZW5jb2RpbmcgPz8gXCJoZXhcIlxuICAgIH1cblxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5zcGVuZFwiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIGNvbnN0IHIgPSByZXNwb25zZS5kYXRhLnJlc3VsdFxuXG4gICAgLy8gV2UgbmVlZCB0byB1cGRhdGUgc2lnbmF0dXJlIGluZGV4IHNvdXJjZSBoZXJlXG4gICAgY29uc3QgaW5zID0gVHJhbnNmZXJhYmxlSW5wdXQuZnJvbUFycmF5KEJ1ZmZlci5mcm9tKHIuaW5zLnNsaWNlKDIpLCBcImhleFwiKSlcbiAgICBpbnMuZm9yRWFjaCgoZSwgaWR4KSA9PlxuICAgICAgZS5nZXRTaWdJZHhzKCkuZm9yRWFjaCgocywgc2lkeCkgPT4ge1xuICAgICAgICBzLnNldFNvdXJjZShiaW50b29scy5jYjU4RGVjb2RlKHIuc2lnbmVyc1tgJHtpZHh9YF1bYCR7c2lkeH1gXSkpXG4gICAgICB9KVxuICAgIClcblxuICAgIHJldHVybiB7XG4gICAgICBpbnMsXG4gICAgICBvdXQ6IFRyYW5zZmVyYWJsZU91dHB1dC5mcm9tQXJyYXkoQnVmZmVyLmZyb20oci5vdXRzLnNsaWNlKDIpLCBcImhleFwiKSksXG4gICAgICBvd25lcnM6IHIub3duZXJzXG4gICAgICAgID8gT3V0cHV0T3duZXJzLmZyb21BcnJheShCdWZmZXIuZnJvbShyLm93bmVycy5zbGljZSgyKSwgXCJoZXhcIikpXG4gICAgICAgIDogW11cbiAgICB9XG4gIH1cblxuICBfZ2V0QnVpbGRlciA9ICh1dHhvU2V0OiBVVFhPU2V0KTogQnVpbGRlciA9PiB7XG4gICAgaWYgKHRoaXMuY29yZS5nZXROZXR3b3JrKCkuUC5sb2NrTW9kZUJvbmREZXBvc2l0KSB7XG4gICAgICByZXR1cm4gbmV3IEJ1aWxkZXIobmV3IFNwZW5kZXIodGhpcyksIHRydWUpXG4gICAgfVxuICAgIHJldHVybiBuZXcgQnVpbGRlcih1dHhvU2V0LCBmYWxzZSlcbiAgfVxufVxuIl19