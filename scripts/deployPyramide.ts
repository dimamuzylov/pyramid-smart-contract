import { toNano } from '@ton/core';
import { Pyramide } from '../wrappers/Pyramide';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
  const admin_addr = provider.sender().address;

  if (admin_addr) {
    const pyramide = provider.open(
      Pyramide.createFromConfig(
        {
          admin_addr,
          daily_percent: toNano(3),
          min_days: 1,
          max_days: 2,
          referrals_program: [
            [1, toNano(4)],
            [2, toNano(5.5)],
            [3, toNano(6.5)],
            [4, toNano(7.5)],
            [5, toNano(10)],
          ],
        },
        await compile('Pyramide')
      )
    );
    await pyramide.sendDeploy(provider.sender(), toNano('0.05'));
    await provider.waitForDeploy(pyramide.address);
  }
}
