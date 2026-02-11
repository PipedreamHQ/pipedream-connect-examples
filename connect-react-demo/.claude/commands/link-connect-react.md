---
description: Link or unlink local @pipedream/connect-react package for development testing
argument-hint: [link|unlink|status]
allowed-tools: [Bash, Read, Glob, Grep]
---

# Link Local Connect-React Command

Manages local linking between a demo app and the local Pipedream connect-react package for development testing.

## Arguments

The user invoked this command with: $ARGUMENTS

## Path Detection

**IMPORTANT**: Before running any commands, you must detect the paths dynamically.

### Step 1: Detect the Demo App

The demo app is a project that uses `@pipedream/connect-react` as a dependency. To find it:

1. Check if the **current working directory** has a `package.json` with `@pipedream/connect-react` in dependencies:
   ```bash
   grep -l "connect-react" package.json 2>/dev/null
   ```

2. If not found, search in common locations relative to cwd:
   - Look for `package.json` files containing `@pipedream/connect-react`

3. Store the detected demo app path in a variable for use in subsequent commands.

### Step 2: Detect the connect-react Package

The connect-react source package is located at `packages/connect-react` within the pipedream monorepo. To find it:

1. Search relative to the demo app's parent directories:
   ```bash
   # Check common sibling/cousin patterns
   ls -d ../pipedream/packages/connect-react 2>/dev/null || \
   ls -d ../../pipedream/packages/connect-react 2>/dev/null || \
   ls -d ../../../pipedream/packages/connect-react 2>/dev/null
   ```

2. Verify it's the correct package by checking for `package.json` with name `@pipedream/connect-react`

3. If not found in common locations, ask the user to provide the path.

### Step 3: Confirm Paths

Before proceeding, output the detected paths:
```
Demo app: /path/to/demo-app
connect-react package: /path/to/pipedream/packages/connect-react
```

If either path cannot be detected, ask the user to provide it.

## Instructions

Based on the argument provided (use detected paths, referred to as `$DEMO_APP` and `$CONNECT_REACT`):

### `link` (default if no argument)

1. **Check and install dependencies** if node_modules is missing in connect-react:
   ```bash
   cd $CONNECT_REACT
   if [ ! -d "node_modules" ]; then
     pnpm install
   fi
   ```

2. **Build the package** (initial build before watch):
   ```bash
   cd $CONNECT_REACT && pnpm build
   ```

3. **Link the package** using pnpm's local path linking (NOT global):
   ```bash
   cd $DEMO_APP
   pnpm link $CONNECT_REACT
   ```

4. **Verify the link**:
   ```bash
   ls -la $DEMO_APP/node_modules/@pipedream/connect-react
   ```

5. **Start watch mode** in the background for live reloading:
   ```bash
   cd $CONNECT_REACT && pnpm watch
   ```
   Run this in the background so changes auto-rebuild.

6. Report success and remind user:
   - Restart the demo dev server if running
   - The watch process will auto-rebuild on changes
   - To stop watch mode, find and kill the process or use Ctrl+C in that terminal

### `unlink`

1. **Stop any running watch process** (if applicable - inform user to do this manually if needed)

2. **Remove the link** and restore from npm registry:
   ```bash
   cd $DEMO_APP
   pnpm unlink @pipedream/connect-react
   pnpm install
   ```

3. **Verify** node_modules/@pipedream/connect-react is no longer a symlink.

4. Report success.

### `status`

1. Check if linked:
   ```bash
   ls -la $DEMO_APP/node_modules/@pipedream/connect-react
   ```

2. Check if watch is running:
   ```bash
   ps aux | grep -E "vite.*connect-react" | grep -v grep
   ```

3. Report current status (linked/not linked, watch running/not running).

## Notes

- Uses **local** pnpm linking (not `--global`), only affects this project
- To undo: `/link-connect-react unlink` or delete node_modules and `pnpm install`
- Watch mode (`pnpm watch`) auto-rebuilds on source changes for live development
- Paths are detected dynamically - the skill works regardless of where repos are located
