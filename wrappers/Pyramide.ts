import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type PyramideConfig = {
    admin_addr: Address;
    daily_percent: number;
    min_days: number;
    max_days: number;
};

export class Pyramide implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell },
    ) {}

    static createFromConfig(config: PyramideConfig, code: Cell, workchain = 0) {
        const data = beginCell()
            .storeAddress(config.admin_addr) // store admin address
            .storeUint(0, 1) // store empty users
            .storeUint(config.daily_percent, 32) // store daily percent
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

    async sendUserDeposit(provider: ContractProvider, sender: Sender, value: bigint, days: number) {
        await provider.internal(sender, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(1003, 32).storeUint(days, 32).endCell(),
        });
    }

    async sendUserWithdraw(provider: ContractProvider, sender: Sender, value: bigint) {
        await provider.internal(sender, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(1004, 32).endCell(),
        });
    }

    async sendWithdrawal(provider: ContractProvider, sender: Sender, value: bigint) {
        await provider.internal(sender, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(1002, 32).endCell(),
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

            const time = tuple.readNumber();
            const coins = tuple.readNumber();

            users.push({
                address: Address.parse(wc + ':' + hash.toString(16).padStart(64, '0')),
                time,
                coins,
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
                  time: tuple.readNumber(),
                  coins: tuple.readBigNumber(),
              }
            : null;
    }
}
