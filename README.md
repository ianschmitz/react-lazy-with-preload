`react-lazy-with-preload` wraps the `React.lazy()` API and adds the ability to preload the component before it is rendered for the first time.

## Install

```sh
npm install react-lazy-with-preload
```

## Usage

**Before:**

```js
import { lazy, Suspense } from "react";
const OtherComponent = lazy(() => import("./OtherComponent"));
```

**After:**

```js
import { Suspense } from "react";
import lazy from "react-lazy-with-preload";
const OtherComponent = lazy(() => import("./OtherComponent"));

// ...
OtherComponent.preload();
```

For more information about React code-splitting, `React.lazy` and `React.Suspense`, see https://reactjs.org/docs/code-splitting.html.

## Example

To preload a component before it is rendered for the first time, the component that is returned from `lazy()` has a `preload` function attached that you can invoke.

For example, if you need to load a component when a button is pressed, you could start preloading the component when the user hovers over the button:

```js
function SomeComponent() {
    const { showOtherComponent, setshowOtherComponent } = useState(false);

    return (
        <div>
            <Suspense fallback={<div>Loading...</div>}>
                {showOtherComponent && <OtherComponent />}
            </Suspense>
            <button
                onClick={() => setshowOtherComponent(true)}
                // This component will be needed soon. Let's preload it!
                onMouseOver={() => OtherComponent.preload()}
            >
                Click me to render OtherComponent
            </button>
        </div>
    );
}
```

## Acknowledgements

Inspired by the preload behavior of [react-loadable](https://github.com/jamiebuilds/react-loadable).
