export function reducirAvatar(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      const s = 256;
      const c = document.createElement("canvas");
      c.width = c.height = s;
      const k = Math.max(s / im.naturalWidth, s / im.naturalHeight);
      const w = im.naturalWidth * k;
      const h = im.naturalHeight * k;
      c.getContext("2d")!.drawImage(im, (s - w) / 2, (s - h) / 2, w, h);
      URL.revokeObjectURL(url);
      res(c.toDataURL("image/jpeg", 0.8));
    };
    im.onerror = rej;
    im.src = url;
  });
}

