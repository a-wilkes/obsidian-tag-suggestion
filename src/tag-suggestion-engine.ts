import { TFile } from "obsidian";
import PausingWorker from "./pausing-worker";
import Tag from "./tag";

export type TagExtractor = (file: TFile) => Tag[];
export type ContentExtractor = (file: TFile) => Promise<string>;
export type TagSetter = (tags: Tag[]) => void;

const TagSuggestionEngineConfig = {
    maxSuggestions: 20,
}

export default class TagSuggestionEngine {

    private extractTags: TagExtractor;
    private extractContent: ContentExtractor;

    private setUnusedTags: TagSetter;
    private setSuggestedTags: TagSetter;

    private globalTags: Tag[] = [];

    public constructor(extractTags: TagExtractor,
        extractContent: ContentExtractor,
        setUnusedTags: TagSetter,
        setSuggestedTags: TagSetter
    ) {
        this.extractTags = extractTags;
        this.extractContent = extractContent;
        this.setUnusedTags = setUnusedTags;
        this.setSuggestedTags = setSuggestedTags;
    }

    public updateGlobalTags(files: TFile[], callback: () => void) {
        this.globalTags = [];

        const tagFilter = new PausingWorker(
            (tag: Tag) => {
                if (!this.globalTags.some(t => t.isExactMatch(tag))) {
                    this.globalTags.push(tag);
                }
            },
            callback
        );

        new PausingWorker(
            (file: TFile) => this.extractTags(file),
            (tags) => tagFilter.process(tags.flatMap(t => t))
        ).process(files);
    }

    public async updateSuggestedTags(file: TFile | null): Promise<void> {
        this.setSuggestedTags([]);
        file == null
            ? this.setSuggestedTags([])
            : await this.getTagMatches(file, this.setSuggestedTags);
    }

    public updateUnusedTags(file: TFile | null): void {
        this.setUnusedTags([]);
        this.getUnusedTags(file, this.setUnusedTags);
    }

    private getUnusedTags(file: TFile | null, setTags: TagSetter): void {
        file == null
            ? setTags(this.globalTags)
            : this.difference(this.globalTags, this.extractTags(file), setTags)
    }

    private difference(keep: Tag[], extract: Tag[], setTags: TagSetter): void {
        new PausingWorker(
            (toKeep: Tag) => extract.some(toRemove => toKeep.isExactMatch(toRemove)) ? null : toKeep,
            (results) => setTags(results.filter(t => t != null) as Tag[])
        ).process(keep);
    }

    private async getTagMatches(file: TFile, setTags: TagSetter): Promise<void> {
        this.getUnusedTags(
            file,
            async (unusedTags) => {
                const fileTokens: Tag[] = await this.getFileTokens(file);

                new PausingWorker(
                    (unusedTag: Tag) => unusedTag.isCloseMatch(fileTokens) ? unusedTag : null,
                    (matches) => setTags(matches.filter(t => t != null) as Tag[])
                ).process(unusedTags);
            }
        );
    }

    private async getFileTokens(file: TFile): Promise<Tag[]> {
        const fileContent = (await this.getFileContentAndName(file)).toLowerCase();
        const fileTokens = new Set(Tag.tokenize(fileContent));
        return [...fileTokens].map(token => new Tag(token));
    }

    private async getFileContentAndName(file: TFile): Promise<string> {
        return file.basename + " " + await this.extractContent(file);
    }
}
