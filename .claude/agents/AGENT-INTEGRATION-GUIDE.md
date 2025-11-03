# Agent Integration Guide: Progress Tracking System

This guide explains how all agents should interact with the progress tracking system in `.progress-tracker/`.

## For All Agents

### When You Start Working

1. **Check for your assigned tasks**:
   ```bash
   # Look in active directory for tasks assigned to you
   grep "assigned_agent: your-agent-name" .progress-tracker/active/*.yml
   ```

2. **Read the complete task file**:
   - Understand acceptance criteria
   - Check dependencies
   - Review verification checklist
   - Note any blockers

3. **Update task status**:
   ```yaml
   status: in_progress
   started_date: 2025-11-03
   notes:
     - "2025-11-03 09:00: Starting work on this task"
   ```

### While You're Working

1. **Add progress notes regularly**:
   ```yaml
   notes:
     - "2025-11-03 09:00: Starting implementation"
     - "2025-11-03 12:00: API endpoints complete"
     - "2025-11-03 15:00: Working on tests"
   ```

2. **Update acceptance criteria as you complete them**:
   ```yaml
   acceptance_criteria:
     - criterion: CRUD endpoints implemented
       status: completed  # Changed from pending
       verified_date: 2025-11-03
   ```

3. **Track files you create/modify**:
   ```yaml
   related_files:
     - src/api/routes/budgets.ts
     - src/services/budget-service.ts
     - tests/integration/budget-api.test.ts
   ```

4. **Document blockers immediately**:
   ```yaml
   status: blocked
   blockers:
     - description: Need database migration approved before proceeding
       severity: high
       identified_date: 2025-11-03
       assigned_to: database-admin
   ```

   Then **move the file** to `.progress-tracker/blocked/`:
   ```bash
   mv .progress-tracker/active/TASK-XXX.yml .progress-tracker/blocked/
   ```

### When You Finish

1. **Update status to needs_review**:
   ```yaml
   status: needs_review
   completed_date: 2025-11-04
   ```

2. **Verify all acceptance criteria are completed**:
   ```yaml
   acceptance_criteria:
     - criterion: All endpoints implemented
       status: completed
       verified_date: 2025-11-04
     - criterion: Tests pass with 90%+ coverage
       status: completed
       verified_date: 2025-11-04
     - criterion: Security review passed
       status: completed
       verified_date: 2025-11-04
   ```

3. **Complete your verification checklist**:
   ```yaml
   verification_checklist:
     code_quality:
       - criterion: TypeScript types properly defined
         status: completed
       - criterion: Error handling implemented
         status: completed
   ```

4. **Notify Task Completion Agent**:
   In your response to the user, mention:
   ```
   Task BE-011 is complete and ready for verification by Task Completion Agent.
   ```

### If You're Blocked

1. **Update status immediately**:
   ```yaml
   status: blocked
   ```

2. **Document the blocker clearly**:
   ```yaml
   blockers:
     - description: Waiting for AWS KMS key provisioning (Ticket #12345)
       severity: high
       identified_date: 2025-11-03
       assigned_to: DevOps Engineer
       resolution_target: 2025-11-05
       notes: Cannot implement encryption without this
   ```

3. **Move task to blocked directory**:
   ```bash
   mv .progress-tracker/active/TASK-XXX.yml .progress-tracker/blocked/
   ```

4. **Notify Task Orchestrator**:
   Report the blocker so it can be tracked and escalated if needed.

## Agent-Specific Guidelines

### Task Orchestrator

**Your special responsibilities**:

1. **Create new tasks from user requests**:
   - Use templates from `.progress-tracker/templates/`
   - Assign unique task IDs
   - Set clear acceptance criteria
   - Identify dependencies
   - Assign to appropriate agent

2. **Monitor all active tasks**:
   ```bash
   # Check status of all tasks
   for file in .progress-tracker/active/*.yml; do
     echo "=== $(basename $file) ==="
     grep "status:" $file
     grep "assigned_agent:" $file
   done
   ```

3. **Update sprint status daily**:
   Edit `.progress-tracker/current-sprint.json`:
   ```json
   {
     "progress": {
       "total_tasks": 15,
       "completed": 8,
       "in_progress": 4,
       "pending": 2,
       "blocked": 1,
       "completion_percentage": 53
     }
   }
   ```

4. **Update project status**:
   Edit `.progress-tracker/project-status.md` with current state.

5. **Resolve blockers**:
   - Check `.progress-tracker/blocked/` regularly
   - Work to unblock tasks
   - When unblocked, move back to `active/`

### Task Completion Agent

**Your special responsibilities**:

1. **Monitor for tasks needing review**:
   ```bash
   grep "status: needs_review" .progress-tracker/active/*.yml
   ```

2. **Verify task completion**:
   - Check all acceptance criteria
   - Run verification checklist
   - Review actual deliverables
   - Test the implementation

3. **Either approve or reject**:

   **If complete**:
   ```yaml
   status: completed
   verified_by: task-completion-agent
   verified_date: 2025-11-05
   ```

   Then move to completed:
   ```bash
   mv .progress-tracker/active/TASK-XXX.yml .progress-tracker/completed/
   ```

   **If incomplete**:
   ```yaml
   status: in_progress
   notes:
     - "2025-11-05: Verification failed - see issues below"

   verification_issues:
     - Test coverage is only 70%, need 90%
     - API documentation missing
     - Security review not completed
   ```

4. **Generate completion report**:
   Create a summary of what was verified and the outcome.

### Architecture Lead

**Your task interactions**:

1. **Create `ARCH-XXX` tasks** for design work
2. **Review architecture in other tasks**:
   - Look for architecture-related acceptance criteria
   - Add notes about architectural decisions
   - Sign off when architecture is sound

3. **Update task files with design decisions**:
   ```yaml
   notes:
     - "2025-11-03: Approved REST API design with versioning"
     - "2025-11-03: Recommend using repository pattern for data access"
   ```

### Frontend Expert, Backend Expert, etc.

**Your task interactions**:

1. **Work on your assigned task type** (FE-XXX, BE-XXX, etc.)
2. **Update progress regularly**
3. **Mark acceptance criteria complete** as you finish them
4. **Request reviews** from other agents when needed:
   ```yaml
   notes:
     - "2025-11-04: Ready for security review by security-compliance-expert"
   ```

### Security & Compliance Expert

**Your special responsibilities**:

1. **Create `SEC-XXX` tasks** for security work
2. **Review security criteria** in ALL tasks:
   ```yaml
   acceptance_criteria:
     - criterion: Security review passed
       status: completed
       verified_by: security-compliance-expert
       verified_date: 2025-11-04
       notes: "Verified authentication, authorization, input validation, audit logging"
   ```

3. **Sign off on security checklist items**:
   ```yaml
   verification_checklist:
     security:
       - criterion: Authentication required
         status: completed
         verified_by: security-compliance-expert
       - criterion: SQL injection prevention
         status: completed
         verified_by: security-compliance-expert
   ```

## Common Workflows

### Workflow 1: Simple Task

1. **Task Orchestrator** creates task file
2. **Specialist Agent** (e.g., Backend Expert):
   - Updates status to `in_progress`
   - Does the work
   - Updates progress notes
   - Marks acceptance criteria complete
   - Sets status to `needs_review`
3. **Task Completion Agent**:
   - Verifies completion
   - Moves to `completed/`
   - Updates sprint status

### Workflow 2: Task with Dependencies

1. **Task Orchestrator** creates multiple tasks:
   - `BE-010-api.yml` (no dependencies)
   - `FE-011-ui.yml` (depends on BE-010)

2. **Backend Expert**:
   - Completes BE-010
   - Notifies Frontend Expert

3. **Frontend Expert**:
   - Checks that BE-010 is complete
   - Starts FE-011
   - References BE-010 for API contracts

4. **Task Completion Agent**:
   - Verifies both tasks
   - Moves to completed

### Workflow 3: Blocked Task

1. **Backend Expert** hits blocker:
   - Can't proceed without database migration
   - Updates task:
     ```yaml
     status: blocked
     blockers:
       - description: Database migration needs DBA approval
         severity: high
         assigned_to: database-admin
     ```
   - Moves to `.progress-tracker/blocked/`

2. **Task Orchestrator**:
   - Sees blocked task
   - Escalates to DBA
   - Tracks blocker resolution

3. **DevOps Engineer** (or DBA):
   - Resolves blocker
   - Updates task:
     ```yaml
     status: pending
     blockers: []
     notes:
       - "2025-11-04: Migration approved and executed"
     ```
   - Moves back to `.progress-tracker/active/`

4. **Backend Expert**:
   - Resumes work
   - Updates status to `in_progress`

### Workflow 4: Multi-Agent Task

1. **Task Orchestrator** creates task with multiple agents:
   ```yaml
   agents_involved:
     - backend-expert       # Implementation
     - testing-specialist   # Tests
     - security-compliance-expert  # Security review
     - task-completion-agent  # Verification
   ```

2. **Backend Expert**:
   - Implements feature
   - Marks implementation criteria complete
   - Notifies Testing Specialist

3. **Testing Specialist**:
   - Adds tests
   - Marks testing criteria complete
   - Notifies Security Expert

4. **Security & Compliance Expert**:
   - Reviews security
   - Marks security criteria complete
   - Notifies Task Completion Agent

5. **Task Completion Agent**:
   - Verifies all criteria
   - Moves to completed

## File Naming Best Practices

```
[PREFIX]-[NUMBER]-[short-kebab-case-description].yml

Good examples:
- BE-001-budget-allocation-api.yml
- FE-002-dashboard-ui.yml
- TEST-003-integration-tests.yml
- SEC-004-mfa-implementation.yml
- ARCH-005-database-schema-design.yml
- DEVOPS-006-ci-cd-pipeline.yml
- PPBE-007-fiscal-year-logic.yml

Bad examples:
- task1.yml (no prefix, not descriptive)
- my-task.yml (no number, not specific)
- BE-create-api.yml (no number)
```

## Task ID Numbering

Keep a counter for each prefix:

```
BE-001, BE-002, BE-003, ...   (Backend tasks)
FE-001, FE-002, FE-003, ...   (Frontend tasks)
TEST-001, TEST-002, ...       (Testing tasks)
SEC-001, SEC-002, ...         (Security tasks)
ARCH-001, ARCH-002, ...       (Architecture tasks)
DEVOPS-001, DEVOPS-002, ...   (DevOps tasks)
PPBE-001, PPBE-002, ...       (PPBE domain tasks)
TASK-001, TASK-002, ...       (General tasks)
```

Task Orchestrator maintains the counter to avoid duplicates.

## YAML Format Guidelines

### Always include:
- `task_id`
- `title`
- `status`
- `assigned_agent`
- `created_date`
- `description`
- At least one `acceptance_criteria`

### Use consistent date format:
```yaml
created_date: 2025-11-03
started_date: 2025-11-03
target_completion: 2025-11-06
completed_date: 2025-11-06
verified_date: 2025-11-06
```

### Use consistent status values:
```yaml
status: pending | in_progress | needs_review | completed | blocked
```

### Document notes with timestamps:
```yaml
notes:
  - "2025-11-03 09:00: Starting implementation"
  - "2025-11-03 15:30: Completed API endpoints"
```

## Integration with TodoWrite

The progress tracker complements TodoWrite:

**TodoWrite**:
- In-conversation task tracking
- Real-time updates during work
- Visible to user in current session

**Progress Tracker**:
- Persistent across sessions
- Visible to all agents
- Structured with templates
- Includes verification checklists

**Use both**:
1. Use TodoWrite when working with user in conversation
2. Create/update progress tracker files for persistence
3. Keep them synchronized

Example:
```
User: "Add budget approval feature"

Agent response:
- Uses TodoWrite to show immediate task breakdown
- Creates .progress-tracker/active/BE-015-approval-api.yml
- Both systems now track the same work
```

## Troubleshooting

### "I can't find my task file"

Check all directories:
```bash
find .progress-tracker -name "*.yml" | grep "YOUR-TASK-ID"
```

### "Task is in wrong status"

Update it:
```yaml
status: correct_status
notes:
  - "2025-11-03: Corrected status from X to Y"
```

### "Dependencies are not clear"

Add explicit dependencies:
```yaml
dependencies:
  - BE-010  # API must exist before UI can consume it
  - ARCH-005  # Architecture must be approved
```

### "Too many agents on one task"

This is normal for complex tasks. Each agent updates their part:
```yaml
agents_involved:
  - backend-expert: Implementation
  - testing-specialist: Test coverage
  - security-compliance-expert: Security review
  - task-completion-agent: Final verification
```

## Summary Checklist

**When starting a task**:
- [ ] Read complete task file
- [ ] Check dependencies are met
- [ ] Update status to `in_progress`
- [ ] Add `started_date`

**While working**:
- [ ] Add progress notes regularly
- [ ] Mark acceptance criteria complete
- [ ] Update `related_files`
- [ ] Document any blockers

**When finished**:
- [ ] Update status to `needs_review`
- [ ] Add `completed_date`
- [ ] Verify all criteria complete
- [ ] Complete verification checklist
- [ ] Notify Task Completion Agent

**If blocked**:
- [ ] Update status to `blocked`
- [ ] Document blocker clearly
- [ ] Move to `.progress-tracker/blocked/`
- [ ] Notify Task Orchestrator

---

**Remember**: The progress tracker is only useful if everyone keeps it updated. Update your task files as you work, not just at the end!
