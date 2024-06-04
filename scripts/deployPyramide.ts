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
          daily_percent: 3,
          min_days: 7,
          max_days: 365,
        },
        await compile('Pyramide')
      )
    );
    await pyramide.sendDeploy(provider.sender(), toNano('0.05'));
    await provider.waitForDeploy(pyramide.address);
  }
}
