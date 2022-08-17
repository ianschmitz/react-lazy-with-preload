import { ComponentType, createElement, forwardRef, lazy, memo } from "react";

export type PreloadableComponent<T extends ComponentType<any>> = T & {
    preload: () => Promise<T>;
};

export function lazyWithPreload<T extends ComponentType<any>>(
    factory: () => Promise<{ default: T }>
): PreloadableComponent<T> {
    const LazyComponent = lazy(factory);
    let factoryPromise: Promise<T> | undefined;
    let LoadedComponent: T | undefined;

    const Component = forwardRef(function LazyWithPreload(props, ref) {
        return createElement(
            LoadedComponent ?? LazyComponent,
            Object.assign(ref ? { ref } : {}, props) as any
        );
    });

    const LazyWithPreload = memo(Component) as any as PreloadableComponent<T>;

    LazyWithPreload.preload = () => {
        if (!factoryPromise) {
            factoryPromise = factory().then((module) => {
                LoadedComponent = module.default;
                return LoadedComponent;
            });
        }

        return factoryPromise;
    };

    return LazyWithPreload;
}

export default lazyWithPreload;
