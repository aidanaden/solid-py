import { Remote } from "comlink";
import { createSignal } from "solid-js";

import { Runner } from "../types";

interface UseFilesystemProps {
  runner: Remote<Runner> | undefined;
}

export default function useFilesystem(props: UseFilesystemProps) {
  const [watchedModules, setWatchedModules] = createSignal<Set<string>>(
    new Set()
  );

  const readFile = (name: string) => {
    return props.runner?.readFile(name);
  };

  const writeFile = (name: string, data: string) => {
    return props.runner?.writeFile(name, data);
  };

  const mkdir = (name: string) => {
    return props.runner?.mkdir(name);
  };

  const rmdir = (name: string) => {
    return props.runner?.rmdir(name);
  };

  const watchModules = (moduleNames: string[]) => {
    setWatchedModules((prev) => new Set([...prev, ...moduleNames]));
  };

  const unwatchModules = (moduleNames: string[]) => {
    setWatchedModules(
      (prev) => new Set([...prev].filter((e) => !moduleNames.includes(e)))
    );
  };

  return {
    readFile,
    writeFile,
    mkdir,
    rmdir,
    watchModules,
    unwatchModules,
    watchedModules,
  };
}
