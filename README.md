# TON Pyramid

---

## ◮ Create smart contract to manage user funds depends on their deposit time

---

## Pyramid smart contract DB

`db::admin_addr` - slice. Admin address of smart contrast.

`db::users` - cell.

User model.

```
unlock_date - uint 32 bits. Date when user may do withdrawal.
amount - coins. Amount of deposit.
days - uint 32 bits. Days to freeze deposit.
referrals_count - uint 32 bits. Referrals count which may increase daily percentage on withdrawal.
referral_address - slice. Address who invited.
```

`db::referrals_program` - cell.

Contains.

```
referrals_count - uint 32. Which count of referrals user must do to increase daily percentage.
percent - uint 64. Daily percentage depends on referrals count.
```

`db::daily_percent` - int. Percentage applying to user coins amount on each day.

`db::min_days` - int. Minimum days of deposit being freezed.

`db::max_days` - int. Maximum days of deposit being freezed.

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

- only `admin_addr` may do actions with `opcodes` (`op::reset`, `op::withdraw`).

- `user::deposit(slice address, int amount, int days slice ref_address)` may do deposit if `amount` not less than `1 TON` and not more than `50 TON`.

- `user::deposit(slice address, int amount, int days slice ref_address)` may do deposit if `days` more than `min_days` and less than `min_days`.

- `user::deposit(slice address, int amount, int days slice ref_address)` may increase user `referrals_count` only by `ref_address`.

- `user::withdraw` may do withdrawal if `unlock_date (user_time + user_days * 60 * 60 * 24)` is done.

---

## Pyramid configuration

Pyramid configuration are unchanged and is set during deployment.

`admin_addr` - Admin address to manage `withdraw` and `reset` methods of smart contract.

`daily_percent` - Percentage applying to user coins amount on each day.

```
percents = days * daily_percent;
withdrawal_user_amount = (user_amount * percents) / 100;
```

`min_days` - Minimum days of deposit being freezed.

`max_days` - Maximum days of deposit being freezed.

`referrals_program` - To provide referrals program in array. [[5, toNano(3)]] - where 5 is count of referrals, 3 is percentage per day. By default there is no `referrals_program`.

---

## Project structure

- `contracts` - source code of all the smart contracts of the project and their dependencies.
- `wrappers` - wrapper classes (implementing `Contract` from ton-core) for the contracts, including any [de]serialization primitives and compilation functions.
- `tests` - tests for the contracts.
- `scripts` - scripts used by the project, mainly the deployment scripts.

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
