importScripts("https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js");

interface Pyodide {
  loadPackage: (packages: string[]) => Promise<void>;
  pyimport: (pkg: string) => micropip;
  runPythonAsync: (code: string, namespace?: any) => Promise<void>;
  version: string;
  FS: {
    readFile: (name: string, options: unknown) => void;
    writeFile: (name: string, data: string, options: unknown) => void;
    mkdir: (name: string) => void;
    rmdir: (name: string) => void;
  };
  globals: any;
  isPyProxy: (value: unknown) => boolean;
  registerJsModule: any;
}

interface micropip {
  install: (packages: string[]) => Promise<void>;
}

declare global {
  interface Window {
    loadPyodide: ({
      stdout,
    }: {
      stdout?: (msg: string) => void;
    }) => Promise<Pyodide>;
    pyodide: Pyodide;
  }
}

// Monkey patch console.log to prevent the script from outputting logs
if (self.location.hostname !== "localhost") {
  console.log = () => {};
  console.error = () => {};
}

import { expose } from "comlink";

const solidPyModule = {
  getInput: (id: string, prompt: string) => {
    const request = new XMLHttpRequest();
    // Synchronous request to be intercepted by service worker
    request.open(
      "GET",
      `/solid-py-get-input/?id=${id}&prompt=${prompt}`,
      false
    );
    request.send(null);
    return request.responseText;
  },
};

const python = {
  async init(
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
    packages: string[][]
  ) {
    self.pyodide = await self.loadPyodide({
      stdout,
    });
    await self.pyodide.loadPackage(["pyodide-http"]);
    if (packages.length === 0) {
      throw new Error("python.init: 0 packages found!");
    }
    const firstPackage = packages[0];
    if (!firstPackage) {
      throw new Error("python.init: first package nonexistent!");
    }
    if (firstPackage.length > 0) {
      await self.pyodide.loadPackage(firstPackage);
    }
    const secondPackage = packages[1];
    if (!secondPackage) {
      throw new Error("python.init: second package nonexistent!");
    }
    if (secondPackage.length > 0) {
      await self.pyodide.loadPackage(["micropip"]);
      const micropip = self.pyodide.pyimport("micropip");
      await micropip.install(secondPackage);
    }

    const id = self.crypto.randomUUID();
    const version = self.pyodide.version;

    self.pyodide.registerJsModule("solid_py", solidPyModule);
    const initCode = `
import pyodide_http
pyodide_http.patch_all()
`;
    await self.pyodide.runPythonAsync(initCode);
    const patchInputCode = `
import sys, builtins
import solid_py
__prompt_str__ = ""
def get_input(prompt=""):
    global __prompt_str__
    __prompt_str__ = prompt
    print(prompt, end="")
    s = solid_py.getInput("${id}", prompt)
    print(s)
    return s
builtins.input = get_input
sys.stdin.readline = lambda: solid_py.getInput("${id}", __prompt_str__)
`;
    await self.pyodide.runPythonAsync(patchInputCode);

    onLoad({ id, version });
  },
  async run(code: string) {
    await self.pyodide.runPythonAsync(code);
  },
  readFile(name: string) {
    return self.pyodide.FS.readFile(name, { encoding: "utf8" });
  },
  writeFile(name: string, data: string) {
    return self.pyodide.FS.writeFile(name, data, { encoding: "utf8" });
  },
  mkdir(name: string) {
    self.pyodide.FS.mkdir(name);
  },
  rmdir(name: string) {
    self.pyodide.FS.rmdir(name);
  },
};

expose(python);
