import { Remote, proxy, wrap } from "comlink";
import {
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  onMount,
} from "solid-js";

import {
  suppressedMessages,
  usePythonProvider,
} from "../providers/python-provider";
import { Packages, PythonRunner } from "../types";
import useFilesystem from "./use-fs";

interface UsePythonProps {
  packages?: Packages;
}

export default function usePython(props: UsePythonProps) {
  const [runnerId, setRunnerId] = createSignal<string>();
  const [isLoading, setIsLoading] = createSignal(false);
  const [isRunning, setIsRunning] = createSignal(false);
  const [output, setOutput] = createSignal<string[]>([]);
  const [stdout, setStdout] = createSignal("");
  const [stderr, setStderr] = createSignal("");
  const [pendingCode, setPendingCode] = createSignal<string | undefined>();
  const [hasRun, setHasRun] = createSignal(false);

  const {
    packages: globalPackages,
    timeout,
    lazy,
    terminateOnCompletion,
    sendInput,
    workerAwaitingInputIds,
    getPrompt,
  } = usePythonProvider();

  const [workerRef, setWorkerRef] = createSignal<Worker | undefined>();
  let runnerRef: Remote<PythonRunner> | undefined;

  const {
    readFile,
    writeFile,
    mkdir,
    rmdir,
    watchModules,
    unwatchModules,
    watchedModules,
  } = useFilesystem({ runner: runnerRef });

  const createWorker = () => {
    const worker = new Worker(
      import.meta.env.DEV
        ? new URL("../workers/python-worker", import.meta.url)
        : new URL("../python-worker", import.meta.url)
    );
    setWorkerRef(worker);
  };

  onMount(() => {
    if (!lazy()) {
      // Spawn worker on mount
      createWorker();
    }

    // Cleanup worker on unmount
    onCleanup(cleanup);
  });

  const allPackages = createMemo(() => {
    const official = [
      ...new Set([
        ...(globalPackages().official ?? []),
        ...(props.packages?.official ?? []),
      ]),
    ];
    const micropip = [
      ...new Set([
        ...(globalPackages().micropip ?? []),
        ...(props.packages?.micropip ?? []),
      ]),
    ];
    return [official, micropip];
  });

  const isReady = createMemo(() => !isLoading() && !!runnerId());

  createEffect(
    on(workerRef, async (worker) => {
      if (worker && !isReady()) {
        try {
          setIsLoading(true);
          const runner: Remote<PythonRunner> = wrap(worker);
          runnerRef = runner;

          await runner.init(
            proxy((msg: string) => {
              // Suppress messages that are not useful for the user
              if (suppressedMessages.includes(msg)) {
                return;
              }
              setOutput((prev) => [...prev, msg]);
            }),
            proxy(({ id, version }) => {
              setRunnerId(id);
              console.debug("Loaded pyodide version:", version);
            }),
            allPackages()
          );
        } catch (error) {
          console.error("Error loading Pyodide:", error);
        } finally {
          setIsLoading(false);
        }
      }
    })
  );

  // Immediately set stdout upon receiving new input
  createEffect(
    on(output, (out) => {
      if (out.length > 0) {
        setStdout(out.join("\n"));
      }
    })
  );

  // React to ready state and run delayed code if pending
  createEffect(
    on([pendingCode, isReady], async ([code, ready]) => {
      if (code && ready) {
        await runPython(code);
        setPendingCode(undefined);
      }
    })
  );

  // React to run completion and run cleanup if worker should terminate on completion
  createEffect(
    on(
      [terminateOnCompletion, hasRun, isRunning],
      ([terminate, hasRun, isRunning]) => {
        if (terminate && hasRun && !isRunning) {
          cleanup();
          setIsRunning(false);
          setRunnerId(undefined);
        }
      }
    )
  );

  const pythonRunnerCode = `
import sys
  
sys.tracebacklimit = 0
  
def run(code, preamble=''):
    globals_ = {}
    try:
        exec(preamble, globals_)
        code = compile(code, 'code', 'exec')
        exec(code, globals_)
    except Exception:
        type_, value, tracebac = sys.exc_info()
        tracebac = tracebac.tb_next
        raise value.with_traceback(tracebac)
    finally:
        print()`;

  // prettier-ignore
  const moduleReloadCode = (modules: Set<string>) => `
  import importlib
  import sys
  ${Array.from(modules).map((name) => `
  if """${name}""" in sys.modules:
      importlib.reload(sys.modules["""${name}"""])
  `).join('')}
  del importlib
  del sys
  `

  const runPython = async (code: string, preamble = "") => {
    const ready = isReady();
    // Clear stdout and stderr
    setStdout("");
    setStderr("");

    if (lazy() && !ready) {
      // Spawn worker and set pending code
      createWorker();
      setPendingCode(code);
      return;
    }

    code = `${pythonRunnerCode}\n\nrun(${JSON.stringify(
      code
    )}, ${JSON.stringify(preamble)})`;

    if (!ready) {
      throw new Error("Pyodide is not loaded yet");
    }
    let timeoutTimer;
    try {
      setIsRunning(true);
      setHasRun(true);
      // Clear output
      setOutput([]);
      if (!runnerRef) {
        throw new Error("Pyodide is not loaded yet");
      }
      if (timeout() > 0) {
        timeoutTimer = setTimeout(() => {
          setStdout("");
          setStderr(`Execution timed out. Reached limit of ${timeout()} ms.`);
          interruptExecution();
        }, timeout());
      }
      if (watchedModules().size > 0) {
        await runnerRef.run(moduleReloadCode(watchedModules()));
      }
      await runnerRef.run(code);
    } catch (error: any) {
      setStderr("Traceback (most recent call last):\n" + error.message);
    } finally {
      setIsRunning(false);
      clearTimeout(timeoutTimer);
    }
  };

  const interruptExecution = () => {
    cleanup();
    setIsRunning(false);
    setRunnerId(undefined);
    setOutput([]);

    // Spawn new worker
    createWorker();
  };

  const cleanup = () => {
    const worker = workerRef();
    if (!worker) {
      return;
    }
    console.debug("Terminating worker");
    worker.terminate();
  };

  const isAwaitingInput = createMemo(() => {
    const id = runnerId();
    if (!id) {
      return;
    }
    return workerAwaitingInputIds().includes(id);
  });

  const sendUserInput = (value: string) => {
    const id = runnerId();
    if (!id) {
      console.error("No runner id");
      return;
    }
    sendInput(id, value);
  };

  const prompt = createMemo(() => {
    const id = runnerId();
    if (!id) {
      return "";
    }
    return getPrompt(id);
  });

  return {
    runPython,
    stdout,
    stderr,
    isLoading,
    isReady,
    isRunning,
    interruptExecution,
    readFile,
    writeFile,
    mkdir,
    rmdir,
    watchModules,
    unwatchModules,
    isAwaitingInput,
    sendInput: sendUserInput,
    prompt,
  };
}
