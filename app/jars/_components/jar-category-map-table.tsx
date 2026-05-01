import { updateSpendingJarCategoryMapDirectAction } from "@/app/jars/actions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type CategoryRow = {
  id: string;
  name: string;
};

type JarOption = {
  id: string;
  name: string;
  slug: string;
};

type MappingRow = {
  categoryId: string;
  jarId: string;
  resolvedFromFallback: boolean;
};

type Props = {
  categories: CategoryRow[];
  jarOptions: JarOption[];
  mappings: Map<string, MappingRow>;
  fallbackJarId: string | null;
  vi: boolean;
};

export function JarCategoryMapTable({
  categories,
  jarOptions,
  mappings,
  fallbackJarId,
  vi,
}: Props) {
  if (categories.length === 0) {
    return (
      <div className="rounded-lg border p-3 text-sm text-muted-foreground">
        {vi ? "Không có danh mục chi tiêu để map." : "No expense categories to map."}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/40">
          <tr className="text-left">
            <th className="px-3 py-2 font-semibold">{vi ? "Danh mục" : "Category"}</th>
            <th className="px-3 py-2 font-semibold">{vi ? "Hũ hiện tại" : "Current jar"}</th>
            <th className="px-3 py-2 font-semibold">{vi ? "Đổi hũ" : "Reassign"}</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => {
            const mapping = mappings.get(category.id);
            const resolvedJarId = mapping?.jarId ?? fallbackJarId ?? "";

            return (
              <tr key={category.id} className="border-t align-middle">
                <td className="px-3 py-2 font-medium">{category.name}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {jarOptions.find((jar) => jar.id === resolvedJarId)?.name ??
                    (vi ? "Chưa map" : "Unmapped")}
                  {mapping?.resolvedFromFallback ? (
                    <Badge variant="warning" className="ml-2 text-[10px] px-1.5 py-0">
                      {vi ? "Tự gán tạm" : "Auto-assigned"}
                    </Badge>
                  ) : null}
                </td>
                <td className="px-3 py-2">
                  <form action={updateSpendingJarCategoryMapDirectAction} className="flex items-center gap-2">
                    <input type="hidden" name="categoryId" value={category.id} />
                    <Select name="jarId" defaultValue={resolvedJarId}>
                      <SelectTrigger className="h-8 w-[140px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {jarOptions.map((jar) => (
                          <SelectItem key={jar.id} value={jar.id} className="text-xs">
                            {jar.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs px-3 font-semibold"
                    >
                      {vi ? "Lưu" : "Save"}
                    </Button>
                  </form>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
