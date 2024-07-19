import { Address, toNano } from '@ton/core';
import { Pyramide } from '../wrappers/Pyramide';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
  const address = Address.parse(
    'EQBNDBuXa7ChuVjpa0XaZ7NPM9p-k_pwHBP6eLRIbQTyRsse'
  );

  const pyramide = provider.open(new Pyramide(address));

  if (!(await provider.isContractDeployed(address))) {
    console.log(`Error: Contract at address ${address} is not deployed!`);
    return;
  }

  await pyramide.sendReset(provider.sender(), toNano('0.05'));
}
