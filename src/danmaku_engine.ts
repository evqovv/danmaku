import DanmakuTrack from "./danmaku_track";
import DanmakuContainer from "./danmaku_container";
import collision_detection from "./collision_detection";
import DanmakuItem, { DanmakuOptions } from "./danmaku_item";
import { create_danmaku_bridge_plugin, ManagerHooks } from "./lifecycle";


export type DanmakuAlignment = "top" | "center" | "bottom";

export interface EngineOptions {
	min_vertical_gap: number;
	min_horizontal_gap: number;
	track_height: number;
	max_launch_count_per_tick: number;
	max_row_count: number;
	alignment: DanmakuAlignment;
}

export default class DanmakuEngine {
	public container = new DanmakuContainer();
	private tracks: DanmakuTrack[] = [];
	private stash: DanmakuOptions[] = [];
	private set = new Set<DanmakuItem>;

	constructor(
		private options: EngineOptions
	) { }

	public format(): void {
		this.format_tracks();
	}

	public add(info: DanmakuOptions[]): void {
		this.stash.push(...info);
	}

	public each(fn: (d: DanmakuItem) => void): void {
		for (const d of this.set) {
			fn(d);
		}
	}

	public clear_stash(): void {
		this.stash.length = 0;
	}

	public create_and_mount_danmaku(info: DanmakuOptions): DanmakuItem {
		const d = new DanmakuItem(info);
		d.mount(this.container.node);
		return d;
	}

	public render(
		bridge_plugin: ReturnType<typeof create_danmaku_bridge_plugin>,
		hooks: {
			finish: ManagerHooks['finish'],
			screen_empty: ManagerHooks['screen_empty']
		}
	): void {
		if (this.tracks.length === 0 || this.stash.length === 0) {
			return;
		}

		const attempts = Math.min(
			this.stash.length,
			this.options.max_launch_count_per_tick,
			this.tracks.length
		);

		for (let i = 0; i < attempts; i++) {
			const info = this.stash.shift();
			if (!info) {
				break
			};

			const d = this.create_and_mount_danmaku(info);

			if (d.height > this.options.track_height) {
				d.unmount();
				break;
			}

			const track = this.get_launchable_track(d);
			if (!track) {
				d.unmount();
				this.stash.unshift(info);
				continue;
			}

			const cleanup = () => {
				d.detach();
				this.set.delete(d);
				d.unmount();
			};

			const is_screen_empty = () => {
				if (this.set.size === 0) {
					hooks.screen_empty.emit();
				}
			};

			const is_finished = () => {
				if (this.set.size === 0 && this.stash.length === 0) {
					hooks.finish.emit();
				}
			}

			d.plugin_system.use(bridge_plugin);
			d.plugin_system.use({
				end: () => {
					cleanup();
					is_screen_empty();
					is_finished();
				},
				cancel: () => {
					cleanup();
					is_screen_empty();
					is_finished();
				}
			});
			d.attach(track, this.options.alignment);
			d.play();
			this.set.add(d);

			if (info.loop) {
				this.stash.push(info);
			}
		}
	}

	public resize(): void {
		this.each(d => d.resize());
		const old_h = this.container.height;
		this.container.resize();
		this.resize_tracks(old_h);
	}

	private get_launchable_track(cur: DanmakuItem): DanmakuTrack | null {
		for (const track of this.tracks) {
			const prev = track.peek_last();
			if (!prev ||
				collision_detection(
					prev,
					cur,
					this.options.min_horizontal_gap
				)) {
				return track;
			}
		}
		return null;
	}

	private format_tracks(): void {
		const { max_row_count, track_height, min_vertical_gap } = this.options;
		const { height } = this.container;
		const rows = Math.min(
			max_row_count,
			Math.floor((height + min_vertical_gap) / (track_height + min_vertical_gap))
		);

		const row_step = track_height + min_vertical_gap;
		const total_height = (rows - 1) * row_step + track_height;
		const remaining_gap = Math.max(0, height - total_height);
		const start_y = remaining_gap / 2;
		for (let i = 0; i < rows; i++) {
			this.tracks.push(
				new DanmakuTrack(start_y + i * row_step, this.options.track_height)
			);
		}
	}

	private resize_tracks(old_h: number): void {
		const new_h = this.container.height;
		if (new_h === old_h) {
			return;
		}
		const is_shrinking = new_h < old_h;
		is_shrinking ? this.shrink_tracks(new_h) : this.expand_tracks(new_h);
	}

	private shrink_tracks(limit: number): void {
		for (let i = this.tracks.length - 1; i >= 0; i--) {
			const t = this.tracks[i];
			if (t.bottom > limit) {
				t.cancel();
				this.tracks.splice(i, 1);
			}
		}
	}

	private expand_tracks(limit: number): void {
		if (this.tracks.length === 0) {
			this.format_tracks();
			return;
		}
		const last = this.tracks[this.tracks.length - 1];
		let top = last.bottom + this.options.min_vertical_gap;
		while (top + this.options.track_height <= limit) {
			this.tracks.push(new DanmakuTrack(top, this.options.track_height));
			top += this.options.track_height + this.options.min_vertical_gap;
		}
	}
}