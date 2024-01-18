import { PythonProvider } from "solid-py";

import CodeEditor from "~/components/code-editor";

export default function Basic() {
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
}
