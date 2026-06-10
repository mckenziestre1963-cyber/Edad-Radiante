"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, Check } from "lucide-react";
import { toast } from "sonner";

// Mapeo de columnas comunes (es/en) → campo estándar
const FIELD_MAP: Record<string, string> = {
  name: "name", nombre: "name", "full name": "name", "nombre completo": "name", "nombre y apellido": "name", cliente: "name", contacto: "name",
  email: "email", correo: "email", "correo electronico": "email", "e-mail": "email", mail: "email",
  phone: "phone", telefono: "phone", "teléfono": "phone", celular: "phone", whatsapp: "phone", "phone number": "phone", "numero": "phone", "número": "phone", movil: "phone", "móvil": "phone", tel: "phone",
  company: "company", empresa: "company", negocio: "company", compañia: "company", "compañía": "company", organizacion: "company",
  notes: "notes", notas: "notes", mensaje: "notes", comentarios: "notes", nota: "notes", observaciones: "notes",
  source: "source", fuente: "source", origen: "source",
};

// Normaliza encabezado: minúsculas, sin acentos, sin espacios extra
function normHeader(h: string): string {
  return String(h)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

// Convierte una matriz [encabezados, ...filas] en objetos con campos estándar
function rowsToContacts(matrix: unknown[][]): Record<string, string>[] {
  if (matrix.length < 2) return [];
  const headers = (matrix[0] as unknown[]).map((h) => normHeader(String(h ?? "")));
  return matrix.slice(1).map((cells) => {
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      const field = FIELD_MAP[h] || h;
      const val = cells[i];
      if (val !== undefined && val !== null && String(val).trim() !== "") {
        row[field] = String(val).trim();
      }
    });
    return row;
  });
}

// Lee CSV o Excel (.xlsx/.xls) y devuelve los contactos. Usa xlsx (SheetJS).
async function parseFile(file: File): Promise<Record<string, string>[]> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const matrix = XLSX.utils.sheet_to_json(firstSheet, {
    header: 1,
    blankrows: false,
    defval: "",
  }) as unknown[][];
  return rowsToContacts(matrix);
}

export function CsvImport() {
  const router = useRouter();
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);

  const onFile = async (file: File) => {
    try {
      const parsed = (await parseFile(file)).filter((r) => r.name);
      setRows(parsed);
      setFileName(file.name);
      if (parsed.length === 0) {
        toast.error("No se encontraron contactos con nombre. Asegúrate de que la primera fila tenga encabezados como 'nombre', 'email', 'telefono'.");
      }
    } catch {
      toast.error("No se pudo leer el archivo. Usa CSV o Excel (.xlsx).");
    }
  };

  const doImport = async () => {
    if (rows.length === 0) return;
    setImporting(true);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts: rows.map((r) => ({ ...r, source: r.source || "import" })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`${data.imported} contactos importados${data.failed ? `, ${data.failed} fallidos` : ""}`);
      setRows([]);
      setFileName("");
      router.refresh();
    } catch {
      toast.error("Error al importar");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Importar contactos (Excel o CSV)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Sube un archivo <strong>Excel (.xlsx, .xls)</strong> o <strong>CSV</strong>.
          Detecta automáticamente columnas como nombre, email, teléfono, empresa
          (en español o inglés).
        </p>

        <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-muted/50 transition-colors">
          <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm">
            {fileName || "Haz clic para elegir un archivo Excel o CSV"}
          </span>
          <input
            type="file"
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          />
        </label>

        {rows.length > 0 && (
          <>
            <div className="rounded-lg border max-h-48 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left p-2 font-medium">Nombre</th>
                    <th className="text-left p-2 font-medium">Teléfono</th>
                    <th className="text-left p-2 font-medium">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 50).map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{r.name}</td>
                      <td className="p-2 text-muted-foreground">{r.phone || "—"}</td>
                      <td className="p-2 text-muted-foreground">{r.email || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {rows.length} contactos listos para importar
              </span>
              <Button onClick={doImport} disabled={importing} className="cursor-pointer">
                <Check className="h-4 w-4 mr-1" />
                {importing ? "Importando..." : `Importar ${rows.length}`}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
