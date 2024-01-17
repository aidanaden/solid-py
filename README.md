<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=solid-py&background=tiles&project=%20" alt="solid-py">
</p>

# solid-py

>

[![size](https://img.shields.io/bundlephobia/minzip/solid-py?style=for-the-badge)](https://bundlephobia.com/package/solid-py)
[![size](https://img.shields.io/npm/v/solid-py?style=for-the-badge)](https://www.npmjs.com/package/solid-py)
![npm](https://img.shields.io/npm/dw/solid-py?style=for-the-badge)
[![pnpm](https://img.shields.io/badge/maintained%20with-pnpm-cc00ff.svg?style=for-the-badge&logo=pnpm)](https://pnpm.io/)

[download-image]: https://img.shields.io/npm/dm/solid-py.svg
[download-url]: https://npmjs.org/package/solid-py

[![solid-py](https://nodei.co/npm/solid-py.png)](https://npmjs.org/package/solid-py)

<p align="center">
  Effortlessly run Python code in your Solid apps. <a href="https://elilambnz.github.io/react-py">Try it out!</a>
</p>

---

> ✨ <a href="https://pyrepl.io">PyRepl.io</a> is a Python interpreter in your browser. Embed interactive Python examples in your documentation, blog posts, presentations and more. <a href="https://pyrepl.io">Get started for free.</a>

## Quickstart

Install `solid-py` with:

```bash
npm i solid-highlight-words
# or
yarn add solid-highlight-words
# or
pnpm add solid-highlight-words
```

Then, wrap your app in a `PythonProvider` component.

```tsx
import { PythonProvider } from "solid-py";

function App() {
  return (
    // Add the provider to your app
    <PythonProvider>
      <Codeblock />
    </PythonProvider>
  );
}

render(<App />, document.getElementById("root"));
```

Using the `usePython` hook, you can run code and access both stdout and stderr. For full usage instructions and framework specific guides, see the [usage docs](https://elilambnz.github.io/react-py/docs/introduction/usage).

## Documentation

For full documentation, visit [elilambnz.github.io/react-py](https://elilambnz.github.io/react-py).

## Examples

[Basic Example](https://elilambnz.github.io/react-py/docs/examples/basic-example)

[REPL](https://elilambnz.github.io/react-py/docs/examples/repl)

[Interrupting Execution](https://elilambnz.github.io/react-py/docs/examples/interrupting-execution)

[Using Packages](https://elilambnz.github.io/react-py/docs/examples/using-packages)

[File System](https://elilambnz.github.io/react-py/docs/examples/file-system)

[Custom Modules](https://elilambnz.github.io/react-py/docs/examples/custom-modules)

[Making API Calls](https://elilambnz.github.io/react-py/docs/examples/making-api-calls)

[User Input](https://elilambnz.github.io/react-py/docs/examples/user-input)

[Data Visualisation](https://elilambnz.github.io/react-py/docs/examples/data-visualisation)

## Limitations

Most of the Python standard library is functional, except from some modules. The following modules can be imported, but are not functional due to the limitations of the WebAssembly VM:

- multiprocessing
- threading
- sockets

[Learn more about the limitations here](https://pyodide.org/en/stable/usage/wasm-constraints.html).

## License

_solid-py_ is available under the MIT License.

## Contact

Ryan Aidan - [aidanaden](https://github.com/aidanaden)

## Acknowledgments

This project uses [Pyodide](https://pyodide.org), a Python distribution for the browser and Node.js based on WebAssembly.

## Contributing

If you're interested in contributing, please read our [contributing docs](https://github.com/elilambnz/python-py/blob/master/CONTRIBUTING.md) **before submitting a pull request**.
