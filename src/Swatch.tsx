import { Check, Copy, Edit3, Lock, LockOpen } from "lucide-react";
import { colorMath } from "./colorMath";

type Props = {
  color: string;
  index: number;
  locked: boolean;
  selected: boolean;
  copied: boolean;
  onSelect: () => void;
  onToggleLock: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onMove: (direction: -1 | 1) => void;
};

export function Swatch(props: Props) {
  const foreground = colorMath.readableTextColor(props.color);

  return (
    <article
      className={`swatch ${props.selected ? "selected" : ""}`}
      style={{ background: props.color, color: foreground }}
      onClick={props.onSelect}
    >
      <div className="swatch-top">
        <span>Color {props.index + 1}</span>
        <button className="swatch-pill" onClick={(event) => { event.stopPropagation(); props.onToggleLock(); }}>
          {props.locked ? <Lock size={14} /> : <LockOpen size={14} />}
          {props.locked ? "Locked" : "Lock"}
        </button>
      </div>

      <div className="swatch-value">
        <strong>{props.color}</strong>
        <span>{colorMath.approximateName(props.color)}</span>
      </div>

      <div className="swatch-actions">
        <button className="swatch-pill" onClick={(event) => { event.stopPropagation(); props.onCopy(); }}>
          {props.copied ? <Check size={14} /> : <Copy size={14} />}
          {props.copied ? "Copied" : "Copy"}
        </button>
        <button className="swatch-pill" onClick={(event) => { event.stopPropagation(); props.onEdit(); }}>
          <Edit3 size={14} /> Edit
        </button>
      </div>

      <div className="swatch-move">
        <button onClick={(event) => { event.stopPropagation(); props.onMove(-1); }}>← Left</button>
        <button onClick={(event) => { event.stopPropagation(); props.onMove(1); }}>Right →</button>
      </div>
    </article>
  );
}
