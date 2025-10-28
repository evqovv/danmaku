export async function load_font(name: string, size: string): Promise<void> {
    await document.fonts.load(`${size} "${name}"`);
}

export async function load_text(url: string): Promise<string> {
    const response: Response = await fetch(url);
    if (!response.ok) {
        throw new Error("Failed to load resources.");
    }

    return (await response.text());
}

export function random_duration(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function assert_window_available(): void {
    if (typeof window === "undefined") {
        throw new Error("The 'window' object doesn't exist.");
    }
}

function vw_to_px(v: number): number {
    assert_window_available();
    return (v / 100) * window.innerWidth;
}

function vh_to_px(v: number): number {
    assert_window_available();
    return (v / 100) * window.innerHeight;
}

function rem_to_px(v: number): number {
    return v * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

export function to_px_value(measure: string): number {
    if (measure.endsWith("px")) {
        return parseFloat(measure);
    } else if (measure.endsWith("vw")) {
        return vw_to_px(parseFloat(measure));
    } else if (measure.endsWith("vh")) {
        return vh_to_px(parseFloat(measure));
    } else if (measure.endsWith("rem")) {
        return rem_to_px(parseFloat(measure));
    } else {
        throw new Error(`Unknown unit: ${measure}.`);
    }
}

export function to_px(measure: string): string {
    return to_px_value(measure) + 'px';
}