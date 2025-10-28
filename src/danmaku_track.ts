import { DanmakuAlignment } from "./danmaku_engine";
import DanmakuItem from "./danmaku_item";

export default class DanmakuTrack {
    private items: DanmakuItem[] = [];

    public bottom = 0;

    public constructor(
        public top: number,
        public height: number
    ) {
        this.bottom = top + height;
    }

    public attach(d: DanmakuItem, alignment: DanmakuAlignment): void {
        this.items.push(d);
        d.set_style('top', this.compute_position(d, alignment));
    }

    public detach(d: DanmakuItem): void {
        this.items = this.items.filter(item => item !== d);
    }

    public peek_last(): DanmakuItem | null {
        return this.items.length !== 0 ? this.items[this.items.length - 1] : null;
    }

    public cancel(): void {
        for (const d of [...this.items]) {
            d.plugin_system.lifecycle.end.emit(d);
        }
    }

    private compute_position(d: DanmakuItem, alignment: DanmakuAlignment): string {
        let pos = 0;
        switch (alignment) {
            case 'top':
                pos = this.top;
                break;
            case 'center':
                pos = this.top + (this.height - d.height) / 2;
                break;
            case 'bottom':
                pos = this.top + this.height - d.height;
                break;
            default: throw new Error('Unexpected alignment.');
        }
        return `${pos}px`;
    }
}