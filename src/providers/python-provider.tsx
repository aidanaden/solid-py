import {
  Accessor,
  createContext,
  createMemo,
  createSignal,
  onMount,
  useContext,
  type ParentProps,
} from "solid-js";
import { Packages } from "../types";

type PythonContextProps = {
  packages: Accessor<Packages>;
  timeout: Accessor<number>;
  lazy: Accessor<boolean>;
  terminateOnCompletion: Accessor<boolean>;
  sendInput: (id: string, value: string) => void;
  workerAwaitingInputIds: Accessor<string[]>;
  getPrompt: (id: string) => string | undefined;
};

const PythonContext = createContext<PythonContextProps>();
// {
//     packages: {} as Packages,
//     timeout: 0,
//     lazy: false,
//     terminateOnCompletion: false,
//     sendInput: (_id: string, _value: string) => {},
//     workerAwaitingInputIds: () => [],
//     getPrompt: (_id: string) => undefined,
// }

export const suppressedMessages = ["Python initialization complete"];

export function PythonProvider(props: ParentProps) {
  const [packages, setPackages] = createSignal<Packages>({});
  const [timeout, setTimeout] = createSignal<number>(0);
  const [lazy, setLazy] = createSignal<boolean>(false);
  const [terminateOnCompletion, setTerminateOnCompletion] =
    createSignal<boolean>(false);
  const [workerAwaitingInputIds, setWorkerAwaitingInputIds] = createSignal<
    Set<string>
  >(new Set());
  const workerAwaitingInputIdsArr = createMemo(() =>
    Array.from(workerAwaitingInputIds())
  );
  const [workerAwaitingInputPrompt, setWorkerAwaitingInputPrompt] =
    createSignal<Map<string, string>>(new Map());

  let swRef: ServiceWorker | undefined;

  onMount(() => {
    const registerServiceWorker = async () => {
      if ("serviceWorker" in navigator) {
        try {
          const url = new URL("../workers/service-worker", import.meta.url);
          const registration = await navigator.serviceWorker.register(url);
          if (registration.active) {
            console.debug("Service worker active");
            swRef = registration.active;
          }

          registration.addEventListener("updatefound", () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              console.debug("Installing new service worker");
              installingWorker.addEventListener("statechange", () => {
                if (installingWorker.state === "installed") {
                  console.debug("New service worker installed");
                  swRef = installingWorker;
                }
              });
            }
          });
        } catch (error) {
          console.error(`Registration failed with ${error}`);
        }

        navigator.serviceWorker.onmessage = (event) => {
          if (event.data.type === "SOLID_PY_AWAITING_INPUT") {
            if (event.source instanceof ServiceWorker) {
              // Update the service worker reference, in case the service worker is different to the one we registered
              swRef = event.source;
            }
            setWorkerAwaitingInputIds((prev) =>
              new Set(prev).add(event.data.id)
            );
            setWorkerAwaitingInputPrompt((prev) => {
              const next = new Map(prev);
              next.set(event.data.id, event.data.prompt);
              return next;
            });
          }
        };
      } else {
        console.error("Service workers not supported");
      }
    };
    registerServiceWorker();
  });

  const sendInput = (id: string, value: string): void => {
    if (!workerAwaitingInputIds().has(id)) {
      console.error("Worker not awaiting input");
      return;
    }

    if (!swRef) {
      console.error("No service worker registered");
      return;
    }

    swRef.postMessage({
      type: "SOLID_PY_INPUT",
      id,
      value,
    });

    setWorkerAwaitingInputIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setWorkerAwaitingInputPrompt((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  };

  return (
    <PythonContext.Provider
      value={{
        packages,
        timeout,
        lazy,
        terminateOnCompletion,
        sendInput,
        workerAwaitingInputIds: workerAwaitingInputIdsArr,
        getPrompt: (id: string) => workerAwaitingInputPrompt().get(id),
      }}
    >
      {props.children}
    </PythonContext.Provider>
  );
}

export function usePythonProvider() {
  const ctx = useContext(PythonContext);
  if (!ctx) throw new Error("No python context");
  return ctx;
}
