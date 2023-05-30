'use client';

import AddTaskForm from '@/components/AddTaskForm';

export default function Tasks() {
  return <AddTaskForm onAddTask={(task) => console.log(task)} />;
}
