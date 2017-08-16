<template>
  <div id="app">
    <TopHeader />
    <div class="main-cnt">
      <div class="page-container">
          <p>
            合约地址
            <el-tag type="gray">
              <a href="https://etherscan.io/address/0xB56EE79aa82c7b3509c50b1A03Cd11D6BF15Df53" target="_blank">0xB56EE79aa82c7b3509c50b1A03Cd11D6BF15Df53</a>
            </el-tag>
            , 提现手续费 <el-tag type="gray"> {{ poolFee }} % </el-tag>
          </p>

          <div class="epoch">
            <el-row :gutter="20">
              <el-col :span="12">
                当前Epoch: {{epoch.currentEpoch}}
              </el-col>
              <el-col :span="12" style="text-align: right;">
                当前Epoch成本: {{ getEpochCost() }} ETH/BTE
              </el-col>
            </el-row>

            <div class="progress" style="margin-top: 60px; margin-bottom: 100px;">
    					<div class="progress-bar" :style="{width: epoch.percent + '%', background: 'greenyellow' }">
                <span class="claimed" :style="{width: epoch.claimedBlocks + '%', background: 'red' }" v-if="epoch.claimedBlocks > 0">
                {{epoch.claimedBlocks}}
                </span>
                <span class="mined">{{epoch.minedBlocks}}</span>
    						<span class="percent">block {{epoch.currentBlock}}</span>
                <span class="attempt">{{ (epoch.adjustedUnit / 10 ** 18).toFixed(4)}} ether</span>
    					</div>
    				</div>
          </div>

          <h3>开始挖矿</h3>
          <div class="mining">
            <div v-if="web3Error === 'not-install'">
              <p>
                请先安装
                <el-tag type="gray">Parity</el-tag> or <el-tag type="gray"><a href="https://metamask.io/" target="_blank">Metamask</a></el-tag> 插件。
              </p>
              <p>
                请解锁 <el-tag type="gray">Metamask</el-tag> 并刷新页面。
              </p>
            </div>
            <div v-if="web3Error === ''">
              <h5>挖矿账户</h5>
              <p>
                <el-select v-model="selectedAccount" placeholder="请选择挖矿账户" style="width: 100%;" no-data-text="无账户或Metamask未解锁">
                  <el-option
                    v-for="item in accounts"
                    :key="item.account"
                    :label="item.account"
                    :value="item.account">
                    <span style="float: left">{{ item.account }}</span>
                    <span style="float: right; color: #8492a6; font-size: 13px">{{ (item.eth / 10**18).toFixed(4) }} ETH / {{ (item.bte / 10 ** 8).toFixed(2) }} BTE </span>
                  </el-option>
                </el-select>
              </p>
              <h5>挖矿/赎回</h5>
              <p>
                <el-button :type="mineActionType" @click="selectMiningAction('mine')">Mine</el-button>
                <el-button :type="redeemActionType" @click="selectMiningAction('redeem')">Redeem</el-button>
              </p>
              <h5>高级选项</h5>
              <p>
                GasPrice: <strong class="gas-price-number">{{gasPrice}}</strong> Gwei
                <el-slider v-model="gasPrice" :min=4 :max=22 :show-stops="true"></el-slider>
              </p>
              <div v-if="miningAction === 'mine'">
                <h5>挖矿</h5>
                <el-form :inline="true">
                 <el-form-item>
                   <el-input v-model="burnEther" placeholder="burn ether amount" type="number"><template slot="append">ether</template></el-input>
                 </el-form-item>
                 <el-form-item>
                   <el-button type="primary" @click="startMining()" :disabled="burnEther <= 0 || burnEther > 1000 || miningButtonDisabled">开始挖矿</el-button>
                 </el-form-item>
                </el-form>
              </div>

              <div v-if="miningAction === 'redeem'">
                <h5>赎回BTE</h5>
                <p>
                  <el-button type="primary" @click="redeem()" :disable="redeemButtonDisabled">赎回</el-button>
                </p>
              </div>
            </div>
          </div>
          <h3>用户挖矿信息</h3>
          <p>输入挖矿账户查询用户挖矿信息。</p>
          <el-row>
            <el-col :span="12">
              <el-input
              placeholder="挖矿地址"
              icon="search"
              v-model="searchUserAddress"
              :on-icon-click="handleSearchUser">
              </el-input>
            </el-col>
          </el-row>

          <el-row style="margin-top: 20px;" v-loading.body="userLoading">
            <el-col :span="12" style="padding-right: 6px;">
              <el-card class="box-card miner-info-card">
                  <table class="mining-info">
                    <tr>
                      <td class="name">Epoch</td>
                      <td>{{user.epoch}}</td>
                    </tr>
                    <tr>
                      <td class="name">总销毁</td>
                      <td>{{(user.totalAttempt / 10 ** 18).toFixed(4)}} ether</td>
                    </tr>
                    <tr>
                      <td class="name">每次销毁</td>
                      <td>{{(user.partialAttempt / 10 ** 18).toFixed(4)}} ether</td>
                    </tr>
                  </table>
              </el-card>
            </el-col>

            <el-col :span="12"  style="padding-left: 6px;">
              <el-card class="box-card">
                <table class="mining-info">
                  <tr>
                    <td class="name">BTE余额</td>
                    <td>{{ (user.balance  / 10 ** 8).toFixed(2) }} BTE</td>
                  </tr>
                  <tr>
                    <td class="name">是否赎回</td>
                    <td>{{ user.isRedeemed ? '是': '否' }}</td>
                  </tr>
                </table>
              </el-card>
            </el-col>
          </el-row>
      </div>
    </div>
    <Foot />
  </div>
</template>

<script>
import TopHeader from '../../components/TopHeader.vue'
import Foot from '../../components/Footer.vue'
import {default as Web3} from 'web3'

window.defaultWeb3 = new Web3(new Web3.providers.HttpProvider("https://web3.token.im"));
window.defaultWeb3.currentProvider.isDefaultProvider = true;

window.addEventListener('load', function() {
  if (typeof window.web3 !== 'undefined') {
    window.web3 = new Web3(window.web3.currentProvider);
  } else {
    // set the provider you want from Web3.providers
    window.web3 = defaultWeb3;
  }
});

export default {
  components: {
    TopHeader,
    Foot
  },
  data () {
    return {
      accounts: [],
      web3Error: 'not-install',
      gasPrice: 4,
      poolContractAddress: '0xB56EE79aa82c7b3509c50b1A03Cd11D6BF15Df53',
      poolContractABI: [{"constant":true,"inputs":[],"name":"current_external_block","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_epoch","type":"uint256"}],"name":"remaining_epoch_blocks","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_value","type":"uint256"}],"name":"pool_set_max_bet","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"calculate_minimum_contribution","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"pool_name","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_paused","type":"bool"}],"name":"pool_set_paused","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"divisible_units","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_blockNum","type":"uint256"}],"name":"calculate_epoch","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"max_bet","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_addr","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_blockNumber","type":"uint256"}],"name":"bte_block_to_epoch","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"last_mined_block","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_blockNum","type":"uint256"},{"name":"_sender","type":"address"}],"name":"checkMiningAttempt","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"totalAttempt","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"current_epoch","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"mine","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_who","type":"address"}],"name":"find_contribution","outputs":[{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"users","outputs":[{"name":"epoch","type":"uint256"},{"name":"totalAttempt","type":"uint256"},{"name":"partial_attempt","type":"uint256"},{"name":"balance","type":"uint256"},{"name":"isCreated","type":"bool"},{"name":"isRedeemed","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"pool_version","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"blockCreationRate","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_percentage","type":"uint8"}],"name":"pool_set_percentage","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"isPaused","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"get_bitcoineum_contract_address","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_baseReward","type":"uint256"},{"name":"_userContributionWei","type":"uint256"},{"name":"_totalCommittedWei","type":"uint256"}],"name":"calculate_proportional_reward","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"redeem","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_epoch","type":"uint256"}],"name":"get_epoch_record","outputs":[{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"epochs","outputs":[{"name":"minedBlocks","type":"uint256"},{"name":"claimedBlocks","type":"uint256"},{"name":"totalAttempt","type":"uint256"},{"name":"totalClaimed","type":"uint256"},{"name":"actualAttempt","type":"uint256"},{"name":"adjustedUnit","type":"uint256"},{"name":"isSealed","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"contract_period","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_blockNum","type":"uint256"}],"name":"checkWinning","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_blockNumber","type":"uint256"},{"name":"forCreditTo","type":"address"}],"name":"claim","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"pool_percentage","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"max_pool_percentage","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_externalBlockNum","type":"uint256"}],"name":"external_to_internal_block_number","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"inputs":[],"payable":false,"type":"constructor"},{"payable":true,"type":"fallback"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_info","type":"string"},{"indexed":false,"name":"_extra","type":"uint256"}],"name":"LogEvent","type":"event"}],
      bteContractAddress: '0x73dD069c299A5d691E9836243BcaeC9c8C1D8734',
      bteContractABI: [{"constant":true,"inputs":[],"name":"current_external_block","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"maximumSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"totalWeiCommitted","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_totalBlocksMined","type":"uint256"}],"name":"calculate_base_mining_reward","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_blockNum","type":"uint256"}],"name":"getBlockData","outputs":[{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"bool"},{"name":"","type":"address"},{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"lastDifficultyAdjustmentEthereumBlock","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"minimumDifficultyThresholdWei","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_totalWeiCommitted","type":"uint256"},{"name":"_totalWeiExpected","type":"uint256"},{"name":"_minimumDifficultyThresholdWei","type":"uint256"},{"name":"_difficultyScaleMultiplierLimit","type":"uint256"}],"name":"calculate_next_expected_wei","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"INITIAL_SUPPLY","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"MAX_SUPPLY","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_blockNum","type":"uint256"},{"name":"_externalblock","type":"uint256"}],"name":"checkBlockMature","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_blockNum","type":"uint256"}],"name":"targetBlockNumber","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"totalBlocksMined","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"difficulty","type":"uint256"},{"name":"offset","type":"uint256"}],"name":"calculate_range_attempt","outputs":[{"name":"","type":"uint256"},{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"divisible_units","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"checkMiningActive","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_blockNum","type":"uint256"}],"name":"resolve_block_hash","outputs":[{"name":"","type":"bytes32"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_totalBlocksMined","type":"uint256"},{"name":"_sender","type":"address"},{"name":"_blockNumber","type":"uint256"}],"name":"calculate_reward","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"burnAddress","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"blockData","outputs":[{"name":"targetDifficultyWei","type":"uint256"},{"name":"blockNumber","type":"uint256"},{"name":"totalMiningWei","type":"uint256"},{"name":"totalMiningAttempts","type":"uint256"},{"name":"currentAttemptOffset","type":"uint256"},{"name":"payed","type":"bool"},{"name":"payee","type":"address"},{"name":"isCreated","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"getContractState","outputs":[{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"initial_reward","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_blockNum","type":"uint256"},{"name":"_sender","type":"address"}],"name":"checkMiningAttempt","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"targetDifficultyWei","type":"uint256"},{"name":"totalMiningWei","type":"uint256"},{"name":"value","type":"uint256"}],"name":"calculate_difficulty_attempt","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"mine","outputs":[{"name":"","type":"bool"}],"payable":true,"type":"function"},{"constant":true,"inputs":[{"name":"_blockNum","type":"uint256"},{"name":"_who","type":"address"}],"name":"getMiningAttempt","outputs":[{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"},{"name":"","type":"address"}],"name":"miningAttempts","outputs":[{"name":"projectedOffset","type":"uint256"},{"name":"value","type":"uint256"},{"name":"isCreated","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"difficultyScaleMultiplierLimit","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"blockCreationRate","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"currentDifficultyWei","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_baseReward","type":"uint256"},{"name":"_userContributionWei","type":"uint256"},{"name":"_totalCommittedWei","type":"uint256"}],"name":"calculate_proportional_reward","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_blockNum","type":"uint256"},{"name":"_externalblock","type":"uint256"}],"name":"checkRedemptionWindow","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"totalWeiExpected","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"get_internal_block_number","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_blockNum","type":"uint256"}],"name":"checkWinning","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_blockNumber","type":"uint256"},{"name":"forCreditTo","type":"address"}],"name":"claim","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"difficultyAdjustmentPeriod","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transmute","outputs":[{"name":"","type":"bool"},{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_blockNum","type":"uint256"}],"name":"isBlockRedeemed","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_externalBlockNum","type":"uint256"}],"name":"external_to_internal_block_number","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"rewardAdjustmentPeriod","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"inputs":[],"payable":false,"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"who","type":"address"},{"indexed":false,"name":"baseContract","type":"address"},{"indexed":false,"name":"transmutedContract","type":"address"},{"indexed":false,"name":"sourceQuantity","type":"uint256"},{"indexed":false,"name":"destQuantity","type":"uint256"}],"name":"Transmuted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_from","type":"address"},{"indexed":false,"name":"_value","type":"uint256"},{"indexed":true,"name":"_blockNumber","type":"uint256"},{"indexed":false,"name":"_totalMinedWei","type":"uint256"},{"indexed":false,"name":"_targetDifficultyWei","type":"uint256"}],"name":"MiningAttemptEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_info","type":"string"}],"name":"LogEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_from","type":"address"},{"indexed":true,"name":"_forCreditTo","type":"address"},{"indexed":false,"name":"_reward","type":"uint256"},{"indexed":true,"name":"_blockNumber","type":"uint256"}],"name":"BlockClaimedEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"}],
      epoch: {
        currentEpoch: 0, minedBlocks: 0, claimedBlocks:0, totalAttempt: 0,
        totalClaimed: 0, actualAttempt: 0, adjustedUnit: 0, isSealed: false,
        percent: 0,
        currentBlock: 0
      },
      lastMinedBlock: 0,
      burnEther: 0,
      selectedAccount: '',
      miningButtonDisabled: false,
      redeemButtonDisabled: false,
      miningAction: 'mine',
      mineActionType: 'success',
      redeemActionType: 'default',
      searchUserAddress: '',
      user: {
        epoch:0 , totalAttempt: 0, partialAttempt: 0, balance:0 , isCreated: false, isRedeemed: false
      },
      userLoading: false,
      poolFee: 0
    }
  },
  computed: {
  },
  created () {
    // 组件创建完后获取数据，
    // 此时 data 已经被 observed 了
    //web3 is undefined
  },
  mounted () {
    var self = this
    var t = setInterval(function() {
      console.log(window.web3);
      if (window.web3) {
        clearInterval(t)
        self.loadData()
      }
    }, 1000)
  },
  destroyed () {
  },
  methods: {
    getPoolInstance() {
      return window.web3.eth.contract(this.poolContractABI).at(this.poolContractAddress);
    },
    getDefaultPoolInstance() {
      return window.defaultWeb3.eth.contract(this.poolContractABI).at(this.poolContractAddress);
    },
    getBteInstance() {
      return window.defaultWeb3.eth.contract(this.bteContractABI).at(this.bteContractAddress);
    },
    loadData () {
      var self = this
      var poolInstance = this.getPoolInstance()
      var defaultPoolInstance = this.getDefaultPoolInstance()
      var bteInstance = this.getBteInstance()

      if (!window.web3.currentProvider.isDefaultProvider) {
        this.web3Error = ''
        // metamask or parity
        //load accounts
        for (var i in web3.eth.accounts) {
          var account = web3.eth.accounts[i];

          (function(account) {
            web3.eth.getBalance(account, (a, ethBalance) => {
              bteInstance.balanceOf.call(account, (err, bteBalance) => {
                self.accounts.push({
                  account: account,
                  label: account.substr(0, 6) + '...' + account.substr(-3),
                  eth: ethBalance.toNumber(),
                  bte: bteBalance.toNumber()
                })
              })
            })
          })(account);
        }
      } else {
        this.web3Error = 'not-install'
      }

      // get epoch info
      defaultPoolInstance.current_epoch((err, epoch_number) => {
        var currentEpoch = epoch_number.toNumber()
        defaultPoolInstance.epochs(currentEpoch, (err, epoch) => {
          var remainingEpochBlocks = defaultPoolInstance.remaining_epoch_blocks.call(currentEpoch).toNumber();
          var currentBlock = 100 - remainingEpochBlocks;
          self.epoch = {
            currentEpoch: currentEpoch,
            minedBlocks: epoch[0].toNumber(),
            claimedBlocks: epoch[1].toNumber(),
            totalAttempt: epoch[2].toNumber(),
            totalClaimed: epoch[3].toNumber(),
            actualAttempt: epoch[4].toNumber(),
            adjustedUnit: epoch[5].toNumber(),
            isSealed: epoch[6],
            percent: currentBlock,
            currentBlock: currentBlock,
            remainingBlocks: remainingEpochBlocks
          }
        });
      });

      //pool fee
      defaultPoolInstance.pool_percentage((err, pool_percentage) => {
        self.poolFee = pool_percentage.toNumber()
      })

      this.searchUserAddress = window.STORAGE.getItem('searchUserAddress')
    },
    getEpochCost() {
      if (this.epoch.totalAttempt <= 0) {
        return 0
      }
      return (this.epoch.totalClaimed / this.epoch.totalAttempt/ 10 ** 18).toFixed(4)
    },
    startMining() {
      var self = this
      if (this.burnEther <= 0 || this.burnEther > 1000) {
        this.$message({
          message: '销毁的ether数量要大于0, 小于1000ether',
          type: 'warning'
        });
        return
      }

      var defaultPoolInstance = this.getDefaultPoolInstance();
      var currentEpoch = defaultPoolInstance.current_epoch();

      var user = defaultPoolInstance.users.call(this.selectedAccount)

      // check user epoch
      if (user[0].toNumber() == currentEpoch) {
        this.$message({
          message: '当前epoch已经在挖，每个epoch只能挖一次',
          type: 'danger'
        });
        return
      }

      var remainingEpochBlocks = defaultPoolInstance.remaining_epoch_blocks.call(currentEpoch);
      console.log("current epoch:", currentEpoch)
      console.log("remaining epoch blocks:", remainingEpochBlocks)
      var content = '当前epoch：' + currentEpoch + '， 剩余blocks：' + remainingEpochBlocks +
        '，共销毁：' + this.burnEther  + ' ether， 每份销毁： ' + (this.burnEther / remainingEpochBlocks).toFixed(4) + ' ether';

      var transObj = {
        to: this.poolContractAddress,
        gasPrice: web3.toWei(this.gasPrice, 'gwei'),
        gas: 200000,
        value: web3.toWei(this.burnEther, 'ether')
      }

      if (this.selectedAccount) {
        transObj.from = this.selectedAccount
      }

      this.$confirm(content, 'Confirmation', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        console.log(transObj)
        self.miningButtonDisabled = true
        window.web3.eth.sendTransaction(transObj, (err) => {
          console.log(arguments)
          self.miningButtonDisabled = false;
        });
      }).catch(() => {
          console.log("cancel mining");
      });
    },
    selectMiningAction (action) {
      this.miningAction = action
      if (action == 'mine') {
        this.mineActionType = 'success'
        this.redeemActionType = 'default'
      } else {
        this.mineActionType = 'default'
        this.redeemActionType = 'success'
      }
    },
    redeem() {
      var self = this
      var defaultPoolInstance = this.getDefaultPoolInstance();
      var currentEpoch = defaultPoolInstance.current_epoch();
      if (!this.selectedAccount) {
        this.$message.error('请先选择账户');
        return
      }

      var user = defaultPoolInstance.users.call(this.selectedAccount)

      // check user epoch
      if (user[0].toNumber() >= currentEpoch) {
        this.$message.error('现在还不能赎回');
        return
      }
      //check isRedeem
      if (user[5]) {
        this.$message.error('当前epoch已经赎回过了')
        return
      }

      // check balance
      var userBteBalance = defaultPoolInstance.balanceOf.call(this.selectedAccount).toNumber();
      if (userBteBalance <= 0) {
        this.$message.error('用户BTE余额为0，无需赎回');
        return
      }

      var poolInstance = this.getPoolInstance();
      this.redeemButtonDisabled = true;
      poolInstance.redeem({
        from: this.selectedAccount,
        gas: 120000,
        value: 0,
				gasPrice: web3.toWei(this.gasPrice, 'gwei')
      }, (error) => {
        console.log("redeem error:", error);
        self.redeemButtonDisabled = false
      })
    },
    handleSearchUser(ev) {
      var self = this

      if (!this.searchUserAddress) {
        this.$message({
          message: '请填写挖矿账户',
          type: 'warning'
        });
        return
      }
      window.STORAGE.setItem('searchUserAddress', this.searchUserAddress)
      var poolInstance = this.getDefaultPoolInstance()
      this.userLoading = true
      poolInstance.users(this.searchUserAddress, (err, user) => {
          self.user = {
            epoch: user[0].toNumber() ,
            totalAttempt: user[1].toNumber(),
            partialAttempt: user[2].toNumber(),
            balance: user[3].toNumber(),
            isCreated: false, isRedeemed: false
          }

          self.userLoading = false
      })

      poolInstance.balanceOf.call(this.searchUserAddress, (err, balance) => {
        self.user.balance = balance.toNumber()
      })
    }
  }
}
</script>
