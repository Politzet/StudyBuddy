export const TASK_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
}

export const TASK_STATUS_OPTIONS = [
  { value: TASK_STATUS.NOT_STARTED, label: 'Not done' },
  { value: TASK_STATUS.IN_PROGRESS, label: 'In Progress' },
  { value: TASK_STATUS.DONE, label: 'Done' },
]

export const TASK_STATUS_SORT_ORDER = {
  [TASK_STATUS.NOT_STARTED]: 0,
  [TASK_STATUS.IN_PROGRESS]: 1,
  [TASK_STATUS.DONE]: 2,
}

export const getTaskStatusLabel = (status) =>
  TASK_STATUS_OPTIONS.find((option) => option.value === status)?.label || 'Not done'
