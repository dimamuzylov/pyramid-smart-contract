import { compile } from '@ton/blueprint';
import { Cell, fromNano, toNano } from '@ton/core';
import {
  Blockchain,
  SandboxContract,
  TreasuryContract,
  printTransactionFees,
} from '@ton/sandbox';
import '@ton/test-utils';
import { Pyramide, PyramideConfig } from '../wrappers/Pyramide';

describe('pyramide.fc contract tests', () => {
  let code: Cell;

  beforeAll(async () => {
    code = await compile('Pyramide');
  });

  let blockchain: Blockchain;

  beforeEach(async () => {
    blockchain = await Blockchain.create();
  });

  it('should get config', async () => {
    const adminWallet = await blockchain.treasury('adminWallet');
    const pyramide = blockchain.openContract(
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

    const config = await pyramide.getConfig();
    expect(config.dailyPercent).toBe('3');
    expect(config.minDays).toBe(7);
    expect(config.maxDays).toBe(365);
    expect(config.referralsProgram).toEqual([
      { referralsCount: 5, percent: '4' },
      { referralsCount: 10, percent: '4.5' },
      { referralsCount: 20, percent: '5' },
      { referralsCount: 50, percent: '6' },
      { referralsCount: 100, percent: '6.5' },
      { referralsCount: 200, percent: '7' },
      { referralsCount: 500, percent: '7.5' },
      { referralsCount: 1000, percent: '10' },
    ]);
  });

  it('should get config with empty referrals', async () => {
    const adminWallet = await blockchain.treasury('adminWallet');
    const pyramide = blockchain.openContract(
      Pyramide.createFromConfig(
        {
          admin_addr: adminWallet.address,
          daily_percent: toNano(3),
          min_days: 7,
          max_days: 365,
        },
        code
      )
    );
    await pyramide.sendDeploy(adminWallet.getSender(), toNano('0.05'));

    const config = await pyramide.getConfig();
    expect(config.dailyPercent).toBe('3');
    expect(config.minDays).toBe(7);
    expect(config.maxDays).toBe(365);
    expect(config.referralsProgram).toEqual([]);
  });
});
