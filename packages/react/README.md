# @pixabots/react

React component for [Pixabots](https://pixabots.com) — drop `<Pixabot id="xxxx" />` anywhere.

## Install

```bash
npm install @pixabots/react
# or
pnpm add @pixabots/react
```

Requires React 18+.

## Usage

```tsx
import { Pixabot } from "@pixabots/react";

<Pixabot id="2156" />
<Pixabot id="2156" size={240} />
<Pixabot id="2156" animated={false} />
<Pixabot id="random" size={128} />
<Pixabot id="2156" format="svg" />
<Pixabot id="2156" webp />
<Pixabot id="2156" hue={200} saturate={0.8} />
```

All `<img>` attributes pass through (`className`, `style`, `onClick`, etc). `image-rendering: pixelated` is applied automatically.

## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `id` | `string \| "random"` | `"random"` | 4-char base36 pixabot ID. Invalid / missing → random. |
| `size` | `number` | `128` | Any integer 32–1920. |
| `animated` | `boolean` | `true` | Idle bounce animation. |
| `speed` | `number` | `1` | 0.25–4 multiplier. Only with `animated`. |
| `format` | `"svg"` | — | Vector output instead of raster. |
| `webp` | `boolean` | `false` | With `animated`, use animated WebP (smaller, alpha). |
| `hue` | `number` | — | Hue rotation in degrees (0–359). |
| `saturate` | `number` | `1` | Saturation multiplier (0–4). 0 = greyscale. |
| `origin` | `string` | `https://pixabots.com` | Override API host. |

## License

MIT
