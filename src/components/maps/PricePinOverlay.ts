export type PinOverlay = google.maps.OverlayView & {
  setSelected(v: boolean): void;
  getAnchorRect(): DOMRect | null;
};
type PinOverlayCtor = new (
  pos: google.maps.LatLngLiteral,
  label: string,
  onClick: () => void,
  offsetY?: number,
) => PinOverlay;

export function buildOverlayClass(): PinOverlayCtor {
  class PricePinOverlay extends google.maps.OverlayView {
    private el: HTMLDivElement | null = null;
    private _selected = false;

    constructor(
      private pos: google.maps.LatLngLiteral,
      private label: string,
      private handleClick: () => void,
      private offsetY = 0,
    ) {
      super();
    }

    onAdd() {
      this.el = document.createElement("div");
      this.el.style.position = "absolute";
      this.el.style.cursor = "pointer";
      this.el.style.userSelect = "none";
      this.el.tabIndex = 0;
      this.el.setAttribute("role", "button");
      this.el.setAttribute("aria-label", this.label);
      this.el.addEventListener("mouseenter", this.handleClick);
      this.el.addEventListener("keydown", this.handleKey);
      this.render();
      this.el.addEventListener("click", this.handleClick);
      this.getPanes()?.overlayMouseTarget.appendChild(this.el);
    }

    private handleKey = (event: KeyboardEvent) => { if(event.key === "Enter" || event.key === " ") { event.preventDefault(); this.handleClick(); } };

    setSelected(v: boolean) {
      this._selected = v;
      this.render();
    }

    private render() {
      if (!this.el) return;
      const bg = this._selected ? "#285f9c" : "#4896b6";
      this.el.innerHTML = `
        <div style="position:relative;transform:translate(-50%,-100%);padding-bottom:6px">
          <div style="
            background:${bg};color:white;padding:3px 9px;border-radius:6px;
            font-size:12px;font-family:Montserrat,sans-serif;font-weight:500;
            white-space:nowrap;box-shadow:0 2px 8px rgba(13,33,56,0.22);
          ">${this.label}</div>
          <div style="
            position:absolute;bottom:1px;left:50%;transform:translateX(-50%);
            width:0;height:0;
            border-left:5px solid transparent;border-right:5px solid transparent;
            border-top:5px solid ${bg};
          "></div>
        </div>`;
    }

    draw() {
      const proj = this.getProjection();
      const pt = proj?.fromLatLngToDivPixel(new google.maps.LatLng(this.pos));
      if (pt && this.el) {
        this.el.style.left = `${pt.x}px`;
        this.el.style.top = `${pt.y + this.offsetY}px`;
      }
    }

    /**
     * Real on-screen position of the rendered bubble, post-transform. Used
     * to anchor the React-rendered popup card, which lives outside Google's
     * own overlay pane (so `fromLatLngToDivPixel` alone isn't enough — that
     * pane carries its own CSS transform that this sidesteps entirely by
     * reading the already-correct rendered position directly).
     */
    getAnchorRect(): DOMRect | null {
      return this.el?.getBoundingClientRect() ?? null;
    }

    onRemove() {
      if (this.el) {
        this.el.removeEventListener("click", this.handleClick);
        this.el.removeEventListener("mouseenter", this.handleClick);
        this.el.removeEventListener("keydown", this.handleKey);
        this.el.remove();
        this.el = null;
      }
    }
  }

  return PricePinOverlay as unknown as PinOverlayCtor;
}
