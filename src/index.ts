import {
    ComponentProps,
    ComponentType,
    createElement,
    forwardRef,
    FunctionComponent,
    lazy,
    LazyExoticComponent,
} from "react";

export type PreloadableComponent<
    COMPONENT extends ComponentType<ComponentProps<COMPONENT>>
> = LazyExoticComponent<COMPONENT> & {
    preload(): Promise<COMPONENT>;
};

/**
 * Function wraps the `React.lazy()` API and adds the ability to preload the component
 * before it is rendered for the first time.
 *
 * @example
 * ```tsx
 * import React, { Suspense } from 'react';
 * import { lazyWithPreload } from 'react-lazy-with-preload';
 *
 * const LazyComponent = lazyWithPreload(() => import('./LazyComponent'));
 *
 * function SomeComponent() {
 *   return (
 *     <Suspense fallback="Loading...">
 *       <Link
 *         href="..."
 *         // This component will be needed soon. Let's preload it!
 *         onMouseOver={() => LazyComponent.preload()}
 *       >
 *         Click me to navigate to page with LazyComponent
 *       </Link>
 *     </Suspense>
 *   );
 * }
 * ```
 */
export function lazyWithPreload<
    COMPONENT extends ComponentType<ComponentProps<COMPONENT>>
>(
    factory: () => Promise<{ default: COMPONENT }>
): PreloadableComponent<COMPONENT> {
    const LazyComponent = lazy(factory);
    let factoryPromise: Promise<COMPONENT> | undefined;
    let LoadedComponent: COMPONENT | undefined;

    const Component = forwardRef(function LazyWithPreload(props, ref) {
        return createElement(
            (LoadedComponent ?? LazyComponent) as FunctionComponent,
            // eslint-disable-next-line @typescript-eslint/ban-types
            Object.assign<{}, {}>(ref ? { ref } : {}, props)
        );
    }) as PreloadableComponent<COMPONENT>;

    Component.preload = function preload() {
        if (!factoryPromise) {
            factoryPromise = factory().then((module) => {
                LoadedComponent = module.default;
                return LoadedComponent;
            });
        }

        return factoryPromise;
    };

    return Component;
}

export default lazyWithPreload;
