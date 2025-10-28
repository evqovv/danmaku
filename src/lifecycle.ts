import DanmakuItem from "./danmaku_item";

export class SyncHook<T extends any[] = []> {
	private callbacks: Array<(...args: T) => void> = [];

	public tap(cb: (...args: T) => void): this {
		this.callbacks.push(cb);
		return this;
	}

	public untap(target: (...args: T) => void): this {
		this.callbacks = this.callbacks.filter(cb => cb !== target);
		return this;
	}

	public emit(...args: T): void {
		[...this.callbacks].forEach(cb => cb(...args));
	}
}

export class PluginSystem<T extends Record<string, SyncHook<any>>> {
	public constructor(public lifecycle: T) { }

	public use(plugin: { [K in keyof T]?: T[K]['emit'] }): void {
		for (const key in plugin) {
			const hook = this.lifecycle[key];
			const fn = plugin[key];
			if (hook && fn) {
				hook.tap(fn);
			}
		}
	}
}

export type DanmakuHooks = {
	start: SyncHook<[DanmakuItem]>,
	end: SyncHook<[DanmakuItem]>,
	pause: SyncHook<[DanmakuItem]>,
	resume: SyncHook<[DanmakuItem]>,
	cancel: SyncHook<[DanmakuItem]>,
	mount: SyncHook<[DanmakuItem]>,
	unmount: SyncHook<[DanmakuItem]>,
	format: SyncHook<[DanmakuItem]>,
	resize: SyncHook<[DanmakuItem]>,
};

export type ManagerHooks = {
	$start: SyncHook<[DanmakuItem]>,
	$end: SyncHook<[DanmakuItem]>,
	$pause: SyncHook<[DanmakuItem]>,
	$resume: SyncHook<[DanmakuItem]>,
	$cancel: SyncHook<[DanmakuItem]>,
	$mount: SyncHook<[DanmakuItem]>,
	$unmount: SyncHook<[DanmakuItem]>,
	$format: SyncHook<[DanmakuItem]>,
	$resize: SyncHook<[DanmakuItem]>,

	start: SyncHook<[]>;
	stop: SyncHook<[]>;
	cancel: SyncHook<[]>;
	freeze: SyncHook<[]>;
	unfreeze: SyncHook<[]>;
	mount: SyncHook<[HTMLElement]>;
	unmount: SyncHook<[HTMLElement]>;
	format: SyncHook<[]>,
	resize: SyncHook<[]>,
	finish: SyncHook<[]>,
	screen_empty: SyncHook<[]>,
}

export function create_danmaku_plugin_system(): PluginSystem<DanmakuHooks> {
	return new PluginSystem({
		start: new SyncHook<[DanmakuItem]>,
		end: new SyncHook<[DanmakuItem]>,
		pause: new SyncHook<[DanmakuItem]>,
		resume: new SyncHook<[DanmakuItem]>,
		cancel: new SyncHook<[DanmakuItem]>,
		mount: new SyncHook<[DanmakuItem]>,
		unmount: new SyncHook<[DanmakuItem]>,
		format: new SyncHook<[DanmakuItem]>,
		resize: new SyncHook<[DanmakuItem]>,
	})
}

export function create_manager_plugin_system(): PluginSystem<ManagerHooks> {
	return new PluginSystem({
		$start: new SyncHook<[DanmakuItem]>,
		$end: new SyncHook<[DanmakuItem]>,
		$pause: new SyncHook<[DanmakuItem]>,
		$resume: new SyncHook<[DanmakuItem]>,
		$cancel: new SyncHook<[DanmakuItem]>,
		$mount: new SyncHook<[DanmakuItem]>,
		$unmount: new SyncHook<[DanmakuItem]>,
		$format: new SyncHook<[DanmakuItem]>,
		$resize: new SyncHook<[DanmakuItem]>,

		start: new SyncHook<[]>,
		stop: new SyncHook<[]>,
		cancel: new SyncHook<[]>,
		freeze: new SyncHook<[]>,
		unfreeze: new SyncHook<[]>,
		mount: new SyncHook<[HTMLElement]>,
		unmount: new SyncHook<[HTMLElement]>,
		format: new SyncHook<[]>,
		resize: new SyncHook<[]>,
		finish: new SyncHook<[]>,
		screen_empty: new SyncHook<[]>,
	});
}


export function create_danmaku_bridge_plugin(m: ReturnType<typeof create_manager_plugin_system>) {
	const plugin = {} as Record<string, unknown>;
	for (const key of Object.keys(m.lifecycle) as (Array<keyof typeof m.lifecycle>)) {
		if ((key as string).startsWith('$')) {
			const short_name = key.slice(1);
			plugin[short_name] = (...args: Array<unknown>) => {
				(m.lifecycle[key] as any).emit(...args);
			}
		}
	}
	return plugin;
}