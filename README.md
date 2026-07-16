# Obsidian Typing Stats

Work on your notes and your typing skills at the same time with this Obsidian plugin! It calculates a bunch of typing statistics in the background while you take notes.

## Installation

- Typing Stats is available on the [Obsidian Community Plugins repository](https://community.obsidian.md/search?q=Typing%20Stats).

See the [CHANGELOG](./CHANGELOD.md) for more details on each version.

## Included Stats

Stats are compiled by day in your plugin data. You can view your history of these stats over multiple days:

- **Active time** - How much time is spent typing.
- **Bursts** - How many typing bursts occurred. A "burst" is a sequence of edits with no gap longer than the "new burst threshold" setting (2 seconds by default) between them. Once you pause for longer than that, the current burst ends and the next edit starts a new one. Bursts shorter than "minimum burst duration" are not counted, to filter out small ones or stray keystrokes.
- **Average WPM** - Average of your net words per minute over time. Net WPM uses the following formula:

  $$
  \text{Net WPM} = \frac{\max(0, \text{added characters} - \text{deleted characters})}{5 \times \text{typing duration in minutes}}
  $$

- **Corrections**: An estimate of how often you type something and immediately correct it. Happens when, shortly after inserting text, you delete something that overlaps with what you just typed.
  - Not a perfect measure of error. I am actively thinking of other ways to infer when errors happen.

- **Corrections per minute** - Number of corrections divided by your active time in minutes.

- **Total chars added** - How many characters you have inserted so far.
- **Total chars deleted** - How many characters you have deleted so far.
- **Net chars** - Total chars added minus total chars deleted.

> If you have any feedback on how useful the stats are, or any ideas for new ones, feel free to create a feature request issue.

## How it Works

This plugin does not work like typing websites such as keybr or Monkeytype, because there is no "target text" to compare to. Stats have to be calculated differently because of this:

- Instead of directly reading keystrokes, the plugin examines changes in the actual content of the note (like the Git diff view). We only care what actually gets added/deleted from the file.
- Instead of using a dictionary of pre-defined words, the plugin aims to _infer_ errors by detecting things like backwards cursor movement and deletions. This way, we are not tied to specific languages or vocabularies. Only what the user considers an error.
  - You _could_ cheat your stats up by just typing a bunch of gibberish, but that doesn't really benefit your improvement. There is no leaderboard so it only hurts you.

## Local Storage

This plugin uses Obsidian's local storage (`data.json` in the plugin folder) to keep a history of stats and save your settings on your machine. Here is what a typical `data.json` looks like:

```json
{
  "settings": {
    "enabled": true,
    "newBurstThreshold": 2000,
    "minBurstDuration": 500
    // ...
  },
  "history": {
    "2026-07-09": {
      "date": "2026-07-09",
      "totalActiveMs": 56073,
      "totalAddedChars": 733,
      "totalDeletedChars": 369,
      "bursts": 8,
      "avgWPM": 75,
      "corrections": 6
      // ...
    }
    // ...
  }
}
```

In the history, each day has the stats compiled during that day. You can use this information to view trends over time.

## Future Plans

- An "ignore list" of files that the user doesn't want their typing tracked in.
- A "consistency" stat calculated based on the variance of your speed and error rate.
- Making the stats view less ugly.
- Ensuring the plugin can track statistics while the user is switching between files.
- Better detection for when the user is AFK or not actively typing.
- More accurate error inference. It will always be an estimation due to the lack of target text. The aim is to make this as close of an estimate as possible without too much overhead.
- A status bar item showing WPM or consistency. It could also be customizable.
- Ability to download stats as a single CSV file, so you can personally view trends over time.
- More settings to tweak how stats are calculated.
- (Bonus) Resisting the temptation of overengineering this thing.

## Want to contribute?

Check out [CONTRIBUTING.md](./CONTRIBUTING.md).
