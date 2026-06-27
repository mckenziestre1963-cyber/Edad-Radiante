import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { crmSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

const GRAPH = "https://graph.facebook.com/v19.0";

type Question = { key: string; label: string; type: string; options?: string[] };
type Form = {
  id: string;
  name: string;
  status: string;
  pageId: string;
  pageName: string;
  questions: Question[];
};

export async function GET() {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "META_ACCESS_TOKEN no configurado en el servidor" },
      { status: 500 }
    );
  }

  try {
    let pages: Array<{ id: string; name: string; access_token: string }> = [];

    const directPageId = process.env.META_PAGE_ID;
    if (directPageId) {
      pages = [{ id: directPageId, name: "Edad Radiante", access_token: token }];
    } else {
      const pagesRes = await fetch(
        `${GRAPH}/me/accounts?fields=name,id,access_token&limit=100&access_token=${token}`
      );
      const pagesData = (await pagesRes.json()) as {
        data?: Array<{ id: string; name: string; access_token: string }>;
        error?: { message: string; code?: number };
      };
      if (!pagesData.error && pagesData.data && pagesData.data.length > 0) {
        pages = pagesData.data;
      }
    }

    pages = pages.map((p) => ({
      ...p,
      access_token: p.access_token || token,
    }));

    const formsPerPage = await Promise.all(
      pages.map(async (page) => {
        try {
          const res = await fetch(
            `${GRAPH}/${page.id}/leadgen_forms?fields=id,name,status,questions&limit=100&access_token=${page.access_token}`
          );
          const data = (await res.json()) as {
            data?: Array<{
              id: string;
              name: string;
              status: string;
              questions?: Array<{
                key: string;
                label: string;
                type: string;
                options?: Array<{ value: string }>;
              }>;
            }>;
          };
          return (data.data ?? []).map(
            (f): Form => ({
              id: f.id,
              name: f.name,
              status: f.status,
              pageId: page.id,
              pageName: page.name,
              questions: (f.questions ?? []).map((q) => ({
                key: q.key,
                label: q.label,
                type: q.type,
                options: q.options?.map((o) => o.value),
              })),
            })
          );
        } catch {
          return [] as Form[];
        }
      })
    );

    const forms = formsPerPage.flat();

    const enabledSetting = db
      .select()
      .from(crmSettings)
      .where(eq(crmSettings.key, "enabled_forms"))
      .get();
    const enabledIds: string[] = enabledSetting
      ? JSON.parse(enabledSetting.value)
      : [];

    const fpSetting = db
      .select()
      .from(crmSettings)
      .where(eq(crmSettings.key, "form_pipelines"))
      .get();
    const formPipelines: Record<string, string> = fpSetting
      ? JSON.parse(fpSetting.value)
      : {};

    return NextResponse.json({
      pages: pages.map((p) => ({ id: p.id, name: p.name })),
      forms,
      enabledIds,
      formPipelines,
      total: forms.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Error: ${error instanceof Error ? error.message : "desconocido"}` },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let body: { enabledIds?: string[]; formPipelines?: Record<string, string> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const enabledIds = Array.isArray(body.enabledIds) ? body.enabledIds : [];

  db.insert(crmSettings)
    .values({ key: "enabled_forms", value: JSON.stringify(enabledIds) })
    .onConflictDoUpdate({
      target: crmSettings.key,
      set: { value: JSON.stringify(enabledIds) },
    })
    .run();

  if (body.formPipelines && typeof body.formPipelines === "object") {
    db.insert(crmSettings)
      .values({ key: "form_pipelines", value: JSON.stringify(body.formPipelines) })
      .onConflictDoUpdate({
        target: crmSettings.key,
        set: { value: JSON.stringify(body.formPipelines) },
      })
      .run();
  }

  return NextResponse.json({ success: true, enabledIds });
}
