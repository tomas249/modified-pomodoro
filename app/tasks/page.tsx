'use client';

import { ChangeEvent, useCallback, useMemo, useState } from 'react';
import AddTaskForm from '@/components/AddTaskForm';
import { parseDurationToHHMM, parseDurationToInt, parseDurationToString, toByField } from '@/utils';

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

function getTimeInMin() {
  return new Date().getHours() * 60 + new Date().getMinutes();
}

function* genTaskTime(
  startTime: number,
  tasks: Record<string, Task & { finished?: boolean }>,
  tasksIds: string[],
) {
  let time = startTime;

  for (const id of tasksIds) {
    const task = tasks[id];
    console.log('yielding');
    if (task.finished) {
      yield null;
    } else {
      const nextTime = time + task.duration;
      yield `${parseDurationToHHMM(time)} - ${parseDurationToHHMM(nextTime)}`;
      time = nextTime;
    }
  }
}

function calculateTaskStatus(
  startTime: number,
  tasks: (Task & { status?: string; finished?: boolean })[],
) {
  let time = startTime;
  const newTasks = tasks.map((task) => {
    if (task.finished) {
      task.status = '<>';
    } else {
      const nextTime = time + task.duration;
      task.status = `${parseDurationToHHMM(time)} - ${parseDurationToHHMM(nextTime)}`;
      time = nextTime;
    }
    return task;
  });
  console.log('calculate', tasks, newTasks);

  return newTasks;
}

function recalculateTaskStatus(
  startTime: number,
  tasks: Record<string, Task & { status?: string; finished?: boolean }>,
  tasksIds: string[],
) {
  let time = startTime;
  const newTasks = { ...tasks };
  console.log('recalculate', newTasks);
  for (const id of tasksIds) {
    const task = newTasks[id];
    if (task.finished) {
      task.status = '<>';
    } else {
      const nextTime = time + task.duration;
      task.status = `${parseDurationToHHMM(time)} - ${parseDurationToHHMM(nextTime)}`;
      time = nextTime;
    }
  }

  return newTasks;
}

export default function Tasks() {
  const [schemas, setSchemas] = useState<Schemas>([]);
  const [tasks, setTasks] = useState<
    Record<
      string,
      {
        id: string;
        listId: string;
        name: string;
        duration: number;
        finished?: boolean;
        status?: string;
      }
    >
  >({});
  const tasksIds = useMemo(
    () => schemas.flatMap((schema) => schema.tasks.map((task) => task.id)),
    [schemas],
  );
  const [startTimeValue, setStartTimeValue] = useState(parseDurationToHHMM(getTimeInMin()));
  const [startTime, setStartTime] = useState(0);
  const [lastSavedTime, setLastSavedTime] = useState(0);

  // function isFirstUnfinishedTask(id: string, index: number) {
  //   return (
  //     (index === 0 && !tasks[id].finished) ||
  //     (index > 0 && tasks[tasksIds[index - 1]].finished && !tasks[id].finished)
  //   );
  // }

  // function isLastFinishedTask(id: string, index: number) {
  //   return (
  //     index < tasksIds.length - 1 && !tasks[tasksIds[index + 1]].finished && tasks[id].finished
  //   );
  // }

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
          setTasks((prev) => ({
            ...prev,
            ...toByField(calculateTaskStatus(startTime, g.tasksExtended), 'id'),
          }));
        }}
      />
      <hr className="my-4" />

      <div className="flex items-center space-x-2">
        <button
          className="rounded-md bg-slate-200 px-2 py-1 hover:bg-slate-300"
          onClick={() => {
            localStorage.setItem('schemas', JSON.stringify(schemas));
            localStorage.setItem('tasks', JSON.stringify(tasks));

            const lastSaved = getTimeInMin();
            localStorage.setItem('lastSavedTime', JSON.stringify(lastSaved));
            setLastSavedTime(lastSaved);
          }}
        >
          Save
        </button>
        <button
          className="rounded-md bg-slate-200 px-2 py-1 hover:bg-slate-300"
          onClick={() => {
            const schemas = JSON.parse(localStorage.getItem('schemas') || '[]');
            const tasks = JSON.parse(localStorage.getItem('tasks') || '{}');
            const lastSavedTime = JSON.parse(localStorage.getItem('lastSavedTime') || '0');

            setSchemas(schemas);
            setTasks(tasks);
            setLastSavedTime(lastSavedTime);
          }}
        >
          Load
        </button>
        <span className="text-slate-600">Last saved at: {parseDurationToHHMM(lastSavedTime)}</span>
      </div>

      <hr className="my-4" />

      <div className="flex items-center space-x-2">
        <span className="flex text-xs text-gray-800">Start next task at:</span>
        <input
          className="w-20 rounded-md bg-slate-200 px-2 py-1 outline-none"
          type="string"
          value={startTimeValue}
          onChange={(e) => setStartTimeValue(e.target.value)}
        />
        <button
          className="rounded-md bg-slate-200 px-2 py-1 hover:bg-slate-300"
          onClick={() => {
            const newStartTime = parseDurationToInt(startTimeValue);
            setStartTime(newStartTime);
            setTasks((prev) => recalculateTaskStatus(newStartTime, prev, tasksIds));
          }}
        >
          Save
        </button>
        <span className="text-slate-600">{parseDurationToHHMM(startTime)}</span>
      </div>

      <hr className="my-4" />
      <div className="flex space-x-2">
        {/* Expanded */}
        <div className="flex w-full flex-col space-y-2">
          {tasksIds.map((id, index) => (
            <div
              key={id}
              className={`flex items-center rounded-md px-4 py-2 ${
                tasks[id].finished ? 'bg-gray-500' : 'bg-slate-200'
              }`}
            >
              <span>
                {tasks[id].name} ({parseDurationToString(tasks[id].duration)})
              </span>
              {tasks[id].finished && (
                <button
                  className="ml-2 rounded-md bg-red-200 px-2 py-1 hover:bg-red-300"
                  onClick={() => {
                    setTasks((prev) => {
                      const newTasks = { ...prev, [id]: { ...prev[id], finished: false } };
                      return recalculateTaskStatus(startTime, newTasks, tasksIds);
                    });
                  }}
                >
                  Undo
                </button>
              )}
              {!tasks[id].finished && (
                <button
                  className="ml-2 rounded-md bg-green-200 px-2 py-1 hover:bg-green-300"
                  onClick={() => {
                    setTasks((prev) => {
                      const newTasks = { ...prev, [id]: { ...prev[id], finished: true } };
                      return recalculateTaskStatus(startTime, newTasks, tasksIds);
                    });
                  }}
                >
                  Finish
                </button>
              )}
              <span className="ml-auto">{tasks[id].status || 'ERROR'}</span>
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
                      let newTasks = { ...prev };
                      schema.tasks.forEach((task) => {
                        delete newTasks[task.id];
                      });

                      newTasks = recalculateTaskStatus(startTime, newTasks, tasksIds);

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
                      setTasks((prev) => {
                        const newTasks = { ...prev, [task.id]: task };
                        return recalculateTaskStatus(startTime, newTasks, tasksIds);
                      });
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
