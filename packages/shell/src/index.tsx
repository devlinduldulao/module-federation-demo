// dynamic import is an async boundary for module federation. 
// It lets MF negotiate shared deps first.
// you will get white screen + loadShareSync error in synchronous import
// All 5 packages use this pattern

import("./bootstrap");