## Typescript repro: unsound typedef resolution logic

We have a base package (this package) and a [git package](https://github.com/conartist6/ts-git-package) -- which is to say a git repository usable by as a package by npm. Note that `ts-git-package` contains some intentional errors simulating stale build output.

The goal of this work is to allow git repos to contain checked in built files alongside sources. This is perhaps contraversial, but is extremely powerful in practice as it allows git repos and particularly forks to be used as npm packages. A simple fork > change > build > push > use workflow is sufficient to evolve such a package, whereas a package that can only be used in its published form requires additional steps like changing the package name in the fork, publishing under the new name, changing all usages to the new name, and then eventually reverting all those changes when the needed change is merged upstream.

### What to look for in this repo

- Typescript evaluates `/node_modules/git-package/main.ts` in accordance with `/tsconfig.json` (as opposed to `/node_modules/git-package/tsconfig.json`). This causes an error at `main.ts:1:14`: `Type 'null' is not assignable to type 'string'.` Loose nulls are permitted in `/node_modules/git-package/tsconfig.json` so this is a false positive error.

- Typescript jumps from compiled code into uncompiled code!! The resolution path looks like this: `ts-def-repro/index.js` > `git-package/package.json#types` > `git-package/index.d.ts` > `git-package/main.ts`. Notice the jump from `.d.ts` to `.ts` due to typescript's module resolution order, which always prefers `.ts` extensions to `.d.ts` extensions, when in fact it **never should**.

- `git-package` has been published without being built. This is causing typescript to fail to report a real error: an undefined export called `unbuiltExport` is being used. Evaluating this code will cause an unexpected error, but it is invisible to typescript because typescript evaluates type definitions from sources but then runs built `js` code.

### Proposal

It is my opinion that the best fix for all these problems is in fact the simplest: move `.d.ts` ahead of `.ts` in the module resolution order.

Originally typescript had such a resolution order, but `.ts` was swapped ahead of `.d.ts` with the goal of making linked development (i.e. with `npm link`) more convenient. Unfortunately correctness was sacrificed for this convenience.
