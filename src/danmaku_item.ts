import { DanmakuAlignment } from "./danmaku_engine";
import DanmakuTrack from "./danmaku_track";
import { create_danmaku_plugin_system } from "./lifecycle";
import { next_frame, now } from "./utils";

export interface DanmakuOptions {
    duration: number;
    style: Partial<CSSStyleDeclaration>;
    loop: boolean;
    direction: DanmakuDirection;
    node: Node[];
    clone_node: boolean;
}

export type DanmakuStatus = 'idle' | 'running' | 'paused';

export type DanmakuDirection = 'to_left' | 'to_right';

export type StyleKey = keyof Omit<CSSStyleDeclaration, 'length' | 'parentRule'>;

export default class DanmakuItem {
    public constructor(public options: DanmakuOptions) {
        this.apply_style(DanmakuItem.init_style);
        this.apply_style(options.style)
        this.duration = options.duration;
        this.direction = options.direction;
        for (const node of options.node) {
            this.node.appendChild(options.clone_node ? node.cloneNode(true) : node);
        }
        this.node.addEventListener('transitionend', () => this.plugin_system.lifecycle.end.emit(this));
    }

    public play(): void {
        if (this.status !== 'idle') {
            return;
        }
        this.recorder.start_time = now();
        this.set_style('transition', `transform ${this.duration}ms linear`);
        this.set_style('transform', `translateX(${this.destination}px)`);
        this.status = 'running';
        this.plugin_system.lifecycle.start.emit(this);
    }

    public pause(): void {
        if (this.status !== 'running') {
            return;
        }
        this.recorder.last_paused_at = now();
        const is_to_left = this.direction === 'to_left';
        const negative = is_to_left ? -1 : 1;
        const moved_dis = this.get_moved_distance();
        this.set_style('transitionDuration', '0ms');
        this.set_style('transform', `translateX(${negative * moved_dis}px)`);
        this.status = 'paused';
        this.plugin_system.lifecycle.pause.emit(this);
    }

    public resume(): void {
        if (this.status !== 'paused') {
            return;
        }
        this.recorder.paused_duration += now() - this.recorder.last_paused_at;
        const remaining_time = this.duration - this.get_elapsed_time();
        this.recorder.last_paused_at = 0;
        this.set_style('transitionDuration', `${remaining_time}ms`);
        this.set_style('transform', `translateX(${this.destination}px)`);
        this.status = 'running';
        this.plugin_system.lifecycle.resume.emit(this);
    }

    public cancel(): void {
        if (this.status === 'idle') {
            return;
        }
        this.set_style('transition', '');
        this.set_style('transform', '');
        Object.assign(this.recorder, {
            start_time: 0,
            last_paused_at: 0,
            paused_duration: 0,
        });
        this.status = 'idle';
        this.plugin_system.lifecycle.cancel.emit(this);
    }

    public resize(): void {
        if (!this.container_node) {
            throw new Error('This item is not mounted yet.');
        }

        const is_to_left = this.direction === 'to_left';
        const negative = is_to_left ? -1 : 1;
        const { width: cw, height: ch } = this.container_node.getBoundingClientRect();

        const et = this.get_elapsed_time();
        const total_dis = cw + this.width;
        const prog = et / this.duration;
        const new_x = negative * total_dis * prog;
        const remaining_time = this.duration - et;
        const dest = negative * total_dis;

        this.set_style('transitionDuration', '0ms');
        this.set_style('transform', `translateX(${new_x}px)`);

        if (this.status === 'running') {
            next_frame(
                () => {
                    this.set_style('transitionDuration', `${remaining_time}ms`);
                    this.set_style('transform', `translateX(${dest}px)`);
                }
            );
        }

        Object.assign(this, {
            container_width: cw,
            container_height: ch,
            destination: dest,
        });
    }

    public get_elapsed_time(): number {
        switch (this.status) {
            case 'idle': return 0;
            case 'running': return now() - this.recorder.start_time - this.recorder.paused_duration;
            case 'paused': return this.recorder.last_paused_at - this.recorder.start_time - this.recorder.paused_duration;
            default: throw new Error('Unexpected status.');
        }
    }

    public get_moved_distance(): number {
        return this.get_elapsed_time() * this.speed;
    }

    public is_mounted(): boolean {
        return this.container_node !== null;
    }

    public mount(node: HTMLElement): void {
        this.unmount();
        this.container_node = node;
        this.container_node.appendChild(this.node);
        this.format();
    }

    public unmount(): void {
        if (this.node.parentNode) {
            this.node.parentNode.removeChild(this.node);
        }
        this.container_node = null;
    }

    public set_style<T extends StyleKey>(key: T, value: CSSStyleDeclaration[T]): void {
        this.node.style[key] = value;
    }

    public apply_style(style: Partial<CSSStyleDeclaration>): void {
        Object.assign(this.node.style, style);
    }

    public attach(track: DanmakuTrack, alignment: DanmakuAlignment): void {
        if (this.track !== null) {
            return;
        }
        track.attach(this, alignment);
    }

    public detach(): void {
        if (this.track !== null) {
            this.track.detach(this);
            this.track = null;
        }
    }

    private format(): void {
        if (!this.container_node) {
            throw new Error('This item is not mounted yet.');
        }

        const { width: w, height: h } = this.node.getBoundingClientRect();
        const { width: cw, height: ch } = this.container_node.getBoundingClientRect();
        const is_to_left = this.direction === 'to_left';
        const negative = is_to_left ? -1 : 1;
        Object.assign(this, {
            width: w,
            height: h,
            container_width: cw,
            container_height: ch,
            total_distance: cw + w,
            speed: (cw + w) / this.duration,
            destination: negative * (cw + w),
        });

        this.set_style(
            is_to_left ? 'right' : 'left',
            `${-this.width}px`
        );
    }

    public width = 0;

    public height = 0;

    public plugin_system = create_danmaku_plugin_system();

    public container_width = 0;

    public container_height = 0;

    public duration = 0;

    public speed = 0;

    public direction: DanmakuDirection;

    private destination = 0;

    private status: DanmakuStatus = 'idle';

    private node: HTMLDivElement = document.createElement('div');

    private container_node: HTMLElement | null = null;

    private track: DanmakuTrack | null = null;

    private recorder = {
        start_time: 0,
        last_paused_at: 0,
        paused_duration: 0,
    };

    private static readonly init_style: Partial<CSSStyleDeclaration> = {
        'position': 'absolute',
        'whiteSpace': 'nowrap',
        'display': 'flex',
        'alignItems': 'center',
        'willChange': 'transform',
    };
}