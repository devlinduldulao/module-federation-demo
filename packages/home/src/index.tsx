// Async boundary — required for Module Federation shared dependencies.
// React is shared with eager:false, so it must be loaded asynchronously.
// Without this, standalone mode fails with "loadShareSync" errors.
import("./bootstrap");
