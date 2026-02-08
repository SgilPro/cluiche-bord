# Commit Command

Generate commit messages following the Conventional Commits specification for staged changes only.

## Conventional Commits Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Commit Types

### Primary Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc.)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools and libraries
- **ci**: Changes to CI configuration files and scripts
- **build**: Changes that affect the build system or external dependencies
- **revert**: Reverts a previous commit

### Scope (Optional)

Specify the area of the codebase affected, for example:
- `api`: API related
- `ui`: User interface
- `db`: Database
- `socket`: Socket.IO
- `auth`: Authentication
- `game`: Game logic

## Execution Steps

1. **Check Staged Changes**
   - Check `git status` to see what files are staged
   - Review `git diff --cached` to understand the changes
   - **Important**: Only staged changes will be analyzed. Unstaged changes are ignored.

2. **Analyze Changes**
   - Analyze the staged changes to understand the nature of modifications
   - Identify the primary type of change
   - Determine appropriate scope if applicable

3. **Generate Commit Message**
   - **Subject**: Use `<type>[scope]: <description>` format
     - Use imperative mood (e.g., "Add", "Fix", "Update")
     - Keep subject line under 72 characters
     - Do not end with a period
   - **Body** (optional): Detailed explanation of what and why
   - **Footer** (optional): Breaking changes or issue references (e.g., `BREAKING CHANGE:` or `Closes #123`)

4. **Developer Confirmation**
   - Present the proposed commit message to the developer
   - Wait for explicit confirmation before executing the commit
   - Allow developer to modify the message if needed

5. **Execute Commit**
   - Only proceed after developer confirmation
   - Execute `git commit` with the confirmed message

## Examples

```
feat(api): add room creation endpoint

Implement POST /api/rooms endpoint to support creating new game rooms
Includes input validation and error handling
```

```
fix(socket): fix duplicate connection on room join

When users repeatedly join the same room, multiple socket connections were created
Now checks for existing connection before creating a new one
```

```
refactor(game): refactor werewolf game engine

Split game logic into smaller functions for better readability and testability
No functional changes
```

```
docs: update API documentation
```

```
chore: update dependency versions

- next: 15.0.0 -> 15.1.0
- prisma: 5.0.0 -> 5.1.0
```

## Usage

In the Agent chat, type `/commit`. The Agent will:

1. Check git status and identify **staged changes only**
2. Analyze the staged changes
3. Generate an appropriate commit message following Conventional Commits format
4. **Present the message for your review and confirmation**
5. Execute the commit only after your explicit approval

Example:
```
/commit
```

**Note**: This command only processes staged changes. You must stage files using `git add` before running this command.

## Important Notes

- ✅ **Only staged changes are processed** - Unstaged changes are ignored
- ✅ **Developer confirmation required** - Commit message must be approved before execution
- ✅ Use imperative mood in subject line
- ✅ Keep subject line under 72 characters
- ✅ Separate body from subject with a blank line
- ✅ Use `BREAKING CHANGE:` footer for breaking changes
- ❌ Avoid past tense (e.g., "Added", "Fixed")
- ❌ Do not end subject line with a period
- ❌ Avoid overly brief descriptions (e.g., "fix bug")

## Common Scenarios

### New Feature
```
feat(game): add werewolf game basic logic
feat(ui): add game room chat functionality
feat(api): add room list query API
```

### Bug Fix
```
fix(socket): fix reconnection issue after disconnect
fix(db): fix type error in room query
fix(ui): fix chat message display order
```

### Refactor
```
refactor(api): refactor room API error handling
refactor(game): extract game state management to separate module
```

### Documentation
```
docs: update project README
docs(api): add API usage documentation
```

### Tests
```
test(game): add werewolf game engine unit tests
test(api): add room API integration tests
```

### Build/Tools
```
chore: update ESLint configuration
chore: update dependencies
ci: add GitHub Actions workflow
```

## Workflow

1. Stage your changes: `git add <files>`
2. Run the command: `/commit`
3. Review the proposed commit message
4. Confirm or request modifications
5. Commit is executed only after your approval