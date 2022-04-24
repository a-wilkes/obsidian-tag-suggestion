import { View, WorkspaceLeaf } from "obsidian";
import Tag from "./tag";

export const TagSuggestionViewConfig = {
    type: "tag-suggestion-view",
    hoverText: "Tag Suggestions",
    contentClassName: "view-content",
    suggestedTagsTitle: "Suggested Tags",
    unusedTagsTitle: "Unused Tags",
    noFileText: "Not currently viewing file.",
}

export default class TagSuggestionView extends View {

    private baseViewElement: Element = this.setViewElement();

    private viewingFile = false;
    private suggestedTags: Tag[] = [];
    private unusedTags: Tag[] = [];

    public constructor(leaf: WorkspaceLeaf) {
        super(leaf);
        this.updateDisplay();
    }

    public override getViewType(): string {
        return TagSuggestionViewConfig.type;
    }

    public override getDisplayText(): string {
        return TagSuggestionViewConfig.hoverText;
    }

    public setViewingFile(viewing: boolean): void {
        this.viewingFile = viewing;
        this.updateDisplay();
    }

    public setSuggestedTags(tags: Tag[]): void {
        this.suggestedTags = tags;
        this.updateDisplay();
    }

    public setUnusedTags(tags: Tag[]): void {
        this.unusedTags = tags;
        this.updateDisplay();
    }

    private setViewElement(): Element {
        const viewElements: HTMLCollectionOf<Element> = this.containerEl.getElementsByClassName(TagSuggestionViewConfig.contentClassName);
        const viewElement: Element | null = viewElements.item(0);

        return (viewElement ?? this.containerEl.createDiv({ cls: TagSuggestionViewConfig.contentClassName }));
    }

    private updateDisplay(): void {
        this.baseViewElement.empty();
        
        this.viewingFile ? this.showTagViews() : this.showNoFile();
    }

    private showTagViews(): void {
        this.baseViewElement.appendChild(
            this.buildTagView(
                TagSuggestionViewConfig.suggestedTagsTitle,
                this.createList(
                    this.suggestedTags.map(tag => tag.display())
                )
            )
        );

        this.baseViewElement.appendChild(
            this.buildTagView(
                TagSuggestionViewConfig.unusedTagsTitle,
                this.createList(
                    this.unusedTags.map(tag => tag.display())
                )
            )
        );
    }

    private buildTagView(title: string, content: Element): Element {
		const tagViewContainer = createDiv({ cls: "tag-view-container" })
        tagViewContainer.createDiv({
            cls: "tag-view-title",
            text: title,
        });

        tagViewContainer.appendChild(content);

        return tagViewContainer;
    }

    private createList(elements: string[]): Element {
        const container: Element = createDiv({ cls: "tag-list-container" });
        elements.forEach((tag) => {
            container.createDiv({
                cls: "tag-list-item",
                text: tag,
            })
        });

        return container;
    }

    private showNoFile(): void {
        this.baseViewElement.createDiv({
            cls: "tag-view-info",
            text: TagSuggestionViewConfig.noFileText,
        });
    }
}
