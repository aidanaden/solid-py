export enum ConsoleState {
  "complete",
  "incomplete",
  "syntax-error",
}

export type Packages = {
  official?: string[];
  micropip?: string[];
};

export type Runner = {
  init: (
    stdout: (msg: string) => void,
    onLoad: ({
      id,
      version,
      banner,
    }: {
      id: string;
      version: string;
      banner?: string;
    }) => void,
    packages?: string[][]
  ) => Promise<void>;
  interruptExecution: () => void;
  readFile: (name: string) => void;
  writeFile: (name: string, data: string) => void;
  mkdir: (name: string) => void;
  rmdir: (name: string) => void;
};

export type PythonRunner = Runner & {
  run: (code: string) => Promise<void>;
};

export type PythonConsoleRunner = Runner & {
  run: (code: string) => Promise<{ state: string; error?: string }>;
};
