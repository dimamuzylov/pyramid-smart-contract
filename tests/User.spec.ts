import { Blockchain, SandboxContract, TreasuryContract, printTransactionFees } from '@ton/sandbox';
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
                { admin_addr: adminWallet.address, daily_percent: 3, min_days: 7, max_days: 365 },
                code,
            ),
        );
        await pyramide.sendDeploy(adminWallet.getSender(), toNano('0.05'));
    });

    it('user time should exist', async () => {
        const senderWallet = await blockchain.treasury('sender');
        await pyramide.sendUserDeposit(senderWallet.getSender(), toNano('1'), DEFAULT_DAYS);
        const user = await pyramide.getUser(senderWallet.address);
        expect(user?.time).not.toBeNull();
        expect(user?.time).not.toBeUndefined();
    });

    it('user coins should be equal 1 TON', async () => {
        const coins = toNano('1');
        const senderWallet = await blockchain.treasury('sender');
        const sendDeposit = await pyramide.sendUserDeposit(senderWallet.getSender(), coins, DEFAULT_DAYS);

        console.log('user deposit coins should be equal 1 TON');
        printTransactionFees(sendDeposit.transactions);

        const user = await pyramide.getUser(senderWallet.address);
        expect(user?.coins).toEqual(coins);
    });
});
