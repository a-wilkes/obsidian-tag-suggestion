const TagConfig = {
    tagPrefix: "#",
}

export default class Tag {

    public static tokenize(input: string): string[] {
        return input.split(/[^\w]+/g)
            .filter(token => token.length > 0);
    }

    private rawTag: string;

    public constructor(rawTag: string) {
        this.rawTag = this.stripPrefix(rawTag);
    }
    
    private stripPrefix(tag: string): string {
        return tag.startsWith(TagConfig.tagPrefix)
            ? tag.substring(TagConfig.tagPrefix.length)
            : tag;
    }

    public getRawTag(): string {
        return this.rawTag;
    }

    public display(): string {
        return this.rawTag;
    }

    public isExactMatch(candidate: Tag): boolean {
        return this.match(
            candidate,
            (thisTokens, candidateTokens) => thisTokens.every(token => candidateTokens.has(token))
        );
    }

    public isCloseMatch(candidate: Tag): boolean {
        return this.match(
            candidate,
            (thisTokens, candidateTokens) => {
                const sensitivity = candidateTokens.size / 2;
                const matches = thisTokens.filter(token => candidateTokens.has(token));
                return matches.length >= sensitivity;
            }
        );
    }

    private match(candidate: Tag, scoreFn: (thisTokens: string[], candidateTokens: Set<string>) => boolean): boolean {
        const thisTokens = Tag.tokenize(this.rawTag);
        const candidateTokens = new Set(Tag.tokenize(candidate.getRawTag()));

        return scoreFn(thisTokens, candidateTokens);
    }
}
