# Progress Tracker System

This directory contains the progress tracking system for the PPBE application. All agents should use this system to coordinate work and track progress.

## Directory Structure

```
.progress-tracker/
├── active/              # Currently active tasks
├── completed/           # Completed tasks (archived)
├── blocked/             # Blocked tasks requiring attention
├── templates/           # Task templates for common work types
├── current-sprint.json  # Current sprint/iteration status
├── project-status.md    # Overall project status dashboard
└── README.md           # This file
```

## How It Works

### Task Lifecycle

```
┌─────────┐
│ PENDING │ → Task created, not started yet
└────┬────┘
     ↓
┌──────────────┐
│ IN_PROGRESS  │ → Agent actively working on task
└──────┬───────┘
       ↓
┌──────────────┐
│ NEEDS_REVIEW │ → Work complete, awaiting verification
└──────┬───────┘
       ↓
┌───────────┐
│ COMPLETED │ → Verified complete, moved to completed/
└───────────┘

Special States:
┌─────────┐
│ BLOCKED │ → Task cannot proceed, moved to blocked/
└─────────┘
```

### File Naming Convention

Task files use the following naming convention:

```
[TASK-ID]-[short-description].yml

Examples:
- TASK-001-implement-budget-api.yml
- TASK-002-create-approval-workflow.yml
- FE-003-budget-dashboard-ui.yml
- SEC-004-implement-mfa.yml
```

### Task ID Prefixes

- `TASK-XXX`: General tasks
- `FE-XXX`: Frontend-specific tasks
- `BE-XXX`: Backend-specific tasks
- `TEST-XXX`: Testing tasks
- `SEC-XXX`: Security tasks
- `ARCH-XXX`: Architecture/design tasks
- `DEVOPS-XXX`: DevOps/infrastructure tasks
- `PPBE-XXX`: PPBE domain logic tasks

## Task File Format

Every task must follow this YAML format:

```yaml
task_id: TASK-001
title: Short descriptive title
status: pending|in_progress|needs_review|completed|blocked
priority: low|medium|high|critical
assigned_agent: agent-name
created_date: YYYY-MM-DD
started_date: YYYY-MM-DD
target_completion: YYYY-MM-DD
completed_date: YYYY-MM-DD

description: |
  Detailed description of what needs to be done.
  Can be multiple lines.

acceptance_criteria:
  - criterion: Specific, measurable outcome
    status: pending|in_progress|completed
    verified_by: agent-name
    verified_date: YYYY-MM-DD
    notes: Optional notes

dependencies:
  - TASK-000  # Must complete before this task

related_files:
  - path/to/file.ts
  - path/to/another/file.ts

agents_involved:
  - agent-name-1
  - agent-name-2

blockers:
  - description: What's blocking progress
    severity: low|medium|high|critical
    identified_date: YYYY-MM-DD
    assigned_to: person-or-team
    resolution_target: YYYY-MM-DD

notes:
  - "YYYY-MM-DD: Note about progress or decisions"

verification_checklist:
  code_quality:
    - criterion: Specific check
      status: pending|completed|not_applicable

  testing:
    - criterion: Specific test requirement
      status: pending|completed|not_applicable

  documentation:
    - criterion: Documentation requirement
      status: pending|completed|not_applicable

  compliance:
    - criterion: Compliance requirement
      status: pending|completed|not_applicable
```

## Agent Responsibilities

### All Agents

**When starting a task**:
1. Check `.progress-tracker/active/` for your assigned tasks
2. Update task status to `in_progress`
3. Add `started_date`
4. Add initial notes about approach

**While working**:
1. Update task file with progress notes
2. Mark acceptance criteria as completed when done
3. Update `related_files` as you create/modify files
4. If blocked, move task to `blocked/` and document blocker

**When finished**:
1. Update status to `needs_review`
2. Mark all acceptance criteria as completed
3. Complete verification checklist
4. Notify Task Completion Agent

### Task Orchestrator

1. **Create tasks**: Generate task files from user requests
2. **Assign tasks**: Delegate to appropriate specialist agents
3. **Monitor progress**: Check task status regularly
4. **Resolve blockers**: Work with agents to unblock tasks
5. **Update status**: Keep `current-sprint.json` and `project-status.md` updated

### Task Completion Agent

1. **Review tasks**: When status is `needs_review`
2. **Verify completion**: Check all acceptance criteria
3. **Run verification**: Execute verification checklist
4. **Approve or reject**: Either complete task or send back
5. **Update tracking**: Move completed tasks to `completed/`
6. **Generate reports**: Create completion reports

### Specialist Agents

**Architecture Lead**:
- Creates `ARCH-XXX` tasks
- Reviews architectural decisions
- Validates technical design tasks

**Frontend Expert**:
- Works on `FE-XXX` tasks
- Verifies UI/accessibility criteria
- Reviews frontend deliverables

**Backend Expert**:
- Works on `BE-XXX` tasks
- Implements API and business logic
- Reviews backend deliverables

**Testing Specialist**:
- Creates and works on `TEST-XXX` tasks
- Verifies test coverage criteria
- Reviews testing deliverables

**Security & Compliance Expert**:
- Creates and works on `SEC-XXX` tasks
- Reviews all tasks for security
- Signs off on compliance criteria

**PPBE Domain Expert**:
- Creates and works on `PPBE-XXX` tasks
- Verifies business logic correctness
- Reviews domain model implementations

**DevOps Engineer**:
- Creates and works on `DEVOPS-XXX` tasks
- Manages infrastructure tasks
- Reviews deployment and CI/CD

## Current Sprint Status

The `current-sprint.json` file tracks the current iteration:

```json
{
  "sprint_id": "SPRINT-001",
  "name": "Sprint name/goal",
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD",
  "status": "planning|active|completed",
  "progress": {
    "total_tasks": 15,
    "completed": 5,
    "in_progress": 4,
    "pending": 5,
    "blocked": 1,
    "completion_percentage": 33
  },
  "tasks": [
    {
      "task_id": "TASK-001",
      "status": "completed",
      "completion_date": "YYYY-MM-DD"
    }
  ],
  "velocity": {
    "planned_story_points": 40,
    "completed_story_points": 20,
    "projected_completion": "YYYY-MM-DD"
  },
  "risks": []
}
```

**Updated by**: Task Orchestrator, Task Completion Agent
**Update frequency**: Daily or when task status changes

## Project Status Dashboard

The `project-status.md` file provides a human-readable overview:

- Overall project health
- Current sprint progress
- Completed/In Progress/Pending/Blocked tasks
- Quality metrics
- Risks and issues
- Next milestones

**Updated by**: Task Orchestrator, Task Completion Agent
**Update frequency**: Daily

## Best Practices

### 1. Keep Task Files Updated

Don't let task files become stale. Update them as you work:

```yaml
notes:
  - "2025-11-03 09:00: Started implementation"
  - "2025-11-03 12:00: API endpoints complete, starting tests"
  - "2025-11-03 15:00: Tests at 75% coverage, need to add edge cases"
  - "2025-11-04 10:00: All tests complete, ready for review"
```

### 2. Be Specific in Acceptance Criteria

Bad:
```yaml
acceptance_criteria:
  - criterion: Code works
```

Good:
```yaml
acceptance_criteria:
  - criterion: All CRUD endpoints return correct HTTP status codes
  - criterion: Input validation rejects invalid data with clear error messages
  - criterion: Database transactions rollback on errors
  - criterion: Audit logs capture all state changes
```

### 3. Document Blockers Clearly

Bad:
```yaml
blockers:
  - description: Stuck on something
```

Good:
```yaml
blockers:
  - description: Cannot implement encryption - waiting for KMS key provisioning from AWS
    severity: high
    identified_date: 2025-11-03
    assigned_to: DevOps team
    resolution_target: 2025-11-05
    notes: Ticket #12345 opened with cloud ops team
```

### 4. Track Dependencies

```yaml
dependencies:
  - TASK-000  # Database schema must be complete
  - ARCH-001  # Architecture design must be approved

# If a dependency is not met, task should be blocked
```

### 5. Use Templates

Use templates from `templates/` directory for common task types:
- `backend-api-task.yml`
- `frontend-component-task.yml`
- `testing-task.yml`
- `security-review-task.yml`
- `devops-task.yml`

## Example Workflow

### User Request: "Add budget approval feature"

**1. Task Orchestrator creates task file**:

```yaml
# .progress-tracker/active/TASK-010-budget-approval-workflow.yml
task_id: TASK-010
title: Implement Budget Approval Workflow
status: pending
priority: high
assigned_agent: backend-expert
created_date: 2025-11-03
target_completion: 2025-11-07

description: |
  Implement multi-level approval workflow for budgets including
  submission, review, approval, rejection, and delegation capabilities.

acceptance_criteria:
  - criterion: Approval workflow state machine implemented
    status: pending
  - criterion: API endpoints for approve/reject/delegate created
    status: pending
  - criterion: Email notifications on status changes
    status: pending
  - criterion: Tests with 90%+ coverage
    status: pending
  - criterion: Security review passed
    status: pending

dependencies:
  - TASK-001  # Budget API must exist

agents_involved:
  - backend-expert
  - testing-specialist
  - security-compliance-expert
  - task-completion-agent
```

**2. Backend Expert starts work**:

```yaml
status: in_progress
started_date: 2025-11-03

notes:
  - "2025-11-03: Starting with state machine design"
```

**3. Backend Expert updates progress**:

```yaml
acceptance_criteria:
  - criterion: Approval workflow state machine implemented
    status: completed
    verified_date: 2025-11-04
  - criterion: API endpoints for approve/reject/delegate created
    status: completed
    verified_date: 2025-11-04
  - criterion: Email notifications on status changes
    status: in_progress

notes:
  - "2025-11-03: Starting with state machine design"
  - "2025-11-04: State machine and API endpoints complete"
  - "2025-11-04: Working on email notifications"
```

**4. Backend Expert hits blocker**:

```yaml
status: blocked

blockers:
  - description: No email service configured - need SMTP credentials
    severity: high
    identified_date: 2025-11-04
    assigned_to: DevOps Engineer

# Move file to .progress-tracker/blocked/
```

**5. DevOps resolves blocker**:

```yaml
status: in_progress
blockers: []

notes:
  - "2025-11-05: DevOps configured email service, resuming work"

# Move file back to .progress-tracker/active/
```

**6. Backend Expert completes work**:

```yaml
status: needs_review
completed_date: 2025-11-06

acceptance_criteria:
  - criterion: Approval workflow state machine implemented
    status: completed
  - criterion: API endpoints for approve/reject/delegate created
    status: completed
  - criterion: Email notifications on status changes
    status: completed
  - criterion: Tests with 92% coverage
    status: completed
  - criterion: Security review passed
    status: pending
```

**7. Task Completion Agent verifies**:

```yaml
status: completed
verified_by: task-completion-agent
verified_date: 2025-11-07

verification_checklist:
  code_quality:
    - criterion: TypeScript types properly defined
      status: completed
    - criterion: Error handling implemented
      status: completed

  testing:
    - criterion: Unit tests pass
      status: completed
    - criterion: Integration tests pass
      status: completed
    - criterion: Coverage goals met (92%)
      status: completed

  compliance:
    - criterion: Security review passed
      status: completed

# Move file to .progress-tracker/completed/
```

## Integration with TodoWrite Tool

The TodoWrite tool in Claude Code provides real-time task tracking during conversations. The progress tracker system complements this:

**TodoWrite**: Real-time, in-conversation task tracking
**Progress Tracker**: Persistent, cross-session project tracking

Agents should:
1. Use TodoWrite for immediate task breakdown in conversations
2. Create progress tracker files for persistent tracking
3. Update both systems to maintain consistency

## Reporting

### Daily Status Update

Generate daily reports:

```bash
# Count tasks by status
Active: $(ls -1 .progress-tracker/active | wc -l)
Completed: $(ls -1 .progress-tracker/completed | wc -l)
Blocked: $(ls -1 .progress-tracker/blocked | wc -l)
```

### Sprint Burndown

Track completion rate:

```
Day 1:  15 tasks remaining
Day 2:  14 tasks remaining
Day 3:  12 tasks remaining
Day 4:  11 tasks remaining
Day 5:  8 tasks remaining
...
Day 10: 0 tasks remaining (sprint complete)
```

### Quality Metrics

Track across all tasks:
- Average test coverage
- Number of security issues found
- Code review feedback volume
- Rework rate

## Getting Started

### For Task Orchestrator

1. Create first task using a template
2. Initialize `current-sprint.json`
3. Create `project-status.md`
4. Assign task to appropriate agent

### For Specialist Agents

1. Check `.progress-tracker/active/` for your assignments
2. Read task file completely
3. Update status to `in_progress`
4. Work on task, updating progress regularly
5. When complete, set status to `needs_review`

### For Task Completion Agent

1. Monitor `.progress-tracker/active/` for `needs_review` tasks
2. Review acceptance criteria
3. Run verification checklist
4. Either approve (move to `completed/`) or reject (back to `in_progress` with feedback)
5. Update sprint and project status

## Questions?

See `.claude/agents/task-completion-agent.md` for detailed verification procedures.
See `.claude/agents/task-orchestrator.md` for task coordination guidelines.

---

**Remember**: This system only works if all agents keep it updated. Update task files as you work, not just at the end!
