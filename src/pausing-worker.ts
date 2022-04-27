export type Processor<T, R> = (item: T) => R;
export type Callback<R> = (results: R[]) => void;

const PausingWorkerConfig = {
    maxTimePerChunkMs: 1,
    timeBetweenChunksMs: 200,
}

export default class PausingWorker<T, R> {

    private processSingleItem: Processor<T, R>;
    private reportResults: Callback<R>;

    public constructor(processSingleItem: Processor<T, R>, reportResults: Callback<R> = () => {}) {
        this.processSingleItem = processSingleItem;
        this.reportResults = reportResults;
    }

    public process(items: T[]): void {
        this.work(items, []);
    }

    private work(items: T[], results: R[]): void {
        this.processItems(items, results);

        if (this.isWorkRemaining(items, results)) {
            setTimeout(
                this.work.bind(this),
                PausingWorkerConfig.timeBetweenChunksMs,
                items,
                results
            );
        } else {
            this.reportResults(results);
        }
    }

    private processItems(items: T[], results: R[]): void {
        const startTime = Date.now();

        while (this.canProcessItems(startTime, items, results)) {
            const item = items.at(results.length) as T;
            const result = this.processSingleItem(item);

            results.push(result);
        }
    }

    private canProcessItems(startTime: number, items: T[], results: R[]): boolean {
        const runningTime = Date.now() - startTime;

        return this.isWorkRemaining(items, results)
            && runningTime < PausingWorkerConfig.maxTimePerChunkMs;
    }

    private isWorkRemaining(items: T[], results: R[]) {
        return results.length < items.length;
    }
}
