import fuzzysort from "fuzzysort";
import { TFile } from "obsidian";
import Tag from "./tag";

export type TagExtractor = (file: TFile) => Tag[];
export type ContentExtractor = (file: TFile) => Promise<string>;
export type TagMatcher = (file: TFile) => Promise<Tag[]>;

const TagSuggestionEngineConfig = {
    fuzzy: true,
    maxSuggestions: 20,
}

export default class TagSuggestionEngine {

    private extractTags: TagExtractor;
    private extractContent: ContentExtractor;
    private matchTags: TagMatcher;

    private globalTags: Tag[] = [];

    public constructor(extractTags: TagExtractor, extractContent: ContentExtractor) {
        this.extractTags = extractTags;
        this.extractContent = extractContent;
        this.matchTags = TagSuggestionEngineConfig.fuzzy ? this.getFuzzyTagMatches : this.getInflexibleTagMatches;
    }

    public setGlobalTags(files: TFile[]): void {
        this.globalTags = files.flatMap(file => this.extractTags(file));
    }

    public async getSuggestedTags(file: TFile | null): Promise<Tag[]> {
        return file == null ? [] : this.matchTags(file);
    }

    public getUnusedTags(file: TFile | null): Tag[] {
        return file == null
            ? this.globalTags
            : this.difference(this.globalTags, this.extractTags(file));
    }

    private difference(keep: Tag[], extract: Tag[]): Tag[] {
        return keep.filter((toKeep) => {
            return !extract.some((toRemove) => {
                return toKeep.isExactMatch(toRemove);
            });
        });
    }

    private async getFuzzyTagMatches(file: TFile): Promise<Tag[]> {
        const fileContent = await this.getFileContentAndName(file);
        const preparedContent = fuzzysort.prepare(fileContent);

        const matches = await this.getInflexibleTagMatches(file);

        this.getUnusedTags(file)
            .map((tag) => {
                return {
                    tag: tag,
                    score: fuzzysort.single(tag.getRawTag(), preparedContent)?.score ?? -Infinity
                }
            })
            .filter(res => res.score > -Infinity)
            .sort((a, b) => a.score - b.score)
            .forEach(res => {
                if (!matches.contains(res.tag)) {
                    matches.push(res.tag);
                }
            });

        return matches.slice(0, TagSuggestionEngineConfig.maxSuggestions);
    }

    private async getInflexibleTagMatches(file: TFile): Promise<Tag[]> {
        const unusedTags: Tag[] = this.getUnusedTags(file);
        const fileTokens: Tag[] = await this.getFileTokens(file);

        return this.intersection(unusedTags, fileTokens)
            .slice(0, TagSuggestionEngineConfig.maxSuggestions);
    }

    private async getFileTokens(file: TFile): Promise<Tag[]> {
        const fileContent = (await this.getFileContentAndName(file)).toLowerCase();
        const fileTokens = new Set(Tag.tokenize(fileContent));
        return [...fileTokens].map(token => new Tag(token));
    }

    private async getFileContentAndName(file: TFile): Promise<string> {
        return file.basename + " " + await this.extractContent(file);
    }

    private intersection(s1: Tag[], s2: Tag[]): Tag[] {
        return s1.filter((e1) => {
            return s2.some((e2) => {
                return e1.isCloseMatch(e2);
            });
        });
    }
}
