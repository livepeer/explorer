import { TextDecoder, TextEncoder } from "util";

// jsdom lacks these; viem needs them when a jsdom test imports app code.
Object.assign(globalThis, { TextDecoder, TextEncoder });
