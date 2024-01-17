import { Component, createMemo, createSignal, onMount } from "solid-js";
import { PythonProvider } from "solid-py";

import CodeEditor from "./components/code-editor";
import "./main.css";

export const Example: Component = () => {
  const [searchText, setSearchText] = createSignal("and or the");
  const [textToHighlight, setTextToHighlight] = createSignal(
    `When in the Course of human events it becomes necessary for one people to dissolve the political bands which have connected them with another and to assume among the powers of the earth, the separate and equal station to which the Laws of Nature and of Nature's God entitle them, a decent respect to the opinions of mankind requires that they should declare the causes which impel them to the separation.`
  );
  const [activeIdx, setActiveIdx] = createSignal(-1);
  const [caseSensitive, setCaseSensitive] = createSignal(false);
  const searchWords = createMemo(() =>
    searchText()
      .split(/\s/)
      .filter((word) => word)
  );
  onMount(() => {
    navigator.serviceWorker
      .register("/solid-py-sw.ts")
      .then((registration) =>
        console.log(
          "Service Worker registration successful with scope: ",
          registration.scope
        )
      )
      .catch((err) => console.log("Service Worker registration failed: ", err));
  });
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
