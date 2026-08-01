"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/providers/i18n-provider";
import { cn } from "@/lib/utils";

type Category = {
  id: string;
  name: string;
};

type Jar = {
  id: string;
  name: string;
};

type Assignment = {
  categoryId: string;
  jarId: string;
  lastUpdated?: string;
};

type Props = {
  categories: Category[];
  jars: Jar[];
  currentAssignments: Assignment[];
  onAssign: (categoryId: string, jarId: string) => void;
  onUnassign: (categoryId: string) => void;
  className?: string;
};

export function JarCategoryAssignmentMatrix({
  categories,
  jars,
  currentAssignments,
  onAssign,
  onUnassign,
  className,
}: Props) {
  const { t } = useI18n();
  const [search, setSearch] = React.useState("");
  const [selectedJarId, setSelectedJarId] = React.useState<string | null>(null);

  const assignmentMap = new Map(
    currentAssignments.map((a) => [a.categoryId, a])
  );

  const filteredCategories = React.useMemo(() => {
    if (!search) return categories;
    return categories.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [categories, search]);

  const handleBulkAssign = () => {
    if (selectedJarId) {
      filteredCategories.forEach((category) => {
        if (!assignmentMap.has(category.id)) {
          onAssign(category.id, selectedJarId);
        }
      });
    }
  };

  const handleClearAll = () => {
    filteredCategories.forEach((category) => {
      if (assignmentMap.has(category.id)) {
        onUnassign(category.id);
      }
    });
  };

  return (
    <Card className={cn("border-border/60", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{t("jars.setup.rules.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and bulk actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <Label htmlFor="category-search" className="sr-only">
              {t("common.search")}
            </Label>
            <Input
              id="category-search"
              type="text"
              placeholder={t("common.search_placeholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select
              value={selectedJarId || ""}
              onValueChange={(value) => setSelectedJarId(value || null)}
            >
              <SelectTrigger className="w-[180px] rounded-xl">
                <SelectValue placeholder={t("jars.setup.rules.select_jar")} />
              </SelectTrigger>
              <SelectContent>
                {jars.map((jar) => (
                  <SelectItem key={jar.id} value={jar.id}>
                    {jar.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleBulkAssign}
              disabled={!selectedJarId}
              variant="outline"
              size="sm"
              className="rounded-xl"
            >
              {t("common.assign_all")}
            </Button>
            <Button
              onClick={handleClearAll}
              variant="ghost"
              size="sm"
              className="rounded-xl"
            >
              {t("common.clear_all")}
            </Button>
          </div>
        </div>

        {/* Card view for both desktop and mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredCategories.map((category) => {
            const assignment = assignmentMap.get(category.id);
            return (
              <div
                key={category.id}
                className="rounded-2xl border border-border/60 bg-white p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-800">
                    {category.name}
                  </span>
                  {assignment && (
                    <span className="text-xs text-slate-400">
                      {assignment.lastUpdated}
                    </span>
                  )}
                </div>
                <Select
                  value={assignment?.jarId || ""}
                  onValueChange={(value) =>
                    value ? onAssign(category.id, value) : onUnassign(category.id)
                  }
                >
                  <SelectTrigger className="w-full rounded-xl">
                    <SelectValue placeholder={t("common.unmapped")} />
                  </SelectTrigger>
                  <SelectContent>
                    {jars.map((jar) => (
                      <SelectItem key={jar.id} value={jar.id}>
                        {jar.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
