
## Coding Guidelines
keep changes minimal

use enums where available
use scoped enums like `TechID::` or `UnitID::`

## PR instructions
Title format: <type>(<scope>): <description>
while scope is optional

branch name should start with "agent/123-description-of-task" where 123 is the current PR id

## Ending a Task/Conversation/Session
- at the end scan similar files and evaluate if there is similar/duplicated code;
  - refactor those BUT only if it is safe and minimal
  - AND inform the user about it
  - AND create a own commit for each refactor (so review is easy)
