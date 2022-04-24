import { CachedMetadata, getAllTags, Plugin, TFile, WorkspaceLeaf } from 'obsidian';
import { RibbonConfig } from './tag-suggestion-ribbon';
import TagSuggestionView, { TagSuggestionViewConfig } from './tag-suggestion-view';
import TagSuggestionEngine, { TagExtractor } from './tag-suggestion-engine';
import Tag from './tag';

export default class TagSuggestionPlugin extends Plugin {

    private engine: TagSuggestionEngine = new TagSuggestionEngine(
        this.extractTags.bind(this),
        this.extractContent.bind(this)
    );

    public override async onload(): Promise<void> {
        this.registerInterfaceElements();
        this.registerEventHandlers();
    }

    public override async onunload(): Promise<void> {
        this.unregisterInterfaceElements();
    }

    private registerInterfaceElements(): void {
        this.app.workspace.onLayoutReady(() => {
            this.registerSideBarView();
            this.registerRibbonButton();
        });
    }

    private unregisterInterfaceElements(): void {
        this.app.workspace.detachLeavesOfType(TagSuggestionViewConfig.type);
    }

    private registerSideBarView(): void {
        this.registerView(TagSuggestionViewConfig.type, (leaf) => new TagSuggestionView(leaf));
    }

    private registerRibbonButton(): void {
        this.addRibbonIcon(RibbonConfig.iconName, RibbonConfig.hoverText, () => this.showSideBarView());
    }

    private async showSideBarView(): Promise<void> {
        this.unregisterInterfaceElements();

        await this.app.workspace.getRightLeaf(false).setViewState({
            type: TagSuggestionViewConfig.type,
            active: true,
        });

        const leaf: WorkspaceLeaf | undefined = this.getTagSuggestSideBarLeaves().first();
        if (leaf != undefined) {
            this.app.workspace.revealLeaf(leaf);
        }

        this.engine.setGlobalTags(this.app.vault.getMarkdownFiles());
        this.handleActiveLeafChanged();
    }

    private getTagSuggestSideBarLeaves(): WorkspaceLeaf[] {
        return this.app.workspace.getLeavesOfType(TagSuggestionViewConfig.type)
            .filter((leaf) => leaf.view instanceof TagSuggestionView);
    }

    private registerEventHandlers(): void {
        this.registerEvent(this.app.workspace.on("active-leaf-change", (_) => this.handleActiveLeafChanged()));
        this.registerEvent(this.app.metadataCache.on("changed", (_) => this.handleFileChanged()));
        this.registerEvent(this.app.vault.on("delete", (_) => this.handleFileDeleted()));
    }

    private async handleActiveLeafChanged(): Promise<void> {
        const currentFile: TFile | null = this.app.workspace.getActiveFile();

        const isViewingFile: boolean = this.isViewingFile();
        const unusedTags: Tag[] = this.engine.getUnusedTags(currentFile);
        const suggestedTags: Tag[] = await this.engine.getSuggestedTags(currentFile);

        this.getTagSuggestSideBarViews().forEach((view) => {
            view?.setViewingFile(isViewingFile);
            view?.setSuggestedTags(suggestedTags);
            view?.setUnusedTags(unusedTags);
        });
    }

    private async handleFileChanged(): Promise<void> {
        const currentFile: TFile | null = this.app.workspace.getActiveFile();

        this.engine.setGlobalTags(this.app.vault.getMarkdownFiles());

        const unusedTags: Tag[] = this.engine.getUnusedTags(currentFile);
        const suggestedTags: Tag[] = await this.engine.getSuggestedTags(currentFile);

        this.getTagSuggestSideBarViews().forEach((view) => {
            view?.setSuggestedTags(suggestedTags);
            view?.setUnusedTags(unusedTags);
        });
    }

    private async handleFileDeleted(): Promise<void> {
        const currentFile: TFile | null = this.app.workspace.getActiveFile();

        this.engine.setGlobalTags(this.app.vault.getMarkdownFiles());

        const unusedTags: Tag[] = this.engine.getUnusedTags(currentFile);
        const suggestedTags: Tag[] = await this.engine.getSuggestedTags(currentFile);

        this.getTagSuggestSideBarViews().forEach((view) => {
            view?.setSuggestedTags(suggestedTags);
            view?.setUnusedTags(unusedTags);
        })
    }

    private getTagSuggestSideBarViews(): TagSuggestionView[] {
        return this.getTagSuggestSideBarLeaves().map((leaf) => {
            return leaf.view as TagSuggestionView;
        });
    }

    private isViewingFile(): boolean {
        return this.app.workspace.getActiveFile() != null;
    }

    public extractTags(file: TFile): Tag[] {
        const cachedMetadata: CachedMetadata | null = this.app.metadataCache.getCache(file.path);
        if (cachedMetadata == null) {
            return [];
        }

        const uniqueRawTags = new Set(getAllTags(cachedMetadata));
        return [...uniqueRawTags].map((rawTag) => new Tag(rawTag));
    }

    public extractContent(file: TFile): Promise<string> {
        return this.app.vault.cachedRead(file);
    }
}
