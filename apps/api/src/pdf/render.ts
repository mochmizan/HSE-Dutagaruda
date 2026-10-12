import { HTTPException } from "hono/http-exception";

const GOTENBERG_URL = process.env.GOTENBERG_URL ?? "http://gotenberg:3000";

export interface RenderOptions {
  landscape: boolean;
}

export async function renderPdf(html: string, opts: RenderOptions): Promise<Uint8Array> {
  const margin = opts.landscape ? "10mm" : "12mm";
  const form = new FormData();
  form.append("files", new Blob([html], { type: "text/html" }), "index.html");
  form.append("paperWidth", "8.27in");
  form.append("paperHeight", "11.69in");
  form.append("marginTop", margin);
  form.append("marginBottom", margin);
  form.append("marginLeft", margin);
  form.append("marginRight", margin);
  form.append("landscape", String(opts.landscape));
  form.append("printBackground", "true");
  form.append("preferCssPageSize", "true");
  form.append("waitForSelector", "#pdf-ready");
  form.append("waitDelay", "300ms");
  form.append("failOnResourceLoadingFailed", "true");
  let res: Response;
  try {
    res = await fetch(`${GOTENBERG_URL}/forms/chromium/convert/html`, {
      method: "POST",
      body: form,
    });
  } catch {
    throw new HTTPException(502, { message: "Layanan Gotenberg tidak dapat dihubungi." });
  }
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 200);
    throw new HTTPException(502, { message: `Render PDF gagal (${res.status}): ${detail}` });
  }
  return new Uint8Array(await res.arrayBuffer());
}
