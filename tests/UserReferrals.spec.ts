import { compile } from '@ton/blueprint';
import { Cell, toNano } from '@ton/core';
import {
  Blockchain,
  SandboxContract,
  TreasuryContract,
  printTransactionFees,
} from '@ton/sandbox';
import '@ton/test-utils';
import { Pyramide } from '../wrappers/Pyramide';

describe('pyramide.fc contract tests', () => {
  let code: Cell;

  beforeAll(async () => {
    code = await compile('Pyramide');
  });

  let blockchain: Blockchain;
  /** Smart Contract Wrapper */
  let pyramide: SandboxContract<Pyramide>;
  let senderWallet: SandboxContract<TreasuryContract>;

  const DEFAULT_DAYS = 7;

  beforeEach(async () => {
    blockchain = await Blockchain.create();
    blockchain.now = Math.floor(Date.now() / 1000 - 14 * 60 * 60 * 24); // set current time - 2 weeks

    const adminWallet = await blockchain.treasury('adminWallet');
    pyramide = blockchain.openContract(
      Pyramide.createFromConfig(
        {
          admin_addr: adminWallet.address,
          daily_percent: toNano(3),
          min_days: 7,
          max_days: 365,
          referrals_program: [
            [5, toNano(4)],
            [10, toNano(4.5)],
            [20, toNano(5)],
            [50, toNano(6)],
            [100, toNano(6.5)],
            [200, toNano(7)],
            [500, toNano(7.5)],
            [1000, toNano(10)],
          ],
        },
        code
      )
    );
    await pyramide.sendDeploy(adminWallet.getSender(), toNano('0.05'));

    senderWallet = await blockchain.treasury('sender');
    await pyramide.sendUserDeposit(senderWallet.getSender(), toNano('1'), 7);

    blockchain.now = Math.floor(Date.now() / 1000); // set current time
  });

  it('user referrals count should be not 0', async () => {
    const senderWalletInner = await blockchain.treasury('senderInner');
    const sendDeposit = await pyramide.sendUserDeposit(
      senderWalletInner.getSender(),
      toNano('1'),
      DEFAULT_DAYS,
      senderWallet.address
    );

    console.log('user referrals count should be not 0');
    printTransactionFees(sendDeposit.transactions);

    const user = await pyramide.getUser(senderWallet.address);
    expect(user?.referralsCount).toEqual(1);
  });

  it('user should withdraw with 4% per day', async () => {
    for (let i = 1; i <= 5; i++) {
      const senderWalletInner = await blockchain.treasury('senderInner' + i);
      await pyramide.sendUserDeposit(
        senderWalletInner.getSender(),
        toNano('1'),
        DEFAULT_DAYS,
        senderWallet.address
      );
    }

    const user = await pyramide.getUser(senderWallet.address);
    expect(user?.referralsCount).toEqual(5);

    const sendWithdraw = await pyramide.sendUserWithdraw(
      senderWallet.getSender(),
      toNano('0.05')
    );

    console.log('user should withdraw with 4% per day');
    printTransactionFees(sendWithdraw.transactions);

    expect(sendWithdraw.transactions).toHaveTransaction({
      from: pyramide.address,
      to: senderWallet.address,
      success: true,
      value: toNano('1.28'),
    });
  });

  it('user should withdraw with 10% per day', async () => {
    for (let i = 1; i <= 1000; i++) {
      const senderWalletInner = await blockchain.treasury('senderInner' + i);
      await pyramide.sendUserDeposit(
        senderWalletInner.getSender(),
        toNano('1'),
        DEFAULT_DAYS,
        senderWallet.address
      );
    }

    const user = await pyramide.getUser(senderWallet.address);
    expect(user?.referralsCount).toEqual(1000);

    const sendWithdraw = await pyramide.sendUserWithdraw(
      senderWallet.getSender(),
      toNano('0.05')
    );

    console.log('user should withdraw with 10% per day');
    printTransactionFees(sendWithdraw.transactions);

    expect(sendWithdraw.transactions).toHaveTransaction({
      from: pyramide.address,
      to: senderWallet.address,
      success: true,
      value: toNano('1.7'),
    });
  });
});
