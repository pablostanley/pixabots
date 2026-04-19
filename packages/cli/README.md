# pixabots

CLI — print and download [Pixabots](https://pixabots.com) from your terminal.

## Usage

```bash
npx pixabots                               # print a random pixabot to the terminal
npx pixabots 2156                          # print a specific pixabot
npx pixabots 2156 --info                   # print metadata
npx pixabots 2156 --save bot.png           # download PNG (480px default)
npx pixabots 2156 --hue 200 --save bot.png # recolored PNG
npx pixabots random --json                 # random pixabot as JSON
```

Palette (`--hue`, `--saturate`) applies to `--save`. The terminal ANSI render shows base colors.

Renders via ANSI truecolor using half-block characters (`▀`). Works in any modern terminal emulator (iTerm2, Terminal.app, Windows Terminal, most Linux terminals).

## Env

- `PIXABOTS_ORIGIN` — override the API host (default `https://pixabots.com`)

## License

MIT
