# TON Pyramid

---

## ◮ Create smart contract to manage user funds depends on their deposit time

---

## Pyramid parameters

Pyramid parameters are unchanged and is set during deployment.

`admin_addr` - Admin address to manage `withdraw` and `reset` methods of smart contract.

`daily_percent` - Percentage applying to user coins amount on each day.

```
percents = days * daily_percent;
withdrawal_user_amount = (user_amount * percents) / 100;
```

`min_days` - Minimum days of deposit being freezed.

`max_days` - Maximum days of deposit being freezed.

---

## Pyramid smart contract getters

`get_users` - Returns all users that done deposit.

```
tuple -> [
    [wc, hash],
    [deposit_time],
    [deposit_coins]
]
```

`get_user` - Returns single user that done deposit. Return `null` if user not found.

```
tuple -> [
    [deposit_time],
    [deposit_coins]
]
```

---

## Pyramid restrictions

-   only `admin_addr` may do actions with `opcodes` (`op::reset`, `op::withdraw`).

-   `user::deposit(slice address, int amount, int days)` may do deposit if `amount` not less than `1 TON` and not more than `50 TON`.

-   `user::deposit(slice address, int amount, int days)` may do deposit if `days` more than `min_days` and less than `min_days`.

-   `user::withdraw` may do withdrawal if `freeze_time (user_time + user_days * 60 * 60 * 24)` is done.

---

## Project structure

-   `contracts` - source code of all the smart contracts of the project and their dependencies.
-   `wrappers` - wrapper classes (implementing `Contract` from ton-core) for the contracts, including any [de]serialization primitives and compilation functions.
-   `tests` - tests for the contracts.
-   `scripts` - scripts used by the project, mainly the deployment scripts.

---

## How to use

### Build

`npx blueprint build` or `yarn blueprint build`

### Test

`npx blueprint test` or `yarn blueprint test`

### Deploy or run another script

`npx blueprint run` or `yarn blueprint run`

### Add a new contract

`npx blueprint create ContractName` or `yarn blueprint create ContractName`

# License

MIT
