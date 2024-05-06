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
    let adminWallet: SandboxContract<TreasuryContract>;

    const DEFAULT_DAYS = 7;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        adminWallet = await blockchain.treasury('adminWallet');
        pyramide = blockchain.openContract(
            Pyramide.createFromConfig(
                { admin_addr: adminWallet.address, daily_percent: 3, min_days: 7, max_days: 365 },
                code,
            ),
        );
        await pyramide.sendDeploy(adminWallet.getSender(), toNano('0.05'));
    });

    it('admin should withdraw 1 TON', async () => {
        const senderWallet = await blockchain.treasury('sender');
        await pyramide.sendUserDeposit(senderWallet.getSender(), toNano('1'), DEFAULT_DAYS);

        const sentWithdrawal = await pyramide.sendWithdrawal(adminWallet.getSender(), toNano('1'));

        console.log('admin should withdraw 1 TON');
        printTransactionFees(sentWithdrawal.transactions);

        expect(sentWithdrawal.transactions).toHaveTransaction({
            exitCode: 0,
        });
    });

    it('admin should get error on empty balance trying to withdraw 1 TON', async () => {
        const sentWithdrawal = await pyramide.sendWithdrawal(adminWallet.getSender(), toNano('1'));

        console.log('admin should get error on empty balance trying to withdraw 1 TON');
        printTransactionFees(sentWithdrawal.transactions);

        expect(sentWithdrawal.transactions).toHaveTransaction({
            actionResultCode: 37,
        });
    });

    it('not admin should got exit code on withdraw', async () => {
        const notAdminWallet = await blockchain.treasury('notAdminWallet');
        const sentWithdrawal = await pyramide.sendWithdrawal(notAdminWallet.getSender(), toNano('1'));

        console.log('not admin should got exit code on withdraw');
        printTransactionFees(sentWithdrawal.transactions);

        expect(sentWithdrawal.transactions).toHaveTransaction({
            exitCode: 65533,
        });
    });

    it('admin should do users reset', async () => {
        const sender = await blockchain.treasury('sender');
        const sendDeposit = await pyramide.sendUserDeposit(sender.getSender(), toNano('1'), 7);

        console.log('admin should do users reset');
        printTransactionFees(sendDeposit.transactions);

        await pyramide.sendReset(adminWallet.getSender(), toNano('0.01'));

        const users = await pyramide.getUsers();

        expect(users).toHaveLength(0);
    });

    it('not admin should got exit code on users reset', async () => {
        const notAdminWallet = await blockchain.treasury('notAdminWallet');
        const sentWithdrawal = await pyramide.sendReset(notAdminWallet.getSender(), toNano('1'));

        console.log('not admin should got exit code on users reset');
        printTransactionFees(sentWithdrawal.transactions);

        expect(sentWithdrawal.transactions).toHaveTransaction({
            exitCode: 65533,
        });
    });
});
