import React from "react";
import { render, wait } from "@testing-library/react";
import lazy from "../index";

function getTestComponentModule() {
    const TestComponent: React.FC = () => <div>test</div>;
    let loaded = false;
    let loadCalls = 0;

    return {
        isLoaded: () => loaded,
        loadCalls: () => loadCalls,
        TestComponent: async () => {
            loaded = true;
            loadCalls++;
            return { default: TestComponent };
        },
    };
}

describe("lazy", () => {
    it("renders normally without invoking preload", async () => {
        const { TestComponent, isLoaded } = getTestComponentModule();
        const LazyTestComponent = lazy(TestComponent);

        expect(isLoaded()).toBe(false);

        const { queryByText } = render(
            <React.Suspense fallback={null}>
                <LazyTestComponent />
            </React.Suspense>
        );

        await wait(() => expect(queryByText("test")).toBeTruthy());
    });

    it("renders normally when invoking preload", async () => {
        const { TestComponent, isLoaded } = getTestComponentModule();
        const LazyTestComponent = lazy(TestComponent);
        await LazyTestComponent.preload();

        expect(isLoaded()).toBe(true);

        const { queryByText } = render(
            <React.Suspense fallback={null}>
                <LazyTestComponent />
            </React.Suspense>
        );

        await wait(() => expect(queryByText("test")).toBeTruthy());
    });

    it("never renders fallback if preloaded before first render", async () => {
        let fallbackRendered = false;
        const Fallback = () => {
            fallbackRendered = true;
            return null;
        };
        const { TestComponent } = getTestComponentModule();
        const LazyTestComponent = lazy(TestComponent);
        await LazyTestComponent.preload();

        render(
            <React.Suspense fallback={<Fallback />}>
                <LazyTestComponent />
            </React.Suspense>
        );

        expect(fallbackRendered).toBe(false);
    });

    it("renders fallback if not preloaded", async () => {
        let fallbackRendered = false;
        const Fallback = () => {
            fallbackRendered = true;
            return null;
        };
        const { TestComponent } = getTestComponentModule();
        const LazyTestComponent = lazy(TestComponent);

        render(
            <React.Suspense fallback={<Fallback />}>
                <LazyTestComponent />
            </React.Suspense>
        );

        expect(fallbackRendered).toBe(true);
    });

    it("only preloads once when preload is invoked multiple times", async () => {
        const { TestComponent, loadCalls } = getTestComponentModule();
        const LazyTestComponent = lazy(TestComponent);
        const preloadPromise1 = LazyTestComponent.preload();
        const preloadPromise2 = LazyTestComponent.preload();

        await Promise.all([preloadPromise1, preloadPromise2]);

        // If `preload()` called multiple times, it should return the same promise
        expect(preloadPromise1).toBe(preloadPromise2);
        expect(loadCalls()).toBe(1);

        const { queryByText } = render(
            <React.Suspense fallback={null}>
                <LazyTestComponent />
            </React.Suspense>
        );

        await wait(() => expect(queryByText("test")).toBeTruthy());
    });
});
