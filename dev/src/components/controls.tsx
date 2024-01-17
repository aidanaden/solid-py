import clsx from "clsx";
import { createMemo, For, Show } from "solid-js";

interface ControlProps {
  items: {
    label: string;
    // icon: any;
    onClick: () => void;
    disabled?: boolean;
    hidden?: boolean;
  }[];
  isAwaitingInput?: boolean;
}

export default function Controls(props: ControlProps) {
  const visibleItems = createMemo(() =>
    props.items.filter((item) => !item.hidden)
  );

  return (
    <div class="pointer-events-none z-10 -mb-16 flex justify-end p-2">
      <div class="pointer-events-auto space-x-2 rounded-md bg-white p-1 opacity-80 shadow-md hover:opacity-100">
        <Show when={props.isAwaitingInput}>
          <div class="inline-flex items-center rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold leading-6 text-white shadow">
            <svg
              class="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Awaiting input...</span>
          </div>
        </Show>
        <span class="isolate inline-flex rounded-md">
          <For each={visibleItems()}>
            {(item, i) => (
              <button
                type="button"
                onClick={item.onClick}
                disabled={item.disabled}
                class={clsx(
                  "relative inline-flex items-center border border-none border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 focus:z-10 focus:outline-none focus:ring-0",
                  !item.disabled
                    ? "opacity-75 hover:cursor-pointer hover:bg-gray-50 hover:opacity-100"
                    : "opacity-50 hover:cursor-not-allowed",
                  i() === 0 && "rounded-l-md",
                  i() === visibleItems.length - 1 && "rounded-r-md"
                )}
              >
                {/* <item.icon
                  class="-ml-1 mr-2 h-5 w-5 text-gray-400"
                  aria-hidden="true"
                /> */}
                {item.label}
              </button>
            )}
          </For>
        </span>
      </div>
    </div>
  );
}
