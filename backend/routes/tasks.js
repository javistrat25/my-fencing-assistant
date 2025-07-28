import express from 'express';

const router = express.Router();
let tasks = [];
let nextId = 1;

// GET /api/tasks - get all tasks
router.get('/', (req, res) => {
  res.json({ tasks });
});

// POST /api/tasks - create a new task
router.post('/', (req, res) => {
  const { title, description, leadId, status = 'pending' } = req.body;
  const newTask = { id: nextId++, title, description, leadId, status };
  tasks.push(newTask);
  res.status(201).json({ task: newTask });
});

// PATCH /api/tasks/:id - update a task
router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const task = tasks.find(t => t.id === parseInt(id));
  if (!task) return res.status(404).json({ error: 'Task not found' });
  Object.assign(task, updates);
  res.json({ task });
});

// DELETE /api/tasks/:id - delete a task
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const index = tasks.findIndex(t => t.id === parseInt(id));
  if (index === -1) return res.status(404).json({ error: 'Task not found' });
  tasks.splice(index, 1);
  res.status(204).end();
});

export default router; 