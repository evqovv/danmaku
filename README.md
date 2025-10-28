# Danmaku  

A lightweight ESM-based danmaku library.  

## Usage:  

* ### Step 1:  

    ```ts
    const container: HTMLDivElement | null = document.querySelector('#danmaku-container');
    if (!container) {
        throw new Error("Danmaku container doesn't exist.");
    }
    ```  

    In the first place, you always need to get an element as the danmaku container (most often a `<div>`) using `document.getElementById()` or `document.querySelector()`.  

* ### Step 2:  

    ```ts
    const manager = new DanmakuManager(info);
    ```  

    Create a `DanmakuManager` object.  

    This is the parameter type for this `DanmakuManager` constructor:  

    ```ts
    interface ManagerOptions {
        min_vertical_gap: number;
	    min_horizontal_gap: number;
        track_height: number;
        max_launch_count_per_tick: number;
        max_row_count: number;
        alignment: DanmakuAlignment;
        interval: number;
    }
    ```  

    * min_vertical_gap: It determines the minimum vertical spacing of danmaku rows.  

    * min_horizontal_gap: It determines the minimum horizontal spacing of danmakus (e.g. the spacing between the previous danmaku and the subsequent one).  

    * track_height: It determines the height of one danmaku row.  

    * max_launch_count_per_tick: The maximum number of launching danmakus per tick.  

    * max_row_count: It determines the maximum number of danmaku rows.  

    * alignment: It determines the position where the content of a danmaku should be placed.  

        * top: The content will be placed at the top of the row.  

        * center: The content will be placed at the middle of the row.  

        * bottom: The content will be placed at the bottom of the row.  

    * interval: Interval time for each rendering (e.g. each tick).  

* ### Step 3:  

    ```ts
    manager.mount(container)；
    ```  

    Calling mount() method to mount the danmaku system to the container that we got before.  

* ### Step 4:  

    ```ts
    manager.push(danmakus);
    ```  

    `push()` accepts an array whose type is `DanmakuOptions[]` from which each of elements describe a danmaku's behavior.  

    ```ts
    interface DanmakuOptions {
    duration: number;
    style: Partial<CSSStyleDeclaration>;
    loop: boolean;
    direction: DanmakuDirection;
    node: Node[];
    clone_node: boolean;
    }
    ```  

    * duration: It specifies the duration of the danmaku from one side to the other.  

    * style: You can specifies the style of this container which is a wrapper containing all content you gave of this danmaku.  

    * loop: After playing done, drop its information or keep it for the next playing.  

        * true: Keep it for the next playing.  

        * false: Drop it.  

    * direction: It specifies the horizontal movement direction of this danmaku.  

    * node: All content you want to be wrapped.  

    * clone_node: Copy the nodes you provided or not.  

* ### Step 5:  

    ```ts
    manager.start_render();
    ```  

    It starts rendering danmaku.  

* ### Something else:  

    If you want a promise which will be settled when all danmakus you provided have been done with rendering, call `manager.manager.until_all_done()` which returns a promise that will be settled when all done with rendering.