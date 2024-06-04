import {
  Blockchain,
  SandboxContract,
  TreasuryContract,
  printTransactionFees,
} from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { Pyramide } from '../wrappers/Pyramide';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('pyramide.fc contract tests', () => {
  let code: Cell;

  beforeAll(async () => {
    code = await compile('Pyramide');
  });

  let blockchain: Blockchain;
  /** Smart Contract Wrapper */
  let pyramide: SandboxContract<Pyramide>;

  const DEFAULT_DAYS = 7;

  beforeEach(async () => {
    blockchain = await Blockchain.create();

    const adminWallet = await blockchain.treasury('adminWallet');
    pyramide = blockchain.openContract(
      Pyramide.createFromConfig(
        {
          admin_addr: adminWallet.address,
          daily_percent: toNano(0),
          min_days: 7,
          max_days: 365,
        },
        code
      )
    );
    await pyramide.sendDeploy(adminWallet.getSender(), toNano('0.05'));
  });

  it('user deposit should be success', async () => {
    const senderWallet = await blockchain.treasury('sender');
    const sendDeposit = await pyramide.sendUserDeposit(
      senderWallet.getSender(),
      toNano('1'),
      DEFAULT_DAYS
    );

    console.log('user deposit should be success');
    printTransactionFees(sendDeposit.transactions);

    expect(await pyramide.getBalance()).toBeGreaterThan(toNano('1'));
  });

  it('user deposit should have exit code if deposit already done', async () => {
    const senderWallet = await blockchain.treasury('sender');
    await pyramide.sendUserDeposit(
      senderWallet.getSender(),
      toNano('1'),
      DEFAULT_DAYS
    );

    const sendDeposit = await pyramide.sendUserDeposit(
      senderWallet.getSender(),
      toNano('1'),
      DEFAULT_DAYS * 2
    );

    console.log('user deposit should have exit code if deposit already done');
    printTransactionFees(sendDeposit.transactions);

    expect(sendDeposit.transactions).toHaveTransaction({
      exitCode: 2001,
    });
  });

  it('user deposit should have exit code if less than 1 TON', async () => {
    const senderWallet = await blockchain.treasury('sender');
    const sendDeposit = await pyramide.sendUserDeposit(
      senderWallet.getSender(),
      toNano('0.5'),
      DEFAULT_DAYS
    );

    console.log('user deposit should have exit code if less than 1 TON');
    printTransactionFees(sendDeposit.transactions);

    expect(sendDeposit.transactions).toHaveTransaction({
      exitCode: 2001,
    });
  });

  it('user deposit should have exit code if more than 50 TON', async () => {
    const senderWallet = await blockchain.treasury('sender');
    const sendDeposit = await pyramide.sendUserDeposit(
      senderWallet.getSender(),
      toNano('50.5'),
      DEFAULT_DAYS
    );

    console.log('user deposit should have exit code if more than 50 TON');
    printTransactionFees(sendDeposit.transactions);

    expect(sendDeposit.transactions).toHaveTransaction({
      exitCode: 2001,
    });
  });

  it('user deposit should have exit code if days less than min deposit days', async () => {
    const senderWallet = await blockchain.treasury('sender');
    const sendDeposit = await pyramide.sendUserDeposit(
      senderWallet.getSender(),
      toNano('1'),
      6
    );

    console.log(
      'user deposit should have exit code if days less than min deposit days'
    );
    printTransactionFees(sendDeposit.transactions);

    expect(sendDeposit.transactions).toHaveTransaction({
      exitCode: 2003,
    });
  });

  it('user deposit should have exit code if days more than max deposit days', async () => {
    const senderWallet = await blockchain.treasury('sender');
    const sendDeposit = await pyramide.sendUserDeposit(
      senderWallet.getSender(),
      toNano('1'),
      400
    );

    console.log(
      'user deposit should have exit code if days more than max deposit days'
    );
    printTransactionFees(sendDeposit.transactions);

    expect(sendDeposit.transactions).toHaveTransaction({
      exitCode: 2003,
    });
  });
});
