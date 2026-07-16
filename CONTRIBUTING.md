# Contributing to Typing Stats

Thank you so much for being interested in the development of Typing Stats! Before you start, I wrote up some guidelines for the project below. Please read and follow them if you want to contribute.

Also, I'm assuming you have read the [README](./README.md).

## Preface

This plugin is a personal project. I am always open to contributions and feedback, but it is ultimately my project to work on. You do not need to feel responsible for it.

## Some Important Things

- ❗ Every pull request should be tied to an existing issue/feature request. If there isn't one, you can make your own.
- ❗ **In addition to the guidelines in this file, Obsidian has undisputable rules that all plugins must follow. Obviously, nothing that breaks those rules is allowed here.**

> [!IMPORTANT]
> Please check the [Obsidian developer policies](https://docs.obsidian.md/Developer+policies). _Most_ of them are common sense, but any violation could get the plugin rejected.

## Dev Setup

An Obsidian plugin must exist inside of an Obsidian vault, in the `.obsidian/plugins` folder. To develop and test the plugin, you will want to clone the repository inside of that directory.

1. Create an Obsidian vault (or download a public example vault) to test your plugin with.
2. Enable community plugins on the vault. If community plugins are already enabled, you might want to disable the existing ones (unless you are specifically testing for compatability).
3. Using the terminal, `cd` to your vault's `.obsidian/plugins` directory.
4. Clone this repository inside of that directory.
5. `cd` into the repository.
6. Run `npm install` to install dependencies.
7. To build the plugin, run `npm run dev`.
8. In your Obsidian vault, you should now see the Typing Stats plugin in the community plugin list. Click the refresh icon on it to get the latest build.
9. Enable the plugin and test it out!

Whenever you make a change to the plugin, repeat steps 7-9 (or 8-9 if the dev server is already running).

## Code Guidelines

This is a small plugin, but code quality is still the goal. Here are some guidelines to help you out:

- ❗ **Never send or save user data or vault data outside of the user's vault folder. This includes third-party APIs, databases, and directories outside of the vault folder.** This plugin is simple and should not need any of that.
- Always read as little information from the user's vault as possible. This project, like all Obsidian plugins, is built on trust, security, and privacy. We can write very personal things in our Obsidian notes, and a plugin that actively reads Markdown changes can easily break that trust if allowed. Read only what is necessary for the plugin's purpose.
- Avoid adding npm dependencies if possible, especially if they are only used in a small part of the application. If a new dependency is unavoidable, you must explain why its added value is worth the drawbacks.
- This project currently implements its UI imperatively, without the use of a UI library like Svelte or React. This is mostly because the plugin only has one component: the stats view. For now, there is not a good enough reason to use a library.
- Prefer functions over OOP when possible. If you must use OOP, avoid inheritance and excessive abstraction. We do not want to turn this project into [FizzBuzz Enterprise Edition](https://github.com/enterprisequalitycoding/fizzbuzzenterpriseedition).
- Comment your code enough so that someone with no knowledge of it could understand it quickly. Try to think from that person's perspective.
- Keep PRs small and atomic. They take time to digest.

## Final Notes

Lastly, this project has a specific feel that I'm going for. If I ask for changes to a PR or any contribution you make, that is often the reason, rather than the code being "wrong". Whenever this happens, I will explain my reasoning as best I can.

> Thank you for reading through this. I hope that you can understand where I am coming from with these guidelines, and I am excited to see what you have to offer this project!
