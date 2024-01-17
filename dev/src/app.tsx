import { Component } from "solid-js";
import { PythonProvider } from "solid-py";

import CodeEditor from "./components/code-editor";
import "./main.css";

export const Example: Component = () => {
  // onMount(() => {
  //   navigator.serviceWorker
  //     .register("/solid-py-sw.ts")
  //     .then((registration) =>
  //       console.log(
  //         "Service Worker registration successful with scope: ",
  //         registration.scope
  //       )
  //     )
  //     .catch((err) => console.log("Service Worker registration failed: ", err));
  // });
  return (
    <PythonProvider>
      <div class="p-3">
        <CodeEditor
          code={`import random

def shuffle(data):
  for i in range(len(data) - 1):
      j = random.randrange(i, len(data))
      data[i], data[j] = data[j], data[i]


data = [0, 1, 2, 3, 4, 5]
shuffle(data)
print(data)`}
        />
      </div>
    </PythonProvider>
  );
};

export default Example;
