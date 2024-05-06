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
    let senderWallet: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        blockchain.now = Math.floor(Date.now() / 1000 - 14 * 60 * 60 * 24); // set current time - 2 weeks

        const adminWallet = await blockchain.treasury('adminWallet');
        pyramide = blockchain.openContract(
            Pyramide.createFromConfig(
                { admin_addr: adminWallet.address, daily_percent: 3, min_days: 7, max_days: 365 },
                code,
            ),
        );
        await pyramide.sendDeploy(adminWallet.getSender(), toNano('0.05'));

        senderWallet = await blockchain.treasury('sender');
        await pyramide.sendUserDeposit(senderWallet.getSender(), toNano('1'), 7);

        blockchain.now = Math.floor(Date.now() / 1000); // set current time
    });

    it('user withdraw should be success', async () => {
        const newSenderWallet = await blockchain.treasury('newsender');
        await pyramide.sendUserDeposit(newSenderWallet.getSender(), toNano('1'), 7); // add extra TON to contract balance;

        const sendDeposit = await pyramide.sendUserWithdraw(senderWallet.getSender(), toNano('0.1'));

        console.log('user withdraw should be success');
        printTransactionFees(sendDeposit.transactions);

        const user = await pyramide.getUser(senderWallet.address);
        expect(user).toBeNull();
    });

    it('user withdraw should have exit code if address not exist', async () => {
        const senderWalletNotExist = await blockchain.treasury('senderNotExist');
        const sendDeposit = await pyramide.sendUserWithdraw(senderWalletNotExist.getSender(), toNano('0.1'));

        console.log('user withdraw should have exit code if address not exist');
        printTransactionFees(sendDeposit.transactions);

        expect(sendDeposit.transactions).toHaveTransaction({
            exitCode: 2002,
        });
    });

    it('user withdraw should get error if withdrawing more then on balance', async () => {
        const sendDeposit = await pyramide.sendUserWithdraw(senderWallet.getSender(), toNano('0.1'));

        console.log('user withdraw should get error if withdrawing more then on balance');
        printTransactionFees(sendDeposit.transactions);

        expect(sendDeposit.transactions).toHaveTransaction({
            actionResultCode: 37,
        });

        const user = await pyramide.getUser(senderWallet.address);
        expect(user).not.toBeNull();
    });

    it('user withdraw should have exit code if time not come yet', async () => {
        blockchain.now = Math.floor(Date.now() / 1000 - 10 * 60 * 60 * 24); // set current time - 10 days
        const sendDeposit = await pyramide.sendUserWithdraw(senderWallet.getSender(), toNano('0.1'));

        console.log('user withdraw should have exit code if time not come yet');
        printTransactionFees(sendDeposit.transactions);

        expect(sendDeposit.transactions).toHaveTransaction({
            exitCode: 2004,
        });
    });
});
