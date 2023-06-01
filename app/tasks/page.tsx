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

export default function Tasks() {
  const [schemas, setSchemas] = useState<Schemas>([]);
  const [tasks, setTasks] = useState<
    Record<
      string,
      { id: string; listId: string; name: string; duration: number; finished?: boolean }
    >
  >({});
  const tasksIds = useMemo(
    () => schemas.flatMap((schema) => schema.tasks.map((task) => task.id)),
    [schemas],
  );
  const [startTimeValue, setStartTimeValue] = useState(parseDurationToHHMM(getTimeInMin()));
  const [startTime, setStartTime] = useState(0);
  const [lastSavedTime, setLastSavedTime] = useState(0);

  function isFirstUnfinishedTask(id: string, index: number) {
    return (
      (index === 0 && !tasks[id].finished) ||
      (index > 0 && tasks[tasksIds[index - 1]].finished && !tasks[id].finished)
    );
  }

  function isLastFinishedTask(id: string, index: number) {
    return (
      index < tasksIds.length - 1 && !tasks[tasksIds[index + 1]].finished && tasks[id].finished
    );
  }

  const getTaskStatus = useMemo(() => {
    function* gen() {
      let time = startTime;

      for (const id of tasksIds) {
        const task = tasks[id];
        if (task.finished) {
          yield null;
        } else {
          const nextTime = time + task.duration;
          yield `${parseDurationToHHMM(time)} - ${parseDurationToHHMM(nextTime)}`;
          time = nextTime;
        }
      }
    }

    return gen();
  }, [startTime, tasks, tasksIds]);

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
            setStartTime(parseDurationToInt(startTimeValue));
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
              {isLastFinishedTask(id, index) && (
                <button
                  className="ml-2 rounded-md bg-red-200 px-2 py-1 hover:bg-red-300"
                  onClick={() => {
                    setTasks((prev) => ({ ...prev, [id]: { ...prev[id], finished: false } }));
                  }}
                >
                  Undo
                </button>
              )}
              {isFirstUnfinishedTask(id, index) && (
                <button
                  className="ml-2 rounded-md bg-green-200 px-2 py-1 hover:bg-green-300"
                  onClick={() => {
                    setTasks((prev) => ({ ...prev, [id]: { ...prev[id], finished: true } }));
                  }}
                >
                  Finish
                </button>
              )}
              <span className="ml-auto">{getTaskStatus.next().value || '<>'}</span>
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
