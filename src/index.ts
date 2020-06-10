import { ComponentType, createElement, forwardRef, lazy } from "react";

export type PreloadableComponent<T extends ComponentType<any>> = T & {
    preload: () => Promise<void>;
};

export default function lazyWithPreload<T extends ComponentType<any>>(
    factory: () => Promise<{ default: T }>
): PreloadableComponent<T> {
    const LazyComponent = lazy(factory);
    let factoryPromise: Promise<void> | undefined;
    let LoadedComponent: T | undefined;

    const Component = (forwardRef((props, ref) =>
        createElement(
            LoadedComponent ?? LazyComponent,
            Object.assign(ref ? { ref } : {}, props) as any
        )
    ) as any) as PreloadableComponent<T>;

    Component.preload = () => {
        if (!factoryPromise) {
            factoryPromise = factory().then((module) => {
                LoadedComponent = module.default;
            });
        }

        return factoryPromise;
    };
    return Component;
}
