async function request(path, options) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || 'The request could not be completed.')
  }

  return response.status === 204 ? null : response.json()
}

export function getTasks(date, options) {
  return request(`/api/tasks?date=${date}`, options)
}

export function createTask(task) {
  return request('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(task),
  })
}

export function updateTask(id, task) {
  return request(`/api/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(task),
  })
}

export function setTaskCompleted(id, completed) {
  return request(`/api/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ completed }),
  })
}

export function deleteTask(id) {
  return request(`/api/tasks/${id}`, { method: 'DELETE' })
}
