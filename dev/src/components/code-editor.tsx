import { clientOnly } from "@solidjs/start";
import { Show, createEffect, createSignal } from "solid-js";
import { usePython, type Packages } from "solid-py";
import Controls from "./controls";
import Input from "./input";

// import { ArrowPathIcon, PlayIcon, StopIcon } from "@heroicons/react/24/solid";
// import Controls from "./Controls";
// import Input from "./Input";
// import Loader from "./Loader";

const editorOptions = {
  enableBasicAutocompletion: true,
  enableLiveAutocompletion: true,
  highlightActiveLine: false,
  showPrintMargin: false,
};

interface CodeEditorProps {
  code: string;
  packages?: Packages;
}

const ClientOnlyEditor = clientOnly(() =>
  import("solid-monaco").then((m) => ({ default: m.MonacoEditor }))
);

export default function CodeEditor(props: CodeEditorProps) {
  const [input, setInput] = createSignal(props.code.trimEnd());
  const [showOutput, setShowOutput] = createSignal(false);

  createEffect(() => {
    setInput(props.code.trimEnd());
    setShowOutput(false);
  });

  const {
    runPython,
    stdout,
    stderr,
    isLoading,
    isRunning,
    interruptExecution,
    isAwaitingInput,
    sendInput,
    prompt,
  } = usePython({ packages: props.packages });

  function run() {
    runPython(input());
    setShowOutput(true);
  }

  function stop() {
    interruptExecution();
    setShowOutput(false);
  }

  function reset() {
    setShowOutput(false);
    setInput(props.code.trimEnd());
  }

  return (
    <div class="relative mb-10 flex flex-col">
      <Controls
        items={[
          {
            label: "Run",
            // icon: PlayIcon,
            onClick: run,
            disabled: isLoading() || isRunning(),
            hidden: isRunning(),
          },
          {
            label: "Stop",
            // icon: StopIcon,
            onClick: stop,
            hidden: !isRunning(),
          },
          {
            label: "Reset",
            // icon: ArrowPathIcon,
            onClick: reset,
            disabled: isRunning(),
          },
        ]}
        isAwaitingInput={isAwaitingInput()}
      />

      {/* {isLoading && <Loader />} */}

      <ClientOnlyEditor
        value={input()}
        language="python"
        onMount={(monaco, editor) => {
          //   editor.setScrollMargin(10, 10, 0, 0);
          //   editor.moveCursorTo(0, 0);
        }}
        class="min-h-[7rem] overflow-clip rounded shadow-md"
        loadingState="Loading..."
        onChange={(newValue) => setInput(newValue)}
        // maxLines={Infinity}
        // editorProps={{ $blockScrolling: true }}
        options={{
          tabCompletion: "on",
          selectionHighlight: true,
          smoothScrolling: true,
        }}
      />

      {/* {isAwaitingInput && <Input prompt={prompt} onSubmit={sendInput} />} */}
      <Show when={isAwaitingInput}>
        <Input prompt={prompt()} onSubmit={(v) => sendInput(v)} />
      </Show>

      <Show when={showOutput()}>
        <pre class="mt-4 text-left">
          <code>{stdout()}</code>
          <code class="text-red-500">{stderr()}</code>
        </pre>
      </Show>
    </div>
  );
}
