import React, { memo, useEffect } from "react";
import {
    act,
    render,
    RenderResult,
    screen,
    waitFor,
} from "@testing-library/react";
import lazy, { lazyWithPreload as namedExport } from "../index";

function getTestComponentModule() {
    const TestComponent = React.forwardRef<
        HTMLDivElement,
        { foo: string; children: React.ReactNode }
    >(function TestComponent(props, ref) {
        renders++;
        useEffect(() => {
            mounts++;
        }, []);
        return <div ref={ref}>{`${props.foo} ${props.children}`}</div>;
    });
    let loaded = false;
    let loadCalls = 0;
    let renders = 0;
    let mounts = 0;

    return {
        isLoaded: () => loaded,
        loadCalls: () => loadCalls,
        renders: () => renders,
        mounts: () => mounts,
        OriginalComponent: TestComponent,
        TestComponent: async () => {
            loaded = true;
            loadCalls++;
            return { default: TestComponent };
        },
        TestMemoizedComponent: async () => {
            loaded = true;
            loadCalls++;
            return { default: memo(TestComponent) };
        },
    };
}

describe("lazy", () => {
    it("renders normally without invoking preload", async () => {
        const { TestComponent, isLoaded } = getTestComponentModule();
        const LazyTestComponent = lazy(TestComponent);

        expect(isLoaded()).toBe(false);

        render(
            <React.Suspense fallback={null}>
                <LazyTestComponent foo="bar">baz</LazyTestComponent>
            </React.Suspense>
        );

        await waitFor(() => expect(screen.queryByText("bar baz")).toBeTruthy());
    });

    it("renders normally when invoking preload", async () => {
        const { TestComponent, isLoaded } = getTestComponentModule();
        const LazyTestComponent = lazy(TestComponent);
        await LazyTestComponent.preload();

        expect(isLoaded()).toBe(true);

        render(
            <React.Suspense fallback={null}>
                <LazyTestComponent foo="bar">baz</LazyTestComponent>
            </React.Suspense>
        );

        await waitFor(() => expect(screen.queryByText("bar baz")).toBeTruthy());
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
                <LazyTestComponent foo="bar">baz</LazyTestComponent>
            </React.Suspense>
        );

        expect(fallbackRendered).toBe(false);

        await LazyTestComponent.preload();
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
                <LazyTestComponent foo="bar">baz</LazyTestComponent>
            </React.Suspense>
        );

        expect(fallbackRendered).toBe(true);

        await act(async () => {
            await LazyTestComponent.preload();
        });
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

        render(
            <React.Suspense fallback={null}>
                <LazyTestComponent foo="bar">baz</LazyTestComponent>
            </React.Suspense>
        );

        await waitFor(() => expect(screen.queryByText("bar baz")).toBeTruthy());
    });

    it("supports ref forwarding", async () => {
        const { TestComponent } = getTestComponentModule();
        const LazyTestComponent = lazy(TestComponent);

        let ref: React.RefObject<HTMLDivElement> | undefined;

        function ParentComponent() {
            ref = React.useRef<HTMLDivElement>(null);

            return (
                <LazyTestComponent foo="bar" ref={ref}>
                    baz
                </LazyTestComponent>
            );
        }

        render(
            <React.Suspense fallback={null}>
                <ParentComponent />
            </React.Suspense>
        );

        await waitFor(() => expect(screen.queryByText("bar baz")).toBeTruthy());
        expect(ref?.current?.textContent).toBe("bar baz");
    });

    it("returns the preloaded component when the preload promise resolves", async () => {
        const { TestComponent, OriginalComponent } = getTestComponentModule();
        const LazyTestComponent = lazy(TestComponent);

        const preloadedComponent = await LazyTestComponent.preload();

        expect(preloadedComponent).toBe(OriginalComponent);
    });

    it("exports named export as well", () => {
        expect(lazy).toBe(namedExport);
    });

    it("does not re-render memoized base component when passed same props after preload", async () => {
        const { TestMemoizedComponent, renders } = getTestComponentModule();
        const LazyTestComponent = lazy(TestMemoizedComponent);

        expect(renders()).toBe(0);

        let rerender: RenderResult["rerender"] | undefined;
        await act(async () => {
            const result = render(
                <React.Suspense fallback={null}>
                    <LazyTestComponent foo="bar">baz</LazyTestComponent>
                </React.Suspense>
            );
            rerender = result.rerender;
        });

        expect(renders()).toBe(1);

        await LazyTestComponent.preload();

        await act(async () => {
            rerender?.(
                <React.Suspense fallback={null}>
                    <LazyTestComponent foo="bar">baz</LazyTestComponent>
                </React.Suspense>
            );
        });

        expect(renders()).toBe(1);
    });

    it("does not re-mount base component after preload", async () => {
        const { TestComponent, mounts } = getTestComponentModule();
        const LazyTestComponent = lazy(TestComponent);

        expect(mounts()).toBe(0);

        let rerender: RenderResult["rerender"] | undefined;
        await act(async () => {
            const result = render(
                <React.Suspense fallback={null}>
                    <LazyTestComponent foo="bar">baz</LazyTestComponent>
                </React.Suspense>
            );
            rerender = result.rerender;
        });

        expect(mounts()).toBe(1);

        await LazyTestComponent.preload();

        await act(async () => {
            rerender?.(
                <React.Suspense fallback={null}>
                    <LazyTestComponent foo="updated">updated</LazyTestComponent>
                </React.Suspense>
            );
        });

        expect(mounts()).toBe(1);
    });
});
