import { DanmakuAlignment } from "@danmaku/danmaku_engine";
import { DanmakuOptions } from "@danmaku/danmaku_item";
import DanmakuManager from "@danmaku/danmaku_manager";
import { load_text, random_duration, to_px, to_px_value } from "./utils";

const prefix_img = document.createElement('img');
prefix_img.src = "./assets/orihime.jpg";
prefix_img.style.display = "inline-block";
prefix_img.style.maxHeight = to_px('6vh');
await prefix_img.decode();

function create_danmaku(text: string): [HTMLImageElement, HTMLSpanElement] {
    const span = document.createElement('span');
    span.textContent = text;
    span.style.marginLeft = '8px';

    return [prefix_img, span];
}

async function get_danmaku(): Promise<DanmakuOptions[]> {
    const ret: DanmakuOptions[] = [];
    const list = (await load_text('/assets/text.txt')).split('\n');
    for (const text of list) {
        ret.push({
            duration: random_duration(7000, 14000),
            node: create_danmaku(text),
            style: {
                fontSize: to_px('3vh'),
                fontWeight: 'bold',
                color: '#fff7ea',
                maxHeight: to_px('10vh'),
                border: "3px solid yellow",
                borderRadius: "8px",
                padding: "8px 16px",
            },
            loop: true,
            direction: 'to_left',
            clone_node: true,
        })
    }
    return ret;
}

async function main(): Promise<void> {
    const container: HTMLDivElement | null = document.querySelector('#danmaku-container');
    if (!container) {
        throw new Error("Danmaku container doesn't exist.");
    }

    const manager = new DanmakuManager({
        track_height: to_px_value('10vh'),
        min_horizontal_gap: to_px_value('3vh'),
        min_vertical_gap: to_px_value('4vh'),
        max_launch_count_per_tick: 16,
        max_row_count: 100,
        alignment: 'center' as DanmakuAlignment,
        interval: 100,
    });

    const ro = new ResizeObserver(() => manager.resize());
    ro.observe(document.body);

    manager.mount(container);
    manager.push(await get_danmaku());
    manager.start_render();
    await manager.until_all_done();
    manager.unmount();
    ro.disconnect();
}

await main();