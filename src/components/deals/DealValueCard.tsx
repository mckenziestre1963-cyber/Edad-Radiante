"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DollarSign, Pencil } from "lucide-react";
import { formatCurrency } from "@/lib/constants";
import { toast } from "sonner";

export function DealValueCard({
  dealId,
  value,
}: {
  dealId: string;
  value: number;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState((value / 100).toString());
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const cents = Math.round(parseFloat(input || "0") * 100);
    if (isNaN(cents) || cents < 0) {
      toast.error("Valor inválido");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/deals/${dealId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: cents }),
      });
      if (!res.ok) throw new Error();
      toast.success("Valor actualizado");
      setEditing(false);
      router.refresh();
    } catch {
      toast.error("Error al guardar el valor");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <DollarSign className="h-4 w-4" />
          Valor
        </div>
        {editing ? (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              step="0.01"
              min="0"
              value={input}
              autoFocus
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
                if (e.key === "Escape") setEditing(false);
              }}
              className="h-9"
            />
            <button
              onClick={save}
              disabled={saving}
              className="text-sm font-medium text-primary cursor-pointer disabled:opacity-50"
            >
              {saving ? "..." : "Guardar"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setInput((value / 100).toString());
              setEditing(true);
            }}
            className="group flex items-center gap-2 cursor-pointer"
            title="Clic para editar el valor"
          >
            <span className="text-xl font-bold text-primary">
              {formatCurrency(value)}
            </span>
            <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
      </CardContent>
    </Card>
  );
}
