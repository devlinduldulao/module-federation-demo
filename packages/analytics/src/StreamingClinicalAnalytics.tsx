import ClinicalAnalytics from "./ClinicalAnalytics";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface Resource<T> {
    read(): T;
}

function createResource<T>(asyncFn: () => Promise<T>): Resource<T> {
    let status: "pending" | "success" | "error" = "pending";
    let result: T;
    const suspender = asyncFn().then(
        (data) => {
            status = "success";
            result = data;
        },
        (error) => {
            status = "error";
            result = error;
        }
    );

    return {
        read() {
            if (status === "pending") throw suspender;
            if (status === "error") throw result;
            return result;
        },
    };
}

const resourceCache = new Map<string, Resource<void>>();

export function __resetAnalyticsStreamingResourceCache(): void {
    resourceCache.clear();
}

function getResource(key: string, delayMs: number): Resource<void> {
    if (!resourceCache.has(key)) {
        resourceCache.set(key, createResource(() => delay(delayMs)));
    }
    return resourceCache.get(key)!;
}

const StreamingClinicalAnalytics = () => {
    const resource = getResource("analytics-initial", 5000);
    resource.read();
    return <ClinicalAnalytics />;
};

export default StreamingClinicalAnalytics;
