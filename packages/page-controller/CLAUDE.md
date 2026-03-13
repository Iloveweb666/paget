# @paget/page-controller

## Overview

Browser-side DOM controller — extracts page state and executes element interactions. Runs inside target web pages, not on the server.

## Rules

- All comments: bilingual (中文 / English)
- Pure TypeScript, no framework dependency in core code
- Framework-specific patches isolated in `patches/` directory
- Must work in any modern browser (Chrome 90+, Firefox 90+, Safari 15+)
- No Node.js APIs — this runs in browser context only
- Batch execution: fail-fast on first error, report partial results
- DOM extraction must be fast (< 100ms for typical pages)
- SimulatorMask: use high z-index (99998+) to overlay all page content
