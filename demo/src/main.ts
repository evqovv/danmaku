import { DanmakuAlignment } from "@danmaku/danmaku_engine";
import { DanmakuOptions } from "@danmaku/danmaku_item";
import DanmakuManager, { ManagerOptions } from "@danmaku/danmaku_manager";
import { next_frame } from "@danmaku/utils";
import { load_font, load_text, random_duration, to_px, to_px_value } from "./utils";

async function get_danmaku(): Promise<DanmakuOptions[]> {
	const ret: DanmakuOptions[] = [];
	const list = (await load_text('/assets/text.txt')).split('\n');
	for (const text of list) {
		ret.push({
			duration: random_duration(7000, 14000),
			node: [document.createTextNode(text)],
			style: {
				fontSize: to_px('3vh'),
				fontWeight: 'bold',
				color: '#fff7ea',
				maxHeight: to_px('8vh'),
			},
			loop: true,
			direction: 'to_left',
			clone_node: true,
		})
	}
	return ret;
}


async function main() {
	const container: HTMLElement | null = document.querySelector('#danmaku-container');
	if (!container) {
		throw new Error("Danmaku container doesn't exist.");
	}

	const manager = new DanmakuManager({
		track_height: to_px_value('8vh'),
		min_horizontal_gap: to_px_value('3vh'),
		min_vertical_gap: to_px_value('4vh'),
		max_launch_count_per_tick: 16,
		max_row_count: 100,
		alignment: 'center' as DanmakuAlignment,
		interval: 100,
	});

	manager.mount(container);
	manager.push(await get_danmaku());
	manager.start_render();
	await manager.until_all_done();
}

await main();