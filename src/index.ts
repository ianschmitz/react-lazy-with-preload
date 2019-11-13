import React, { ComponentType, LazyExoticComponent } from "react";

export type PreloadableLazyExoticComponent<
    T extends ComponentType<any>
> = LazyExoticComponent<T> & { preload: () => Promise<void> };

export default function lazyWithPreload<T extends ComponentType<any>>(
    factory: () => Promise<{ default: T }>
): PreloadableLazyExoticComponent<T> {
    const Component = React.lazy(factory) as PreloadableLazyExoticComponent<T>;
    let factoryPromise: Promise<void> | undefined;

    Component.preload = () => {
        if (factoryPromise) {
            return factoryPromise;
        }

        factoryPromise = factory().then(() => undefined);
        return factoryPromise;
    };

    return Component;
}
