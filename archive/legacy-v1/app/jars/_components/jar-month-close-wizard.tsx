"use client";

import { useState, useTransition } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useI18n } from "@/lib/providers/i18n-provider";
import { formatVndCompact } from "@/lib/dashboard/format";

import type {
  ClosePreview,
  JarBalancePreview,
  OverspendCoveragePreview,
  RolloverPreview,
} from "../action-types";
import { previewMonthCloseAction, approveMonthCloseAction } from "../domain-actions";



export function JarMonthCloseWizard({
  month,
}: {
  month: string;
}) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [previewData, setPreviewData] = useState<ClosePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userRollovers, setUserRollovers] = useState<Record<string, "carry_forward" | "sweep_out" | "none">>({});
  const [userCoverage, setUserCoverage] = useState<Record<string, string>>({});

  const handlePreview = async () => {
    setError(null);
    const formData = new FormData();
    formData.append("month", month);
    
    startTransition(async () => {
      try {
        const result = await previewMonthCloseAction(formData);
        if (result.status === "success") {
          const jarBalances = (result.jarBalances || []) as JarBalancePreview[];
          const rollovers = (result.rollovers || []) as RolloverPreview[];
          const coverage = (result.overspendCoverage || []) as OverspendCoveragePreview[];
          
          // Initialize user selections from preview suggestions
          const initialRollovers: Record<string, "carry_forward" | "sweep_out" | "none"> = {};
          const initialCoverage: Record<string, string> = {};
          
          // Set initial rollover selections
          rollovers.forEach((r) => {
            initialRollovers[r.jarId] = r.action;
          });
          
          // Set initial coverage selections
          coverage.forEach((c) => {
            initialCoverage[c.deficitJarId] = c.sourceJarId;
          });
          
          setPreviewData({
            month: result.month || month,
            closeRunId: result.closeRunId || "",
            jarBalances,
            overspendCoverage: coverage,
            rollovers,
            totalSurplus: result.totalSurplus || 0,
            totalDeficit: result.totalDeficit || 0,
          });
          setUserRollovers(initialRollovers);
          setUserCoverage(initialCoverage);
        } else {
          setError(result.message || "Failed to generate preview");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    });
  };

  const handleApprove = async () => {
    if (!previewData?.closeRunId) {
      setError("No close run found. Please generate preview first.");
      return;
    }
    setError(null);
    const formData = new FormData();
    formData.append("month", month);
    formData.append("closeRunId", previewData.closeRunId);
    formData.append("userRollovers", JSON.stringify(userRollovers));
    formData.append("userCoverage", JSON.stringify(userCoverage));
    
    startTransition(async () => {
      try {
        const result = await approveMonthCloseAction(formData);
        if (result.status === "success") {
          setIsOpen(false);
          window.location.reload();
        } else {
          setError(result.message || "Failed to approve month close");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    });
  };

  const totalSurplus = previewData?.jarBalances
    ?.filter((j) => j.closingBalanceBeforeRollover > 0)
    .reduce((sum, j) => sum + j.closingBalanceBeforeRollover, 0) ?? 0;

  const totalDeficit = previewData?.jarBalances
    ?.filter((j) => j.closingBalanceBeforeRollover < 0)
    .reduce((sum, j) => sum + Math.abs(j.closingBalanceBeforeRollover), 0) ?? 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-xl">
          {t("jars.month_close.title")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>{t("jars.month_close.title")}</DialogTitle>
          <DialogDescription>
            {t("jars.month_close.description", { month })}
          </DialogDescription>
        </DialogHeader>

        {!previewData ? (
          <div className="py-6 text-center">
            <p className="mb-4 text-sm text-slate-600">
              {t("jars.month_close.preview_prompt")}
            </p>
            <Button
              onClick={handlePreview}
              disabled={isPending}
              className="rounded-xl"
            >
              {isPending ? t("common.processing") : t("jars.month_close.generate_preview")}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-emerald-50 p-4 text-center">
                <p className="text-sm text-emerald-700">{t("jars.month_close.total_surplus")}</p>
                <p className="text-xl font-bold text-emerald-800">
                  {formatVndCompact(totalSurplus, "vi-VN")}
                </p>
              </div>
              <div className="rounded-xl bg-rose-50 p-4 text-center">
                <p className="text-sm text-rose-700">{t("jars.month_close.total_deficit")}</p>
                <p className="text-xl font-bold text-rose-800">
                  {formatVndCompact(totalDeficit, "vi-VN")}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border/60">
              <div className="max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-slate-50">
                    <TableRow>
                      <TableHead className="px-3 py-2 text-left font-medium text-slate-600">
                        {t("jars.field.jar")}
                      </TableHead>
                      <TableHead className="px-3 py-2 text-right font-medium text-slate-600">
                        {t("jars.month_close.allocated")}
                      </TableHead>
                      <TableHead className="px-3 py-2 text-right font-medium text-slate-600">
                        {t("jars.month_close.spent")}
                      </TableHead>
                      <TableHead className="px-3 py-2 text-right font-medium text-slate-600">
                        {t("jars.month_close.remaining")}
                      </TableHead>
                      <TableHead className="px-3 py-2 text-left font-medium text-slate-600">
                        {t("jars.month_close.action")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white">
                    {previewData.jarBalances?.map((jar) => {
                      const isPositive = jar.closingBalanceBeforeRollover > 0;
                      const isNegative = jar.closingBalanceBeforeRollover < 0;
                      const positiveJars = previewData.jarBalances.filter((j) => j.closingBalanceBeforeRollover > 0);
                      
                      return (
                        <TableRow key={jar.jarId} className="border-t border-border/60">
                          <TableCell className="px-3 py-2 font-medium">{jar.jarName}</TableCell>
                          <TableCell className="px-3 py-2 text-right text-slate-600">
                            {formatVndCompact(jar.allocatedAmount, "vi-VN")}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-right text-slate-600">
                            {formatVndCompact(jar.spentAmount, "vi-VN")}
                          </TableCell>
                          <TableCell
                            className={`px-3 py-2 text-right font-medium ${
                              jar.closingBalanceBeforeRollover >= 0 ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {formatVndCompact(jar.closingBalanceBeforeRollover, "vi-VN")}
                          </TableCell>
                          <TableCell className="px-3 py-2">
                            {isPositive && (
                              <Select
                                value={userRollovers[jar.jarId] || "carry_forward"}
                                onValueChange={(value: "carry_forward" | "sweep_out" | "none") =>
                                  setUserRollovers({ ...userRollovers, [jar.jarId]: value })
                                }
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="carry_forward">{t("jars.month_close.carry_forward")}</SelectItem>
                                  <SelectItem value="sweep_out">{t("jars.month_close.sweep_to")}</SelectItem>
                                  <SelectItem value="none">{t("common.none")}</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                            {isNegative && (
                              <Select
                                value={userCoverage[jar.jarId] || ""}
                                onValueChange={(value) =>
                                  setUserCoverage({ ...userCoverage, [jar.jarId]: value })
                                }
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder={t("jars.month_close.cover_from")} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">{t("jars.month_close.no_coverage")}</SelectItem>
                                  {positiveJars.map((pj) => (
                                    <SelectItem key={pj.jarId} value={pj.jarId}>
                                      {pj.jarName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            {!isPositive && !isNegative && (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
                {error}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} className="rounded-xl">
            {t("common.cancel")}
          </Button>
          {previewData && (
            <Button
              onClick={handleApprove}
              disabled={isPending}
              className="rounded-xl"
            >
              {isPending ? t("common.processing") : t("jars.month_close.approve")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
