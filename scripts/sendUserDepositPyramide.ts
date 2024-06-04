import { Address, toNano } from '@ton/core';
import { Pyramide } from '../wrappers/Pyramide';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
  const address = Address.parse(
    'EQAcWeGkhgaaaZiwUaIX8dArzvHa8_KzkhvpnhHQwaAh6hOw'
  );

  const pyramide = provider.open(new Pyramide(address));

  if (!(await provider.isContractDeployed(address))) {
    console.log(`Error: Contract at address ${address} is not deployed!`);
    return;
  }

  await pyramide.sendUserDeposit(provider.sender(), toNano('2'), 7);
}
