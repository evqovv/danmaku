export default class DanmakuContainer {
	public constructor() {
		this.node = document.createElement("div");
		this.apply_style({
			"overflow": "hidden",
			"position": "relative",
			"top": "0",
			"left": "0",
			"width": "100%",
			"height": "100%",
		});
	}

	public apply_style(style: Partial<CSSStyleDeclaration>): void {
		Object.assign(this.node.style, style);
	}

	public mount(node: HTMLElement): void {
		if (this.is_mounted()) {
			throw new Error("Container already mounted. Unmount before remounting.");
		}
		node.appendChild(this.node);
		this.parent_node = node;
		this.format();
	}

	public unmount(): void {
		if (!this.is_mounted()) {
			return;
		}
		this.node.parentNode!.removeChild(this.node);
		this.parent_node = null;
	}

	public is_mounted(): boolean {
		return this.parent_node !== null;
	}

	public resize(): void {
		this.format();
	}

	private format(): void {
		const rect = this.node.getBoundingClientRect();
		Object.assign(this, {
			width: rect.width,
			height: rect.height,
		})
	}

	public node: HTMLDivElement;

	public parent_node: HTMLElement | null = null;

	public width = 0;

	public height = 0;
}