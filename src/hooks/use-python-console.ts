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
import { ConsoleState, Packages, PythonConsoleRunner } from "../types";
import useFilesystem from "./use-fs";

interface UsePythonProps {
  packages?: Packages;
}

export default function usePythonConsole(props: UsePythonProps) {
  const [runnerId, setRunnerId] = createSignal<string>();
  const [isLoading, setIsLoading] = createSignal(false);
  const [banner, setBanner] = createSignal<string | undefined>();
  const [consoleState, setConsoleState] = createSignal<ConsoleState>();
  const [isRunning, setIsRunning] = createSignal(false);
  const [stdout, setStdout] = createSignal("");
  const [stderr, setStderr] = createSignal("");
  const [pendingCode, setPendingCode] = createSignal<string | undefined>();

  const {
    packages: globalPackages,
    timeout,
    lazy,
    sendInput,
    workerAwaitingInputIds,
    getPrompt,
  } = usePythonProvider();

  const [workerRef, setWorkerRef] = createSignal<Worker | undefined>();
  let runnerRef: Remote<PythonConsoleRunner> | undefined;

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
      new URL("../workers/python-console-worker", import.meta.url)
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
          const runner: Remote<PythonConsoleRunner> = wrap(worker);
          runnerRef = runner;

          await runner.init(
            proxy((msg: string) => {
              // Suppress messages that are not useful for the user
              if (suppressedMessages.includes(msg)) {
                return;
              }
              setStdout(msg);
            }),
            proxy(({ id, version, banner }) => {
              setRunnerId(id);
              setBanner(banner);
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

  // React to ready state and run delayed code if pending
  createEffect(
    on([pendingCode, isReady], async ([code, ready]) => {
      if (code && ready) {
        await runPython(code);
        setPendingCode(undefined);
      }
    })
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
          print()
  `;

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
    // Clear stdout and stderr
    setStdout("");
    setStderr("");
    const ready = isReady();

    if (lazy() && !ready) {
      // Spawn worker and set pending code
      createWorker();
      setPendingCode(code);
      return;
    }

    if (!ready) {
      throw new Error("Pyodide is not loaded yet");
    }
    let timeoutTimer;
    try {
      setIsRunning(true);
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
      const { state, error } = await runnerRef.run(code);
      setConsoleState(ConsoleState[state as keyof typeof ConsoleState]);
      if (error) {
        setStderr(error);
      }
    } catch (error: any) {
      console.error("Error pushing to console:", error);
    } finally {
      setIsRunning(false);
      clearTimeout(timeoutTimer);
    }
  };

  const interruptExecution = () => {
    cleanup();
    setIsRunning(false);
    setRunnerId(undefined);
    setBanner(undefined);
    setConsoleState(undefined);

    // Spawn new worker
    createWorker();
  };

  const cleanup = () => {
    console.debug("Terminating worker");
    workerRef()?.terminate();
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
