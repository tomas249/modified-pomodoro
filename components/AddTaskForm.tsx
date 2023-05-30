'use client';

import { useForm, SubmitHandler } from 'react-hook-form';

type Inputs = {
  name: string;
  repeat: string;
  repeatType: 'number' | 'letter';
  duration: string;
};

type Task = {
  id: string;
  name: string;
  duration: number;
  repeat: number;
};

export type AddTaskFormProps = {
  onAddTask: (task: Task) => void;
};

export default function AddTaskForm({ onAddTask }: AddTaskFormProps) {
  const { register, handleSubmit } = useForm<Inputs>();

  const onSubmit: SubmitHandler<Inputs> = (data) => {
    const task: Task = {
      id: generateShortUUID(),
      name: data.name,
      duration: parseDuration(data.duration),
      repeat: parseInt(data.repeat),
    };

    onAddTask(task);
  };

  return (
    <form className="flex max-w-sm flex-col space-y-3" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col">
        <div className="flex justify-between px-2 text-xs text-gray-800">
          <label htmlFor="name">Title</label>
          <span>Use $ to include a counter</span>
        </div>
        <input
          id="name"
          className="rounded-md bg-slate-200 px-2 py-1 outline-none"
          placeholder="Task 1.$)"
          {...register('name', { required: true })}
        />
      </div>

      <div className="flex items-center">
        <span className="flex px-2 text-xs text-gray-800">Repeat:</span>
        <input
          className="w-14 rounded-md bg-slate-200 px-2 py-1 outline-none"
          type="number"
          defaultValue={1}
          min={1}
          {...register('repeat', { required: true })}
        />

        <span className="mx-4">|</span>
        <span className="mr-1 flex px-2 pl-0 text-xs text-gray-800">Type:</span>

        <input
          {...register('repeatType')}
          id="type-number"
          className="mr-1"
          type="radio"
          value="number"
        />
        <label htmlFor="type-number">1,2,3</label>

        <input
          {...register('repeatType')}
          id="type-letter"
          className="ml-2 mr-1"
          type="radio"
          value="letter"
        />
        <label htmlFor="type-letter">a,b,c</label>
      </div>

      <div className="flex items-center">
        <span className="flex px-2 text-xs text-gray-800">Duration:</span>
        <input
          className="w-16 rounded-md bg-slate-200 px-2 py-1 outline-none"
          type="text"
          placeholder="1:20"
          {...register('duration', { required: true })}
        />
      </div>

      <div className="flex space-x-1">
        <button
          type="reset"
          className="flex-1 rounded-md bg-slate-200 px-2 py-1 hover:bg-slate-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 rounded-md bg-slate-200 px-2 py-1 hover:bg-slate-300"
        >
          Add
        </button>
      </div>
    </form>
  );
}

function generateShortUUID() {
  return Math.random().toString(36).substring(2, 5);
}

function parseDuration(duration: string) {
  const [hours, minutes] = duration.split(':');
  return parseInt(hours) * 60 + parseInt(minutes);
}
