import MedicalRecords from "./MedicalRecords";

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

export function __resetRecordsStreamingResourceCache(): void {
    resourceCache.clear();
}

function getResource(key: string, delayMs: number): Resource<void> {
    if (!resourceCache.has(key)) {
        resourceCache.set(key, createResource(() => delay(delayMs)));
    }
    return resourceCache.get(key)!;
}

const StreamingMedicalRecords = () => {
    const resource = getResource("records-initial", 2500);
    resource.read();
    return <MedicalRecords />;
};

export default StreamingMedicalRecords;
