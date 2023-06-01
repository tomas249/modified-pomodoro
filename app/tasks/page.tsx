'use client';

import { ChangeEvent, useMemo, useState } from 'react';
import AddTaskForm from '@/components/AddTaskForm';
import { parseDurationToInt, parseDurationToString, toByField } from '@/utils';

type Task = {
  id: string;
  listId: string;
  name: string;
  duration: number;
};

type Schema = {
  id: string;
  placeholder: string;
  duration: number;
  repeat: number;
  listType: 'letter' | 'number';
  tasks: Task[];
};
type Schemas = Schema[];

export default function Tasks() {
  const [schemas, setSchemas] = useState<Schemas>([]);
  // const tasks = useMemo(() => {
  //   const tasks = schemas.flatMap((schema) => schema.tasks);
  //   return toByField(tasks, 'id');
  // }, [schemas]);
  const [tasks, setTasks] = useState<
    Record<string, { id: string; listId: string; name: string; duration: number }>
  >({});
  const tasksIds = useMemo(
    () => schemas.flatMap((schema) => schema.tasks.map((task) => task.id)),
    [schemas],
  );

  return (
    <div className="flex h-full flex-col">
      <AddTaskForm
        onAddTask={(g) => {
          const schema: Schema = {
            id: g.id,
            placeholder: g.formatter,
            duration: g.duration,
            repeat: g.repeat,
            listType: g.repeatType,
            tasks: g.tasksExtended,
          };

          setSchemas((prev) => [...prev, schema]);
          setTasks((prev) => ({ ...prev, ...toByField(g.tasksExtended, 'id') }));
        }}
      />
      <hr className="my-4" />
      <div className="flex space-x-2">
        {/* Expanded */}
        <div className="flex w-full flex-col space-y-2">
          {tasksIds.map((id, index) => (
            <div
              key={id}
              className="flex flex-col justify-between rounded-md bg-slate-200 px-4 py-2"
            >
              {tasks[id].name} ({parseDurationToString(tasks[id].duration)})
            </div>
          ))}
        </div>

        <div className="h-full border-r-[1px] " />

        {/* Formatter */}
        <div className="flex w-full flex-col space-y-2">
          {schemas.map((schema) => (
            <div
              key={schema.id}
              className="flex flex-col space-y-1"
              // onMouseEnter={() => setSelectedTask(taskGroup.id)}
              // onMouseLeave={() => setSelectedTask(null)}
            >
              <div className="flex flex-col justify-between rounded-md bg-slate-200 px-2 py-1">
                <button
                  className="ml-auto w-20 rounded-md bg-slate-400 px-2 py-0 hover:bg-slate-600"
                  onClick={() => {
                    setSchemas((prev) => prev.filter((s) => s.id !== schema.id));
                    setTasks((prev) => {
                      const newTasks = { ...prev };
                      schema.tasks.forEach((task) => {
                        delete newTasks[task.id];
                      });
                      return newTasks;
                    });
                  }}
                >
                  delete
                </button>
              </div>
              {schema.tasks.map((task) => (
                <div key={task.id} className="ml-8 rounded-md bg-green-200">
                  <EditableTask
                    task={task}
                    onSave={(task) => {
                      console.log(task);
                    }}
                  >
                    <div className="flex flex-col justify-between px-4 py-2">
                      {tasks[task.id].name} ({parseDurationToString(tasks[task.id].duration)})
                    </div>
                  </EditableTask>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EditableTask({
  children,
  task,
  onSave,
}: {
  children: any;
  task: Task;
  onSave: (task: Task) => void;
}) {
  const defaultValues = useMemo(
    () => ({ ...task, duration: parseDurationToString(task.duration) }),
    [task],
  );
  const [newValues, setNewValues] = useState(defaultValues);
  const [isEditing, setIsEditing] = useState(false);

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    setNewValues((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  }

  return (
    <div onClick={() => setIsEditing((prev) => !prev)} className="cursor-pointer">
      {children}
      {isEditing && (
        <div
          className="flex cursor-default flex-col space-y-1 rounded-b-md bg-blue-300 p-2"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex space-x-2">
            <span>Name:</span>
            <input type="text" name="name" value={newValues.name} onChange={onChange} />
          </div>
          <div className="flex space-x-2">
            <span>Duration:</span>
            <input type="text" name="duration" value={newValues.duration} onChange={onChange} />
          </div>
          <div className="flex">
            <button
              className="mr-2 rounded-md bg-red-200 px-2 py-1"
              onClick={(event) => {
                event.stopPropagation();
                console.log('aaa');
                setNewValues(defaultValues);
                setIsEditing(false);
              }}
            >
              Cancel
            </button>
            <button
              className="rounded-md bg-green-200 px-2 py-1"
              onClick={(event) => {
                event.stopPropagation();
                onSave({ ...newValues, duration: parseDurationToInt(newValues.duration) });
                setIsEditing(false);
              }}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
