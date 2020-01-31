import React, { ComponentType, createElement } from "react";

export type PreloadableComponent<T extends ComponentType<any>> = T & {
    preload: () => Promise<void>;
};

export default function lazyWithPreload<T extends ComponentType<any>>(
    factory: () => Promise<{ default: T }>
): PreloadableComponent<T> {
    const LazyComponent = React.lazy(factory);
    let factoryPromise: Promise<void> | undefined;
    let LoadedComponent: T | undefined;

    const Component = (props =>
        createElement(
            LoadedComponent ?? LazyComponent,
            props
        )) as PreloadableComponent<T>;

    Component.preload = () => {
        if (!factoryPromise) {
            factoryPromise = factory().then(module => {
                LoadedComponent = module.default;
            });
        }

        return factoryPromise;
    };
    return Component;
}
