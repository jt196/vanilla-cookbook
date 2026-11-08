import { writable } from 'svelte/store'

/** Whether the ⌘K command palette is open. Any component can open it with `.set(true)`. */
export const commandPaletteOpen = writable(false)
