import { updateSpendingJarCategoryMapDirectAction } from "@/app/jars/actions";

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
                    <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                      {vi ? "Fallback" : "Fallback"}
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-2">
                  <form action={updateSpendingJarCategoryMapDirectAction} className="flex items-center gap-2">
                    <input type="hidden" name="categoryId" value={category.id} />
                    <select
                      name="jarId"
                      defaultValue={resolvedJarId}
                      className="rounded-md border px-2 py-1.5 text-xs"
                    >
                      {jarOptions.map((jar) => (
                        <option key={jar.id} value={jar.id}>
                          {jar.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="rounded-md border px-2 py-1.5 text-xs font-semibold hover:bg-muted"
                    >
                      {vi ? "Lưu" : "Save"}
                    </button>
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
