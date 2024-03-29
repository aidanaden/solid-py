import { createEffect, createSignal } from "solid-js";

// import { PaperAirplaneIcon } from "@heroicons/react/20/solid";

interface InputProps {
  prompt: string | undefined;
  onSubmit: (value: string) => void;
}

export default function Input(props: InputProps) {
  const [input, setInput] = createSignal("");

  const [inputRef, setInputRef] = createSignal<HTMLInputElement>();

  createEffect(() => {
    const ref = inputRef();
    if (ref) {
      ref.focus();
    }
  });

  return (
    <div class="mt-4 lg:w-1/2">
      <label
        for="input"
        class="block text-sm font-medium text-gray-700 dark:text-gray-100"
      >
        Input
      </label>
      <div class="mt-1 flex rounded-md shadow-sm">
        <div class="relative flex flex-grow items-stretch focus-within:z-10">
          <input
            ref={(e) => setInputRef(e)}
            type="text"
            name="input"
            id="input"
            class="block w-full rounded-l-md border-none bg-neutral-200 px-2 py-1.5 placeholder-gray-400 shadow-sm focus:ring-0 dark:bg-neutral-600 sm:text-sm"
            placeholder={props.prompt}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && props.onSubmit(input())}
          />
        </div>
        <button
          type="button"
          class="relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-none border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:cursor-pointer hover:bg-gray-100 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          onClick={() => props.onSubmit(input())}
        >
          {/* <PaperAirplaneIcon class="h-5 w-5 text-gray-400" aria-hidden="true" /> */}
          <span>Submit</span>
        </button>
      </div>
    </div>
  );
}
