import {
  Address,
  beginCell,
  Cell,
  Contract,
  contractAddress,
  ContractProvider,
  Dictionary,
  Sender,
  SendMode,
} from '@ton/core';
import { Maybe } from '@ton/core/dist/utils/maybe';

export type PyramideConfig = {
  admin_addr: Address;
  daily_percent: bigint;
  min_days: number;
  max_days: number;
  /**
   * [referrals_count, percent]
   */
  referrals_program?: [number, bigint][];
};

export class Pyramide implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell }
  ) {}

  static createFromConfig(config: PyramideConfig, code: Cell, workchain = 0) {
    const referralProgramDict = Dictionary.empty<number, Cell>();
    for (let i = 0; i < (config.referrals_program || []).length; i++) {
      const [referrals_count, percent] = config.referrals_program![i];
      const cell = beginCell()
        .storeUint(referrals_count, 32)
        .storeUint(percent, 64)
        .endCell();
      referralProgramDict.set(i, cell);
    }

    const data = beginCell()
      .storeAddress(config.admin_addr) // store admin address
      .storeUint(0, 1) // store empty users
      .storeDict(referralProgramDict, Dictionary.Keys.Uint(64), {
        serialize: (src, builder) => {
          const slice = src.asSlice();
          const referrals_count = slice.loadUint(32);
          const percent = slice.loadUint(64);

          builder.storeUint(referrals_count, 32);
          builder.storeUint(percent, 64);
        },
        parse: (src) => {
          const referrals_count = src.loadUint(32);
          const percent = src.loadUint(64);

          return beginCell()
            .storeUint(referrals_count, 32)
            .storeUint(percent, 64)
            .endCell();
        },
      }) // store referrals program
      .storeUint(config.daily_percent, 64) // store daily percent
      .storeUint(config.min_days, 32) // store min days to deposit freeze
      .storeUint(config.max_days, 32) // store min days to deposit freeze
      .endCell();
    const init = { code, data };
    return new Pyramide(contractAddress(workchain, init), init);
  }

  async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell().endCell(),
    });
  }

  async sendUserDeposit(
    provider: ContractProvider,
    sender: Sender,
    value: bigint,
    days: number,
    refAddress?: Maybe<Address>
  ) {
    await provider.internal(sender, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(1003, 32)
        .storeUint(days, 32)
        .storeAddress(refAddress || null)
        .endCell(),
    });
  }

  async sendUserWithdraw(
    provider: ContractProvider,
    sender: Sender,
    value: bigint
  ) {
    await provider.internal(sender, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell().storeUint(1004, 32).endCell(),
    });
  }

  async sendWithdrawal(
    provider: ContractProvider,
    sender: Sender,
    value: bigint,
    amount: bigint
  ) {
    await provider.internal(sender, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell().storeUint(1002, 32).storeCoins(amount).endCell(),
    });
  }

  async sendReset(provider: ContractProvider, sender: Sender, value: bigint) {
    await provider.internal(sender, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell().storeUint(1001, 32).endCell(),
    });
  }

  async getUsers(provider: ContractProvider) {
    const result = await provider.get('get_users', []);
    const users = [];
    let list = result.stack.readTupleOpt();

    while (list) {
      const tuple = list.readTuple();

      const addrTuple = tuple.readTuple();
      const wc = addrTuple.readNumber();
      const hash = addrTuple.readBigNumber();

      const unlockDate = tuple.readNumber();
      const coins = tuple.readNumber();
      const days = tuple.readNumber();
      const referralsCount = tuple.readNumber();
      const referralAddress = tuple.readAddressOpt();

      users.push({
        address: Address.parse(wc + ':' + hash.toString(16).padStart(64, '0')),
        unlockDate,
        coins,
        days,
        referralsCount,
        referralAddress,
      });

      if (list.remaining > 0) {
        list = list.readTupleOpt();
      }
    }
    return users;
  }

  async getUser(provider: ContractProvider, address: Address) {
    const result = await provider.get('get_user', [
      {
        type: 'slice',
        cell: beginCell().storeAddress(address).endCell(),
      },
    ]);
    const tuple = result.stack.readTupleOpt();

    return tuple
      ? {
          unlockDate: tuple.readNumber(),
          coins: tuple.readBigNumber(),
          days: tuple.readNumber(),
          referralsCount: tuple.readNumber(),
          referralAddress: tuple.readAddressOpt(),
        }
      : null;
  }

  async getBalance(provider: ContractProvider) {
    const { stack } = await provider.get('get_contract_balance', []);
    return stack.readNumber();
  }
}
