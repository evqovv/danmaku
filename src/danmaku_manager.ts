import DanmakuEngine, { EngineOptions } from "./danmaku_engine";
import { DanmakuOptions, StyleKey } from "./danmaku_item";
import { create_danmaku_bridge_plugin, create_manager_plugin_system } from "./lifecycle";

export interface ManagerOptions extends EngineOptions {
	interval: number;
}

type ManagerState = 'idle' | 'rendering' | 'frozen';

export default class DanmakuManager {
	public plugin_system = create_manager_plugin_system();
	private status: ManagerState = 'idle'
	private engine: DanmakuEngine;
	private render_timer: ReturnType<typeof setTimeout> | null = null;

	public constructor(
		public options: ManagerOptions
	) {
		this.engine = new DanmakuEngine(options);
	}

	public push(info: DanmakuOptions[]) {
		this.engine.add(info);
	}

	public until_all_done(): Promise<void> {
		return new Promise(res => this.plugin_system.lifecycle.finish.tap(() => res()));
	}

	public start_render(): void {
		if (this.status !== 'idle') {
			return;
		}
		const cycle = () => {
			this.render_timer = setTimeout(cycle, this.options.interval);
			this.engine.render(create_danmaku_bridge_plugin(this.plugin_system), {
				finish: this.plugin_system.lifecycle.finish,
				screen_empty: this.plugin_system.lifecycle.screen_empty
			});
		}
		cycle();
		this.status = 'rendering';
		this.plugin_system.lifecycle.start.emit();
	}

	public stop_render(): void {
		if (this.status !== 'rendering') {
			return;
		}
		if (this.render_timer) {
			clearTimeout(this.render_timer);
		}
		this.render_timer = null;
		this.status = 'idle';
		this.plugin_system.lifecycle.stop.emit();
	}

	public cancel(): void {
		this.stop_render();
		this.engine.each(d => d.cancel());
		this.engine.clear_stash();
		this.status = 'idle';
		this.plugin_system.lifecycle.cancel.emit();
	}

	public graceful_stop(): Promise<void> {
		this.stop_render();
		return new Promise(res => this.plugin_system.lifecycle.screen_empty.tap(() => {
			res();
			this.status = 'idle';
			this.plugin_system.lifecycle.stop.emit();
		}));
	}

	public graceful_cancel(): Promise<void> {
		this.stop_render();
		this.engine.clear_stash();
		return new Promise(res => this.plugin_system.lifecycle.screen_empty.tap(() => {
			res();
			this.status = 'idle';
			this.plugin_system.lifecycle.cancel.emit();
		}));
	}

	public freeze(): void {
		if (this.status !== 'rendering') {
			return;
		}
		this.stop_render();
		this.engine.each(d => d.pause());
		this.status = 'frozen';
		this.plugin_system.lifecycle.freeze.emit();
	}

	public unfreeze(): void {
		if (this.status !== 'frozen') {
			return;
		}
		this.engine.each(d => d.resume());
		this.start_render();
		this.status = 'rendering';
		this.plugin_system.lifecycle.unfreeze.emit();
	}

	public mount(node: HTMLElement): void {
		if (this.engine.container.is_mounted()) {
			this.unmount();
		}
		this.engine.container.mount(node);
		this.format();
		this.plugin_system.lifecycle.mount.emit(node);
	}

	public unmount(): void {
		if (!this.engine.container.is_mounted()) {
			return;
		}
		const p = this.engine.container.parent_node!;
		this.engine.container.unmount();
		this.plugin_system.lifecycle.mount.emit(p);
	}

	public resize(): void {
		this.engine.resize();
		this.plugin_system.lifecycle.resize.emit();
	}

	public set_style<T extends StyleKey>(key: T, value: CSSStyleDeclaration[T]): void {
		this.engine.each(d => d.set_style(key, value));
	}

	public apply_style(style: Partial<CSSStyleDeclaration>): void {
		this.engine.each(d => d.apply_style(style));
	}

	private format(): void {
		this.engine.format();
		this.plugin_system.lifecycle.format.emit();
	}
}