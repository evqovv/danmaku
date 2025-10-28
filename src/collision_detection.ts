import type DanmakuItem from "./danmaku_item";

function collision_detection_impl(prev: DanmakuItem, cur: DanmakuItem, min_gap: number): boolean {
    const pv = prev.speed;
    const cv = cur.speed;
    const dv = cv - pv;

    const moved = prev.get_moved_distance();
    const gap = moved - prev.width;
    if (gap < 0) {
        return false;
    }

    if (pv >= cv) {
        return gap >= min_gap;
    }

    const remain_dis = prev.container_width - gap + min_gap;
    const remain_time = remain_dis / pv;
    const catchup_time = (gap - min_gap) / dv;

    return catchup_time > remain_time;
}

export default function collision_detection(prev: DanmakuItem, cur: DanmakuItem, min_gap: number): boolean {
    return collision_detection_impl(prev, cur, min_gap);
}