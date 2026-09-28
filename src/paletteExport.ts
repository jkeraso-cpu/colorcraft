import type { Roles } from "./paletteUtils";

const downloadBlob = (content: BlobPart, filename: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const paletteExport = {
  hex(colors: string[]) {
    return colors.join("\n");
  },

  css(colors: string[], roles: Roles) {
    const colorVars = colors.map((color, index) => `  --color-${index + 1}: ${color};`).join("\n");
    return `:root {\n${colorVars}\n  --background: ${roles.background};\n  --surface: ${roles.surface};\n  --primary: ${roles.primary};\n  --secondary: ${roles.secondary};\n  --accent: ${roles.accent};\n  --text: ${roles.text};\n}`;
  },

  tailwind(roles: Roles) {
    return `colors: {\n  background: '${roles.background}',\n  surface: '${roles.surface}',\n  primary: '${roles.primary}',\n  secondary: '${roles.secondary}',\n  accent: '${roles.accent}',\n  text: '${roles.text}',\n}`;
  },

  json(name: string, colors: string[], harmony: string, roles: Roles) {
    return JSON.stringify({ name, colors, harmony, roles }, null, 2);
  },

  downloadText(content: string, filename: string, type = "text/plain") {
    downloadBlob(content, filename, type);
  },

  async downloadPng(name: string, colors: string[], branding = true) {
    const width = 1600;
    const height = 900;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas unavailable.");

    context.fillStyle = "#F4F6FA";
    context.fillRect(0, 0, width, height);
    context.fillStyle = "#111827";
    context.font = "700 54px Arial, sans-serif";
    context.fillText(name, 90, 110);
    context.fillStyle = "#64748B";
    context.font = "500 24px Arial, sans-serif";
    context.fillText("ColorCraft palette", 92, 154);

    const x = 90;
    const y = 220;
    const stripWidth = width - 180;
    const swatchWidth = stripWidth / colors.length;
    const swatchHeight = 500;

    colors.forEach((color, index) => {
      context.fillStyle = color;
      context.fillRect(x + index * swatchWidth, y, swatchWidth + 1, swatchHeight);
      context.fillStyle = "#111827";
      context.font = "600 22px monospace";
      context.fillText(color, x + index * swatchWidth + 16, y + swatchHeight + 48);
    });

    if (branding) {
      context.fillStyle = "#64748B";
      context.font = "600 20px Arial, sans-serif";
      context.fillText("ColorCraft · Build palettes that actually work.", 90, height - 55);
    }

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 1));
    if (!blob) throw new Error("PNG export failed.");
    downloadBlob(blob, "colorcraft-palette.png", "image/png");
  },
};
