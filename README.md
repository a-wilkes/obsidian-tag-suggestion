# Obsidian Tag Suggest

A plugin for [Obsidian](https://obsidian.md/). It suggests tags for documents in your vault as you're editing them.

Please note that this extension is largely untested - it will likely be a source of slow-down when opening large files, it may even freeze Obsidian. Always back up your notes.

## Use

Open the tag suggestion window using the ribbon button. You should see a list of tags that match your document (taken from other documents in the vault), as well as the full list of tags that your document is not yet using.

## Installation

Download `main.js`, `manifest.json`, and `styles.css` from [the latest release](https://github.com/a-wilkes/obsidian-tag-suggestion/releases) and put them into `path/to/your/vault/.obsidian/plugins/obsidian-tag-suggestion` (you will need to show hidden files and folders, and create any missing folders yourself) so that you have, for example:

```
/path/to/vault/
└── .obsidian
    └── plugins
        └── obsidian-tag-suggestion
            ├── main.js
            ├── manifest.json
            └── styles.css
```

Open Obsidian, go to settings, then "Community Plugins". Turn "Safe mode" to "OFF", then turn on the "Tag Suggestions" plugin in the list below (may require you to refresh the list or restart Obsidian before the plugin shows up).
