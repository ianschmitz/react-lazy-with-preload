import React, {
    forwardRef,
    ReactNode,
    RefObject,
    Suspense,
    useRef,
} from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import lazyWithPreload, { lazyWithPreload as namedExport } from "../index";

interface TestComponentProps {
    foo: string;
    children: ReactNode;
}

function getTestComponentModule() {
    const TestComponent = forwardRef<HTMLDivElement, TestComponentProps>(
        function TestComponent(props, ref) {
            return <div ref={ref}>{`${props.foo} ${props.children}`}</div>;
        }
    );

    let loaded = false;
    let loadCalls = 0;

    return {
        isLoaded: () => loaded,
        loadCalls: () => loadCalls,
        OriginalComponent: TestComponent,
        TestComponent: async () => {
            loaded = true;
            loadCalls += 1;
            return { default: TestComponent };
        },
    };
}

describe("lazyWithPreload", () => {
    it("renders normally without invoking preload", async () => {
        // Given
        const { TestComponent, isLoaded } = getTestComponentModule();
        const LazyTestComponent = lazyWithPreload(TestComponent);

        // Then
        expect(isLoaded()).toBe(false);

        // When
        render(
            <Suspense fallback={null}>
                <LazyTestComponent foo="bar">baz</LazyTestComponent>
            </Suspense>
        );

        // Then
        await waitFor(() => expect(screen.queryByText("bar baz")).toBeTruthy());
    });

    it("renders normally when invoking preload", async () => {
        // Given
        const { TestComponent, isLoaded } = getTestComponentModule();
        const LazyTestComponent = lazyWithPreload(TestComponent);

        // When
        await LazyTestComponent.preload();

        // Then
        expect(isLoaded()).toBe(true);

        // When
        render(
            <Suspense fallback={null}>
                <LazyTestComponent foo="bar">baz</LazyTestComponent>
            </Suspense>
        );

        // Then
        await waitFor(() => expect(screen.queryByText("bar baz")).toBeTruthy());
    });

    it("never renders fallback if preloaded before first render", async () => {
        // Given
        let fallbackRendered = false;
        const Fallback = () => {
            fallbackRendered = true;
            return null;
        };
        const { TestComponent } = getTestComponentModule();
        const LazyTestComponent = lazyWithPreload(TestComponent);

        // When
        await LazyTestComponent.preload();
        render(
            <Suspense fallback={<Fallback />}>
                <LazyTestComponent foo="bar">baz</LazyTestComponent>
            </Suspense>
        );

        // Then
        expect(fallbackRendered).toBe(false);

        // Post
        await LazyTestComponent.preload();
    });

    it("renders fallback if not preloaded", async () => {
        // Given
        let fallbackRendered = false;
        const Fallback = () => {
            fallbackRendered = true;
            return null;
        };
        const { TestComponent } = getTestComponentModule();
        const LazyTestComponent = lazyWithPreload(TestComponent);

        // When
        render(
            <Suspense fallback={<Fallback />}>
                <LazyTestComponent foo="bar">baz</LazyTestComponent>
            </Suspense>
        );

        // Then
        expect(fallbackRendered).toBe(true);

        // Post
        await act(async () => {
            await LazyTestComponent.preload();
        });
    });

    it("only preloads once when preload is invoked multiple times", async () => {
        // Given
        const { TestComponent, loadCalls } = getTestComponentModule();
        const LazyTestComponent = lazyWithPreload(TestComponent);

        // When
        const preloadPromise1 = LazyTestComponent.preload();
        const preloadPromise2 = LazyTestComponent.preload();

        await Promise.all([preloadPromise1, preloadPromise2]);

        // Then
        // If `preload()` called multiple times, it should return the same promise
        expect(preloadPromise1).toBe(preloadPromise2);
        expect(loadCalls()).toBe(1);

        // When
        render(
            <Suspense fallback={null}>
                <LazyTestComponent foo="bar">baz</LazyTestComponent>
            </Suspense>
        );

        // Then
        await waitFor(() => expect(screen.queryByText("bar baz")).toBeTruthy());
    });

    it("supports ref forwarding", async () => {
        // Given
        const { TestComponent } = getTestComponentModule();
        const LazyTestComponent = lazyWithPreload(TestComponent);

        let ref: RefObject<HTMLDivElement> | undefined;

        function ParentComponent() {
            ref = useRef<HTMLDivElement>(null);

            return (
                <LazyTestComponent foo="bar" ref={ref}>
                    baz
                </LazyTestComponent>
            );
        }

        // When
        render(
            <Suspense fallback={null}>
                <ParentComponent />
            </Suspense>
        );

        // Then
        await waitFor(() => expect(screen.queryByText("bar baz")).toBeTruthy());
        expect(ref?.current?.textContent).toBe("bar baz");
    });

    it("returns the preloaded component when the preload promise resolves", async () => {
        // Given
        const { TestComponent, OriginalComponent } = getTestComponentModule();
        const LazyTestComponent = lazyWithPreload(TestComponent);

        // When
        const preloadedComponent = await LazyTestComponent.preload();

        // Then
        expect(preloadedComponent).toBe(OriginalComponent);
    });

    it("exports named export as well", () => {
        // Then
        expect(lazyWithPreload).toBe(namedExport);
    });
});
